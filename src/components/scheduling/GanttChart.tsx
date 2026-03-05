import { useMemo, useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  color: string;
  phase_id?: string;
  predecessors?: string[];
  description?: string;
  phase?: {
    name: string;
    color: string;
  };
  assignments?: {
    resource: {
      id: string;
      name: string;
      role: string;
    };
  }[];
}

interface Phase {
  id: string;
  name: string;
  color: string;
}

interface GanttChartProps {
  tasks: Task[];
  phases: Phase[];
  onTaskUpdate: (taskId: string, updates: { start_date: string; end_date: string }) => void;
  onTaskClick?: (task: Task) => void;
}

export function GanttChart({ tasks, phases, onTaskUpdate, onTaskClick }: GanttChartProps) {
  const [viewStart, setViewStart] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    return today;
  });
  const [dayWidth, setDayWidth] = useState(40);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, days: 0 });
  const ganttRef = useRef<HTMLDivElement>(null);

  const viewDays = 60;

  // Calculate critical path
  const criticalPath = useMemo(() => {
    if (!tasks.length) return new Set<string>();

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const criticalTasks = new Set<string>();

    // Find tasks with no successors (end tasks)
    const hasSuccessors = new Set<string>();
    tasks.forEach((task) => {
      task.predecessors?.forEach((predId) => hasSuccessors.add(predId));
    });

    const endTasks = tasks.filter((t) => !hasSuccessors.has(t.id));

    // Simple critical path: longest path to completion
    const calculatePath = (taskId: string, visited = new Set<string>()): number => {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);

      const task = taskMap.get(taskId);
      if (!task) return 0;

      const taskDuration =
        (new Date(task.end_date).getTime() - new Date(task.start_date).getTime()) /
        (1000 * 60 * 60 * 24);

      if (!task.predecessors?.length) return taskDuration;

      const maxPredPath = Math.max(
        ...task.predecessors.map((predId) => calculatePath(predId, new Set(visited)))
      );

      return taskDuration + maxPredPath;
    };

    // Mark critical tasks
    const markCritical = (taskId: string) => {
      criticalTasks.add(taskId);
      const task = taskMap.get(taskId);
      task?.predecessors?.forEach((predId) => markCritical(predId));
    };

    endTasks.forEach((task) => {
      const paths = endTasks.map((t) => ({
        id: t.id,
        length: calculatePath(t.id),
      }));
      const longestPath = paths.reduce((max, p) => (p.length > max.length ? p : max));
      if (longestPath.id === task.id) {
        markCritical(task.id);
      }
    });

    return criticalTasks;
  }, [tasks]);

  // Group tasks by phase
  const tasksByPhase = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    grouped.set("unassigned", []);

    phases.forEach((phase) => {
      grouped.set(phase.id, []);
    });

    tasks.forEach((task) => {
      const phaseId = task.phase_id || "unassigned";
      if (!grouped.has(phaseId)) {
        grouped.set(phaseId, []);
      }
      grouped.get(phaseId)!.push(task);
    });

    return grouped;
  }, [tasks, phases]);

  const getDatePosition = (date: string) => {
    const taskDate = new Date(date);
    const diffTime = taskDate.getTime() - viewStart.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays * dayWidth;
  };

  const getTaskWidth = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(diffDays * dayWidth, 40);
  };

  const handleMouseDown = (e: React.MouseEvent, taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    setDraggedTask(taskId);
    setDragOffset({ x: offsetX, days: 0 });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedTask || !ganttRef.current) return;

    const rect = ganttRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const days = Math.round(x / dayWidth);

    setDragOffset((prev) => ({ ...prev, days }));
  };

  const handleMouseUp = () => {
    if (!draggedTask) return;

    const task = tasks.find((t) => t.id === draggedTask);
    if (!task) return;

    const daysDiff = dragOffset.days;
    if (daysDiff === 0) {
      setDraggedTask(null);
      return;
    }

    const startDate = new Date(task.start_date);
    const endDate = new Date(task.end_date);

    startDate.setDate(startDate.getDate() + daysDiff);
    endDate.setDate(endDate.getDate() + daysDiff);

    onTaskUpdate(draggedTask, {
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    });

    setDraggedTask(null);
    setDragOffset({ x: 0, days: 0 });
  };

  useEffect(() => {
    if (draggedTask) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedTask, dragOffset]);

  const shiftView = (days: number) => {
    setViewStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const adjustZoom = (delta: number) => {
    setDayWidth((prev) => Math.max(20, Math.min(80, prev + delta)));
  };

  const renderTimeScale = () => {
    const days = [];
    for (let i = 0; i < viewDays; i++) {
      const date = new Date(viewStart);
      date.setDate(date.getDate() + i);

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={i}
          className={cn(
            "border-r border-border/40 flex-shrink-0 text-center text-xs py-2",
            isWeekend && "bg-muted/30",
            isToday && "bg-primary/10 border-primary/40"
          )}
          style={{ width: dayWidth }}
        >
          <div className="font-medium">{date.getDate()}</div>
          <div className="text-muted-foreground text-[10px]">
            {date.toLocaleDateString("en-US", { weekday: "short" })}
          </div>
        </div>
      );
    }
    return days;
  };

  const renderGridLines = () => {
    const lines = [];
    for (let i = 0; i < viewDays; i++) {
      const date = new Date(viewStart);
      date.setDate(date.getDate() + i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isToday = date.toDateString() === new Date().toDateString();

      lines.push(
        <div
          key={i}
          className={cn(
            "border-r border-border/20 absolute top-0 bottom-0",
            isWeekend && "bg-muted/20",
            isToday && "bg-primary/5 border-primary/30"
          )}
          style={{ left: i * dayWidth, width: dayWidth }}
        />
      );
    }
    return lines;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shiftView(-7)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => shiftView(7)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground ml-2">
            {viewStart.toLocaleDateString("en-US", { month: "short", year: "numeric" })} -{" "}
            {new Date(viewStart.getTime() + viewDays * 24 * 60 * 60 * 1000).toLocaleDateString(
              "en-US",
              { month: "short", year: "numeric" }
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => adjustZoom(-10)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => adjustZoom(10)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Header with timeline */}
        <div className="flex bg-muted/50">
          <div className="w-64 flex-shrink-0 border-r bg-background p-2 font-medium text-sm">
            Task Name
          </div>
          <div className="flex overflow-x-auto">{renderTimeScale()}</div>
        </div>

        {/* Gantt chart area */}
        <div className="relative" ref={ganttRef}>
          {Array.from(tasksByPhase.entries()).map(([phaseId, phaseTasks]) => {
            if (phaseTasks.length === 0) return null;

            const phase = phases.find((p) => p.id === phaseId);
            const phaseName = phase?.name || "Unassigned";
            const phaseColor = phase?.color || "#6b7280";

            return (
              <div key={phaseId} className="border-b">
                {/* Phase header */}
                <div
                  className="flex items-center px-2 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${phaseColor}15` }}
                >
                  <div className="w-64 flex-shrink-0">{phaseName}</div>
                </div>

                {/* Phase tasks */}
                {phaseTasks.map((task, index) => {
                  const isCritical = criticalPath.has(task.id);
                  const isDragging = draggedTask === task.id;
                  const taskLeft = getDatePosition(task.start_date);
                  const taskWidth = getTaskWidth(task.start_date, task.end_date);
                  const adjustedLeft = isDragging ? taskLeft + dragOffset.days * dayWidth : taskLeft;

                  return (
                    <div key={task.id} className="flex hover:bg-muted/30 group relative">
                      {/* Task name column */}
                      <div className="w-64 flex-shrink-0 border-r p-2 text-sm flex items-center gap-2">
                        <span className="truncate">{task.name}</span>
                        {task.assignments && task.assignments.length > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Users className="h-3 w-3" />
                            {task.assignments.length}
                          </Badge>
                        )}
                      </div>

                      {/* Timeline area */}
                      <div className="relative flex-1 min-h-[48px]">
                        {renderGridLines()}

                        {/* Task bar */}
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-white cursor-move transition-shadow hover:shadow-lg",
                            isCritical && "ring-2 ring-red-500 ring-offset-1",
                            isDragging && "opacity-70 shadow-xl"
                          )}
                          style={{
                            left: adjustedLeft,
                            width: taskWidth,
                            backgroundColor: isCritical ? "#ef4444" : task.color,
                            zIndex: isDragging ? 50 : 10,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, task.id)}
                          onClick={() => onTaskClick?.(task)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium">{task.name}</span>
                            <Badge
                              variant={task.status === "completed" ? "default" : "secondary"}
                              className="text-[10px] px-1 py-0"
                            >
                              {task.status}
                            </Badge>
                          </div>
                          {task.assignments && task.assignments.length > 0 && (
                            <div className="text-[10px] opacity-90 mt-0.5">
                              {task.assignments.map((a) => a.resource.name).join(", ")}
                            </div>
                          )}
                        </div>

                        {/* Dependencies */}
                        {task.predecessors?.map((predId) => {
                          const predTask = tasks.find((t) => t.id === predId);
                          if (!predTask) return null;

                          const predEnd = getDatePosition(predTask.end_date);
                          const taskStart = adjustedLeft;

                          return (
                            <svg
                              key={predId}
                              className="absolute top-0 left-0 pointer-events-none"
                              style={{ width: "100%", height: "100%" }}
                            >
                              <line
                                x1={predEnd + getTaskWidth(predTask.start_date, predTask.end_date)}
                                y1="50%"
                                x2={taskStart}
                                y2="50%"
                                stroke={isCritical ? "#ef4444" : "#94a3b8"}
                                strokeWidth={isCritical ? 2 : 1}
                                markerEnd="url(#arrowhead)"
                              />
                            </svg>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* SVG definitions for arrow markers */}
          <svg className="absolute" width="0" height="0">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>Regular Task</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500 ring-2 ring-red-500 ring-offset-1" />
          <span>Critical Path</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Resource Assigned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-border" />
          <span>Dependency</span>
        </div>
      </div>
    </Card>
  );
}
