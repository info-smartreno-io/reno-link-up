import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, MapPin, DollarSign, Calendar, Search, FileSignature, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import AssignHomeownerDialog from "@/components/AssignHomeownerDialog";
import ProjectMessaging from "@/components/ProjectMessaging";
import { ProjectInvoiceButton } from "@/components/projects/ProjectInvoiceButton";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoProjects } from "@/utils/demoContractorData";

interface ContractorProject {
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

export default function ContractorProjects() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ContractorProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ContractorProject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<ContractorProject | null>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidTimeline, setBidTimeline] = useState("");
  const [bidNotes, setBidNotes] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      const demoData = getDemoProjects().map(p => ({
        id: p.id,
        project_name: p.name,
        client_name: p.client_name,
        location: p.address,
        project_type: p.project_type,
        description: `${p.project_type} project for ${p.client_name}`,
        status: p.status === "planning" ? "new" : p.status,
        estimated_value: p.amount,
        square_footage: null,
        deadline: p.estimated_completion,
        created_at: p.start_date,
      }));
      setProjects(demoData);
      setFilteredProjects(demoData);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isDemoMode]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user || isDemoMode) return;

      try {
        const { data, error } = await supabase
          .from('contractor_projects')
          .select('*')
          .eq('contractor_id', user.id)
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
  }, [user, toast, isDemoMode]);

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
    const variants: Record<string, { bg: string; text: string }> = {
      new: { bg: "bg-info-muted", text: "text-info" },
      in_progress: { bg: "bg-warning-muted", text: "text-warning" },
      completed: { bg: "bg-success-muted", text: "text-success" },
      on_hold: { bg: "bg-muted", text: "text-muted-foreground" },
    };
    const variant = variants[status] || variants.new;
    return `${variant.bg} ${variant.text}`;
  };

  const handleSubmitBid = async () => {
    if (!selectedProject || !user || !bidAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmittingBid(true);
    try {
      const { error } = await supabase.from('contractor_bids').insert({
        contractor_id: user.id,
        project_id: selectedProject.id,
        bid_amount: parseFloat(bidAmount),
        notes: bidNotes || null,
        status: 'submitted'
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your bid has been submitted successfully",
      });

      setBidDialogOpen(false);
      setBidAmount("");
      setBidTimeline("");
      setBidNotes("");
      navigate('/contractor/bids');
    } catch (error: any) {
      console.error("Error submitting bid:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit bid",
        variant: "destructive",
      });
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="min-h-screen bg-background -m-6">
        <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contractor/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {selectedProject ? (
          // Project Detail View
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h1 className="text-3xl font-bold">{selectedProject.project_name}</h1>
              <div className="flex flex-wrap gap-2">
                <ProjectInvoiceButton
                  projectId={selectedProject.id}
                  projectName={selectedProject.project_name}
                  clientName={selectedProject.client_name}
                  clientAddress={selectedProject.location}
                  estimatedValue={selectedProject.estimated_value}
                />
                <Button
                  variant="outline"
                  onClick={() => navigate(`/finance/contract/new?projectId=${selectedProject.id}`)}
                >
                  <FileSignature className="h-4 w-4 mr-2" />
                  Create Contract
                </Button>
                <AssignHomeownerDialog 
                  projectId={selectedProject.id}
                  projectName={selectedProject.project_name}
                />
                <Button variant="outline" onClick={() => setSelectedProject(null)}>
                  Back to List
                </Button>
              </div>
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
                    <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          Submit Bid
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Submit Your Bid</DialogTitle>
                          <DialogDescription>
                            Submit your proposal for {selectedProject.project_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="bidAmount">
                              Bid Amount <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="bidAmount"
                                type="number"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                className="pl-10"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bidTimeline">Estimated Timeline</Label>
                            <Input
                              id="bidTimeline"
                              type="text"
                              value={bidTimeline}
                              onChange={(e) => setBidTimeline(e.target.value)}
                              placeholder="e.g., 6-8 weeks"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bidNotes">Project Notes</Label>
                            <Textarea
                              id="bidNotes"
                              value={bidNotes}
                              onChange={(e) => setBidNotes(e.target.value)}
                              placeholder="Add any relevant details about your proposal, approach, materials, etc..."
                              rows={6}
                            />
                          </div>

                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <strong>Project:</strong> {selectedProject.project_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Client:</strong> {selectedProject.client_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Location:</strong> {selectedProject.location}
                            </p>
                          </div>

                          <Button 
                            onClick={handleSubmitBid} 
                            className="w-full"
                            disabled={!bidAmount || submittingBid}
                          >
                            {submittingBid ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Bid"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          // Projects List View
          <div>
            <h1 className="text-3xl font-bold mb-6">Projects for you</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by homeowner name or project type..."
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {project.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">
                          ${project.estimated_value ? `${project.estimated_value.toLocaleString()}` : "TBD"}
                        </span>
                      </div>
                      {project.deadline && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Due: {new Date(project.deadline).toLocaleDateString()}
                        </div>
                      )}
                      <Button variant="outline" className="w-full mt-4" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      }}>
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
    </ContractorLayout>
  );
}
