import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle2, FileText, Eye, Shield, Package } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  packageData: any;
  isApproved: boolean;
}

interface BidPacketDraft {
  project_overview: string;
  scope_summary: string;
  design_selections_notes: string;
  permit_technical_notes: string;
  site_logistics: string;
  inclusions: string;
  exclusions: string;
  assumptions: string;
}

export function GenerateBidPacketDialog({ open, onOpenChange, packageId, packageData, isApproved }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"configure" | "preview" | "success">("configure");
  const [overrideReason, setOverrideReason] = useState("");
  const [useOverride, setUseOverride] = useState(false);

  // Fetch sections with their content
  const { data: sections } = useQuery({
    queryKey: ["bid-packet-sections", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_package_sections")
        .select("*")
        .eq("design_package_id", packageId);
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch files
  const { data: files } = useQuery({
    queryKey: ["bid-packet-files", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_package_files")
        .select("*")
        .eq("design_package_id", packageId);
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Build the draft from design package data
  const buildDraft = (): BidPacketDraft => {
    const getSection = (key: string) => {
      const sec = sections?.find(s => s.section_key === key);
      if (!sec || sec.internal_only) return "";
      return typeof sec.section_data === "string" ? sec.section_data : JSON.stringify(sec.section_data || "");
    };

    return {
      project_overview: getSection("existing_conditions") || `Project ${packageData.project_id?.slice(0, 8) || "N/A"}`,
      scope_summary: getSection("contractor_handoff") || getSection("design_direction") || "",
      design_selections_notes: getSection("design_direction") || "",
      permit_technical_notes: packageData.permit_required ? getSection("permit_technical") : "",
      site_logistics: getSection("site_logistics") || "",
      inclusions: getSection("inclusions") || "",
      exclusions: getSection("exclusions") || "",
      assumptions: getSection("assumptions") || "",
    };
  };

  const [draft, setDraft] = useState<BidPacketDraft | null>(null);

  const handlePreview = () => {
    if (!isApproved && !useOverride) {
      toast.error("Package must be approved or use admin override");
      return;
    }
    if (!isApproved && useOverride && !overrideReason.trim()) {
      toast.error("Override reason is required");
      return;
    }
    setDraft(buildDraft());
    setStep("preview");
  };

  const updateDraft = (field: keyof BidPacketDraft, value: string) => {
    if (draft) setDraft({ ...draft, [field]: value });
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("No draft");
      const { data: { user } } = await supabase.auth.getUser();

      // Find the lead_id from project if available
      let leadId: string | null = null;
      if (packageData.project_id) {
        const { data: project } = await supabase
          .from("projects")
          .select("lead_id")
          .eq("id", packageData.project_id)
          .single();
        leadId = project?.lead_id || null;
      }

      // We need a workspace_id and lead_id for the bid_packets table
      // Create an estimate workspace if one doesn't exist
      let workspaceId: string | null = null;
      if (leadId) {
        const { data: existingWs } = await supabase
          .from("estimate_workspaces")
          .select("id")
          .eq("lead_id", leadId)
          .limit(1)
          .single();

        if (existingWs) {
          workspaceId = existingWs.id;
        } else {
          const { data: newWs, error: wsErr } = await supabase
            .from("estimate_workspaces")
            .insert({ lead_id: leadId, status: "active" })
            .select()
            .single();
          if (wsErr) throw wsErr;
          workspaceId = newWs.id;
        }
      }

      if (!leadId || !workspaceId) {
        throw new Error("Could not resolve lead or workspace for this project. Please ensure the design package is linked to a project with a lead.");
      }

      // Create bid packet
      const { data: packet, error: packetErr } = await supabase
        .from("bid_packets")
        .insert({
          lead_id: leadId,
          workspace_id: workspaceId,
          design_package_id: packageId,
          project_id: packageData.project_id,
          title: `Bid Packet — Package ${packageId.slice(0, 8)}`,
          scope_summary: draft.scope_summary,
          project_overview: draft.project_overview,
          design_selections_notes: draft.design_selections_notes,
          permit_technical_notes: draft.permit_technical_notes,
          site_logistics: draft.site_logistics,
          inclusions: draft.inclusions,
          exclusions: draft.exclusions,
          assumptions: draft.assumptions,
          generated_from_design_package: true,
          generated_at: new Date().toISOString(),
          generated_by: user?.id,
          status: "draft",
        })
        .select()
        .single();
      if (packetErr) throw packetErr;

      // Update project workflow status
      if (packageData.project_id) {
        await supabase
          .from("projects")
          .update({ status: "rfp_out" })
          .eq("id", packageData.project_id);
      }

      // Log activity
      await supabase.from("design_package_activity_log").insert({
        design_package_id: packageId,
        actor_id: user?.id || null,
        actor_role: "admin",
        action_type: "bid_packet_generated",
        action_details: useOverride
          ? `Bid packet generated with admin override: ${overrideReason}. Packet ID: ${packet.id}`
          : `Bid packet generated. Packet ID: ${packet.id}`,
      });

      return packet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-design-package", packageId] });
      queryClient.invalidateQueries({ queryKey: ["admin-design-package-log", packageId] });
      queryClient.invalidateQueries({ queryKey: ["admin-design-packages"] });
      setStep("success");
      toast.success("Bid packet generated successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const contractorVisibleFiles = (files || []).filter(f => f.contractor_visible && !f.internal_only);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setStep("configure"); setDraft(null); } onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Generate Bid Packet
          </DialogTitle>
          <DialogDescription>
            Create a contractor-facing bid packet from this design package.
          </DialogDescription>
        </DialogHeader>

        {step === "configure" && (
          <div className="space-y-4">
            {/* Gating check */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isApproved ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Shield className="h-5 w-5 text-amber-500" />
                    )}
                    <span className="font-medium">
                      {isApproved ? "Package is approved — ready to generate" : "Package not yet approved"}
                    </span>
                  </div>
                  <Badge variant={isApproved ? "default" : "secondary"}>
                    {packageData.package_status?.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {!isApproved && (
              <Card className="border-amber-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-600" /> Admin Override Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={useOverride} onCheckedChange={setUseOverride} />
                    <Label>I want to generate despite unapproved status</Label>
                  </div>
                  {useOverride && (
                    <div className="space-y-1">
                      <Label className="text-xs">Override Reason</Label>
                      <Textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Explain why this is being generated without approval…"
                        rows={2}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Section visibility summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sections to Include</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {(sections || []).map(sec => (
                    <div key={sec.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span>{sec.section_key.replace(/_/g, " ")}</span>
                      <div className="flex gap-1">
                        {sec.internal_only && <Badge variant="destructive" className="text-xs">Internal Only</Badge>}
                        {sec.contractor_visible && !sec.internal_only && <Badge variant="default" className="text-xs">Contractor</Badge>}
                        {sec.homeowner_visible && <Badge variant="outline" className="text-xs">Homeowner</Badge>}
                      </div>
                    </div>
                  ))}
                  {(!sections || sections.length === 0) && (
                    <p className="text-sm text-muted-foreground">No sections found. Bid packet will use defaults.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Files */}
            {contractorVisibleFiles.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Files to Reference ({contractorVisibleFiles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {contractorVisibleFiles.map(f => (
                      <div key={f.id} className="flex items-center gap-2 text-sm py-1">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{f.file_url.split("/").pop() || f.file_category}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handlePreview} disabled={!isApproved && !useOverride}>
                <Eye className="mr-2 h-4 w-4" /> Preview Bid Packet
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && draft && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Review and edit the bid packet content before generating. Internal-only sections are excluded.</p>

            {([
              { key: "project_overview", label: "Project Overview" },
              { key: "scope_summary", label: "Scope Summary" },
              { key: "design_selections_notes", label: "Design / Selections Notes" },
              { key: "permit_technical_notes", label: "Permit / Technical Notes" },
              { key: "site_logistics", label: "Site Logistics" },
              { key: "inclusions", label: "Inclusions" },
              { key: "exclusions", label: "Exclusions" },
              { key: "assumptions", label: "Assumptions" },
            ] as const).map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-medium">{label}</Label>
                <Textarea
                  value={draft[key]}
                  onChange={(e) => updateDraft(key, e.target.value)}
                  rows={3}
                  placeholder={`${label}…`}
                />
              </div>
            ))}

            {contractorVisibleFiles.length > 0 && (
              <div>
                <Label className="text-xs font-medium">Referenced Files</Label>
                <div className="mt-1 space-y-1">
                  {contractorVisibleFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded border border-border">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{f.file_url.split("/").pop() || f.file_category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("configure")}>Back</Button>
              <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Bid Packet
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <h3 className="text-lg font-bold">Bid Packet Generated</h3>
            <p className="text-sm text-muted-foreground text-center">
              The bid packet has been created and the project workflow status updated to RFP Ready.
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
