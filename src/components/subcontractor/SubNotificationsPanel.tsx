import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Award, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Check, 
  Loader2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSubcontractorNotifications, SubcontractorNotification } from "@/hooks/useSubcontractorNotifications";

const typeConfig: Record<string, { icon: any; color: string }> = {
  bid_request: { icon: FileText, color: "text-blue-500" },
  award: { icon: Award, color: "text-green-500" },
  date_confirmed: { icon: Calendar, color: "text-purple-500" },
  date_proposed: { icon: Calendar, color: "text-orange-500" },
  message: { icon: MessageSquare, color: "text-primary" },
};

export function SubNotificationsPanel() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useSubcontractorNotifications();

  const handleNotificationClick = (notification: SubcontractorNotification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: SubcontractorNotification;
  onClick: () => void;
}) {
  const config = typeConfig[notification.type] || typeConfig.message;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
        !notification.is_read ? "bg-primary/5" : ""
      }`}
    >
      <div className="flex gap-3">
        <div className={`shrink-0 ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${!notification.is_read ? "font-medium" : ""}`}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </button>
  );
}
