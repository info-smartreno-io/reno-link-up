import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminKPIs {
  newIntakes: number;
  estimatesInProgress: number;
  contractorsPending: number;
  openRFPs: number;
  bidsDueSoon: number;
  activeProjects: number;
  needingAttention: number;
  unreadMessages: number;
}

export function useAdminKPIs() {
  return useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async (): Promise<AdminKPIs> => {
      const results = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new_lead"),
        supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["estimate_in_progress", "walkthrough_scheduled"]),
        supabase.from("contractors").select("id", { count: "exact", head: true }).eq("is_active", false),
        supabase.from("bid_opportunities").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("bid_submissions").select("id", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("contractor_projects").select("id", { count: "exact", head: true }).in("status", ["active", "awarded", "in_progress"]),
        supabase.from("contractor_projects").select("id", { count: "exact", head: true }).eq("status", "delayed"),
      ]);

      return {
        newIntakes: results[0].count ?? 0,
        estimatesInProgress: results[1].count ?? 0,
        contractorsPending: results[2].count ?? 0,
        openRFPs: results[3].count ?? 0,
        bidsDueSoon: results[4].count ?? 0,
        activeProjects: results[5].count ?? 0,
        needingAttention: results[6].count ?? 0,
        unreadMessages: 0,
      };
    },
    refetchInterval: 30000,
  });
}
