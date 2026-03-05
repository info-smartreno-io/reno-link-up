import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, MapPin, DollarSign, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import ProjectMessaging from "@/components/ProjectMessaging";
import { ArchitectMessageNotifications } from "@/components/ArchitectMessageNotifications";
import { BlueprintUploader } from "@/components/architect/BlueprintUploader";

interface ArchitectProject {
  id: string;
  project_name: string;
  client_name: string;
  location: string;
  project_type: string;
  description: string | null;
  status: string;
  estimated_value: number | null;
  square_footage: number | null;
  deadline: string | null;
  created_at: string;
}

export default function ArchitectProjects() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ArchitectProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ArchitectProject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<ArchitectProject | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/architect/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/architect/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('architect_projects')
          .select('*')
          .eq('architect_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setProjects(data || []);
        setFilteredProjects(data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to load projects.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, toast]);

  useEffect(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, projects]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: "bg-blue-100 text-blue-700",
      in_progress: "bg-orange-100 text-orange-700",
      completed: "bg-green-100 text-green-700",
      on_hold: "bg-gray-100 text-gray-700",
    };
    return variants[status] || variants.new;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ArchitectMessageNotifications />
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={smartRenoLogo} alt="SmartReno" className="h-8" />
            <nav className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/dashboard')}>
                Dashboard
              </Button>
              <Button variant="default" size="sm">
                Projects
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/proposals')}>
                Proposals
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/bid-room')}>
                Bid Room
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/messages')}>
                Messages
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/architect/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {selectedProject ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">{selectedProject.project_name}</h1>
              <Button variant="outline" onClick={() => setSelectedProject(null)}>
                Back to List
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                      <p className="mt-1">{selectedProject.description || "No description available"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                        <p className="mt-1 font-medium">{selectedProject.client_name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Project Type</h3>
                        <p className="mt-1">{selectedProject.project_type}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Square Footage</h3>
                        <p className="mt-1">{selectedProject.square_footage ? `${selectedProject.square_footage} sq ft` : "N/A"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Deadline</h3>
                        <p className="mt-1">{selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : "Not set"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ProjectMessaging 
                  projectId={selectedProject.id}
                  projectName={selectedProject.project_name}
                />

                <BlueprintUploader
                  projectId={selectedProject.id}
                  projectName={selectedProject.project_name}
                />
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <Badge className={`mt-1 ${getStatusBadge(selectedProject.status)}`}>
                        {selectedProject.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Estimated Value</h3>
                      <p className="mt-1 text-2xl font-bold">
                        ${selectedProject.estimated_value ? selectedProject.estimated_value.toLocaleString() : "TBD"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                      <p className="mt-1">{selectedProject.location}</p>
                    </div>
                    <Button className="w-full" onClick={() => navigate('/architect/proposals')}>
                      Submit Proposal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold mb-6">Your Projects</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name or project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No projects found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProject(project)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{project.client_name}</CardTitle>
                        <Badge className={getStatusBadge(project.status)}>
                          {project.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <CardDescription>{project.project_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {project.location}
                      </div>
                      {project.estimated_value && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4 mr-2" />
                          ${project.estimated_value.toLocaleString()}
                        </div>
                      )}
                      {project.deadline && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(project.deadline).toLocaleDateString()}
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
