import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface PMPreConstructionChecklistProps {
  projectId: string;
}

const defaultChecklistItems = [
  { id: '1', task_name: 'Final plans complete', owner: 'Architect', status: 'pending' },
  { id: '2', task_name: 'Scope adjusted from plans', owner: 'Estimator', status: 'pending' },
  { id: '3', task_name: 'Homeowner approval', owner: 'PM', status: 'pending' },
  { id: '4', task_name: 'Engineering complete', owner: 'Engineer', status: 'pending' },
  { id: '5', task_name: 'Zoning submitted', owner: 'PM', status: 'pending' },
  { id: '6', task_name: 'Permit issued', owner: 'Town', status: 'pending' }
];

export function PMPreConstructionChecklist({ projectId }: PMPreConstructionChecklistProps) {
  const [tasks, setTasks] = useState(defaultChecklistItems);

  const handleToggle = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const allComplete = completedCount === totalCount;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Pre-Construction Checklist</CardTitle>
          <Badge variant={allComplete ? 'default' : 'secondary'}>{completedCount}/{totalCount}</Badge>
        </div>
        {!allComplete && (
          <div className="flex items-center gap-2 text-amber-500 text-xs mt-2">
            <AlertTriangle className="h-3 w-3" />
            <span>Phase cannot advance until all gates are complete</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox checked={task.status === 'completed'} onCheckedChange={() => handleToggle(task.id)} className="h-5 w-5" />
                <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>{task.task_name}</span>
              </div>
              <Badge variant="outline" className="text-xs">{task.owner}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}