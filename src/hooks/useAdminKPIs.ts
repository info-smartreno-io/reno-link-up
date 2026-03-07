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
      const [
        { count: newIntakes },
        { count: estimatesInProgress },
        { count: contractorsPending },
        { count: openRFPs },
        { count: bidsDueSoon },
        { count: activeProjects },
        { count: needingAttention },
      ] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "new_lead"),
        supabase.from("leads").select("*", { count: "exact", head: true }).in("status", ["estimate_in_progress", "walkthrough_scheduled"]),
        supabase.from("contractors").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("bid_opportunities").select("*", { count: "exact", head: true }).in("status", ["open", "draft"]),
        supabase.from("bid_opportunities").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("contractor_projects").select("*", { count: "exact", head: true }).in("status", ["active", "awarded", "in_progress"]),
        supabase.from("contractor_projects").select("*", { count: "exact", head: true }).eq("status", "delayed"),
      ]);

      return {
        newIntakes: newIntakes ?? 0,
        estimatesInProgress: estimatesInProgress ?? 0,
        contractorsPending: contractorsPending ?? 0,
        openRFPs: openRFPs ?? 0,
        bidsDueSoon: bidsDueSoon ?? 0,
        activeProjects: activeProjects ?? 0,
        needingAttention: needingAttention ?? 0,
        unreadMessages: 0,
      };
    },
    refetchInterval: 30000,
  });
}
