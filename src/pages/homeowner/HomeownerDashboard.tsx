import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHomeownerProjects,
  getHomeownerStatus,
  getNextStep,
  HOMEOWNER_MILESTONES,
} from "@/hooks/useHomeownerData";
import {
  ArrowRight,
  MapPin,
  Calendar,
  MessageSquare,
  FolderOpen,
  ClipboardList,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

export default function HomeownerDashboard() {
  const { data: projects, isLoading } = useHomeownerProjects();
  const navigate = useNavigate();

  const activeProject = projects?.[0];
  const status = activeProject ? getHomeownerStatus(activeProject.status || "intake") : null;
  const nextStep = activeProject ? getNextStep(activeProject.status || "intake") : "";
  const progressPercent = status ? Math.round((status.step / (HOMEOWNER_MILESTONES.length - 1)) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Here's the latest on your renovation.</p>
      </div>

      {activeProject ? (
        <>
          {/* Active Project Card */}
          <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    {activeProject.project_type || "Renovation Project"}
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{activeProject.address || "Address pending"}</span>
                  </div>
                  {activeProject.estimated_completion && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Est. completion: {new Date(activeProject.estimated_completion).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <Badge className="self-start bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                  {status?.label}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                
                {/* Milestone dots */}
                <div className="flex justify-between mt-2">
                  {HOMEOWNER_MILESTONES.map((milestone, i) => (
                    <div key={milestone} className="flex flex-col items-center" style={{ width: `${100 / HOMEOWNER_MILESTONES.length}%` }}>
                      {i <= (status?.step || 0) ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/30" />
                      )}
                      <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight hidden md:block">
                        {milestone}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What Happens Next */}
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs font-medium text-primary mb-1">What Happens Next</p>
                <p className="text-sm text-foreground">{nextStep}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Open Project", icon: ArrowRight, action: () => navigate(`/homeowner/projects/${activeProject.id}/overview`) },
              { label: "Messages", icon: MessageSquare, action: () => navigate(`/homeowner/projects/${activeProject.id}/messages`) },
              { label: "Files", icon: FolderOpen, action: () => navigate(`/homeowner/projects/${activeProject.id}/files`) },
              { label: "Proposals", icon: ClipboardList, action: () => navigate(`/homeowner/projects/${activeProject.id}/proposals`) },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:bg-muted/50"
                onClick={action.action}
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No active projects yet.</p>
            <Button className="mt-4" onClick={() => navigate("/get-estimate")}>
              Start Your Renovation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
