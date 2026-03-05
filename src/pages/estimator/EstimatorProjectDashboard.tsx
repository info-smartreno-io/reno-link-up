import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";

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
  estimator_assigned_at: string;
  visit_completed_at: string | null;
  estimate_ready_at: string | null;
}

export default function EstimatorProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/estimator/auth");
        return;
      }

      // @ts-ignore - Type instantiation issue with Supabase generated types
      const result = await supabase
        .from('projects')
        .select('*')
        .eq('estimator_id', user.id)
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;

      const projectsData: Project[] = (result.data || []).map((item: any) => ({
        id: item.id,
        project_name: item.project_name || '',
        project_type: item.project_type || '',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        zip_code: item.zip_code || '',
        description: item.description || '',
        budget_range_min: item.budget_range_min || 0,
        budget_range_max: item.budget_range_max || 0,
        workflow_status: item.workflow_status || '',
        created_at: item.created_at || '',
        estimator_assigned_at: item.estimator_assigned_at || '',
        visit_completed_at: item.visit_completed_at || null,
        estimate_ready_at: item.estimate_ready_at || null,
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
          p.workflow_status === 'estimator_assigned' || 
          p.workflow_status === 'payment_confirmed'
        );
      case "in_progress":
        return projects.filter(p => 
          p.workflow_status === 'visit_scheduled' || 
          p.workflow_status === 'visit_in_progress'
        );
      case "completed":
        return projects.filter(p => 
          p.workflow_status === 'visit_complete' || 
          p.workflow_status === 'estimate_ready'
        );
      case "accepted":
        return projects.filter(p => 
          p.workflow_status === 'rfp_created' || 
          p.workflow_status === 'contractor_selected'
        );
      default:
        return [];
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      estimator_assigned: { label: "New Assignment", variant: "default" },
      payment_confirmed: { label: "Payment Confirmed", variant: "default" },
      visit_scheduled: { label: "Visit Scheduled", variant: "secondary" },
      visit_in_progress: { label: "In Progress", variant: "secondary" },
      visit_complete: { label: "Visit Complete", variant: "outline" },
      estimate_ready: { label: "Estimate Ready", variant: "outline" },
      rfp_created: { label: "RFP Created", variant: "outline" },
    };

    const badge = badges[status] || { label: status, variant: "outline" as const };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <EstimatorLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">Manage your site visits and estimates</p>
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
              <TabsTrigger value="accepted">
                Accepted ({getProjectsByStatus("accepted").length})
              </TabsTrigger>
            </TabsList>

            {["upcoming", "in_progress", "completed", "accepted"].map((tab) => (
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
                          <Button onClick={() => navigate(`/estimator/project/${project.id}`)}>
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
                              Assigned {formatDistanceToNow(new Date(project.estimator_assigned_at), { addSuffix: true })}
                            </span>
                          </div>
                          {project.visit_completed_at && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Visit completed</span>
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
    </EstimatorLayout>
  );
}