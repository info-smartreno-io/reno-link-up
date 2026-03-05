import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Send, Loader2, Search, MessageSquare, Briefcase, Shield, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoMessages } from "@/utils/demoContractorData";

interface Conversation {
  id: string;
  type: "project" | "bid" | "warranty";
  title: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  projectId?: string;
  bidOpportunityId?: string;
  claimId?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
  isOwnMessage: boolean;
}

export default function ContractorMessages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      // Create demo conversations from demo messages
      const demoMsgs = getDemoMessages();
      const demoConvs: Conversation[] = [];
      const projectMap = new Map<string, typeof demoMsgs[0]>();
      
      demoMsgs.forEach(msg => {
        const key = msg.project_id || msg.id;
        if (!projectMap.has(key)) {
          projectMap.set(key, msg);
        }
      });

      projectMap.forEach((msg, key) => {
        demoConvs.push({
          id: key,
          type: msg.project_id ? "project" : "bid",
          title: msg.project_name || msg.sender_name,
          lastMessage: msg.preview,
          lastMessageTime: msg.timestamp,
          unreadCount: msg.is_read ? 0 : 1,
          projectId: msg.project_id || undefined,
        });
      });

      setConversations(demoConvs);
      setCurrentUserId("demo-user");
      setLoading(false);
      return;
    }
    checkAuthAndFetch();
  }, [isDemoMode]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/contractor/auth");
      return;
    }
    setCurrentUserId(session.user.id);
    await fetchConversations(session.user.id);
  };

  const fetchConversations = async (userId: string) => {
    try {
      setLoading(true);
      const allConversations: Conversation[] = [];

      // Fetch project messages
      const { data: projectMessages } = await supabase
        .from("project_messages")
        .select(`
          id,
          project_id,
          message,
          created_at,
          contractor_projects!inner(id, project_name, contractor_id)
        `)
        .order("created_at", { ascending: false });

      // Group by project
      const projectMap = new Map<string, Conversation>();
      projectMessages?.forEach((msg: any) => {
        const project = msg.contractor_projects;
        if (project && project.contractor_id === userId && !projectMap.has(project.id)) {
          projectMap.set(project.id, {
            id: project.id,
            type: "project",
            title: project.project_name,
            lastMessage: msg.message?.substring(0, 50) + "..." || "",
            lastMessageTime: msg.created_at,
            unreadCount: 0,
            projectId: project.id,
          });
        }
      });
      allConversations.push(...projectMap.values());

      // Fetch contractor direct messages
      const { data: directMessages } = await supabase
        .from("contractor_messages")
        .select("*")
        .eq("contractor_id", userId)
        .order("created_at", { ascending: false });

      // Group direct messages by project
      const directMap = new Map<string, Conversation>();
      directMessages?.forEach((msg) => {
        const key = msg.project_id || "general";
        if (!directMap.has(key) && !projectMap.has(key)) {
          directMap.set(key, {
            id: msg.id,
            type: "project",
            title: msg.project_id ? `Project Messages` : "General Messages",
            lastMessage: msg.message?.substring(0, 50) + "..." || "",
            lastMessageTime: msg.created_at,
            unreadCount: msg.is_read ? 0 : 1,
            projectId: msg.project_id || undefined,
          });
        }
      });
      allConversations.push(...directMap.values());

      // Fetch bid opportunity messages
      const { data: bidSubmissions } = await supabase
        .from("bid_submissions")
        .select(`
          id,
          bid_opportunity_id,
          bid_opportunities!inner(id, title)
        `)
        .eq("bidder_id", userId);

      const bidOpportunityIds = bidSubmissions?.map(b => b.bid_opportunity_id) || [];
      
      if (bidOpportunityIds.length > 0) {
        const { data: bidMessages } = await supabase
          .from("bid_opportunity_messages")
          .select("*")
          .in("bid_opportunity_id", bidOpportunityIds)
          .order("created_at", { ascending: false });

        const bidMap = new Map<string, Conversation>();
        bidMessages?.forEach((msg) => {
          if (!bidMap.has(msg.bid_opportunity_id)) {
            const bid = bidSubmissions?.find(b => b.bid_opportunity_id === msg.bid_opportunity_id);
            bidMap.set(msg.bid_opportunity_id, {
              id: msg.bid_opportunity_id,
              type: "bid",
              title: (bid?.bid_opportunities as any)?.title || "Bid Opportunity",
              lastMessage: msg.message?.substring(0, 50) + "..." || "",
              lastMessageTime: msg.created_at,
              unreadCount: 0,
              bidOpportunityId: msg.bid_opportunity_id,
            });
          }
        });
        allConversations.push(...bidMap.values());
      }

      // Sort by last message time
      allConversations.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setConversations(allConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversation: Conversation) => {
    setLoadingMessages(true);
    try {
      // Demo mode: generate sample messages for the conversation
      if (isDemoMode) {
        const demoMsgs = getDemoMessages();
        const relevantMsg = demoMsgs.find(m => m.project_id === conversation.projectId || m.id === conversation.id);
        const messagesData: Message[] = relevantMsg ? [
          {
            id: "demo-msg-reply-1",
            senderId: relevantMsg.project_id || "other",
            senderName: relevantMsg.sender_name,
            message: relevantMsg.message,
            createdAt: relevantMsg.created_at,
            isOwnMessage: false,
          },
          {
            id: "demo-msg-reply-2",
            senderId: "demo-user",
            senderName: "You",
            message: "Thanks for reaching out! I'll review this and get back to you shortly.",
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            isOwnMessage: true,
          },
        ] : [];
        setMessages(messagesData);
        setLoadingMessages(false);
        return;
      }

      let messagesData: Message[] = [];

      if (conversation.type === "project" && conversation.projectId) {
        const { data } = await supabase
          .from("project_messages")
          .select("*")
          .eq("project_id", conversation.projectId)
          .order("created_at", { ascending: true });

        const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", senderIds);

        messagesData = (data || []).map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: profiles?.find(p => p.id === msg.sender_id)?.full_name || "Unknown",
          message: msg.message,
          createdAt: msg.created_at,
          isOwnMessage: msg.sender_id === currentUserId,
        }));
      } else if (conversation.type === "bid" && conversation.bidOpportunityId) {
        const { data } = await supabase
          .from("bid_opportunity_messages")
          .select("*")
          .eq("bid_opportunity_id", conversation.bidOpportunityId)
          .order("created_at", { ascending: true });

        const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", senderIds);

        messagesData = (data || []).map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: profiles?.find(p => p.id === msg.sender_id)?.full_name || "Unknown",
          message: msg.message,
          createdAt: msg.created_at,
          isOwnMessage: msg.sender_id === currentUserId,
        }));
      }

      setMessages(messagesData);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    setSending(true);
    try {
      if (isDemoMode) {
        // Demo mode: just add to local messages
        setMessages(prev => [...prev, {
          id: `demo-sent-${Date.now()}`,
          senderId: "demo-user",
          senderName: "You",
          message: newMessage.trim(),
          createdAt: new Date().toISOString(),
          isOwnMessage: true,
        }]);
        setNewMessage("");
        toast.success("Message sent (demo mode)");
        setSending(false);
        return;
      }

      if (selectedConversation.type === "project" && selectedConversation.projectId) {
        await supabase.from("project_messages").insert({
          project_id: selectedConversation.projectId,
          sender_id: currentUserId,
          message: newMessage.trim(),
        });
      } else if (selectedConversation.type === "bid" && selectedConversation.bidOpportunityId) {
        await supabase.from("bid_opportunity_messages").insert({
          bid_opportunity_id: selectedConversation.bidOpportunityId,
          sender_id: currentUserId,
          message: newMessage.trim(),
        });
      }

      setNewMessage("");
      await fetchMessages(selectedConversation);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "project":
        return <Briefcase className="h-4 w-4" />;
      case "bid":
        return <FileText className="h-4 w-4" />;
      case "warranty":
        return <Shield className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || conv.type === activeTab;
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with homeowners, estimators, and team members
            </p>
          </div>
          <Button variant="outline" onClick={() => currentUserId && fetchConversations(currentUserId)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start px-4 h-auto flex-wrap">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="project" className="text-xs">Projects</TabsTrigger>
                  <TabsTrigger value="bid" className="text-xs">Bids</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="m-0">
                  <ScrollArea className="h-[500px]">
                    {filteredConversations.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No conversations found
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredConversations.map((conv) => (
                          <button
                            key={`${conv.type}-${conv.id}`}
                            onClick={() => setSelectedConversation(conv)}
                            className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                              selectedConversation?.id === conv.id && selectedConversation?.type === conv.type
                                ? "bg-muted"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-primary/10 text-primary">
                                {getTypeIcon(conv.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-medium truncate">{conv.title}</h4>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatTime(conv.lastMessageTime)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {conv.lastMessage}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {conv.type}
                                  </Badge>
                                  {conv.unreadCount > 0 && (
                                    <Badge className="text-xs">{conv.unreadCount}</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Messages Panel */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {getTypeIcon(selectedConversation.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.title}</CardTitle>
                      <CardDescription className="capitalize">{selectedConversation.type} conversation</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              <div className="h-full w-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                {msg.senderName?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            </Avatar>
                            <div className={`flex flex-col gap-1 max-w-[70%] ${msg.isOwnMessage ? "items-end" : "items-start"}`}>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-medium">{msg.senderName}</span>
                                <span>{formatTime(msg.createdAt)}</span>
                              </div>
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  msg.isOwnMessage
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                      />
                      <Button type="submit" disabled={!newMessage.trim() || sending}>
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </ContractorLayout>
  );
}
