import { useEffect, useState } from "react";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, TrendingUp, Users, Clock, CheckCircle, DollarSign, BarChart3 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface BidAnalytics {
  totalOpportunities: number;
  totalBids: number;
  averageResponseRate: number;
  averageTimeToDecision: number;
  acceptanceRate: number;
  avgBidByProjectType: { type: string; avgBid: number; count: number }[];
  bidsByBidderType: { type: string; count: number }[];
  bidStatusDistribution: { status: string; count: number }[];
  monthlyTrends: { month: string; opportunities: number; bids: number }[];
  topPerformingTypes: { type: string; acceptedBids: number; totalBids: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function BidAnalytics() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<BidAnalytics | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/estimator/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/estimator/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      try {
        // Fetch all opportunities and their submissions
        const { data: opportunities, error } = await supabase
          .from('bid_opportunities')
          .select(`
            id,
            title,
            project_type,
            created_at,
            status,
            bid_submissions (
              id,
              bidder_type,
              bid_amount,
              status,
              submitted_at,
              reviewed_at
            )
          `)
          .eq('created_by', user.id);

        if (error) throw error;

        if (!opportunities) {
          setAnalytics({
            totalOpportunities: 0,
            totalBids: 0,
            averageResponseRate: 0,
            averageTimeToDecision: 0,
            acceptanceRate: 0,
            avgBidByProjectType: [],
            bidsByBidderType: [],
            bidStatusDistribution: [],
            monthlyTrends: [],
            topPerformingTypes: []
          });
          setLoading(false);
          return;
        }

        // Calculate metrics
        const totalOpportunities = opportunities.length;
        const allBids = opportunities.flatMap(o => o.bid_submissions || []);
        const totalBids = allBids.length;

        // Average response rate (bids per opportunity)
        const averageResponseRate = totalOpportunities > 0 ? totalBids / totalOpportunities : 0;

        // Average time to decision (in days)
        const decisionsWithTime = allBids.filter(b => b.reviewed_at && b.submitted_at);
        const avgTimeToDecision = decisionsWithTime.length > 0
          ? decisionsWithTime.reduce((acc, bid) => {
              const days = Math.abs(
                new Date(bid.reviewed_at!).getTime() - new Date(bid.submitted_at).getTime()
              ) / (1000 * 60 * 60 * 24);
              return acc + days;
            }, 0) / decisionsWithTime.length
          : 0;

        // Acceptance rate
        const acceptedBids = allBids.filter(b => b.status === 'accepted').length;
        const acceptanceRate = totalBids > 0 ? (acceptedBids / totalBids) * 100 : 0;

        // Average bid by project type
        const projectTypeMap = new Map<string, { total: number; count: number }>();
        opportunities.forEach(opp => {
          const bids = opp.bid_submissions || [];
          if (bids.length > 0) {
            const avgBid = bids.reduce((sum, b) => sum + b.bid_amount, 0) / bids.length;
            const existing = projectTypeMap.get(opp.project_type) || { total: 0, count: 0 };
            projectTypeMap.set(opp.project_type, {
              total: existing.total + avgBid,
              count: existing.count + 1
            });
          }
        });
        const avgBidByProjectType = Array.from(projectTypeMap.entries()).map(([type, data]) => ({
          type,
          avgBid: Math.round(data.total / data.count),
          count: data.count
        }));

        // Bids by bidder type
        const bidderTypeMap = new Map<string, number>();
        allBids.forEach(bid => {
          bidderTypeMap.set(bid.bidder_type, (bidderTypeMap.get(bid.bidder_type) || 0) + 1);
        });
        const bidsByBidderType = Array.from(bidderTypeMap.entries()).map(([type, count]) => ({
          type: type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          count
        }));

        // Bid status distribution
        const statusMap = new Map<string, number>();
        allBids.forEach(bid => {
          const status = bid.status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });
        const bidStatusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
          status,
          count
        }));

        // Monthly trends (last 6 months)
        const monthlyMap = new Map<string, { opportunities: number; bids: number }>();
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          months.push(monthKey);
          monthlyMap.set(monthKey, { opportunities: 0, bids: 0 });
        }

        opportunities.forEach(opp => {
          const monthKey = new Date(opp.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (monthlyMap.has(monthKey)) {
            const data = monthlyMap.get(monthKey)!;
            data.opportunities += 1;
            data.bids += (opp.bid_submissions || []).length;
          }
        });

        const monthlyTrends = months.map(month => ({
          month,
          opportunities: monthlyMap.get(month)?.opportunities || 0,
          bids: monthlyMap.get(month)?.bids || 0
        }));

        // Top performing project types
        const performanceMap = new Map<string, { accepted: number; total: number }>();
        opportunities.forEach(opp => {
          const bids = opp.bid_submissions || [];
          const accepted = bids.filter(b => b.status === 'accepted').length;
          const existing = performanceMap.get(opp.project_type) || { accepted: 0, total: 0 };
          performanceMap.set(opp.project_type, {
            accepted: existing.accepted + accepted,
            total: existing.total + bids.length
          });
        });
        const topPerformingTypes = Array.from(performanceMap.entries())
          .map(([type, data]) => ({
            type,
            acceptedBids: data.accepted,
            totalBids: data.total
          }))
          .sort((a, b) => (b.acceptedBids / (b.totalBids || 1)) - (a.acceptedBids / (a.totalBids || 1)))
          .slice(0, 5);

        setAnalytics({
          totalOpportunities,
          totalBids,
          averageResponseRate,
          averageTimeToDecision: avgTimeToDecision,
          acceptanceRate,
          avgBidByProjectType,
          bidsByBidderType,
          bidStatusDistribution,
          monthlyTrends,
          topPerformingTypes
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          title: "Error",
          description: "Failed to load analytics data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <EstimatorLayout>
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/estimator/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Bid Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Insights and metrics for your bid opportunities
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{analytics.totalOpportunities}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Bids</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{analytics.totalBids}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Response Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{analytics.averageResponseRate.toFixed(1)}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">bids per opportunity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Time to Decision</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{analytics.averageTimeToDecision.toFixed(1)}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Acceptance Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{analytics.acceptanceRate.toFixed(1)}%</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Average Bid by Project Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Average Bid Amount by Project Type</CardTitle>
                  <CardDescription>Compare average bids across project categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.avgBidByProjectType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Bar dataKey="avgBid" fill="#0088FE" name="Average Bid" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bids by Bidder Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Bids by Professional Type</CardTitle>
                  <CardDescription>Distribution of bids by professional category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.bidsByBidderType}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.type}: ${entry.count}`}
                      >
                        {analytics.bidsByBidderType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bid Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Bid Status Distribution</CardTitle>
                  <CardDescription>Current status of all received bids</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.bidStatusDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#00C49F" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Performing Project Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Project Types</CardTitle>
                  <CardDescription>Project types with highest acceptance rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topPerformingTypes.map((item, index) => {
                      const rate = item.totalBids > 0 ? (item.acceptedBids / item.totalBids) * 100 : 0;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.type}</span>
                            <span className="text-muted-foreground">
                              {item.acceptedBids}/{item.totalBids} ({rate.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Track opportunities and bids over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="opportunities" stroke="#0088FE" name="Opportunities" strokeWidth={2} />
                    <Line type="monotone" dataKey="bids" stroke="#00C49F" name="Bids" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Rate Analysis</CardTitle>
                  <CardDescription>How well your opportunities attract bidders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average bids per opportunity</span>
                      <span className="text-2xl font-bold">{analytics.averageResponseRate.toFixed(1)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {analytics.averageResponseRate < 2 && "Consider improving opportunity descriptions to attract more bidders"}
                      {analytics.averageResponseRate >= 2 && analytics.averageResponseRate < 4 && "Good response rate - opportunities are attracting bidders"}
                      {analytics.averageResponseRate >= 4 && "Excellent response rate - very competitive opportunities"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Decision Making Speed</CardTitle>
                  <CardDescription>Time from bid submission to decision</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average decision time</span>
                      <span className="text-2xl font-bold">{analytics.averageTimeToDecision.toFixed(1)} days</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {analytics.averageTimeToDecision > 7 && "Consider reviewing bids faster to maintain professional engagement"}
                      {analytics.averageTimeToDecision <= 7 && analytics.averageTimeToDecision > 3 && "Good turnaround time for bid decisions"}
                      {analytics.averageTimeToDecision <= 3 && "Excellent response time - professionals appreciate quick decisions"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </EstimatorLayout>
  );
}
