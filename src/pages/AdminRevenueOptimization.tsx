import { AdminLayout } from "@/components/admin/AdminLayout";
import { UpsellPanel } from "@/components/admin/UpsellPanel";
import { PricingOptimizationPanel } from "@/components/admin/PricingOptimizationPanel";
import { FinanceOptionsPanel } from "@/components/admin/FinanceOptionsPanel";
import { MatchOptimizerPanel } from "@/components/admin/MatchOptimizerPanel";
import { ConversionAssistantPanel } from "@/components/admin/ConversionAssistantPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Users, Target, Sparkles } from "lucide-react";

export default function AdminRevenueOptimization() {
  // Demo data
  const demoProject = {
    id: 'demo-project-123',
    scope: {
      projectType: 'Kitchen Remodel',
      squareFootage: 250,
      rooms: ['Kitchen'],
    },
    budgetRange: '$40,000 - $60,000',
  };

  const demoHomeowner = {
    id: 'demo-homeowner-456',
    name: 'John Smith',
  };

  const demoEstimate = {
    total: 52000,
    lineItems: [
      { name: 'Cabinets', cost: 15000 },
      { name: 'Countertops', cost: 8000 },
      { name: 'Flooring', cost: 6000 },
      { name: 'Labor', cost: 20000 },
    ],
  };

  const demoContractors = [
    { id: '1', name: 'Contractor A', specialty: 'Kitchens', winRate: 0.72 },
    { id: '2', name: 'Contractor B', specialty: 'Kitchens', winRate: 0.65 },
    { id: '3', name: 'Contractor C', specialty: 'General', winRate: 0.58 },
  ];

  const demoSession = {
    time_on_page: 180,
    clicked_pricing: true,
    viewed_faqs: true,
    clicked_gallery: false,
    form_abandonment: true,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Revenue Optimization AI (Phase 9)
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered tools to increase revenue, conversion rates, and marketplace performance
          </p>
        </div>

        <Tabs defaultValue="upsells" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upsells" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Upsells
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="financing" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Financing
            </TabsTrigger>
            <TabsTrigger value="matching" className="gap-2">
              <Users className="h-4 w-4" />
              Matching
            </TabsTrigger>
            <TabsTrigger value="conversion" className="gap-2">
              <Target className="h-4 w-4" />
              Conversion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upsells" className="mt-6">
            <UpsellPanel
              projectId={demoProject.id}
              scope={demoProject.scope}
              homeownerProfile={demoHomeowner}
              budgetRange={demoProject.budgetRange}
              uploadedPhotos={[1, 2, 3]} // Demo: 3 photos uploaded
            />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <PricingOptimizationPanel
              estimate={demoEstimate}
              marketData={{}}
              contractorBidHistory={[]}
              projectType="Kitchen Remodel"
              zipCode="90210"
            />
          </TabsContent>

          <TabsContent value="financing" className="mt-6">
            <FinanceOptionsPanel
              projectId={demoProject.id}
              budget={demoProject.budgetRange}
              projectType="Kitchen Remodel"
              homeownerProfile={demoHomeowner}
              location="Los Angeles, CA"
            />
          </TabsContent>

          <TabsContent value="matching" className="mt-6">
            <MatchOptimizerPanel
              projectId={demoProject.id}
              scope={demoProject.scope}
              budgetRange={demoProject.budgetRange}
              zip="90210"
              contractorPool={demoContractors}
            />
          </TabsContent>

          <TabsContent value="conversion" className="mt-6">
            <ConversionAssistantPanel
              homeownerId={demoHomeowner.id}
              projectId={demoProject.id}
              sessionBehavior={demoSession}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
