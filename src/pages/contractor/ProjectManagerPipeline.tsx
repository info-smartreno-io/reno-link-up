import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Loader2,
  ClipboardList,
  FileText,
  Hammer,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { SalesFunnel } from "@/components/estimator/SalesFunnel";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDemoMode } from "@/context/DemoModeContext";

interface PMProject {
  id: string;
  project_name: string;
  client_name: string;
  project_type: string;
  location: string;
  pm_status?: string | null;
  project_manager_id?: string | null;
  percent_complete?: number | null;
  inspection_status?: string | null;
  change_order_count?: number | null;
  last_update_at?: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pm_pre_construction: "hsl(217, 15%, 60%)",
  pm_scheduled: "hsl(45, 93%, 47%)",
  pm_mobilization: "hsl(262, 83%, 58%)",
  pm_in_progress: "hsl(142, 76%, 36%)",
  pm_inspection_pending: "hsl(30, 80%, 55%)",
  pm_inspection_passed: "hsl(195, 75%, 45%)",
  pm_delayed: "hsl(10, 80%, 55%)",
  pm_punch_list: "hsl(340, 75%, 55%)",
  pm_closed_out: "hsl(120, 60%, 50%)",
};

export default function ProjectManagerPipeline() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<PMProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [activeDragProject, setActiveDragProject] = useState<PMProject | null>(null);

  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      // Demo data for PM pipeline
      const demoProjects: PMProject[] = [
        { id: "demo-pm-1", project_name: "Kitchen Renovation - Smith", client_name: "John Smith", project_type: "Kitchen", location: "123 Main St, Newark, NJ", pm_status: "pm_in_progress", percent_complete: 45, created_at: new Date().toISOString() },
        { id: "demo-pm-2", project_name: "Bathroom Remodel - Johnson", client_name: "Sarah Johnson", project_type: "Bathroom", location: "456 Oak Ave, Jersey City, NJ", pm_status: "pm_scheduled", percent_complete: 0, created_at: new Date().toISOString() },
        { id: "demo-pm-3", project_name: "Basement Finishing - Williams", client_name: "Mike Williams", project_type: "Basement", location: "789 Elm St, Hoboken, NJ", pm_status: "pm_inspection_pending", percent_complete: 85, created_at: new Date().toISOString() },
        { id: "demo-pm-4", project_name: "Home Addition - Davis", client_name: "Emily Davis", project_type: "Addition", location: "321 Pine Rd, Morristown, NJ", pm_status: "pm_mobilization", percent_complete: 10, created_at: new Date().toISOString() },
      ];
      setProjects(demoProjects);
      setLoading(false);
      return;
    }
    fetchProjects();
  }, [isDemoMode]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects((data || []) as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load projects.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      project.client_name?.toLowerCase().includes(query) ||
      project.project_name?.toLowerCase().includes(query) ||
      project.project_type?.toLowerCase().includes(query) ||
      project.location?.toLowerCase().includes(query);
    const matchesStage = !selectedStage || project.pm_status === selectedStage;
    return matchesSearch && matchesStage;
  });

  const funnelStages = [
    { name: "Pre-Construction", status: "pm_pre_construction", count: projects.filter(p => p.pm_status === "pm_pre_construction").length, color: statusColors.pm_pre_construction },
    { name: "Scheduled", status: "pm_scheduled", count: projects.filter(p => p.pm_status === "pm_scheduled").length, color: statusColors.pm_scheduled },
    { name: "Mobilization", status: "pm_mobilization", count: projects.filter(p => p.pm_status === "pm_mobilization").length, color: statusColors.pm_mobilization },
    { name: "In Progress", status: "pm_in_progress", count: projects.filter(p => p.pm_status === "pm_in_progress").length, color: statusColors.pm_in_progress },
    { name: "Inspection Pending", status: "pm_inspection_pending", count: projects.filter(p => p.pm_status === "pm_inspection_pending").length, color: statusColors.pm_inspection_pending },
    { name: "Inspection Passed", status: "pm_inspection_passed", count: projects.filter(p => p.pm_status === "pm_inspection_passed").length, color: statusColors.pm_inspection_passed },
    { name: "Delayed", status: "pm_delayed", count: projects.filter(p => p.pm_status === "pm_delayed").length, color: statusColors.pm_delayed },
    { name: "Punch List", status: "pm_punch_list", count: projects.filter(p => p.pm_status === "pm_punch_list").length, color: statusColors.pm_punch_list },
    { name: "Closed Out", status: "pm_closed_out", count: projects.filter(p => p.pm_status === "pm_closed_out").length, color: statusColors.pm_closed_out },
  ];

  const handleStageClick = (status: string) => {
    setSelectedStage(selectedStage === status ? null : status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Project Manager Pipeline</h1>
          <p className="text-muted-foreground">
            Production execution: schedule, inspections, change orders, and closeout
          </p>
        </div>

        <SalesFunnel
          stages={funnelStages}
          selectedStage={selectedStage}
          onStageClick={handleStageClick}
          leads={projects as any}
        />

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Projects ({filteredProjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No projects found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client / Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">PM Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.client_name}</div>
                          <div className="text-sm text-muted-foreground">{project.project_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{project.project_type}</TableCell>
                      <TableCell>{project.location}</TableCell>
                      <TableCell>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{
                              width: `${project.percent_complete || 0}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {project.percent_complete || 0}% complete
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          style={{ 
                            borderLeftColor: statusColors[project.pm_status || ''], 
                            borderLeftWidth: "3px" 
                          }}
                        >
                          {(project.pm_status || '').replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline">
                            <ClipboardList className="h-4 w-4 mr-1" />
                            Daily Log
                          </Button>
                          <Button size="sm" variant="outline">
                            <Wrench className="h-4 w-4 mr-1" />
                            COs
                          </Button>
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-1" />
                            Inspections
                          </Button>
                          <Button size="sm" variant="outline">
                            <Hammer className="h-4 w-4 mr-1" />
                            Job View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ContractorLayout>
  );
}
