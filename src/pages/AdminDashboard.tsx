import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@/hooks/useLogout";
import { Download, Users, TrendingUp, Mail, Loader2, Briefcase, Building2, Clock, CheckCircle2, XCircle, Shield, DollarSign, Workflow, LogOut, BarChart3, FileText, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkflowNav } from "@/components/admin/WorkflowNav";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AdminSideNav } from "@/components/AdminSideNav";
import { PermitsDashboardWidget } from "@/components/admin/PermitsDashboardWidget";
import SearchBar from "@/components/blog/SearchBar";

interface SubscriberStats {
  total: number;
  activeCount: number;
  unsubscribedCount: number;
  todayCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
  sourceBreakdown: { source: string; count: number }[];
}

interface Subscriber {
  id: string;
  email: string;
  source: string;
  status: string;
  subscribed_at: string;
}

interface VendorStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ProposalStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  revision_requested: number;
}

interface DesignerStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [vendorStats, setVendorStats] = useState<VendorStats | null>(null);
  const [proposalStats, setProposalStats] = useState<ProposalStats | null>(null);
  const [designerStats, setDesignerStats] = useState<DesignerStats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useLogout("/admin/auth");

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_admin', { _user_id: user.id });

        if (error) throw error;

        if (!data) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setIsAdmin(true);
        await fetchStats();
        await fetchVendorStats();
        await fetchProposalStats();
        await fetchDesignerStats();
        await fetchSubscribers();
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate, toast]);

  const fetchStats = async () => {
    try {
      const { data: allSubscribers, error } = await supabase
        .from('newsletter_subscribers')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const activeSubscribers = allSubscribers.filter(s => s.status === 'active');
      const todaySubscribers = allSubscribers.filter(s => 
        new Date(s.subscribed_at) >= today
      );
      const weekSubscribers = allSubscribers.filter(s => 
        new Date(s.subscribed_at) >= weekAgo
      );
      const monthSubscribers = allSubscribers.filter(s => 
        new Date(s.subscribed_at) >= monthAgo
      );

      // Calculate source breakdown
      const sourceMap = new Map<string, number>();
      allSubscribers.forEach(sub => {
        const source = sub.source || 'unknown';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      const sourceBreakdown = Array.from(sourceMap.entries()).map(([source, count]) => ({
        source,
        count
      }));

      setStats({
        total: allSubscribers.length,
        activeCount: activeSubscribers.length,
        unsubscribedCount: allSubscribers.filter(s => s.status === 'unsubscribed').length,
        todayCount: todaySubscribers.length,
        thisWeekCount: weekSubscribers.length,
        thisMonthCount: monthSubscribers.length,
        sourceBreakdown,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Error",
        description: "Failed to load subscriber statistics.",
        variant: "destructive",
      });
    }
  };

  const fetchVendorStats = async () => {
    try {
      const { data: allVendors, error } = await supabase
        .from('vendor_applications')
        .select('status');

      if (error) throw error;

      setVendorStats({
        total: allVendors.length,
        pending: allVendors.filter(v => v.status === 'pending').length,
        approved: allVendors.filter(v => v.status === 'approved').length,
        rejected: allVendors.filter(v => v.status === 'rejected').length,
      });
    } catch (error) {
      console.error("Error fetching vendor stats:", error);
      // Don't show error toast for vendor stats, just log it
    }
  };

  const fetchProposalStats = async () => {
    try {
      const { data: allProposals, error } = await supabase
        .from('architect_proposals')
        .select('status');

      if (error) throw error;

      setProposalStats({
        total: allProposals.length,
        pending: allProposals.filter(p => p.status === 'pending').length,
        accepted: allProposals.filter(p => p.status === 'accepted').length,
        rejected: allProposals.filter(p => p.status === 'rejected').length,
        revision_requested: allProposals.filter(p => p.status === 'revision_requested').length,
      });
    } catch (error) {
      console.error("Error fetching proposal stats:", error);
      // Don't show error toast for proposal stats, just log it
    }
  };

  const fetchDesignerStats = async () => {
    try {
      const { data: allDesigners, error } = await supabase
        .from('interior_designer_applications')
        .select('status');

      if (error) throw error;

      setDesignerStats({
        total: allDesigners.length,
        pending: allDesigners.filter(d => d.status === 'pending').length,
        approved: allDesigners.filter(d => d.status === 'approved').length,
        rejected: allDesigners.filter(d => d.status === 'rejected').length,
      });
    } catch (error) {
      console.error("Error fetching designer stats:", error);
      // Don't show error toast for designer stats, just log it
    }
  };

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    }
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('email, source, status, subscribed_at')
        .eq('status', 'active');

      if (error) throw error;

      // Create CSV content
      const headers = ['Email', 'Source', 'Status', 'Subscribed Date'];
      const csvContent = [
        headers.join(','),
        ...data.map(sub => [
          sub.email,
          sub.source || 'unknown',
          sub.status,
          format(new Date(sub.subscribed_at), 'yyyy-MM-dd HH:mm:ss')
        ].join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Exported ${data.length} active subscribers.`,
      });
    } catch (error) {
      console.error("Error exporting:", error);
      toast({
        title: "Export failed",
        description: "Failed to export subscriber list.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const SIDEBAR_WIDTH = 240;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Toolbar */}
      <div className="border-b border-border bg-background/90 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[22px] h-[22px] rounded-md bg-gradient-to-br from-primary to-accent" />
            <h1 className="text-base font-semibold tracking-wide">SmartReno Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative hidden md:block w-64">
              <SearchBar />
            </div>
            <NotificationBell />
            <SettingsDropdown userRole="admin" />
            <Button onClick={logout} variant="ghost" size="sm" className="gap-2 hidden lg:flex">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Side Nav */}
      <AdminSideNav 
        topOffsetPx={56} 
        widthPx={SIDEBAR_WIDTH} 
        collapsedWidthPx={56}
        role="admin"
        badges={{
          estimates_due: 12,
          co_pending: 3,
          logs_today: 2,
          rfis_open: 6,
          fleet_maintenance_due: 2,
        }}
      />

      {/* Main Content with left padding for sidebar */}
      <div className="pt-14 md:pl-60 pl-0">
        <div className="px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <div className="text-xs text-muted-foreground mb-2">Admin / Dashboard</div>
        <h1 className="text-[22px] font-semibold mb-6">Admin Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[22px] font-bold">18</div>
              <p className="text-xs text-accent mt-1.5">+2 this week</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">Open RFIs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[22px] font-bold">6</div>
              <p className="text-xs text-muted-foreground mt-1.5">2 due today</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">COs Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[22px] font-bold">4</div>
              <p className="text-xs text-muted-foreground mt-1.5">+$38,400 exposure</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">Fleet Maintenance Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[22px] font-bold">2</div>
              <p className="text-xs text-muted-foreground mt-1.5">Next: F-250 / 1,200 mi</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-2 bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium">Schedule Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {[
                  { project: "Ridgewood Kitchen – Rough-in", status: "Slip risk: 2d", statusColor: "text-warn" },
                  { project: "Paramus Addition – Foundation", status: "On track", statusColor: "text-accent" },
                  { project: "Hoboken Bath – Tile Delivery", status: "Due Thu", statusColor: "text-muted-foreground" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-dashed border-border last:border-0">
                    <span className="text-sm">{item.project}</span>
                    <span className={`text-xs ${item.statusColor}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <PermitsDashboardWidget />
        </div>

        {/* Source Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subscription Sources</CardTitle>
            <CardDescription>Where your subscribers are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.sourceBreakdown.map(({ source, count }) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{source}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-64 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(count / (stats?.total || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vendor Applications Stats */}
        {vendorStats && vendorStats.total > 0 && (
          <>
            <div className="mt-8 mb-4">
              <h2 className="text-2xl font-bold">Vendor Applications</h2>
              <p className="text-muted-foreground">Partnership application statistics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Applications
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vendorStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    All vendor applications
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Review
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{vendorStats.pending}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Approved
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{vendorStats.approved}</div>
                  <p className="text-xs text-muted-foreground">
                    Active vendors
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Rejected
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{vendorStats.rejected}</div>
                  <p className="text-xs text-muted-foreground">
                    Declined applications
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Architect Proposal Stats */}
        {proposalStats && proposalStats.total > 0 && (
          <>
            <div className="mt-8 mb-4">
              <h2 className="text-2xl font-bold">Architect Proposals</h2>
              <p className="text-muted-foreground">Design proposal statistics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/architect-proposals')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Proposals
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{proposalStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    All design proposals
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/architect-proposals?status=pending')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Review
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{proposalStats.pending}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/architect-proposals?status=accepted')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Approved
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{proposalStats.accepted}</div>
                  <p className="text-xs text-muted-foreground">
                    Accepted proposals
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/architect-proposals?status=rejected')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Rejected
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{proposalStats.rejected}</div>
                  <p className="text-xs text-muted-foreground">
                    Declined proposals
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/architect-proposals?status=revision_requested')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Needs Revision
                  </CardTitle>
                  <Mail className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{proposalStats.revision_requested}</div>
                  <p className="text-xs text-muted-foreground">
                    Revision requested
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Interior Designer Applications Stats */}
        {designerStats && designerStats.total > 0 && (
          <>
            <div className="mt-8 mb-4">
              <h2 className="text-2xl font-bold">Interior Designer Applications</h2>
              <p className="text-muted-foreground">Designer application statistics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/interior-designer-applications')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Applications
                  </CardTitle>
                  <Palette className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{designerStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    All designer applications
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/interior-designer-applications?status=pending')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Review
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{designerStats.pending}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/interior-designer-applications?status=approved')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Approved
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{designerStats.approved}</div>
                  <p className="text-xs text-muted-foreground">
                    Active designers
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/interior-designer-applications?status=rejected')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Rejected
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{designerStats.rejected}</div>
                  <p className="text-xs text-muted-foreground">
                    Declined applications
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Recent Subscribers Table */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Newsletter Subscribers</h2>
        {/* Recent Subscribers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscribers</CardTitle>
            <CardDescription>Latest 100 newsletter signups</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribed Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell className="capitalize">{subscriber.source || 'unknown'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscriber.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {subscriber.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(subscriber.subscribed_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
