import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProjectActivityLog(projectId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ["project-activity-log", projectId, limit],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_activity_log")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useRecentActivityForUser(limit = 10) {
  return useQuery({
    queryKey: ["user-recent-activity", limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get project IDs the user is linked to
      const { data: links } = await supabase
        .from("homeowner_projects")
        .select("project_id")
        .eq("homeowner_id", user.id);

      if (!links?.length) return [];

      const projectIds = links.map(l => l.project_id).filter(Boolean) as string[];

      const { data, error } = await supabase
        .from("project_activity_log")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
}
