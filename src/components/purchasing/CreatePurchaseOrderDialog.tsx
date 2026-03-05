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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, Plus, Trash2 } from "lucide-react";
import { CatalogItemSelector } from "./CatalogItemSelector";

interface LineItem {
  catalog_item_id?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Vendor {
  id: string;
  company_name: string;
}

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  purchaseOrder?: any;
}

export function CreatePurchaseOrderDialog({ 
  open, 
  onClose, 
  onSaved, 
  purchaseOrder 
}: CreatePurchaseOrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showCatalogSelector, setShowCatalogSelector] = useState(false);
  const [formData, setFormData] = useState({
    po_number: "",
    vendor_id: "",
    project_id: "",
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery: "",
    shipping_address: "",
    notes: "",
    terms: "",
    tax_rate: 0,
    shipping_cost: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchVendors();
      if (purchaseOrder) {
        loadPurchaseOrder();
      } else {
        generatePONumber();
      }
    }
  }, [open, purchaseOrder]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, company_name')
        .eq('status', 'active')
        .order('company_name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
    }
  };

  const generatePONumber = async () => {
    try {
      const { count } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true });

      const poNumber = `PO-${String((count || 0) + 1).padStart(6, '0')}`;
      setFormData(prev => ({ ...prev, po_number: poNumber }));
    } catch (error) {
      console.error('Error generating PO number:', error);
    }
  };

  const loadPurchaseOrder = () => {
    const items = Array.isArray(purchaseOrder.line_items) 
      ? purchaseOrder.line_items 
      : [];
    
    setFormData({
      po_number: purchaseOrder.po_number || "",
      vendor_id: purchaseOrder.vendor_id || "",
      project_id: purchaseOrder.project_id || "",
      order_date: purchaseOrder.order_date || new Date().toISOString().split('T')[0],
      expected_delivery: purchaseOrder.expected_delivery || "",
      shipping_address: purchaseOrder.shipping_address || "",
      notes: purchaseOrder.notes || "",
      terms: purchaseOrder.terms || "",
      tax_rate: parseFloat(purchaseOrder.tax || 0) / calculateSubtotal(items) * 100,
      shipping_cost: parseFloat(purchaseOrder.shipping_cost || 0),
    });
    setLineItems(items);
  };

  const handleAddCatalogItems = (items: any[]) => {
    const newLineItems: LineItem[] = items.map(item => ({
      catalog_item_id: item.id,
      item_name: item.item_name,
      description: item.description || "",
      quantity: 1,
      unit_price: parseFloat(item.default_price || 0),
      total: parseFloat(item.default_price || 0),
    }));
    
    setLineItems(prev => [...prev, ...newLineItems]);
    setShowCatalogSelector(false);
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }
    
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = (items: LineItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal(lineItems) * (formData.tax_rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal(lineItems) + calculateTax() + formData.shipping_cost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const subtotal = calculateSubtotal(lineItems);
      const tax = calculateTax();
      const total = calculateTotal();

      const poData = {
        ...formData,
        line_items: lineItems as any,
        subtotal,
        tax,
        total,
        status: purchaseOrder?.status || 'draft',
        created_by: purchaseOrder ? undefined : user.id,
      };

      if (purchaseOrder) {
        const { error } = await supabase
          .from('purchase_orders')
          .update(poData)
          .eq('id', purchaseOrder.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('purchase_orders')
          .insert([poData]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Purchase order ${purchaseOrder ? 'updated' : 'created'} successfully`,
      });

      onSaved();
    } catch (error: any) {
      console.error('Error saving purchase order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save purchase order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showCatalogSelector} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {purchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </DialogTitle>
            <DialogDescription>
              {purchaseOrder ? 'Update purchase order details' : 'Create a new purchase order for a vendor'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="po_number">PO Number *</Label>
                <Input
                  id="po_number"
                  value={formData.po_number}
                  onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                  required
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="vendor_id">Vendor *</Label>
                <Select
                  value={formData.vendor_id}
                  onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="order_date">Order Date *</Label>
                <Input
                  id="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="expected_delivery">Expected Delivery</Label>
                <Input
                  id="expected_delivery"
                  type="date"
                  value={formData.expected_delivery}
                  onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="shipping_address">Shipping Address</Label>
                <Input
                  id="shipping_address"
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCatalogSelector(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add from Catalog
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="w-32">Unit Price</TableHead>
                      <TableHead className="w-32">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No items added. Click "Add from Catalog" to select items.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.item_name}
                              onChange={(e) => handleLineItemChange(index, 'item_name', e.target.value)}
                              placeholder="Item name"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                              placeholder="Description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            ${item.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLineItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totals */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal:</span>
                  <span className="font-medium">${calculateSubtotal(lineItems).toFixed(2)}</span>
                </div>

                <div>
                  <Label htmlFor="tax_rate" className="text-xs">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Tax:</span>
                  <span className="font-medium">${calculateTax().toFixed(2)}</span>
                </div>

                <div>
                  <Label htmlFor="shipping_cost" className="text-xs">Shipping</Label>
                  <Input
                    id="shipping_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shipping_cost}
                    onChange={(e) => setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="col-span-2 flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="terms">Payment Terms</Label>
                <Input
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="e.g., Net 30"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || lineItems.length === 0}>
                {loading ? 'Saving...' : purchaseOrder ? 'Update PO' : 'Create PO'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CatalogItemSelector
        open={showCatalogSelector}
        onClose={() => setShowCatalogSelector(false)}
        onSelect={handleAddCatalogItems}
        vendorId={formData.vendor_id}
      />
    </>
  );
}
