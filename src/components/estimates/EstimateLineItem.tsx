import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical } from "lucide-react";

export interface LineItemData {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  category: string;
  notes?: string;
  pricingGuideId?: string;
}

interface EstimateLineItemProps {
  item: LineItemData;
  onUpdate: (id: string, field: keyof LineItemData, value: any) => void;
  onRemove: (id: string) => void;
  showCategory?: boolean;
}

const UNITS = [
  { value: "SQFT", label: "SQFT" },
  { value: "LF", label: "LF" },
  { value: "UNIT", label: "UNIT" },
  { value: "PER DIEM", label: "PER DIEM" },
  { value: "BOARDS", label: "BOARDS" },
  { value: "WINDOW", label: "WINDOW" },
  { value: "DOOR", label: "DOOR" },
  { value: "EA", label: "EA" },
];

export function EstimateLineItem({ item, onUpdate, onRemove, showCategory = false }: EstimateLineItemProps) {
  const handleQuantityChange = (value: string) => {
    const qty = parseFloat(value) || 0;
    onUpdate(item.id, 'quantity', qty);
    onUpdate(item.id, 'totalCost', (item.materialCost + item.laborCost) * qty);
  };

  const handleMaterialChange = (value: string) => {
    const cost = parseFloat(value) || 0;
    onUpdate(item.id, 'materialCost', cost);
    onUpdate(item.id, 'totalCost', (cost + item.laborCost) * item.quantity);
  };

  const handleLaborChange = (value: string) => {
    const cost = parseFloat(value) || 0;
    onUpdate(item.id, 'laborCost', cost);
    onUpdate(item.id, 'totalCost', (item.materialCost + cost) * item.quantity);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-12 gap-2 items-center py-2 px-3 bg-background hover:bg-muted/30 rounded-lg transition-colors group">
        <div className="col-span-1 flex items-center gap-1">
          <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
        </div>
        
        <div className="col-span-3">
          <Input
            value={item.description}
            onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
            placeholder="Item description"
            className="h-9 text-sm"
          />
        </div>
        
        <div className="col-span-1">
          <Input
            type="number"
            value={item.quantity || ''}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="0"
            className="h-9 text-sm text-center"
            min={0}
          />
        </div>
        
        <div className="col-span-1">
          <Select value={item.unit} onValueChange={(value) => onUpdate(item.id, 'unit', value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {UNITS.map(u => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-2">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              value={item.materialCost || ''}
              onChange={(e) => handleMaterialChange(e.target.value)}
              placeholder="0.00"
              className="h-9 text-sm pl-6"
              min={0}
              step={0.01}
            />
          </div>
        </div>
        
        <div className="col-span-2">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              value={item.laborCost || ''}
              onChange={(e) => handleLaborChange(e.target.value)}
              placeholder="0.00"
              className="h-9 text-sm pl-6"
              min={0}
              step={0.01}
            />
          </div>
        </div>
        
        <div className="col-span-1 font-semibold text-sm text-right">
          ${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        
        <div className="col-span-1 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden p-3 bg-background rounded-lg border border-border/50 space-y-3">
        {/* Description - Full Width */}
        <Input
          value={item.description}
          onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
          placeholder="Item description"
          className="h-11 text-sm"
        />
        
        {/* Qty & Unit Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Qty</label>
            <Input
              type="number"
              value={item.quantity || ''}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="0"
              className="h-11 text-sm"
              min={0}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Unit</label>
            <Select value={item.unit} onValueChange={(value) => onUpdate(item.id, 'unit', value)}>
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {UNITS.map(u => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Material & Labor Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Material $</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                value={item.materialCost || ''}
                onChange={(e) => handleMaterialChange(e.target.value)}
                placeholder="0.00"
                className="h-11 text-sm pl-7"
                min={0}
                step={0.01}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Labor $</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                value={item.laborCost || ''}
                onChange={(e) => handleLaborChange(e.target.value)}
                placeholder="0.00"
                className="h-11 text-sm pl-7"
                min={0}
                step={0.01}
              />
            </div>
          </div>
        </div>

        {/* Total & Delete Row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="font-semibold text-base">
              ${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
