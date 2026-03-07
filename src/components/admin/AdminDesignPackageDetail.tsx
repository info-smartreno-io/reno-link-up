import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, Shield, Send, Package } from "lucide-react";
import { toast } from "sonner";
import { DESIGN_PACKAGE_SECTIONS, isPackageReadyForRFP } from "@/config/designProfessionalOptions";
import { GenerateBidPacketDialog } from "./GenerateBidPacketDialog";

interface Props {
  packageId: string;
  onClose: () => void;
}

export function AdminDesignPackageDetail({ packageId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [revisionNotes, setRevisionNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [assignDesigner, setAssignDesigner] = useState("");
  const [assignEstimator, setAssignEstimator] = useState("");
  const [bidPacketDialogOpen, setBidPacketDialogOpen] = useState(false);

  const { data: pkg, isLoading } = useQuery({
    queryKey: ["admin-design-package", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_packages")
        .select("*")
        .eq("id", packageId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ["admin-design-package-sections", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_package_sections")
        .select("*")
        .eq("design_package_id", packageId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: activityLog } = useQuery({
    queryKey: ["admin-design-package-log", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_package_activity_log")
        .select("*")
        .eq("design_package_id", packageId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-for-assign"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data || [];
    },
  });

  const logAction = async (actionType: string, details: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("design_package_activity_log").insert({
      design_package_id: packageId,
      actor_id: user?.id || null,
      actor_role: "admin",
      action_type: actionType,
      action_details: details,
    });
  };

  const updatePackage = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase
        .from("design_packages")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", packageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-design-package", packageId] });
      queryClient.invalidateQueries({ queryKey: ["admin-design-package-log", packageId] });
      queryClient.invalidateQueries({ queryKey: ["admin-design-packages"] });
    },
  });

  const handleApprove = async () => {
    await updatePackage.mutateAsync({ package_status: "approved", internal_review_status: "approved" });
    await logAction("approved", "Package approved by admin");
    toast.success("Package approved");
  };

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) { toast.error("Revision notes required"); return; }
    await updatePackage.mutateAsync({ package_status: "revision_requested", revision_notes: revisionNotes, internal_review_status: "revision_requested" });
    await logAction("revision_requested", `Revision requested: ${revisionNotes}`);
    toast.success("Revision requested");
    setRevisionNotes("");
  };

  const handleMarkRFPReady = async () => {
    const sectionsList = (sections || []).map((s) => ({ section_key: s.section_key, is_complete: s.is_complete || false }));
    const canProceed = isPackageReadyForRFP(sectionsList, pkg?.renderings_required || false, pkg?.permit_required || false);

    if (!canProceed && !overrideReason.trim()) {
      toast.error("Required sections incomplete. Use admin override with a reason to proceed.");
      return;
    }

    const isOverride = !canProceed && overrideReason.trim();
    await updatePackage.mutateAsync({
      package_status: "ready_for_rfp",
      ready_for_rfp: true,
      admin_override_rfp: isOverride || false,
      admin_override_reason: isOverride ? overrideReason : null,
    });
    await logAction("marked_rfp_ready", isOverride ? `Admin override: ${overrideReason}` : "All required sections complete");
    toast.success("Package marked ready for RFP");
    setOverrideReason("");
  };

  const handleAssignDesigner = async () => {
    if (!assignDesigner) return;
    await updatePackage.mutateAsync({ assigned_design_professional_id: assignDesigner });
    const name = profiles?.find((p) => p.id === assignDesigner)?.full_name || assignDesigner.slice(0, 8);
    await logAction("designer_assigned", `Design professional assigned: ${name}`);
    toast.success("Designer assigned");
  };

  const handleAssignEstimator = async () => {
    if (!assignEstimator) return;
    await updatePackage.mutateAsync({ assigned_estimator_id: assignEstimator });
    const name = profiles?.find((p) => p.id === assignEstimator)?.full_name || assignEstimator.slice(0, 8);
    await logAction("estimator_assigned", `Estimator assigned: ${name}`);
    toast.success("Estimator assigned");
  };

  const getProfileName = (id: string | null) => {
    if (!id) return "Unassigned";
    const p = profiles?.find((pr) => pr.id === id);
    return p?.full_name || p?.email || id.slice(0, 8);
  };

  if (isLoading || !pkg) {
    return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const sectionsList = (sections || []).map((s) => ({ section_key: s.section_key, is_complete: s.is_complete || false }));
  const readyForRFP = isPackageReadyForRFP(sectionsList, pkg.renderings_required || false, pkg.permit_required || false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Package {packageId.slice(0, 8)}</h2>
          <p className="text-sm text-muted-foreground">Project: {pkg.project_id?.slice(0, 8) || "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={pkg.package_status === "ready_for_rfp" ? "default" : "secondary"}>
            {pkg.package_status.replace(/_/g, " ")}
          </Badge>
          {pkg.admin_override_rfp && <Badge variant="outline" className="border-amber-500 text-amber-600">Override</Badge>}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{pkg.package_completion_percent ?? 0}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-sm font-medium">{getProfileName(pkg.assigned_design_professional_id)}</p>
          <p className="text-xs text-muted-foreground">Designer</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-sm font-medium">{getProfileName(pkg.assigned_estimator_id)}</p>
          <p className="text-xs text-muted-foreground">Estimator</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-sm font-medium">{readyForRFP ? "✅ Yes" : "❌ No"}</p>
          <p className="text-xs text-muted-foreground">RFP Ready</p>
        </CardContent></Card>
      </div>

      {/* Section Completion Checklist */}
      <Card>
        <CardHeader><CardTitle>Section Completion Checklist</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DESIGN_PACKAGE_SECTIONS.map((sec) => {
              const found = sections?.find((s) => s.section_key === sec.key);
              const complete = found?.is_complete || false;
              const isRequired = ["existing_conditions", "design_direction", "contractor_handoff"].includes(sec.key)
                || (sec.key === "permit_technical" && pkg.permit_required)
                || (sec.key === "renderings" && pkg.renderings_required);

              return (
                <div key={sec.key} className="flex items-center justify-between py-2 px-3 rounded border border-border">
                  <div className="flex items-center gap-2">
                    {complete ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : isRequired ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{sec.label}</span>
                    {isRequired && <Badge variant="outline" className="text-xs">Required</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{sec.weight}% weight</span>
                    <Badge variant={complete ? "default" : "secondary"} className="text-xs">
                      {complete ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          {!readyForRFP && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">Required sections are incomplete. Package cannot be marked ready for RFP without admin override.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Controls */}
      <Card>
        <CardHeader><CardTitle>Assignments</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Assign Design Professional</Label>
            <div className="flex gap-2">
              <Select value={assignDesigner || pkg.assigned_design_professional_id || ""} onValueChange={setAssignDesigner}>
                <SelectTrigger><SelectValue placeholder="Select designer" /></SelectTrigger>
                <SelectContent>
                  {(profiles || []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || p.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAssignDesigner} disabled={!assignDesigner}>Assign</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Assign Estimator</Label>
            <div className="flex gap-2">
              <Select value={assignEstimator || pkg.assigned_estimator_id || ""} onValueChange={setAssignEstimator}>
                <SelectTrigger><SelectValue placeholder="Select estimator" /></SelectTrigger>
                <SelectContent>
                  {(profiles || []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || p.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAssignEstimator} disabled={!assignEstimator}>Assign</Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={pkg.permit_required || false} onCheckedChange={async (v) => {
              await updatePackage.mutateAsync({ permit_required: v });
              await logAction("permit_toggled", v ? "Permit marked as required" : "Permit marked as not required");
            }} />
            <Label>Permit Required</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={pkg.renderings_required || false} onCheckedChange={async (v) => {
              await updatePackage.mutateAsync({ renderings_required: v });
              await logAction("renderings_toggled", v ? "Renderings marked as required" : "Renderings marked as not required");
            }} />
            <Label>Renderings Required</Label>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleApprove} disabled={updatePackage.isPending} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Package
            </Button>
            <Button variant="outline" onClick={handleMarkRFPReady} disabled={updatePackage.isPending}>
              <Send className="mr-2 h-4 w-4" /> Mark Ready for RFP
            </Button>
            <Button variant="default" onClick={() => setBidPacketDialogOpen(true)} disabled={updatePackage.isPending}>
              <Package className="mr-2 h-4 w-4" /> Generate Bid Packet
            </Button>
          </div>

          {/* Revision Request */}
          <div className="space-y-2">
            <Label>Request Revision</Label>
            <Textarea value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)} placeholder="Describe what needs to be revised…" rows={2} />
            <Button variant="destructive" size="sm" onClick={handleRequestRevision} disabled={!revisionNotes.trim() || updatePackage.isPending}>
              <AlertTriangle className="mr-2 h-4 w-4" /> Request Revision
            </Button>
          </div>

          {/* Admin Override */}
          {!readyForRFP && (
            <div className="space-y-2 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600" />
                <Label className="font-medium text-amber-700 dark:text-amber-400">Admin Override — Bypass Section Requirements</Label>
              </div>
              <Textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Reason for overriding section requirements…" rows={2} />
              <p className="text-xs text-muted-foreground">This will mark the package ready for RFP even though required sections are incomplete.</p>
            </div>
          )}

          {/* Revision notes display */}
          {pkg.revision_notes && (
            <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
              <p className="text-sm font-medium text-destructive">Current Revision Notes:</p>
              <p className="text-sm mt-1">{pkg.revision_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
        <CardContent>
          {(activityLog || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {activityLog!.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action_type.replace(/_/g, " ")}</p>
                    {log.action_details && <p className="text-xs text-muted-foreground">{log.action_details}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{log.actor_role}</p>
                    <p className="text-xs text-muted-foreground">{new Date(log.created_at!).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
