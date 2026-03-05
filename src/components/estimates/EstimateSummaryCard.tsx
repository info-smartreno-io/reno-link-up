import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface EstimateSummaryCardProps {
  materialsCost: number;
  laborCost: number;
  permitsFees: number;
  contingency: number;
  markupMultiplier: string;
  onMarkupChange: (value: string) => void;
  onPermitsChange: (value: number) => void;
  onContingencyChange: (value: number) => void;
  taxRate?: number;
  isMobileSheet?: boolean;
}

// Markup multipliers based on job cost range
const MARKUP_OPTIONS = [
  { value: "2.00", label: "2.00x ($0 - $100K)", range: "0-100k" },
  { value: "1.85", label: "1.85x ($100K - $150K)", range: "100k-150k" },
  { value: "1.70", label: "1.70x ($151K - $200K)", range: "150k-200k" },
  { value: "1.65", label: "1.65x ($206K - $250K)", range: "200k-250k" },
  { value: "1.60", label: "1.60x ($250K - $500K)", range: "250k-500k" },
  { value: "1.50", label: "1.50x ($500K+)", range: "500k+" },
  { value: "custom", label: "Custom", range: "custom" },
];

export function EstimateSummaryCard({
  materialsCost,
  laborCost,
  permitsFees,
  contingency,
  markupMultiplier,
  onMarkupChange,
  onPermitsChange,
  onContingencyChange,
  taxRate = 6.625, // NJ default
  isMobileSheet = false,
}: EstimateSummaryCardProps) {
  const subtotal = materialsCost + laborCost + permitsFees + contingency;
  const multiplier = parseFloat(markupMultiplier) || 1;
  const salePrice = subtotal * multiplier;
  const taxAmount = (salePrice * taxRate) / 100;
  const grandTotal = salePrice + taxAmount;
  const grossProfit = salePrice - subtotal;
  const grossProfitPercent = subtotal > 0 ? ((grossProfit / salePrice) * 100) : 0;

  // Auto-suggest markup based on job cost
  const getSuggestedMarkup = (cost: number): string => {
    if (cost <= 100000) return "2.00";
    if (cost <= 150000) return "1.85";
    if (cost <= 200000) return "1.70";
    if (cost <= 250000) return "1.65";
    if (cost <= 500000) return "1.60";
    return "1.50";
  };

  const suggestedMarkup = getSuggestedMarkup(subtotal);

  const content = (
    <div className="space-y-4">
      {/* Cost Breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Materials</span>
          <span className="font-medium">${materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Labor</span>
          <span className="font-medium">${laborCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        
        <div className="flex justify-between text-sm items-center gap-2">
          <span className="text-muted-foreground">Permits & Fees</span>
          <Input
            type="number"
            value={permitsFees || ''}
            onChange={(e) => onPermitsChange(parseFloat(e.target.value) || 0)}
            className={cn("text-right text-sm", isMobileSheet ? "w-32 h-11" : "w-28 h-8")}
            min={0}
          />
        </div>
        
        <div className="flex justify-between text-sm items-center gap-2">
          <span className="text-muted-foreground">Contingency</span>
          <Input
            type="number"
            value={contingency || ''}
            onChange={(e) => onContingencyChange(parseFloat(e.target.value) || 0)}
            className={cn("text-right text-sm", isMobileSheet ? "w-32 h-11" : "w-28 h-8")}
            min={0}
          />
        </div>
      </div>

      <Separator />

      {/* Subtotal */}
      <div className="flex justify-between font-medium">
        <span>Job Cost (Subtotal)</span>
        <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>

      <Separator />

      {/* Markup Selector */}
      <div className="space-y-2">
        <Label className="text-sm">Markup Multiplier</Label>
        <Select value={markupMultiplier} onValueChange={onMarkupChange}>
          <SelectTrigger className={cn("w-full", isMobileSheet && "h-11")}>
            <SelectValue placeholder="Select markup" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {MARKUP_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {markupMultiplier !== suggestedMarkup && subtotal > 0 && (
          <p className="text-xs text-muted-foreground">
            Suggested: {suggestedMarkup}x based on job cost
          </p>
        )}
      </div>

      <Separator />

      {/* Sale Price */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sale Price</span>
          <span className="font-medium">${salePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax ({taxRate}%)</span>
          <span className="font-medium">${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <Separator />

      {/* Grand Total */}
      <div className="flex justify-between items-center pt-2">
        <span className="text-lg font-bold">Grand Total</span>
        <span className="text-2xl font-bold text-primary">
          ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Profit Metrics */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Profit Analysis
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gross Profit</span>
          <span className="font-medium text-green-600">
            ${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gross Margin</span>
          <span className="font-medium text-green-600">
            {grossProfitPercent.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );

  // For mobile sheet, return content without card wrapper
  if (isMobileSheet) {
    return content;
  }

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          Estimate Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
