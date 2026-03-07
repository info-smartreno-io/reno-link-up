import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeownerProjectDetail, getHomeownerStatus } from "@/hooks/useHomeownerData";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "proposals", label: "Proposals" },
  { value: "timeline", label: "Timeline" },
  { value: "messages", label: "Messages" },
  { value: "files", label: "Files" },
  { value: "daily-logs", label: "Daily Logs" },
];

export default function HomeownerProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading } = useHomeownerProjectDetail(projectId);

  // Determine active tab from URL
  const pathParts = location.pathname.split("/");
  const activeTab = pathParts[pathParts.length - 1] || "overview";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const project = data?.project;
  const status = getHomeownerStatus(project?.status || "intake");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="mt-0.5" onClick={() => navigate("/homeowner/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {project?.project_type || "Project"}
          </h1>
          <p className="text-sm text-muted-foreground">{project?.address}</p>
        </div>
        <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          {status.label}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => navigate(`/homeowner/projects/${projectId}/${v}`)}>
        <TabsList className="w-full justify-start overflow-x-auto bg-muted/50">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs md:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Child route content */}
      <Outlet />
    </div>
  );
}
