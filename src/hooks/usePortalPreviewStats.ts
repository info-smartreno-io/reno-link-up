import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PortalStats {
  salesPipeline: {
    activeLeads: number;
    totalValue: number;
  };
  collections: {
    pendingAmount: number;
    dueThisWeek: number;
  };
  projects: {
    activeProjects: number;
    startingSoon: number;
  };
  team: {
    totalMembers: number;
    activeToday: number;
  };
  files: {
    totalFiles: number;
    recentUploads: number;
  };
  messages: {
    unreadCount: number;
    urgentCount: number;
  };
}

async function fetchPortalStats(userId: string): Promise<PortalStats> {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch all stats in parallel
  const [
    leadsResult,
    collectionsResult,
    projectsResult,
    teamResult,
    messagesResult
  ] = await Promise.all([
    // Sales Pipeline - leads count (estimated_budget is string, not number)
    supabase
      .from('leads')
      .select('id, estimated_budget')
      .in('status', ['new', 'contacted', 'qualified', 'proposal_sent']),
    
    // Collections - pending payments
    supabase
      .from('payment_schedules')
      .select('amount, due_date, status')
      .neq('status', 'paid'),
    
    // Projects - active projects (use deadline, not start_date)
    supabase
      .from('contractor_projects')
      .select('id, status, deadline, estimated_value')
      .eq('contractor_id', userId),
    
    // Team members
    supabase
      .from('profiles')
      .select('id, updated_at'),
    
    // Messages - recent count
    supabase
      .from('chat_messages')
      .select('id, created_at')
      .gte('created_at', weekAgo.toISOString())
  ]);

  // Calculate sales pipeline stats
  const activeLeads = leadsResult.data?.length || 0;
  // Parse estimated_budget strings to numbers (e.g. "$50,000" -> 50000)
  const totalValue = leadsResult.data?.reduce((sum, lead) => {
    if (!lead.estimated_budget) return sum;
    const numericValue = parseFloat(lead.estimated_budget.replace(/[^0-9.-]+/g, ''));
    return sum + (isNaN(numericValue) ? 0 : numericValue);
  }, 0) || 0;

  // Calculate collections stats
  const pendingPayments = collectionsResult.data || [];
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const dueThisWeek = pendingPayments.filter(p => {
    if (!p.due_date) return false;
    const dueDate = new Date(p.due_date);
    return dueDate <= weekFromNow && dueDate >= now;
  }).length;

  // Calculate project stats (use deadline instead of start_date)
  const projects = projectsResult.data || [];
  const activeProjects = projects.filter(p => 
    ['in_progress', 'active', 'planning'].includes(p.status || '')
  ).length;
  const startingSoon = projects.filter(p => {
    if (!p.deadline) return false;
    const deadlineDate = new Date(p.deadline);
    return deadlineDate <= weekFromNow && deadlineDate >= now;
  }).length;

  // Team stats
  const totalMembers = teamResult.data?.length || 0;
  const activeToday = teamResult.data?.filter(m => {
    if (!m.updated_at) return false;
    const updated = new Date(m.updated_at);
    return updated.toDateString() === now.toDateString();
  }).length || 0;

  // Messages stats
  const recentMessages = messagesResult.data?.length || 0;

  return {
    salesPipeline: {
      activeLeads,
      totalValue
    },
    collections: {
      pendingAmount,
      dueThisWeek
    },
    projects: {
      activeProjects,
      startingSoon
    },
    team: {
      totalMembers,
      activeToday
    },
    files: {
      totalFiles: 0,
      recentUploads: 0
    },
    messages: {
      unreadCount: recentMessages,
      urgentCount: 0
    }
  };
}

export function usePortalPreviewStats() {
  return useQuery({
    queryKey: ["portal-preview-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchPortalStats(user.id);
    },
    staleTime: 30000,
  });
}
