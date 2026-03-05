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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RecordReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  purchaseOrder: any;
}

export function RecordReceiptDialog({ open, onClose, onSaved, purchaseOrder }: RecordReceiptDialogProps) {
  const [loading, setLoading] = useState(false);
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [discrepancies, setDiscrepancies] = useState("");
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && purchaseOrder) {
      const items = Array.isArray(purchaseOrder.line_items) 
        ? purchaseOrder.line_items.map((item: any) => ({
            ...item,
            received_quantity: item.quantity,
            is_damaged: false,
          }))
        : [];
      setReceivedItems(items);
      setReceiptDate(new Date().toISOString().split('T')[0]);
      setNotes("");
      setDiscrepancies("");
    }
  }, [open, purchaseOrder]);

  const handleReceivedQuantityChange = (index: number, value: number) => {
    const updated = [...receivedItems];
    updated[index].received_quantity = value;
    setReceivedItems(updated);
  };

  const handleDamagedChange = (index: number, checked: boolean) => {
    const updated = [...receivedItems];
    updated[index].is_damaged = checked;
    setReceivedItems(updated);
  };

  const isComplete = receivedItems.every(item => 
    item.received_quantity === item.quantity && !item.is_damaged
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create receipt record
      const { error: receiptError } = await supabase
        .from('po_receipts')
        .insert([{
          po_id: purchaseOrder.id,
          receipt_date: receiptDate,
          received_by: user.id,
          items_received: receivedItems,
          notes,
          discrepancies,
          is_complete: isComplete,
        }]);

      if (receiptError) throw receiptError;

      // Update PO status
      const newStatus = isComplete ? 'delivered' : 'partially_received';
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({
          status: newStatus,
          actual_delivery: isComplete ? receiptDate : null,
        })
        .eq('id', purchaseOrder.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Receipt recorded successfully",
      });

      onSaved();
    } catch (error: any) {
      console.error('Error recording receipt:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record receipt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Receipt - {purchaseOrder?.po_number}</DialogTitle>
          <DialogDescription>
            Record the items received for this purchase order
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receipt_date">Receipt Date *</Label>
              <Input
                id="receipt_date"
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Received Items */}
          <div>
            <Label>Received Items</Label>
            <div className="border rounded-lg overflow-hidden mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-32">Ordered</TableHead>
                    <TableHead className="w-32">Received</TableHead>
                    <TableHead className="w-32">Damaged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivedItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={item.received_quantity}
                          onChange={(e) => handleReceivedQuantityChange(index, parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={item.is_damaged}
                          onCheckedChange={(checked) => handleDamagedChange(index, checked as boolean)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about the delivery..."
              />
            </div>

            <div>
              <Label htmlFor="discrepancies">Discrepancies</Label>
              <Textarea
                id="discrepancies"
                value={discrepancies}
                onChange={(e) => setDiscrepancies(e.target.value)}
                rows={2}
                placeholder="Note any discrepancies or issues..."
              />
            </div>
          </div>

          {!isComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                ⚠️ This receipt is not complete. The PO status will be set to "Partially Received".
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording...' : 'Record Receipt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
