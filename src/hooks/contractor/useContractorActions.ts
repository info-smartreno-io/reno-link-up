import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoActionItems } from "@/utils/demoContractorData";

export interface ActionItem {
  id: string;
  type: "bid" | "review" | "message" | "invoice";
  title: string;
  subtitle: string;
  priority: "high" | "medium" | "low";
  buttonText: string;
  relatedId?: string;
}

async function fetchActionItems(userId: string): Promise<ActionItem[]> {
  const actions: ActionItem[] = [];

  // Get open bid opportunities
  const { data: openBids } = await supabase
    .from('bid_opportunities')
    .select('id, title, location, bid_deadline')
    .eq('status', 'open')
    .is('open_to_contractors', true)
    .order('bid_deadline', { ascending: true })
    .limit(3);

  openBids?.forEach(bid => {
    const daysUntil = Math.ceil((new Date(bid.bid_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    actions.push({
      id: bid.id,
      type: "bid",
      title: `Submit your bid for ${bid.title}`,
      subtitle: bid.location,
      priority: daysUntil <= 2 ? "high" : "medium",
      buttonText: "Submit proposal",
      relatedId: bid.id,
    });
  });

  // Get pending reviews (bids under review)
  const { data: pendingBids } = await supabase
    .from('bid_submissions')
    .select('id, bid_opportunity_id, bid_opportunities(title, project_type)')
    .eq('bidder_id', userId)
    .eq('status', 'pending')
    .limit(2);

  pendingBids?.forEach(bid => {
    const opportunity = bid.bid_opportunities as any;
    actions.push({
      id: bid.id,
      type: "review",
      title: `Review estimator notes for ${opportunity?.title || 'Project'}`,
      subtitle: opportunity?.project_type || '',
      priority: "medium",
      buttonText: "View Estimate",
      relatedId: bid.id,
    });
  });

  // Get unread messages
  const { data: unreadMessages } = await supabase
    .from('contractor_messages')
    .select('id, sender_name, message, project_id')
    .eq('contractor_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(2);

  unreadMessages?.forEach(msg => {
    actions.push({
      id: msg.id,
      type: "message",
      title: `${msg.sender_name} sent a message`,
      subtitle: msg.message.substring(0, 50) + '...',
      priority: "medium",
      buttonText: "View Message",
      relatedId: msg.project_id || undefined,
    });
  });

  return actions;
}

export function useContractorActions() {
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ["contractor-action-items", isDemoMode],
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        return getDemoActionItems();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchActionItems(user.id);
    },
  });
}
