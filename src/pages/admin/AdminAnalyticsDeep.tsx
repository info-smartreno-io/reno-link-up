import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, DollarSign, Users, Package, Home } from "lucide-react";

function fmt(n: number) { return `$${n.toLocaleString()}`; }

export default function AdminAnalyticsDeep() {
  const { data: funnelData } = useQuery({
    queryKey: ["admin-analytics-funnel"],
    queryFn: async () => {
      const stages = [
        { label: "Submitted", query: supabase.from("leads").select("id", { count: "exact", head: true }) },
        { label: "Walkthrough Scheduled", query: supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "walkthrough_scheduled") },
        { label: "Scope Generated", query: supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["estimate_in_progress", "scope_review"]) },
        { label: "Bid Packets Sent", query: supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "estimate_sent") },
        { label: "Bids Received", query: supabase.from("bid_submissions").select("id", { count: "exact", head: true }).eq("status", "submitted") },
        { label: "Contractor Selected", query: supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "contractor_selected") },
        { label: "Completed", query: supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "completed") },
      ];
      const results = await Promise.all(stages.map(s => s.query));
      return stages.map((s, i) => ({ label: s.label, count: results[i].count || 0 }));
    },
  });

  const { data: financialStats } = useQuery({
    queryKey: ["admin-analytics-financial"],
    queryFn: async () => {
      const { data } = await supabase.from("project_financials").select("*");
      const rows = data || [];
      const totalPipeline = rows.reduce((s, r) => s + (r.estimated_project_value || 0), 0);
      const avgValue = rows.length ? totalPipeline / rows.length : 0;
      const totalRevenue = rows.reduce((s, r) => s + (r.smartreno_platform_fee || 0), 0);
      const totalCOs = rows.reduce((s, r) => s + (r.total_change_orders || 0), 0);
      return { totalPipeline, avgValue, totalRevenue, totalCOs, projectCount: rows.length };
    },
  });

  const { data: contractorStats } = useQuery({
    queryKey: ["admin-analytics-contractors"],
    queryFn: async () => {
      const [bidsRes, contractorsRes] = await Promise.all([
        supabase.from("bid_submissions").select("id, status, bidder_id, created_at", { count: "exact" }),
        supabase.from("contractors").select("id", { count: "exact", head: true }),
      ]);
      const bids = bidsRes.data || [];
      const won = bids.filter(b => b.status === "accepted").length;
      const total = bids.length;
      return {
        totalContractors: contractorsRes.count || 0,
        totalBids: total,
        bidsWon: won,
        winRate: total > 0 ? ((won / total) * 100).toFixed(1) : "0",
      };
    },
  });

  const { data: costCodeStats } = useQuery({
    queryKey: ["admin-analytics-costcodes"],
    queryFn: async () => {
      const { data } = await supabase.from("scope_items").select("trade, cost_code, labor_cost_low, labor_cost_high, material_cost_low, material_cost_high");
      const rows = data || [];
      const tradeCounts: Record<string, number> = {};
      let totalLabor = 0, totalMaterial = 0;
      rows.forEach(r => {
        tradeCounts[r.trade] = (tradeCounts[r.trade] || 0) + 1;
        totalLabor += ((r.labor_cost_low || 0) + (r.labor_cost_high || 0)) / 2;
        totalMaterial += ((r.material_cost_low || 0) + (r.material_cost_high || 0)) / 2;
      });
      const topTrades = Object.entries(tradeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
      return { topTrades, totalItems: rows.length, avgLabor: rows.length ? totalLabor / rows.length : 0, avgMaterial: rows.length ? totalMaterial / rows.length : 0, laborPct: totalLabor + totalMaterial > 0 ? ((totalLabor / (totalLabor + totalMaterial)) * 100).toFixed(0) : "50" };
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground">Deep dive into SmartReno performance, financials, and market data</p>
      </div>

      <Tabs defaultValue="funnel">
        <TabsList>
          <TabsTrigger value="funnel"><BarChart3 className="h-4 w-4 mr-1" />Funnel</TabsTrigger>
          <TabsTrigger value="financial"><DollarSign className="h-4 w-4 mr-1" />Financial</TabsTrigger>
          <TabsTrigger value="contractors"><Users className="h-4 w-4 mr-1" />Contractors</TabsTrigger>
          <TabsTrigger value="costcodes"><Package className="h-4 w-4 mr-1" />Cost Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelData?.map((stage, i) => {
                  const maxCount = funnelData[0]?.count || 1;
                  const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
                  const convRate = i > 0 && funnelData[i - 1].count > 0
                    ? ((stage.count / funnelData[i - 1].count) * 100).toFixed(0) : null;
                  return (
                    <div key={stage.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{stage.label}</span>
                        <span className="font-medium">{stage.count} {convRate && <span className="text-muted-foreground text-xs">({convRate}%)</span>}</span>
                      </div>
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Pipeline Value", value: fmt(financialStats?.totalPipeline || 0) },
              { label: "Avg Project Value", value: fmt(financialStats?.avgValue || 0) },
              { label: "Platform Revenue", value: fmt(financialStats?.totalRevenue || 0) },
              { label: "Total Change Orders", value: fmt(financialStats?.totalCOs || 0) },
            ].map(m => (
              <Card key={m.label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold mt-1">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contractors" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Contractors", value: contractorStats?.totalContractors || 0 },
              { label: "Total Bids", value: contractorStats?.totalBids || 0 },
              { label: "Bids Won", value: contractorStats?.bidsWon || 0 },
              { label: "Win Rate", value: `${contractorStats?.winRate || 0}%` },
            ].map(m => (
              <Card key={m.label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold mt-1">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="costcodes" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Scope Items</p>
                <p className="text-xl font-bold">{costCodeStats?.totalItems || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Avg Labor Cost</p>
                <p className="text-xl font-bold">{fmt(costCodeStats?.avgLabor || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Labor vs Material Split</p>
                <p className="text-xl font-bold">{costCodeStats?.laborPct || 50}% / {100 - Number(costCodeStats?.laborPct || 50)}%</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Top Trades by Usage</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {costCodeStats?.topTrades?.map(([trade, count]) => (
                  <div key={trade} className="flex justify-between items-center py-1">
                    <span className="text-sm capitalize">{trade}</span>
                    <span className="text-sm font-medium">{count} items</span>
                  </div>
                ))}
                {(!costCodeStats?.topTrades || costCodeStats.topTrades.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No scope item data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
