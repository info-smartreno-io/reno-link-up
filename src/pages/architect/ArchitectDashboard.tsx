import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, FileText, TrendingUp, Clock, Package } from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import { ArchitectMessageNotifications } from "@/components/ArchitectMessageNotifications";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import SearchBar from "@/components/blog/SearchBar";

export default function ArchitectDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    pendingProposals: 0,
    completedProjects: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/architect/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/architect/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch projects
        const { data: projects } = await supabase
          .from('architect_projects')
          .select('status')
          .eq('architect_id', user.id);

        // Fetch proposals
        const { data: proposals } = await supabase
          .from('architect_proposals')
          .select('status')
          .eq('architect_id', user.id);

        setStats({
          totalProjects: projects?.length || 0,
          activeProjects: projects?.filter(p => p.status === 'in_progress').length || 0,
          pendingProposals: proposals?.filter(p => p.status === 'pending').length || 0,
          completedProjects: projects?.filter(p => p.status === 'completed').length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ArchitectMessageNotifications />
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={smartRenoLogo} alt="SmartReno" className="h-8" />
            <nav className="hidden md:flex items-center gap-4">
              <Button variant="default" size="sm">
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/schedule')}>
                <Clock className="h-4 w-4 mr-2" />
                Project Schedule
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/projects')}>
                Projects
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/proposals')}>
                Proposals
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/bid-room')}>
                Bid Room
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/messages')}>
                Messages
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/selections')}>
                <Package className="h-4 w-4 mr-2" />
                Client Selections
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/professional/change-orders')}>
                <FileText className="h-4 w-4 mr-2" />
                Change Orders
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <SettingsDropdown userRole="architect" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <Breadcrumbs />
        
        <div>
          <h1 className="text-3xl font-bold">Architect Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your project overview.</p>
          <div className="mt-4 max-w-2xl">
            <SearchBar />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Proposals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingProposals}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedProjects}</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/architect/projects')}>
                <Building2 className="mr-2 h-4 w-4" />
                View All Projects
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/architect/proposals')}>
                <FileText className="mr-2 h-4 w-4" />
                Submit New Proposal
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates on your projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-8">
                No recent activity to display
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}