import { BlogGeneratorPanel } from "@/components/admin/ai/BlogGeneratorPanel";
import { WebsiteOptimizationDashboard } from "@/components/admin/WebsiteOptimizationDashboard";
import { ComprehensiveHealthDashboard } from "@/components/admin/ComprehensiveHealthDashboard";
import { CostEstimatorWidget } from "@/components/website/CostEstimatorWidget";
import { AIChatWidget } from "@/components/website/AIChatWidget";

export default function AdminWebsiteAI() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Website AI Enhancements</h1>
        <p className="text-muted-foreground">
          AI-powered tools to improve engagement, SEO, and conversions
        </p>
      </div>

      <div className="grid gap-6">
        <ComprehensiveHealthDashboard />
        
        <div className="grid md:grid-cols-2 gap-6">
          <BlogGeneratorPanel />
          <WebsiteOptimizationDashboard />
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Public Website Widgets (Preview)</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex justify-center">
              <CostEstimatorWidget />
            </div>
            <div className="relative h-96 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">AI Chat Widget appears here</p>
              <AIChatWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}