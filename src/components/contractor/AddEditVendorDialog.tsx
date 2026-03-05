import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Vendor {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  categories: any;
  rating: number;
  payment_terms: string;
  status: string;
  notes: string;
  website: string;
  tax_id: string;
}

interface AddEditVendorDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  vendor?: Vendor | null;
}

const SERVICE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Lumber",
  "Flooring",
  "Cabinets",
  "Countertops",
  "Appliances",
  "Roofing",
  "Windows & Doors",
  "Paint & Supplies",
  "Hardware",
  "Landscaping",
  "Concrete",
  "Insulation",
];

const PAYMENT_TERMS = [
  "Net 30",
  "Net 60",
  "Net 90",
  "Due on Receipt",
  "COD",
  "2/10 Net 30",
  "Credit Card",
];

export function AddEditVendorDialog({ open, onClose, onSaved, vendor }: AddEditVendorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    categories: [] as string[],
    rating: 0,
    payment_terms: "",
    notes: "",
    status: "active",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (vendor) {
      const categories = Array.isArray(vendor.categories) ? vendor.categories : [];
      setFormData({
        company_name: vendor.company_name || "",
        contact_name: vendor.contact_name || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address || "",
        categories: categories,
        rating: vendor.rating || 0,
        payment_terms: vendor.payment_terms || "",
        notes: vendor.notes || "",
        status: vendor.status || "active",
      });
    } else {
      setFormData({
        company_name: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        categories: [],
        rating: 0,
        payment_terms: "",
        notes: "",
        status: "active",
      });
    }
  }, [vendor, open]);

  const handleAddCategory = (category: string) => {
    if (!formData.categories.includes(category)) {
      setFormData({
        ...formData,
        categories: [...formData.categories, category],
      });
    }
  };

  const handleRemoveCategory = (category: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter(c => c !== category),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const vendorData = {
        ...formData,
        created_by: vendor ? undefined : user.id,
      };

      if (vendor) {
        const { error } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', vendor.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert([vendorData]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Vendor ${vendor ? 'updated' : 'created'} successfully`,
      });

      onSaved();
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save vendor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
          <DialogDescription>
            {vendor ? 'Update vendor information' : 'Add a new vendor to your system'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Select
                value={formData.payment_terms}
                onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map(term => (
                    <SelectItem key={term} value={term}>{term}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="col-span-2">
              <Label>Service Categories</Label>
              <Select onValueChange={handleAddCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Add service category" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.filter(
                    cat => !formData.categories.includes(cat)
                  ).map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.categories.map(category => (
                  <Badge key={category} variant="secondary" className="gap-1">
                    {category}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveCategory(category)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : vendor ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
