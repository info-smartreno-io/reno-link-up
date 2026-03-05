import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  FileText, 
  RefreshCw, 
  Building2, 
  DollarSign, 
  TrendingUp,
  AlertTriangle 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface SnapshotStats {
  activeLeads: number;
  upcomingAppointments: number;
  proposalsOut: number;
  revisionsPending: number;
  needsArchitectural: number;
  needsFinancing: number;
  soldThisMonth: number;
  closeRate: number;
}

export function EstimatorSnapshot() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["estimator-snapshot-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Fetch all stats in parallel
      const [
        activeLeadsResult,
        appointmentsResult,
        proposalsOutResult,
        revisionsResult,
        architecturalResult,
        financingResult,
        soldResult,
        totalClosedResult
      ] = await Promise.all([
        // Active leads (not sold/cancelled)
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('sale_outcome', 'in', '("sold","cancelled","lost")'),
        
        // Upcoming appointments (next 7 days)
        supabase
          .from('walkthroughs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'scheduled')
          .gte('date', new Date().toISOString().split('T')[0])
          .lte('date', sevenDaysFromNow.toISOString().split('T')[0]),
        
        // Proposals out (awaiting decision)
        supabase
          .from('proposals')
          .select('*', { count: 'exact', head: true })
          .eq('estimator_id', user.id)
          .eq('status', 'sent'),
        
        // Revisions pending
        supabase
          .from('proposals')
          .select('*', { count: 'exact', head: true })
          .eq('estimator_id', user.id)
          .eq('status', 'revision_requested'),
        
        // Needs architectural (blocked)
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('blocker_type', 'architectural'),
        
        // Needs financing (blocked)
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('blocker_type', 'financing'),
        
        // Sold this month
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('sale_outcome', 'sold')
          .gte('sold_at', startOfMonth.toISOString()),
        
        // Total closed (for close rate calculation)
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('sale_outcome', ['sold', 'cancelled', 'lost'])
          .gte('updated_at', startOfMonth.toISOString())
      ]);

      const soldCount = soldResult.count || 0;
      const totalClosed = totalClosedResult.count || 0;
      const closeRate = totalClosed > 0 ? Math.round((soldCount / totalClosed) * 100) : 0;

      return {
        activeLeads: activeLeadsResult.count || 0,
        upcomingAppointments: appointmentsResult.count || 0,
        proposalsOut: proposalsOutResult.count || 0,
        revisionsPending: revisionsResult.count || 0,
        needsArchitectural: architecturalResult.count || 0,
        needsFinancing: financingResult.count || 0,
        soldThisMonth: soldCount,
        closeRate: closeRate
      } as SnapshotStats;
    },
  });

  const kpis = [
    { label: "Active Leads", value: stats?.activeLeads ?? 0, icon: Users, color: "text-blue-500" },
    { label: "Upcoming Appointments", value: stats?.upcomingAppointments ?? 0, icon: Calendar, color: "text-green-500", sublabel: "Next 7 days" },
    { label: "Proposals Out", value: stats?.proposalsOut ?? 0, icon: FileText, color: "text-amber-500", sublabel: "Awaiting decision" },
    { label: "Revisions Pending", value: stats?.revisionsPending ?? 0, icon: RefreshCw, color: "text-orange-500" },
    { label: "Needs Architectural", value: stats?.needsArchitectural ?? 0, icon: Building2, color: "text-red-500", sublabel: "Blocked" },
    { label: "Needs Financing", value: stats?.needsFinancing ?? 0, icon: DollarSign, color: "text-red-500", sublabel: "Blocked" },
    { label: "Sold This Month", value: stats?.soldThisMonth ?? 0, icon: TrendingUp, color: "text-emerald-500" },
    { label: "Close Rate", value: `${stats?.closeRate ?? 0}%`, icon: TrendingUp, color: "text-primary" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="h-24">
            <CardContent className="p-3">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isBlocked = kpi.label.includes("Needs") && (kpi.value as number) > 0;
        
        return (
          <Card key={kpi.label} className={`${isBlocked ? 'border-destructive/50 bg-destructive/5' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">
                  {kpi.label}
                </span>
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.sublabel && (
                <Badge variant={isBlocked ? "destructive" : "secondary"} className="text-[9px] mt-1">
                  {kpi.sublabel}
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}