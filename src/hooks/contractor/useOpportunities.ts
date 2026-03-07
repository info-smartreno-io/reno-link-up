import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  project_type: string;
  location: string;
  estimated_budget: number | null;
  square_footage: number | null;
  deadline: string | null;
  bid_deadline: string;
  requirements: any;
  attachments: any;
  created_at: string;
  status: string;
}

export function useOpportunities() {
  return useQuery({
    queryKey: ["contractor-opportunities"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check contractor approval status
      const { data: contractor } = await (supabase
        .from("contractors" as any)
        .select("id, is_active, trade_focus, service_areas")
        .eq("user_id", user.id)
        .maybeSingle() as any);

      // Only approved contractors see opportunities
      if (contractor && !contractor.is_active) return [] as Opportunity[];

      // Fetch open opportunities for contractors
      const { data, error } = await supabase
        .from("bid_opportunities")
        .select("*")
        .eq("status", "open")
        .eq("open_to_contractors", true)
        .gte("bid_deadline", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out opportunities the contractor already bid on
      const { data: existingBids } = await supabase
        .from("bid_submissions")
        .select("bid_opportunity_id")
        .eq("bidder_id", user.id)
        .in("status", ["submitted", "shortlisted", "accepted"]);

      const biddedIds = new Set(existingBids?.map(b => b.bid_opportunity_id) || []);

      return ((data || []) as Opportunity[]).filter(opp => !biddedIds.has(opp.id));
    },
  });
}
