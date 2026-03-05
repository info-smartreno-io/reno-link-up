import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoTodaySchedule } from "@/utils/demoContractorData";

export interface ScheduleEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  projectId?: string;
}

async function fetchTodaySchedule(userId: string): Promise<ScheduleEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: projects } = await supabase
    .from('contractor_projects')
    .select('id, project_name, location, deadline')
    .eq('contractor_id', userId)
    .eq('status', 'in_progress')
    .not('deadline', 'is', null)
    .gte('deadline', today)
    .order('deadline', { ascending: true })
    .limit(5);

  return projects?.map(project => ({
    id: project.id,
    time: project.deadline ? new Date(project.deadline).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : 'TBD',
    title: project.project_name,
    location: project.location || 'Location TBD',
    projectId: project.id,
  })) || [];
}

export function useContractorSchedule() {
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ["contractor-today-schedule", isDemoMode],
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        return getDemoTodaySchedule();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchTodaySchedule(user.id);
    },
  });
}
