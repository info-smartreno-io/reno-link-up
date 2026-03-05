import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Users,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceAssignment {
  id: string;
  task_id: string;
  resource_id: string;
  task: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
    schedule_id: string;
    schedule: {
      project_name: string;
    };
  };
  resource: {
    id: string;
    name: string;
    role: string;
    hourly_rate: number | null;
  };
}

export default function ResourceCapacity() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  // Fetch all resources
  const { data: resources = [] } = useQuery({
    queryKey: ["schedule_resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_resources")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch all assignments with task and schedule details
  const { data: assignments = [] } = useQuery({
    queryKey: ["resource_assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_assignments")
        .select(`
          *,
          task:schedule_tasks(
            id,
            name,
            start_date,
            end_date,
            status,
            schedule_id,
            schedule:project_schedules(project_name)
          ),
          resource:schedule_resources(id, name, role, hourly_rate)
        `)
        .not("task", "is", null);

      if (error) throw error;
      return data as unknown as ResourceAssignment[];
    },
  });

  // Calculate resource utilization
  const resourceUtilization = useMemo(() => {
    const utilization = new Map<string, {
      resourceId: string;
      resourceName: string;
      role: string;
      totalDays: number;
      activeDays: number;
      conflicts: number;
      assignments: ResourceAssignment[];
    }>();

    // Get date range for current month
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    const workDaysInMonth = 22; // Approximate working days

    resources.forEach((resource) => {
      utilization.set(resource.id, {
        resourceId: resource.id,
        resourceName: resource.name,
        role: resource.role,
        totalDays: workDaysInMonth,
        activeDays: 0,
        conflicts: 0,
        assignments: [],
      });
    });

    assignments.forEach((assignment) => {
      const resourceId = assignment.resource.id;
      const taskStart = new Date(assignment.task.start_date);
      const taskEnd = new Date(assignment.task.end_date);

      // Calculate overlap with current month
      const overlapStart = new Date(Math.max(taskStart.getTime(), monthStart.getTime()));
      const overlapEnd = new Date(Math.min(taskEnd.getTime(), monthEnd.getTime()));

      if (overlapStart <= overlapEnd) {
        const days = Math.ceil(
          (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        const resourceData = utilization.get(resourceId);
        if (resourceData) {
          resourceData.activeDays += days;
          resourceData.assignments.push(assignment);
        }
      }
    });

    return Array.from(utilization.values());
  }, [resources, assignments, selectedMonth]);

  // Detect conflicts (double bookings)
  const conflicts = useMemo(() => {
    const conflictMap = new Map<string, {
      resource: { id: string; name: string; role: string };
      date: string;
      tasks: { id: string; name: string; project: string }[];
    }>();

    assignments.forEach((assignment1, idx1) => {
      assignments.forEach((assignment2, idx2) => {
        if (idx1 >= idx2) return;
        if (assignment1.resource_id !== assignment2.resource_id) return;

        const start1 = new Date(assignment1.task.start_date);
        const end1 = new Date(assignment1.task.end_date);
        const start2 = new Date(assignment2.task.start_date);
        const end2 = new Date(assignment2.task.end_date);

        // Check for overlap
        if (start1 <= end2 && start2 <= end1) {
          const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
          const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

          // Create conflict entry for each day of overlap
          const current = new Date(overlapStart);
          while (current <= overlapEnd) {
            const dateKey = `${assignment1.resource_id}-${current.toISOString().split("T")[0]}`;

            if (!conflictMap.has(dateKey)) {
              conflictMap.set(dateKey, {
                resource: assignment1.resource,
                date: current.toISOString().split("T")[0],
                tasks: [],
              });
            }

            const conflict = conflictMap.get(dateKey)!;
            if (!conflict.tasks.find((t) => t.id === assignment1.task.id)) {
              conflict.tasks.push({
                id: assignment1.task.id,
                name: assignment1.task.name,
                project: assignment1.task.schedule.project_name,
              });
            }
            if (!conflict.tasks.find((t) => t.id === assignment2.task.id)) {
              conflict.tasks.push({
                id: assignment2.task.id,
                name: assignment2.task.name,
                project: assignment2.task.schedule.project_name,
              });
            }

            current.setDate(current.getDate() + 1);
          }
        }
      });
    });

    return Array.from(conflictMap.values()).filter((c) => c.tasks.length > 1);
  }, [assignments]);

  // Calendar view data
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split("T")[0];
      const resourceAssignments = selectedResource
        ? assignments.filter((a) => {
            if (a.resource_id !== selectedResource) return false;
            const taskStart = new Date(a.task.start_date);
            const taskEnd = new Date(a.task.end_date);
            return current >= taskStart && current <= taskEnd;
          })
        : [];

      const hasConflict = conflicts.some(
        (c) =>
          c.date === dateStr &&
          (!selectedResource || c.resource.id === selectedResource)
      );

      days.push({
        date: new Date(current),
        dateStr,
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        assignments: resourceAssignments,
        hasConflict,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [selectedMonth, assignments, selectedResource, conflicts]);

  const shiftMonth = (delta: number) => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + delta, 1)
    );
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return "text-red-500";
    if (percentage > 80) return "text-orange-500";
    if (percentage > 60) return "text-yellow-500";
    return "text-green-500";
  };

  const getUtilizationBg = (percentage: number) => {
    if (percentage > 100) return "bg-red-500";
    if (percentage > 80) return "bg-orange-500";
    if (percentage > 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resource Capacity Planning</h1>
          <p className="text-muted-foreground mt-1">
            Monitor utilization, availability, and detect scheduling conflicts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium min-w-[120px] text-center">
            {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
          <Button variant="outline" size="sm" onClick={() => shiftMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active team members and contractors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resourceUtilization.length > 0
                ? Math.round(
                    resourceUtilization.reduce(
                      (sum, r) => sum + (r.activeDays / r.totalDays) * 100,
                      0
                    ) / resourceUtilization.length
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              For {selectedMonth.toLocaleDateString("en-US", { month: "long" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Scheduling Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{conflicts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Double-booked resource days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="utilization" className="w-full">
        <TabsList>
          <TabsTrigger value="utilization">Utilization Rates</TabsTrigger>
          <TabsTrigger value="calendar">Availability Calendar</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        {/* Utilization Rates */}
        <TabsContent value="utilization" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>
                Capacity usage for{" "}
                {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resourceUtilization.map((resource) => {
                  const percentage = Math.round((resource.activeDays / resource.totalDays) * 100);
                  return (
                    <div key={resource.resourceId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{resource.resourceName}</div>
                          <Badge variant="outline" className="text-xs">
                            {resource.role.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className={cn("font-semibold", getUtilizationColor(percentage))}>
                          {percentage}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full transition-all", getUtilizationBg(percentage))}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground min-w-[80px]">
                          {resource.activeDays} / {resource.totalDays} days
                        </div>
                      </div>
                      {resource.assignments.length > 0 && (
                        <div className="text-xs text-muted-foreground pl-2">
                          {resource.assignments.length} assignment(s):{" "}
                          {resource.assignments
                            .slice(0, 2)
                            .map((a) => a.task.name)
                            .join(", ")}
                          {resource.assignments.length > 2 &&
                            ` +${resource.assignments.length - 2} more`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Availability Calendar</CardTitle>
              <CardDescription>
                View resource assignments and availability
              </CardDescription>
              <div className="pt-4">
                <Select value={selectedResource || "all"} onValueChange={(v) => setSelectedResource(v === "all" ? null : v)}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="All Resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {resources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground p-2"
                  >
                    {day}
                  </div>
                ))}

                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[80px] border rounded-lg p-2 relative",
                      !day.isCurrentMonth && "bg-muted/30 text-muted-foreground",
                      day.isToday && "ring-2 ring-primary",
                      day.hasConflict && "bg-red-50 border-red-300"
                    )}
                  >
                    <div className="text-xs font-medium mb-1">{day.date.getDate()}</div>
                    {day.assignments.length > 0 && (
                      <div className="space-y-1">
                        {day.assignments.slice(0, 2).map((assignment) => (
                          <div
                            key={assignment.id}
                            className="text-[10px] bg-primary/10 text-primary px-1 py-0.5 rounded truncate"
                            title={`${assignment.task.name} - ${assignment.task.schedule.project_name}`}
                          >
                            {assignment.task.name}
                          </div>
                        ))}
                        {day.assignments.length > 2 && (
                          <div className="text-[9px] text-muted-foreground">
                            +{day.assignments.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                    {day.hasConflict && (
                      <AlertTriangle className="h-3 w-3 text-red-500 absolute top-1 right-1" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflicts */}
        <TabsContent value="conflicts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Resource Conflicts
              </CardTitle>
              <CardDescription>
                Resources assigned to multiple tasks on the same dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conflicts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduling conflicts detected!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conflicts.map((conflict, idx) => (
                    <div
                      key={idx}
                      className="border border-red-200 rounded-lg p-4 bg-red-50/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {conflict.resource.name}
                            <Badge variant="outline">{conflict.resource.role.replace("_", " ")}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(conflict.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                        <Badge variant="destructive">
                          {conflict.tasks.length} overlapping tasks
                        </Badge>
                      </div>
                      <div className="space-y-2 mt-3">
                        {conflict.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="text-sm bg-white border rounded px-3 py-2"
                          >
                            <div className="font-medium">{task.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Project: {task.project}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
