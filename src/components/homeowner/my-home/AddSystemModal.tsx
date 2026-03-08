import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateHomeSystem, SYSTEM_TYPES } from "@/hooks/useHomeProfile";
import { Plus } from "lucide-react";

interface Props {
  profileId: string;
  onClose: () => void;
}

export function AddSystemModal({ profileId, onClose }: Props) {
  const createSystem = useCreateHomeSystem();
  const [form, setForm] = useState({
    system_type: "",
    brand: "",
    model_number: "",
    install_year: "",
    condition_rating: "",
    homeowner_notes: "",
  });

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.system_type) return;
    await createSystem.mutateAsync({
      home_profile_id: profileId,
      system_type: form.system_type,
      brand: form.brand || null,
      model_number: form.model_number || null,
      install_year: form.install_year ? parseInt(form.install_year) : null,
      condition_rating: form.condition_rating || null,
      homeowner_notes: form.homeowner_notes || null,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Home System</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>System Type *</Label>
            <Select value={form.system_type} onValueChange={v => set("system_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select system" /></SelectTrigger>
              <SelectContent>{SYSTEM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Brand</Label><Input value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. Carrier" /></div>
            <div><Label>Model #</Label><Input value={form.model_number} onChange={e => set("model_number", e.target.value)} placeholder="e.g. 24ACC636" /></div>
            <div><Label>Install Year</Label><Input type="number" value={form.install_year} onChange={e => set("install_year", e.target.value)} placeholder="2015" /></div>
            <div>
              <Label>Condition</Label>
              <Select value={form.condition_rating} onValueChange={v => set("condition_rating", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.homeowner_notes} onChange={e => set("homeowner_notes", e.target.value)} placeholder="Any known issues or notes about this system..." rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.system_type || createSystem.isPending}>
              <Plus className="h-4 w-4 mr-1" /> {createSystem.isPending ? "Adding..." : "Add System"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
