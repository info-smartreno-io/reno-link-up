import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, AlertTriangle, FileEdit, Package, Clock, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface UrgentItem {
  id: string;
  type: 'at_risk' | 'pending_inspection' | 'overdue_co' | 'delayed_material';
  title: string;
  subtitle: string;
  projectId?: string;
}

export function PMUrgentActionsPanel() {
  const navigate = useNavigate();

  const { data: urgentItems, isLoading } = useQuery({
    queryKey: ['pm-urgent-actions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const items: UrgentItem[] = [];

      // At-risk projects (no activity in 7+ days)
      const { data: atRiskProjects } = await supabase
        .from('projects')
        .select('id, name')
        .or(`project_manager_id.eq.${user.id},coordinator_id.eq.${user.id}`)
        .in('status', ['pre_construction', 'procurement', 'construction'])
        .or(`last_pm_activity_at.is.null,last_pm_activity_at.lt.${sevenDaysAgo.toISOString()}`)
        .limit(3);

      atRiskProjects?.forEach(p => {
        items.push({
          id: `risk-${p.id}`,
          type: 'at_risk',
          title: p.name || 'Unnamed Project',
          subtitle: 'No activity for 7+ days',
          projectId: p.id
        });
      });

      // Overdue change orders (pending > 48 hours)
      const { data: overdueChangeOrders } = await supabase
        .from('change_orders')
        .select('id, change_order_number, project_name')
        .in('status', ['pending', 'draft'])
        .lt('created_at', twoDaysAgo.toISOString())
        .limit(3);

      overdueChangeOrders?.forEach(co => {
        items.push({
          id: `co-${co.id}`,
          type: 'overdue_co',
          title: `CO ${co.change_order_number}`,
          subtitle: co.project_name || 'Awaiting approval 48+ hours'
        });
      });

      // Backordered materials
      const { data: delayedMaterials } = await supabase
        .from('project_materials')
        .select('id, item_name, project_id')
        .eq('status', 'backordered')
        .limit(3);

      delayedMaterials?.forEach(m => {
        items.push({
          id: `mat-${m.id}`,
          type: 'delayed_material',
          title: m.item_name || 'Material',
          subtitle: 'Backordered - blocking progress',
          projectId: m.project_id
        });
      });

      return items.slice(0, 6); // Limit to 6 items total
    }
  });

  const getIcon = (type: UrgentItem['type']) => {
    switch (type) {
      case 'at_risk': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'pending_inspection': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'overdue_co': return <FileEdit className="h-4 w-4 text-amber-500" />;
      case 'delayed_material': return <Package className="h-4 w-4 text-destructive" />;
    }
  };

  const getBadge = (type: UrgentItem['type']) => {
    switch (type) {
      case 'at_risk': return <Badge variant="destructive" className="text-xs">At Risk</Badge>;
      case 'pending_inspection': return <Badge className="bg-amber-500/20 text-amber-500 text-xs">Inspection</Badge>;
      case 'overdue_co': return <Badge className="bg-amber-500/20 text-amber-500 text-xs">Change Order</Badge>;
      case 'delayed_material': return <Badge variant="destructive" className="text-xs">Material</Badge>;
    }
  };

  const handleItemClick = (item: UrgentItem) => {
    if (item.type === 'at_risk' && item.projectId) {
      navigate(`/contractor/project/${item.projectId}`);
    } else if (item.type === 'overdue_co') {
      navigate('/contractor/change-orders');
    } else if (item.type === 'delayed_material') {
      navigate('/contractor/purchase-orders');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Urgent Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Urgent Actions
          </CardTitle>
          {urgentItems && urgentItems.length > 0 && (
            <Badge variant="destructive">{urgentItems.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!urgentItems || urgentItems.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-5 w-5 mr-2" />
            No urgent actions required
          </div>
        ) : (
          <div className="space-y-2">
            {urgentItems.map(item => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-between h-auto py-3 px-3 bg-muted/30 hover:bg-muted/50"
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-center gap-3">
                  {getIcon(item.type)}
                  <div className="text-left">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getBadge(item.type)}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
