import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Package, Palette, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: any;
  sections: any[];
  rooms: any[];
  tradeItems: any[];
}

type TargetWorkflow = "design_package" | "bid_packet";

const SECTION_TO_DESIGN: Record<string, string> = {
  existing_conditions: "existing_conditions",
  project_overview: "project_overview",
  permit_technical: "permit_technical",
  contractor_estimate_basis: "contractor_handoff",
  budget_guidance: "design_direction",
  materials_allowances: "selections",
};

const SECTION_TO_BID: Record<string, string> = {
  project_overview: "project_overview",
  existing_conditions: "project_overview",
  contractor_estimate_basis: "scope_summary",
  trade_scope: "scope_summary",
  permit_technical: "permit_technical_notes",
  site_logistics: "site_logistics",
  materials_allowances: "assumptions",
  budget_guidance: "assumptions",
};

export function SmartEstimateDownstreamDialog({ open, onOpenChange, estimate, sections, rooms, tradeItems }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"choose" | "preview" | "success">("choose");
  const [target, setTarget] = useState<TargetWorkflow | null>(null);
  const [preview, setPreview] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  const getSectionContent = (key: string): string => {
    const sec = sections.find(s => s.section_key === key);
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

  const handleChoose = (t: TargetWorkflow) => {
    setTarget(t);
    if (t === "design_package") {
      setPreview({
        existing_conditions: getSectionContent("existing_conditions"),
        design_direction: [getSectionContent("budget_guidance"), getSectionContent("materials_allowances")].filter(Boolean).join("\n\n"),
        permit_technical: getSectionContent("permit_technical"),
        contractor_handoff: [getSectionContent("contractor_estimate_basis"), buildTradeSummary()].filter(Boolean).join("\n\n"),
        project_overview: getSectionContent("project_overview"),
        room_scope: buildRoomSummary(),
      });
    } else {
      setPreview({
        project_overview: [getSectionContent("project_overview"), getSectionContent("existing_conditions")].filter(Boolean).join("\n\n"),
        scope_summary: [getSectionContent("contractor_estimate_basis"), getSectionContent("trade_scope"), buildTradeSummary()].filter(Boolean).join("\n\n"),
        permit_technical_notes: getSectionContent("permit_technical"),
        site_logistics: getSectionContent("site_logistics"),
        assumptions: [getSectionContent("materials_allowances"), getSectionContent("budget_guidance")].filter(Boolean).join("\n\n"),
      });
    }
    setStep("preview");
  };

  const createDesignPackageMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create design package
      const { data: pkg, error: pkgErr } = await supabase
        .from("design_packages")
        .insert({
          project_id: estimate.project_id,
          lead_id: estimate.lead_id,
          package_status: "draft",
          assigned_estimator_id: estimate.assigned_estimator_id,
        })
        .select()
        .single();
      if (pkgErr) throw pkgErr;

      // Create sections from mapped data
      const sectionInserts = Object.entries(preview).map(([key, content]) => ({
        design_package_id: pkg.id,
        section_key: key,
        section_data: { content },
        contractor_visible: !["room_scope"].includes(key),
        homeowner_visible: false,
        internal_only: false,
      }));

      const { error: secErr } = await supabase.from("design_package_sections").insert(sectionInserts);
      if (secErr) throw secErr;

      // Update project workflow
      if (estimate.project_id) {
        await supabase.from("projects").update({ status: "design_package_in_progress" }).eq("id", estimate.project_id);
      }

      // Log in smart_estimate_activity_log
      await supabase.from("smart_estimate_activity_log").insert({
        smart_estimate_id: estimate.id,
        actor_id: user.id,
        actor_role: "admin",
        action_type: "design_package_created",
        action_details: { design_package_id: pkg.id, sections_mapped: Object.keys(preview) },
      });

      // Log in design_package_activity_log
      await supabase.from("design_package_activity_log").insert({
        design_package_id: pkg.id,
        actor_id: user.id,
        actor_role: "admin",
        action_type: "created_from_smart_estimate",
        action_details: `Created from Smart Estimate ${estimate.id}`,
      });

      return pkg;
    },
    onSuccess: (pkg) => {
      queryClient.invalidateQueries({ queryKey: ["smart-estimate", estimate.id] });
      queryClient.invalidateQueries({ queryKey: ["smart-estimate-activity", estimate.id] });
      setSuccessMsg(`Design Package created (${pkg.id.slice(0, 8)}). Project status updated to Design Package In Progress.`);
      setStep("success");
      toast.success("Design Package created from Smart Estimate");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createBidPacketMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get or create workspace
      let workspaceId: string | null = null;
      if (estimate.lead_id) {
        const { data: existingWs } = await supabase
          .from("estimate_workspaces")
          .select("id")
          .eq("lead_id", estimate.lead_id)
          .limit(1)
          .single();
        if (existingWs) {
          workspaceId = existingWs.id;
        } else {
          const { data: newWs, error: wsErr } = await supabase
            .from("estimate_workspaces")
            .insert({ lead_id: estimate.lead_id, status: "active" })
            .select()
            .single();
          if (wsErr) throw wsErr;
          workspaceId = newWs.id;
        }
      }

      if (!estimate.lead_id || !workspaceId) {
        throw new Error("Could not resolve lead or workspace. Ensure the estimate is linked to a lead.");
      }

      const { data: packet, error: packetErr } = await supabase
        .from("bid_packets")
        .insert({
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
        })
        .select()
        .single();
      if (packetErr) throw packetErr;

      // Update project workflow
      if (estimate.project_id) {
        await supabase.from("projects").update({ status: "bid_packet_generated" }).eq("id", estimate.project_id);
      }

      // Log in smart_estimate_activity_log
      await supabase.from("smart_estimate_activity_log").insert({
        smart_estimate_id: estimate.id,
        actor_id: user.id,
        actor_role: "admin",
        action_type: "bid_packet_created",
        action_details: { bid_packet_id: packet.id, sections_mapped: Object.keys(preview) },
      });

      return packet;
    },
    onSuccess: (packet) => {
      queryClient.invalidateQueries({ queryKey: ["smart-estimate", estimate.id] });
      queryClient.invalidateQueries({ queryKey: ["smart-estimate-activity", estimate.id] });
      setSuccessMsg(`Bid Packet created (${packet.id.slice(0, 8)}). Project status updated to Bid Packet Generated.`);
      setStep("success");
      toast.success("Bid Packet created from Smart Estimate");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isPending = createDesignPackageMutation.isPending || createBidPacketMutation.isPending;

  const designPreviewFields = [
    { key: "project_overview", label: "Project Overview" },
    { key: "existing_conditions", label: "Existing Conditions" },
    { key: "design_direction", label: "Design Direction (Seed Notes)" },
    { key: "permit_technical", label: "Permit / Technical" },
    { key: "contractor_handoff", label: "Contractor Handoff" },
    { key: "room_scope", label: "Room Scope Summary" },
  ];

  const bidPreviewFields = [
    { key: "project_overview", label: "Project Overview" },
    { key: "scope_summary", label: "Scope Summary" },
    { key: "permit_technical_notes", label: "Permit / Technical Notes" },
    { key: "site_logistics", label: "Site Logistics" },
    { key: "assumptions", label: "Assumptions" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setStep("choose"); setTarget(null); setPreview({}); } onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" /> Downstream Workflow
          </DialogTitle>
          <DialogDescription>
            Push approved Smart Estimate data into a Design Package or Bid Packet.
          </DialogDescription>
        </DialogHeader>

        {step === "choose" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This estimate has {sections.filter(s => s.is_complete).length}/{sections.length} sections complete,
              {" "}{rooms.length} rooms, and {tradeItems.length} trade items.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleChoose("design_package")}>
                <CardContent className="pt-6 text-center space-y-3">
                  <Palette className="h-10 w-10 mx-auto text-primary" />
                  <h3 className="font-semibold">Create Design Package</h3>
                  <p className="text-xs text-muted-foreground">
                    For projects requiring design review. Maps estimate data into design package sections for professional refinement.
                  </p>
                  <Badge>Requires Design Workflow</Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleChoose("bid_packet")}>
                <CardContent className="pt-6 text-center space-y-3">
                  <Package className="h-10 w-10 mx-auto text-primary" />
                  <h3 className="font-semibold">Generate Bid Packet Inputs</h3>
                  <p className="text-xs text-muted-foreground">
                    For projects skipping design. Maps estimate data directly into contractor-facing bid packet fields.
                  </p>
                  <Badge variant="secondary">Direct to RFP</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {target === "design_package" ? (
                <Badge className="bg-primary"><Palette className="h-3 w-3 mr-1" /> Design Package</Badge>
              ) : (
                <Badge variant="secondary"><Package className="h-3 w-3 mr-1" /> Bid Packet</Badge>
              )}
              <span className="text-sm text-muted-foreground">Review and edit mapped content before creating.</span>
            </div>

            {(target === "design_package" ? designPreviewFields : bidPreviewFields).map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-medium">{label}</Label>
                <Textarea
                  value={preview[key] || ""}
                  onChange={(e) => setPreview(prev => ({ ...prev, [key]: e.target.value }))}
                  rows={3}
                  placeholder={`${label}…`}
                />
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setStep("choose"); setTarget(null); }}>Back</Button>
              <Button
                onClick={() => target === "design_package" ? createDesignPackageMutation.mutate() : createBidPacketMutation.mutate()}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {target === "design_package" ? "Create Design Package" : "Create Bid Packet"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <h3 className="text-lg font-bold">Created Successfully</h3>
            <p className="text-sm text-muted-foreground text-center">{successMsg}</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
