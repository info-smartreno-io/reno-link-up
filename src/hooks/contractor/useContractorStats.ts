import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoStats } from "@/utils/demoContractorData";

export interface ContractorStats {
  newProjects: number;
  revenue: number;
  requestsForProposals: number;
  successfulBids: number;
  unreadMessages: number;
  unreadNotifications: number;
  activeProjects: number;
  pendingBids: number;
}

async function fetchContractorStats(userId: string): Promise<ContractorStats> {
  const results = await Promise.all([
    // New/planning projects
    supabase.from('contractor_projects').select('*', { count: 'exact', head: true })
      .eq('contractor_id', userId).in('status', ['new', 'planning', 'pending']),
    // Revenue from accepted bids
    supabase.from('bid_submissions').select('bid_amount')
      .eq('bidder_id', userId).eq('status', 'accepted'),
    // Open RFPs
    supabase.from('bid_opportunities').select('*', { count: 'exact', head: true })
      .eq('status', 'open').eq('open_to_contractors', true),
    // Unread notifications
    supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('read', false),
    // Active projects
    supabase.from('contractor_projects').select('*', { count: 'exact', head: true })
      .eq('contractor_id', userId).in('status', ['in_progress', 'active']),
    // Pending bids (submitted, not yet decided)
    supabase.from('bid_submissions').select('*', { count: 'exact', head: true })
      .eq('bidder_id', userId).in('status', ['submitted', 'under_review']),
    // Unread messages
    supabase.from('project_messages').select('id, read_by, sender_id')
      .neq('sender_id', userId).limit(200),
  ]);

  const revenue = results[1].data?.reduce((sum, bid) => sum + Number(bid.bid_amount), 0) || 0;
  
  // Count unread messages
  const msgs = results[6].data || [];
  const unreadMessages = msgs.filter(msg => {
    const readBy = Array.isArray(msg.read_by) ? msg.read_by : [];
    return !readBy.includes(userId);
  }).length;

  return {
    newProjects: results[0].count || 0,
    revenue,
    requestsForProposals: results[2].count || 0,
    successfulBids: results[1].data?.length || 0,
    unreadNotifications: results[3].count || 0,
    activeProjects: results[4].count || 0,
    pendingBids: results[5].count || 0,
    unreadMessages,
  };
}

export function useContractorStats() {
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ["contractor-dashboard-stats", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        const demoStats = getDemoStats();
        return {
          newProjects: demoStats.newProjects,
          revenue: demoStats.revenue,
          requestsForProposals: demoStats.requestsForProposals,
          successfulBids: demoStats.successfulBids,
          unreadMessages: 0,
          unreadNotifications: 0,
          activeProjects: 0,
          pendingBids: 0,
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchContractorStats(user.id);
    },
    refetchInterval: 30000,
  });
}
