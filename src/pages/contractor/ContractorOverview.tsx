import { useState, useEffect } from "react";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, DollarSign, FileText, TrendingUp } from "lucide-react";
import { useContractorRole } from "@/hooks/useContractorRole";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoStats } from "@/utils/demoContractorData";

export default function ContractorOverview() {
  const [stats, setStats] = useState({
    activeBids: 0,
    activeProjects: 0,
    teamMembers: 0,
    pendingChangeOrders: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { contractorUser, loading: roleLoading } = useContractorRole();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      const demoStats = getDemoStats();
      setStats({
        activeBids: demoStats.pendingBids,
        activeProjects: demoStats.activeProjects,
        teamMembers: demoStats.teamMembers,
        pendingChangeOrders: 2,
        monthlyRevenue: demoStats.revenue,
      });
      setLoading(false);
      return;
    }

    if (roleLoading) return;
    
    if (!contractorUser) {
      navigate("/contractor/auth");
      return;
    }

    fetchDashboardStats();
  }, [contractorUser, roleLoading, isDemoMode]);

  const fetchDashboardStats = async () => {
    if (!contractorUser) return;

    try {
      // Fetch team members count
      const { count: teamCount } = await supabase
        .from("contractor_users")
        .select("*", { count: 'exact', head: true })
        .eq("contractor_id", contractorUser.contractor_id)
        .eq("is_active", true);

      // Fetch active bids count (using contractor_id instead of user_id)
      const { count: bidsCount } = await supabase
        .from("bid_submissions")
        .select("*", { count: 'exact', head: true })
        .in("status", ['submitted', 'under_review']);

      // Fetch active projects count (using contractor_id)
      const { count: projectsCount } = await supabase
        .from("contractor_projects")
        .select("*", { count: 'exact', head: true })
        .eq("contractor_id", contractorUser.contractor_id)
        .in("status", ['in_progress', 'planning']);

      setStats({
        activeBids: bidsCount || 0,
        activeProjects: projectsCount || 0,
        teamMembers: teamCount || 0,
        pendingChangeOrders: 0,
        monthlyRevenue: 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Contractor Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your business.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/contractor/bids')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBids}</div>
              <p className="text-xs text-muted-foreground">
                Submitted or under review
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/contractor/projects')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                In progress or planning
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/contractor/team-management')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teamMembers}</div>
              <p className="text-xs text-muted-foreground">
                Active team members
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/professional/change-orders')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending COs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingChangeOrders}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ContractorLayout>
  );
}
