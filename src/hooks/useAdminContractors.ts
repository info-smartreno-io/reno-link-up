import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAdminContractors(activeFilter?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-contractors", activeFilter],
    queryFn: async () => {
      let q = supabase
        .from("contractors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (activeFilter === "active") {
        q = q.eq("is_active", true);
      } else if (activeFilter === "inactive") {
        q = q.eq("is_active", false);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("contractors").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contractors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-kpis"] });
      toast.success("Contractor updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { ...query, updateActive };
}
