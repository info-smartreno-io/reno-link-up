import { RegionalCostIndexMap } from "@/components/admin/RegionalCostIndexMap";
import { MarketIntelligenceDashboard } from "@/components/admin/MarketIntelligenceDashboard";
import { PermitRulesPanel } from "@/components/admin/PermitRulesPanel";

export default function AdminNationalExpansion() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">National Expansion & Market Intelligence</h1>
        <p className="text-muted-foreground">
          AI-powered multi-market analysis and regional expansion planning
        </p>
      </div>

      <div className="grid gap-6">
        <MarketIntelligenceDashboard />
        <RegionalCostIndexMap />
        <PermitRulesPanel />
      </div>
    </div>
  );
}
