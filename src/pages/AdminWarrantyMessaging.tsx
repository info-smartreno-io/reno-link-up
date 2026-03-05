import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";

interface ClaimWithMessages {
  id: string;
  claim_number: string;
  claim_status: string;
  reported_issue_title: string;
  priority: string;
  homeowner_name: string;
  date_reported: string;
  unread_count: number;
  last_message_at: string | null;
  last_message_text: string | null;
  avg_response_time_hours: number | null;
}

interface MessageStats {
  total_conversations: number;
  unread_messages: number;
  avg_response_time_hours: number;
  open_claims: number;
}

export default function AdminWarrantyMessaging() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<ClaimWithMessages[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<ClaimWithMessages[]>([]);
  const [stats, setStats] = useState<MessageStats>({
    total_conversations: 0,
    unread_messages: 0,
    avg_response_time_hours: 0,
    open_claims: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
    fetchClaimsWithMessages();
  }, []);

  useEffect(() => {
    filterClaims();
  }, [searchTerm, statusFilter, priorityFilter, claims]);

  useEffect(() => {
    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('warranty-messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'warranty_claim_messages'
        },
        () => {
          fetchClaimsWithMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchClaimsWithMessages = async () => {
    try {
      setLoading(true);

      // Fetch all warranty claims
      const { data: claimsData, error: claimsError } = await supabase
        .from('warranty_claims' as any)
        .select(`
          id,
          claim_number,
          claim_status,
          reported_issue_title,
          priority,
          homeowner_name,
          date_reported
        `)
        .order('date_reported', { ascending: false });

      if (claimsError) throw claimsError;

      // Fetch message stats for each claim
      const claimsWithMessages = await Promise.all(
        (claimsData || []).map(async (claim: any) => {
          // Get all messages for this claim
          const { data: messages } = await supabase
            .from('warranty_claim_messages' as any)
            .select('id, sender_id, created_at, message, read_at')
            .eq('claim_id', claim.id)
            .order('created_at', { ascending: false });

          // Count unread messages (sent by homeowner, not read by admin)
          const unreadCount = (messages || []).filter(
            (msg: any) => msg.sender_id !== currentUserId && !msg.read_at
          ).length;

          // Get last message
          const lastMessage = messages?.[0];

          // Calculate average response time
          let avgResponseTime = null;
          if (messages && (messages as any).length > 1) {
            const responseTimes: number[] = [];
            for (let i = 0; i < (messages as any).length - 1; i++) {
              const currentMsg = (messages as any)[i];
              const previousMsg = (messages as any)[i + 1];
              
              // If current is from admin and previous from homeowner
              if (currentMsg.sender_id === currentUserId && previousMsg.sender_id !== currentUserId) {
                const responseTime = differenceInHours(
                  new Date(currentMsg.created_at),
                  new Date(previousMsg.created_at)
                );
                if (responseTime >= 0) {
                  responseTimes.push(responseTime);
                }
              }
            }
            
            if (responseTimes.length > 0) {
              avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            }
          }

          return {
            ...claim,
            unread_count: unreadCount,
            last_message_at: (lastMessage as any)?.created_at || null,
            last_message_text: (lastMessage as any)?.message || null,
            avg_response_time_hours: avgResponseTime
          };
        })
      );

      setClaims(claimsWithMessages);

      // Calculate overall stats
      const totalUnread = claimsWithMessages.reduce((sum, c) => sum + c.unread_count, 0);
      const responseTimes = claimsWithMessages
        .filter(c => c.avg_response_time_hours !== null)
        .map(c => c.avg_response_time_hours!);
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
      const openClaims = claimsWithMessages.filter(
        c => !['resolved', 'denied', 'closed'].includes(c.claim_status)
      ).length;

      setStats({
        total_conversations: claimsWithMessages.length,
        unread_messages: totalUnread,
        avg_response_time_hours: avgResponseTime,
        open_claims: openClaims
      });

    } catch (error: any) {
      console.error('Error fetching claims:', error);
      toast({
        title: "Error loading claims",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClaims = () => {
    let filtered = [...claims];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(claim =>
        claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.reported_issue_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.homeowner_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(claim => claim.claim_status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(claim => claim.priority === priorityFilter);
    }

    setFilteredClaims(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      in_review: 'bg-yellow-500',
      info_requested: 'bg-orange-500',
      scheduled_inspection: 'bg-purple-500',
      awaiting_contractor: 'bg-cyan-500',
      in_repair: 'bg-indigo-500',
      resolved: 'bg-green-500',
      denied: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const formatResponseTime = (hours: number | null) => {
    if (!hours) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading warranty messages...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Warranty Messages</h1>
          <p className="text-muted-foreground">Manage all warranty claim conversations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_conversations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.unread_messages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatResponseTime(stats.avg_response_time_hours)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Claims</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open_claims}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by claim number, title, or homeowner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="info_requested">Info Requested</SelectItem>
                  <SelectItem value="scheduled_inspection">Scheduled Inspection</SelectItem>
                  <SelectItem value="awaiting_contractor">Awaiting Contractor</SelectItem>
                  <SelectItem value="in_repair">In Repair</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Claims List */}
        <Tabs defaultValue="unread" className="w-full">
          <TabsList>
            <TabsTrigger value="unread">
              Unread ({filteredClaims.filter(c => c.unread_count > 0).length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({filteredClaims.length})
            </TabsTrigger>
            <TabsTrigger value="open">
              Open ({filteredClaims.filter(c => !['resolved', 'denied', 'closed'].includes(c.claim_status)).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-4">
            {filteredClaims.filter(c => c.unread_count > 0).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No unread messages</p>
                </CardContent>
              </Card>
            ) : (
              filteredClaims.filter(c => c.unread_count > 0).map((claim) => (
                <ClaimCard key={claim.id} claim={claim} navigate={navigate} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} formatResponseTime={formatResponseTime} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {filteredClaims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} navigate={navigate} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} formatResponseTime={formatResponseTime} />
            ))}
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            {filteredClaims.filter(c => !['resolved', 'denied', 'closed'].includes(c.claim_status)).map((claim) => (
              <ClaimCard key={claim.id} claim={claim} navigate={navigate} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} formatResponseTime={formatResponseTime} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

interface ClaimCardProps {
  claim: ClaimWithMessages;
  navigate: any;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  formatResponseTime: (hours: number | null) => string;
}

function ClaimCard({ claim, navigate, getStatusColor, getPriorityColor, formatResponseTime }: ClaimCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate(`/admin/warranty/${claim.id}`)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{claim.claim_number}</h3>
              {claim.unread_count > 0 && (
                <Badge variant="destructive" className="rounded-full px-2 py-0 text-xs">
                  {claim.unread_count}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{claim.reported_issue_title}</p>
            <p className="text-sm font-medium">Homeowner: {claim.homeowner_name}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={getPriorityColor(claim.priority)}>
              {claim.priority}
            </Badge>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(claim.claim_status)}`} title={claim.claim_status.replace(/_/g, ' ')} />
          </div>
        </div>

        {claim.last_message_text && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm line-clamp-2 text-muted-foreground">
              {claim.last_message_text}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {claim.last_message_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(claim.last_message_at), { addSuffix: true })}
              </span>
            )}
            {claim.avg_response_time_hours !== null && (
              <span>Avg response: {formatResponseTime(claim.avg_response_time_hours)}</span>
            )}
          </div>
          <span>Reported: {format(new Date(claim.date_reported), 'MMM d, yyyy')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
