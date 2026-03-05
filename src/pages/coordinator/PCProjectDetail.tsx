import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuildReadyGateTracker } from "@/components/coordinator/BuildReadyGateTracker";
import { SubBiddingHub } from "@/components/coordinator/SubBiddingHub";
import { PCBudgetPanel } from "@/components/coordinator/PCBudgetPanel";
import { StartDateAuth } from "@/components/coordinator/StartDateAuth";
import { Loader2, MapPin, User, DollarSign, Calendar, ExternalLink, Lock } from "lucide-react";

export default function PCProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ["pc-project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: gates = [] } = useQuery({
    queryKey: ["build-gates", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("build_gates")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const allGatesComplete = gates.length > 0 && gates.every(g => g.status === "completed");
  const isReadOnly = Boolean(project?.pc_readonly) || Boolean(project?.pm_approved_start_at);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.name || "")}`;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <BackButton />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {isReadOnly && (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Read-Only
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{project.project_type}</p>
          </div>
          <Badge variant={project.risk_level === "high" ? "destructive" : "secondary"}>
            {project.risk_level || "Low"} Risk
          </Badge>
        </div>

        {/* Project Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Project Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Homeowner</p>
                  <p className="text-sm font-medium">{project.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <a 
                    href={mapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    View Map <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Contract Value</p>
                  <p className="text-sm font-medium">
                    ${project.estimated_budget?.toLocaleString() || "TBD"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Target Start</p>
                  <p className="text-sm font-medium">
                    {project.target_start_date 
                      ? new Date(project.target_start_date).toLocaleDateString()
                      : "Not Set"
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="gates" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gates">Build Gates</TabsTrigger>
            <TabsTrigger value="subs">Sub Bidding</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="start">Start Date</TabsTrigger>
          </TabsList>

          <TabsContent value="gates">
            <BuildReadyGateTracker 
              projectId={projectId!} 
              isReadOnly={isReadOnly} 
            />
          </TabsContent>

          <TabsContent value="subs">
            <SubBiddingHub 
              projectId={projectId!} 
              isReadOnly={isReadOnly} 
            />
          </TabsContent>

          <TabsContent value="budget">
            <PCBudgetPanel 
              projectId={projectId!} 
              isReadOnly={isReadOnly} 
            />
          </TabsContent>

          <TabsContent value="start">
            <StartDateAuth 
              projectId={projectId!} 
              isReadOnly={isReadOnly}
              allGatesComplete={allGatesComplete}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/coordinator/project/${projectId}/materials`)}
          >
            Materials Management
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/coordinator/project/${projectId}/permits`)}
          >
            Permit Tracking
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/coordinator/project/${projectId}/homeowner-meeting`)}
          >
            Meetings
          </Button>
        </div>
      </main>
    </div>
  );
}
