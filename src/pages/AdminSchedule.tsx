import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, Plus, BarChart3, List, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";
import CreateTaskDialog from "@/components/scheduling/CreateTaskDialog";
import CreateScheduleDialog from "@/components/scheduling/CreateScheduleDialog";
import { GanttChart } from "@/components/scheduling/GanttChart";
import CompanyCalendar from "@/components/admin/CompanyCalendar";
import { WebhookHealthDashboard } from "@/components/admin/WebhookHealthDashboard";

export default function AdminSchedule() {
  const queryClient = useQueryClient();
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  
  // AI Timeline State
  const [generatingTimeline, setGeneratingTimeline] = useState(false);
  const [aiTimeline, setAiTimeline] = useState<any>(null);

  const handleGenerateTimeline = async () => {
    if (!selectedSchedule) {
      toast.error('Please select a project schedule first');
      return;
    }

    setGeneratingTimeline(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-timeline-generator', {
        body: {
          projectId: selectedSchedule,
          scope: {},
          contractorAvailability: [],
          subAvailability: [],
          materialLeadTimes: [],
          projectType: 'General Construction'
        }
      });

      if (error) throw error;

      setAiTimeline(data);
      toast.success(`Generated ${data.milestones?.length || 0} timeline milestones`);
    } catch (error: any) {
      console.error('Error generating timeline:', error);
      toast.error(error.message || 'Failed to generate timeline');
    } finally {
      setGeneratingTimeline(false);
    }
  };

  // Fetch schedules
  const { data: schedules = [] } = useQuery({
    queryKey: ["project_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_schedules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Auto-select first schedule
  useEffect(() => {
    if (schedules.length > 0 && !selectedSchedule) {
      setSelectedSchedule(schedules[0].id);
    }
  }, [schedules, selectedSchedule]);

  // Fetch phases
  const { data: phases = [] } = useQuery({
    queryKey: ["schedule_phases", selectedSchedule],
    queryFn: async () => {
      if (!selectedSchedule) return [];

      const { data, error } = await supabase
        .from("schedule_phases")
        .select("*")
        .eq("schedule_id", selectedSchedule)
        .order("sort_order");

      if (error) throw error;
      return data;
    },
    enabled: !!selectedSchedule,
  });

  // Fetch tasks with resources
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["schedule_tasks", selectedSchedule],
    queryFn: async () => {
      if (!selectedSchedule) return [];

      const { data, error } = await supabase
        .from("schedule_tasks")
        .select(`
          *,
          phase:schedule_phases(name, color),
          assignments:schedule_assignments(
            resource:schedule_resources(id, name, role)
          )
        `)
        .eq("schedule_id", selectedSchedule)
        .order("start_date");

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedSchedule,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("schedule_tasks")
        .insert({
          schedule_id: selectedSchedule,
          name: taskData.name,
          description: taskData.description,
          start_date: taskData.startDate,
          end_date: taskData.endDate,
          workdays: taskData.workdays,
          status: taskData.status,
          color: taskData.color,
          phase_id: taskData.phase_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Handle resource assignments
      if (taskData.assignedResources && taskData.assignedResources.length > 0) {
        const assignments = taskData.assignedResources.map((resourceId: string) => ({
          task_id: data.id,
          resource_id: resourceId,
          assigned_by: user.id,
        }));

        const { error: assignError } = await supabase
          .from("schedule_assignments")
          .insert(assignments);

        if (assignError) throw assignError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_tasks"] });
      toast.success("Task created");
    },
    onError: (error: any) => {
      toast.error("Failed to create task: " + error.message);
    },
  });

  // Update task dates mutation (for drag-drop)
  const updateTaskDatesMutation = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: { start_date: string; end_date: string };
    }) => {
      const { error } = await supabase
        .from("schedule_tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_tasks"] });
      toast.success("Task dates updated");
    },
    onError: (error) => {
      toast.error("Failed to update task: " + error.message);
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...taskData }: any) => {
      const { error } = await supabase
        .from("schedule_tasks")
        .update({
          name: taskData.name,
          description: taskData.description,
          start_date: taskData.startDate,
          end_date: taskData.endDate,
          workdays: taskData.workdays,
          status: taskData.status,
          color: taskData.color,
          phase_id: taskData.phase_id,
        })
        .eq("id", id);

      if (error) throw error;

      // Update resource assignments
      await supabase.from("schedule_assignments").delete().eq("task_id", id);

      if (taskData.assignedResources && taskData.assignedResources.length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const assignments = taskData.assignedResources.map((resourceId: string) => ({
          task_id: id,
          resource_id: resourceId,
          assigned_by: user!.id,
        }));

        const { error: assignError } = await supabase
          .from("schedule_assignments")
          .insert(assignments);

        if (assignError) throw assignError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_tasks"] });
      toast.success("Task updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update task: " + error.message);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("schedule_tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_tasks"] });
      toast.success("Task deleted");
    },
    onError: (error: any) => {
      toast.error("Failed to delete task: " + error.message);
    },
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: schedule, error } = await supabase
        .from("project_schedules")
        .insert({
          project_name: scheduleData.project_name,
          project_id: scheduleData.project_id || null,
          description: scheduleData.description,
          start_date: scheduleData.start_date,
          end_date: scheduleData.end_date || null,
          created_by: user.id,
          shared_with_homeowners: scheduleData.shared_with_homeowners || [],
        })
        .select()
        .single();

      if (error) throw error;

      // Create phases
      if (scheduleData.phases && scheduleData.phases.length > 0) {
        const phases = scheduleData.phases.map((phase: any, index: number) => ({
          schedule_id: schedule.id,
          name: phase.name,
          color: phase.color,
          sort_order: index,
        }));

        const { error: phasesError } = await supabase.from("schedule_phases").insert(phases);
        if (phasesError) throw phasesError;
      }

      return schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_schedules"] });
      toast.success("Schedule created");
      setScheduleDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to create schedule: " + error.message);
    },
  });

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setScheduleDialogOpen(true);
  };

  const handleSaveSchedule = (scheduleData: any) => {
    createScheduleMutation.mutate(scheduleData);
  };

  const handleCreateTask = () => {
    if (!selectedSchedule) {
      toast.error("Please select a schedule first");
      return;
    }
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask({
      id: task.id,
      name: task.name,
      phase_id: task.phase_id,
      startDate: task.start_date,
      endDate: task.end_date,
      workdays: task.workdays,
      status: task.status,
      color: task.color,
      description: task.description,
      assignedResources: task.assignments?.map((a: any) => a.resource.id) || [],
    });
    setTaskDialogOpen(true);
  };

  const handleSaveTask = (taskData: any) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, ...taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
    setTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Delete this task?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Gantt chart with drag-and-drop task management
          </p>
        </div>
        <Button onClick={handleCreateSchedule}>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>Choose a project schedule to manage</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSchedule || undefined} onValueChange={setSelectedSchedule}>
            <SelectTrigger>
              <SelectValue placeholder="Select a schedule..." />
            </SelectTrigger>
            <SelectContent>
              {schedules.map((schedule: any) => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {schedule.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Project Tasks</CardTitle>
            <CardDescription>
              {selectedSchedule
                ? `Manage tasks for ${schedules.find((s) => s.id === selectedSchedule)?.project_name}`
                : "Select a schedule to view tasks"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {selectedSchedule && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleGenerateTimeline}
                  disabled={generatingTimeline}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generatingTimeline ? 'Generating...' : 'Generate Timeline (AI)'}
                </Button>
                <Button onClick={handleCreateTask}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* AI Timeline Draft Panel */}
          {aiTimeline && (
            <Card className="border-primary/50 bg-primary/5 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle>AI-Generated Timeline (Editable)</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setAiTimeline(null)}>
                    Clear
                  </Button>
                </div>
                <CardDescription>
                  {aiTimeline.total_duration_days} days total • {aiTimeline.milestones?.length || 0} milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Milestones */}
                <div>
                  <h4 className="font-medium mb-2">Timeline Milestones</h4>
                  <div className="space-y-2">
                    {aiTimeline.milestones?.map((milestone: any, idx: number) => (
                      <div key={idx} className="p-3 bg-background rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{milestone.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {milestone.start_date} → {milestone.end_date} ({milestone.duration_days} days)
                              {milestone.assigned_trade && ` • ${milestone.assigned_trade}`}
                            </p>
                            {milestone.dependencies?.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Dependencies: {milestone.dependencies.join(', ')}
                              </p>
                            )}
                          </div>
                          {aiTimeline.critical_path?.includes(milestone.name) && (
                            <Badge variant="destructive" className="text-xs">Critical Path</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Red Flags */}
                {aiTimeline.red_flags?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">⚠️ Red Flags & Potential Delays</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {aiTimeline.red_flags.map((flag: string, idx: number) => (
                        <li key={idx}>• {flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button className="w-full">Apply Timeline to Schedule</Button>
              </CardContent>
            </Card>
          )}

          {!selectedSchedule ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a project schedule to view and manage tasks</p>
            </div>
          ) : tasksLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tasks found. Create your first task to get started.</p>
            </div>
          ) : (
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="gantt" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Gantt View
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  List View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="mt-0">
                <div className="space-y-4">
                  <WebhookHealthDashboard />
                  <CompanyCalendar />
                </div>
              </TabsContent>

              <TabsContent value="gantt" className="mt-0">
                <GanttChart
                  tasks={tasks}
                  phases={phases}
                  onTaskUpdate={(taskId, updates) =>
                    updateTaskDatesMutation.mutate({ taskId, updates })
                  }
                  onTaskClick={handleEditTask}
                />
              </TabsContent>

              <TabsContent value="list" className="mt-0">
                <div className="space-y-2">
                  {tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleEditTask(task)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: task.color }}
                          />
                          <h4 className="font-medium">{task.name}</h4>
                          {task.phase && (
                            <span className="text-xs text-muted-foreground">
                              ({task.phase.name})
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(task.start_date).toLocaleDateString()} -{" "}
                            {new Date(task.end_date).toLocaleDateString()}
                          </span>
                          <span>Status: {task.status}</span>
                          {task.assignments && task.assignments.length > 0 && (
                            <span>
                              Resources:{" "}
                              {task.assignments.map((a: any) => a.resource.name).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        scheduleId={selectedSchedule || ""}
        existingTasks={tasks}
        editTask={editingTask}
        onSave={handleSaveTask}
      />

      <CreateScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) setEditingSchedule(null);
        }}
        editSchedule={editingSchedule}
        onSave={handleSaveSchedule}
      />
    </div>
  );
}
