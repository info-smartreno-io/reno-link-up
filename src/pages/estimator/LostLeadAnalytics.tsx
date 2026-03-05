import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingDown, AlertCircle, Calendar, Download } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface LostLeadData {
  id: string;
  lead_id: string;
  from_status: string;
  to_status: string;
  reason: string | null;
  notes: string | null;
  changed_at: string;
  lead_name?: string;
  project_type?: string;
}

interface ReasonCount {
  reason: string;
  count: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  count: number;
}

interface ProjectTypeData {
  projectType: string;
  lost: number;
  total: number;
  lostRate: number;
}

const COLORS = [
  "hsl(0, 70%, 50%)",
  "hsl(20, 70%, 50%)",
  "hsl(40, 70%, 50%)",
  "hsl(60, 70%, 50%)",
  "hsl(140, 70%, 50%)",
  "hsl(200, 70%, 50%)",
  "hsl(260, 70%, 50%)",
];

export default function LostLeadAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lostLeads, setLostLeads] = useState<LostLeadData[]>([]);
  const [dateRange, setDateRange] = useState("6months");
  const [reasonCounts, setReasonCounts] = useState<ReasonCount[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [projectTypeData, setProjectTypeData] = useState<ProjectTypeData[]>([]);
  const [totalLost, setTotalLost] = useState(0);
  const [averageLostPerMonth, setAverageLostPerMonth] = useState(0);

  useEffect(() => {
    fetchLostLeadData();
  }, [dateRange]);

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "1month":
        return subMonths(now, 1);
      case "3months":
        return subMonths(now, 3);
      case "6months":
        return subMonths(now, 6);
      case "1year":
        return subMonths(now, 12);
      default:
        return subMonths(now, 6);
    }
  };

  const fetchLostLeadData = async () => {
    setLoading(true);
    try {
      const startDate = getDateRangeFilter();

      // Fetch lost lead history
      const { data: historyData, error: historyError } = await supabase
        .from("lead_stage_history")
        .select(`
          *,
          leads!inner (
            name,
            project_type
          )
        `)
        .eq("to_status", "lost")
        .gte("changed_at", startDate.toISOString());

      if (historyError) throw historyError;

      const mappedData = (historyData || []).map((item: any) => ({
        ...item,
        lead_name: item.leads?.name,
        project_type: item.leads?.project_type,
      }));

      setLostLeads(mappedData);
      setTotalLost(mappedData.length);

      // Calculate reason counts
      const reasonMap = new Map<string, number>();
      mappedData.forEach((lead: LostLeadData) => {
        const reason = lead.reason || "No reason provided";
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
      });

      const total = mappedData.length;
      const reasons: ReasonCount[] = Array.from(reasonMap.entries())
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      setReasonCounts(reasons);

      // Calculate monthly trend
      const monthMap = new Map<string, number>();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, "MMM yyyy");
        months.push(monthKey);
        monthMap.set(monthKey, 0);
      }

      mappedData.forEach((lead: LostLeadData) => {
        const monthKey = format(new Date(lead.changed_at), "MMM yyyy");
        if (monthMap.has(monthKey)) {
          monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
        }
      });

      const monthlyTrend: MonthlyData[] = months.map((month) => ({
        month,
        count: monthMap.get(month) || 0,
      }));

      setMonthlyData(monthlyTrend);
      setAverageLostPerMonth(
        Math.round(mappedData.length / Math.max(months.length, 1))
      );

      // Calculate project type breakdown
      await fetchProjectTypeBreakdown(startDate);
    } catch (error: any) {
      console.error("Error fetching lost lead data:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTypeBreakdown = async (startDate: Date) => {
    try {
      // Get all leads in date range
      const { data: allLeads, error: leadsError } = await supabase
        .from("leads")
        .select("id, project_type, status")
        .gte("created_at", startDate.toISOString());

      if (leadsError) throw leadsError;

      const typeMap = new Map<string, { total: number; lost: number }>();

      (allLeads || []).forEach((lead: any) => {
        const type = lead.project_type;
        if (!typeMap.has(type)) {
          typeMap.set(type, { total: 0, lost: 0 });
        }
        const stats = typeMap.get(type)!;
        stats.total++;
        if (lead.status === "lost") {
          stats.lost++;
        }
      });

      const breakdown: ProjectTypeData[] = Array.from(typeMap.entries())
        .map(([projectType, stats]) => ({
          projectType,
          lost: stats.lost,
          total: stats.total,
          lostRate: (stats.lost / stats.total) * 100,
        }))
        .sort((a, b) => b.lostRate - a.lostRate);

      setProjectTypeData(breakdown);
    } catch (error: any) {
      console.error("Error fetching project type breakdown:", error);
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Lead Name", "Project Type", "From Status", "Reason", "Notes"];
    const rows = lostLeads.map((lead) => [
      format(new Date(lead.changed_at), "yyyy-MM-dd HH:mm"),
      lead.lead_name || "",
      lead.project_type || "",
      lead.from_status?.replace(/_/g, " ") || "",
      lead.reason || "",
      lead.notes || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lost-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Lost leads data has been exported to CSV.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <BackButton />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Lost Lead Analytics</h1>
            <p className="text-muted-foreground">
              Analyze patterns and identify improvement opportunities
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Lost Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <span className="text-3xl font-bold text-destructive">{totalLost}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Per Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{averageLostPerMonth}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top Reason
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="font-semibold">
                  {reasonCounts[0]?.reason || "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {reasonCounts[0]?.count || 0} leads (
                  {reasonCounts[0]?.percentage.toFixed(1) || 0}%)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reasons Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Lost Reasons Breakdown</CardTitle>
              <CardDescription>Distribution of reasons for lost leads</CardDescription>
            </CardHeader>
            <CardContent>
              {reasonCounts.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reasonCounts}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ reason, percentage }) =>
                          `${reason}: ${percentage.toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {reasonCounts.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {reasonCounts.map((item, index) => (
                      <div
                        key={item.reason}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{item.reason}</span>
                        </div>
                        <Badge variant="outline">
                          {item.count} ({item.percentage.toFixed(1)}%)
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No lost leads in selected period</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Lost Leads Trend</CardTitle>
              <CardDescription>Monthly trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(0, 70%, 50%)"
                    strokeWidth={2}
                    name="Lost Leads"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Project Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Loss Rate by Project Type</CardTitle>
            <CardDescription>
              Percentage of leads lost for each project type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="projectType" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="lostRate" fill="hsl(0, 70%, 50%)" name="Loss Rate %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights & Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Key Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reasonCounts.length > 0 && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Top Loss Reason</h4>
                <p className="text-sm text-muted-foreground">
                  "{reasonCounts[0].reason}" accounts for{" "}
                  {reasonCounts[0].percentage.toFixed(1)}% of lost leads. Consider:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground ml-4">
                  {reasonCounts[0].reason.toLowerCase().includes("budget") && (
                    <>
                      <li>• Offering more flexible pricing options or payment plans</li>
                      <li>• Improving value communication in proposals</li>
                      <li>• Creating budget-friendly package options</li>
                    </>
                  )}
                  {reasonCounts[0].reason.toLowerCase().includes("contractor") && (
                    <>
                      <li>• Improving response time and communication</li>
                      <li>• Strengthening your unique value proposition</li>
                      <li>• Gathering and showcasing more client testimonials</li>
                    </>
                  )}
                  {reasonCounts[0].reason.toLowerCase().includes("timeline") && (
                    <>
                      <li>• Offering more flexible scheduling options</li>
                      <li>• Improving project timeline estimates</li>
                      <li>• Building capacity for faster turnarounds</li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {projectTypeData.length > 0 && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Project Type Performance</h4>
                <p className="text-sm text-muted-foreground">
                  {projectTypeData[0].projectType} has the highest loss rate at{" "}
                  {projectTypeData[0].lostRate.toFixed(1)}%. Consider specialized training
                  or process improvements for this project type.
                </p>
              </div>
            )}

            {averageLostPerMonth > 5 && (
              <div className="p-4 border rounded-lg bg-destructive/10">
                <h4 className="font-semibold mb-2 text-destructive">High Loss Rate Alert</h4>
                <p className="text-sm text-muted-foreground">
                  Averaging {averageLostPerMonth} lost leads per month. Review your lead
                  qualification process and consider implementing earlier budget/timeline
                  discussions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
