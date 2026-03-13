import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeownerProjects, getHomeownerStatus } from "@/hooks/useHomeownerData";
import { supabase } from "@/integrations/supabase/client";
import { IntakeStatusCard } from "@/components/homeowner/IntakeStatusCard";
import { MapPin, ArrowRight, Calendar } from "lucide-react";

export default function HomeownerProjects() {
  const { data: projects, isLoading } = useHomeownerProjects();
  const navigate = useNavigate();

  console.log("[HomeownerProjectsPage] pipelineProjects", projects);

  const {
    data: intakeProject,
    isLoading: isLoadingIntake,
  } = useQuery({
    queryKey: ["homeowner-intake-project-list-fallback"],
    enabled: !isLoading && (!projects || projects.length === 0),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("projects")
        .select("id, project_name, project_type, created_at, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[HomeownerProjectsPage] intakeProject fallback error", error);
        return null;
      }

      console.log("[HomeownerProjectsPage] intakeProject", data);
      return data;
    },
    staleTime: 30000,
    retry: 1,
  });

  if (isLoading || isLoadingIntake) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const pipelineProjects = projects || [];

  if (pipelineProjects.length > 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Projects</h1>
          <p className="text-muted-foreground mt-1">All your renovation projects in one place.</p>
        </div>

        <div className="grid gap-4">
          {pipelineProjects.map((project) => {
            const status = getHomeownerStatus(project.status || "intake");
            return (
              <Card
                key={project.id}
                className="hover:shadow-md transition-shadow border-border"
              >
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-foreground">
                      {project.project_type || "Renovation"}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{project.address || "Address pending"}</span>
                    </div>
                    {project.updated_at && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                      {status.label}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => navigate(`/homeowner/projects/${project.id}/overview`)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      View my project
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (intakeProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Projects</h1>
          <p className="text-muted-foreground mt-1">
            Your renovation request is in review.
          </p>
        </div>
        <IntakeStatusCard project={intakeProject as any} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Projects</h1>
        <p className="text-muted-foreground mt-1">All your renovation projects in one place.</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No projects found.
        </CardContent>
      </Card>
    </div>
  );
}
