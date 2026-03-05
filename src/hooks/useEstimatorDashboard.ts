import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_STATUS, ESTIMATE_STATUS, WALKTHROUGH_STATUS } from "@/constants/workflows";

export interface DashboardStats {
  activeLeads: number;
  pendingEstimates: number;
  approvedEstimates: number;
  upcomingWalkthroughs: number;
}

export interface ActionItem {
  id: string;
  type: "estimate" | "review" | "upload" | "scope";
  title: string;
  leadId?: string;
  estimateId?: string;
  walkthroughId?: string;
  projectName: string;
  priority: "high" | "medium" | "low";
  dueDate?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  address: string;
  leadId: string;
  status: string;
  date: string;
}

export interface ActivityItem {
  id: string;
  type: "estimate" | "walkthrough" | "lead";
  status: string;
  timestamp: string;
  referenceId: string;
}

async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  // Fetch leads count
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', [LEAD_STATUS.NEW, LEAD_STATUS.CONTACTED, LEAD_STATUS.QUALIFIED]);

  // Fetch pending estimates
  const { count: pendingCount } = await supabase
    .from('estimates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', ESTIMATE_STATUS.PENDING);

  // Fetch approved estimates
  const { count: approvedCount } = await supabase
    .from('estimates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', ESTIMATE_STATUS.APPROVED);

  // Fetch upcoming walkthroughs
  const { count: walkthroughsCount } = await supabase
    .from('walkthroughs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('date', new Date().toISOString().split('T')[0])
    .eq('status', WALKTHROUGH_STATUS.SCHEDULED);

  return {
    activeLeads: leadsCount || 0,
    pendingEstimates: pendingCount || 0,
    approvedEstimates: approvedCount || 0,
    upcomingWalkthroughs: walkthroughsCount || 0,
  };
}

async function fetchActionItems(userId: string): Promise<ActionItem[]> {
  const actions: ActionItem[] = [];

  // Get leads needing estimates
  const { data: leadsNeedingEstimates } = await supabase
    .from('leads')
    .select('id, name, project_type')
    .eq('user_id', userId)
    .in('status', [LEAD_STATUS.QUALIFIED])
    .is('estimate_id', null)
    .limit(5);

  leadsNeedingEstimates?.forEach(lead => {
    actions.push({
      id: `estimate-${lead.id}`,
      type: "estimate",
      title: `Prepare estimate for ${lead.name}`,
      leadId: lead.id,
      projectName: lead.name,
      priority: "high",
    });
  });

  // Get walkthroughs needing photos
  const { data: walkthroughsNeedingPhotos } = await supabase
    .from('walkthroughs')
    .select('id, project_name, lead_id')
    .eq('user_id', userId)
    .eq('status', WALKTHROUGH_STATUS.COMPLETED)
    .eq('photos_uploaded', false)
    .limit(5);

  walkthroughsNeedingPhotos?.forEach(walkthrough => {
    actions.push({
      id: `upload-${walkthrough.id}`,
      type: "upload",
      title: `Upload photos for ${walkthrough.project_name} walkthrough`,
      walkthroughId: walkthrough.id,
      leadId: walkthrough.lead_id,
      projectName: walkthrough.project_name,
      priority: "medium",
    });
  });

  // Get leads needing scope generation
  const { data: leadsNeedingScope } = await supabase
    .from('leads')
    .select('id, name, project_type')
    .eq('user_id', userId)
    .in('status', [LEAD_STATUS.QUALIFIED])
    .is('scope_generated', null)
    .limit(3);

  leadsNeedingScope?.forEach(lead => {
    actions.push({
      id: `scope-${lead.id}`,
      type: "scope",
      title: `Generate scope for ${lead.name}`,
      leadId: lead.id,
      projectName: lead.name,
      priority: "medium",
    });
  });

  return actions;
}

async function fetchSchedule(userId: string): Promise<ScheduleItem[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: walkthroughs } = await supabase
    .from('walkthroughs')
    .select('id, date, time, project_name, address, status, lead_id')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('status', WALKTHROUGH_STATUS.SCHEDULED)
    .order('time', { ascending: true })
    .limit(5);

  return walkthroughs?.map(w => ({
    id: w.id,
    time: w.time || "TBD",
    title: `Walkthrough for ${w.project_name}`,
    address: w.address || "Address TBD",
    leadId: w.lead_id,
    status: w.status,
    date: w.date,
  })) || [];
}

async function fetchRecentActivity(userId: string): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];

  // Get recent estimate approvals
  const { data: recentEstimates } = await supabase
    .from('estimates')
    .select('id, status, updated_at, estimate_number')
    .eq('user_id', userId)
    .in('status', [ESTIMATE_STATUS.APPROVED, ESTIMATE_STATUS.REJECTED])
    .order('updated_at', { ascending: false })
    .limit(3);

  recentEstimates?.forEach(estimate => {
    activities.push({
      id: estimate.id,
      type: "estimate",
      status: `Estimate #${estimate.estimate_number} ${estimate.status}`,
      timestamp: estimate.updated_at,
      referenceId: estimate.id,
    });
  });

  // Get recent completed walkthroughs
  const { data: recentWalkthroughs } = await supabase
    .from('walkthroughs')
    .select('id, status, updated_at, project_name')
    .eq('user_id', userId)
    .eq('status', WALKTHROUGH_STATUS.COMPLETED)
    .order('updated_at', { ascending: false })
    .limit(3);

  recentWalkthroughs?.forEach(walkthrough => {
    activities.push({
      id: walkthrough.id,
      type: "walkthrough",
      status: `Walkthrough for ${walkthrough.project_name} completed`,
      timestamp: walkthrough.updated_at,
      referenceId: walkthrough.id,
    });
  });

  // Sort by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return activities.slice(0, 5);
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["estimator-dashboard-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchDashboardStats(user.id);
    },
  });
}

export function useActionItems() {
  return useQuery({
    queryKey: ["estimator-action-items"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchActionItems(user.id);
    },
  });
}

export function useSchedule() {
  return useQuery({
    queryKey: ["estimator-schedule"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchSchedule(user.id);
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["estimator-recent-activity"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchRecentActivity(user.id);
    },
  });
}
