import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    total_amount: number;
    amount_paid: number;
  };
  onSuccess: () => void;
}

export const RecordPaymentDialog = ({ open, onOpenChange, invoice, onSuccess }: RecordPaymentDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: "",
    payment_method: "",
    transaction_id: "",
    notes: "",
  });

  const remainingBalance = invoice.total_amount - invoice.amount_paid;

  // Fetch payment history
  const { data: payments } = useQuery({
    queryKey: ["invoice-payments", invoice.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_payments")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const paymentAmount = parseFloat(formData.amount);
      
      if (paymentAmount <= 0) {
        throw new Error("Payment amount must be greater than 0");
      }

      if (paymentAmount > remainingBalance) {
        throw new Error(`Payment amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`);
      }

      const { error } = await supabase.from("invoice_payments").insert([{
        invoice_id: invoice.id,
        payment_date: formData.payment_date,
        amount: paymentAmount,
        payment_method: formData.payment_method || undefined,
        transaction_id: formData.transaction_id || undefined,
        notes: formData.notes || undefined,
        recorded_by: user.id,
      }]);

      if (error) throw error;

      toast({
        title: "Payment recorded",
        description: "Payment has been recorded successfully.",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        payment_date: new Date().toISOString().split('T')[0],
        amount: "",
        payment_method: "",
        transaction_id: "",
        notes: "",
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment - Invoice {invoice.invoice_number}</DialogTitle>
          <DialogDescription>
            Record a payment received for this invoice
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg mb-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-lg font-bold">${invoice.total_amount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Amount Paid</div>
            <div className="text-lg font-bold text-green-600">${invoice.amount_paid.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Remaining Balance</div>
            <div className="text-lg font-bold text-orange-600">${remainingBalance.toFixed(2)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                id="payment_date"
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max: ${remainingBalance.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transaction_id">Transaction ID / Check #</Label>
              <Input
                id="transaction_id"
                placeholder="Optional"
                value={formData.transaction_id}
                onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Optional notes about this payment"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>

        {payments && payments.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-4">Payment History</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {payment.payment_method ? (
                        <Badge variant="outline">{payment.payment_method.replace('_', ' ')}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.transaction_id || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
