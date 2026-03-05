import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoProjects } from "@/utils/demoContractorData";

interface Project {
  id: string;
  project_name: string;
  project_type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  description: string;
  budget_range_min: number;
  budget_range_max: number;
  workflow_status: string;
  created_at: string;
  contractor_assigned_at: string;
  project_start_date: string | null;
  project_completion_date: string | null;
}

export default function ContractorProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      // Use demo data
      const demoProjects = getDemoProjects().map(p => ({
        id: p.id,
        project_name: p.name,
        project_type: p.project_type,
        address: p.address,
        city: p.address.split(',')[1]?.trim() || '',
        state: 'NJ',
        zip_code: '',
        description: `${p.project_type} project - ${p.client_name}`,
        budget_range_min: p.amount,
        budget_range_max: p.amount,
        workflow_status: p.status,
        created_at: p.start_date,
        contractor_assigned_at: p.start_date,
        project_start_date: p.start_date,
        project_completion_date: p.status === 'completed' ? p.estimated_completion : null,
      }));
      setProjects(demoProjects);
      setLoading(false);
      return;
    }
    fetchProjects();
  }, [isDemoMode]);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/contractor/auth");
        return;
      }

      // Query contractor_projects table directly
      const result = await supabase
        .from('contractor_projects')
        .select('*')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;

      const projectsData: Project[] = (result.data || []).map((item: any) => ({
        id: item.id,
        project_name: item.project_name || '',
        project_type: item.project_type || '',
        address: item.location || '',
        city: '',
        state: '',
        zip_code: '',
        description: item.description || '',
        budget_range_min: item.estimated_value || 0,
        budget_range_max: item.estimated_value || 0,
        workflow_status: item.status || 'new',
        created_at: item.created_at || '',
        contractor_assigned_at: item.created_at || '',
        project_start_date: null,
        project_completion_date: null,
      }));

      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProjectsByStatus = (status: string) => {
    switch (status) {
      case "upcoming":
        return projects.filter(p => 
          p.workflow_status === 'new' || 
          p.workflow_status === 'planning' ||
          p.workflow_status === 'pending'
        );
      case "in_progress":
        return projects.filter(p => 
          p.workflow_status === 'in_progress' || 
          p.workflow_status === 'active'
        );
      case "completed":
        return projects.filter(p => 
          p.workflow_status === 'completed' || 
          p.workflow_status === 'done'
        );
      case "closed":
        return projects.filter(p => 
          p.workflow_status === 'closed' || 
          p.workflow_status === 'cancelled' ||
          p.workflow_status === 'on_hold'
        );
      default:
        return [];
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "New", variant: "default" },
      planning: { label: "Planning", variant: "default" },
      pending: { label: "Pending", variant: "secondary" },
      in_progress: { label: "In Progress", variant: "secondary" },
      active: { label: "Active", variant: "secondary" },
      completed: { label: "Completed", variant: "outline" },
      done: { label: "Done", variant: "outline" },
      closed: { label: "Closed", variant: "outline" },
      cancelled: { label: "Cancelled", variant: "destructive" },
      on_hold: { label: "On Hold", variant: "destructive" },
    };

    const badge = badges[status] || { label: status, variant: "outline" as const };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">Loading projects...</div>
          </div>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">Manage your construction projects</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upcoming">
                Upcoming ({getProjectsByStatus("upcoming").length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress ({getProjectsByStatus("in_progress").length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({getProjectsByStatus("completed").length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed ({getProjectsByStatus("closed").length})
              </TabsTrigger>
            </TabsList>

            {["upcoming", "in_progress", "completed", "closed"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {getProjectsByStatus(tab).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No projects in this category</p>
                    </CardContent>
                  </Card>
                ) : (
                  getProjectsByStatus(tab).map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              {project.project_name}
                              {getStatusBadge(project.workflow_status)}
                            </CardTitle>
                            <CardDescription>{project.project_type}</CardDescription>
                          </div>
                          <Button onClick={() => navigate(`/contractor/project/${project.id}`)}>
                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{project.city}, {project.state} {project.zip_code}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>
                              ${project.budget_range_min?.toLocaleString()} - ${project.budget_range_max?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Assigned {formatDistanceToNow(new Date(project.contractor_assigned_at), { addSuffix: true })}
                            </span>
                          </div>
                          {project.project_completion_date && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </ContractorLayout>
  );
}
