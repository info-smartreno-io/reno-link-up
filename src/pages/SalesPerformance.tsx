import * as React from "react";
import { addDays, addMonths, addYears, format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subMonths, subQuarters, subYears } from "date-fns";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from 'chartjs-plugin-annotation';
import { ArrowUpRight, ArrowDownRight, Download, BarChart, Target, Calendar, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KpiGoalsDialog } from "@/components/sales/KpiGoalsDialog";
import { KpiProgressCard } from "@/components/sales/KpiProgressCard";
import { TeamPerformanceView } from "@/components/sales/TeamPerformanceView";
import { BackButton } from "@/components/BackButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, annotationPlugin);

type KpiKey = "leads" | "setRate" | "closeRate" | "avgTicket" | "grossMargin";

type KpiTimeseriesPoint = {
  label: string;
  leads: number;
  setRate: number;
  closeRate: number;
  avgTicket: number;
  grossMargin: number;
};

type SalesKpiResponse = {
  periodLabel: string;
  points: KpiTimeseriesPoint[];
  summary: {
    leads: number;
    setRate: number;
    closeRate: number;
    avgTicket: number;
    grossMargin: number;
  };
};

type Insight = {
  type: 'trend' | 'opportunity' | 'warning' | 'positive';
  message: string;
  metric: 'leads' | 'setRate' | 'closeRate' | 'avgTicket' | 'grossMargin' | 'overall';
};

function percentDelta(curr: number, prev: number) {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
}

function DeltaBadge({ delta }: { delta: number }) {
  const up = delta >= 0;
  const val = `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {val}
    </span>
  );
}

function BestWorstCallout({ 
  best, 
  worst, 
  formatter 
}: { 
  best: { label: string; value: number } | null; 
  worst: { label: string; value: number } | null;
  formatter: (v: number) => string;
}) {
  if (!best && !worst) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-3 text-xs">
      {best && (
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-md">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span className="font-medium">Best: {best.label}</span>
          <span className="text-emerald-900 font-semibold">{formatter(best.value)}</span>
        </div>
      )}
      {worst && (
        <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-2.5 py-1.5 rounded-md">
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span className="font-medium">Worst: {worst.label}</span>
          <span className="text-rose-900 font-semibold">{formatter(worst.value)}</span>
        </div>
      )}
    </div>
  );
}

export default function SalesPerformancePage() {
  const [compare, setCompare] = React.useState(true);
  const today = new Date();
  
  // Grouping and preset period selection
  const [groupBy, setGroupBy] = React.useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily');
  const [presetPeriod, setPresetPeriod] = React.useState<'custom' | 'month' | 'quarter' | 'year'>('month');
  
  const [fromA, setFromA] = React.useState(startOfMonth(today));
  const [toA, setToA] = React.useState(endOfMonth(today));
  const [fromB, setFromB] = React.useState(startOfMonth(subMonths(today, 1)));
  const [toB, setToB] = React.useState(endOfMonth(subMonths(today, 1)));

  const [loading, setLoading] = React.useState(false);
  const [dataA, setDataA] = React.useState<SalesKpiResponse | null>(null);
  const [dataB, setDataB] = React.useState<SalesKpiResponse | null>(null);
  const [showTargets, setShowTargets] = React.useState(true);
  const [insights, setInsights] = React.useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = React.useState(false);
  const [goalsDialogOpen, setGoalsDialogOpen] = React.useState(false);
  const [currentGoals, setCurrentGoals] = React.useState<any>(null);
  const [teamData, setTeamData] = React.useState<any[]>([]);
  const [teamDataLoading, setTeamDataLoading] = React.useState(false);
  const [showTeamView, setShowTeamView] = React.useState(false);

  // Target metrics
  const targets = {
    setRate: 40,
    closeRate: 30,
    avgTicket: 20000,
    grossMargin: 45,
  };

  // Handle preset period changes
  React.useEffect(() => {
    if (presetPeriod === 'custom') return;
    
    const today = new Date();
    
    if (presetPeriod === 'month') {
      setFromA(startOfMonth(today));
      setToA(endOfMonth(today));
      setFromB(startOfMonth(subMonths(today, 1)));
      setToB(endOfMonth(subMonths(today, 1)));
      setGroupBy('daily');
    } else if (presetPeriod === 'quarter') {
      setFromA(startOfQuarter(today));
      setToA(endOfQuarter(today));
      setFromB(startOfQuarter(subQuarters(today, 1)));
      setToB(endOfQuarter(subQuarters(today, 1)));
      setGroupBy('weekly');
    } else if (presetPeriod === 'year') {
      setFromA(startOfYear(today));
      setToA(endOfYear(today));
      setFromB(startOfYear(subYears(today, 1)));
      setToB(endOfYear(subYears(today, 1)));
      setGroupBy('monthly');
    }
  }, [presetPeriod]);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const qA = new URLSearchParams({
          from: format(fromA, "yyyy-MM-dd"),
          to: format(toA, "yyyy-MM-dd"),
          groupBy: groupBy,
        });
        
        const { data: resA, error: errorA } = await supabase.functions.invoke("sales-kpis", {
          body: Object.fromEntries(qA),
        });

        if (errorA) throw errorA;
        setDataA(resA as SalesKpiResponse);

        if (compare) {
          const qB = new URLSearchParams({
            from: format(fromB, "yyyy-MM-dd"),
            to: format(toB, "yyyy-MM-dd"),
            groupBy: groupBy,
          });
          
          const { data: resB, error: errorB } = await supabase.functions.invoke("sales-kpis", {
            body: Object.fromEntries(qB),
          });

          if (errorB) throw errorB;
          setDataB(resB as SalesKpiResponse);
        } else {
          setDataB(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fromA, toA, fromB, toB, compare, groupBy]);

  // Fetch AI insights when data changes
  React.useEffect(() => {
    const fetchInsights = async () => {
      if (!dataA?.summary) return;
      
      setInsightsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('analyze-sales-performance', {
          body: {
            summary: dataA.summary,
            points: dataA.points,
            comparisonSummary: dataB?.summary || null,
          }
        });

        if (error) {
          console.error('Error fetching insights:', error);
          if (error.message?.includes('429')) {
            toast.error('Rate limit exceeded. Please try again in a moment.');
          } else if (error.message?.includes('402')) {
            toast.error('AI credits depleted. Please add credits to continue.');
          } else {
            toast.error('Failed to generate insights');
          }
          return;
        }

        if (data?.insights) {
          setInsights(data.insights);
        }
      } catch (e) {
        console.error('Insights error:', e);
      } finally {
        setInsightsLoading(false);
      }
    };

    // Debounce insights fetch
    const timer = setTimeout(fetchInsights, 1000);
    return () => clearTimeout(timer);
  }, [dataA, dataB]);

  // Fetch current period goals
  const fetchGoals = React.useCallback(async () => {
    if (!dataA) return;
    
    try {
      const now = new Date();
      let query = supabase.from('kpi_goals').select('*');
      
      if (presetPeriod === 'month') {
        query = query
          .eq('period', 'monthly')
          .eq('year', now.getFullYear())
          .eq('month', now.getMonth() + 1);
      } else if (presetPeriod === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        query = query
          .eq('period', 'quarterly')
          .eq('year', now.getFullYear())
          .eq('quarter', quarter);
      } else if (presetPeriod === 'year') {
        query = query
          .eq('period', 'yearly')
          .eq('year', now.getFullYear());
      }
      
      const { data, error } = await query.single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching goals:', error);
        return;
      }
      
      setCurrentGoals(data);
    } catch (e) {
      console.error('Error:', e);
    }
  }, [dataA, presetPeriod]);

  React.useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Fetch team performance data
  React.useEffect(() => {
    const fetchTeamData = async () => {
      if (!fromA || !toA) return;
      
      setTeamDataLoading(true);
      try {
        const response = await supabase.functions.invoke('sales-team-performance', {
          body: { from: format(fromA, "yyyy-MM-dd"), to: format(toA, "yyyy-MM-dd") }
        });
        
        if (response.data && !response.error) {
          setTeamData(response.data);
        } else if (response.error) {
          console.error('Error fetching team data:', response.error);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setTeamDataLoading(false);
      }
    };
    
    fetchTeamData();
  }, [fromA, toA]);

  const summaryDelta = (k: KpiKey) =>
    dataA && dataB ? percentDelta(dataA.summary[k], dataB.summary[k]) : 0;

  const categoryLabels = dataA?.points.map((p) => p.label) ?? [];
  const toSeries = (k: KpiKey, src?: SalesKpiResponse | null) => src?.points.map((p) => p[k]) ?? [];

  const getBestWorst = (k: KpiKey) => {
    if (!dataA?.points.length) return { best: null, worst: null };
    
    let bestIdx = 0;
    let worstIdx = 0;
    
    dataA.points.forEach((p, i) => {
      if (p[k] > dataA.points[bestIdx][k]) bestIdx = i;
      if (p[k] < dataA.points[worstIdx][k]) worstIdx = i;
    });
    
    return {
      best: { label: dataA.points[bestIdx].label, value: dataA.points[bestIdx][k] },
      worst: { label: dataA.points[worstIdx].label, value: dataA.points[worstIdx][k] }
    };
  };

  const barOpts = { responsive: true, plugins: { legend: { display: true } } } as const;
  const lineOpts = {
    responsive: true,
    plugins: { 
      legend: { display: true },
      annotation: showTargets ? {
        annotations: {} as any
      } : undefined
    },
    elements: { line: { tension: 0.35 } },
  } as const;

  const primaryLabel = dataA?.periodLabel ?? "Period A";
  const compareLabel = dataB?.periodLabel ?? "Period B";

  const ds = (label: string, data: number[], color: string, dashed = false) => ({
    label,
    data,
    borderColor: color,
    backgroundColor: color + "40",
    borderWidth: 2,
    borderDash: dashed ? [6, 6] : undefined,
  });

  const createLineOptsWithTarget = (targetValue: number, targetLabel: string) => ({
    responsive: true,
    plugins: {
      legend: { display: true },
      annotation: showTargets ? {
        annotations: {
          targetLine: {
            type: 'line' as const,
            yMin: targetValue,
            yMax: targetValue,
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2,
            borderDash: [10, 5],
            label: {
              display: true,
              content: `${targetLabel}: ${targetValue}%`,
              position: 'end' as const,
              backgroundColor: 'rgb(239, 68, 68)',
              color: 'white',
              font: {
                size: 11,
                weight: 'bold' as const,
              },
              padding: 4,
            },
          },
        },
      } : undefined,
    },
    elements: { line: { tension: 0.35 } },
  });

  function exportCsv() {
    if (!dataA) return;
    const headers = ["label", "leads", "setRate", "closeRate", "avgTicket", "grossMargin"];
    const rowsA = dataA.points.map((p) => [p.label, p.leads, p.setRate, p.closeRate, p.avgTicket, p.grossMargin]);
    const rowsB = dataB
      ? dataB.points.map((p) => [p.label, p.leads, p.setRate, p.closeRate, p.avgTicket, p.grossMargin])
      : [];
    let csv = `Dataset,${headers.join(",")}\n`;
    rowsA.forEach((r) => (csv += `A,${r.join(",")}\n`));
    rowsB.forEach((r) => (csv += `B,${r.join(",")}\n`));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_kpis.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-8">
      <Breadcrumbs />
      
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart className="w-6 h-6 text-primary" /> Sales Performance & Process Audit
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare KPI trends across periods. Use the audit below to tighten processes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <Switch checked={showTargets} onCheckedChange={setShowTargets} id="targets" />
            <Label htmlFor="targets" className="flex items-center gap-1 cursor-pointer">
              <Target className="h-4 w-4" />
              Show Targets
            </Label>
          </div>
          <Button
            variant={showTeamView ? "default" : "outline"}
            onClick={() => setShowTeamView(!showTeamView)}
          >
            {showTeamView ? "Show Overview" : "Show Team Performance"}
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setGoalsDialogOpen(true)}>
            <Target className="w-4 h-4 mr-2" />
            Manage Goals
          </Button>
        </div>
      </header>

      <KpiGoalsDialog 
        open={goalsDialogOpen}
        onOpenChange={setGoalsDialogOpen}
        onGoalsUpdated={fetchGoals}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Period Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <Label className="text-sm">Quick Period</Label>
              <Select value={presetPeriod} onValueChange={(v: any) => setPresetPeriod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">This Month vs Last Month</SelectItem>
                  <SelectItem value="quarter">This Quarter vs Last Quarter</SelectItem>
                  <SelectItem value="year">This Year vs Last Year</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Label className="text-sm">Group By</Label>
              <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {presetPeriod === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t">
              <div>
                <Label className="text-sm">From (A)</Label>
                <Input
                  type="date"
                  value={format(fromA, "yyyy-MM-dd")}
                  onChange={(e) => setFromA(new Date(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-sm">To (A)</Label>
                <Input
                  type="date"
                  value={format(toA, "yyyy-MM-dd")}
                  onChange={(e) => setToA(new Date(e.target.value))}
                />
              </div>

              {compare && (
                <>
                  <div>
                    <Label className="text-sm">From (B)</Label>
                    <Input
                      type="date"
                      value={format(fromB, "yyyy-MM-dd")}
                      onChange={(e) => setFromB(new Date(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">To (B)</Label>
                    <Input
                      type="date"
                      value={format(toB, "yyyy-MM-dd")}
                      onChange={(e) => setToB(new Date(e.target.value))}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Comparison Toggle */}
          {presetPeriod === 'custom' && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <Switch checked={compare} onCheckedChange={setCompare} id="compare" />
              <Label htmlFor="compare">Compare Periods</Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Performance View */}
      {showTeamView ? (
        <TeamPerformanceView teamData={teamData} loading={teamDataLoading} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {(
              [
                { key: "leads", label: "Leads", fmt: (v: number) => v.toLocaleString(), noTarget: true },
                { key: "setRate", label: "Set Rate", fmt: (v: number) => `${v.toFixed(1)}%` },
                { key: "closeRate", label: "Close Rate", fmt: (v: number) => `${v.toFixed(1)}%` },
                { key: "avgTicket", label: "Avg Ticket", fmt: (v: number) => `$${v.toLocaleString()}` },
                { key: "grossMargin", label: "Gross Margin", fmt: (v: number) => `${v.toFixed(1)}%` },
              ] as { key: KpiKey | "leads"; label: string; fmt: (v: number) => string; noTarget?: boolean }[]
            ).map(({ key, label, fmt, noTarget }) => {
              const v = dataA?.summary[key as KpiKey] ?? 0;
              const delta = summaryDelta(key as KpiKey);
              const target = noTarget || !currentGoals?.goals 
                ? null 
                : currentGoals.goals[key === "avgTicket" ? "avg_ticket" : key === "setRate" ? "set_rate" : key === "closeRate" ? "close_rate" : key === "grossMargin" ? "gross_margin" : key];
              
              return (
                <KpiProgressCard
                  key={key}
                  label={label}
                  actual={v}
                  target={target}
                  formatter={fmt}
                  delta={delta}
                  compare={compare}
                />
              );
            })}
          </div>

      {/* AI Insights Panel */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Performance Insights
            {insightsLoading && (
              <span className="text-xs text-muted-foreground ml-auto">Analyzing...</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, idx) => {
                const config = {
                  trend: { icon: TrendingUp, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                  opportunity: { icon: Lightbulb, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                  warning: { icon: AlertTriangle, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
                  positive: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                }[insight.type];
                
                const Icon = config.icon;
                
                return (
                  <div key={idx} className={`flex gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${config.text}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${config.text} leading-relaxed`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Select a time period to see AI-powered insights about your sales performance
            </p>
          )}
        </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Leads — {primaryLabel}
              {compare && ` vs ${compareLabel}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Bar
              data={{
                labels: categoryLabels,
                datasets: [
                  {
                    label: primaryLabel,
                    data: toSeries("leads", dataA),
                    backgroundColor: "rgba(59, 130, 246, 0.5)",
                    borderColor: "rgb(59, 130, 246)",
                    borderWidth: 1,
                  },
                  ...(compare
                    ? [
                        {
                          label: compareLabel,
                          data: toSeries("leads", dataB),
                          backgroundColor: "rgba(156, 163, 175, 0.5)",
                          borderColor: "rgb(156, 163, 175)",
                          borderWidth: 1,
                        },
                      ]
                    : []),
                ],
              }}
              options={barOpts}
            />
            <BestWorstCallout 
              {...getBestWorst("leads")} 
              formatter={(v) => v.toLocaleString()} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Set Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <Line
              data={{
                labels: categoryLabels,
                datasets: [
                  ds(primaryLabel, toSeries("setRate", dataA), "rgb(34, 197, 94)"),
                  ...(compare ? [ds(compareLabel, toSeries("setRate", dataB), "rgb(156, 163, 175)", true)] : []),
                ],
              }}
              options={createLineOptsWithTarget(targets.setRate, "Target")}
            />
            <BestWorstCallout 
              {...getBestWorst("setRate")} 
              formatter={(v) => `${v.toFixed(1)}%`} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Close Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <Line
              data={{
                labels: categoryLabels,
                datasets: [
                  ds(primaryLabel, toSeries("closeRate", dataA), "rgb(168, 85, 247)"),
                  ...(compare ? [ds(compareLabel, toSeries("closeRate", dataB), "rgb(156, 163, 175)", true)] : []),
                ],
              }}
              options={createLineOptsWithTarget(targets.closeRate, "Target")}
            />
            <BestWorstCallout 
              {...getBestWorst("closeRate")} 
              formatter={(v) => `${v.toFixed(1)}%`} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar
              data={{
                labels: categoryLabels,
                datasets: [
                  {
                    label: primaryLabel,
                    data: toSeries("avgTicket", dataA),
                    backgroundColor: "rgba(249, 115, 22, 0.5)",
                    borderColor: "rgb(249, 115, 22)",
                    borderWidth: 1,
                  },
                  ...(compare
                    ? [
                        {
                          label: compareLabel,
                          data: toSeries("avgTicket", dataB),
                          backgroundColor: "rgba(156, 163, 175, 0.5)",
                          borderColor: "rgb(156, 163, 175)",
                          borderWidth: 1,
                        },
                      ]
                    : []),
                ],
              }}
              options={barOpts}
            />
            <BestWorstCallout 
              {...getBestWorst("avgTicket")} 
              formatter={(v) => `$${v.toLocaleString()}`} 
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gross Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <Line
              data={{
                labels: categoryLabels,
                datasets: [
                  ds(primaryLabel, toSeries("grossMargin", dataA), "rgb(14, 165, 233)"),
                  ...(compare ? [ds(compareLabel, toSeries("grossMargin", dataB), "rgb(156, 163, 175)", true)] : []),
                ],
              }}
              options={createLineOptsWithTarget(targets.grossMargin, "Target")}
            />
            <BestWorstCallout 
              {...getBestWorst("grossMargin")} 
              formatter={(v) => `${v.toFixed(1)}%`} 
            />
          </CardContent>
        </Card>
          </div>
        </>
      )}
    </div>
  );
}

