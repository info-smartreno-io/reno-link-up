import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ["unread-message-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Count messages where user hasn't read them
      // read_by is a JSON array of user IDs who have read the message
      const { data, error } = await supabase
        .from("project_messages")
        .select("id, read_by, sender_id")
        .neq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) return 0;
      
      // Count messages where current user is NOT in read_by array
      const unread = (data || []).filter(msg => {
        const readBy = Array.isArray(msg.read_by) ? msg.read_by : [];
        return !readBy.includes(user.id);
      });

      return unread.length;
    },
    refetchInterval: 30000,
  });
}
