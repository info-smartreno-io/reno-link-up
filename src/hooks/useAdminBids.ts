import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAdminBids(opportunityId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-bids", opportunityId],
    queryFn: async () => {
      let q = supabase
        .from("bid_submissions")
        .select("*, bid_opportunities(title, location, project_type), bid_line_items(*)")
        .order("submitted_at", { ascending: false })
        .limit(200);

      if (opportunityId) {
        q = q.eq("bid_opportunity_id", opportunityId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("bid_submissions").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bids"] });
      queryClient.invalidateQueries({ queryKey: ["admin-kpis"] });
      toast.success("Bid status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { ...query, updateStatus };
}
