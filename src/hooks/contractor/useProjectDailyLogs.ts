import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProjectDailyLogs(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["project-daily-logs", projectId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("log_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const addLog = useMutation({
    mutationFn: async (log: { log_date: string; log_type?: string; notes?: string; weather_conditions?: string; workers_on_site?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("daily_logs").insert({
        ...log,
        project_id: projectId!,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Daily log added"); },
    onError: () => toast.error("Failed to add log"),
  });

  return { ...query, addLog };
}
