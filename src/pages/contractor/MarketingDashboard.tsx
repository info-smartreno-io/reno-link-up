import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { MarketingOverviewCards } from "@/components/marketing/MarketingOverviewCards";
import { SourceChart } from "@/components/marketing/SourceChart";
import { TownPerformanceTable } from "@/components/marketing/TownPerformanceTable";
import { ServiceTypeTable } from "@/components/marketing/ServiceTypeTable";
import { LeadActivityTable } from "@/components/marketing/LeadActivityTable";
import { marketingAnalyticsService } from "@/services/marketingAnalyticsService";

export default function MarketingDashboard() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const { data: leadCounts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ['marketing-lead-counts'],
    queryFn: () => marketingAnalyticsService.getLeadCounts(),
  });

  const { data: funnelMetrics, isLoading: isLoadingFunnel } = useQuery({
    queryKey: ['marketing-funnel-metrics'],
    queryFn: () => marketingAnalyticsService.getLeadFunnelMetrics(),
  });

  const { data: sourceData, isLoading: isLoadingSource } = useQuery({
    queryKey: ['marketing-source-breakdown'],
    queryFn: () => marketingAnalyticsService.getLeadsBySource(),
  });

  const { data: townData, isLoading: isLoadingTown } = useQuery({
    queryKey: ['marketing-town-performance'],
    queryFn: () => marketingAnalyticsService.getLeadsByTown(),
  });

  const { data: serviceData, isLoading: isLoadingService } = useQuery({
    queryKey: ['marketing-service-performance'],
    queryFn: () => marketingAnalyticsService.getLeadsByServiceType(),
  });

  // Calculate avg project size from service data
  const avgProjectSize = serviceData && serviceData.length > 0
    ? Math.round(serviceData.reduce((sum, s) => sum + s.avgValue, 0) / serviceData.filter(s => s.avgValue > 0).length)
    : 0;

  const handleSourceClick = (source: string) => {
    setSelectedSource(source === selectedSource ? null : source);
  };

  return (
    <>
      <Helmet>
        <title>Marketing Dashboard | SmartReno</title>
        <meta name="description" content="Track lead sources, attribution, and marketing performance metrics" />
      </Helmet>
      
      <ContractorLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
            <p className="text-muted-foreground">
              Lead intelligence & attribution dashboard
            </p>
          </div>

          {/* Overview Cards */}
          <MarketingOverviewCards
            weeklyLeads={leadCounts?.thisWeek || 0}
            monthlyLeads={leadCounts?.thisMonth || 0}
            funnelMetrics={funnelMetrics || { total: 0, new: 0, contacted: 0, qualified: 0, sold: 0, lost: 0 }}
            avgProjectSize={avgProjectSize}
            isLoading={isLoadingCounts || isLoadingFunnel}
          />

          {/* Source Chart and Tables Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SourceChart 
              data={sourceData || []} 
              onSourceClick={handleSourceClick}
            />
            <TownPerformanceTable 
              data={townData || []} 
              isLoading={isLoadingTown}
            />
          </div>

          {/* Service Type Table */}
          <ServiceTypeTable 
            data={serviceData || []} 
            isLoading={isLoadingService}
          />

          {/* Lead Activity Table */}
          <LeadActivityTable />
        </div>
      </ContractorLayout>
    </>
  );
}
