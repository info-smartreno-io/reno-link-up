import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface FeeSchedule {
  id: string;
  state: string;
  municipality: string;
  permit_type: string;
  base_fee: number;
  per_sqft_fee: number | null;
  per_valuation_fee: number | null;
  minimum_fee: number | null;
  maximum_fee: number | null;
  notes: string | null;
  effective_date: string;
}

export function MunicipalityFeeSchedules() {
  const [schedules, setSchedules] = useState<FeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FeeSchedule | null>(null);
  const [formData, setFormData] = useState({
    state: "NJ",
    municipality: "",
    permit_type: "building",
    base_fee: "",
    per_sqft_fee: "",
    per_valuation_fee: "",
    minimum_fee: "",
    maximum_fee: "",
    notes: "",
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("municipality_fee_schedules" as any)
        .select("*")
        .order("municipality", { ascending: true })
        .order("permit_type", { ascending: true });

      if (error) throw error;
      setSchedules((data as any) || []);
    } catch (error: any) {
      console.error("Error loading fee schedules:", error);
      toast.error("Failed to load fee schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const scheduleData = {
        state: formData.state,
        municipality: formData.municipality,
        permit_type: formData.permit_type,
        base_fee: parseFloat(formData.base_fee) || 0,
        per_sqft_fee: formData.per_sqft_fee ? parseFloat(formData.per_sqft_fee) : null,
        per_valuation_fee: formData.per_valuation_fee ? parseFloat(formData.per_valuation_fee) : null,
        minimum_fee: formData.minimum_fee ? parseFloat(formData.minimum_fee) : null,
        maximum_fee: formData.maximum_fee ? parseFloat(formData.maximum_fee) : null,
        notes: formData.notes || null,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from("municipality_fee_schedules" as any)
          .update(scheduleData)
          .eq("id", editingSchedule.id);

        if (error) throw error;
        toast.success("Fee schedule updated");
      } else {
        const { error } = await supabase
          .from("municipality_fee_schedules" as any)
          .insert(scheduleData);

        if (error) throw error;
        toast.success("Fee schedule created");
      }

      setDialogOpen(false);
      setEditingSchedule(null);
      resetForm();
      loadSchedules();
    } catch (error: any) {
      console.error("Error saving fee schedule:", error);
      toast.error("Failed to save fee schedule");
    }
  };

  const resetForm = () => {
    setFormData({
      state: "NJ",
      municipality: "",
      permit_type: "building",
      base_fee: "",
      per_sqft_fee: "",
      per_valuation_fee: "",
      minimum_fee: "",
      maximum_fee: "",
      notes: "",
    });
  };

  const handleEdit = (schedule: FeeSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      state: schedule.state,
      municipality: schedule.municipality,
      permit_type: schedule.permit_type,
      base_fee: schedule.base_fee.toString(),
      per_sqft_fee: schedule.per_sqft_fee?.toString() || "",
      per_valuation_fee: schedule.per_valuation_fee?.toString() || "",
      minimum_fee: schedule.minimum_fee?.toString() || "",
      maximum_fee: schedule.maximum_fee?.toString() || "",
      notes: schedule.notes || "",
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Municipality Fee Schedules
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Edit" : "Add"} Fee Schedule
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipality</Label>
                  <Input
                    id="municipality"
                    value={formData.municipality}
                    onChange={(e) =>
                      setFormData({ ...formData, municipality: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permit_type">Permit Type</Label>
                <Input
                  id="permit_type"
                  value={formData.permit_type}
                  onChange={(e) =>
                    setFormData({ ...formData, permit_type: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_fee">Base Fee ($)</Label>
                  <Input
                    id="base_fee"
                    type="number"
                    step="0.01"
                    value={formData.base_fee}
                    onChange={(e) =>
                      setFormData({ ...formData, base_fee: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="per_sqft_fee">Per Sq Ft Fee ($)</Label>
                  <Input
                    id="per_sqft_fee"
                    type="number"
                    step="0.0001"
                    value={formData.per_sqft_fee}
                    onChange={(e) =>
                      setFormData({ ...formData, per_sqft_fee: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimum_fee">Minimum Fee ($)</Label>
                  <Input
                    id="minimum_fee"
                    type="number"
                    step="0.01"
                    value={formData.minimum_fee}
                    onChange={(e) =>
                      setFormData({ ...formData, minimum_fee: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maximum_fee">Maximum Fee ($)</Label>
                  <Input
                    id="maximum_fee"
                    type="number"
                    step="0.01"
                    value={formData.maximum_fee}
                    onChange={(e) =>
                      setFormData({ ...formData, maximum_fee: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingSchedule(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSchedule ? "Update" : "Create"} Schedule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading fee schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No fee schedules found. Add your first schedule to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Municipality</TableHead>
                <TableHead>Permit Type</TableHead>
                <TableHead>Base Fee</TableHead>
                <TableHead>Per Sq Ft</TableHead>
                <TableHead>Min/Max</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    {schedule.municipality}, {schedule.state}
                  </TableCell>
                  <TableCell className="capitalize">
                    {schedule.permit_type}
                  </TableCell>
                  <TableCell>${schedule.base_fee.toFixed(2)}</TableCell>
                  <TableCell>
                    {schedule.per_sqft_fee
                      ? `$${schedule.per_sqft_fee.toFixed(4)}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {schedule.minimum_fee && `$${schedule.minimum_fee}`}
                    {schedule.minimum_fee && schedule.maximum_fee && " / "}
                    {schedule.maximum_fee && `$${schedule.maximum_fee}`}
                    {!schedule.minimum_fee && !schedule.maximum_fee && "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
