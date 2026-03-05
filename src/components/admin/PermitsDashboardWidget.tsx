import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface PermitStats {
  total: number;
  pending: number;
  approved: number;
  overdue: number;
}

export function PermitsDashboardWidget() {
  const [stats, setStats] = useState<PermitStats>({
    total: 0,
    pending: 0,
    approved: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [checkingOverdue, setCheckingOverdue] = useState(false);

  useEffect(() => {
    fetchPermitStats();
  }, []);

  const fetchPermitStats = async () => {
    try {
      const { data, error } = await supabase
        .from("permits" as any)
        .select("status, estimated_approval_date");

      if (error) throw error;

      const now = new Date();
      const permitData = data || [];

      const stats = {
        total: permitData.length,
        pending: permitData.filter((p: any) => 
          ['draft', 'zoning_pending', 'ucc_pending', 'submitted'].includes(p.status)
        ).length,
        approved: permitData.filter((p: any) => p.status === 'approved').length,
        overdue: permitData.filter((p: any) => {
          if (!p.estimated_approval_date) return false;
          const estimatedDate = new Date(p.estimated_approval_date);
          return estimatedDate < now && !['approved', 'closed'].includes(p.status);
        }).length,
      };

      setStats(stats);
    } catch (error) {
      console.error("Error fetching permit stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkOverduePermits = async () => {
    setCheckingOverdue(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-overdue-permits');
      
      if (error) throw error;
      
      toast.success(
        `Overdue check complete: ${data.notificationsSent || 0} notifications sent`,
        { description: `Checked ${data.checked || 0} permits` }
      );
      
      // Refresh stats
      await fetchPermitStats();
    } catch (error: any) {
      console.error("Error checking overdue permits:", error);
      toast.error("Failed to check overdue permits");
    } finally {
      setCheckingOverdue(false);
    }
  };

  if (loading) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Permits Overview
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={checkOverduePermits}
          disabled={checkingOverdue}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${checkingOverdue ? 'animate-spin' : ''}`} />
          Check Overdue
        </Button>
      </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Permits Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Active</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Approved</p>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm">Pending Review</span>
            </div>
            <Badge variant="default">{stats.pending}</Badge>
          </div>
          {stats.overdue > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm">Overdue</span>
              </div>
              <Badge variant="destructive">{stats.overdue}</Badge>
            </div>
          )}
        </div>

        <Link to="/admin/permits" className="block">
          <button className="w-full text-sm text-primary hover:underline text-center pt-2">
            View All Permits →
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}
