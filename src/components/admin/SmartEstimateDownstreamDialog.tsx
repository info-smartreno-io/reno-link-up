import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, Package, Palette, ArrowRight, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: any;
  sections: any[];
  rooms: any[];
  tradeItems: any[];
}

type TargetWorkflow = "design_package" | "bid_packet";
type DialogStep = "choose" | "duplicate_detected" | "preview_create" | "preview_update" | "duplicate_override" | "success";

// Workflow order for guarded status updates
const WORKFLOW_ORDER = [
  "intake_submitted", "payment_confirmed", "estimator_scheduled", "site_visit_complete",
  "smart_estimate_in_progress", "smart_estimate_review",
  "design_package_in_progress", "design_package_review", "design_package_approved",
  "bid_packet_generated", "rfp_ready", "rfp_out", "bidding_closed",
  "contractor_selected", "project_in_progress", "project_complete",
];

const DESIGN_PREVIEW_FIELDS = [
  { key: "project_overview", label: "Project Overview" },
  { key: "existing_conditions", label: "Existing Conditions" },
  { key: "design_direction", label: "Design Direction (Seed Notes)" },
  { key: "permit_technical", label: "Permit / Technical" },
  { key: "contractor_handoff", label: "Contractor Handoff" },
  { key: "room_scope", label: "Room Scope Summary" },
];

const BID_PREVIEW_FIELDS = [
  { key: "project_overview", label: "Project Overview" },
  { key: "scope_summary", label: "Scope Summary" },
  { key: "permit_technical_notes", label: "Permit / Technical Notes" },
  { key: "site_logistics", label: "Site Logistics" },
  { key: "assumptions", label: "Assumptions" },
];

function canAdvanceStatus(currentStatus: string | null, newStatus: string): boolean {
  if (!currentStatus) return true;
  const currentIdx = WORKFLOW_ORDER.indexOf(currentStatus);
  const newIdx = WORKFLOW_ORDER.indexOf(newStatus);
  if (currentIdx === -1) return true;
  return newIdx > currentIdx;
}

export function SmartEstimateDownstreamDialog({ open, onOpenChange, estimate, sections, rooms, tradeItems }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<DialogStep>("choose");
  const [target, setTarget] = useState<TargetWorkflow | null>(null);
  const [preview, setPreview] = useState<Record<string, string>>({});
  const [overwriteFields, setOverwriteFields] = useState<Record<string, boolean>>({});
  const [existingRecord, setExistingRecord] = useState<any>(null);
  const [existingCurrentValues, setExistingCurrentValues] = useState<Record<string, string>>({});
  const [overrideReason, setOverrideReason] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setStep("choose");
      setTarget(null);
      setPreview({});
      setOverwriteFields({});
      setExistingRecord(null);
      setExistingCurrentValues({});
      setOverrideReason("");
    }
  }, [open]);

  // ---- Helpers ----
  const getSectionContent = (key: string): string => {
    const sec = sections.find((s: any) => s.section_key === key);
    if (!sec?.section_data) return "";
    const data = sec.section_data as any;
    return typeof data === "string" ? data : (data?.content || "");
  };

  const buildRoomSummary = (): string => {
    if (rooms.length === 0) return "";
    return rooms.map((r: any) =>
      `**${r.room_name}**${r.square_footage ? ` (${r.square_footage} sq ft)` : ""}${r.notes ? `\n${r.notes}` : ""}`
    ).join("\n\n");
  };

  const buildTradeSummary = (): string => {
    if (tradeItems.length === 0) return "";
    const grouped: Record<string, any[]> = {};
    for (const item of tradeItems) {
      const cat = item.trade_category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }
    return Object.entries(grouped).map(([cat, items]) =>
      `### ${cat}\n${items.map((i: any) => `- ${i.line_item_name}: ${i.scope_description || ""} (${i.quantity} ${i.unit})`).join("\n")}`
    ).join("\n\n");
  };

  const buildMappedPreview = (t: TargetWorkflow): Record<string, string> => {
    if (t === "design_package") {
      return {
        existing_conditions: getSectionContent("existing_conditions"),
        design_direction: [getSectionContent("budget_guidance"), getSectionContent("materials_allowances")].filter(Boolean).join("\n\n"),
        permit_technical: getSectionContent("permit_technical"),
        contractor_handoff: [getSectionContent("contractor_estimate_basis"), buildTradeSummary()].filter(Boolean).join("\n\n"),
        project_overview: getSectionContent("project_overview"),
        room_scope: buildRoomSummary(),
      };
    }
    return {
      project_overview: [getSectionContent("project_overview"), getSectionContent("existing_conditions")].filter(Boolean).join("\n\n"),
      scope_summary: [getSectionContent("contractor_estimate_basis"), getSectionContent("trade_scope"), buildTradeSummary()].filter(Boolean).join("\n\n"),
      permit_technical_notes: getSectionContent("permit_technical"),
      site_logistics: getSectionContent("site_logistics"),
      assumptions: [getSectionContent("materials_allowances"), getSectionContent("budget_guidance")].filter(Boolean).join("\n\n"),
    };
  };

  const buildMappingSnapshot = (strategy: string, fieldsMapped: string[]) => ({
    smart_estimate_id: estimate.id,
    mapped_at: new Date().toISOString(),
    mapped_by: null as string | null, // set during mutation
    target_type: target,
    fields_mapped: fieldsMapped,
    strategy,
    source_section_keys: sections.map((s: any) => s.section_key),
    room_count: rooms.length,
    trade_item_count: tradeItems.length,
  });

  // ---- Duplicate Detection ----
  const findExistingDesignPackages = async () => {
    const conditions: any[] = [];
    // By source_smart_estimate_id
    const { data: bySource } = await supabase
      .from("design_packages")
      .select("*")
      .eq("source_smart_estimate_id", estimate.id)
      .neq("package_status", "archived");
    if (bySource?.length) conditions.push(...bySource);

    // By project_id (avoid duplicates)
    if (estimate.project_id) {
      const { data: byProject } = await supabase
        .from("design_packages")
        .select("*")
        .eq("project_id", estimate.project_id)
        .neq("package_status", "archived");
      if (byProject?.length) {
        const ids = new Set(conditions.map((c: any) => c.id));
        conditions.push(...byProject.filter((p: any) => !ids.has(p.id)));
      }
    }
    return conditions;
  };

  const findExistingBidPackets = async () => {
    const conditions: any[] = [];
    const { data: bySource } = await supabase
      .from("bid_packets")
      .select("*")
      .eq("source_smart_estimate_id", estimate.id)
      .neq("status", "archived");
    if (bySource?.length) conditions.push(...bySource);

    if (estimate.project_id) {
      const { data: byProject } = await supabase
        .from("bid_packets")
        .select("*")
        .eq("project_id", estimate.project_id)
        .neq("status", "archived");
      if (byProject?.length) {
        const ids = new Set(conditions.map((c: any) => c.id));
        conditions.push(...byProject.filter((p: any) => !ids.has(p.id)));
      }
    }
    return conditions;
  };

  // ---- Choose Target ----
  const handleChoose = async (t: TargetWorkflow) => {
    setTarget(t);
    const mapped = buildMappedPreview(t);
    setPreview(mapped);

    // Check for duplicates
    const existing = t === "design_package"
      ? await findExistingDesignPackages()
      : await findExistingBidPackets();

    if (existing.length > 0) {
      setExistingRecord(existing[0]);
      // Load current values for update comparison
      if (t === "design_package") {
        const { data: existingSections } = await supabase
          .from("design_package_sections")
          .select("section_key, section_data")
          .eq("design_package_id", existing[0].id);
        const vals: Record<string, string> = {};
        for (const sec of existingSections || []) {
          const d = sec.section_data as any;
          vals[sec.section_key] = typeof d === "string" ? d : (d?.content || "");
        }
        setExistingCurrentValues(vals);
      } else {
        setExistingCurrentValues({
          project_overview: existing[0].project_overview || "",
          scope_summary: existing[0].scope_summary || "",
          permit_technical_notes: existing[0].permit_technical_notes || "",
          site_logistics: existing[0].site_logistics || "",
          assumptions: existing[0].assumptions || "",
        });
      }
      // Default all overwrite toggles to true
      const toggles: Record<string, boolean> = {};
      Object.keys(mapped).forEach(k => { toggles[k] = true; });
      setOverwriteFields(toggles);
      setStep("duplicate_detected");
    } else {
      setStep("preview_create");
    }
  };

  // ---- Guarded project status update ----
  const guardedStatusUpdate = async (newStatus: string) => {
    if (!estimate.project_id) return;
    const { data: project } = await supabase.from("projects").select("status").eq("id", estimate.project_id).single();
    if (project && canAdvanceStatus(project.status, newStatus)) {
      await supabase.from("projects").update({ status: newStatus }).eq("id", estimate.project_id);
    }
  };

  // ---- Logging Helper ----
  const logActions = async (userId: string, actionType: string, details: any, targetId?: string) => {
    await supabase.from("smart_estimate_activity_log").insert({
      smart_estimate_id: estimate.id,
      actor_id: userId,
      actor_role: "admin",
      action_type: actionType,
      action_details: details,
    });
    if (target === "design_package" && targetId) {
      await supabase.from("design_package_activity_log").insert({
        design_package_id: targetId,
        actor_id: userId,
        actor_role: "admin",
        action_type: actionType.replace("downstream_", ""),
        action_details: JSON.stringify(details),
      });
    }
  };

  // ---- CREATE NEW ----
  const createNewMutation = useMutation({
    mutationFn: async (isOverride: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const snapshot = buildMappingSnapshot(isOverride ? "duplicate_override" : "created_new", Object.keys(preview));
      snapshot.mapped_by = user.id;

      if (target === "design_package") {
        const { data: pkg, error } = await supabase.from("design_packages").insert({
          project_id: estimate.project_id,
          lead_id: estimate.lead_id,
          package_status: "draft",
          assigned_estimator_id: estimate.assigned_estimator_id,
          source_smart_estimate_id: estimate.id,
          source_type: "smart_estimate",
          source_mapping_snapshot: snapshot,
          last_synced_from_smart_estimate_at: new Date().toISOString(),
        }).select().single();
        if (error) throw error;

        const sectionInserts = Object.entries(preview).map(([key, content]) => ({
          design_package_id: pkg.id,
          section_key: key,
          section_data: { content },
          contractor_visible: key !== "room_scope",
          homeowner_visible: false,
          internal_only: false,
        }));
        await supabase.from("design_package_sections").insert(sectionInserts);
        await guardedStatusUpdate("design_package_in_progress");

        const actionType = isOverride ? "downstream_design_package_duplicate_override" : "downstream_design_package_created";
        await logActions(user.id, actionType, {
          design_package_id: pkg.id,
          fields_mapped: Object.keys(preview),
          ...(isOverride ? { override_reason: overrideReason } : {}),
        }, pkg.id);

        return { id: pkg.id, type: "Design Package" };
      } else {
        // Bid packet
        let workspaceId: string | null = null;
        if (estimate.lead_id) {
          const { data: ws } = await supabase.from("estimate_workspaces").select("id").eq("lead_id", estimate.lead_id).limit(1).single();
          if (ws) { workspaceId = ws.id; }
          else {
            const { data: newWs, error: wsErr } = await supabase.from("estimate_workspaces").insert({ lead_id: estimate.lead_id, status: "active" }).select().single();
            if (wsErr) throw wsErr;
            workspaceId = newWs.id;
          }
        }
        if (!estimate.lead_id || !workspaceId) throw new Error("Cannot resolve lead or workspace.");

        const { data: packet, error } = await supabase.from("bid_packets").insert({
          lead_id: estimate.lead_id,
          workspace_id: workspaceId,
          project_id: estimate.project_id,
          title: `Bid Packet — Smart Estimate ${estimate.id.slice(0, 8)}`,
          project_overview: preview.project_overview || "",
          scope_summary: preview.scope_summary || "",
          permit_technical_notes: preview.permit_technical_notes || "",
          site_logistics: preview.site_logistics || "",
          assumptions: preview.assumptions || "",
          generated_from_design_package: false,
          generated_at: new Date().toISOString(),
          generated_by: user.id,
          status: "draft",
          source_smart_estimate_id: estimate.id,
          source_type: "smart_estimate",
          source_mapping_snapshot: snapshot,
          last_synced_from_smart_estimate_at: new Date().toISOString(),
        }).select().single();
        if (error) throw error;

        await guardedStatusUpdate("bid_packet_generated");
        const actionType = isOverride ? "downstream_bid_packet_duplicate_override" : "downstream_bid_packet_created";
        await logActions(user.id, actionType, {
          bid_packet_id: packet.id,
          fields_mapped: Object.keys(preview),
          ...(isOverride ? { override_reason: overrideReason } : {}),
        });

        return { id: packet.id, type: "Bid Packet" };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["smart-estimate"] });
      queryClient.invalidateQueries({ queryKey: ["linked-downstream"] });
      setSuccessMsg(`${result.type} created (${result.id.slice(0, 8)}).`);
      setStep("success");
      toast.success(`${result.type} created from Smart Estimate`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // ---- UPDATE EXISTING ----
  const updateExistingMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fieldsMapped = Object.entries(overwriteFields).filter(([, v]) => v).map(([k]) => k);
      const snapshot = buildMappingSnapshot("updated_existing", fieldsMapped);
      snapshot.mapped_by = user.id;

      if (target === "design_package") {
        // Update each selected section
        for (const [key, shouldOverwrite] of Object.entries(overwriteFields)) {
          if (!shouldOverwrite) continue;
          // Upsert section
          const { data: existing } = await supabase
            .from("design_package_sections")
            .select("id")
            .eq("design_package_id", existingRecord.id)
            .eq("section_key", key)
            .maybeSingle();
          if (existing) {
            await supabase.from("design_package_sections").update({ section_data: { content: preview[key] } }).eq("id", existing.id);
          } else {
            await supabase.from("design_package_sections").insert({
              design_package_id: existingRecord.id,
              section_key: key,
              section_data: { content: preview[key] },
              contractor_visible: key !== "room_scope",
              homeowner_visible: false,
              internal_only: false,
            });
          }
        }
        await supabase.from("design_packages").update({
          source_smart_estimate_id: estimate.id,
          source_type: "smart_estimate",
          source_mapping_snapshot: snapshot,
          last_synced_from_smart_estimate_at: new Date().toISOString(),
        }).eq("id", existingRecord.id);
        await guardedStatusUpdate("design_package_in_progress");
        await logActions(user.id, "downstream_design_package_updated", { design_package_id: existingRecord.id, fields_updated: fieldsMapped }, existingRecord.id);
        return { id: existingRecord.id, type: "Design Package" };
      } else {
        // Bid packet field-level update
        const updates: Record<string, any> = {
          source_smart_estimate_id: estimate.id,
          source_type: "smart_estimate",
          source_mapping_snapshot: snapshot,
          last_synced_from_smart_estimate_at: new Date().toISOString(),
        };
        for (const [key, shouldOverwrite] of Object.entries(overwriteFields)) {
          if (shouldOverwrite) updates[key] = preview[key] || "";
        }
        await supabase.from("bid_packets").update(updates).eq("id", existingRecord.id);
        await guardedStatusUpdate("bid_packet_generated");
        await logActions(user.id, "downstream_bid_packet_updated", { bid_packet_id: existingRecord.id, fields_updated: fieldsMapped });
        return { id: existingRecord.id, type: "Bid Packet" };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["smart-estimate"] });
      queryClient.invalidateQueries({ queryKey: ["linked-downstream"] });
      setSuccessMsg(`${result.type} updated with latest Smart Estimate data.`);
      setStep("success");
      toast.success(`${result.type} updated`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isPending = createNewMutation.isPending || updateExistingMutation.isPending;
  const fields = target === "design_package" ? DESIGN_PREVIEW_FIELDS : BID_PREVIEW_FIELDS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" /> Downstream Workflow
          </DialogTitle>
          <DialogDescription>
            Push approved Smart Estimate data into a Design Package or Bid Packet.
          </DialogDescription>
        </DialogHeader>

        {/* Step: Choose Target */}
        {step === "choose" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {sections.filter((s: any) => s.is_complete).length}/{sections.length} sections complete, {rooms.length} rooms, {tradeItems.length} trade items.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleChoose("design_package")}>
                <CardContent className="pt-6 text-center space-y-3">
                  <Palette className="h-10 w-10 mx-auto text-primary" />
                  <h3 className="font-semibold">Create Design Package</h3>
                  <p className="text-xs text-muted-foreground">For projects requiring design review.</p>
                  <Badge>Requires Design Workflow</Badge>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleChoose("bid_packet")}>
                <CardContent className="pt-6 text-center space-y-3">
                  <Package className="h-10 w-10 mx-auto text-primary" />
                  <h3 className="font-semibold">Generate Bid Packet Inputs</h3>
                  <p className="text-xs text-muted-foreground">Maps data directly into bid packet fields.</p>
                  <Badge variant="secondary">Direct to RFP</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Duplicate Detected */}
        {step === "duplicate_detected" && existingRecord && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Existing {target === "design_package" ? "Design Package" : "Bid Packet"} Found
              </p>
            </div>

            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ID</span>
                  <code className="text-xs text-muted-foreground">{existingRecord.id.slice(0, 12)}…</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="outline">{existingRecord.package_status || existingRecord.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(existingRecord.created_at), "MMM d, yyyy")}</span>
                </div>
                {existingRecord.source_smart_estimate_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Source</span>
                    <Badge variant="secondary" className="text-xs">From Smart Estimate</Badge>
                  </div>
                )}
                {existingRecord.last_synced_from_smart_estimate_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Synced</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(existingRecord.last_synced_from_smart_estimate_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">This may create conflicting downstream records. Choose an action:</p>

            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="justify-start" onClick={() => {
                const path = target === "design_package"
                  ? `/admin/design-packages/${existingRecord.id}`
                  : `/admin/bid-packets/${existingRecord.id}`;
                navigate(path);
                onOpenChange(false);
              }}>
                <ExternalLink className="h-4 w-4 mr-2" /> Open Existing {target === "design_package" ? "Design Package" : "Bid Packet"}
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => setStep("preview_update")}>
                <RefreshCw className="h-4 w-4 mr-2" /> Update Existing with Smart Estimate Data
              </Button>
              <Button variant="outline" className="justify-start text-amber-700 dark:text-amber-400" onClick={() => setStep("duplicate_override")}>
                <AlertTriangle className="h-4 w-4 mr-2" /> Create New Anyway (Duplicate)
              </Button>
            </div>

            <Button variant="ghost" onClick={() => { setStep("choose"); setTarget(null); }}>Cancel</Button>
          </div>
        )}

        {/* Step: Preview Create (no existing) */}
        {step === "preview_create" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary">{target === "design_package" ? "Design Package" : "Bid Packet"}</Badge>
              <span className="text-sm text-muted-foreground">Review and edit mapped content before creating.</span>
            </div>
            {fields.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-medium">{label}</Label>
                <Textarea value={preview[key] || ""} onChange={(e) => setPreview(prev => ({ ...prev, [key]: e.target.value }))} rows={3} placeholder={`${label}…`} />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setStep("choose"); setTarget(null); }}>Back</Button>
              <Button onClick={() => createNewMutation.mutate(false)} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create {target === "design_package" ? "Design Package" : "Bid Packet"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Preview Update Existing */}
        {step === "preview_update" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1" /> Update Existing</Badge>
              <span className="text-sm text-muted-foreground">Select fields to overwrite. Unselected fields are preserved.</span>
            </div>
            {fields.map(({ key, label }) => {
              const currentVal = existingCurrentValues[key] || "";
              const newVal = preview[key] || "";
              const isChecked = overwriteFields[key] ?? false;
              return (
                <Card key={key} className={isChecked ? "border-primary" : ""}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isChecked} onCheckedChange={(v) => setOverwriteFields(prev => ({ ...prev, [key]: !!v }))} />
                      <Label className="text-sm font-medium">{label}</Label>
                      {currentVal !== newVal && <Badge variant="outline" className="text-xs">Changed</Badge>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                        <div className="text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap">
                          {currentVal || <span className="italic text-muted-foreground">Empty</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">New (Smart Estimate)</p>
                        <Textarea className="text-xs" value={newVal} onChange={(e) => setPreview(prev => ({ ...prev, [key]: e.target.value }))} rows={3} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("duplicate_detected")}>Back</Button>
              <Button onClick={() => updateExistingMutation.mutate()} disabled={isPending || !Object.values(overwriteFields).some(Boolean)}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update {Object.values(overwriteFields).filter(Boolean).length} Fields
              </Button>
            </div>
          </div>
        )}

        {/* Step: Duplicate Override Confirmation */}
        {step === "duplicate_override" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Duplicate Override Required</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">An existing record was found. Provide a reason to create a duplicate.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Override Reason (required)</Label>
              <Textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows={3} placeholder="Explain why a duplicate record is needed…" />
            </div>
            {fields.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-medium">{label}</Label>
                <Textarea value={preview[key] || ""} onChange={(e) => setPreview(prev => ({ ...prev, [key]: e.target.value }))} rows={2} />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("duplicate_detected")}>Back</Button>
              <Button variant="destructive" onClick={() => createNewMutation.mutate(true)} disabled={isPending || !overrideReason.trim()}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Duplicate
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <h3 className="text-lg font-bold">Success</h3>
            <p className="text-sm text-muted-foreground text-center">{successMsg}</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
