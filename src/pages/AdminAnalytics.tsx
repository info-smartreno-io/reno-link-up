import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Users, Briefcase } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface SubscriberGrowth {
  date: string;
  subscribers: number;
  cumulative: number;
}

interface VendorTrend {
  date: string;
  pending: number;
  approved: number;
  rejected: number;
}

interface ActivityData {
  date: string;
  leads: number;
  estimates: number;
  walkthroughs: number;
}

interface SourceData {
  name: string;
  value: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export default function AdminAnalytics() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriberGrowth, setSubscriberGrowth] = useState<SubscriberGrowth[]>([]);
  const [vendorTrends, setVendorTrends] = useState<VendorTrend[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
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
        await Promise.all([
          fetchSubscriberGrowth(),
          fetchVendorTrends(),
          fetchActivityData(),
          fetchSourceData(),
        ]);
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [user, navigate, toast]);

  const fetchSubscriberGrowth = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('subscribed_at, status')
        .order('subscribed_at', { ascending: true });

      if (error) throw error;

      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 29 - i));
        return format(date, 'MMM dd');
      });

      const growthMap = new Map<string, number>();
      let cumulative = 0;

      data?.forEach(sub => {
        const date = format(new Date(sub.subscribed_at), 'MMM dd');
        growthMap.set(date, (growthMap.get(date) || 0) + 1);
      });

      const growthData = last30Days.map(date => {
        const count = growthMap.get(date) || 0;
        cumulative += count;
        return {
          date,
          subscribers: count,
          cumulative,
        };
      });

      setSubscriberGrowth(growthData);
    } catch (error) {
      console.error("Error fetching subscriber growth:", error);
    }
  };

  const fetchVendorTrends = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_applications')
        .select('created_at, status')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 29 - i));
        return format(date, 'MMM dd');
      });

      const trendsMap = new Map<string, { pending: number; approved: number; rejected: number }>();

      data?.forEach(app => {
        const date = format(new Date(app.created_at), 'MMM dd');
        const current = trendsMap.get(date) || { pending: 0, approved: 0, rejected: 0 };
        
        if (app.status === 'pending') current.pending++;
        else if (app.status === 'approved') current.approved++;
        else if (app.status === 'rejected') current.rejected++;
        
        trendsMap.set(date, current);
      });

      const trendsData = last30Days.map(date => ({
        date,
        ...trendsMap.get(date) || { pending: 0, approved: 0, rejected: 0 },
      }));

      setVendorTrends(trendsData);
    } catch (error) {
      console.error("Error fetching vendor trends:", error);
    }
  };

  const fetchActivityData = async () => {
    try {
      const [leadsRes, estimatesRes, walkthroughsRes] = await Promise.all([
        supabase.from('leads').select('created_at'),
        supabase.from('estimates').select('created_at'),
        supabase.from('walkthroughs').select('created_at'),
      ]);

      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 29 - i));
        return format(date, 'MMM dd');
      });

      const activityMap = new Map<string, { leads: number; estimates: number; walkthroughs: number }>();

      leadsRes.data?.forEach(lead => {
        const date = format(new Date(lead.created_at), 'MMM dd');
        const current = activityMap.get(date) || { leads: 0, estimates: 0, walkthroughs: 0 };
        current.leads++;
        activityMap.set(date, current);
      });

      estimatesRes.data?.forEach(est => {
        const date = format(new Date(est.created_at), 'MMM dd');
        const current = activityMap.get(date) || { leads: 0, estimates: 0, walkthroughs: 0 };
        current.estimates++;
        activityMap.set(date, current);
      });

      walkthroughsRes.data?.forEach(wt => {
        const date = format(new Date(wt.created_at), 'MMM dd');
        const current = activityMap.get(date) || { leads: 0, estimates: 0, walkthroughs: 0 };
        current.walkthroughs++;
        activityMap.set(date, current);
      });

      const activity = last30Days.map(date => ({
        date,
        ...activityMap.get(date) || { leads: 0, estimates: 0, walkthroughs: 0 },
      }));

      setActivityData(activity);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    }
  };

  const fetchSourceData = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('source');

      if (error) throw error;

      const sourceMap = new Map<string, number>();
      data?.forEach(sub => {
        const source = sub.source || 'unknown';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      const sources = Array.from(sourceMap.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      setSourceData(sources);
    } catch (error) {
      console.error("Error fetching source data:", error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriberGrowth[subscriberGrowth.length - 1]?.cumulative || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendorTrends.reduce((sum, day) => sum + day.approved, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Approved applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activityData.reduce((sum, day) => sum + day.leads + day.estimates + day.walkthroughs, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads, estimates & walkthroughs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscriber Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Growth</CardTitle>
            <CardDescription>Daily and cumulative subscribers over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={subscriberGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="subscribers" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Daily"
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vendor Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Application Trends</CardTitle>
            <CardDescription>Applications by status over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar dataKey="pending" fill="hsl(var(--chart-1))" name="Pending" />
                <Bar dataKey="approved" fill="hsl(var(--chart-2))" name="Approved" />
                <Bar dataKey="rejected" fill="hsl(var(--chart-3))" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Leads, estimates, and walkthroughs over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name="Leads"
                />
                <Area 
                  type="monotone" 
                  dataKey="estimates" 
                  stackId="1"
                  stroke="hsl(var(--chart-2))" 
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.6}
                  name="Estimates"
                />
                <Area 
                  type="monotone" 
                  dataKey="walkthroughs" 
                  stackId="1"
                  stroke="hsl(var(--chart-3))" 
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.6}
                  name="Walkthroughs"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscriber Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Sources</CardTitle>
            <CardDescription>Where subscribers are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
