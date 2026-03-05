import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Calculator,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  ClipboardCheck,
} from "lucide-react";
import { useDemoMode } from "@/context/DemoModeContext";
import { PortalCopilot } from "@/components/ai/PortalCopilot";

export default function ContractorEstimatorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mock data for demonstration
  const estimatorStats = {
    activeEstimates: 12,
    pendingReviews: 5,
    completedThisWeek: 8,
    totalValue: 245000,
    avgTurnaround: "2.3 days",
    winRate: "68%",
  };

  const recentEstimates = [
    { id: 1, projectName: "Kitchen Renovation - Smith", status: "pending", value: 45000, createdAt: "2024-01-15" },
    { id: 2, projectName: "Bathroom Remodel - Johnson", status: "completed", value: 28000, createdAt: "2024-01-14" },
    { id: 3, projectName: "Basement Finishing - Williams", status: "in_review", value: 62000, createdAt: "2024-01-13" },
  ];

  return (
    <ContractorLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Estimator Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your estimates and project bids
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Estimates
                </CardTitle>
                <Calculator className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimatorStats.activeEstimates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Reviews
                </CardTitle>
                <ClipboardCheck className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimatorStats.pendingReviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed This Week
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimatorStats.completedThisWeek}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${estimatorStats.totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Turnaround
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimatorStats.avgTurnaround}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Win Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimatorStats.winRate}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Estimates */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Estimates</CardTitle>
            <CardDescription>
              Your most recent estimate requests and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEstimates.map((estimate) => (
                <div
                  key={estimate.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{estimate.projectName}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${estimate.value.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        estimate.status === "completed"
                          ? "default"
                          : estimate.status === "pending"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {estimate.status.replace("_", " ")}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/contractor/estimates/${estimate.id}`)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/estimator/prepare-estimate")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">New Estimate</CardTitle>
                  <CardDescription>Create a new project estimate</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/contractor/estimates")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Review Queue</CardTitle>
                  <CardDescription>View estimates pending review</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* AI Copilot */}
      <PortalCopilot role="estimator" userId={user?.id} />
    </ContractorLayout>
  );
}
