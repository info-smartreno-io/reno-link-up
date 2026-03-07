import { useState } from "react";
import { useProjectTimeline } from "@/hooks/contractor/useProjectTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";

interface ProjectTimelineProps {
  projectId: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted",
  in_progress: "bg-primary",
  complete: "bg-green-500",
  blocked: "bg-destructive",
};

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const { data: tasks, isLoading, addTask, updateTask, deleteTask } = useProjectTimeline(projectId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ phase_name: "", start_date: "", duration_days: "7", assigned_trade: "" });

  const handleSubmit = () => {
    if (!form.phase_name) return;
    addTask.mutate({
      phase_name: form.phase_name,
      start_date: form.start_date || undefined,
      duration_days: Number(form.duration_days) || 7,
      assigned_trade: form.assigned_trade || undefined,
      sort_order: (tasks?.length || 0) + 1,
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ phase_name: "", start_date: "", duration_days: "7", assigned_trade: "" });
      }
    });
  };

  // Calculate Gantt chart bounds
  const tasksWithDates = (tasks || []).filter((t: any) => t.start_date);
  const minDate = tasksWithDates.length
    ? new Date(Math.min(...tasksWithDates.map((t: any) => new Date(t.start_date).getTime())))
    : new Date();
  const maxDate = tasksWithDates.length
    ? new Date(Math.max(...tasksWithDates.map((t: any) => addDays(new Date(t.start_date), t.duration_days).getTime())))
    : addDays(new Date(), 30);
  const totalDays = Math.max(differenceInDays(maxDate, minDate), 14);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Project Timeline</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Phase</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Timeline Phase</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Phase Name</Label>
                <Input value={form.phase_name} onChange={(e) => setForm({ ...form, phase_name: e.target.value })} placeholder="e.g. Demolition" />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Duration (days)</Label>
                <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
              </div>
              <div>
                <Label>Assigned Trade</Label>
                <Input value={form.assigned_trade} onChange={(e) => setForm({ ...form, assigned_trade: e.target.value })} placeholder="e.g. Electrical" />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addTask.isPending}>
                {addTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Phase"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !tasks?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No timeline phases yet. Click "Add Phase" to build your project schedule.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            {/* Gantt Header */}
            <div className="min-w-[700px]">
              <div className="flex items-center mb-1 pl-48">
                <div className="flex-1 flex">
                  {Array.from({ length: Math.ceil(totalDays / 7) + 1 }, (_, i) => {
                    const d = addDays(minDate, i * 7);
                    return (
                      <div key={i} className="text-xs text-muted-foreground" style={{ width: `${(7 / totalDays) * 100}%` }}>
                        {format(d, "MMM d")}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task bars */}
              <div className="space-y-2">
                {tasks.map((task: any) => {
                  const startOffset = task.start_date
                    ? Math.max(differenceInDays(new Date(task.start_date), minDate), 0)
                    : 0;
                  const barWidth = (task.duration_days / totalDays) * 100;
                  const barLeft = (startOffset / totalDays) * 100;

                  return (
                    <div key={task.id} className="flex items-center gap-2 group">
                      <div className="w-44 shrink-0 flex items-center gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.phase_name}</p>
                          {task.assigned_trade && (
                            <p className="text-xs text-muted-foreground">{task.assigned_trade}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteTask.mutate(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1 relative h-8 bg-muted/30 rounded">
                        {task.start_date && (
                          <div
                            className={`absolute top-1 bottom-1 rounded ${STATUS_COLORS[task.status] || "bg-primary"}`}
                            style={{ left: `${barLeft}%`, width: `${Math.max(barWidth, 1)}%` }}
                          >
                            <span className="text-xs text-primary-foreground px-2 leading-6 whitespace-nowrap">
                              {task.duration_days}d
                            </span>
                          </div>
                        )}
                      </div>
                      <Select
                        value={task.status}
                        onValueChange={(v) => updateTask.mutate({ id: task.id, status: v })}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
