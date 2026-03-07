import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProjectSubcontractorBids(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["project-sub-bids", projectId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await (supabase
        .from("subcontractor_bids" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!projectId,
  });

  const addBid = useMutation({
    mutationFn: async (bid: { trade: string; company_name: string; contact_name: string; phone?: string; email?: string; bid_amount?: number; duration?: string; notes?: string }) => {
      const { error } = await (supabase
        .from("subcontractor_bids" as any)
        .insert({ ...bid, project_id: projectId! }) as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Subcontractor bid added"); },
    onError: () => toast.error("Failed to add bid"),
  });

  const updateBid = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; bid_amount?: number; notes?: string }) => {
      const { error } = await (supabase.from("subcontractor_bids" as any).update(updates).eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Bid updated"); },
    onError: () => toast.error("Failed to update bid"),
  });

  return { ...query, addBid, updateBid };
}
