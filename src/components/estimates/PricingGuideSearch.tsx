import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineItemData } from "./EstimateLineItem";
import { CATEGORY_COLORS } from "./EstimateCategorySection";
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

interface PricingGuideSearchProps {
  onAddItem: (item: Partial<LineItemData>) => void;
}

export function PricingGuideSearch({ onAddItem }: PricingGuideSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [pricingItems, setPricingItems] = useState<PricingGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchPricingGuide();
  }, []);

  const fetchPricingGuide = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_guide')
        .select('*')
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (error) throw error;

      setPricingItems(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching pricing guide:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item: PricingGuideItem) => {
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
  };

  const filteredItems = pricingItems.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PricingGuideItem[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pricing guide..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <ScrollArea className="h-[500px] border rounded-lg">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No items found</p>
            <p className="text-sm text-muted-foreground">Try a different search or category</p>
          </div>
        ) : (
          <div className="divide-y">
            {Object.entries(groupedItems).map(([category, items]) => {
              const colors = CATEGORY_COLORS[category] || { bg: "bg-muted", text: "text-foreground" };
              
              return (
                <div key={category}>
                  {/* Category Header */}
                  <div className={cn("px-4 py-2 sticky top-0 z-10", colors.bg)}>
                    <span className={cn("font-semibold text-sm", colors.text)}>{category}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{items.length}</Badge>
                  </div>
                  
                  {/* Items */}
                  <div className="divide-y divide-border/50">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.item_name}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            <span>Unit: {item.unit}</span>
                            <span>Material: ${item.material_cost.toLocaleString()}</span>
                            <span>Labor: ${item.labor_cost.toLocaleString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 shrink-0"
                          onClick={() => handleAddItem(item)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <p className="text-xs text-muted-foreground text-center">
        {filteredItems.length} items in pricing guide
      </p>
    </div>
  );
}
