import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, Users, Eye, FileText, Clock, CheckCircle2, Trophy, Loader2, RotateCcw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AdminClarificationPanel } from "@/components/admin/bid/AdminClarificationPanel";
import { BidAuditTimelinePanel } from "@/components/admin/bid/BidAuditTimelinePanel";
import { logBidPacketActivity } from "@/utils/bidPacketAudit";

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    ready: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    rfp_out: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    bidding_closed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    awarded: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };
  return map[status] || "bg-muted text-muted-foreground";
}

export default function AdminBidPacketDetail() {
  const { packetId } = useParams<{ packetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [searchContractor, setSearchContractor] = useState("");
  const [selectedContractors, setSelectedContractors] = useState<Set<string>>(new Set());
  const [bidDeadline, setBidDeadline] = useState("");
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionTargetId, setRevisionTargetId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: packet, isLoading } = useQuery({
    queryKey: ["admin-bid-packet", packetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_packets")
        .select("*")
        .eq("id", packetId!)
        .single();
      if (error) throw error;
      if (data.bid_deadline) setBidDeadline(data.bid_deadline.slice(0, 16));
      return data;
    },
    enabled: !!packetId,
  });

  const { data: invites } = useQuery({
    queryKey: ["bid-packet-invites", packetId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bid_packet_contractor_invites")
        .select("*, profiles:contractor_id(full_name, email)")
        .eq("bid_packet_id", packetId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!packetId,
  });

  const { data: submissions } = useQuery({
    queryKey: ["bid-packet-submissions", packetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_submissions")
        .select("*, profiles:bidder_id(full_name, email)")
        .eq("bid_opportunity_id", packetId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!packetId,
  });

  // Unread clarification count
  const { data: unreadClarificationCount = 0 } = useQuery({
    queryKey: ["admin-unread-clarifications", packetId],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("bid_packet_clarifications")
        .select("*", { count: "exact", head: true })
        .eq("bid_packet_id", packetId!)
        .eq("read_by_admin", false)
        .eq("sender_role", "contractor");
      return count || 0;
    },
    enabled: !!packetId,
  });

  const { data: contractors } = useQuery({
    queryKey: ["all-contractors-for-invite", searchContractor],
    queryFn: async () => {
      let query = supabase
        .from("contractors")
        .select("id, company_name, trade_categories, service_area")
        .eq("approval_status", "approved")
        .limit(50);
      if (searchContractor) {
        query = query.ilike("company_name", `%${searchContractor}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: inviteSheetOpen,
  });

  const logActivity = async (actionType: string, details: Record<string, any> = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await logBidPacketActivity({
      bidPacketId: packetId!,
      actorId: user.id,
      actorRole: "admin",
      actionType,
      actionDetails: details,
    });
    if (packet?.design_package_id) {
      await supabase.from("design_package_activity_log").insert({
        design_package_id: packet.design_package_id,
        actor_id: user.id,
        actor_role: "admin",
        action_type: actionType,
        action_details: JSON.stringify(details),
      });
    }
  };

  const updatePacketStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("bid_packets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", packetId!);
      if (error) throw error;
      if (packet?.project_id) {
        const projectStatus = status === "rfp_out" ? "rfp_out" : status === "awarded" ? "contractor_selected" : undefined;
        if (projectStatus) {
          await supabase.from("projects").update({ status: projectStatus }).eq("id", packet.project_id);
        }
      }
      await logActivity(`packet_status_${status}`, { new_status: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bid-packet", packetId] });
      toast.success("Packet status updated");
    },
  });

  const sendInvites = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const inviteRows = Array.from(selectedContractors).map(cId => ({
        bid_packet_id: packetId!,
        contractor_id: cId,
        invited_by: user?.id,
        status: "invited",
      }));
      const { error } = await (supabase as any)
        .from("bid_packet_contractor_invites")
        .insert(inviteRows);
      if (error) throw error;
      for (const cId of selectedContractors) {
        await supabase.from("notifications").insert({
          user_id: cId,
          title: "New RFP Invitation",
          message: `You've been invited to bid on: ${packet?.title || "a project"}`,
          type: "proposal",
          link: `/contractor/bid-packets/${packetId}`,
        });
      }
      await logActivity("contractor_invited", { count: selectedContractors.size });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-packet-invites", packetId] });
      setSelectedContractors(new Set());
      setInviteSheetOpen(false);
      toast.success("Invitations sent");
    },
  });

  const saveBidDeadline = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("bid_packets")
        .update({ bid_deadline: bidDeadline ? new Date(bidDeadline).toISOString() : null })
        .eq("id", packetId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bid-packet", packetId] });
      toast.success("Deadline saved");
    },
  });

  const awardContractor = useMutation({
    mutationFn: async (submissionId: string) => {
      await supabase.from("bid_submissions").update({ status: "awarded" }).eq("id", submissionId);
      await supabase.from("bid_packets").update({ status: "awarded" }).eq("id", packetId!);
      if (packet?.project_id) {
        await supabase.from("projects").update({ status: "contractor_selected" }).eq("id", packet.project_id);
      }
      await logActivity("contractor_awarded", { submission_id: submissionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bid-packet", packetId] });
      queryClient.invalidateQueries({ queryKey: ["bid-packet-submissions", packetId] });
      toast.success("Contractor awarded!");
    },
  });

  const requestRevision = useMutation({
    mutationFn: async () => {
      if (!revisionTargetId) throw new Error("No submission selected");
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("bid_submissions").update({
        status: "revision_requested",
        revision_requested_at: new Date().toISOString(),
        revision_request_notes: revisionNotes,
      }).eq("id", revisionTargetId);

      // Notify contractor
      const sub = submissions?.find((s: any) => s.id === revisionTargetId);
      if (sub) {
        await supabase.from("notifications").insert({
          user_id: sub.bidder_id,
          title: "Bid Revision Requested",
          message: revisionNotes || "Please review and resubmit your bid.",
          type: "proposal",
          link: `/contractor/bid-packets/${packetId}`,
        });
      }

      await logActivity("admin_requested_revision", {
        submission_id: revisionTargetId,
        revision_notes: revisionNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-packet-submissions", packetId] });
      queryClient.invalidateQueries({ queryKey: ["bid-packet-activity-log", packetId] });
      setRevisionDialogOpen(false);
      setRevisionNotes("");
      setRevisionTargetId(null);
      toast.success("Revision requested");
    },
  });

  const toggleContractor = (id: string) => {
    setSelectedContractors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (isLoading || !packet) {
    return <AdminLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  const invitedContractorIds = new Set((invites || []).map((i: any) => i.contractor_id));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/bid-packets")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{packet.title}</h1>
            <p className="text-muted-foreground text-sm">Packet {packetId?.slice(0, 8)} • Project {packet.project_id?.slice(0, 8) || "—"}</p>
          </div>
          <Badge className={statusBadgeClass(packet.status)}>{packet.status.replace(/_/g, " ")}</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">
              Submissions ({submissions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="clarifications" className="gap-1">
              Clarifications
              {unreadClarificationCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1">{unreadClarificationCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Packet Content Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Project Overview", value: packet.project_overview },
                  { label: "Scope Summary", value: packet.scope_summary },
                  { label: "Design Selections", value: packet.design_selections_notes },
                  { label: "Permit / Technical", value: packet.permit_technical_notes },
                  { label: "Site Logistics", value: packet.site_logistics },
                  { label: "Inclusions", value: packet.inclusions },
                  { label: "Exclusions", value: packet.exclusions },
                  { label: "Assumptions", value: packet.assumptions },
                ].filter(s => s.value).map(s => (
                  <Card key={s.label}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{s.label}</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground whitespace-pre-line">{s.value}</p></CardContent>
                  </Card>
                ))}
              </div>

              {/* Bid Deadline */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Bid Deadline</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Input type="datetime-local" value={bidDeadline} onChange={(e) => setBidDeadline(e.target.value)} className="max-w-xs" />
                  <Button size="sm" onClick={() => saveBidDeadline.mutate()}>Save</Button>
                  {packet.bid_deadline && (
                    <span className="text-sm text-muted-foreground">
                      Current: {format(new Date(packet.bid_deadline), "MMM d, yyyy h:mm a")}
                    </span>
                  )}
                </CardContent>
              </Card>

              {/* Admin Actions */}
              <Card>
                <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                <CardContent className="flex gap-2 flex-wrap">
                  {packet.status === "draft" && (
                    <Button onClick={() => updatePacketStatus.mutate("ready")}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Ready
                    </Button>
                  )}
                  {(packet.status === "draft" || packet.status === "ready") && (
                    <Button onClick={() => updatePacketStatus.mutate("rfp_out")}>
                      <Send className="mr-2 h-4 w-4" /> Send RFP
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setInviteSheetOpen(true)}>
                    <Users className="mr-2 h-4 w-4" /> Invite Contractors ({invites?.length || 0})
                  </Button>
                  {packet.status === "rfp_out" && (
                    <Button variant="secondary" onClick={() => updatePacketStatus.mutate("bidding_closed")}>
                      Close Bidding
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Invited Contractors */}
              <Card>
                <CardHeader><CardTitle>Invited Contractors ({invites?.length || 0})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contractor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Invited</TableHead>
                        <TableHead>Viewed</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!invites || invites.length === 0) ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No contractors invited yet</TableCell></TableRow>
                      ) : invites.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.profiles?.full_name || inv.profiles?.email || inv.contractor_id.slice(0, 8)}</TableCell>
                          <TableCell><Badge variant="outline">{inv.status}</Badge></TableCell>
                          <TableCell className="text-sm">{inv.invited_at ? format(new Date(inv.invited_at), "MMM d") : "—"}</TableCell>
                          <TableCell className="text-sm">{inv.viewed_at ? format(new Date(inv.viewed_at), "MMM d") : "—"}</TableCell>
                          <TableCell className="text-sm">{inv.submitted_at ? format(new Date(inv.submitted_at), "MMM d") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Bid Submissions ({submissions?.length || 0})</CardTitle>
                  {(submissions?.length || 0) >= 2 && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/bid-comparison/${packetId}`)}>
                      <Eye className="mr-2 h-4 w-4" /> Full Comparison
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bidder</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Revisions</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!submissions || submissions.length === 0) ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No bids submitted yet</TableCell></TableRow>
                    ) : submissions.map((sub: any) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.profiles?.full_name || sub.profiles?.email || sub.bidder_id.slice(0, 8)}</TableCell>
                        <TableCell className="font-mono">${Number(sub.bid_amount).toLocaleString()}</TableCell>
                        <TableCell>{sub.estimated_timeline || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={sub.status === "revision_requested" ? "destructive" : sub.status === "awarded" ? "default" : "outline"}>
                            {sub.status === "revision_requested" ? "Revision Req." : sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{sub.revision_count || 0}</TableCell>
                        <TableCell className="text-sm">{format(new Date(sub.submitted_at), "MMM d")}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {sub.status === "submitted" && packet.status !== "awarded" && (
                            <>
                              <Button size="sm" variant="default" onClick={() => awardContractor.mutate(sub.id)}>
                                <Trophy className="mr-1 h-3 w-3" /> Award
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setRevisionTargetId(sub.id);
                                setRevisionDialogOpen(true);
                              }}>
                                <RotateCcw className="mr-1 h-3 w-3" /> Request Revision
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clarifications Tab */}
          <TabsContent value="clarifications">
            <AdminClarificationPanel packetId={packetId!} />
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit">
            <BidAuditTimelinePanel packetId={packetId!} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Contractors Sheet */}
      <Sheet open={inviteSheetOpen} onOpenChange={setInviteSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Invite Contractors</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="Search contractors..." value={searchContractor} onChange={(e) => setSearchContractor(e.target.value)} />
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {(contractors || []).map((c: any) => {
                const alreadyInvited = invitedContractorIds.has(c.id);
                return (
                  <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border ${selectedContractors.has(c.id) ? "border-primary bg-primary/5" : "border-border"}`}>
                    <div>
                      <p className="font-medium text-sm">{c.company_name}</p>
                      <p className="text-xs text-muted-foreground">{Array.isArray(c.trade_categories) ? c.trade_categories.join(", ") : "—"}</p>
                    </div>
                    {alreadyInvited ? (
                      <Badge variant="secondary" className="text-xs">Invited</Badge>
                    ) : (
                      <Button size="sm" variant={selectedContractors.has(c.id) ? "default" : "outline"} onClick={() => toggleContractor(c.id)}>
                        {selectedContractors.has(c.id) ? "Selected" : "Select"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <Button className="w-full" disabled={selectedContractors.size === 0 || sendInvites.isPending} onClick={() => sendInvites.mutate()}>
              {sendInvites.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" /> Send {selectedContractors.size} Invitation(s)
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Revision Request Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Bid Revision</DialogTitle>
            <DialogDescription>The contractor will be notified and can edit and resubmit their bid.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Revision Notes</Label>
              <Textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                rows={4}
                placeholder="Explain what needs to be revised (e.g., adjust pricing for permit costs, clarify timeline assumptions)..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => requestRevision.mutate()}
              disabled={requestRevision.isPending || !revisionNotes.trim()}
            >
              {requestRevision.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RotateCcw className="mr-2 h-4 w-4" /> Send Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
