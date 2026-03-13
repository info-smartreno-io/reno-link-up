import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeownerProjects, getHomeownerStatus, HOMEOWNER_STATUS_MAP } from "@/hooks/useHomeownerData";
import { supabase } from "@/integrations/supabase/client";
import { IntakeStatusCard } from "@/components/homeowner/IntakeStatusCard";
import { MapPin, ArrowRight, Calendar } from "lucide-react";

export default function HomeownerProjects() {
  const { data: projects, isLoading } = useHomeownerProjects();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  console.log("[HomeownerProjectsPage] pipelineProjects", projects);

  const {
    data: intakeProjects,
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
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[HomeownerProjectsPage] intakeProject fallback error", error);
        return [];
      }

      console.log("[HomeownerProjectsPage] intakeProjects", data);
      return data || [];
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

  const homeownerStatusOptions = [
    { value: "all", label: "All statuses" },
    { value: "open", label: "Open" },
    { value: "rfp_out", label: "Out to bid" },
    { value: "design", label: "Design / architectural" },
    { value: "permit", label: "Permit / pre-construction" },
    { value: "in_progress", label: "In progress" },
    { value: "punch_list", label: "Punch list" },
    { value: "completed", label: "Completed" },
  ];

  const matchesFilter = (rawStatus: string | null) => {
    if (statusFilter === "all") return true;
    const status = (rawStatus || "").toLowerCase();
    switch (statusFilter) {
      case "open":
        return ["open", "planning", "intake", "new", "needs_info", "payment_confirmed", "paid"].includes(status);
      case "rfp_out":
        return ["estimate_ready", "ready_for_rfp", "estimate_approved", "rfp_out", "bids_received", "homeowner_review"].includes(status);
      case "design":
        return status.includes("design");
      case "permit":
        return ["pre_construction"].includes(status);
      case "in_progress":
        return ["active", "in_progress"].includes(status);
      case "punch_list":
        return ["punch_list", "final_walkthrough"].includes(status);
      case "completed":
        return ["complete", "completed", "archived"].includes(status);
      default:
        return true;
    }
  };

  if (pipelineProjects.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">My Projects</h1>
            <p className="text-muted-foreground mt-1">All your renovation projects in one place.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Filter by status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-input bg-background rounded-md px-2 py-1 text-xs"
            >
              {homeownerStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          {pipelineProjects.filter((p) => matchesFilter(p.status)).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No projects match the selected status. Try &quot;All statuses&quot; or another filter.
              </CardContent>
            </Card>
          ) : (
          pipelineProjects.filter((p) => matchesFilter(p.status)).map((project) => {
            const status = getHomeownerStatus(project.status || "intake");
            const phaseLabel = HOMEOWNER_STATUS_MAP[project.status || "intake"]?.label || "—";
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
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                        {status.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Phase: {phaseLabel}
                      </span>
                    </div>
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
          })
          )}
        </div>
      </div>
    );
  }

  if (intakeProjects && intakeProjects.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">My Projects</h1>
            <p className="text-muted-foreground mt-1">
              Your renovation request is in review.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Filter by status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-input bg-background rounded-md px-2 py-1 text-xs"
            >
              {homeownerStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-4">
          {intakeProjects.filter((p) => matchesFilter((p as any).status)).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No projects match the selected status. Try &quot;All statuses&quot; or another filter.
              </CardContent>
            </Card>
          ) : (
            intakeProjects.filter((p) => matchesFilter((p as any).status)).map((project) => (
              <IntakeStatusCard key={(project as any).id} project={project as any} />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Projects</h1>
          <p className="text-muted-foreground mt-1">All your renovation projects in one place.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Filter by status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-input bg-background rounded-md px-2 py-1 text-xs"
            disabled
          >
            {homeownerStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No projects found. Start a renovation from your dashboard to see projects here.
        </CardContent>
      </Card>
    </div>
  );
}
