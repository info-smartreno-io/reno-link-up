import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContractorId } from "@/hooks/contractor/useContractorOnboarding";

export interface MatchScore {
  id: string;
  contractor_id: string;
  bid_opportunity_id: string;
  match_score: number;
  trade_score: number;
  location_score: number;
  budget_score: number;
  type_score: number;
  capacity_score: number;
  calculated_at: string;
}

export function useSmartMatchScores() {
  const { data: contractorId } = useContractorId();

  return useQuery({
    queryKey: ["smart-match-scores", contractorId],
    queryFn: async () => {
      if (!contractorId) return [];
      const { data, error } = await supabase
        .from("contractor_opportunity_matches")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("match_score", { ascending: false });
      if (error) throw error;
      return (data || []) as MatchScore[];
    },
    enabled: !!contractorId,
  });
}

export function useCalculateSmartMatch() {
  const { data: contractorId } = useContractorId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bidOpportunityId?: string) => {
      if (!contractorId) throw new Error("No contractor ID");
      const { data, error } = await supabase.functions.invoke("smart-match", {
        body: {
          contractor_id: contractorId,
          ...(bidOpportunityId ? { bid_opportunity_id: bidOpportunityId } : {}),
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-match-scores"] });
    },
  });
}

export function useMatchScoreForOpportunity(bidOpportunityId: string) {
  const { data: scores } = useSmartMatchScores();
  return scores?.find((s) => s.bid_opportunity_id === bidOpportunityId);
}

export function getMatchLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Great Fit", color: "text-green-600" };
  if (score >= 60) return { label: "Good Fit", color: "text-yellow-600" };
  if (score >= 40) return { label: "Fair Fit", color: "text-orange-500" };
  return { label: "Low Fit", color: "text-muted-foreground" };
}
