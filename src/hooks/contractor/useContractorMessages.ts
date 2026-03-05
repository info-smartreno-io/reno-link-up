import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoRecentMessages } from "@/utils/demoContractorData";

export interface RecentMessage {
  id: string;
  sender: string;
  preview: string;
  time: string;
  projectId?: string;
}

async function fetchRecentMessages(userId: string): Promise<RecentMessage[]> {
  const { data: messages } = await supabase
    .from('contractor_messages')
    .select('id, sender_name, message, created_at, project_id')
    .eq('contractor_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  return messages?.map(msg => {
    const timeDiff = Date.now() - new Date(msg.created_at).getTime();
    const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
    
    return {
      id: msg.id,
      sender: msg.sender_name,
      preview: msg.message.substring(0, 30) + '...',
      time: hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`,
      projectId: msg.project_id || undefined,
    };
  }) || [];
}

export function useContractorMessages() {
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ["contractor-recent-messages", isDemoMode],
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        return getDemoRecentMessages();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fetchRecentMessages(user.id);
    },
  });
}
