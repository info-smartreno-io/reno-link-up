import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import { format } from "date-fns";

type IntakeStatusCardProps = {
  project: {
    project_name: string | null;
    project_type: string | null;
    created_at: string | null;
    status: string | null;
  };
};

export function IntakeStatusCard({ project }: IntakeStatusCardProps) {
  const submitted =
    project.created_at ? format(new Date(project.created_at), "MMM d, yyyy") : "—";

  return (
    <Card className="border border-primary/20 bg-primary/5">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              Your renovation request has been received
            </h2>
            <p className="text-xs text-muted-foreground">
              Our team is reviewing your request and you’ll be notified when the next step is
              ready.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-muted-foreground">Project</div>
            <div className="font-medium text-foreground">
              {project.project_name || "Renovation Project"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Type</div>
            <div className="font-medium text-foreground">
              {project.project_type || "—"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Submitted</div>
            <div className="font-medium text-foreground">{submitted}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {project.status || "open"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

