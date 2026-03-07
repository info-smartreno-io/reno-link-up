import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileStack, Search, Eye, AlertTriangle, CheckCircle, Camera } from "lucide-react";
import { format, subDays } from "date-fns";

export default function AdminDailyLogsOversight() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-daily-logs", filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("daily_logs")
        .select("*")
        .order("log_date", { ascending: false })
        .limit(200);

      if (filterStatus === "flagged") {
        query = query.not("issues", "is", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = logs.filter((log: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.trade?.toLowerCase().includes(s) ||
      log.summary?.toLowerCase().includes(s) ||
      log.project_id?.toLowerCase().includes(s)
    );
  });

  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter((l: any) => l.log_date === today);
  const flaggedLogs = logs.filter((l: any) => l.issues && l.issues.length > 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Logs Oversight</h1>
          <p className="text-muted-foreground">Review field activity and issues across projects</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <FileStack className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{logs.length}</p>
                  <p className="text-xs text-muted-foreground">Total Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{todayLogs.length}</p>
                  <p className="text-xs text-muted-foreground">Today's Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{flaggedLogs.length}</p>
                  <p className="text-xs text-muted-foreground">Flagged Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">
                    {logs.reduce((sum: number, l: any) => sum + (l.photos?.length || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Photos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Logs</SelectItem>
              <SelectItem value="flagged">Flagged Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>Daily Logs</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No logs found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Workers</TableHead>
                    <TableHead>Photos</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{log.log_date ? format(new Date(log.log_date), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{log.project_id?.slice(0, 8) || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{log.trade || "General"}</Badge></TableCell>
                      <TableCell>{log.workers_on_site ?? "—"}</TableCell>
                      <TableCell>{log.photos?.length || 0}</TableCell>
                      <TableCell>
                        {log.issues && log.issues.length > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {log.issues.length} issue{log.issues.length > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Detail Sheet */}
      <Sheet open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Daily Log Detail</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{selectedLog.log_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trade</p>
                    <p className="text-sm font-medium">{selectedLog.trade || "General"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Workers on Site</p>
                    <p className="text-sm font-medium">{selectedLog.workers_on_site ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weather</p>
                    <p className="text-sm font-medium">{selectedLog.weather || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Summary</p>
                  <p className="text-sm">{selectedLog.summary || "No summary provided"}</p>
                </div>
                {selectedLog.issues && selectedLog.issues.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Issues</p>
                    <ul className="space-y-1">
                      {selectedLog.issues.map((issue: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedLog.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{selectedLog.notes}</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
