import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminLiveProjects() {
  return useQuery({
    queryKey: ["admin-live-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractor_projects")
        .select("*")
        .in("status", ["active", "awarded", "in_progress", "pre_construction"])
        .order("updated_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });
}
