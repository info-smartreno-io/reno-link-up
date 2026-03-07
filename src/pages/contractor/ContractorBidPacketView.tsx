import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, Save, FileText, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ContractorBidPacketView() {
  const { packetId } = useParams<{ packetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Mark invite as viewed
  useQuery({
    queryKey: ["mark-invite-viewed", packetId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      await (supabase as any)
        .from("bid_packet_contractor_invites")
        .update({ status: "viewed", viewed_at: new Date().toISOString() })
        .eq("bid_packet_id", packetId!)
        .eq("contractor_id", user.id)
        .eq("status", "invited");
      return true;
    },
    enabled: !!packetId,
  });

  // Load existing draft
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
      }
      return data;
    },
    enabled: !!packetId,
  });

  const deadlinePassed = packet?.bid_deadline ? new Date(packet.bid_deadline) < new Date() : false;
  const isSubmitted = existingSubmission?.status === "submitted";
  const canSubmit = !deadlinePassed && !isSubmitted;

  const saveBid = useMutation({
    mutationFn: async (status: "draft" | "submitted") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (status === "submitted" && deadlinePassed) throw new Error("Bid deadline has passed");

      const payload = {
        bid_opportunity_id: packetId!,
        bidder_id: user.id,
        bidder_type: "contractor" as const,
        bid_amount: Number(bidAmount) || 0,
        estimated_timeline: estimatedTimeline || null,
        proposal_text: proposalText || null,
        status,
        submitted_at: new Date().toISOString(),
        attachments: {
          scope_confirmed: scopeConfirmed,
          permit_included: permitIncluded,
          engineering_required: engineeringRequired,
          materials_owner_supplied: materialsOwnerSupplied,
          clarifications,
          notes,
          start_date: startDate,
        },
      };

      if (existingSubmission?.id) {
        const { error } = await supabase.from("bid_submissions").update(payload).eq("id", existingSubmission.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bid_submissions").insert(payload);
        if (error) throw error;
      }

      // Update invite status
      if (status === "submitted") {
        await (supabase as any)
          .from("bid_packet_contractor_invites")
          .update({ status: "submitted", submitted_at: new Date().toISOString() })
          .eq("bid_packet_id", packetId!)
          .eq("contractor_id", user.id);
      }
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["contractor-packet-submission", packetId] });
      toast.success(status === "submitted" ? "Bid submitted successfully!" : "Draft saved");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (packetLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!packet) {
    return <div className="text-center py-20 text-muted-foreground">Bid packet not found or you don't have access.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/contractor/bid-packets")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{packet.title}</h1>
          {packet.bid_deadline && (
            <div className="flex items-center gap-1 text-sm mt-1">
              <Clock className="h-3.5 w-3.5" />
              <span className={deadlinePassed ? "text-destructive font-medium" : "text-muted-foreground"}>
                Deadline: {format(new Date(packet.bid_deadline), "MMM d, yyyy h:mm a")}
                {deadlinePassed && " (CLOSED)"}
              </span>
            </div>
          )}
        </div>
        {isSubmitted && <Badge className="bg-green-100 text-green-800">Submitted</Badge>}
      </div>

      {deadlinePassed && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive font-medium">The bid deadline has passed. Submissions are closed.</p>
        </div>
      )}

      {/* Packet Scope Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Project Overview", value: packet.project_overview, icon: FileText },
          { label: "Scope Summary", value: packet.scope_summary, icon: FileText },
          { label: "Design Selections", value: packet.design_selections_notes, icon: FileText },
          { label: "Permit / Technical", value: packet.permit_technical_notes, icon: FileText },
          { label: "Site Logistics", value: packet.site_logistics, icon: FileText },
          { label: "Inclusions", value: packet.inclusions, icon: FileText },
          { label: "Exclusions", value: packet.exclusions, icon: FileText },
          { label: "Assumptions", value: packet.assumptions, icon: FileText },
        ].filter(s => s.value).map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><s.icon className="h-4 w-4" />{s.label}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground whitespace-pre-line">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Bid Submission Form */}
      <Card>
        <CardHeader><CardTitle>Your Bid</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Bid Amount ($)</Label>
              <Input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} disabled={!canSubmit} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Estimated Timeline</Label>
              <Input value={estimatedTimeline} onChange={(e) => setEstimatedTimeline(e.target.value)} disabled={!canSubmit} placeholder="e.g. 8-10 weeks" />
            </div>
            <div className="space-y-1">
              <Label>Proposed Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={!canSubmit} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={scopeConfirmed} onCheckedChange={(v) => setScopeConfirmed(!!v)} disabled={!canSubmit} />
              <Label className="text-sm">Scope Confirmed</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={permitIncluded} onCheckedChange={(v) => setPermitIncluded(!!v)} disabled={!canSubmit} />
              <Label className="text-sm">Permit Included</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={engineeringRequired} onCheckedChange={(v) => setEngineeringRequired(!!v)} disabled={!canSubmit} />
              <Label className="text-sm">Engineering Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={materialsOwnerSupplied} onCheckedChange={(v) => setMaterialsOwnerSupplied(!!v)} disabled={!canSubmit} />
              <Label className="text-sm">Owner-Supplied Materials</Label>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Proposal / Cover Letter</Label>
            <Textarea value={proposalText} onChange={(e) => setProposalText(e.target.value)} disabled={!canSubmit} rows={4} placeholder="Describe your approach, qualifications, and value proposition..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Clarifications</Label>
              <Textarea value={clarifications} onChange={(e) => setClarifications(e.target.value)} disabled={!canSubmit} rows={3} placeholder="Any clarifications or assumptions..." />
            </div>
            <div className="space-y-1">
              <Label>Additional Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!canSubmit} rows={3} placeholder="Additional notes..." />
            </div>
          </div>

          {canSubmit && (
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => saveBid.mutate("draft")} disabled={saveBid.isPending}>
                <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={() => saveBid.mutate("submitted")} disabled={saveBid.isPending || !bidAmount}>
                {saveBid.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" /> Submit Bid
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
