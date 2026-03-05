import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoStats } from "@/utils/demoContractorData";

export interface ContractorStats {
  newProjects: number;
  revenue: number;
  requestsForProposals: number;
  successfulBids: number;
}

async function fetchContractorStats(userId: string): Promise<ContractorStats> {
  // Fetch projects count - include planning, pending, new statuses as "new projects"
  const { count: newProjectsCount } = await supabase
    .from('contractor_projects')
    .select('*', { count: 'exact', head: true })
    .eq('contractor_id', userId)
    .in('status', ['new', 'planning', 'pending']);

  // Fetch successful bids
  const { data: successfulBids } = await supabase
    .from('contractor_bids')
    .select('bid_amount')
    .eq('contractor_id', userId)
    .eq('status', 'accepted');

  const revenue = successfulBids?.reduce((sum, bid) => sum + Number(bid.bid_amount), 0) || 0;

  // Fetch open RFPs - open to contractors
  const { count: rfpCount } = await supabase
    .from('bid_opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
    .eq('open_to_contractors', true);

  return {
    newProjects: newProjectsCount || 0,
    revenue,
    requestsForProposals: rfpCount || 0,
    successfulBids: successfulBids?.length || 0,
  };
}

export function useContractorStats() {
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ["contractor-dashboard-stats", isDemoMode],
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        const demoStats = getDemoStats();
        return {
          newProjects: demoStats.newProjects,
          revenue: demoStats.revenue,
          requestsForProposals: demoStats.requestsForProposals,
          successfulBids: demoStats.successfulBids,
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchContractorStats(user.id);
    },
  });
}
