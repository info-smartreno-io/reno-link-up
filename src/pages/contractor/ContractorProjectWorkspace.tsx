import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectWorkspace } from "@/hooks/contractor/useProjectWorkspace";
import { StatusBadge } from "@/components/contractor/StatusBadge";
import { ProjectOverview } from "@/components/contractor/workspace/ProjectOverview";
import { ProjectDocuments } from "@/components/contractor/workspace/ProjectDocuments";
import { ProjectMessages } from "@/components/contractor/workspace/ProjectMessages";
import { ProjectSubcontractors } from "@/components/contractor/workspace/ProjectSubcontractors";
import { ProjectDailyLogs } from "@/components/contractor/workspace/ProjectDailyLogs";
import { ProjectTimeline } from "@/components/contractor/workspace/ProjectTimeline";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = ["overview", "documents", "messages", "subcontractors", "daily-logs", "timeline"] as const;
type TabValue = typeof TABS[number];

export default function ContractorProjectWorkspace() {
  const { projectId, tab } = useParams<{ projectId: string; tab?: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProjectWorkspace(projectId);
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  useEffect(() => {
    if (tab && TABS.includes(tab as TabValue)) {
      setActiveTab(tab as TabValue);
    }
  }, [tab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
    navigate(`/contractor/projects/${projectId}/${value}`, { replace: true });
  };

  if (isLoading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  if (!project) {
    return (
      <ContractorLayout>
        <div className="p-6 text-center text-muted-foreground">Project not found.</div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/contractor/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.project_name}</h1>
              <StatusBadge value={project.status} />
            </div>
            <p className="text-sm text-muted-foreground">{project.location} · {project.client_name}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="subcontractors">Subcontractors</TabsTrigger>
            <TabsTrigger value="daily-logs">Daily Logs</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><ProjectOverview project={project} /></TabsContent>
          <TabsContent value="documents"><ProjectDocuments projectId={projectId!} /></TabsContent>
          <TabsContent value="messages"><ProjectMessages projectId={projectId!} /></TabsContent>
          <TabsContent value="subcontractors"><ProjectSubcontractors projectId={projectId!} /></TabsContent>
          <TabsContent value="daily-logs"><ProjectDailyLogs projectId={projectId!} /></TabsContent>
          <TabsContent value="timeline"><ProjectTimeline projectId={projectId!} /></TabsContent>
        </Tabs>
      </div>
    </ContractorLayout>
  );
}
