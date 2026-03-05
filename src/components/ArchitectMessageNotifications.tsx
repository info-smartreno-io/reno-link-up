import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { MessageSquare } from "lucide-react";

export function ArchitectMessageNotifications() {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages for architect's projects
    const channel = supabase
      .channel('architect-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `sender_id=neq.${user.id}`, // Only notify for messages from others
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          // Check if this message is for one of the architect's projects
          const { data: project } = await supabase
            .from('architect_projects')
            .select('id, project_name, client_name')
            .eq('architect_id', user.id)
            .eq('id', payload.new.project_id)
            .single();

          if (project) {
            // Fetch sender name
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', payload.new.sender_id)
              .single();

            const senderName = profile?.full_name || 'Someone';

            toast({
              title: (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>New message from {project.client_name}</span>
                </div>
              ) as any,
              description: (
                <div className="space-y-1">
                  <p className="font-medium">{project.project_name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {payload.new.message}
                  </p>
                </div>
              ) as any,
              duration: 5000,
            });

            // Play notification sound (optional)
            try {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {
                // Ignore if audio fails to play (e.g., no user interaction yet)
              });
            } catch (error) {
              // Ignore audio errors
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return null; // This component doesn't render anything
}
