import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { EstimateLineItem, LineItemData } from "./EstimateLineItem";
import { CategoryItemDropdown } from "./CategoryItemDropdown";
import { cn } from "@/lib/utils";

// Category colors matching the spreadsheet
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Design/Planning": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "General Conditions": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "Dumpster": { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500/30" },
  "Demo": { bg: "bg-sky-500/10", text: "text-sky-700", border: "border-sky-500/30" },
  "Foundation": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30" },
  "Framing": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "Roofing": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30" },
  "Siding": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "Gutters": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30" },
  "Masonry": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "Electrical": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30" },
  "Plumbing": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "HVAC": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30" },
  "Insulation": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "Drywall": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30" },
  "Flooring": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "Doors": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30" },
  "Carpentry": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "Painting": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30" },
  "Deck": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "Cabinets": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30" },
  "Counter Tops": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
  "Tile": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30" },
  "Windows": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/30" },
};

interface EstimateCategorySectionProps {
  category: string;
  items: LineItemData[];
  onUpdateItem: (id: string, field: keyof LineItemData, value: any) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (category: string, itemData?: Partial<LineItemData>) => void;
  defaultExpanded?: boolean;
}

export function EstimateCategorySection({
  category,
  items,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  defaultExpanded = true,
}: EstimateCategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const colors = CATEGORY_COLORS[category] || { 
    bg: "bg-muted", 
    text: "text-foreground", 
    border: "border-border" 
  };

  const categoryTotal = items.reduce((sum, item) => sum + item.totalCost, 0);
  const itemCount = items.length;

  const handleAddFromDropdown = (itemData: Partial<LineItemData>) => {
    onAddItem(category, itemData);
  };

  return (
    <div className={cn("rounded-lg border overflow-hidden", colors.border)}>
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 transition-colors",
          colors.bg,
          "hover:opacity-90"
        )}
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {isExpanded ? (
            <ChevronDown className={cn("h-4 w-4 md:h-5 md:w-5 shrink-0", colors.text)} />
          ) : (
            <ChevronRight className={cn("h-4 w-4 md:h-5 md:w-5 shrink-0", colors.text)} />
          )}
          <span className={cn("font-semibold text-sm md:text-base truncate", colors.text)}>{category}</span>
          <span className="text-xs md:text-sm text-muted-foreground shrink-0">({itemCount})</span>
        </div>
        <div className={cn("font-bold text-sm md:text-base shrink-0", colors.text)}>
          ${categoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </button>

      {/* Items */}
      {isExpanded && (
        <div className="bg-background">
          {/* Column Headers - Desktop Only */}
          {items.length > 0 && (
            <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b bg-muted/30">
              <div className="col-span-1"></div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-1 text-center">Unit</div>
              <div className="col-span-2">Material</div>
              <div className="col-span-2">Labor</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>
          )}
          
          {/* Line Items */}
          <div className="divide-y divide-border/50 md:divide-y-0 p-2 md:p-0 space-y-2 md:space-y-0">
            {items.map((item) => (
              <EstimateLineItem
                key={item.id}
                item={item}
                onUpdate={onUpdateItem}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
          
          {/* Add Item Dropdown */}
          <div className="p-2 md:p-3 border-t bg-muted/20">
            <CategoryItemDropdown
              category={category}
              onAddItem={handleAddFromDropdown}
              buttonVariant="ghost"
              className="w-full justify-center text-muted-foreground hover:text-foreground h-10 md:h-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { CATEGORY_COLORS };
