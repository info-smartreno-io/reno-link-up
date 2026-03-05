import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Footprints, 
  Camera, 
  Ruler, 
  FileText, 
  Send, 
  Phone,
  Lock,
  AlertTriangle
} from "lucide-react";

interface EstimatorTask {
  id: string;
  lead_id: string;
  task_type: string;
  task_name: string;
  completed: boolean;
  required_for_gate: boolean;
  completed_at: string | null;
}

const TASK_ICONS: Record<string, React.ElementType> = {
  walkthrough: Footprints,
  photos: Camera,
  measurements: Ruler,
  proposal_create: FileText,
  proposal_send: Send,
  followup: Phone,
};

const DEFAULT_TASKS = [
  { task_type: "walkthrough", task_name: "Walk-through completed", required_for_gate: false },
  { task_type: "photos", task_name: "Photos uploaded", required_for_gate: true },
  { task_type: "measurements", task_name: "Measurements entered", required_for_gate: true },
  { task_type: "proposal_create", task_name: "Proposal created", required_for_gate: false },
  { task_type: "proposal_send", task_name: "Proposal sent", required_for_gate: false },
  { task_type: "followup", task_name: "Follow-up logged", required_for_gate: false },
];

interface Props {
  leadId: string;
}

export function EstimatorTaskChecklist({ leadId }: Props) {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["estimator-tasks", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estimator_tasks')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // If no tasks exist, create default tasks
      if (!data || data.length === 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const tasksToInsert = DEFAULT_TASKS.map(task => ({
          ...task,
          lead_id: leadId,
        }));

        const { data: newTasks, error: insertError } = await supabase
          .from('estimator_tasks')
          .insert(tasksToInsert)
          .select();

        if (insertError) throw insertError;
        return (newTasks || []) as EstimatorTask[];
      }

      return data as EstimatorTask[];
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('estimator_tasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          completed_by: completed ? user.id : null,
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimator-tasks", leadId] });
    },
    onError: (error) => {
      toast.error("Failed to update task");
      console.error(error);
    },
  });

  // Check if gate requirements are met (photos + measurements)
  const gateRequirementsMet = tasks
    .filter(t => t.required_for_gate)
    .every(t => t.completed);

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Task Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Task Checklist</CardTitle>
          <Badge variant="secondary">{progress}% Complete</Badge>
        </div>
        {!gateRequirementsMet && (
          <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
            <Lock className="h-3.5 w-3.5" />
            <span>Proposal cannot be sent until photos + measurements are uploaded</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {tasks.map((task) => {
          const Icon = TASK_ICONS[task.task_type] || FileText;
          const isProposalSend = task.task_type === "proposal_send";
          const isGateLocked = isProposalSend && !gateRequirementsMet;

          return (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 ${
                isGateLocked ? "opacity-50" : ""
              }`}
            >
              <Checkbox
                id={task.id}
                checked={task.completed}
                disabled={isGateLocked || toggleTaskMutation.isPending}
                onCheckedChange={(checked) => {
                  toggleTaskMutation.mutate({
                    taskId: task.id,
                    completed: !!checked,
                  });
                }}
              />
              <Icon className={`h-4 w-4 ${task.completed ? "text-green-500" : "text-muted-foreground"}`} />
              <label
                htmlFor={task.id}
                className={`flex-1 text-sm cursor-pointer ${
                  task.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {task.task_name}
              </label>
              {task.required_for_gate && (
                <Badge variant="outline" className="text-[10px]">
                  Required
                </Badge>
              )}
              {isGateLocked && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}