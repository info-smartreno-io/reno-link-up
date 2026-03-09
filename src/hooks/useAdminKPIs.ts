import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminKPIs {
  // Project pipeline
  newIntakes: number;
  walkthroughsScheduled: number;
  scopesCompleted: number;
  bidPacketsSent: number;
  bidsReceived: number;
  projectsAwarded: number;
  projectsCompleted: number;
  activeProjects: number;
  needingAttention: number;
  unreadMessages: number;
  // Legacy keys for compatibility
  estimatesInProgress: number;
  contractorsPending: number;
  openRFPs: number;
  bidsDueSoon: number;
  // Contractor metrics
  totalContractors: number;
  // Cost codes
  totalCostCodes: number;
}

export function useAdminKPIs() {
  return useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async (): Promise<AdminKPIs> => {
      const { data: { user } } = await supabase.auth.getUser();

      const results = await Promise.all([
        // 0: new intakes
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new_lead"),
        // 1: walkthroughs scheduled
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "walkthrough_scheduled"),
        // 2: scopes completed (estimate_in_progress + scope_review)
        supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["estimate_in_progress", "scope_review"]),
        // 3: bid packets sent (estimate_sent)
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "estimate_sent"),
        // 4: bids received
        supabase.from("bid_submissions").select("id", { count: "exact", head: true }).eq("status", "submitted"),
        // 5: projects awarded (contractor_selected)
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "contractor_selected"),
        // 6: projects completed
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "completed"),
        // 7: active projects
        supabase.from("contractor_projects").select("id", { count: "exact", head: true }).in("status", ["active", "awarded", "in_progress"]),
        // 8: needing attention
        supabase.from("contractor_projects").select("id", { count: "exact", head: true }).eq("status", "delayed"),
        // 9: unread messages
        user
          ? supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false)
          : Promise.resolve({ count: 0 }),
        // 10: contractors pending
        supabase.from("contractors").select("id", { count: "exact", head: true }).eq("is_active", false),
        // 11: open RFPs
        supabase.from("bid_opportunities").select("id", { count: "exact", head: true }).eq("status", "open"),
        // 12: total contractors
        supabase.from("contractors").select("id", { count: "exact", head: true }),
        // 13: total platform cost codes
        supabase.from("platform_cost_codes").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

      return {
        newIntakes: results[0].count ?? 0,
        walkthroughsScheduled: results[1].count ?? 0,
        scopesCompleted: results[2].count ?? 0,
        bidPacketsSent: results[3].count ?? 0,
        bidsReceived: results[4].count ?? 0,
        projectsAwarded: results[5].count ?? 0,
        projectsCompleted: results[6].count ?? 0,
        activeProjects: results[7].count ?? 0,
        needingAttention: results[8].count ?? 0,
        unreadMessages: results[9].count ?? 0,
        contractorsPending: results[10].count ?? 0,
        openRFPs: results[11].count ?? 0,
        totalContractors: results[12].count ?? 0,
        totalCostCodes: results[13].count ?? 0,
        // Legacy
        estimatesInProgress: results[2].count ?? 0,
        bidsDueSoon: results[4].count ?? 0,
      };
    },
    refetchInterval: 30000,
  });
}
