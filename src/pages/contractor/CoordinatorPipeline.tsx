import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Loader2,
  Settings,
  ClipboardList,
  Package,
  FileText,
  CalendarClock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SalesFunnel } from "@/components/estimator/SalesFunnel";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { StageTimeoutSettings } from "@/components/estimator/StageTimeoutSettings";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { PortalCopilot } from "@/components/ai/PortalCopilot";

interface Project {
  id: string;
  homeowner_name: string;
  homeowner_email: string;
  homeowner_phone: string;
  address: string;
  city?: string | null;
  state?: string | null;
  project_type: string;
  status: string;
  estimated_budget: string | null;
  permit_status?: string | null;
  materials_status?: string | null;
  target_start_date?: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pc_kickoff_needed: "hsl(217, 91%, 60%)",
  pc_kickoff_scheduled: "hsl(45, 93%, 47%)",
  selections_meeting: "hsl(262, 83%, 58%)",
  scope_locked: "hsl(142, 76%, 36%)",
  permit_prep: "hsl(30, 80%, 55%)",
  permit_submitted: "hsl(280, 65%, 60%)",
  permit_approved: "hsl(195, 75%, 45%)",
  materials_ordered: "hsl(160, 70%, 50%)",
  schedule_locked: "hsl(120, 60%, 50%)",
  in_production: "hsl(210, 80%, 55%)",
  punch_list: "hsl(340, 75%, 55%)",
  complete: "hsl(150, 60%, 45%)",
  on_hold: "hsl(40, 70%, 60%)",
  cancelled: "hsl(0, 70%, 50%)",
};

export default function CoordinatorPipeline() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [activeDragProject, setActiveDragProject] = useState<Project | null>(null);

  // Import demo mode
  const { useDemoMode } = require("@/context/DemoModeContext");
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      // Demo data for coordinator pipeline
      const demoProjects: Project[] = [
        { id: "demo-1", homeowner_name: "John Smith", homeowner_email: "john@example.com", homeowner_phone: "555-1234", address: "123 Main St, Newark, NJ", project_type: "Kitchen Renovation", status: "pc_kickoff_needed", estimated_budget: "45000", created_at: new Date().toISOString() },
        { id: "demo-2", homeowner_name: "Sarah Johnson", homeowner_email: "sarah@example.com", homeowner_phone: "555-5678", address: "456 Oak Ave, Jersey City, NJ", project_type: "Bathroom Remodel", status: "selections_meeting", estimated_budget: "28000", created_at: new Date().toISOString() },
        { id: "demo-3", homeowner_name: "Mike Williams", homeowner_email: "mike@example.com", homeowner_phone: "555-9012", address: "789 Elm St, Hoboken, NJ", project_type: "Basement Finishing", status: "permit_prep", estimated_budget: "62000", created_at: new Date().toISOString() },
        { id: "demo-4", homeowner_name: "Emily Davis", homeowner_email: "emily@example.com", homeowner_phone: "555-3456", address: "321 Pine Rd, Morristown, NJ", project_type: "Home Addition", status: "materials_ordered", estimated_budget: "95000", created_at: new Date().toISOString() },
      ];
      setProjects(demoProjects);
      setLoading(false);
      return;
    }

    fetchProjects();

    const channel = supabase
      .channel("contractor-projects-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contractor_projects",
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDemoMode]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("contractor_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const mappedData = (data || []).map(project => ({
        id: project.id,
        homeowner_name: project.client_name,
        homeowner_email: project.client_name,
        homeowner_phone: "",
        address: project.location,
        city: null,
        state: null,
        project_type: project.project_type,
        status: project.status,
        estimated_budget: project.estimated_value?.toString() || null,
        permit_status: null,
        materials_status: null,
        target_start_date: project.deadline,
        created_at: project.created_at,
      }));
      
      setProjects(mappedData);
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load coordinator pipeline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      project.homeowner_name?.toLowerCase().includes(query) ||
      project.homeowner_email?.toLowerCase().includes(query) ||
      project.project_type?.toLowerCase().includes(query) ||
      project.address?.toLowerCase().includes(query) ||
      project.city?.toLowerCase().includes(query);

    const matchesStage = !selectedStage || project.status === selectedStage;

    return matchesSearch && matchesStage;
  });

  const funnelStages = [
    {
      name: "Kickoff Needed",
      status: "pc_kickoff_needed",
      count: projects.filter((p) => p.status === "pc_kickoff_needed").length,
      color: statusColors.pc_kickoff_needed,
    },
    {
      name: "Kickoff Scheduled",
      status: "pc_kickoff_scheduled",
      count: projects.filter((p) => p.status === "pc_kickoff_scheduled").length,
      color: statusColors.pc_kickoff_scheduled,
    },
    {
      name: "Selections Meeting",
      status: "selections_meeting",
      count: projects.filter((p) => p.status === "selections_meeting").length,
      color: statusColors.selections_meeting,
    },
    {
      name: "Scope Locked",
      status: "scope_locked",
      count: projects.filter((p) => p.status === "scope_locked").length,
      color: statusColors.scope_locked,
    },
    {
      name: "Permit Prep",
      status: "permit_prep",
      count: projects.filter((p) => p.status === "permit_prep").length,
      color: statusColors.permit_prep,
    },
    {
      name: "Permit Submitted",
      status: "permit_submitted",
      count: projects.filter((p) => p.status === "permit_submitted").length,
      color: statusColors.permit_submitted,
    },
    {
      name: "Permit Approved",
      status: "permit_approved",
      count: projects.filter((p) => p.status === "permit_approved").length,
      color: statusColors.permit_approved,
    },
    {
      name: "Materials Ordered",
      status: "materials_ordered",
      count: projects.filter((p) => p.status === "materials_ordered").length,
      color: statusColors.materials_ordered,
    },
    {
      name: "Schedule Locked",
      status: "schedule_locked",
      count: projects.filter((p) => p.status === "schedule_locked").length,
      color: statusColors.schedule_locked,
    },
    {
      name: "In Production",
      status: "in_production",
      count: projects.filter((p) => p.status === "in_production").length,
      color: statusColors.in_production,
    },
    {
      name: "Punch List",
      status: "punch_list",
      count: projects.filter((p) => p.status === "punch_list").length,
      color: statusColors.punch_list,
    },
    {
      name: "Complete",
      status: "complete",
      count: projects.filter((p) => p.status === "complete").length,
      color: statusColors.complete,
    },
  ];

  const onHoldProjects = projects.filter((p) => p.status === "on_hold");
  const cancelledProjects = projects.filter((p) => p.status === "cancelled");

  const handleStageClick = (status: string) => {
    setSelectedStage(selectedStage === status ? null : status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const project = event.active.data.current?.project as Project | undefined;
    if (project) {
      setActiveDragProject(project);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragProject(null);

    if (!over) return;

    const projectId = active.id as string;
    const newStatus = over.id as string;
    const currentProject = active.data.current?.project as Project | undefined;
    const currentStatus = active.data.current?.currentStatus as string | undefined;

    if (!currentProject || newStatus === currentStatus) return;

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );

    try {
      const { error } = await supabase
        .from("contractor_projects")
        .update({ status: newStatus })
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Stage updated",
        description: `${currentProject.homeowner_name} moved to ${
          funnelStages.find((s) => s.status === newStatus)?.name ?? newStatus
        }`,
      });
    } catch (error: any) {
      console.error("Error updating project status:", error);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: currentStatus || p.status } : p))
      );
      toast({
        title: "Error",
        description: "Failed to update project stage. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Coordinator Pipeline</h1>
            <p className="text-muted-foreground">
              Everything after the bid is accepted: homeowner meetings, selections, permits,
              materials, and production handoff.
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Stage Timeouts
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Coordinator Stage Timeout Configuration</DialogTitle>
                </DialogHeader>
                <StageTimeoutSettings />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <>
              <SalesFunnel
                stages={funnelStages}
                selectedStage={selectedStage}
                onStageClick={handleStageClick}
                leads={projects as any}
              />

              <div className="flex gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects or homeowners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={selectedStage || "all"}
                  onValueChange={(value) => setSelectedStage(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[240px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="pc_kickoff_needed">Kickoff Needed</SelectItem>
                    <SelectItem value="pc_kickoff_scheduled">Kickoff Scheduled</SelectItem>
                    <SelectItem value="selections_meeting">Selections Meeting</SelectItem>
                    <SelectItem value="scope_locked">Scope Locked</SelectItem>
                    <SelectItem value="permit_prep">Permit Prep</SelectItem>
                    <SelectItem value="permit_submitted">Permit Submitted</SelectItem>
                    <SelectItem value="permit_approved">Permit Approved</SelectItem>
                    <SelectItem value="materials_ordered">Materials Ordered</SelectItem>
                    <SelectItem value="schedule_locked">Schedule Locked</SelectItem>
                    <SelectItem value="in_production">In Production</SelectItem>
                    <SelectItem value="punch_list">Punch List</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(onHoldProjects.length > 0 || cancelledProjects.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {onHoldProjects.length > 0 && (
                    <Card className="border-l-4 border-l-[hsl(40,70%,60%)]">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-[hsl(40,70%,60%)]" />
                          On Hold ({onHoldProjects.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {onHoldProjects.map((project) => (
                            <div
                              key={project.id}
                              className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                              onClick={() => navigate(`/coordinator/project/${project.id}`)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{project.homeowner_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {project.project_type}
                                  </p>
                                </div>
                                <Badge variant="outline" className="gap-1">
                                  <div className="h-2 w-2 rounded-full bg-[hsl(40,70%,60%)]" />
                                  On Hold
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {cancelledProjects.length > 0 && (
                    <Card className="border-l-4 border-l-[hsl(0,70%,50%)]">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-[hsl(0,70%,50%)]" />
                          Cancelled ({cancelledProjects.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {cancelledProjects.map((project) => (
                            <div
                              key={project.id}
                              className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                              onClick={() => navigate(`/coordinator/project/${project.id}`)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{project.homeowner_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {project.project_type}
                                  </p>
                                </div>
                                <Badge variant="outline" className="gap-1">
                                  <div className="h-2 w-2 rounded-full bg-[hsl(0,70%,50%)]" />
                                  Cancelled
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">
                    Active Projects ({filteredProjects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        No projects found for this filter.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Homeowner</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Permits</TableHead>
                          <TableHead>Materials</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead>Target Start</TableHead>
                          <TableHead className="text-right">Coordinator Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProjects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <div className="rounded-full h-10 w-10 bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {project.homeowner_name}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    {project.homeowner_email}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {project.homeowner_phone}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>{project.project_type}</TableCell>

                            <TableCell>
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <div>{project.address}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {[project.city, project.state].filter(Boolean).join(", ")}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="font-medium">
                              {project.estimated_budget || "TBD"}
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className="gap-1 text-xs">
                                <FileText className="h-3 w-3" />
                                {project.permit_status || "Not started"}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Package className="h-3 w-3" />
                                {project.materials_status || "Not ordered"}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="gap-1"
                                style={{
                                  borderLeftColor: statusColors[project.status],
                                  borderLeftWidth: "3px",
                                }}
                              >
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      statusColors[project.status] || "hsl(0,0%,60%)",
                                  }}
                                />
                                {project.status
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {project.target_start_date
                                  ? new Date(project.target_start_date).toLocaleDateString()
                                  : "Not set"}
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(
                                      `/coordinator/project/${project.id}/homeowner-meeting`
                                    )
                                  }
                                >
                                  <CalendarClock className="h-4 w-4 mr-1" />
                                  Kickoff / Meeting
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(
                                      `/coordinator/project/${project.id}/materials`
                                    )
                                  }
                                >
                                  <Package className="h-4 w-4 mr-1" />
                                  Materials
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(`/coordinator/project/${project.id}/permits`)
                                  }
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Permits
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(
                                      `/coordinator/project/${project.id}/schedule`
                                    )
                                  }
                                >
                                  <ClipboardList className="h-4 w-4 mr-1" />
                                  Schedule
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    navigate(`/coordinator/project/${project.id}`)
                                  }
                                >
                                  View Timeline
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
            </>

            <DragOverlay>
              {activeDragProject ? (
                <div className="rounded-lg border bg-background px-4 py-3 shadow-lg min-w-[260px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {activeDragProject.homeowner_name}
                    </span>
                    <Badge
                      variant="secondary"
                      style={{
                        borderLeftColor: statusColors[activeDragProject.status],
                        borderLeftWidth: "3px",
                      }}
                    >
                      {activeDragProject.project_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {activeDragProject.address}
                      {activeDragProject.city ? `, ${activeDragProject.city}` : ""}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* AI Copilot */}
      <PortalCopilot role="coordinator" />
    </ContractorLayout>
  );
}
