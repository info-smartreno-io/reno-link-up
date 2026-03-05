import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AdminSideNav } from "@/components/AdminSideNav";

const CATEGORIES = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'labor', label: 'Labor' },
  { value: 'permits', label: 'Permits' },
  { value: 'misc', label: 'Miscellaneous' },
];

interface PricingItem {
  id: string;
  category: string;
  item_name: string;
  unit: string;
  material_cost: number;
  labor_cost: number;
  region: string;
  notes: string | null;
}

export default function AdminPricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PricingItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    item_name: '',
    unit: '',
    material_cost: 0,
    labor_cost: 0,
    region: 'north-jersey',
    notes: '',
  });

  useEffect(() => {
    fetchPricingItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [pricingItems, categoryFilter, searchQuery]);

  const fetchPricingItems = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_guide')
        .select('*')
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (error) throw error;
      setPricingItems(data || []);
    } catch (error: any) {
      console.error('Error fetching pricing items:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = pricingItems;

    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      category: '',
      item_name: '',
      unit: '',
      material_cost: 0,
      labor_cost: 0,
      region: 'north-jersey',
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: PricingItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      item_name: item.item_name,
      unit: item.unit,
      material_cost: item.material_cost,
      labor_cost: item.labor_cost,
      region: item.region,
      notes: item.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.category || !formData.item_name || !formData.unit) {
        toast({
          title: "Validation Error",
          description: "Category, item name, and unit are required.",
          variant: "destructive",
        });
        return;
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('pricing_guide')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Pricing item updated successfully.",
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('pricing_guide')
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Pricing item created successfully.",
        });
      }

      setIsDialogOpen(false);
      fetchPricingItems();
    } catch (error: any) {
      console.error('Error saving pricing item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save pricing item.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing item?")) return;

    try {
      const { error } = await supabase
        .from('pricing_guide')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing item deleted successfully.",
      });

      fetchPricingItems();
    } catch (error: any) {
      console.error('Error deleting pricing item:', error);
      toast({
        title: "Error",
        description: "Failed to delete pricing item.",
        variant: "destructive",
      });
    }
  };

  const SIDEBAR_WIDTH = 240;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-muted/30 fixed top-0 left-0 right-0 z-50 bg-background h-14" />
        <AdminSideNav topOffsetPx={56} widthPx={SIDEBAR_WIDTH} collapsedWidthPx={56} />
        <div className="pt-14" style={{ paddingLeft: `${SIDEBAR_WIDTH}px` }}>
          <div className="flex items-center justify-center h-[calc(100vh-56px)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30 fixed top-0 left-0 right-0 z-50 bg-background h-14" />
      <AdminSideNav topOffsetPx={56} widthPx={SIDEBAR_WIDTH} collapsedWidthPx={56} />
      
      <div className="pt-14" style={{ paddingLeft: `${SIDEBAR_WIDTH}px` }}>
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/dashboard")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Pricing Guide Management</h1>
            <p className="text-muted-foreground">
              Manage pricing database for accurate estimates
            </p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Pricing Item
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Material Cost</TableHead>
                    <TableHead className="text-right">Labor Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No pricing items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="secondary">
                            {CATEGORIES.find(c => c.value === item.category)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">
                          ${item.material_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.labor_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(item.material_cost + item.labor_cost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredItems.length} of {pricingItems.length} items
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Pricing Item' : 'Add Pricing Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Region</Label>
                <Input
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="north-jersey"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                placeholder="e.g., Custom Kitchen Cabinets - Stock Grade"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Unit *</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., sq ft, each, set"
                />
              </div>

              <div className="space-y-2">
                <Label>Material Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.material_cost}
                  onChange={(e) => setFormData({ ...formData, material_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Labor Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.labor_cost}
                  onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details about this item..."
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">Total Cost per {formData.unit || 'unit'}:</div>
              <div className="text-2xl font-bold text-primary">
                ${(formData.material_cost + formData.labor_cost).toFixed(2)}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
