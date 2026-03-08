import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Send, Save, FileText, Clock, AlertTriangle, Loader2,
  CheckCircle2, Upload, Paperclip, DollarSign, Calendar, MapPin,
  Building2, Eye, MessageSquare, X, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { useDropzone } from "react-dropzone";
import { ClarificationThread } from "@/components/contractor/bid/ClarificationThread";
import { RevisionBanner } from "@/components/contractor/bid/RevisionBanner";
import { SubmissionHistory } from "@/components/contractor/bid/SubmissionHistory";
import { computeContractorBidStatus, BID_STATUS_CONFIG } from "@/utils/contractorBidStatus";
import { logBidPacketActivity, snapshotBidSubmission } from "@/utils/bidPacketAudit";

function DeadlineHeader({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  const isPast = d < now;
  const hoursLeft = differenceInHours(d, now);
  const daysLeft = differenceInDays(d, now);

  if (isPast) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-sm text-destructive font-medium">The bid deadline has passed. Submissions are closed.</p>
      </div>
    );
  }
  if (hoursLeft < 48) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
        <Clock className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-sm text-destructive"><strong>Urgent:</strong> Only {hoursLeft} hours remaining to submit your bid.</p>
      </div>
    );
  }
  if (daysLeft <= 7) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">
          {daysLeft} days remaining to submit — deadline {format(d, "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    );
  }
  return null;
}

function ScopeSection({ label, value, icon: Icon }: { label: string; value: string | null; icon: typeof FileText }) {
  if (!value) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function ContractorBidPacketView() {
  const { packetId } = useParams<{ packetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("scope");
  const [bidAmount, setBidAmount] = useState("");
  const [estimatedTimeline, setEstimatedTimeline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [permitIncluded, setPermitIncluded] = useState(false);
  const [engineeringRequired, setEngineeringRequired] = useState(false);
  const [materialsOwnerSupplied, setMaterialsOwnerSupplied] = useState(false);
  const [clarifications, setClarifications] = useState("");
  const [notes, setNotes] = useState("");
  const [proposalText, setProposalText] = useState("");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  // Fetch packet
  const { data: packet, isLoading: packetLoading } = useQuery({
    queryKey: ["contractor-bid-packet", packetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_packets")
        .select("*")
        .eq("id", packetId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!packetId,
  });

  // Mark invite as viewed + log (runs once per packet load)
  const [hasLoggedView, setHasLoggedView] = useState(false);
  useEffect(() => {
    if (!packetId || hasLoggedView) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: updated } = await (supabase as any)
        .from("bid_packet_contractor_invites")
        .update({ status: "viewed", viewed_at: new Date().toISOString() })
        .eq("bid_packet_id", packetId)
        .eq("contractor_id", user.id)
        .eq("status", "invited")
        .select();
      if (updated?.length) {
        await logBidPacketActivity({
          bidPacketId: packetId,
          actorId: user.id,
          actorRole: "contractor",
          actionType: "contractor_viewed_packet",
        });
      }
      setHasLoggedView(true);
    })();
  }, [packetId, hasLoggedView]);

  // Load existing submission
  const { data: existingSubmission } = useQuery({
    queryKey: ["contractor-packet-submission", packetId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("bid_submissions")
        .select("*")
        .eq("bid_opportunity_id", packetId!)
        .eq("bidder_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setBidAmount(String(data.bid_amount || ""));
        setEstimatedTimeline(data.estimated_timeline || "");
        setProposalText(data.proposal_text || "");
        setNotes((data as any).estimator_notes || "");
        const att = data.attachments as any;
        if (att) {
          setScopeConfirmed(att.scope_confirmed || false);
          setPermitIncluded(att.permit_included || false);
          setEngineeringRequired(att.engineering_required || false);
          setMaterialsOwnerSupplied(att.materials_owner_supplied || false);
          setClarifications(att.clarifications || "");
          setStartDate(att.start_date || "");
        }
      }
      return data;
    },
    enabled: !!packetId,
  });

  // Fetch invite data for status
  const { data: invite } = useQuery({
    queryKey: ["contractor-packet-invite", packetId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await (supabase as any)
        .from("bid_packet_contractor_invites")
        .select("*")
        .eq("bid_packet_id", packetId!)
        .eq("contractor_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!packetId,
  });

  // Fetch clarification count for tab badge
  const { data: clarificationCount = 0 } = useQuery({
    queryKey: ["bid-clarification-count", packetId],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("bid_packet_clarifications")
        .select("*", { count: "exact", head: true })
        .eq("bid_packet_id", packetId!)
        .eq("read_by_contractor", false)
        .neq("sender_role", "contractor");
      return count || 0;
    },
    enabled: !!packetId,
  });

  // Fetch trade sections
  const { data: tradeSections = [] } = useQuery({
    queryKey: ["contractor-packet-trade-sections", packetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bid_packet_trade_sections")
        .select("*, bid_packet_line_items(*)")
        .eq("bid_packet_id", packetId!)
        .order("sort_order");
      return data || [];
    },
    enabled: !!packetId,
  });

  const deadlinePassed = packet?.bid_deadline ? new Date(packet.bid_deadline) < new Date() : false;
  const isRevisionRequested = (existingSubmission as any)?.status === "revision_requested";
  const isSubmitted = existingSubmission?.status === "submitted" && !isRevisionRequested;
  const canSubmit = (!deadlinePassed && !isSubmitted) || isRevisionRequested;

  // Compute display status
  const displayStatus = computeContractorBidStatus({
    inviteStatus: invite?.status || "invited",
    submissionStatus: existingSubmission?.status || null,
    submissionRevisionCount: (existingSubmission as any)?.revision_count || 0,
    deadlinePassed,
  });
  const statusConfig = BID_STATUS_CONFIG[displayStatus];

  // File upload
  const onDrop = useCallback((files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
    disabled: !canSubmit,
  });
  const removeFile = (idx: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx));

  // Save/submit bid
  const saveBid = useMutation({
    mutationFn: async (status: "draft" | "submitted") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (status === "submitted" && deadlinePassed && !isRevisionRequested) throw new Error("Bid deadline has passed");
      if (status === "submitted" && !scopeConfirmed) throw new Error("You must confirm the scope before submitting");

      // Snapshot previous state before overwrite (if exists)
      if (status === "submitted" && existingSubmission?.id) {
        await snapshotBidSubmission({
          submissionId: existingSubmission.id,
          bidAmount: existingSubmission.bid_amount,
          estimatedTimeline: existingSubmission.estimated_timeline,
          proposalText: existingSubmission.proposal_text,
          attachments: existingSubmission.attachments,
          status: existingSubmission.status,
          revisionNotes: (existingSubmission as any).revision_request_notes,
          createdBy: user.id,
          sourceEvent: isRevisionRequested ? "resubmission_prior" : "initial_submit_prior",
        });
      }

      // Upload files
      let fileUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const path = `bid-attachments/${packetId}/${user.id}/${Date.now()}-${file.name}`;
          const { error: uploadErr } = await supabase.storage.from("bid-attachments").upload(path, file);
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("bid-attachments").getPublicUrl(path);
            if (urlData?.publicUrl) fileUrls.push(urlData.publicUrl);
          }
        }
        // Log attachment upload
        await logBidPacketActivity({
          bidPacketId: packetId!,
          bidSubmissionId: existingSubmission?.id,
          actorId: user.id,
          actorRole: "contractor",
          actionType: "contractor_uploaded_attachment",
          actionDetails: { file_count: uploadedFiles.length },
        });
      }

      const existingAttachments = (existingSubmission?.attachments as any) || {};
      const newRevisionCount = isRevisionRequested
        ? ((existingSubmission as any)?.revision_count || 0) + (status === "submitted" ? 1 : 0)
        : (existingSubmission as any)?.revision_count || 0;

      const payload: any = {
        bid_opportunity_id: packetId!,
        bidder_id: user.id,
        bidder_type: "contractor",
        bid_amount: Number(bidAmount) || 0,
        estimated_timeline: estimatedTimeline || null,
        proposal_text: proposalText || null,
        anticipated_start_date: startDate || null,
        status,
        submitted_at: new Date().toISOString(),
        revision_count: newRevisionCount,
        attachments: {
          ...existingAttachments,
          scope_confirmed: scopeConfirmed,
          permit_included: permitIncluded,
          engineering_required: engineeringRequired,
          materials_owner_supplied: materialsOwnerSupplied,
          clarifications,
          notes,
          start_date: startDate,
          file_urls: [...(existingAttachments.file_urls || []), ...fileUrls],
        },
      };

      // Clear revision fields on resubmit
      if (status === "submitted" && isRevisionRequested) {
        payload.revision_requested_at = null;
        payload.revision_request_notes = null;
      }

      let submissionId = existingSubmission?.id;
      if (existingSubmission?.id) {
        const { error } = await supabase.from("bid_submissions").update(payload).eq("id", existingSubmission.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from("bid_submissions").insert(payload).select("id").single();
        if (error) throw error;
        submissionId = inserted?.id;
      }

      // Update invite status
      if (status === "submitted") {
        await (supabase as any)
          .from("bid_packet_contractor_invites")
          .update({ status: "submitted", submitted_at: new Date().toISOString() })
          .eq("bid_packet_id", packetId!)
          .eq("contractor_id", user.id);
      }

      // Log activity
      const actionType = status === "draft"
        ? "contractor_saved_draft"
        : isRevisionRequested
          ? "contractor_resubmitted_bid"
          : "contractor_submitted_bid";
      await logBidPacketActivity({
        bidPacketId: packetId!,
        bidSubmissionId: submissionId,
        actorId: user.id,
        actorRole: "contractor",
        actionType,
        actionDetails: {
          bid_amount: Number(bidAmount) || 0,
          revision_count: newRevisionCount,
        },
      });

      // Snapshot the newly submitted state for immutable audit trail
      if (status === "submitted" && submissionId) {
        await snapshotBidSubmission({
          submissionId,
          bidAmount: Number(bidAmount) || 0,
          estimatedTimeline: estimatedTimeline || null,
          proposalText: proposalText || null,
          attachments: payload.attachments,
          status: "submitted",
          revisionNotes: null,
          createdBy: user.id,
          sourceEvent: isRevisionRequested ? "resubmission" : "initial_submit",
        });
      }

      setUploadedFiles([]);
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["contractor-packet-submission", packetId] });
      queryClient.invalidateQueries({ queryKey: ["contractor-bid-packet-invites"] });
      queryClient.invalidateQueries({ queryKey: ["contractor-packet-invite", packetId] });
      queryClient.invalidateQueries({ queryKey: ["bid-submission-history"] });
      if (status === "submitted") {
        toast.success(isRevisionRequested ? "Revised bid resubmitted!" : "Bid submitted successfully!");
        setShowSubmitConfirm(false);
      } else {
        toast.success("Draft saved");
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Bid completeness
  const bidCompleteness = (() => {
    let score = 0;
    if (Number(bidAmount) > 0) score++;
    if (estimatedTimeline) score++;
    if (startDate) score++;
    if (scopeConfirmed) score++;
    if (proposalText.trim().length > 20) score++;
    return Math.round((score / 5) * 100);
  })();

  if (packetLoading) {
    return (
      <ContractorLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </ContractorLayout>
    );
  }

  if (!packet) {
    return (
      <ContractorLayout>
        <div className="text-center py-20 text-muted-foreground">Bid packet not found or you don't have access.</div>
      </ContractorLayout>
    );
  }

  const deadline = packet.bid_deadline || packet.bid_due_date;
  const scopeSections = [
    { label: "Project Overview", value: packet.project_overview, icon: Building2 },
    { label: "Scope Summary", value: packet.scope_summary, icon: FileText },
    { label: "Design Selections", value: packet.design_selections_notes, icon: FileText },
    { label: "Permit / Technical", value: packet.permit_technical_notes, icon: FileText },
    { label: "Site Logistics", value: packet.site_logistics, icon: MapPin },
    { label: "Inclusions", value: packet.inclusions, icon: CheckCircle2 },
    { label: "Exclusions", value: packet.exclusions, icon: X },
    { label: "Assumptions", value: packet.assumptions, icon: FileText },
  ].filter(s => s.value);

  return (
    <ContractorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="mt-0.5" onClick={() => navigate("/contractor/bid-packets")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{packet.title}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                {deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Deadline: {format(new Date(deadline), "MMM d, yyyy h:mm a")}
                  </span>
                )}
                {packet.estimated_budget_min && packet.estimated_budget_max && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    ${(packet.estimated_budget_min / 1000).toFixed(0)}k–${(packet.estimated_budget_max / 1000).toFixed(0)}k
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge variant={statusConfig.variant} className="gap-1">
            {statusConfig.label}
          </Badge>
        </div>

        <DeadlineHeader deadline={deadline} />

        {/* Revision Banner */}
        {isRevisionRequested && (
          <RevisionBanner
            revisionNotes={(existingSubmission as any)?.revision_request_notes}
            revisionRequestedAt={(existingSubmission as any)?.revision_requested_at}
            revisionCount={(existingSubmission as any)?.revision_count || 0}
          />
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="scope">Project Scope</TabsTrigger>
            <TabsTrigger value="trades">Trades & Line Items</TabsTrigger>
            <TabsTrigger value="bid">
              Your Bid
              {canSubmit && !isSubmitted && bidCompleteness < 100 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{bidCompleteness}%</Badge>
              )}
              {isRevisionRequested && (
                <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5">!</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="clarifications" className="gap-1">
              Clarifications
              {clarificationCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{clarificationCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          {/* Scope Tab */}
          <TabsContent value="scope">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopeSections.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No scope details have been provided yet.
                  </CardContent>
                </Card>
              ) : (
                scopeSections.map(s => <ScopeSection key={s.label} {...s} />)
              )}
            </div>
            {packet.bid_instructions && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> Bid Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{packet.bid_instructions}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades">
            {tradeSections.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No trade sections defined for this bid packet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tradeSections.map((section: any) => (
                  <Card key={section.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{section.trade}</CardTitle>
                        {section.allowance_amount && (
                          <Badge variant="outline" className="text-xs">
                            Allowance: ${Number(section.allowance_amount).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      {section.scope_notes && <CardDescription className="text-xs">{section.scope_notes}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      {section.inclusions && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground">Inclusions</p>
                          <p className="text-sm">{section.inclusions}</p>
                        </div>
                      )}
                      {section.exclusions && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground">Exclusions</p>
                          <p className="text-sm">{section.exclusions}</p>
                        </div>
                      )}
                      {section.bid_packet_line_items?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {section.bid_packet_line_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm p-1.5 rounded bg-muted/50">
                              <span>{item.description}</span>
                              <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bid Tab */}
          <TabsContent value="bid">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Bid</CardTitle>
                      <CardDescription>
                        {isRevisionRequested
                          ? "A revision has been requested. Update your bid and resubmit."
                          : isSubmitted
                            ? "Your bid has been submitted. You'll be notified of the outcome."
                            : deadlinePassed
                              ? "The deadline has passed."
                              : "Complete the fields below and submit your bid."}
                      </CardDescription>
                    </div>
                    {canSubmit && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{bidCompleteness}%</span>
                        <Progress value={bidCompleteness} className="w-20 h-2" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Core bid fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Bid Amount</Label>
                      <Input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} disabled={!canSubmit} placeholder="0.00" className="text-lg font-semibold" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Estimated Timeline</Label>
                      <Input value={estimatedTimeline} onChange={(e) => setEstimatedTimeline(e.target.value)} disabled={!canSubmit} placeholder="e.g. 8-10 weeks" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Proposed Start</Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={!canSubmit} />
                    </div>
                  </div>

                  {/* Confirmations */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Scope Confirmations</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2 p-3 border rounded-lg">
                        <Checkbox checked={scopeConfirmed} onCheckedChange={(v) => setScopeConfirmed(!!v)} disabled={!canSubmit} id="scope" />
                        <div>
                          <Label htmlFor="scope" className="text-sm font-medium cursor-pointer">Scope Confirmed</Label>
                          <p className="text-xs text-muted-foreground">I have reviewed and confirm the scope of work</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 border rounded-lg">
                        <Checkbox checked={permitIncluded} onCheckedChange={(v) => setPermitIncluded(!!v)} disabled={!canSubmit} id="permit" />
                        <div>
                          <Label htmlFor="permit" className="text-sm font-medium cursor-pointer">Permits Included</Label>
                          <p className="text-xs text-muted-foreground">My bid includes permit costs</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 border rounded-lg">
                        <Checkbox checked={engineeringRequired} onCheckedChange={(v) => setEngineeringRequired(!!v)} disabled={!canSubmit} id="eng" />
                        <div>
                          <Label htmlFor="eng" className="text-sm font-medium cursor-pointer">Engineering Required</Label>
                          <p className="text-xs text-muted-foreground">Structural or MEP engineering needed</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 border rounded-lg">
                        <Checkbox checked={materialsOwnerSupplied} onCheckedChange={(v) => setMaterialsOwnerSupplied(!!v)} disabled={!canSubmit} id="mat" />
                        <div>
                          <Label htmlFor="mat" className="text-sm font-medium cursor-pointer">Owner-Supplied Materials</Label>
                          <p className="text-xs text-muted-foreground">Some materials will be provided by the homeowner</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proposal */}
                  <div className="space-y-1.5">
                    <Label>Proposal / Cover Letter</Label>
                    <Textarea value={proposalText} onChange={(e) => setProposalText(e.target.value)} disabled={!canSubmit} rows={5} placeholder="Describe your approach, qualifications, relevant experience, and value proposition..." />
                  </div>

                  {/* Clarifications & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Clarifications & Assumptions</Label>
                      <Textarea value={clarifications} onChange={(e) => setClarifications(e.target.value)} disabled={!canSubmit} rows={3} placeholder="Any clarifications, assumptions, or conditions..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Additional Notes</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!canSubmit} rows={3} placeholder="Additional notes for the project team..." />
                    </div>
                  </div>

                  {/* Actions */}
                  {canSubmit && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {isRevisionRequested ? "Update your bid and resubmit." : existingSubmission ? "You have a saved draft." : "Complete your bid and submit before the deadline."}
                      </p>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => saveBid.mutate("draft")} disabled={saveBid.isPending}>
                          <Save className="mr-2 h-4 w-4" /> Save Draft
                        </Button>
                        <Button onClick={() => setShowSubmitConfirm(true)} disabled={saveBid.isPending || !bidAmount || !scopeConfirmed}>
                          {isRevisionRequested ? (
                            <><RotateCcw className="mr-2 h-4 w-4" /> Resubmit Bid</>
                          ) : (
                            <><Send className="mr-2 h-4 w-4" /> Submit Bid</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {isSubmitted && existingSubmission && (
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="font-medium">Bid Submitted</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="font-semibold">${Number(existingSubmission.bid_amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Timeline</p>
                          <p>{existingSubmission.estimated_timeline || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted</p>
                          <p>{format(new Date(existingSubmission.submitted_at), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submission History */}
              {existingSubmission?.id && (
                <SubmissionHistory submissionId={existingSubmission.id} />
              )}
            </div>
          </TabsContent>

          {/* Clarifications Tab */}
          <TabsContent value="clarifications">
            {currentUserId ? (
              <ClarificationThread packetId={packetId!} currentUserId={currentUserId} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" /> File Attachments
                </CardTitle>
                <CardDescription>Upload supporting documents, estimates, or relevant files.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const att = existingSubmission?.attachments as any;
                  const existingFiles = att?.file_urls || [];
                  if (existingFiles.length > 0) {
                    return (
                      <div className="space-y-2">
                        <Label className="text-sm">Uploaded Files</Label>
                        {existingFiles.map((url: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2 border rounded">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">{url.split("/").pop()}</a>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}

                {canSubmit && (
                  <>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">{isDragActive ? "Drop files here..." : "Drag & drop files, or click to browse"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Max 10MB per file • Up to 5 files</p>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-1.5">
                        {uploadedFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm truncate">{f.name}</span>
                              <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => saveBid.mutate("draft")} disabled={saveBid.isPending}>
                          <Save className="mr-1 h-3 w-3" /> Save Files to Draft
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {!canSubmit && !((existingSubmission?.attachments as any)?.file_urls?.length) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No files attached.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRevisionRequested ? "Confirm Bid Resubmission" : "Confirm Bid Submission"}</DialogTitle>
            <DialogDescription>
              {isRevisionRequested
                ? "Your revised bid will replace the previous submission."
                : "Once submitted, your bid cannot be modified. Please review your details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Bid Amount</p>
                <p className="font-bold text-lg">${Number(bidAmount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Timeline</p>
                <p>{estimatedTimeline || "Not specified"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p>{startDate ? format(new Date(startDate), "MMM d, yyyy") : "Not specified"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scope Confirmed</p>
                <p>{scopeConfirmed ? "Yes" : "No"}</p>
              </div>
            </div>
            {!scopeConfirmed && (
              <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" /> You must confirm the scope before submitting.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
            <Button onClick={() => saveBid.mutate("submitted")} disabled={saveBid.isPending || !scopeConfirmed}>
              {saveBid.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRevisionRequested ? (
                <><RotateCcw className="mr-2 h-4 w-4" /> Confirm Resubmission</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Confirm & Submit</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContractorLayout>
  );
}
