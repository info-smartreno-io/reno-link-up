import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  FolderKanban, 
  CalendarClock, 
  AlertTriangle, 
  FileCheck, 
  FileEdit, 
  Package, 
  AlertCircle 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger';
}

function MetricCard({ label, value, icon, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    warning: 'bg-amber-500/10 border-amber-500/30',
    danger: 'bg-destructive/10 border-destructive/30'
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    warning: 'text-amber-500',
    danger: 'text-destructive'
  };

  return (
    <Card className={`${variantStyles[variant]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-background ${iconStyles[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PMSnapshot() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['pm-snapshot-metrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date();
      const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch all metrics in parallel
      const [
        activeProjectsResult,
        startingSoonResult,
        delayedResult,
        pendingPermitsResult,
        openChangeOrdersResult,
        materialsNotDeliveredResult,
        atRiskResult
      ] = await Promise.all([
        // Active projects
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .or('project_manager_id.eq.' + user.id + ',estimator_id.eq.' + user.id)
          .in('status', ['pre_construction', 'procurement', 'construction', 'pm_pre_construction', 'pm_in_progress']),
        
        // Projects starting in 14 days
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .or('project_manager_id.eq.' + user.id + ',estimator_id.eq.' + user.id)
          .gte('start_date', now.toISOString().split('T')[0])
          .lte('start_date', fourteenDaysFromNow.toISOString().split('T')[0]),
        
        // Delayed projects (past start date, not in construction)
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .or('project_manager_id.eq.' + user.id + ',estimator_id.eq.' + user.id)
          .lt('start_date', now.toISOString().split('T')[0])
          .not('status', 'in', '("construction","completed","closeout")'),
        
        // Pending permits
        supabase
          .from('permits')
          .select('id', { count: 'exact', head: true })
          .in('status', ['draft', 'submitted', 'zoning_pending', 'ucc_pending']),
        
        // Open change orders
        supabase
          .from('change_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'draft']),
        
        // Materials not delivered
        supabase
          .from('project_materials')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'ordered', 'backordered']),
        
        // Jobs at risk (no activity in 7+ days)
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .or('project_manager_id.eq.' + user.id + ',estimator_id.eq.' + user.id)
          .in('status', ['pre_construction', 'procurement', 'construction'])
          .or(`last_pm_activity_at.is.null,last_pm_activity_at.lt.${sevenDaysAgo.toISOString()}`)
      ]);

      return {
        activeProjects: activeProjectsResult.count || 0,
        startingSoon: startingSoonResult.count || 0,
        delayed: delayedResult.count || 0,
        pendingPermits: pendingPermitsResult.count || 0,
        openChangeOrders: openChangeOrdersResult.count || 0,
        materialsNotDelivered: materialsNotDeliveredResult.count || 0,
        atRisk: atRiskResult.count || 0
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <MetricCard
        label="Active Projects"
        value={metrics?.activeProjects || 0}
        icon={<FolderKanban className="h-5 w-5" />}
      />
      <MetricCard
        label="Starting in 14 Days"
        value={metrics?.startingSoon || 0}
        icon={<CalendarClock className="h-5 w-5" />}
        variant={metrics?.startingSoon && metrics.startingSoon > 0 ? 'warning' : 'default'}
      />
      <MetricCard
        label="Delayed"
        value={metrics?.delayed || 0}
        icon={<AlertTriangle className="h-5 w-5" />}
        variant={metrics?.delayed && metrics.delayed > 0 ? 'danger' : 'default'}
      />
      <MetricCard
        label="Pending Permits"
        value={metrics?.pendingPermits || 0}
        icon={<FileCheck className="h-5 w-5" />}
        variant={metrics?.pendingPermits && metrics.pendingPermits > 0 ? 'warning' : 'default'}
      />
      <MetricCard
        label="Open Change Orders"
        value={metrics?.openChangeOrders || 0}
        icon={<FileEdit className="h-5 w-5" />}
        variant={metrics?.openChangeOrders && metrics.openChangeOrders > 0 ? 'warning' : 'default'}
      />
      <MetricCard
        label="Materials Pending"
        value={metrics?.materialsNotDelivered || 0}
        icon={<Package className="h-5 w-5" />}
        variant={metrics?.materialsNotDelivered && metrics.materialsNotDelivered > 0 ? 'warning' : 'default'}
      />
      <MetricCard
        label="At Risk (7+ Days)"
        value={metrics?.atRisk || 0}
        icon={<AlertCircle className="h-5 w-5" />}
        variant={metrics?.atRisk && metrics.atRisk > 0 ? 'danger' : 'default'}
      />
    </div>
  );
}