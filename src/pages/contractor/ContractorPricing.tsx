import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { ArrowLeft, Edit2, Save, X, Loader2, Plus, Trash2, Download, Upload, BookTemplate, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
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

interface ContractorLaborRate {
  pricing_id: string;
  labor_cost: number;
}

interface CustomPricingItem {
  id: string;
  contractor_id: string;
  category: string;
  item_name: string;
  unit: string;
  material_cost: number;
  labor_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PricingTemplate {
  id: string;
  contractor_id: string;
  template_name: string;
  project_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface TemplateItem {
  id: string;
  template_id: string;
  item_type: 'standard' | 'custom';
  pricing_guide_id: string | null;
  custom_item_id: string | null;
  quantity: number;
}

export default function ContractorPricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [customItems, setCustomItems] = useState<CustomPricingItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PricingItem[]>([]);
  const [filteredCustomItems, setFilteredCustomItems] = useState<CustomPricingItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedLabor, setEditedLabor] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newCustomCategory, setNewCustomCategory] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newMaterialCost, setNewMaterialCost] = useState("");
  const [newLaborCost, setNewLaborCost] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [editedCustom, setEditedCustom] = useState<Record<string, Partial<CustomPricingItem>>>({});
  const [templates, setTemplates] = useState<PricingTemplate[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateType, setNewTemplateType] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [applyTemplateDialogOpen, setApplyTemplateDialogOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchPricingItems();
      fetchCustomItems();
      fetchTemplates();
    }
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [pricingItems, customItems, categoryFilter]);

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
    let filteredCustom = customItems;

    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter);
      filteredCustom = filteredCustom.filter(item => item.category === categoryFilter);
    }

    setFilteredItems(filtered);
    setFilteredCustomItems(filteredCustom);
  };

  const handleEditLabor = (itemId: string, currentLabor: number) => {
    setEditingId(itemId);
    setEditedLabor({ ...editedLabor, [itemId]: currentLabor });
  };

  const fetchCustomItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contractor_pricing_items')
        .select('*')
        .eq('contractor_id', user.id)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (error) throw error;
      setCustomItems(data || []);
    } catch (error: any) {
      console.error('Error fetching custom items:', error);
      toast({
        title: "Error",
        description: "Failed to load custom pricing items.",
        variant: "destructive",
      });
    }
  };

  const handleSaveLabor = async (itemId: string) => {
    setSaving(true);
    try {
      const newLabor = editedLabor[itemId];
      
      // Update the pricing_guide table with the new labor cost
      const { error } = await supabase
        .from('pricing_guide')
        .update({ labor_cost: newLabor })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setPricingItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, labor_cost: newLabor } : item
      ));

      toast({
        title: "Success",
        description: "Labor cost updated successfully",
      });

      setEditingId(null);
    } catch (error: any) {
      console.error('Error updating labor cost:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update labor cost",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (itemId: string) => {
    setEditingId(null);
    const newEdited = { ...editedLabor };
    delete newEdited[itemId];
    setEditedLabor(newEdited);
  };

  const handleAddCustomItem = async () => {
    if (!user || !newItemName || !newItemUnit || !newLaborCost) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const category = newItemCategory === 'custom' ? newCustomCategory : newItemCategory;
    if (!category) {
      toast({
        title: "Missing Category",
        description: "Please select or enter a category",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('contractor_pricing_items')
        .insert({
          contractor_id: user.id,
          category,
          item_name: newItemName,
          unit: newItemUnit,
          material_cost: parseFloat(newMaterialCost) || 0,
          labor_cost: parseFloat(newLaborCost),
          notes: newNotes || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom pricing item added successfully",
      });

      await fetchCustomItems();
      setAddDialogOpen(false);
      resetNewItemForm();
    } catch (error: any) {
      console.error('Error adding custom item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add custom item",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetNewItemForm = () => {
    setNewItemCategory("");
    setNewCustomCategory("");
    setNewItemName("");
    setNewItemUnit("");
    setNewMaterialCost("");
    setNewLaborCost("");
    setNewNotes("");
  };

  const handleExportCSV = () => {
    if (customItems.length === 0) {
      toast({
        title: "No Items",
        description: "No custom items to export",
        variant: "destructive",
      });
      return;
    }

    const csvHeaders = "Category,Item Name,Unit,Material Cost,Labor Cost,Notes\n";
    const csvRows = customItems.map(item => {
      const category = `"${item.category || ""}"`;
      const itemName = `"${item.item_name || ""}"`;
      const unit = `"${item.unit || ""}"`;
      const materialCost = item.material_cost || 0;
      const laborCost = item.labor_cost || 0;
      const notes = `"${(item.notes || "").replace(/"/g, '""')}"`;
      return `${category},${itemName},${unit},${materialCost},${laborCost},${notes}`;
    }).join("\n");

    const csvContent = csvHeaders + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `custom_pricing_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Success",
      description: "Custom pricing items exported successfully",
    });
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        
        if (lines.length < 2) {
          toast({
            title: "Invalid File",
            description: "CSV file is empty or invalid",
            variant: "destructive",
          });
          return;
        }

        const dataLines = lines.slice(1); // Skip header
        const itemsToImport: Array<{
          category: string;
          item_name: string;
          unit: string;
          material_cost: number;
          labor_cost: number;
          notes: string;
        }> = [];

        for (const line of dataLines) {
          const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 5) continue;

          const [category, itemName, unit, materialCost, laborCost, notes = ""] = matches.map(
            field => field.replace(/^"|"$/g, "").replace(/""/g, '"')
          );

          itemsToImport.push({
            category: category.trim(),
            item_name: itemName.trim(),
            unit: unit.trim(),
            material_cost: parseFloat(materialCost) || 0,
            labor_cost: parseFloat(laborCost) || 0,
            notes: notes.trim()
          });
        }

        if (itemsToImport.length === 0) {
          toast({
            title: "No Items",
            description: "No valid items found in CSV",
            variant: "destructive",
          });
          return;
        }

        if (!user) {
          toast({
            title: "Authentication Error",
            description: "You must be logged in",
            variant: "destructive",
          });
          return;
        }

        const itemsWithContractorId = itemsToImport.map(item => ({
          ...item,
          contractor_id: user.id
        }));

        const { error } = await supabase
          .from("contractor_pricing_items")
          .insert(itemsWithContractorId);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Successfully imported ${itemsToImport.length} items`,
        });
        fetchCustomItems();
      } catch (error) {
        console.error("Error importing CSV:", error);
        toast({
          title: "Error",
          description: "Failed to import CSV file",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pricing_templates')
        .select('*')
        .eq('contractor_id', user.id)
        .order('template_name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTemplate = async () => {
    if (!user || !newTemplateName || !newTemplateType || selectedItems.size === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide template name, type, and select at least one item",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Create the template
      const { data: template, error: templateError } = await supabase
        .from('pricing_templates')
        .insert({
          contractor_id: user.id,
          template_name: newTemplateName,
          project_type: newTemplateType,
          description: newTemplateDescription || null
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Add items to the template
      const templateItems = Array.from(selectedItems).map(itemId => {
        const isCustom = customItems.some(item => item.id === itemId);
        return {
          template_id: template.id,
          item_type: isCustom ? 'custom' as const : 'standard' as const,
          pricing_guide_id: isCustom ? null : itemId,
          custom_item_id: isCustom ? itemId : null,
          quantity: 1
        };
      });

      const { error: itemsError } = await supabase
        .from('template_items')
        .insert(templateItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Template created successfully",
      });

      await fetchTemplates();
      setTemplateDialogOpen(false);
      setNewTemplateName("");
      setNewTemplateType("");
      setNewTemplateDescription("");
      setSelectedItems(new Set());
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (!user) return;

    setSaving(true);
    try {
      // Fetch template items
      const { data: templateItems, error } = await supabase
        .from('template_items')
        .select('*')
        .eq('template_id', templateId);

      if (error) throw error;

      const itemsToCreate = [];
      
      for (const item of templateItems || []) {
        if (item.item_type === 'custom' && item.custom_item_id) {
          // Get the custom item details
          const { data: customItem } = await supabase
            .from('contractor_pricing_items')
            .select('*')
            .eq('id', item.custom_item_id)
            .single();

          if (customItem) {
            itemsToCreate.push({
              contractor_id: user.id,
              category: customItem.category,
              item_name: customItem.item_name,
              unit: customItem.unit,
              material_cost: customItem.material_cost,
              labor_cost: customItem.labor_cost,
              notes: customItem.notes
            });
          }
        }
      }

      if (itemsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('contractor_pricing_items')
          .insert(itemsToCreate);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: `Applied template and created ${itemsToCreate.length} items`,
      });

      await fetchCustomItems();
      setApplyTemplateDialogOpen(false);
    } catch (error: any) {
      console.error('Error applying template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to apply template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('pricing_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      await fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };


  const handleEditCustomItem = (item: CustomPricingItem) => {
    setEditingCustomId(item.id);
    setEditedCustom({
      ...editedCustom,
      [item.id]: {
        item_name: item.item_name,
        unit: item.unit,
        material_cost: item.material_cost,
        labor_cost: item.labor_cost,
        notes: item.notes
      }
    });
  };

  const handleSaveCustomItem = async (itemId: string) => {
    setSaving(true);
    try {
      const updates = editedCustom[itemId];
      
      const { error } = await supabase
        .from('contractor_pricing_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      await fetchCustomItems();
      toast({
        title: "Success",
        description: "Custom item updated successfully",
      });

      setEditingCustomId(null);
      const newEdited = { ...editedCustom };
      delete newEdited[itemId];
      setEditedCustom(newEdited);
    } catch (error: any) {
      console.error('Error updating custom item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update custom item",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this custom pricing item?")) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('contractor_pricing_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchCustomItems();
      toast({
        title: "Success",
        description: "Custom item deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting custom item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete custom item",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ContractorLayout>
      <div className="min-h-screen bg-background -m-6">
        <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contractor/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Labor Cost Management</h1>
          <p className="text-muted-foreground">
            Set your labor costs for different project items. Material costs are provided by SmartReno.
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <Label>Filter by Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-64">
                <SelectValue />
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={customItems.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" asChild>
              <label htmlFor="csv-import" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
                <input
                  id="csv-import"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportCSV}
                />
              </label>
            </Button>
            <Button variant="outline" onClick={() => setApplyTemplateDialogOpen(true)} disabled={templates.length === 0}>
              <BookTemplate className="h-4 w-4 mr-2" />
              Apply Template
            </Button>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
              <BookTemplate className="h-4 w-4 mr-2" />
              Create Template
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Item
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Guide</CardTitle>
            <CardDescription>
              Material costs are set by SmartReno. You can customize labor costs for your business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Material Cost</TableHead>
                  <TableHead>Your Labor Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="capitalize">{item.category}</TableCell>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          ${item.material_cost.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={editedLabor[item.id] || 0}
                              onChange={(e) => setEditedLabor({
                                ...editedLabor,
                                [item.id]: parseFloat(e.target.value) || 0
                              })}
                              className="w-24"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold">${item.labor_cost.toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold">
                        ${(item.material_cost + (editingId === item.id ? (editedLabor[item.id] || 0) : item.labor_cost)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === item.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveLabor(item.id)}
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelEdit(item.id)}
                              disabled={saving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditLabor(item.id, item.labor_cost)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Custom Pricing Items Section */}
        {filteredCustomItems.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>My Custom Pricing Items</CardTitle>
              <CardDescription>
                Custom items you've created for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Material Cost</TableHead>
                    <TableHead>Labor Cost</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomItems.map((item) => {
                    const isEditing = editingCustomId === item.id;
                    const edited = editedCustom[item.id] || {};
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="capitalize">{item.category}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={edited.item_name ?? item.item_name}
                              onChange={(e) => setEditedCustom({
                                ...editedCustom,
                                [item.id]: { ...edited, item_name: e.target.value }
                              })}
                              className="w-full"
                            />
                          ) : (
                            <span className="font-medium">{item.item_name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={edited.unit ?? item.unit}
                              onChange={(e) => setEditedCustom({
                                ...editedCustom,
                                [item.id]: { ...edited, unit: e.target.value }
                              })}
                              className="w-20"
                            />
                          ) : (
                            item.unit
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">$</span>
                              <Input
                                type="number"
                                value={edited.material_cost ?? item.material_cost}
                                onChange={(e) => setEditedCustom({
                                  ...editedCustom,
                                  [item.id]: { ...edited, material_cost: parseFloat(e.target.value) || 0 }
                                })}
                                className="w-24"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">${item.material_cost.toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">$</span>
                              <Input
                                type="number"
                                value={edited.labor_cost ?? item.labor_cost}
                                onChange={(e) => setEditedCustom({
                                  ...editedCustom,
                                  [item.id]: { ...edited, labor_cost: parseFloat(e.target.value) || 0 }
                                })}
                                className="w-24"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          ) : (
                            <span className="font-semibold">${item.labor_cost.toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold">
                          ${((edited.material_cost ?? item.material_cost) + (edited.labor_cost ?? item.labor_cost)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveCustomItem(item.id)}
                                disabled={saving}
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingCustomId(null);
                                  const newEdited = { ...editedCustom };
                                  delete newEdited[item.id];
                                  setEditedCustom(newEdited);
                                }}
                                disabled={saving}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditCustomItem(item)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteCustomItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Add Custom Item Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Custom Pricing Item</DialogTitle>
              <CardDescription>
                Create a custom pricing item for your business
              </CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newItemCategory === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory">Custom Category Name</Label>
                  <Input
                    id="customCategory"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="itemName">
                  Item Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="itemName"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g., Custom Tile Installation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unit"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  placeholder="e.g., sq ft, linear ft, each"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialCost">Material Cost (per unit)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="materialCost"
                    type="number"
                    value={newMaterialCost}
                    onChange={(e) => setNewMaterialCost(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborCost">
                  Labor Cost (per unit) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="laborCost"
                    type="number"
                    value={newLaborCost}
                    onChange={(e) => setNewLaborCost(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Add any notes about this item..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAddCustomItem}
                className="w-full"
                disabled={!newItemName || !newItemUnit || !newLaborCost || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Template Dialog */}
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Pricing Template</DialogTitle>
              <CardDescription>
                Save a bundle of items for reuse in similar projects
              </CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">
                  Template Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="templateName"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Standard Kitchen Remodel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">
                  Project Type <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectType"
                  value={newTemplateType}
                  onChange={(e) => setNewTemplateType(e.target.value)}
                  placeholder="e.g., Kitchen, Bathroom, Basement"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description</Label>
                <Textarea
                  id="templateDescription"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Select Items <span className="text-red-500">*</span>
                </Label>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                  {[...filteredItems, ...filteredCustomItems].length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No items available
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredItems.map(item => (
                        <div
                          key={item.id}
                          className="p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleItemSelection(item.id)}
                        >
                          <div className="flex items-center justify-center w-5 h-5 border rounded">
                            {selectedItems.has(item.id) && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{item.item_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.category} • ${(item.material_cost + item.labor_cost).toFixed(2)}/{item.unit}
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredCustomItems.map(item => (
                        <div
                          key={item.id}
                          className="p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleItemSelection(item.id)}
                        >
                          <div className="flex items-center justify-center w-5 h-5 border rounded">
                            {selectedItems.has(item.id) && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{item.item_name} <span className="text-xs text-muted-foreground">(Custom)</span></div>
                            <div className="text-sm text-muted-foreground">
                              {item.category} • ${(item.material_cost + item.labor_cost).toFixed(2)}/{item.unit}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                </p>
              </div>

              <Button
                onClick={handleCreateTemplate}
                className="w-full"
                disabled={!newTemplateName || !newTemplateType || selectedItems.size === 0 || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <BookTemplate className="mr-2 h-4 w-4" />
                    Create Template
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Apply Template Dialog */}
        <Dialog open={applyTemplateDialogOpen} onOpenChange={setApplyTemplateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Apply Pricing Template</DialogTitle>
              <CardDescription>
                Select a template to add its items to your pricing
              </CardDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {templates.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No templates created yet
                </div>
              ) : (
                templates.map(template => (
                  <div key={template.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{template.template_name}</h4>
                        <p className="text-sm text-muted-foreground">{template.project_type}</p>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={() => handleApplyTemplate(template.id)}
                      className="w-full"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        'Apply Template'
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </ContractorLayout>
  );
}
