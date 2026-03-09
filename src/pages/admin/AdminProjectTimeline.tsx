import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  not_started: { color: "secondary", label: "Not Started" },
  scheduled: { color: "default", label: "Scheduled" },
  in_progress: { color: "default", label: "In Progress" },
  completed: { color: "default", label: "Completed" },
  delayed: { color: "destructive", label: "Delayed" },
};

export default function AdminProjectTimeline() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["admin-project-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_schedule")
        .select("*, contractor_projects(client_name)")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = schedules?.filter(s => statusFilter === "all" || s.status === statusFilter) || [];
  const delayedCount = schedules?.filter(s => s.status === "delayed").length || 0;
  const inProgressCount = schedules?.filter(s => s.status === "in_progress").length || 0;
  const completedCount = schedules?.filter(s => s.status === "completed").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Timeline Engine</h1>
        <p className="text-sm text-muted-foreground">Auto-generated schedules from scope items and cost code metadata</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Phases", value: schedules?.length || 0, icon: Calendar, color: "text-blue-500" },
          { label: "In Progress", value: inProgressCount, icon: Clock, color: "text-amber-500" },
          { label: "Completed", value: completedCount, icon: CheckCircle, color: "text-green-500" },
          { label: "Delayed", value: delayedCount, icon: AlertTriangle, color: "text-red-500" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Schedule Phases</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead>Cost Code</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => {
                const st = STATUS_MAP[s.status] || STATUS_MAP.not_started;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm font-medium">{s.contractor_projects?.client_name || "—"}</TableCell>
                    <TableCell className="text-sm">{s.phase}</TableCell>
                    <TableCell className="text-sm">{s.trade}</TableCell>
                    <TableCell className="text-sm font-mono">{s.cost_code || "—"}</TableCell>
                    <TableCell className="text-sm">{s.duration_days}d</TableCell>
                    <TableCell className="text-sm">{s.start_date || "—"}</TableCell>
                    <TableCell className="text-sm">{s.end_date || "—"}</TableCell>
                    <TableCell><Badge variant={st.color as any} className="text-xs">{st.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No schedule data yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
