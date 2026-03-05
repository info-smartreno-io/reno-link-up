import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

interface CreateEstimateFormProps {
  onSuccess?: () => void;
}

export default function CreateEstimateForm({ onSuccess }: CreateEstimateFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    project_name: "",
    estimate_number: "",
    amount: "",
    labor_cost: "",
    materials_cost: "",
    valid_until: "",
    notes: "",
    terms: "",
  });

  const generateEstimateNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EST-${year}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const estimateNumber = formData.estimate_number || generateEstimateNumber();

      const { error } = await supabase.from('estimates').insert({
        user_id: user.id,
        client_name: formData.client_name,
        project_name: formData.project_name,
        estimate_number: estimateNumber,
        amount: parseFloat(formData.amount),
        labor_cost: formData.labor_cost ? parseFloat(formData.labor_cost) : null,
        materials_cost: formData.materials_cost ? parseFloat(formData.materials_cost) : null,
        valid_until: formData.valid_until || null,
        notes: formData.notes || null,
        terms: formData.terms || null,
        status: 'draft',
      });

      if (error) throw error;

      toast({
        title: "Estimate created!",
        description: `Estimate ${estimateNumber} has been created successfully.`,
      });

      setOpen(false);
      setFormData({
        client_name: "",
        project_name: "",
        estimate_number: "",
        amount: "",
        labor_cost: "",
        materials_cost: "",
        valid_until: "",
        notes: "",
        terms: "",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create estimate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Estimate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Estimate</DialogTitle>
          <DialogDescription>Prepare a new project estimate for a client</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_name">Project Name *</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimate_number">Estimate Number</Label>
              <Input
                id="estimate_number"
                value={formData.estimate_number}
                onChange={(e) => setFormData({ ...formData, estimate_number: e.target.value })}
                placeholder="Auto-generated if left empty"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="labor_cost">Labor Cost</Label>
              <Input
                id="labor_cost"
                type="number"
                step="0.01"
                value={formData.labor_cost}
                onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materials_cost">Materials Cost</Label>
              <Input
                id="materials_cost"
                type="number"
                step="0.01"
                value={formData.materials_cost}
                onChange={(e) => setFormData({ ...formData, materials_cost: e.target.value })}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Project details and scope..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              placeholder="Payment terms, warranty information, etc..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Estimate
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
