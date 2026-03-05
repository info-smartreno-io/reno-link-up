import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Palette, FileText, TrendingUp, Clock, Package } from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function InteriorDesignerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBids: 0,
    activeBids: 0,
    pendingBids: 0,
    acceptedBids: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/interiordesigner/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/interiordesigner/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch bid submissions
        const { data: submissions } = await supabase
          .from('bid_submissions')
          .select('status')
          .eq('bidder_id', user.id)
          .eq('bidder_type', 'interior_designer');

        setStats({
          totalBids: submissions?.length || 0,
          activeBids: submissions?.filter(s => s.status === 'under_review').length || 0,
          pendingBids: submissions?.filter(s => s.status === 'submitted').length || 0,
          acceptedBids: submissions?.filter(s => s.status === 'accepted').length || 0,
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
              <Button variant="ghost" size="sm" onClick={() => navigate('/interiordesigner/bid-room')}>
                Bid Room
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/interiordesigner/bids')}>
                My Bids
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
            <SettingsDropdown userRole="interiordesigner" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <Breadcrumbs />
        
        <div>
          <h1 className="text-3xl font-bold">Interior Designer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your bid overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBids}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBids}</div>
              <p className="text-xs text-muted-foreground">Being evaluated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingBids}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.acceptedBids}</div>
              <p className="text-xs text-muted-foreground">Projects won</p>
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
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/interiordesigner/bid-room')}>
                <Palette className="mr-2 h-4 w-4" />
                Browse Bid Opportunities
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/interiordesigner/bids')}>
                <FileText className="mr-2 h-4 w-4" />
                View My Submissions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates on your bids</CardDescription>
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
