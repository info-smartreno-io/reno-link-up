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
import { Progress } from "@/components/ui/progress";
import { Loader2, Package, CheckCircle2, Clock, AlertTriangle, Plus, Trash2 } from "lucide-react";
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

interface Project {
  id: string;
  client_name: string;
  project_type: string;
  location: string;
  status: string;
}

interface Material {
  id: string;
  project_id: string;
  category: string;
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
  vendor: string;
  order_date: string | null;
  expected_delivery: string | null;
  actual_delivery: string | null;
  status: "pending_selection" | "selected" | "ordered" | "in_transit" | "delivered" | "installed";
  notes: string;
  created_at: string;
}

const MATERIAL_CATEGORIES = [
  "Cabinetry",
  "Countertops",
  "Flooring",
  "Tile",
  "Fixtures",
  "Appliances",
  "Hardware",
  "Lighting",
  "Paint",
  "Trim & Molding"
];

const STATUS_CONFIG = {
  pending_selection: { label: "Pending Selection", color: "hsl(40, 70%, 60%)", icon: Clock },
  selected: { label: "Selected", color: "hsl(217, 91%, 60%)", icon: CheckCircle2 },
  ordered: { label: "Ordered", color: "hsl(262, 83%, 58%)", icon: Package },
  in_transit: { label: "In Transit", color: "hsl(30, 80%, 55%)", icon: Package },
  delivered: { label: "Delivered", color: "hsl(142, 76%, 36%)", icon: CheckCircle2 },
  installed: { label: "Installed", color: "hsl(150, 60%, 45%)", icon: CheckCircle2 },
};

export default function MaterialsManagement() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    category: "",
    item_name: "",
    description: "",
    quantity: "",
    unit: "",
    vendor: "",
    order_date: "",
    expected_delivery: "",
    notes: "",
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchMaterials();
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

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("project_materials")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error && error.code !== "PGRST116") throw error;
      setMaterials((data as Material[]) || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const handleAddMaterial = async () => {
    if (!formData.category || !formData.item_name) {
      toast({
        title: "Missing Information",
        description: "Please fill in category and item name.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("project_materials").insert({
        project_id: projectId,
        category: formData.category,
        item_name: formData.item_name,
        description: formData.description,
        quantity: parseInt(formData.quantity) || 1,
        unit: formData.unit || "ea",
        vendor: formData.vendor,
        order_date: formData.order_date || null,
        expected_delivery: formData.expected_delivery || null,
        status: "pending_selection",
        notes: formData.notes,
      });

      if (error) throw error;

      toast({
        title: "Material Added",
        description: "Material has been added to the project.",
      });

      setFormData({
        category: "",
        item_name: "",
        description: "",
        quantity: "",
        unit: "",
        vendor: "",
        order_date: "",
        expected_delivery: "",
        notes: "",
      });
      setDialogOpen(false);
      fetchMaterials();
    } catch (error: any) {
      console.error("Error adding material:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add material.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateMaterialStatus = async (materialId: string, newStatus: Material["status"]) => {
    try {
      const { error } = await supabase
        .from("project_materials")
        .update({ status: newStatus })
        .eq("id", materialId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Material status has been updated.",
      });

      fetchMaterials();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const deleteMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from("project_materials")
        .delete()
        .eq("id", materialId);

      if (error) throw error;

      toast({
        title: "Material Deleted",
        description: "Material has been removed from the project.",
      });

      fetchMaterials();
    } catch (error: any) {
      console.error("Error deleting material:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete material.",
        variant: "destructive",
      });
    }
  };

  const getCompletionPercentage = () => {
    if (materials.length === 0) return 0;
    const completed = materials.filter(m => m.status === "installed" || m.status === "delivered").length;
    return Math.round((completed / materials.length) * 100);
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
            <h1 className="text-3xl font-semibold">Materials Management</h1>
            <p className="text-muted-foreground">
              {project?.client_name} - {project?.project_type}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
                <DialogDescription>
                  Track materials for homeowner selections and ordering
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Select category...</option>
                    {MATERIAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Item Name *</Label>
                  <Input
                    value={formData.item_name}
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                    placeholder="e.g., Shaker White Cabinets"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Model number, finish, specifications..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="ea, sf, lf"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input
                    value={formData.vendor}
                    onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={formData.expected_delivery}
                    onChange={(e) => setFormData({...formData, expected_delivery: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Lead times, special instructions..."
                    rows={2}
                  />
                </div>
              </div>
              <Button onClick={handleAddMaterial} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Material"
                )}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={getCompletionPercentage()} className="h-2" />
                <p className="text-2xl font-semibold">{getCompletionPercentage()}%</p>
                <p className="text-sm text-muted-foreground">
                  {materials.filter(m => m.status === "installed" || m.status === "delivered").length} of {materials.length} items complete
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Pending Selections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-yellow-600">
                  {materials.filter(m => m.status === "pending_selection").length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Require homeowner approval
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">In Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-blue-600">
                  {materials.filter(m => m.status === "in_transit" || m.status === "ordered").length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Items on order or shipping
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Material Tracking</CardTitle>
            <CardDescription>Monitor selections, orders, and deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            {materials.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No materials added yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map(material => {
                    const statusConfig = STATUS_CONFIG[material.status];
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.category}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{material.item_name}</p>
                            {material.description && (
                              <p className="text-sm text-muted-foreground">{material.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{material.quantity} {material.unit}</TableCell>
                        <TableCell>{material.vendor || "-"}</TableCell>
                        <TableCell>
                          {material.expected_delivery 
                            ? new Date(material.expected_delivery).toLocaleDateString()
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="gap-1"
                            style={{ borderLeftColor: statusConfig.color, borderLeftWidth: "3px" }}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <select
                              value={material.status}
                              onChange={(e) => updateMaterialStatus(material.id, e.target.value as Material["status"])}
                              className="text-sm h-8 px-2 rounded border border-input bg-background"
                            >
                              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMaterial(material.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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
