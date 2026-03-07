import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CalendarClock, Search, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { format, isPast, isThisWeek, addDays } from "date-fns";

export default function AdminTimelineOversight() {
  const [search, setSearch] = useState("");
  const [filterView, setFilterView] = useState("all");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["admin-timeline-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timeline_tasks")
        .select("*")
        .order("start_date", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const now = new Date();
  const overdueTasks = tasks.filter((t: any) => t.end_date && isPast(new Date(t.end_date)) && t.status !== "completed");
  const thisWeekTasks = tasks.filter((t: any) => t.start_date && isThisWeek(new Date(t.start_date)));
  const completedTasks = tasks.filter((t: any) => t.status === "completed");
  const inProgressTasks = tasks.filter((t: any) => t.status === "in_progress");

  const filtered = tasks.filter((t: any) => {
    if (search) {
      const s = search.toLowerCase();
      if (!t.task_name?.toLowerCase().includes(s) && !t.trade?.toLowerCase().includes(s)) return false;
    }
    if (filterView === "overdue") return t.end_date && isPast(new Date(t.end_date)) && t.status !== "completed";
    if (filterView === "this_week") return t.start_date && isThisWeek(new Date(t.start_date));
    if (filterView === "delayed") return t.status === "delayed";
    return true;
  });

  // Group by project for snapshot
  const projectGroups = tasks.reduce((acc: Record<string, any[]>, t: any) => {
    const pid = t.project_id || "unlinked";
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(t);
    return acc;
  }, {});

  const projectSummaries = Object.entries(projectGroups).map(([pid, tks]) => {
    const total = tks.length;
    const completed = tks.filter((t: any) => t.status === "completed").length;
    const overdue = tks.filter((t: any) => t.end_date && isPast(new Date(t.end_date)) && t.status !== "completed").length;
    return { projectId: pid, total, completed, overdue, progress: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "delayed": return "destructive";
      default: return "outline";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timeline Oversight</h1>
          <p className="text-muted-foreground">Cross-project schedule monitoring and delay tracking</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                  <p className="text-xs text-muted-foreground">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{overdueTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Overdue Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{thisWeekTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Starting This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{inProgressTasks.length}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Progress Summary */}
        {projectSummaries.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Project Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projectSummaries.slice(0, 10).map((p) => (
                  <div key={p.projectId} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-24 truncate">{p.projectId.slice(0, 8)}</span>
                    <Progress value={p.progress} className="flex-1" />
                    <span className="text-xs text-muted-foreground w-16 text-right">{p.completed}/{p.total}</span>
                    {p.overdue > 0 && (
                      <Badge variant="destructive" className="text-xs">{p.overdue} overdue</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks or trades..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterView} onValueChange={setFilterView}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader><CardTitle>Timeline Tasks</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tasks found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map((task: any) => {
                    const isOverdue = task.end_date && isPast(new Date(task.end_date)) && task.status !== "completed";
                    return (
                      <TableRow key={task.id} className={isOverdue ? "bg-destructive/5" : ""}>
                        <TableCell className="font-medium text-sm">{task.task_name || "Untitled"}</TableCell>
                        <TableCell><Badge variant="outline">{task.trade || "—"}</Badge></TableCell>
                        <TableCell className="text-sm">
                          {task.start_date ? format(new Date(task.start_date), "MMM d") : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {task.end_date ? format(new Date(task.end_date), "MMM d") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={task.progress_pct || 0} className="w-16" />
                            <span className="text-xs">{task.progress_pct || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColor(task.status) as any}>{task.status || "pending"}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
