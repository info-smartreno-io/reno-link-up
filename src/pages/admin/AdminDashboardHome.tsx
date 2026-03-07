import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminKPIs } from "@/hooks/useAdminKPIs";
import { useAdminIntake } from "@/hooks/useAdminIntake";
import {
  ClipboardList, Users, FileText, Gavel, Building2, AlertTriangle,
  TrendingUp, MessageSquare, Clock, ArrowRight, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const kpiConfig = [
  { key: "newIntakes" as const, label: "New Intakes", icon: ClipboardList, color: "text-blue-500", link: "/admin/intake" },
  { key: "estimatesInProgress" as const, label: "Estimates In Progress", icon: TrendingUp, color: "text-emerald-500", link: "/admin/estimating" },
  { key: "contractorsPending" as const, label: "Contractors Pending", icon: Users, color: "text-amber-500", link: "/admin/contractors" },
  { key: "openRFPs" as const, label: "Open RFPs", icon: FileText, color: "text-purple-500", link: "/admin/rfps" },
  { key: "bidsDueSoon" as const, label: "Bids Submitted", icon: Gavel, color: "text-rose-500", link: "/admin/bids" },
  { key: "activeProjects" as const, label: "Active Projects", icon: Building2, color: "text-cyan-500", link: "/admin/live-projects" },
  { key: "needingAttention" as const, label: "Needing Attention", icon: AlertTriangle, color: "text-red-500", link: "/admin/live-projects" },
  { key: "unreadMessages" as const, label: "Unread Messages", icon: MessageSquare, color: "text-indigo-500", link: "/admin/messages" },
];

export default function AdminDashboardHome() {
  const { data: kpis, isLoading: kpisLoading } = useAdminKPIs();
  const { data: recentIntakes } = useAdminIntake();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Command Center</h1>
          <p className="text-muted-foreground">What needs action right now</p>
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
              {(kpis?.bidsDueSoon ?? 0) > 0 && (
                <Link to="/admin/bids" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Gavel className="h-4 w-4 text-rose-500" />
                    <span className="text-sm text-foreground">{kpis?.bidsDueSoon} bids awaiting shortlist</span>
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
              {!kpisLoading && (kpis?.newIntakes ?? 0) === 0 && (kpis?.contractorsPending ?? 0) === 0 && (kpis?.bidsDueSoon ?? 0) === 0 && (kpis?.needingAttention ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">All clear — no urgent actions</p>
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

        {/* Operational Snapshot */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Operational Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-center">
              {[
                { label: "Intake", value: kpis?.newIntakes ?? 0 },
                { label: "Estimating", value: kpis?.estimatesInProgress ?? 0 },
                { label: "RFP Out", value: kpis?.openRFPs ?? 0 },
                { label: "Active Build", value: kpis?.activeProjects ?? 0 },
                { label: "Flagged", value: kpis?.needingAttention ?? 0 },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Portal Testing */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
              Portal Testing
            </CardTitle>
            <p className="text-xs text-muted-foreground">Preview the platform as different user roles — test accounts only</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Contractor Portal", path: "/contractor/dashboard", color: "bg-primary/10 text-primary hover:bg-primary/20" },
                { label: "Homeowner Portal", path: "/homeowner/dashboard", color: "bg-accent/50 text-accent-foreground hover:bg-accent" },
                { label: "Designer Portal", path: "/interiordesigner/dashboard", color: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
                { label: "Architect Portal", path: "/architect/dashboard", color: "bg-muted text-muted-foreground hover:bg-muted/80" },
                { label: "Estimator Tools", path: "/admin/estimating", color: "bg-primary/10 text-primary hover:bg-primary/20" },
              ].map((portal) => (
                <Link key={portal.path} to={portal.path}>
                  <Button variant="outline" className={`w-full h-auto py-3 text-xs font-medium ${portal.color} border-border`}>
                    {portal.label}
                  </Button>
                </Link>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Test accounts: test-contractor@smartreno.io · test-homeowner@smartreno.io · test-designer@smartreno.io · test-architect@smartreno.io — Password: TestUser2025!!
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
