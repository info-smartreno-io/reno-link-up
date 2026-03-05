import { useEffect, useState } from "react";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Clock, Target, Users, Percent, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDemoMode } from "@/context/DemoModeContext";

interface KPIMetrics {
  totalLeads: number;
  convertedLeads: number;
  closingRate: number;
  avgTimeToClose: number;
  activeProjects: number;
  totalEstimateValue: number;
  avgEstimateValue: number;
  estimatesThisMonth: number;
}

export default function SalesManagement() {
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      setMetrics({
        totalLeads: 48,
        convertedLeads: 16,
        closingRate: 33.3,
        avgTimeToClose: 14,
        activeProjects: 8,
        totalEstimateValue: 485000,
        avgEstimateValue: 32333,
        estimatesThisMonth: 6,
      });
      setLoading(false);
      return;
    }
    fetchMetrics();
  }, [isDemoMode]);

  const fetchMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch leads data
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("*");

      if (leadsError) throw leadsError;

      // Fetch contractor projects
      const { data: projects, error: projectsError } = await supabase
        .from("contractor_projects")
        .select("*");

      if (projectsError) throw projectsError;

      // Fetch estimates
      const { data: estimates, error: estimatesError } = await supabase
        .from("estimates")
        .select("*");

      if (estimatesError) throw estimatesError;

      // Calculate metrics
      const totalLeads = leads?.length || 0;
      const convertedLeads = projects?.length || 0;
      const closingRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Calculate average time to close (simplified - would need actual conversion dates)
      const avgTimeToClose = 14; // Placeholder - would calculate from actual data

      // Active projects
      const activeProjects = projects?.filter(p => p.status === "in_progress")?.length || 0;

      // Estimate metrics
      const totalEstimateValue = estimates?.reduce((sum, est) => sum + (est.amount || 0), 0) || 0;
      const avgEstimateValue = estimates && estimates.length > 0 ? totalEstimateValue / estimates.length : 0;

      // Estimates this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const estimatesThisMonth = estimates?.filter(est => 
        new Date(est.created_at) >= firstDayOfMonth
      )?.length || 0;

      setMetrics({
        totalLeads,
        convertedLeads,
        closingRate,
        avgTimeToClose,
        activeProjects,
        totalEstimateValue,
        avgEstimateValue,
        estimatesThisMonth,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast({
        title: "Error",
        description: "Failed to load sales metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend, 
    format = "number" 
  }: { 
    title: string; 
    value: number; 
    description: string; 
    icon: any; 
    trend?: "up" | "down";
    format?: "number" | "currency" | "percent" | "days";
  }) => {
    const formatValue = () => {
      switch (format) {
        case "currency":
          return `$${value.toLocaleString()}`;
        case "percent":
          return `${value.toFixed(1)}%`;
        case "days":
          return `${value} days`;
        default:
          return value.toLocaleString();
      }
    };

    return (
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue()}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend && (
              trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )
            )}
            {description}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Management</h1>
          <p className="text-muted-foreground mt-2">
            Track key performance indicators and sales metrics
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-full mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : metrics ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Leads"
                value={metrics.totalLeads}
                description="All time leads"
                icon={Users}
              />
              <MetricCard
                title="Closing Rate"
                value={metrics.closingRate}
                description="Conversion percentage"
                icon={Percent}
                format="percent"
                trend="up"
              />
              <MetricCard
                title="Avg Time to Close"
                value={metrics.avgTimeToClose}
                description="Days from lead to project"
                icon={Clock}
                format="days"
              />
              <MetricCard
                title="Active Projects"
                value={metrics.activeProjects}
                description="Currently in progress"
                icon={Target}
                trend="up"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Estimate Value"
                value={metrics.totalEstimateValue}
                description="All estimates combined"
                icon={DollarSign}
                format="currency"
              />
              <MetricCard
                title="Avg Estimate Value"
                value={metrics.avgEstimateValue}
                description="Per estimate average"
                icon={DollarSign}
                format="currency"
              />
              <MetricCard
                title="Estimates This Month"
                value={metrics.estimatesThisMonth}
                description="Current month activity"
                icon={Trophy}
                trend="up"
              />
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cost Per Lead</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$0.00</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add marketing spend to calculate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional sections for detailed metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Health</CardTitle>
                  <CardDescription>Lead status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">New Leads</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Qualified</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Proposal Sent</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Won</span>
                      <span className="font-medium text-green-500">{metrics.convertedLeads}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gross Profit Analysis</CardTitle>
                  <CardDescription>Revenue and profit metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Costs</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Gross Profit</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Profit Margin</span>
                      <span className="font-medium">-</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Track project costs to enable profit calculations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </ContractorLayout>
  );
}
