import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CheckCircle2, Clock, AlertTriangle, Plus, Upload, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Project {
  id: string;
  client_name: string;
  project_type: string;
  location: string;
  status: string;
}

interface Permit {
  id: string;
  project_id: string;
  permit_type: string;
  description: string;
  application_date: string | null;
  submission_date: string | null;
  approval_date: string | null;
  expiration_date: string | null;
  permit_number: string;
  municipality: string;
  status: "not_started" | "in_preparation" | "submitted" | "under_review" | "approved" | "rejected" | "expired";
  inspector_name: string;
  inspector_contact: string;
  fees: number;
  notes: string;
  created_at: string;
}

const PERMIT_TYPES = [
  "Building Permit",
  "Electrical Permit",
  "Plumbing Permit",
  "HVAC Permit",
  "Demolition Permit",
  "Zoning Variance",
  "Certificate of Occupancy"
];

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "hsl(0, 0%, 60%)", variant: "outline" as const },
  in_preparation: { label: "In Preparation", color: "hsl(40, 70%, 60%)", variant: "secondary" as const },
  submitted: { label: "Submitted", color: "hsl(217, 91%, 60%)", variant: "default" as const },
  under_review: { label: "Under Review", color: "hsl(262, 83%, 58%)", variant: "secondary" as const },
  approved: { label: "Approved", color: "hsl(142, 76%, 36%)", variant: "default" as const },
  rejected: { label: "Rejected", color: "hsl(0, 70%, 50%)", variant: "destructive" as const },
  expired: { label: "Expired", color: "hsl(0, 60%, 40%)", variant: "destructive" as const },
};

export default function PermitTracking() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    permit_type: "",
    description: "",
    municipality: "",
    application_date: "",
    fees: "",
    inspector_name: "",
    inspector_contact: "",
    notes: "",
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchPermits();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const { data, error } = await supabase
        .from("contractor_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        title: "Error",
        description: "Failed to load project details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermits = async () => {
    try {
      const { data, error } = await supabase
        .from("project_permits")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error && error.code !== "PGRST116") throw error;
      setPermits((data as Permit[]) || []);
    } catch (error) {
      console.error("Error fetching permits:", error);
    }
  };

  const handleAddPermit = async () => {
    if (!formData.permit_type || !formData.municipality) {
      toast({
        title: "Missing Information",
        description: "Please fill in permit type and municipality.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("project_permits").insert({
        project_id: projectId,
        permit_type: formData.permit_type,
        description: formData.description,
        municipality: formData.municipality,
        application_date: formData.application_date || null,
        fees: parseFloat(formData.fees) || 0,
        inspector_name: formData.inspector_name,
        inspector_contact: formData.inspector_contact,
        status: "not_started",
        permit_number: "",
        notes: formData.notes,
      });

      if (error) throw error;

      toast({
        title: "Permit Added",
        description: "Permit has been added to tracking.",
      });

      setFormData({
        permit_type: "",
        description: "",
        municipality: "",
        application_date: "",
        fees: "",
        inspector_name: "",
        inspector_contact: "",
        notes: "",
      });
      setDialogOpen(false);
      fetchPermits();
    } catch (error: any) {
      console.error("Error adding permit:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add permit.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePermitStatus = async (permitId: string, newStatus: Permit["status"]) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === "submitted" && !permits.find(p => p.id === permitId)?.submission_date) {
        updateData.submission_date = new Date().toISOString().split('T')[0];
      }
      if (newStatus === "approved" && !permits.find(p => p.id === permitId)?.approval_date) {
        updateData.approval_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from("project_permits")
        .update(updateData)
        .eq("id", permitId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Permit status has been updated.",
      });

      fetchPermits();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const getStatusSummary = () => {
    return {
      total: permits.length,
      approved: permits.filter(p => p.status === "approved").length,
      submitted: permits.filter(p => p.status === "submitted" || p.status === "under_review").length,
      pending: permits.filter(p => p.status === "not_started" || p.status === "in_preparation").length,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = getStatusSummary();

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <BackButton />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Permit Tracking</h1>
            <p className="text-muted-foreground">
              {project?.client_name} - {project?.project_type} - {project?.location}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Permit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Permit</DialogTitle>
                <DialogDescription>
                  Track permit applications and approvals
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Permit Type *</Label>
                  <select
                    value={formData.permit_type}
                    onChange={(e) => setFormData({...formData, permit_type: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Select type...</option>
                    {PERMIT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Municipality *</Label>
                  <Input
                    value={formData.municipality}
                    onChange={(e) => setFormData({...formData, municipality: e.target.value})}
                    placeholder="e.g., Bergen County"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Scope of work, specific requirements..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Application Date</Label>
                  <Input
                    type="date"
                    value={formData.application_date}
                    onChange={(e) => setFormData({...formData, application_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permit Fees ($)</Label>
                  <Input
                    type="number"
                    value={formData.fees}
                    onChange={(e) => setFormData({...formData, fees: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inspector Name</Label>
                  <Input
                    value={formData.inspector_name}
                    onChange={(e) => setFormData({...formData, inspector_name: e.target.value})}
                    placeholder="Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inspector Contact</Label>
                  <Input
                    value={formData.inspector_contact}
                    onChange={(e) => setFormData({...formData, inspector_contact: e.target.value})}
                    placeholder="Phone or email"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Special requirements, conditions..."
                    rows={2}
                  />
                </div>
              </div>
              <Button onClick={handleAddPermit} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Permit"
                )}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Total Permits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{summary.approved}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                In Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{summary.submitted}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{summary.pending}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permit Applications</CardTitle>
            <CardDescription>Track submissions, approvals, and inspections</CardDescription>
          </CardHeader>
          <CardContent>
            {permits.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No permits added yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit Type</TableHead>
                    <TableHead>Municipality</TableHead>
                    <TableHead>Application Date</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permits.map(permit => {
                    const statusConfig = STATUS_CONFIG[permit.status];
                    
                    return (
                      <TableRow key={permit.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{permit.permit_type}</p>
                            {permit.description && (
                              <p className="text-sm text-muted-foreground">{permit.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{permit.municipality}</TableCell>
                        <TableCell>
                          {permit.application_date 
                            ? format(new Date(permit.application_date), "MMM d, yyyy")
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {permit.inspector_name ? (
                            <div>
                              <p className="text-sm">{permit.inspector_name}</p>
                              <p className="text-xs text-muted-foreground">{permit.inspector_contact}</p>
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>${permit.fees?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={statusConfig.variant}
                            style={{ borderLeftColor: statusConfig.color, borderLeftWidth: "3px" }}
                          >
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <select
                            value={permit.status}
                            onChange={(e) => updatePermitStatus(permit.id, e.target.value as Permit["status"])}
                            className="text-sm h-8 px-2 rounded border border-input bg-background"
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
