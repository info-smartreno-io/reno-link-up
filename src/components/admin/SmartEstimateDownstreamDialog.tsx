import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

type TargetWorkflow = "design_package" | "bid_packet";
type DialogStep = "choose" | "duplicate_detected" | "preview_create" | "preview_update" | "duplicate_override" | "success";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: any;
  sections: any[];
  rooms: any[];
  tradeItems: any[];
  /** Direct-entry: skip choose step, jump to sync for this target */
  initialTarget?: TargetWorkflow | null;
  /** Direct-entry: the specific record to update */
  initialExistingRecord?: any | null;
}

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

export function SmartEstimateDownstreamDialog({
  open, onOpenChange, estimate, sections, rooms, tradeItems,
  initialTarget = null, initialExistingRecord = null,
}: Props) {
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
  const [directSyncMode, setDirectSyncMode] = useState(false);

  // ---- Helpers ----
  const getSectionContent = useCallback((key: string): string => {
    const sec = sections.find((s: any) => s.section_key === key);
    if (!sec?.section_data) return "";
    const data = sec.section_data as any;
    return typeof data === "string" ? data : (data?.content || "");
  }, [sections]);

  const buildRoomSummary = useCallback((): string => {
    if (rooms.length === 0) return "";
    return rooms.map((r: any) =>
      `**${r.room_name}**${r.square_footage ? ` (${r.square_footage} sq ft)` : ""}${r.notes ? `\n${r.notes}` : ""}`
    ).join("\n\n");
  }, [rooms]);

  const buildTradeSummary = useCallback((): string => {
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
  }, [tradeItems]);

  const buildMappedPreview = useCallback((t: TargetWorkflow): Record<string, string> => {
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
  }, [getSectionContent, buildRoomSummary, buildTradeSummary]);

  /** Compute intelligent overwrite defaults: only check fields that actually differ */
  const computeIntelligentToggles = (mapped: Record<string, string>, currentVals: Record<string, string>): Record<string, boolean> => {
    const toggles: Record<string, boolean> = {};
    for (const key of Object.keys(mapped)) {
      const newVal = (mapped[key] || "").trim();
      const curVal = (currentVals[key] || "").trim();
      if (!newVal) {
        toggles[key] = false; // new value empty → don't overwrite
      } else if (!curVal && newVal) {
        toggles[key] = true; // downstream empty, estimate has content → overwrite
      } else if (curVal !== newVal) {
        toggles[key] = true; // values differ → overwrite
      } else {
        toggles[key] = false; // same → skip
      }
    }
    return toggles;
  };

  /** Load current values for an existing downstream record */
  const loadCurrentValues = async (t: TargetWorkflow, record: any): Promise<Record<string, string>> => {
    if (t === "design_package") {
      const { data: existingSections } = await supabase
        .from("design_package_sections")
        .select("section_key, section_data")
        .eq("design_package_id", record.id);
      const vals: Record<string, string> = {};
      for (const sec of existingSections || []) {
        const d = sec.section_data as any;
        vals[sec.section_key] = typeof d === "string" ? d : (d?.content || "");
      }
      return vals;
    }
    return {
      project_overview: record.project_overview || "",
      scope_summary: record.scope_summary || "",
      permit_technical_notes: record.permit_technical_notes || "",
      site_logistics: record.site_logistics || "",
      assumptions: record.assumptions || "",
    };
  };

  // ---- Direct-entry initialization ----
  useEffect(() => {
    if (!open) {
      setStep("choose");
      setTarget(null);
      setPreview({});
      setOverwriteFields({});
      setExistingRecord(null);
      setExistingCurrentValues({});
      setOverrideReason("");
      setDirectSyncMode(false);
      return;
    }

    // If direct-entry props are provided, jump straight to preview_update
    if (initialTarget && initialExistingRecord) {
      const initDirectSync = async () => {
        setDirectSyncMode(true);
        setTarget(initialTarget);
        setExistingRecord(initialExistingRecord);

        const mapped = buildMappedPreview(initialTarget);
        setPreview(mapped);

        const currentVals = await loadCurrentValues(initialTarget, initialExistingRecord);
        setExistingCurrentValues(currentVals);
        setOverwriteFields(computeIntelligentToggles(mapped, currentVals));
        setStep("preview_update");

        // Log sync opened
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("smart_estimate_activity_log").insert({
            smart_estimate_id: estimate.id,
            actor_id: user.id,
            actor_role: "admin",
            action_type: "downstream_sync_opened",
            action_details: {
              target_type: initialTarget,
              target_id: initialExistingRecord.id,
              sync_mode: "direct_sync",
            },
          });
        }
      };
      initDirectSync();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTarget, initialExistingRecord]);

  const buildMappingSnapshot = (strategy: string, fieldsMapped: string[], syncMode = "update_existing", overrideReason?: string) => ({
    smart_estimate_id: estimate.id,
    mapped_at: new Date().toISOString(),
    mapped_by: null as string | null,
    target_type: target,
    fields_mapped: fieldsMapped,
    strategy,
    sync_mode: syncMode,
    source_section_keys: sections.map((s: any) => s.section_key),
    room_count: rooms.length,
    trade_item_count: tradeItems.length,
    ...(overrideReason ? { duplicate_override_reason: overrideReason } : {}),
  });

  // ---- Duplicate Detection (for non-direct flows) ----
  const findExistingDesignPackages = async () => {
    const conditions: any[] = [];
    const { data: bySource } = await supabase.from("design_packages").select("*").eq("source_smart_estimate_id", estimate.id).neq("package_status", "archived");
    if (bySource?.length) conditions.push(...bySource);
    if (estimate.project_id) {
      const { data: byProject } = await supabase.from("design_packages").select("*").eq("project_id", estimate.project_id).neq("package_status", "archived");
      if (byProject?.length) { const ids = new Set(conditions.map((c: any) => c.id)); conditions.push(...byProject.filter((p: any) => !ids.has(p.id))); }
    }
    return conditions;
  };

  const findExistingBidPackets = async () => {
    const conditions: any[] = [];
    const { data: bySource } = await supabase.from("bid_packets").select("*").eq("source_smart_estimate_id", estimate.id).neq("status", "archived");
    if (bySource?.length) conditions.push(...bySource);
    if (estimate.project_id) {
      const { data: byProject } = await supabase.from("bid_packets").select("*").eq("project_id", estimate.project_id).neq("status", "archived");
      if (byProject?.length) { const ids = new Set(conditions.map((c: any) => c.id)); conditions.push(...byProject.filter((p: any) => !ids.has(p.id))); }
    }
    return conditions;
  };

  const handleChoose = async (t: TargetWorkflow) => {
    setTarget(t);
    const mapped = buildMappedPreview(t);
    setPreview(mapped);

    const existing = t === "design_package" ? await findExistingDesignPackages() : await findExistingBidPackets();
    if (existing.length > 0) {
      setExistingRecord(existing[0]);
      const currentVals = await loadCurrentValues(t, existing[0]);
      setExistingCurrentValues(currentVals);
      setOverwriteFields(computeIntelligentToggles(mapped, currentVals));
      setStep("duplicate_detected");
    } else {
      setStep("preview_create");
    }
  };

  const guardedStatusUpdate = async (newStatus: string) => {
    if (!estimate.project_id) return;
    const { data: project } = await supabase.from("projects").select("status").eq("id", estimate.project_id).single();
    if (project && canAdvanceStatus(project.status, newStatus)) {
      await supabase.from("projects").update({ status: newStatus }).eq("id", estimate.project_id);
    }
  };

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
    // Bid packet activity logging
    if (target === "bid_packet" && targetId) {
      await supabase.from("smart_estimate_activity_log").insert({
        smart_estimate_id: estimate.id,
        actor_id: userId,
        actor_role: "admin",
        action_type: `bid_packet_${actionType.replace("downstream_bid_packet_", "")}`,
        action_details: { ...details, logged_for: "bid_packet_audit" },
      });
    }
  };

  // ---- CREATE NEW ----
  const createNewMutation = useMutation({
    mutationFn: async (isOverride: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const snapshot = buildMappingSnapshot(isOverride ? "duplicate_override" : "created_new", Object.keys(preview), "created_new");
      snapshot.mapped_by = user.id;

      if (target === "design_package") {
        const { data: pkg, error } = await supabase.from("design_packages").insert({
          project_id: estimate.project_id, lead_id: estimate.lead_id, package_status: "draft",
          assigned_estimator_id: estimate.assigned_estimator_id,
          source_smart_estimate_id: estimate.id, source_type: "smart_estimate",
          source_mapping_snapshot: snapshot, last_synced_from_smart_estimate_at: new Date().toISOString(),
        }).select().single();
        if (error) throw error;

        const sectionInserts = Object.entries(preview).map(([key, content]) => ({
          design_package_id: pkg.id, section_key: key, section_data: { content },
          contractor_visible: key !== "room_scope", homeowner_visible: false, internal_only: false,
        }));
        await supabase.from("design_package_sections").insert(sectionInserts);
        await guardedStatusUpdate("design_package_in_progress");
        await logActions(user.id, isOverride ? "downstream_design_package_duplicate_override" : "downstream_design_package_created", {
          design_package_id: pkg.id, fields_mapped: Object.keys(preview), sync_mode: "created_new",
          target_type: "design_package", target_id: pkg.id,
          overwrite_field_count: Object.keys(preview).filter(k => (preview[k] || "").trim()).length,
          old_values: {}, new_values: Object.fromEntries(Object.entries(preview).filter(([, v]) => (v || "").trim())),
          ...(isOverride ? { duplicate_override_reason: overrideReason } : {}),
        }, pkg.id);
        return { id: pkg.id, type: "Design Package" };
      } else {
        let workspaceId: string | null = null;
        if (estimate.lead_id) {
          const { data: ws } = await supabase.from("estimate_workspaces").select("id").eq("lead_id", estimate.lead_id).limit(1).single();
          if (ws) { workspaceId = ws.id; } else {
            const { data: newWs, error: wsErr } = await supabase.from("estimate_workspaces").insert({ lead_id: estimate.lead_id, status: "active" }).select().single();
            if (wsErr) throw wsErr;
            workspaceId = newWs.id;
          }
        }
        if (!estimate.lead_id || !workspaceId) throw new Error("Cannot resolve lead or workspace.");

        const { data: packet, error } = await supabase.from("bid_packets").insert({
          lead_id: estimate.lead_id, workspace_id: workspaceId, project_id: estimate.project_id,
          title: `Bid Packet — Smart Estimate ${estimate.id.slice(0, 8)}`,
          project_overview: preview.project_overview || "", scope_summary: preview.scope_summary || "",
          permit_technical_notes: preview.permit_technical_notes || "", site_logistics: preview.site_logistics || "",
          assumptions: preview.assumptions || "", generated_from_design_package: false,
          generated_at: new Date().toISOString(), generated_by: user.id, status: "draft",
          source_smart_estimate_id: estimate.id, source_type: "smart_estimate",
          source_mapping_snapshot: snapshot, last_synced_from_smart_estimate_at: new Date().toISOString(),
        }).select().single();
        if (error) throw error;

        await guardedStatusUpdate("bid_packet_generated");
        await logActions(user.id, isOverride ? "downstream_bid_packet_duplicate_override" : "downstream_bid_packet_created", {
          bid_packet_id: packet.id, fields_mapped: Object.keys(preview), sync_mode: "created_new",
          target_type: "bid_packet", target_id: packet.id,
          overwrite_field_count: Object.keys(preview).filter(k => (preview[k] || "").trim()).length,
          old_values: {}, new_values: Object.fromEntries(Object.entries(preview).filter(([, v]) => (v || "").trim())),
          ...(isOverride ? { duplicate_override_reason: overrideReason } : {}),
        });
        return { id: packet.id, type: "Bid Packet" };
      }
    },
    onSuccess: (result) => {
      invalidateAll();
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
      const syncMode = directSyncMode ? "direct_sync" : "update_existing";
      const snapshot = buildMappingSnapshot("updated_existing", fieldsMapped, syncMode);
      snapshot.mapped_by = user.id;

      // Capture old/new diffs for audit — only for checked fields
      const oldValues: Record<string, string> = {};
      const newValues: Record<string, string> = {};
      for (const key of fieldsMapped) {
        oldValues[key] = existingCurrentValues[key] || "";
        newValues[key] = preview[key] || "";
      }

      if (target === "design_package") {
        for (const [key, shouldOverwrite] of Object.entries(overwriteFields)) {
          if (!shouldOverwrite) continue;
          const { data: existing } = await supabase.from("design_package_sections").select("id").eq("design_package_id", existingRecord.id).eq("section_key", key).maybeSingle();
          if (existing) {
            await supabase.from("design_package_sections").update({ section_data: { content: preview[key] } }).eq("id", existing.id);
          } else {
            await supabase.from("design_package_sections").insert({
              design_package_id: existingRecord.id, section_key: key, section_data: { content: preview[key] },
              contractor_visible: key !== "room_scope", homeowner_visible: false, internal_only: false,
            });
          }
        }
        await supabase.from("design_packages").update({
          source_smart_estimate_id: estimate.id, source_type: "smart_estimate",
          source_mapping_snapshot: snapshot, last_synced_from_smart_estimate_at: new Date().toISOString(),
        }).eq("id", existingRecord.id);
        await guardedStatusUpdate("design_package_in_progress");
        await logActions(user.id, "downstream_design_package_updated", {
          design_package_id: existingRecord.id, fields_updated: fieldsMapped,
          overwrite_field_count: fieldsMapped.length, sync_mode: syncMode,
          target_type: "design_package", target_id: existingRecord.id,
          old_values: oldValues, new_values: newValues,
        }, existingRecord.id);
        return { id: existingRecord.id, type: "Design Package", fieldCount: fieldsMapped.length };
      } else {
        const updates: Record<string, any> = {
          source_smart_estimate_id: estimate.id, source_type: "smart_estimate",
          source_mapping_snapshot: snapshot, last_synced_from_smart_estimate_at: new Date().toISOString(),
        };
        for (const [key, shouldOverwrite] of Object.entries(overwriteFields)) {
          if (shouldOverwrite) updates[key] = preview[key] || "";
        }
        await supabase.from("bid_packets").update(updates).eq("id", existingRecord.id);
        await guardedStatusUpdate("bid_packet_generated");
        await logActions(user.id, "downstream_bid_packet_updated", {
          bid_packet_id: existingRecord.id, fields_updated: fieldsMapped,
          overwrite_field_count: fieldsMapped.length, sync_mode: syncMode,
          target_type: "bid_packet", target_id: existingRecord.id,
          old_values: oldValues, new_values: newValues,
        });
        return { id: existingRecord.id, type: "Bid Packet", fieldCount: fieldsMapped.length };
      }
    },
    onSuccess: (result) => {
      invalidateAll();
      setSuccessMsg(`${result.type} updated — ${result.fieldCount} field(s) synced.`);
      setStep("success");
      toast.success(`${result.type} synced from Smart Estimate`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["smart-estimate"] });
    queryClient.invalidateQueries({ queryKey: ["linked-downstream"] });
    queryClient.invalidateQueries({ queryKey: ["smart-estimate-activity"] });
    queryClient.invalidateQueries({ queryKey: ["downstream-sync-history"] });
    queryClient.invalidateQueries({ queryKey: ["downstream-sync-summary"] });
  };

  const isPending = createNewMutation.isPending || updateExistingMutation.isPending;
  const fields = target === "design_package" ? DESIGN_PREVIEW_FIELDS : BID_PREVIEW_FIELDS;
  const changedFieldCount = Object.values(overwriteFields).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {directSyncMode ? <RefreshCw className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
            {directSyncMode ? "Sync Downstream Record" : "Downstream Workflow"}
          </DialogTitle>
          <DialogDescription>
            {directSyncMode
              ? "Review field changes and apply updates from the latest Smart Estimate data."
              : "Push approved Smart Estimate data into a Design Package or Bid Packet."}
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
            <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm font-medium">
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
                {existingRecord.last_synced_from_smart_estimate_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Synced</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(existingRecord.last_synced_from_smart_estimate_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="justify-start" onClick={() => { navigate(target === "design_package" ? `/admin/design-packages/${existingRecord.id}` : `/admin/bid-packets/${existingRecord.id}`); onOpenChange(false); }}>
                <ExternalLink className="h-4 w-4 mr-2" /> Open Existing
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

        {/* Step: Preview Create */}
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

        {/* Step: Preview Update Existing (also used for direct sync) */}
        {step === "preview_update" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1" />
                {directSyncMode ? "Direct Sync" : "Update Existing"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {changedFieldCount > 0
                  ? `${changedFieldCount} field(s) selected for update. Unselected fields are preserved.`
                  : "No changes detected. Toggle fields to overwrite."}
              </span>
            </div>
            {fields.map(({ key, label }) => {
              const currentVal = existingCurrentValues[key] || "";
              const newVal = preview[key] || "";
              const isChecked = overwriteFields[key] ?? false;
              const isDifferent = currentVal.trim() !== newVal.trim();
              return (
                <Card key={key} className={isChecked ? "border-primary" : ""}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isChecked} onCheckedChange={(v) => setOverwriteFields(prev => ({ ...prev, [key]: !!v }))} />
                      <Label className="text-sm font-medium">{label}</Label>
                      {isDifferent && <Badge variant="outline" className="text-xs">Changed</Badge>}
                      {!isDifferent && currentVal && <Badge variant="outline" className="text-xs text-muted-foreground">Identical</Badge>}
                      {!currentVal && newVal && <Badge variant="outline" className="text-xs">New</Badge>}
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
              {!directSyncMode && (
                <Button variant="outline" onClick={() => setStep("duplicate_detected")}>Back</Button>
              )}
              {directSyncMode && (
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              )}
              <Button onClick={() => updateExistingMutation.mutate()} disabled={isPending || changedFieldCount === 0}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {directSyncMode ? `Sync ${changedFieldCount} Field(s)` : `Update ${changedFieldCount} Field(s)`}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Duplicate Override */}
        {step === "duplicate_override" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium">Duplicate Override Required</p>
                <p className="text-xs text-muted-foreground">Provide a reason to create a duplicate.</p>
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
