import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  MessageSquare,
  FileText,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Camera,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  message: MessageSquare,
  proposal: ClipboardList,
  file: FileText,
  timeline: Calendar,
  milestone: CheckCircle2,
  daily_log: Camera,
};

export default function HomeownerNotifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["homeowner-notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use subcontractor_notifications as a general notification store
      // In production, a dedicated homeowner_notifications table would be better
      const { data, error } = await supabase
        .from("subcontractor_notifications")
        .select("*")
        .eq("subcontractor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (notifId: string) => {
      const { error } = await supabase
        .from("subcontractor_notifications")
        .update({ is_read: true })
        .eq("id", notifId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["homeowner-notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("subcontractor_notifications")
        .update({ is_read: true })
        .eq("subcontractor_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["homeowner-notifications"] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications?.length ? (
        <div className="space-y-2">
          {notifications.map((notif: any) => {
            const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
            return (
              <Card
                key={notif.id}
                className={`cursor-pointer hover:shadow-sm transition-shadow ${!notif.is_read ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                onClick={() => {
                  if (!notif.is_read) markReadMutation.mutate(notif.id);
                  if (notif.link) navigate(notif.link);
                }}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.is_read ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${!notif.is_read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.is_read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {new Date(notif.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
