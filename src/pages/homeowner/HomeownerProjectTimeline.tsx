import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeownerProjectDetail } from "@/hooks/useHomeownerData";
import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";
import { isPast, parseISO } from "date-fns";

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-primary", label: "Completed" },
  in_progress: { icon: Clock, color: "text-blue-500", label: "In Progress" },
  delayed: { icon: AlertTriangle, color: "text-orange-500", label: "Delayed" },
  pending: { icon: Circle, color: "text-muted-foreground/40", label: "Upcoming" },
  not_started: { icon: Circle, color: "text-muted-foreground/40", label: "Upcoming" },
};

export default function HomeownerProjectTimeline() {
  const { projectId } = useParams();
  const { data, isLoading } = useHomeownerProjectDetail(projectId);

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  const tasks = data?.timelineTasks || [];

  if (!tasks.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Your project timeline will appear here once construction begins.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">Project Timeline</h3>
        <p className="text-xs text-muted-foreground mt-1">Key milestones for your renovation.</p>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

        <div className="space-y-1">
          {tasks.map((task: any) => {
            const isOverdue = task.end_date && task.status !== "completed" && isPast(parseISO(task.end_date));
            const effectiveStatus = isOverdue ? "delayed" : (task.status || "not_started");
            const config = statusConfig[effectiveStatus] || statusConfig.not_started;
            const Icon = config.icon;

            return (
              <div key={task.id} className="relative pl-10 py-3">
                <div className={`absolute left-2.5 top-4 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{task.task_name}</p>
                    {task.phase && (
                      <p className="text-xs text-muted-foreground">{task.phase}</p>
                    )}
                    {task.start_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(task.start_date).toLocaleDateString()}
                        {task.end_date && ` — ${new Date(task.end_date).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] shrink-0 ${isOverdue ? "bg-orange-100 text-orange-700 border-0" : ""}`}
                  >
                    {config.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
