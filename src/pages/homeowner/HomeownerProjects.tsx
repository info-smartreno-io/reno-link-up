import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeownerProjects, getHomeownerStatus } from "@/hooks/useHomeownerData";
import { MapPin, ArrowRight, Calendar } from "lucide-react";

export default function HomeownerProjects() {
  const { data: projects, isLoading } = useHomeownerProjects();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Projects</h1>
        <p className="text-muted-foreground mt-1">All your renovation projects in one place.</p>
      </div>

      {projects?.length ? (
        <div className="grid gap-4">
          {projects.map((project) => {
            const status = getHomeownerStatus(project.status || "intake");
            return (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-border"
                onClick={() => navigate(`/homeowner/projects/${project.id}/overview`)}
              >
                <CardContent className="p-5 flex items-center justify-between">
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
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                      {status.label}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No projects found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
