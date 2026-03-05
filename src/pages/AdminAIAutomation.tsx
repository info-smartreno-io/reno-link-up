import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RiskPredictionPanel } from "@/components/admin/RiskPredictionPanel";
import { ForecastingPanel } from "@/components/admin/ForecastingPanel";
import { GlobalMessagingPanel } from "@/components/admin/GlobalMessagingPanel";
import { LeadTimeDashboard } from "@/components/admin/LeadTimeDashboard";
import { Shield, TrendingUp, MessageSquare, Package } from "lucide-react";

export default function AdminAIAutomation() {
  // Sample data for demo purposes
  const sampleProjectId = "sample-project-id";
  const sampleTimeline = [
    { phase: "Demolition", status: "completed", date: "2025-01-15" },
    { phase: "Framing", status: "in_progress", date: "2025-01-20" }
  ];
  const sampleMessages = [
    { from: "contractor", content: "Material delayed", timestamp: "2025-01-18" }
  ];
  const sampleContractorStats = {
    avg_response_time: 24,
    completion_rate: 0.92,
    quality_score: 4.5
  };
  const sampleMaterials = [
    { name: "Anderson 400 Windows", vendor: "WindowCo", quantity: 12 },
    { name: "Porcelain Tile", vendor: "TileWorld", quantity: 500 }
  ];

  return (
    <AdminLayout role="admin">
      <div className="space-y-6">
        <Breadcrumbs />

        <div>
          <h1 className="text-3xl font-bold mb-2">AI Automation & Predictive Intelligence</h1>
          <p className="text-muted-foreground">
            Phase 8: Risk prediction, forecasting, automated messaging, and materials intelligence
          </p>
        </div>

        <Tabs defaultValue="risk" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="risk" className="gap-2">
              <Shield className="h-4 w-4" />
              Risk Prediction
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Forecasting
            </TabsTrigger>
            <TabsTrigger value="messaging" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Messaging
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2">
              <Package className="h-4 w-4" />
              Materials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="risk">
            <RiskPredictionPanel
              projectId={sampleProjectId}
              timeline={sampleTimeline}
              messages={sampleMessages}
              contractorStats={sampleContractorStats}
              materialDelays={[{ material: "Tile", days: 7 }]}
              walkthroughNotes={{ issues: ["Minor wall damage"] }}
            />
          </TabsContent>

          <TabsContent value="forecast">
            <ForecastingPanel
              projectId={sampleProjectId}
              scope={{ type: "Kitchen Remodel", sqft: 400 }}
              contractorPerformance={sampleContractorStats}
              subSchedules={[{ trade: "Plumbing", duration: 3 }]}
              materialLeadTimes={[{ material: "Windows", days: 14 }]}
              pastSimilarProjects={[{ duration: 45, budget_variance: 0.05 }]}
            />
          </TabsContent>

          <TabsContent value="messaging">
            <GlobalMessagingPanel
              projectId={sampleProjectId}
              context={{
                projectName: "Smith Kitchen Remodel",
                homeownerName: "John Smith",
                contractorName: "ABC Contractors",
                currentPhase: "Framing"
              }}
            />
          </TabsContent>

          <TabsContent value="materials">
            <LeadTimeDashboard
              projectId={sampleProjectId}
              materials={sampleMaterials}
              vendorData={{ windowsVendor: { reliability: 0.85 } }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
