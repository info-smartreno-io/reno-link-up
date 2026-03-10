import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/BackButton";
import { Users, MapPin, Briefcase, Loader2, Edit, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Estimator {
  id: string;
  user_id: string;
  current_assignments: number;
  max_assignments: number;
  service_zip_codes: string[];
  specializations: string[];
  is_active: boolean;
  profiles?: {
    full_name: string;
  } | null;
}

const AVAILABLE_SPECIALIZATIONS = [
  "Kitchen Remodel",
  "Bathroom Renovation",
  "Full Home Renovation",
  "Basement Finishing",
  "Home Addition",
  "Master Suite Addition",
  "Condo Renovation",
];

export default function AdminEstimatorManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [estimators, setEstimators] = useState<Estimator[]>([]);
  const [editingEstimator, setEditingEstimator] = useState<Estimator | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newZipCode, setNewZipCode] = useState("");
  const [editedZipCodes, setEditedZipCodes] = useState<string[]>([]);
  const [editedSpecializations, setEditedSpecializations] = useState<string[]>([]);
  const [editedMaxAssignments, setEditedMaxAssignments] = useState(10);
  const [editedIsActive, setEditedIsActive] = useState(true);

  useEffect(() => {
    fetchEstimators();
  }, []);

  const fetchEstimators = async () => {
    try {
      const { data, error } = await supabase
        .from("estimators")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profile names separately
      const estimatorsWithProfiles = await Promise.all(
        (data || []).map(async (est) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", est.user_id)
            .single();
          
          return {
            ...est,
            profiles: profile,
          };
        })
      );

      setEstimators(estimatorsWithProfiles as Estimator[]);
    } catch (error: any) {
      console.error("Error fetching estimators:", error);
      toast({
        title: "Error",
        description: "Failed to load estimators. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (estimator: Estimator) => {
    setEditingEstimator(estimator);
    setEditedZipCodes(estimator.service_zip_codes || []);
    setEditedSpecializations(estimator.specializations || []);
    setEditedMaxAssignments(estimator.max_assignments);
    setEditedIsActive(estimator.is_active);
    setDialogOpen(true);
  };

  const handleAddZipCode = () => {
    const zip = newZipCode.trim();
    if (!zip) return;

    if (!/^\d{5}$/.test(zip)) {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code.",
        variant: "destructive",
      });
      return;
    }

    if (editedZipCodes.includes(zip)) {
      toast({
        title: "Duplicate ZIP Code",
        description: "This ZIP code is already added.",
        variant: "destructive",
      });
      return;
    }

    setEditedZipCodes([...editedZipCodes, zip]);
    setNewZipCode("");
  };

  const handleRemoveZipCode = (zip: string) => {
    setEditedZipCodes(editedZipCodes.filter(z => z !== zip));
  };

  const handleToggleSpecialization = (spec: string) => {
    if (editedSpecializations.includes(spec)) {
      setEditedSpecializations(editedSpecializations.filter(s => s !== spec));
    } else {
      setEditedSpecializations([...editedSpecializations, spec]);
    }
  };

  const handleSave = async () => {
    if (!editingEstimator) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("estimators")
        .update({
          service_zip_codes: editedZipCodes,
          specializations: editedSpecializations,
          max_assignments: editedMaxAssignments,
          is_active: editedIsActive,
        })
        .eq("id", editingEstimator.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Estimator profile updated successfully.",
      });

      setDialogOpen(false);
      fetchEstimators();
    } catch (error: any) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <h1 className="text-3xl font-semibold">Construction Agent Management</h1>
            <p className="text-muted-foreground">Manage estimator profiles, service areas, and specializations</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{estimators.length}</span>
            <span className="text-muted-foreground">Construction Agents</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Construction Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead>Service Areas</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimators.map((estimator) => (
                  <TableRow key={estimator.id}>
                    <TableCell className="font-medium">
                      {estimator.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={estimator.is_active ? "default" : "secondary"}>
                        {estimator.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{estimator.current_assignments}</span>
                        <span className="text-muted-foreground">/ {estimator.max_assignments}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {estimator.service_zip_codes?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {estimator.service_zip_codes.slice(0, 3).map((zip) => (
                            <Badge key={zip} variant="outline" className="text-xs">
                              {zip}
                            </Badge>
                          ))}
                          {estimator.service_zip_codes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{estimator.service_zip_codes.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">All areas</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {estimator.specializations?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {estimator.specializations.slice(0, 2).map((spec) => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {estimator.specializations.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{estimator.specializations.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">All types</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(estimator)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Construction Agent: {editingEstimator?.profiles?.full_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Assignments</Label>
                <Input
                  type="number"
                  min={1}
                  value={editedMaxAssignments}
                  onChange={(e) => setEditedMaxAssignments(parseInt(e.target.value) || 10)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-3 h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedIsActive}
                      onChange={(e) => setEditedIsActive(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Service Areas (ZIP Codes)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ZIP code"
                  value={newZipCode}
                  onChange={(e) => setNewZipCode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddZipCode()}
                  maxLength={5}
                />
                <Button onClick={handleAddZipCode}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-lg">
                {editedZipCodes.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Services all areas</span>
                ) : (
                  editedZipCodes.map((zip) => (
                    <Badge key={zip} variant="secondary" className="gap-2">
                      {zip}
                      <button onClick={() => handleRemoveZipCode(zip)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Specializations
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_SPECIALIZATIONS.map((spec) => (
                  <label
                    key={spec}
                    className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent/50"
                  >
                    <input
                      type="checkbox"
                      checked={editedSpecializations.includes(spec)}
                      onChange={() => handleToggleSpecialization(spec)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{spec}</span>
                  </label>
                ))}
              </div>
              {editedSpecializations.length === 0 && (
                <p className="text-sm text-muted-foreground">Handles all project types</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
