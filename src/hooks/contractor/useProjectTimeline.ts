import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProjectTimeline(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["project-timeline", projectId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("timeline_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const addTask = useMutation({
    mutationFn: async (task: { phase_name: string; start_date?: string; duration_days?: number; assigned_trade?: string; sort_order?: number }) => {
      const { error } = await supabase
        .from("timeline_tasks")
        .insert({ ...task, project_id: projectId! });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Phase added"); },
    onError: () => toast.error("Failed to add phase"),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; phase_name?: string; start_date?: string | null; duration_days?: number; status?: string; assigned_trade?: string }) => {
      const { error } = await supabase.from("timeline_tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("Failed to update"),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("timeline_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Phase removed"); },
  });

  return { ...query, addTask, updateTask, deleteTask };
}
