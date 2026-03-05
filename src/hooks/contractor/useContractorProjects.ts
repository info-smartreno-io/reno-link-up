import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoActiveProjects } from "@/utils/demoContractorData";

export interface ContractorProject {
  id: string;
  title: string;
  location: string;
  value: string;
  dueDate: string;
  status: string;
}

async function fetchActiveProjects(userId: string): Promise<ContractorProject[]> {
  const { data: projects } = await supabase
    .from('contractor_projects')
    .select('id, project_name, location, estimated_value, deadline, status')
    .eq('contractor_id', userId)
    .in('status', ['planning', 'in_progress', 'pending'])
    .order('created_at', { ascending: false })
    .limit(10);

  return projects?.map(project => {
    const daysUntil = project.deadline 
      ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: project.id,
      title: project.project_name,
      location: project.location,
      value: project.estimated_value ? `$${(project.estimated_value / 1000).toFixed(0)}k est.` : 'TBD',
      dueDate: daysUntil ? `Due in ${daysUntil} days` : 'No deadline',
      status: project.status,
    };
  }) || [];
}

export function useContractorProjects() {
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ["contractor-active-projects", isDemoMode],
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        return getDemoActiveProjects();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchActiveProjects(user.id);
    },
  });
}
