import { MarketplaceRoutingDashboard } from "@/components/admin/MarketplaceRoutingDashboard";
import { SkillGraphViewer } from "@/components/admin/SkillGraphViewer";
import { AvailabilityPanel } from "@/components/admin/AvailabilityPanel";
import { WorkloadBalancerPanel } from "@/components/admin/WorkloadBalancerPanel";
import { RFPAutomationConsole } from "@/components/admin/RFPAutomationConsole";

export default function AdminMarketplace() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Autonomous Marketplace Routing</h1>
        <p className="text-muted-foreground">
          AI-powered contractor matching and routing system
        </p>
      </div>

      <div className="grid gap-6">
        <MarketplaceRoutingDashboard />
        <div className="grid md:grid-cols-2 gap-6">
          <SkillGraphViewer />
          <AvailabilityPanel />
        </div>
        <WorkloadBalancerPanel />
        <RFPAutomationConsole />
      </div>
    </div>
  );
}
