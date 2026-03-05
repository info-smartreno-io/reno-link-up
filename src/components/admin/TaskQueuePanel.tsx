import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ListTodo, Calendar } from "lucide-react";

interface TaskQueuePanelProps {
  projectId: string;
  timeline: any[];
  recentEvents: any[];
  riskFactors: any[];
  materials: any[];
  pendingItems: any[];
}

export function TaskQueuePanel({
  projectId,
  timeline,
  recentEvents,
  riskFactors,
  materials,
  pendingItems
}: TaskQueuePanelProps) {
  const [loading, setLoading] = useState(false);
  const [taskQueue, setTaskQueue] = useState<any>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const generateTaskQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-task-queue-generator", {
        body: {
          projectId,
          timeline,
          recentEvents,
          riskFactors,
          materials,
          pendingItems
        }
      });

      if (error) throw error;

      setTaskQueue(data);
      setCompletedTasks(new Set());

      toast({
        title: "Task Queue Generated",
        description: `${data.task_list?.length || 0} tasks prioritized for today.`
      });
    } catch (error) {
      console.error("Error generating task queue:", error);
      toast({
        title: "Error",
        description: "Failed to generate task queue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (idx: number) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(idx)) {
      newCompleted.delete(idx);
    } else {
      newCompleted.add(idx);
    }
    setCompletedTasks(newCompleted);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              AI Task Queue Generator
            </CardTitle>
            <CardDescription>
              Prioritized daily task list for project coordinators
            </CardDescription>
          </div>
          <Button onClick={generateTaskQueue} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Tasks
          </Button>
        </div>
      </CardHeader>

      {taskQueue && (
        <CardContent className="space-y-6">
          {/* Summary */}
          {taskQueue.summary && (
            <div>
              <h3 className="font-semibold mb-2">Task Summary</h3>
              <p className="text-sm text-muted-foreground">{taskQueue.summary}</p>
            </div>
          )}

          {/* Task List */}
          {taskQueue.task_list && taskQueue.task_list.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Today's Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  {completedTasks.size} of {taskQueue.task_list.length} completed
                </p>
              </div>
              <div className="space-y-3">
                {taskQueue.task_list.map((task: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 border rounded-lg transition-opacity ${
                      completedTasks.has(idx) ? "opacity-50" : ""
                    }`}
                  >
                    <Checkbox
                      checked={completedTasks.has(idx)}
                      onCheckedChange={() => toggleTask(idx)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium ${completedTasks.has(idx) ? "line-through" : ""}`}>
                          {task.task}
                        </p>
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.reason && (
                        <p className="text-sm text-muted-foreground">{task.reason}</p>
                      )}
                      {task.deadline && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {task.deadline}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="default">Save Task List</Button>
            <Button variant="outline">Assign to Team</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
