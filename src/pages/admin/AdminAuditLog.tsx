import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Shield, Search, Filter, RefreshCw, Eye, Edit, Trash2, Plus } from "lucide-react";

const ACTION_ICONS: Record<string, typeof Eye> = {
  view: Eye,
  create: Plus,
  update: Edit,
  delete: Trash2,
};

const ACTION_COLORS: Record<string, string> = {
  view: "text-blue-500",
  create: "text-green-500",
  update: "text-amber-500",
  delete: "text-red-500",
};

export default function AdminAuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["system-audit-log", actionFilter, tableFilter],
    queryFn: async () => {
      let query = supabase
        .from("system_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (tableFilter !== "all") query = query.eq("table_name", tableFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Get unique tables for filter
  const uniqueTables = [...new Set(logs?.map((l) => l.table_name) || [])].sort();

  const filteredLogs = logs?.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.table_name?.toLowerCase().includes(term) ||
      log.user_role?.toLowerCase().includes(term) ||
      log.record_id?.toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Audit Log</h1>
            <p className="text-muted-foreground">
              Complete trail of all user actions across the platform
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["create", "update", "delete", "view"].map((action) => {
            const count = logs?.filter((l) => l.action === action).length || 0;
            const Icon = ACTION_ICONS[action] || Eye;
            return (
              <Card key={action}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${ACTION_COLORS[action] || "text-muted-foreground"}`} />
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground capitalize">{action} actions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Log Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Audit Entries
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    className="pl-9 w-[180px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="view">View</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {uniqueTables.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading audit log...</p>
            ) : !filteredLogs?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No audit entries yet</p>
                <p className="text-xs mt-1">Actions will be logged as users interact with the platform</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredLogs.map((log) => {
                  const Icon = ACTION_ICONS[log.action] || Eye;
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 p-2.5 rounded-md hover:bg-accent/50 transition-colors text-sm"
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${ACTION_COLORS[log.action] || "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {log.action}
                          </Badge>
                          <span className="text-xs font-medium">
                            {log.table_name?.replace(/_/g, " ")}
                          </span>
                          {log.user_role && (
                            <Badge variant="secondary" className="text-[10px]">
                              {log.user_role}
                            </Badge>
                          )}
                        </div>
                        {log.record_id && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            Record: {log.record_id}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
