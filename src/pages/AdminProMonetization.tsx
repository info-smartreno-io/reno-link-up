import { LeadScoringPanel } from "@/components/admin/LeadScoringPanel";
import { PremiumRoutingPanel } from "@/components/admin/PremiumRoutingPanel";
import { ProPlusInsightsDashboard } from "@/components/admin/ProPlusInsightsDashboard";
import { HomePlusDesignStudio } from "@/components/admin/HomePlusDesignStudio";
import { FleetAllocationDashboard } from "@/components/admin/FleetAllocationDashboard";

export default function AdminProMonetization() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">SmartReno Pro+ Monetization AI</h1>
        <p className="text-muted-foreground">
          Revenue optimization and premium features powered by AI
        </p>
      </div>

      <div className="grid gap-6">
        <LeadScoringPanel />
        <PremiumRoutingPanel />
        <ProPlusInsightsDashboard />
        <HomePlusDesignStudio />
        <FleetAllocationDashboard />
      </div>
    </div>
  );
}
