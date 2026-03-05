import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoSubcontractorInfo, getDemoProjectAssignments } from "@/utils/demoContractorData";
import { useSubcontractorNotifications } from "@/hooks/useSubcontractorNotifications";
import { useQuery } from "@tanstack/react-query";
import { SubBidOpportunityCard } from "@/components/subcontractor/SubBidOpportunityCard";
import { SubBidSubmissionDialog } from "@/components/subcontractor/SubBidSubmissionDialog";
import { SubAwardNotification } from "@/components/subcontractor/SubAwardNotification";
import { SubDateConfirmationDialog } from "@/components/subcontractor/SubDateConfirmationDialog";
import { SubMessagesPanel } from "@/components/subcontractor/SubMessagesPanel";
import { SubNotificationsPanel } from "@/components/subcontractor/SubNotificationsPanel";
import { SubcontractorCalendar } from "@/components/subcontractor/SubcontractorCalendar";
import { 
  Building, 
  FileText,
  Calendar,
  MessageSquare,
  Bell,
  Briefcase,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PortalCopilot } from "@/components/ai/PortalCopilot";

interface BidInvitation {
  id: string;
  package_id: string;
  subcontractor_id: string;
  status: string;
  invited_at: string;
  viewed_at: string | null;
  package?: {
    id: string;
    trade: string;
    budget_amount: number | null;
    due_date: string | null;
    scope_description: string | null;
    scope_photos: any[];
    blueprints: any[];
    scope_documents: any[];
    project_address: string | null;
    notes_for_subs: string | null;
    project_id: string;
  };
}

interface AwardedBid {
  id: string;
  package_id: string;
  subcontractor_id: string;
  bid_amount: number;
  timeline_weeks: number | null;
  notes: string | null;
  is_awarded: boolean;
  awarded_at: string | null;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  date_confirmed_at: string | null;
  package?: {
    id: string;
    trade: string;
    project_id: string;
    project_address: string | null;
  };
}

export default function SubcontractorPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [subcontractorInfo, setSubcontractorInfo] = useState<any>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [dateConfirmDialogOpen, setDateConfirmDialogOpen] = useState(false);
  const [selectedAwardedBid, setSelectedAwardedBid] = useState<AwardedBid | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const defaultTab = searchParams.get("tab") || "opportunities";
  const { notifications, unreadCount } = useSubcontractorNotifications();

  useEffect(() => {
    if (isDemoMode) {
      loadDemoData();
    } else {
      checkAuth();
    }
  }, [isDemoMode]);

  const loadDemoData = () => {
    const demoInfo = getDemoSubcontractorInfo();
    setSubcontractorInfo(demoInfo);
    setUserId("demo-user");
    setLoading(false);
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    
    setUserId(session.user.id);
    await fetchSubcontractorData(session.user.id);
    setLoading(false);
  };

  const fetchSubcontractorData = async (uid: string) => {
    try {
      const { data: subData, error: subError } = await supabase
        .from('subcontractors' as any)
        .select('*')
        .eq('user_id', uid)
        .single();

      if (subError) throw subError;
      setSubcontractorInfo(subData);
    } catch (error) {
      console.error('Error fetching subcontractor data:', error);
      // Set minimal info if no profile exists
      setSubcontractorInfo({ company_name: 'My Company', trade: 'General' });
    }
  };

  // Fetch bid invitations for this subcontractor
  const { data: bidInvitations = [], refetch: refetchInvitations } = useQuery({
    queryKey: ["sub-bid-invitations", userId],
    queryFn: async () => {
      if (!userId || isDemoMode) return [];
      
      const { data, error } = await supabase
        .from("sub_bid_invitations")
        .select(`
          *,
          package:sub_bid_packages(
            id, trade, budget_amount, due_date, scope_description, 
            scope_photos, blueprints, scope_documents, project_address, 
            notes_for_subs, project_id
          )
        `)
        .eq("subcontractor_id", userId)
        .in("status", ["pending", "viewed"])
        .order("invited_at", { ascending: false });

      if (error) throw error;
      return (data || []) as BidInvitation[];
    },
    enabled: !!userId && !isDemoMode,
  });

  // Fetch awarded bids for this subcontractor
  const { data: awardedBids = [], refetch: refetchAwarded } = useQuery({
    queryKey: ["sub-awarded-bids", userId],
    queryFn: async () => {
      if (!userId || isDemoMode) return [];
      
      const { data, error } = await supabase
        .from("sub_bid_responses")
        .select(`
          *,
          package:sub_bid_packages(id, trade, project_id, project_address)
        `)
        .eq("subcontractor_id", userId)
        .eq("is_awarded", true)
        .order("awarded_at", { ascending: false });

      if (error) throw error;
      return (data || []) as AwardedBid[];
    },
    enabled: !!userId && !isDemoMode,
  });

  const handleSubmitBid = (packageId: string) => {
    setSelectedPackageId(packageId);
    setBidDialogOpen(true);
  };

  const handleBidSuccess = () => {
    setBidDialogOpen(false);
    setSelectedPackageId(null);
    refetchInvitations();
    toast.success("Bid submitted successfully!");
  };

  const handleConfirmDates = (bid: AwardedBid) => {
    setSelectedAwardedBid(bid);
    setDateConfirmDialogOpen(true);
  };

  const handleDateConfirmed = () => {
    setDateConfirmDialogOpen(false);
    setSelectedAwardedBid(null);
    refetchAwarded();
    toast.success("Dates confirmed!");
  };

  // Stats calculations
  const openBidsCount = bidInvitations.length;
  const activeProjectsCount = awardedBids.filter(b => !b.date_confirmed_at).length;
  const confirmedProjectsCount = awardedBids.filter(b => !!b.date_confirmed_at).length;

  if (loading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building className="h-8 w-8 text-primary" />
              Subcontractor Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              {subcontractorInfo?.company_name || 'My Company'} - {subcontractorInfo?.trade || 'General'}
            </p>
          </div>
          <Button 
            variant="outline" 
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* Notifications Panel (Collapsible) */}
        {showNotifications && (
          <SubNotificationsPanel />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Open Bids
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openBidsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Pending Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjectsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                Confirmed Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedProjectsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Unread Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="opportunities" className="gap-2">
              <FileText className="h-4 w-4" />
              Bid Opportunities
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Briefcase className="h-4 w-4" />
              My Projects
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Bid Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-4">
            {bidInvitations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Bid Opportunities</h3>
                  <p className="text-muted-foreground">
                    You'll see bid requests here when you're invited to submit a bid.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bidInvitations.map((invitation) => (
                  <SubBidOpportunityCard
                    key={invitation.id}
                    package_={{
                      id: invitation.package?.id || invitation.package_id,
                      trade: invitation.package?.trade || "Unknown Trade",
                      project_id: invitation.package?.project_id || "",
                      status: "sent",
                      budget_amount: invitation.package?.budget_amount || null,
                      scope_description: invitation.package?.scope_description || null,
                      scope_documents: invitation.package?.scope_documents || [],
                      scope_photos: invitation.package?.scope_photos || [],
                      blueprints: invitation.package?.blueprints || [],
                      due_date: invitation.package?.due_date || null,
                      project_address: invitation.package?.project_address || null,
                      notes_for_subs: invitation.package?.notes_for_subs || null,
                      created_at: invitation.invited_at,
                    }}
                    hasSubmittedBid={invitation.status === "bid_submitted"}
                    onBidSubmitted={() => refetchInvitations()}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            {awardedBids.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Awarded Projects</h3>
                  <p className="text-muted-foreground">
                    Projects you've been awarded will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {awardedBids.map((bid) => (
                  <SubAwardNotification
                    key={bid.id}
                    award={{
                      id: bid.id,
                      package_id: bid.package_id,
                      bid_amount: bid.bid_amount,
                      is_awarded: bid.is_awarded,
                      awarded_at: bid.awarded_at,
                      scheduled_start_date: bid.scheduled_start_date,
                      scheduled_end_date: bid.scheduled_end_date,
                      date_confirmed_at: bid.date_confirmed_at,
                      trade: bid.package?.trade || "Unknown",
                      project_address: bid.package?.project_address || null,
                      project_id: bid.package?.project_id || "",
                    }}
                    onDateConfirmed={() => refetchAwarded()}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <SubcontractorCalendar />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <SubMessagesPanel currentUserType="subcontractor" />
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Copilot */}
      <PortalCopilot 
        role="subcontractor" 
        userId={userId}
        contextData={{ openBids: openBidsCount }}
      />
    </ContractorLayout>
  );
}
