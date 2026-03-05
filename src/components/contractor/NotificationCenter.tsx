import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  FolderKanban,
  Package,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: 'new_project' | 'pending_order' | 'draft_order';
  title: string;
  description: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl: string;
  actionLabel: string;
}

interface NotificationCenterProps {
  totalCount?: number;
}

export function NotificationCenter({ totalCount = 0 }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchNotifications();

      // Set up real-time listeners
      const projectsChannel = supabase
        .channel('notification-projects-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contractor_projects'
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      const ordersChannel = supabase
        .channel('notification-orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'purchase_orders'
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(projectsChannel);
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [open]);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const notificationsList: Notification[] = [];

      // Fetch new projects
      const { data: newProjects } = await supabase
        .from('contractor_projects')
        .select('*')
        .eq('contractor_id', user.id)
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(10);

      if (newProjects) {
        newProjects.forEach(project => {
          notificationsList.push({
            id: `project-${project.id}`,
            type: 'new_project',
            title: 'New Project Available',
            description: `${project.project_name} - ${project.client_name}`,
            timestamp: project.created_at,
            priority: 'high',
            actionUrl: '/contractor/projects',
            actionLabel: 'View Project',
          });
        });
      }

      // Fetch pending purchase orders
      const { data: pendingOrders } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendors(company_name)
        `)
        .eq('status', 'pending')
        .order('order_date', { ascending: false })
        .limit(10);

      if (pendingOrders) {
        pendingOrders.forEach(order => {
          notificationsList.push({
            id: `order-pending-${order.id}`,
            type: 'pending_order',
            title: 'Purchase Order Pending Approval',
            description: `PO ${order.po_number} - ${order.vendors?.company_name || 'Unknown Vendor'}`,
            timestamp: order.order_date,
            priority: 'medium',
            actionUrl: '/contractor/purchase-orders',
            actionLabel: 'Review Order',
          });
        });
      }

      // Fetch draft purchase orders
      const { data: draftOrders } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendors(company_name)
        `)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(10);

      if (draftOrders) {
        draftOrders.forEach(order => {
          notificationsList.push({
            id: `order-draft-${order.id}`,
            type: 'draft_order',
            title: 'Draft Purchase Order',
            description: `PO ${order.po_number} - ${order.vendors?.company_name || 'Unknown Vendor'}`,
            timestamp: order.created_at,
            priority: 'low',
            actionUrl: '/contractor/purchase-orders',
            actionLabel: 'Complete Draft',
          });
        });
      }

      // Sort by timestamp (most recent first)
      notificationsList.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_project':
        return <FolderKanban className="h-5 w-5 text-blue-600" />;
      case 'pending_order':
        return <Package className="h-5 w-5 text-orange-600" />;
      case 'draft_order':
        return <Package className="h-5 w-5 text-gray-600" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-orange-50 border-orange-200';
      case 'low':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs bg-orange-500">Action Needed</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Draft</Badge>;
      default:
        return null;
    }
  };

  const handleAction = (url: string) => {
    navigate(url);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold"
            >
              {totalCount > 99 ? '99+' : totalCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </SheetTitle>
          <SheetDescription>
            {notifications.length} pending action{notifications.length !== 1 ? 's' : ''} requiring your attention
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No pending notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-md",
                      getPriorityColor(notification.priority)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                              {notification.description}
                            </p>
                          </div>
                          {getPriorityBadge(notification.priority)}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(notification.actionUrl)}
                            className="h-7 text-xs"
                          >
                            {notification.actionLabel}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-3" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
