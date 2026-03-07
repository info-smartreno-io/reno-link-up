import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Search, CheckCircle, Eye, Trash2, AlertTriangle, Clock, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminNotificationsCenter() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const queryClient = useQueryClient();

  // Use subcontractor_notifications as base notification source
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications-center"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcontractor_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  // Also fetch recent automation events as system notifications
  const { data: automationEvents = [] } = useQuery({
    queryKey: ["admin-automation-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subcontractor_notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-center"] });
      toast.success("Marked as read");
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("subcontractor_notifications")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-center"] });
      toast.success("All notifications marked as read");
    },
  });

  // Merge into unified list
  const allNotifications = [
    ...notifications.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      createdAt: n.created_at,
      source: "notification" as const,
      link: n.link,
    })),
    ...automationEvents.map((e: any) => ({
      id: e.id,
      type: e.event_type,
      title: e.event_type.replace(/_/g, " "),
      message: e.action_taken,
      isRead: true,
      createdAt: e.created_at,
      source: "automation" as const,
      link: null,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered = allNotifications.filter((n) => {
    if (search) {
      const s = search.toLowerCase();
      if (!n.title?.toLowerCase().includes(s) && !n.message?.toLowerCase().includes(s)) return false;
    }
    if (filterType === "unread") return !n.isRead;
    if (filterType === "automation") return n.source === "automation";
    return true;
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const typeIcon = (type: string) => {
    if (type?.includes("bid")) return <FileText className="h-4 w-4 text-primary" />;
    if (type?.includes("award")) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (type?.includes("message")) return <Bell className="h-4 w-4 text-blue-600" />;
    if (type?.includes("date")) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <Bell className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications Center</h1>
            <p className="text-muted-foreground">Operational inbox for SmartReno staff</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCircle className="h-4 w-4 mr-1" /> Mark All Read ({unreadCount})
            </Button>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{allNotifications.length}</p>
                  <p className="text-xs text-muted-foreground">Total Notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{automationEvents.length}</p>
                  <p className="text-xs text-muted-foreground">Automation Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="automation">Automation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No notifications</p>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-2">
                  {filtered.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        n.isRead ? "bg-background" : "bg-accent/30 border-primary/20"
                      }`}
                    >
                      <div className="mt-0.5">{typeIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium capitalize">{n.title}</p>
                          {!n.isRead && <Badge variant="destructive" className="text-[10px] px-1.5">New</Badge>}
                          {n.source === "automation" && <Badge variant="secondary" className="text-[10px]">Auto</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(n.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      {n.source === "notification" && !n.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0"
                          onClick={() => markAsRead.mutate(n.id)}
                          disabled={markAsRead.isPending}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
