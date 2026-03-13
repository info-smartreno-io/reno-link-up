import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, ArrowRight } from "lucide-react";
import { format } from "date-fns";

type IntakeStatusCardProps = {
  project: {
    id?: string;
    project_name: string | null;
    project_type: string | null;
    created_at: string | null;
    status: string | null;
  };
};

export function IntakeStatusCard({ project }: IntakeStatusCardProps) {
  const navigate = useNavigate();
  const submittedDate =
    project.created_at ? format(new Date(project.created_at), "MMM d, yyyy") : "—";
  const submittedTime =
    project.created_at ? format(new Date(project.created_at), "h:mm a") : "";

  const actionItem = (() => {
    const status = (project.status || "").toLowerCase();
    if (!status || status === "open" || status === "intake" || status === "new") {
      return "Our team is reviewing your project.";
    }
    if (status.includes("need") || status.includes("info")) {
      return "More project info needed.";
    }
    if (status.includes("visit") || status.includes("walkthrough")) {
      return "Schedule and prepare for a site visit.";
    }
    if (status.includes("rfp") || status.includes("bid") || status.includes("bids")) {
      if (status.includes("1")) return "1 bid received.";
      if (status.includes("2")) return "2 bids received.";
      if (status.includes("3")) return "3 bids received.";
      if (status.includes("review")) return "Reviewing bids.";
      return "Out to bid.";
    }
    if (status.includes("selected")) {
      return "Bid selected. Next step: contractor site visit.";
    }
    if (status.includes("contract")) {
      return "Contract accepted. Project is ready to start.";
    }
    if (status.includes("active") || status.includes("progress") || status.includes("start")) {
      return "Project started. Track progress in your portal.";
    }
    return "Our team is working on your project.";
  })();

  const materialsText = "None";

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
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="font-medium text-foreground">
                {submittedDate}
                {submittedTime && (
                  <span className="text-xs text-muted-foreground ml-1">
                    at {submittedTime}
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {project.status || "open"}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Action item</div>
              <div className="font-medium text-foreground">
                {actionItem}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Material selected</div>
              <div className="font-medium text-foreground">
                {materialsText}
              </div>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-1 shrink-0 gap-1.5"
            onClick={() => navigate("/homeowner/bid-packet")}
          >
            View my project
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

