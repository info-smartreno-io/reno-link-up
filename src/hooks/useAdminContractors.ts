import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAdminContractors(statusFilter?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-contractors", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("contractors")
        .select("*, contractor_profiles(*)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (statusFilter && statusFilter !== "all") {
        q = q.eq("status", statusFilter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contractors").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contractors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-kpis"] });
      toast.success("Contractor status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { ...query, updateStatus };
}
