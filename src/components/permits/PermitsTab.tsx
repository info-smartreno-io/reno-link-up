import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { PermitFormTemplates } from "./PermitFormTemplates";
import { PermitFormRow } from "./PermitFormRow";
import { PermitTimelineTracker } from "./PermitTimelineTracker";
import { BulkPermitGenerator } from "./BulkPermitGenerator";
import { PermitFeeManagement } from "./PermitFeeManagement";

const SCOPE_OPTIONS = [
  { value: "structural", label: "Structural / Addition" },
  { value: "interior_remodel", label: "Interior Remodel (Kitchen/Bath/Basement)" },
  { value: "roofing", label: "Roofing / Siding / Windows" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "mechanical", label: "Mechanical / HVAC" },
  { value: "fire_protection", label: "Fire Protection" },
];

const STATUS_CONFIG = {
  draft: { label: "Draft", variant: "secondary" as const },
  zoning_pending: { label: "Zoning Pending", variant: "default" as const },
  ucc_pending: { label: "UCC Pending", variant: "default" as const },
  submitted: { label: "Submitted", variant: "default" as const },
  revisions_required: { label: "Revisions Required", variant: "destructive" as const },
  approved: { label: "Approved", variant: "default" as const },
  closed: { label: "Closed", variant: "secondary" as const },
};

const FORM_STATUS_CONFIG = {
  not_started: { label: "Not Started", variant: "secondary" as const },
  auto_filled: { label: "Auto-filled", variant: "default" as const },
  uploaded: { label: "Uploaded", variant: "default" as const },
  submitted: { label: "Submitted", variant: "default" as const },
  approved: { label: "Approved", variant: "default" as const },
};

export default function PermitsTab() {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [permit, setPermit] = useState<any>(null);
  const [forms, setForms] = useState<any[]>([]);
  const [requiresPermit, setRequiresPermit] = useState<string>("yes");
  const [municipality, setMunicipality] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Try to extract municipality from project data
      if (projectData && typeof projectData === 'object') {
        const projectObj = projectData as any;
        if (projectObj.location) {
          const parts = projectObj.location.split(",");
          if (parts.length > 0) {
            setMunicipality(parts[0].trim());
          }
        }
      }

      // Fetch existing permit
      const { data: permitData, error: permitError } = await supabase
        .from("permits" as any)
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (permitError && permitError.code !== "PGRST116") throw permitError;

      if (permitData) {
        setPermit(permitData);
        setRequiresPermit((permitData as any).requires_permit ? "yes" : "no");
        setMunicipality((permitData as any).jurisdiction_municipality);
        setNotes((permitData as any).notes || "");

        // Fetch forms
        const { data: formsData, error: formsError } = await supabase
          .from("permit_required_forms" as any)
          .select("*")
          .eq("permit_id", (permitData as any).id)
          .order("form_code");

        if (formsError) throw formsError;
        setForms(formsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load permit data");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForms = async () => {
    if (selectedScopes.length === 0) {
      toast.error("Please select at least one scope");
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase.functions.invoke("create-or-update-permit", {
        body: {
          projectId,
          jurisdictionState: "NJ",
          municipality,
          scopeTags: selectedScopes,
          requiresPermit: requiresPermit === "yes",
        },
      });

      if (error) throw error;

      setPermit(data.permit);
      setForms(data.forms);
      toast.success("Permit forms generated successfully");
    } catch (error) {
      console.error("Error generating forms:", error);
      toast.error("Failed to generate forms");
    } finally {
      setSaving(false);
    }
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Municipal Permits</h2>
            <p className="text-muted-foreground mt-1">
              {(project as any)?.homeowner_name || "No homeowner"} • {(project as any)?.project_name || "Unnamed Project"}
            </p>
          </div>
          {permit && (
            <Badge variant={STATUS_CONFIG[permit.status as keyof typeof STATUS_CONFIG]?.variant || "secondary"}>
              {STATUS_CONFIG[permit.status as keyof typeof STATUS_CONFIG]?.label || permit.status}
            </Badge>
          )}
        </div>
      </Card>

      {/* Timeline Tracker */}
      {permit && (
        <PermitTimelineTracker
          permitId={permit.id}
          municipality={municipality}
          state="NJ"
          status={permit.status}
          appliedAt={permit.applied_at}
          approvedAt={permit.approved_at}
        />
      )}

      {/* Section A - Permit Need & Scope */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Permit Requirements</h3>

        <div className="space-y-4">
          <div>
            <Label>Permit Required?</Label>
            <Select value={requiresPermit} onValueChange={setRequiresPermit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="unsure">Unsure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Municipality</Label>
            <Input
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder="Enter municipality"
            />
          </div>

          <div>
            <Label>Project Scope</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SCOPE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={selectedScopes.includes(option.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleScope(option.value)}
                  className="justify-start"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerateForms}
            disabled={saving || selectedScopes.length === 0}
            className="w-full"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Required Forms List
          </Button>
        </div>
      </Card>

      {/* Section B - Required Forms */}
      {forms.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Required Forms Checklist</h3>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <PermitFormRow
                  key={form.id}
                  form={form}
                  onFormUpdate={fetchData}
                />
              ))}
            </TableBody>
          </Table>

          {/* Bulk Generation Button */}
          <div className="mt-6">
            <BulkPermitGenerator
              permitId={permit.id}
              formsCount={forms.length}
              onGenerationComplete={fetchData}
            />
          </div>
        </Card>
      )}

      {/* Section C: Fee Management */}
      {permit && (
        <PermitFeeManagement
          permitId={permit.id}
          projectId={permit.project_id}
          municipality={municipality}
          state={(permit as any).jurisdiction_state || "NJ"}
          squareFootage={project?.square_footage}
          projectValue={project?.estimated_value}
        />
      )}

      {/* Section D: Form Templates & Resources */}
      <PermitFormTemplates />

      {/* Section E: Notes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Permit Notes</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any special conditions or notes about permits..."
          rows={4}
        />
      </Card>
    </div>
  );
}