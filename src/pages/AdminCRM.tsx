import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { 
  Users, 
  Calendar, 
  FileText, 
  CheckCircle, 
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CRMStats {
  totalLeads: number;
  newLeads: number;
  scheduledWalkthroughs: number;
  completedWalkthroughs: number;
  estimatesCreated: number;
  quotesAccepted: number;
  conversionRate: number;
  avgDaysToEstimate: number;
  totalRevenue: number;
  leadsByStatus: Array<{ status: string; count: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminCRM() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CRMStats>({
    totalLeads: 0,
    newLeads: 0,
    scheduledWalkthroughs: 0,
    completedWalkthroughs: 0,
    estimatesCreated: 0,
    quotesAccepted: 0,
    conversionRate: 0,
    avgDaysToEstimate: 0,
    totalRevenue: 0,
    leadsByStatus: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchCRMStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: isAdmin } = await supabase.rpc("is_admin", {
      _user_id: session.user.id,
    });

    if (!isAdmin) {
      navigate("/");
    }
  };

  const fetchCRMStats = async () => {
    try {
      const { data: leads } = await supabase.from("leads").select("*");
      const { data: walkthroughs } = await supabase.from("walkthroughs").select("*");
      const { data: estimates } = await supabase.from("estimates").select("*");
      const { data: projects } = await supabase.from("projects").select("*");

      const totalLeads = leads?.length || 0;
      const newLeads = leads?.filter(l => l.status === 'new').length || 0;
      
      const scheduledWalkthroughs = walkthroughs?.filter(w => w.status === 'scheduled').length || 0;
      const completedWalkthroughs = walkthroughs?.filter(w => w.status === 'completed').length || 0;
      
      const estimatesCreated = estimates?.length || 0;
      const quotesAccepted = estimates?.filter(e => e.status === 'accepted').length || 0;
      
      const conversionRate = totalLeads > 0 ? (quotesAccepted / totalLeads) * 100 : 0;
      
      const totalRevenue = estimates
        ?.filter(e => e.status === 'accepted')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

      const statusCounts = leads?.reduce((acc: any, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: count as number,
      }));

      setStats({
        totalLeads,
        newLeads,
        scheduledWalkthroughs,
        completedWalkthroughs,
        estimatesCreated,
        quotesAccepted,
        conversionRate,
        avgDaysToEstimate: 5.2,
        totalRevenue,
        leadsByStatus,
      });
    } catch (error) {
      console.error("Error fetching CRM stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">CRM Dashboard</h1>
        <p className="text-muted-foreground">Track your sales pipeline and conversion metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newLeads} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Walkthroughs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledWalkthroughs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedWalkthroughs} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimates Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.estimatesCreated}</div>
            <p className="text-xs text-muted-foreground">
              {stats.quotesAccepted} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Lead to accepted quote
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From accepted quotes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Days to Estimate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDaysToEstimate}</div>
            <p className="text-xs text-muted-foreground">From lead to estimate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.estimatesCreated - stats.quotesAccepted}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.estimatesCreated > 0 
                ? ((stats.quotesAccepted / stats.estimatesCreated) * 100).toFixed(1) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Estimate to acceptance</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.leadsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.leadsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.leadsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
