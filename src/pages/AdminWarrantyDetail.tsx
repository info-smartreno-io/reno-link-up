import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, FileText, DollarSign, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { WarrantyClaimMessaging } from "@/components/homeowner/WarrantyClaimMessaging";
import { WarrantyClassifierPanel } from "@/components/admin/WarrantyClassifierPanel";

export default function AdminWarrantyDetail() {
  const { claimId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const handleClaimResolved = () => {
    // Refresh claim details when resolved
    fetchClaimDetails();
  };

  useEffect(() => {
    if (claimId) {
      fetchClaimDetails();
    }
  }, [claimId]);

  async function fetchClaimDetails() {
    try {
      setLoading(true);

      // Fetch claim
      const { data: claimData, error: claimError } = await supabase
        .from("warranty_claims" as any)
        .select(`
          *,
          projects (
            id,
            name,
            status
          ),
          warranty_plans (
            plan_type,
            coverage_start,
            coverage_end
          )
        `)
        .eq("id", claimId)
        .single();

      if (claimError) throw claimError;
      setClaim(claimData);
      setSelectedStatus((claimData as any).claim_status);
      setNextAction((claimData as any).next_action || "");

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from("warranty_claim_events" as any)
        .select(`
          *,
          profiles:actor_id (full_name)
        `)
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("warranty_claim_attachments" as any)
        .select("*")
        .eq("claim_id", claimId);

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);

      // Fetch financials
      const { data: financialsData } = await supabase
        .from("warranty_claim_financials" as any)
        .select("*")
        .eq("claim_id", claimId)
        .single();

      setFinancials(financialsData);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error loading claim details",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange() {
    if (!claim || selectedStatus === claim.claim_status) return;

    try {
      const { error } = await supabase.functions.invoke("warranty-update-status", {
        body: {
          claim_id: claimId,
          to_status: selectedStatus,
          message: `Status changed to ${selectedStatus}`,
        },
      });

      if (error) throw error;

      toast({ title: "Status updated successfully" });
      fetchClaimDetails();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase.functions.invoke("warranty-add-event", {
        body: {
          claim_id: claimId,
          event_type: "note",
          message: newNote,
        },
      });

      if (error) throw error;

      setNewNote("");
      toast({ title: "Note added successfully" });
      fetchClaimDetails();
    } catch (error: any) {
      toast({
        title: "Error adding note",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleUpdateNextAction() {
    try {
      const { error } = await supabase
        .from("warranty_claims" as any)
        .update({ next_action: nextAction } as any)
        .eq("id", claimId);

      if (error) throw error;

      toast({ title: "Next action updated" });
    } catch (error: any) {
      toast({
        title: "Error updating next action",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <AdminLayout role="admin">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!claim) {
    return (
      <AdminLayout role="admin">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Claim not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout role="admin">
      <div className="space-y-6">
        <Breadcrumbs />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/warranty">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{claim.claim_number}</h1>
              <p className="text-sm text-muted-foreground">{claim.reported_issue_title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            {selectedStatus !== claim.claim_status && (
              <Button onClick={handleStatusChange}>Update Status</Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Claim Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Claim Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Project</Label>
                        <p className="font-medium">{claim.projects?.name || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <Badge variant="outline">{claim.projects?.status || '-'}</Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Address</Label>
                        <p className="font-medium">{claim.projects?.address}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Plan Type</Label>
                        <p className="font-medium capitalize">{claim.warranty_plans?.plan_type}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Area</Label>
                        <p className="font-medium">{claim.reported_area || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Severity</Label>
                        <Badge variant="outline">{claim.severity}</Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Within Coverage</Label>
                        <Badge variant={claim.within_coverage ? "default" : "destructive"}>
                          {claim.within_coverage ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Reported</Label>
                        <p className="font-medium">
                          {new Date(claim.date_reported).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="mt-1">{claim.reported_issue_desc}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {events.map((event) => (
                        <div key={event.id} className="flex gap-3 pb-4 border-b last:border-0">
                          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">
                                  {event.event_type.replace(/_/g, " ")}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.message}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                {new Date(event.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              by {event.profiles?.full_name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 space-y-3">
                      <Label>Add Note</Label>
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note or update..."
                        rows={3}
                      />
                      <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                        Add Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Next Action */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Next Action</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                      placeholder="What needs to happen next?"
                      rows={3}
                    />
                    <Button onClick={handleUpdateNextAction} className="w-full" size="sm">
                      Update
                    </Button>
                  </CardContent>
                </Card>

                {/* Attachments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Attachments ({attachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attachments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attachments yet</p>
                    ) : (
                      <div className="space-y-2">
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 p-2 rounded border text-sm"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{att.file_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Financials */}
                {financials && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Financials
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground text-xs">Estimated Cost</Label>
                        <p className="font-semibold">
                          ${financials.estimated_cost?.toLocaleString() || "0"}
                        </p>
                      </div>
                      {financials.actual_cost && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Actual Cost</Label>
                          <p className="font-semibold">
                            ${financials.actual_cost.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {financials.homeowner_deductible && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Deductible</Label>
                          <p className="font-semibold">
                            ${financials.homeowner_deductible.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {financials.covered_amount && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Covered Amount</Label>
                          <p className="font-semibold text-green-600">
                            ${financials.covered_amount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-analysis">
            <WarrantyClassifierPanel
              warrantyId={claimId}
              projectId={claim.projects?.id}
              description={claim.reported_issue_description}
              photos={attachments}
              contractorId={claim.contractor_id}
              projectScope={claim.projects}
              timeline={events}
              tradeInvolved={claim.reported_area}
            />
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Claim Communication</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Message the homeowner directly about this warranty claim
                </p>
              </CardHeader>
              <CardContent>
                <WarrantyClaimMessaging
                  claimId={claimId!}
                  claimNumber={claim.claim_number}
                  isAdmin={true}
                  onClaimResolved={handleClaimResolved}
                  claimData={{
                    claim_number: claim.claim_number,
                    homeowner_name: claim.homeowner_name,
                    claim_type: claim.claim_type,
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
