import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContractorBidSubmission {
  id: string;
  bid_opportunity_id: string;
  bid_amount: number;
  estimated_timeline: string | null;
  proposal_text: string | null;
  status: string;
  submitted_at: string;
  attachments: any;
  bid_opportunities: {
    id: string;
    title: string;
    description: string | null;
    project_type: string;
    location: string;
    estimated_budget: number | null;
    bid_deadline: string;
  };
}

export function useContractorBids(statusFilter?: string) {
  return useQuery({
    queryKey: ["contractor-bids", statusFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("bid_submissions")
        .select(`
          *,
          bid_opportunities (
            id, title, description, project_type, location, estimated_budget, bid_deadline
          )
        `)
        .eq("bidder_id", user.id)
        .eq("bidder_type", "contractor")
        .order("submitted_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContractorBidSubmission[];
    },
  });
}
