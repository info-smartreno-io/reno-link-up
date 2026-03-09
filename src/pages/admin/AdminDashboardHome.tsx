import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminKPIs } from "@/hooks/useAdminKPIs";
import { useAdminIntake } from "@/hooks/useAdminIntake";
import {
  ClipboardList, Users, FileText, Gavel, Building2, AlertTriangle,
  TrendingUp, MessageSquare, Clock, ArrowRight, ExternalLink,
  Calculator, CheckCircle2, BarChart3, DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const FUNNEL_STAGES = [
  { key: "newIntakes" as const, label: "Submitted", color: "bg-blue-500" },
  { key: "walkthroughsScheduled" as const, label: "Walkthrough", color: "bg-amber-500" },
  { key: "scopesCompleted" as const, label: "Scope Done", color: "bg-purple-500" },
  { key: "bidPacketsSent" as const, label: "Bids Sent", color: "bg-indigo-500" },
  { key: "bidsReceived" as const, label: "Bids In", color: "bg-emerald-500" },
  { key: "projectsAwarded" as const, label: "Awarded", color: "bg-green-600" },
  { key: "projectsCompleted" as const, label: "Completed", color: "bg-muted-foreground" },
];

const kpiConfig = [
  { key: "newIntakes" as const, label: "New Intakes", icon: ClipboardList, color: "text-blue-500", link: "/admin/intake" },
  { key: "walkthroughsScheduled" as const, label: "Walkthroughs", icon: Clock, color: "text-amber-500", link: "/admin/pipeline" },
  { key: "scopesCompleted" as const, label: "Scopes In Progress", icon: TrendingUp, color: "text-purple-500", link: "/admin/pipeline" },
  { key: "activeProjects" as const, label: "Active Projects", icon: Building2, color: "text-cyan-500", link: "/admin/live-projects" },
  { key: "bidsReceived" as const, label: "Bids Received", icon: Gavel, color: "text-rose-500", link: "/admin/bids" },
  { key: "contractorsPending" as const, label: "Contractors Pending", icon: Users, color: "text-amber-500", link: "/admin/contractors" },
  { key: "totalCostCodes" as const, label: "Cost Codes", icon: Calculator, color: "text-indigo-500", link: "/admin/cost-codes" },
  { key: "unreadMessages" as const, label: "Unread Messages", icon: MessageSquare, color: "text-indigo-500", link: "/admin/messages" },
];

export default function AdminDashboardHome() {
  const { data: kpis, isLoading: kpisLoading } = useAdminKPIs();
  const { data: recentIntakes } = useAdminIntake();

  // Calculate conversion rates
  const conversionRates = kpis ? {
    walkthroughRate: kpis.newIntakes > 0 ? Math.round((kpis.walkthroughsScheduled / kpis.newIntakes) * 100) : 0,
    scopeRate: kpis.walkthroughsScheduled > 0 ? Math.round((kpis.scopesCompleted / kpis.walkthroughsScheduled) * 100) : 0,
    bidRate: kpis.bidPacketsSent > 0 ? Math.round((kpis.bidsReceived / kpis.bidPacketsSent) * 100) : 0,
    closeRate: kpis.bidsReceived > 0 ? Math.round((kpis.projectsAwarded / kpis.bidsReceived) * 100) : 0,
  } : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Command Center</h1>
          <p className="text-muted-foreground">SmartReno operating system health at a glance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiConfig.map((kpi) => {
            const Icon = kpi.icon;
            const value = kpis?.[kpi.key] ?? 0;
            return (
              <Link key={kpi.key} to={kpi.link}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {kpisLoading ? "—" : value}
                        </p>
                      </div>
                      <Icon className={`h-8 w-8 ${kpi.color} opacity-70`} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Conversion Funnel */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {FUNNEL_STAGES.map((stage, i) => {
                const count = kpis?.[stage.key] ?? 0;
                const maxCount = Math.max(...FUNNEL_STAGES.map(s => kpis?.[s.key] ?? 0), 1);
                const widthPct = Math.max(14, (count / maxCount) * 100);
                return (
                  <div key={stage.key} className="flex items-center gap-1 flex-shrink-0" style={{ width: `${widthPct}%`, minWidth: 80 }}>
                    <div className="flex-1 relative rounded-md p-3 text-center">
                      <div className={`absolute inset-0 rounded-md ${stage.color} opacity-10`} />
                      <p className="text-xl font-bold text-foreground relative">{kpisLoading ? "—" : count}</p>
                      <p className="text-[10px] text-muted-foreground relative leading-tight mt-1">{stage.label}</p>
                    </div>
                    {i < FUNNEL_STAGES.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
            {/* Conversion Rates */}
            {conversionRates && (
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                {[
                  { label: "Walkthrough Rate", value: conversionRates.walkthroughRate },
                  { label: "Scope Rate", value: conversionRates.scopeRate },
                  { label: "Bid Rate", value: conversionRates.bidRate },
                  { label: "Close Rate", value: conversionRates.closeRate },
                ].map(r => (
                  <div key={r.label} className="text-center">
                    <p className="text-lg font-bold text-foreground">{r.value}%</p>
                    <p className="text-xs text-muted-foreground">{r.label}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Action Queue */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Action Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(kpis?.newIntakes ?? 0) > 0 && (
                <Link to="/admin/intake" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-foreground">{kpis?.newIntakes} intakes awaiting review</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
              {(kpis?.contractorsPending ?? 0) > 0 && (
                <Link to="/admin/contractors" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-foreground">{kpis?.contractorsPending} contractors pending approval</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
              {(kpis?.bidsReceived ?? 0) > 0 && (
                <Link to="/admin/bids" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Gavel className="h-4 w-4 text-rose-500" />
                    <span className="text-sm text-foreground">{kpis?.bidsReceived} bids awaiting review</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
              {(kpis?.needingAttention ?? 0) > 0 && (
                <Link to="/admin/live-projects" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-foreground">{kpis?.needingAttention} projects needing attention</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
              {!kpisLoading && (kpis?.newIntakes ?? 0) === 0 && (kpis?.contractorsPending ?? 0) === 0 && (kpis?.bidsReceived ?? 0) === 0 && (kpis?.needingAttention ?? 0) === 0 && (
                <div className="flex items-center gap-2 justify-center py-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm text-muted-foreground">All clear — no urgent actions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recent Intakes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentIntakes?.slice(0, 6).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{lead.name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{lead.project_type} • {lead.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs whitespace-nowrap">{lead.status}</Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {lead.created_at ? format(new Date(lead.created_at), "MMM d") : ""}
                    </span>
                  </div>
                </div>
              )) ?? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent intakes</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Cost Code Library", path: "/admin/cost-codes", icon: Calculator },
                { label: "Project Pipeline", path: "/admin/pipeline", icon: TrendingUp },
                { label: "Contractor Network", path: "/admin/contractors", icon: Users },
                { label: "Platform Analytics", path: "/admin/analytics", icon: BarChart3 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button variant="outline" className="w-full h-auto py-3 text-xs font-medium gap-2 border-border">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
