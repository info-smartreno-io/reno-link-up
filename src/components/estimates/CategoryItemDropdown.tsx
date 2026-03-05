import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineItemData } from "./EstimateLineItem";
import { cn } from "@/lib/utils";

interface PricingGuideItem {
  id: string;
  item_name: string;
  category: string;
  unit: string;
  material_cost: number;
  labor_cost: number;
  notes?: string;
}

interface CategoryItemDropdownProps {
  category: string;
  onAddItem: (item: Partial<LineItemData>) => void;
  buttonVariant?: "default" | "ghost" | "outline";
  className?: string;
}

export function CategoryItemDropdown({ 
  category, 
  onAddItem, 
  buttonVariant = "outline",
  className 
}: CategoryItemDropdownProps) {
  const [items, setItems] = useState<PricingGuideItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && items.length === 0) {
      fetchCategoryItems();
    }
  }, [open, category]);

  const fetchCategoryItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pricing_guide')
        .select('*')
        .eq('category', category)
        .order('item_name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching category items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: PricingGuideItem) => {
    onAddItem({
      description: item.item_name,
      quantity: 1,
      unit: item.unit,
      materialCost: item.material_cost,
      laborCost: item.labor_cost,
      category: item.category,
      pricingGuideId: item.id,
      totalCost: item.material_cost + item.labor_cost,
    });
    setOpen(false);
  };

  const handleAddCustom = () => {
    onAddItem({
      description: "",
      quantity: 1,
      unit: "UNIT",
      materialCost: 0,
      laborCost: 0,
      category: category,
      totalCost: 0,
    });
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size="sm" 
          className={cn("gap-2", className)}
        >
          <Plus className="h-4 w-4" />
          Add Item
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-80 max-h-80 overflow-y-auto bg-popover border shadow-lg z-50"
        sideOffset={4}
      >
        <DropdownMenuLabel className="font-semibold">{category} Items</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
            No items in pricing guide for this category
          </div>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => handleSelectItem(item)}
              className="flex flex-col items-start gap-1 cursor-pointer py-2"
            >
              <span className="font-medium">{item.item_name}</span>
              <span className="text-xs text-muted-foreground">
                {item.unit} • Material: ${item.material_cost.toLocaleString()} • Labor: ${item.labor_cost.toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleAddCustom}
          className="text-primary font-medium cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Item
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
