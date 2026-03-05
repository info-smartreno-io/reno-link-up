import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import ProjectMessaging from "@/components/ProjectMessaging";
import { ArchitectMessageNotifications } from "@/components/ArchitectMessageNotifications";

interface ProjectConversation {
  id: string;
  project_name: string;
  client_name: string;
  unread_count: number;
  last_message_at: string | null;
}

export default function ArchitectMessages() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ProjectConversation[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectConversation | null>(null);
  const [quickReplyText, setQuickReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/architect/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/architect/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      try {
        // Fetch all projects for this architect
        const { data: projects, error } = await supabase
          .from('architect_projects')
          .select('id, project_name, client_name')
          .eq('architect_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // For each project, get the last message timestamp
        const conversationsWithMessages = await Promise.all(
          (projects || []).map(async (project) => {
            const { data: messages } = await supabase
              .from('project_messages')
              .select('created_at, sender_id')
              .eq('project_id', project.id)
              .order('created_at', { ascending: false })
              .limit(1);

            const { count: unreadCount } = await supabase
              .from('project_messages')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id)
              .neq('sender_id', user.id)
              .is('read_at', null);

            return {
              ...project,
              last_message_at: messages?.[0]?.created_at || null,
              unread_count: unreadCount || 0,
            };
          })
        );

        // Sort by last message timestamp
        conversationsWithMessages.sort((a, b) => {
          if (!a.last_message_at) return 1;
          if (!b.last_message_at) return -1;
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });

        setConversations(conversationsWithMessages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  const handleQuickReply = async (projectId: string) => {
    const message = quickReplyText[projectId]?.trim();
    if (!message || !user) return;

    setSendingReply({ ...sendingReply, [projectId]: true });

    try {
      const { error } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          sender_id: user.id,
          message: message,
        });

      if (error) throw error;

      // Clear the input
      setQuickReplyText({ ...quickReplyText, [projectId]: '' });

      // Update the conversation's last message timestamp
      setConversations(prev =>
        prev.map(conv =>
          conv.id === projectId
            ? { ...conv, last_message_at: new Date().toISOString() }
            : conv
        )
      );

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingReply({ ...sendingReply, [projectId]: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ArchitectMessageNotifications />
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={smartRenoLogo} alt="SmartReno" className="h-8" />
            <nav className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/projects')}>
                Projects
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/proposals')}>
                Proposals
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/bid-room')}>
                Bid Room
              </Button>
              <Button variant="default" size="sm">
                Messages
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {selectedProject ? (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Conversations
              </Button>
            </div>

            <ProjectMessaging 
              projectId={selectedProject.id}
              projectName={selectedProject.project_name}
            />
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Messages</h1>
              <p className="text-muted-foreground mt-1">View and manage all your project conversations</p>
            </div>

            {conversations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Messages will appear here when you communicate with clients
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {conversations.map((conversation) => (
                  <Card 
                    key={conversation.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => setSelectedProject(conversation)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{conversation.project_name}</CardTitle>
                          <CardDescription>{conversation.client_name}</CardDescription>
                        </div>
                        {conversation.unread_count > 0 && (
                          <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-medium">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {conversation.last_message_at 
                            ? `Last message: ${new Date(conversation.last_message_at).toLocaleDateString()}`
                            : 'No messages yet'}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedProject(conversation)}
                        >
                          View Conversation
                        </Button>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          placeholder="Type a quick reply..."
                          value={quickReplyText[conversation.id] || ''}
                          onChange={(e) => setQuickReplyText({ 
                            ...quickReplyText, 
                            [conversation.id]: e.target.value 
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleQuickReply(conversation.id);
                            }
                          }}
                          disabled={sendingReply[conversation.id]}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleQuickReply(conversation.id)}
                          disabled={!quickReplyText[conversation.id]?.trim() || sendingReply[conversation.id]}
                        >
                          {sendingReply[conversation.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
