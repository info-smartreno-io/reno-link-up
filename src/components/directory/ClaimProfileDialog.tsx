import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClaimProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
}

export function ClaimProfileDialog({ open, onOpenChange, businessId, businessName }: ClaimProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    company_name: businessName,
    email: "",
    phone: "",
    website: "",
    relationship: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.relationship) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("profile_claim_requests" as any).insert({
        business_id: businessId,
        full_name: form.full_name,
        company_name: form.company_name,
        email: form.email,
        phone: form.phone || null,
        website: form.website || null,
        relationship: form.relationship,
        notes: form.notes || null,
      });

      if (error) throw error;
      toast.success("Claim request submitted! We'll review and get back to you.");
      onOpenChange(false);
      setForm({ full_name: "", company_name: businessName, email: "", phone: "", website: "", relationship: "", notes: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit claim request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <BadgeCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Claim This Profile</DialogTitle>
          <DialogDescription className="text-center">
            Verify your ownership of <strong>{businessName}</strong> to manage and update this profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="claim-name">Full Name *</Label>
              <Input id="claim-name" value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-company">Company Name</Label>
              <Input id="claim-company" value={form.company_name} onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="claim-email">Email *</Label>
              <Input id="claim-email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-phone">Phone</Label>
              <Input id="claim-phone" type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="claim-website">Website</Label>
            <Input id="claim-website" type="url" value={form.website} onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="claim-relationship">Relationship to Business *</Label>
            <select
              id="claim-relationship"
              value={form.relationship}
              onChange={(e) => setForm(f => ({ ...f, relationship: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">Select...</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
              <option value="authorized_representative">Authorized Representative</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="claim-notes">Additional Notes</Label>
            <Textarea id="claim-notes" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Any additional information..." />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Submitting..." : "Submit Claim Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
