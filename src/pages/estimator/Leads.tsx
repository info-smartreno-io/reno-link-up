import { useState, useEffect, useCallback } from "react";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import CreateLeadForm from "@/components/forms/CreateLeadForm";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Plus, Mail, Phone, MapPin, Calendar, User, Loader2, Send, Settings, Award, BarChart3, MailWarning, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SendToBidRoomDialog } from "@/components/estimator/SendToBidRoomDialog";
import { BackButton } from "@/components/BackButton";
import { SalesFunnel } from "@/components/estimator/SalesFunnel";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { DraggableLeadCard } from "@/components/estimator/DraggableLeadCard";
import { StageTimeoutSettings } from "@/components/estimator/StageTimeoutSettings";
import { LeadScore } from "@/components/estimator/LeadScore";
import { RecordContactDialog } from "@/components/estimator/RecordContactDialog";
import { LeadStatusChangeDialog } from "@/components/estimator/LeadStatusChangeDialog";
import { LeadLeaderboard } from "@/components/estimator/LeadLeaderboard";
import { LastActivityBadge } from "@/components/leads/LastActivityBadge";
import { RecordActivityDialog } from "@/components/leads/RecordActivityDialog";
import SearchBar from "@/components/blog/SearchBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  project_type: string;
  status: string;
  estimated_budget: string | null;
  created_at: string;
  lead_score?: number;
  score_budget?: number;
  score_response_time?: number;
  score_stage_progression?: number;
  last_contact_date?: string | null;
  contact_count?: number;
  last_activity_at?: string | null;
  last_activity_type?: string | null;
  last_activity_by?: string | null;
}

const statusColors: Record<string, string> = {
  new_lead: "hsl(217, 91%, 60%)",
  call_24h: "hsl(45, 93%, 47%)",
  walkthrough: "hsl(262, 83%, 58%)",
  scope_sent: "hsl(142, 76%, 36%)",
  scope_adjustment: "hsl(30, 80%, 55%)",
  architectural_design: "hsl(280, 65%, 60%)",
  bid_room: "hsl(195, 75%, 45%)",
  smart_bid_3: "hsl(340, 75%, 55%)",
  financing: "hsl(160, 70%, 50%)",
  bid_accepted: "hsl(120, 60%, 50%)",
  on_hold: "hsl(40, 70%, 60%)",
  lost: "hsl(0, 70%, 50%)",
};

export default function EstimatorLeads() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidRoomDialogOpen, setBidRoomDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    open: boolean;
    leadId: string;
    leadName: string;
    currentStatus: string;
    newStatus: string;
  }>({
    open: false,
    leadId: "",
    leadName: "",
    currentStatus: "",
    newStatus: "",
  });

  useEffect(() => {
    fetchLeads();

    // Set up real-time subscription
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to load leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.project_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = !selectedStage || lead.status === selectedStage;
    
    return matchesSearch && matchesStage;
  });

  const funnelStages = [
    { name: "New Lead", status: "new_lead", count: leads.filter(l => l.status === "new_lead").length, color: "hsl(217, 91%, 60%)" },
    { name: "24hr Call", status: "call_24h", count: leads.filter(l => l.status === "call_24h").length, color: "hsl(45, 93%, 47%)" },
    { name: "Walkthrough", status: "walkthrough", count: leads.filter(l => l.status === "walkthrough").length, color: "hsl(262, 83%, 58%)" },
    { name: "Scope Sent", status: "scope_sent", count: leads.filter(l => l.status === "scope_sent").length, color: "hsl(142, 76%, 36%)" },
    { name: "Scope Adjust", status: "scope_adjustment", count: leads.filter(l => l.status === "scope_adjustment").length, color: "hsl(30, 80%, 55%)" },
    { name: "Arch/Design", status: "architectural_design", count: leads.filter(l => l.status === "architectural_design").length, color: "hsl(280, 65%, 60%)" },
    { name: "Bid Room", status: "bid_room", count: leads.filter(l => l.status === "bid_room").length, color: "hsl(195, 75%, 45%)" },
    { name: "3SmartBid", status: "smart_bid_3", count: leads.filter(l => l.status === "smart_bid_3").length, color: "hsl(340, 75%, 55%)" },
    { name: "Financing", status: "financing", count: leads.filter(l => l.status === "financing").length, color: "hsl(160, 70%, 50%)" },
    { name: "Bid Accepted", status: "bid_accepted", count: leads.filter(l => l.status === "bid_accepted").length, color: "hsl(120, 60%, 50%)" },
  ];

  const onHoldLeads = leads.filter(l => l.status === "on_hold");
  const lostLeads = leads.filter(l => l.status === "lost");

  const handleStageClick = (status: string) => {
    setSelectedStage(selectedStage === status ? null : status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const lead = event.active.data.current?.lead;
    if (lead) {
      setActiveDragLead(lead);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;
    const currentLead = active.data.current?.lead;
    const currentStatus = active.data.current?.currentStatus;

    if (newStatus === currentStatus) return;

    // Check if the new status requires a reason (on_hold or lost)
    if (newStatus === "on_hold" || newStatus === "lost") {
      setStatusChangeDialog({
        open: true,
        leadId,
        leadName: currentLead?.name || "Lead",
        currentStatus,
        newStatus,
      });
    } else {
      // Optimistic update for other status changes
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );

      try {
        const { error } = await supabase
          .from('leads')
          .update({ status: newStatus })
          .eq('id', leadId);

        if (error) throw error;

        toast({
          title: "Lead updated",
          description: `${currentLead?.name} moved to ${funnelStages.find(s => s.status === newStatus)?.name}`,
        });
      } catch (error: any) {
        console.error('Error updating lead:', error);
        // Revert optimistic update
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === leadId ? { ...lead, status: currentStatus } : lead
          )
        );
        toast({
          title: "Error",
          description: "Failed to update lead status. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleStatusChangeSuccess = useCallback(() => {
    fetchLeads();
  }, []);

  return (
    <EstimatorLayout>
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Leads</h1>
            <p className="text-muted-foreground">Manage and track all potential clients</p>
            <div className="mt-4 max-w-2xl">
              <SearchBar />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/estimator/lost-lead-analytics")}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Lost Lead Analytics
            </Button>
            <Button
              variant={showLeaderboard ? "default" : "outline"}
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="gap-2"
            >
              <Award className="h-4 w-4" />
              {showLeaderboard ? "View Funnel" : "View Leaderboard"}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Stage Timeouts
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Stage Timeout Configuration</DialogTitle>
                </DialogHeader>
                <StageTimeoutSettings />
              </DialogContent>
            </Dialog>
            <CreateLeadForm onSuccess={fetchLeads} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : showLeaderboard ? (
          <LeadLeaderboard />
        ) : (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <>
              <SalesFunnel 
                stages={funnelStages}
                selectedStage={selectedStage}
                onStageClick={handleStageClick}
                leads={leads}
              />

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedStage || "all"} onValueChange={(value) => setSelectedStage(value === "all" ? null : value)}>
                <SelectTrigger className="w-[220px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="new_lead">New Lead</SelectItem>
                  <SelectItem value="call_24h">24hr Call</SelectItem>
                  <SelectItem value="walkthrough">Walkthrough</SelectItem>
                  <SelectItem value="scope_sent">Scope Sent</SelectItem>
                  <SelectItem value="scope_adjustment">Scope Adjustment</SelectItem>
                  <SelectItem value="architectural_design">Architectural/Design</SelectItem>
                  <SelectItem value="bid_room">Bid Room</SelectItem>
                  <SelectItem value="smart_bid_3">3SmartBid</SelectItem>
                  <SelectItem value="financing">Financing</SelectItem>
                  <SelectItem value="bid_accepted">Bid Accepted</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

        {(onHoldLeads.length > 0 || lostLeads.length > 0) && (
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MailWarning className="h-5 w-5 text-orange-600" />
                    Win-Back Opportunities
                  </CardTitle>
                  <CardDescription>
                    {onHoldLeads.length + lostLeads.length} leads ready for re-engagement campaigns
                  </CardDescription>
                </div>
                <Button
                  onClick={() => navigate("/estimator/winback-campaigns")}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Manage Campaigns
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {(onHoldLeads.length > 0 || lostLeads.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onHoldLeads.length > 0 && (
              <Card className="border-l-4 border-l-[hsl(40,70%,60%)]">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[hsl(40,70%,60%)]" />
                    On Hold ({onHoldLeads.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {onHoldLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/estimator/review-lead/${lead.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.project_type}</p>
                          </div>
                          <Badge variant="outline" className="gap-1">
                            <div className="h-2 w-2 rounded-full bg-[hsl(40,70%,60%)]" />
                            On Hold
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {lostLeads.length > 0 && (
              <Card className="border-l-4 border-l-[hsl(0,70%,50%)]">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[hsl(0,70%,50%)]" />
                    Lost ({lostLeads.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lostLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/estimator/review-lead/${lead.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.project_type}</p>
                          </div>
                          <Badge variant="outline" className="gap-1">
                            <div className="h-2 w-2 rounded-full bg-[hsl(0,70%,50%)]" />
                            Lost
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Leads ({filteredLeads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No leads found</p>
              </div>
            ) : (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Score</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Project Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <LeadScore
                        score={lead.lead_score || 0}
                        budgetScore={lead.score_budget || 0}
                        responseScore={lead.score_response_time || 0}
                        progressionScore={lead.score_stage_progression || 0}
                        variant="compact"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full h-10 w-10 bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{lead.project_type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {lead.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <LastActivityBadge
                        activityType={lead.last_activity_type || null}
                        activityAt={lead.last_activity_at || null}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1" style={{ borderLeftColor: statusColors[lead.status], borderLeftWidth: '3px' }}>
                        <div className={`h-2 w-2 rounded-full`} style={{ backgroundColor: statusColors[lead.status] }} />
                        {lead.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <RecordActivityDialog
                          leadId={lead.id}
                          leadName={lead.name}
                          onSuccess={fetchLeads}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedLead(lead);
                            setBidRoomDialogOpen(true);
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send to Bid Room
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/estimator/review-lead/${lead.id}`)}>
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
            </>
            
            <DragOverlay>
              {activeDragLead ? (
                <DraggableLeadCard 
                  lead={activeDragLead} 
                  stageColor={funnelStages.find(s => s.status === activeDragLead.status)?.color || "#666"}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {selectedLead && (
        <SendToBidRoomDialog
          open={bidRoomDialogOpen}
          onOpenChange={setBidRoomDialogOpen}
          projectId={selectedLead.id}
          projectName={`${selectedLead.name} - ${selectedLead.project_type}`}
          projectType={selectedLead.project_type}
          location={selectedLead.location}
          onSuccess={fetchLeads}
        />
      )}

      <LeadStatusChangeDialog
        open={statusChangeDialog.open}
        onOpenChange={(open) =>
          setStatusChangeDialog((prev) => ({ ...prev, open }))
        }
        leadId={statusChangeDialog.leadId}
        leadName={statusChangeDialog.leadName}
        currentStatus={statusChangeDialog.currentStatus}
        newStatus={statusChangeDialog.newStatus}
        onSuccess={handleStatusChangeSuccess}
      />
    </div>
    </EstimatorLayout>
  );
}
