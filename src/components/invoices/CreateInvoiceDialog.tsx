import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X } from "lucide-react";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

const DEFAULT_TERMS = `TERMS & CONDITIONS

1. PAYMENT TERMS
Payment is due within thirty (30) days from the invoice date unless otherwise stated in the contract. Late payments may incur a service charge of 1.5% per month (18% annual) or the maximum rate permitted by law. All payments shall be made in U.S. dollars.

2. ACCEPTANCE OF WORK
Client acknowledges that the work described has been completed in a satisfactory manner unless written notice of defect or dispute is provided within seven (7) days of invoice receipt.

3. CHANGE ORDERS
Any additional work, scope modifications, or material substitutions requested after project commencement will be subject to a written and approved Change Order, which may adjust pricing and completion dates accordingly.

4. RETAINAGE
If retainage applies under the project agreement, it shall be withheld and released in accordance with contract terms upon substantial completion and final approval of work.

5. MATERIALS & WARRANTIES
All materials are guaranteed to be as specified. Manufacturer warranties shall apply where available. SmartReno and its partner contractors make no additional warranties, expressed or implied, beyond those required by law.

6. LIABILITY
SmartReno and its partner contractors shall not be liable for delays caused by acts of God, material shortages, permitting issues, unforeseen site conditions, or other factors beyond reasonable control. Liability for any claim shall be limited to the total amount paid for the work giving rise to the claim.

7. PERMITS & INSPECTIONS
Unless otherwise stated, the property owner or client is responsible for obtaining and paying for necessary permits, inspections, and approvals related to the work described herein.

8. DISPUTE RESOLUTION
In the event of any dispute, both parties agree to first attempt resolution through mediation. If unresolved, disputes shall be governed by the laws of the State of New Jersey and subject to binding arbitration in Bergen County, NJ.

9. COLLECTION COSTS
Client agrees to reimburse SmartReno or its contractors for any reasonable collection costs, including attorney's fees, incurred in recovering overdue balances.

10. OWNERSHIP OF WORK
Title to all materials and equipment shall remain with the contractor until payment in full is received. Contractor reserves the right to remove unpaid materials, subject to applicable lien laws.

11. DIGITAL COMMUNICATION
By accepting this invoice, client consents to receive project updates, payment reminders, and related communications electronically through the SmartReno platform or associated email addresses.

12. ENTIRE AGREEMENT
This invoice and any attached estimates, change orders, or written agreements constitute the entire understanding between the parties regarding the described work and supersede all prior verbal or written communications.`;

const DEFAULT_PAYMENT_INSTRUCTIONS = `PAYMENT INSTRUCTIONS

Please remit payment within thirty (30) days of the invoice date unless otherwise stated.
Accepted payment methods include:

• ACH / Bank Transfer
  Account Name: SmartReno, Inc.
  Bank Name: [Your Bank Name]
  Routing Number: [Your Routing Number]
  Account Number: [Your Account Number]
  Reference: Invoice # – Client Name / Project Name

• Check
  Make payable to: SmartReno, Inc.
  Mail to: 45 Franklin Ave, Suite 200, Ridgewood, NJ 07450
  Include Invoice # in memo line.

• Credit or Debit Card
  Secure payments can be made online via the SmartReno Payment Portal.
  Visit: https://smartreno.io/payments and enter your Invoice # and amount due.
  (A 3% processing fee applies to card payments.)

• Financing / Milestone Payments
  For approved clients, SmartReno offers structured milestone or financed payment options.
  Please contact your Project Coordinator or email billing@smartreno.io before the due date.

---

Late payments are subject to a 1.5% monthly finance charge (18% annual).
All returned checks are subject to a $35 service fee.
Payments not received within 45 days may result in project suspension until the account is current.`;

export const CreateInvoiceDialog = ({ open, onOpenChange, onSuccess }: CreateInvoiceDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0, amount: 0 }
  ]);
  const [formData, setFormData] = useState({
    homeowner_name: "",
    homeowner_email: "",
    homeowner_address: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    tax_rate: 0,
    notes: "",
    terms: DEFAULT_TERMS,
    payment_instructions: DEFAULT_PAYMENT_INSTRUCTIONS,
  });

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax_amount = subtotal * (formData.tax_rate / 100);
    const total = subtotal + tax_amount;
    return { subtotal, tax_amount, total };
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = updated[index].quantity * updated[index].unit_price;
    }
    
    setLineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { subtotal, tax_amount, total } = calculateTotals();
      const invoiceNumber = `INV-${Date.now()}`;

      const { error } = await supabase.from("invoices").insert([{
        user_id: user.id,
        invoice_number: invoiceNumber,
        homeowner_name: formData.homeowner_name,
        homeowner_email: formData.homeowner_email,
        homeowner_address: formData.homeowner_address || undefined,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        line_items: lineItems as any,
        subtotal,
        tax_rate: formData.tax_rate,
        tax_amount,
        total_amount: total,
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        payment_instructions: formData.payment_instructions || undefined,
        status: "draft",
      }]);

      if (error) throw error;

      const { data } = await supabase
        .from("invoices")
        .select("id")
        .eq("invoice_number", invoiceNumber)
        .single();

      // Sync to QuickBooks (non-blocking)
      if (data?.id) {
        supabase.functions.invoke('quickbooks-push-invoice', {
          body: { invoiceId: data.id },
        }).then(({ data: qbData, error: qbError }) => {
          if (qbError) {
            console.error('QuickBooks sync error:', qbError);
          } else if (qbData?.synced) {
            toast({
              title: "Synced to QuickBooks",
              description: "Invoice synced to QuickBooks successfully",
            });
          }
        });
      }

      toast({
        title: "Invoice created",
        description: "Invoice has been created successfully.",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        homeowner_name: "",
        homeowner_email: "",
        homeowner_address: "",
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: "",
        tax_rate: 0,
        notes: "",
        terms: DEFAULT_TERMS,
        payment_instructions: DEFAULT_PAYMENT_INSTRUCTIONS,
      });
      setLineItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { subtotal, tax_amount, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>Fill in the invoice details below</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="homeowner_name">Client Name *</Label>
              <Input
                id="homeowner_name"
                required
                value={formData.homeowner_name}
                onChange={(e) => setFormData({ ...formData, homeowner_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="homeowner_email">Client Email *</Label>
              <Input
                id="homeowner_email"
                type="email"
                required
                value={formData.homeowner_email}
                onChange={(e) => setFormData({ ...formData, homeowner_email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="homeowner_address">Client Address</Label>
            <Input
              id="homeowner_address"
              value={formData.homeowner_address}
              onChange={(e) => setFormData({ ...formData, homeowner_address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoice_date">Invoice Date *</Label>
              <Input
                id="invoice_date"
                type="date"
                required
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.amount.toFixed(2)}
                      disabled
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Tax ({formData.tax_rate}%):</span>
              <span className="font-semibold">${tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              rows={8}
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Standard SmartReno terms pre-filled. Edit as needed for this invoice.
            </p>
          </div>

          <div>
            <Label htmlFor="payment_instructions">Payment Instructions</Label>
            <Textarea
              id="payment_instructions"
              rows={8}
              value={formData.payment_instructions}
              onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Standard SmartReno payment instructions pre-filled. Update bank details and edit as needed.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
