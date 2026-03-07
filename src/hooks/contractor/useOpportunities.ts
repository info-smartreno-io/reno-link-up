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
      const { data: contractor } = await supabase
        .from("contractors")
        .select("id, is_active, trades, service_areas")
        .eq("user_id", user.id)
        .maybeSingle();

      // Only approved contractors see opportunities
      if (!contractor?.is_active) return [] as Opportunity[];

      // Fetch open opportunities for contractors
      let query = supabase
        .from("bid_opportunities")
        .select("*")
        .eq("status", "open")
        .eq("open_to_contractors", true)
        .gte("bid_deadline", new Date().toISOString())
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter out opportunities the contractor already bid on
      const { data: existingBids } = await supabase
        .from("bid_submissions")
        .select("bid_opportunity_id")
        .eq("bidder_id", user.id)
        .in("status", ["submitted", "shortlisted", "accepted"]);

      const biddedIds = new Set(existingBids?.map(b => b.bid_opportunity_id) || []);

      let filtered = (data || []).filter(opp => !biddedIds.has(opp.id));

      // Filter by trade match if contractor has trades specified
      if (contractor.trades && Array.isArray(contractor.trades) && contractor.trades.length > 0) {
        const contractorTrades = contractor.trades.map((t: string) => t.toLowerCase());
        filtered = filtered.filter(opp => {
          const oppType = opp.project_type?.toLowerCase() || "";
          return contractorTrades.some((t: string) => oppType.includes(t) || t.includes(oppType)) || true;
          // Fallback: show all if no exact match (trade matching is advisory)
        });
      }

      return filtered as Opportunity[];
    },
  });
}
