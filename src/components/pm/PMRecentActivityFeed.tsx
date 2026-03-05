import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, FileEdit, Package, Calendar, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'status_change' | 'change_order' | 'material' | 'meeting' | 'inspection';
  title: string;
  description: string;
  timestamp: string;
}

export function PMRecentActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['pm-recent-activity'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const items: ActivityItem[] = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Recent change orders
      const { data: changeOrders } = await supabase
        .from('change_orders')
        .select('id, change_order_number, status, project_name, updated_at')
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(5);

      changeOrders?.forEach(co => {
        items.push({
          id: `co-${co.id}`,
          type: 'change_order',
          title: `CO ${co.change_order_number}`,
          description: `${co.status === 'approved' ? 'Approved' : co.status === 'rejected' ? 'Rejected' : 'Updated'} for ${co.project_name}`,
          timestamp: co.updated_at
        });
      });

      // Recent material updates
      const { data: materials } = await supabase
        .from('project_materials')
        .select('id, item_name, status, updated_at')
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(5);

      materials?.forEach(mat => {
        items.push({
          id: `mat-${mat.id}`,
          type: 'material',
          title: mat.item_name || 'Material',
          description: `Status updated to ${mat.status}`,
          timestamp: mat.updated_at
        });
      });

      // Recent project meetings
      const { data: meetings } = await supabase
        .from('project_meetings')
        .select('id, meeting_title, completed_at, updated_at')
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(5);

      meetings?.forEach(meeting => {
        items.push({
          id: `meet-${meeting.id}`,
          type: 'meeting',
          title: meeting.meeting_title || 'Meeting',
          description: meeting.completed_at ? 'Completed' : 'Scheduled',
          timestamp: meeting.updated_at
        });
      });

      // Sort by timestamp and limit
      return items
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);
    }
  });

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'status_change': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'change_order': return <FileEdit className="h-4 w-4 text-amber-500" />;
      case 'material': return <Package className="h-4 w-4 text-green-500" />;
      case 'meeting': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'inspection': return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: ActivityItem['type']) => {
    const labels = {
      status_change: 'Status',
      change_order: 'CO',
      material: 'Material',
      meeting: 'Meeting',
      inspection: 'Inspection'
    };
    return <Badge variant="secondary" className="text-xs">{labels[type]}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-5 w-5 mr-2" />
            No recent activity
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map(activity => (
              <div
                key={activity.id}
                className="flex items-start gap-3 py-2 border-b border-border last:border-0"
              >
                <div className="mt-0.5">
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    {getTypeBadge(activity.type)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
