import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FolderOpen, 
  AlertTriangle, 
  FileText, 
  FileCheck, 
  Users, 
  Package, 
  Calendar, 
  AlertCircle 
} from "lucide-react";

interface PCSnapshotProps {
  coordinatorId?: string;
}

export function PCSnapshot({ coordinatorId }: PCSnapshotProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["pc-snapshot", coordinatorId],
    queryFn: async () => {
      // Get all projects assigned to this coordinator
      let query = supabase
        .from("projects")
        .select("*");
      
      if (coordinatorId) {
        query = query.eq("coordinator_id", coordinatorId);
      }
      
      const { data: projects, error } = await query;
      if (error) throw error;

      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Calculate metrics
      const activeProjects = projects?.filter(p => 
        p.coordinator_status && !['completed', 'cancelled'].includes(p.coordinator_status)
      ) || [];

      const notBuildReady = activeProjects.filter(p => !p.build_ready_at);
      
      const pendingZoning = activeProjects.filter(p => 
        p.zoning_prepared_at && !p.permit_prepared_at
      );
      
      const pendingPermits = activeProjects.filter(p => 
        p.permit_status === 'prepared' || p.permit_status === 'pending'
      );
      
      const subsNotAwarded = activeProjects.filter(p => 
        !p.subs_awarded_at && p.subs_status !== 'awarded'
      );
      
      const materialsNotOrdered = activeProjects.filter(p => 
        !p.materials_ordered_at && p.materials_status !== 'ordered'
      );
      
      const startsIn30Days = activeProjects.filter(p => {
        if (!p.target_start_date) return false;
        const startDate = new Date(p.target_start_date);
        return startDate >= now && startDate <= in30Days;
      });
      
      const atRiskJobs = activeProjects.filter(p => 
        p.risk_level === 'high' || p.risk_level === 'critical'
      );

      return {
        activeProjects: activeProjects.length,
        notBuildReady: notBuildReady.length,
        pendingZoning: pendingZoning.length,
        pendingPermits: pendingPermits.length,
        subsNotAwarded: subsNotAwarded.length,
        materialsNotOrdered: materialsNotOrdered.length,
        startsIn30Days: startsIn30Days.length,
        atRiskJobs: atRiskJobs.length,
      };
    },
  });

  const metrics = [
    { label: "Active Projects", value: stats?.activeProjects ?? 0, icon: FolderOpen, color: "text-blue-600" },
    { label: "Not Build-Ready", value: stats?.notBuildReady ?? 0, icon: AlertTriangle, color: "text-amber-600" },
    { label: "Pending Zoning", value: stats?.pendingZoning ?? 0, icon: FileText, color: "text-purple-600" },
    { label: "Pending Permits", value: stats?.pendingPermits ?? 0, icon: FileCheck, color: "text-indigo-600" },
    { label: "Subs Not Awarded", value: stats?.subsNotAwarded ?? 0, icon: Users, color: "text-orange-600" },
    { label: "Materials Not Ordered", value: stats?.materialsNotOrdered ?? 0, icon: Package, color: "text-pink-600" },
    { label: "Starts in 30 Days", value: stats?.startsIn30Days ?? 0, icon: Calendar, color: "text-green-600" },
    { label: "At-Risk Jobs", value: stats?.atRiskJobs ?? 0, icon: AlertCircle, color: "text-red-600" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-xs text-muted-foreground truncate">{metric.label}</span>
              </div>
              <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
