import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddSelectionDialogProps {
  onSuccess: () => void;
}

export function AddSelectionDialog({ onSuccess }: AddSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_name: "",
    client_name: "",
    category: "",
    item_description: "",
    deadline: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("material_selections").insert({
        project_name: formData.project_name,
        client_name: formData.client_name,
        category: formData.category,
        item_description: formData.item_description,
        deadline: formData.deadline || null,
        notes: formData.notes,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Selection added successfully");
      setOpen(false);
      setFormData({
        project_name: "",
        client_name: "",
        category: "",
        item_description: "",
        deadline: "",
        notes: "",
      });
      onSuccess();
    } catch (error) {
      console.error("Error adding selection:", error);
      toast.error("Failed to add selection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Selection
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Material Selection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_name">Project Name</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cabinets">Cabinets</SelectItem>
                <SelectItem value="Countertops">Countertops</SelectItem>
                <SelectItem value="Flooring">Flooring</SelectItem>
                <SelectItem value="Tile">Tile</SelectItem>
                <SelectItem value="Fixtures">Fixtures</SelectItem>
                <SelectItem value="Appliances">Appliances</SelectItem>
                <SelectItem value="Lighting">Lighting</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Paint">Paint</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item_description">Item Description</Label>
            <Input
              id="item_description"
              value={formData.item_description}
              onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Selection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
