import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Target, DollarSign } from "lucide-react";
import { LeadFunnelMetrics } from "@/services/marketingAnalyticsService";

interface MarketingOverviewCardsProps {
  weeklyLeads: number;
  monthlyLeads: number;
  funnelMetrics: LeadFunnelMetrics;
  avgProjectSize?: number;
  isLoading?: boolean;
}

export function MarketingOverviewCards({
  weeklyLeads,
  monthlyLeads,
  funnelMetrics,
  avgProjectSize = 0,
  isLoading,
}: MarketingOverviewCardsProps) {
  const closeRate = funnelMetrics.total > 0 
    ? Math.round((funnelMetrics.sold / funnelMetrics.total) * 100) 
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      title: "Leads This Week",
      value: weeklyLeads,
      icon: Users,
      description: "New leads in the last 7 days",
      color: "text-blue-500",
    },
    {
      title: "Leads This Month",
      value: monthlyLeads,
      icon: TrendingUp,
      description: "New leads in the last 30 days",
      color: "text-green-500",
    },
    {
      title: "Close Rate",
      value: `${closeRate}%`,
      icon: Target,
      description: `${funnelMetrics.sold} of ${funnelMetrics.total} leads closed`,
      color: "text-purple-500",
    },
    {
      title: "Avg Project Size",
      value: avgProjectSize > 0 ? formatCurrency(avgProjectSize) : '-',
      icon: DollarSign,
      description: "Average closed project value",
      color: "text-amber-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
