import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LayoutGrid, List, Filter, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/BackButton";
import { PipelineKanban, PIPELINE_STAGES } from "@/components/pipeline/PipelineKanban";
import { AssignEstimatorDialog } from "@/components/pipeline/AssignEstimatorDialog";
import { QuickScheduleWalkthroughDialog } from "@/components/pipeline/QuickScheduleWalkthroughDialog";
import { usePipelineLeads, usePipelineActions } from "@/hooks/usePipelineLeads";
import { PipelineLead } from "@/components/pipeline/PipelineLeadCard";
import { useToast } from "@/hooks/use-toast";
import CreateLeadForm from "@/components/forms/CreateLeadForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LeadPipeline() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: leads = [], isLoading, refetch } = usePipelineLeads();
  const { updateLeadStatus, refreshLeads } = usePipelineActions();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Dialog states
  const [assignEstimatorDialog, setAssignEstimatorDialog] = useState<{
    open: boolean;
    leadId: string | null;
    leadName: string;
  }>({
    open: false,
    leadId: null,
    leadName: "",
  });

  const [scheduleWalkthroughDialog, setScheduleWalkthroughDialog] = useState<{
    open: boolean;
    lead: PipelineLead | null;
  }>({
    open: false,
    lead: null,
  });

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.project_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = !selectedStage || lead.status === selectedStage;
    
    return matchesSearch && matchesStage;
  });

  // Calculate stage stats
  const stageStats = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: leads.filter((l) => l.status === stage.id).length,
  }));

  const totalValue = leads.reduce((sum, lead) => {
    const budget = lead.estimated_budget?.replace(/[^0-9]/g, "");
    return sum + (budget ? parseInt(budget, 10) : 0);
  }, 0);

  const handleDragEnd = async (leadId: string, newStatus: string, currentStatus: string) => {
    // Optimistic update
    const leadName = leads.find((l) => l.id === leadId)?.name || "Lead";

    const success = await updateLeadStatus(leadId, newStatus);
    if (success) {
      const stageName = PIPELINE_STAGES.find((s) => s.id === newStatus)?.label || newStatus;
      toast({
        title: "Lead updated",
        description: `${leadName} moved to ${stageName}`,
      });
    }
  };

  const handleAssignEstimator = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    setAssignEstimatorDialog({
      open: true,
      leadId,
      leadName: lead?.name || "Lead",
    });
  };

  const handleScheduleWalkthrough = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setScheduleWalkthroughDialog({
        open: true,
        lead,
      });
    }
  };

  const handleViewDetails = (leadId: string) => {
    navigate(`/estimator/review-lead/${leadId}`);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">Lead Pipeline</h1>
              <p className="text-sm text-muted-foreground">
                Manage leads from inquiry to contract
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <CreateLeadForm onSuccess={refreshLeads} />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1800px] mx-auto px-4 py-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold">{leads.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">New Leads</p>
              <p className="text-2xl font-bold text-blue-600">
                {leads.filter((l) => l.status === "new_lead").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Visits Scheduled</p>
              <p className="text-2xl font-bold text-purple-600">
                {leads.filter((l) => l.walkthrough_scheduled_at).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">In Bid Room</p>
              <p className="text-2xl font-bold text-cyan-600">
                {leads.filter((l) => l.status === "bid_room").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Won</p>
              <p className="text-2xl font-bold text-green-600">
                {leads.filter((l) => l.status === "bid_accepted").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pipeline Value</p>
              <p className="text-2xl font-bold">
                ${totalValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Select
            value={selectedStage || "all"}
            onValueChange={(value) => setSelectedStage(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {PIPELINE_STAGES.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    {stage.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stage Legend */}
        <div className="flex flex-wrap gap-2">
          {stageStats.map((stage) => (
            <Badge
              key={stage.id}
              variant={selectedStage === stage.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
            >
              <div
                className="h-2 w-2 rounded-full mr-1.5"
                style={{ backgroundColor: stage.color }}
              />
              {stage.label} ({stage.count})
            </Badge>
          ))}
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <PipelineKanban
            leads={selectedStage ? filteredLeads : leads}
            onDragEnd={handleDragEnd}
            onAssignEstimator={handleAssignEstimator}
            onScheduleWalkthrough={handleScheduleWalkthrough}
            onViewDetails={handleViewDetails}
          />
        )}
      </main>

      {/* Dialogs */}
      <AssignEstimatorDialog
        open={assignEstimatorDialog.open}
        onOpenChange={(open) =>
          setAssignEstimatorDialog((prev) => ({ ...prev, open }))
        }
        leadId={assignEstimatorDialog.leadId}
        leadName={assignEstimatorDialog.leadName}
        onAssigned={refreshLeads}
      />

      <QuickScheduleWalkthroughDialog
        open={scheduleWalkthroughDialog.open}
        onOpenChange={(open) =>
          setScheduleWalkthroughDialog((prev) => ({ ...prev, open }))
        }
        lead={scheduleWalkthroughDialog.lead}
        onScheduled={refreshLeads}
      />
    </div>
  );
}
