import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, RefreshCw, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface ArchitectAssignment {
  id: string;
  architect_id: string;
  project_id: string;
  created_at: string;
  architect_name: string | null;
  project_name: string;
  project_location: string;
  project_status: string;
  proposal_count: number;
}

interface Architect {
  id: string;
  full_name: string | null;
}

export default function AdminArchitectAssignments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<ArchitectAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<ArchitectAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedArchitects, setSelectedArchitects] = useState<Set<string>>(new Set());
  const [bulkAssigning, setBulkAssigning] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchAssignments();
  }, []);

  useEffect(() => {
    const filtered = assignments.filter(a =>
      a.architect_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.project_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAssignments(filtered);
  }, [searchTerm, assignments]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("architect_projects")
        .select(`
          id,
          architect_id,
          project_name,
          location,
          status,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const architectIds = [...new Set(data?.map(ap => ap.architect_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", architectIds);

      const { data: proposals } = await supabase
        .from("architect_proposals")
        .select("project_id");

      const proposalCounts = proposals?.reduce((acc, p) => {
        acc[p.project_id] = (acc[p.project_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const enriched: ArchitectAssignment[] = (data || []).map((project: any) => ({
        id: project.id,
        architect_id: project.architect_id,
        project_id: project.id,
        created_at: project.created_at,
        architect_name: profiles?.find(p => p.id === project.architect_id)?.full_name || null,
        project_name: project.project_name,
        project_location: project.location,
        project_status: project.status,
        proposal_count: proposalCounts[project.id] || 0,
      }));

      setAssignments(enriched);
      setFilteredAssignments(enriched);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsAndArchitects = async () => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "architect");

      const architectIds = roles?.map(r => r.user_id) || [];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", architectIds);

      const architectList: Architect[] = (profilesData || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
      }));

      setArchitects(architectList);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load architects",
        variant: "destructive",
      });
    }
  };

  const handleBulkAssign = async () => {
    if (selectedArchitects.size === 0) {
      toast({
        title: "Missing Selection",
        description: "Please select at least one architect",
        variant: "destructive",
      });
      return;
    }

    setBulkAssigning(true);
    try {
      const newProjects = Array.from(selectedArchitects).map(architectId => ({
        architect_id: architectId,
        project_name: "New Project",
        client_name: "Pending",
        location: "TBD",
        project_type: "residential",
        status: "new",
      }));

      const { error } = await supabase
        .from("architect_projects")
        .insert(newProjects);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Created ${selectedArchitects.size} new project(s)`,
      });

      setBulkDialogOpen(false);
      setSelectedProject("");
      setSelectedArchitects(new Set());
      fetchAssignments();
    } catch (error: any) {
      console.error("Error bulk assigning:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create projects",
        variant: "destructive",
      });
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleDeleteAssignments = async () => {
    if (selectedAssignments.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select projects to delete",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Delete ${selectedAssignments.size} project(s)?`)) return;

    try {
      const { error } = await supabase
        .from("architect_projects")
        .delete()
        .in("id", Array.from(selectedAssignments));

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Deleted ${selectedAssignments.size} project(s)`,
      });
      setSelectedAssignments(new Set());
      fetchAssignments();
    } catch (error: any) {
      console.error("Error deleting projects:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete projects",
        variant: "destructive",
      });
    }
  };

  const toggleAssignment = (id: string) => {
    const newSet = new Set(selectedAssignments);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAssignments(newSet);
  };

  const toggleAllAssignments = () => {
    if (selectedAssignments.size === filteredAssignments.length) {
      setSelectedAssignments(new Set());
    } else {
      setSelectedAssignments(new Set(filteredAssignments.map(a => a.id)));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Architect Project Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Manage architect projects and proposals
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAssignments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={fetchProjectsAndArchitects}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign New Projects
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Projects for Architects</DialogTitle>
                <DialogDescription>
                  Select architects to create new projects for
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Select Architects ({selectedArchitects.size} selected)</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2 mt-2">
                    {architects.map(a => (
                      <div key={a.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedArchitects.has(a.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedArchitects);
                            if (checked) {
                              newSet.add(a.id);
                            } else {
                              newSet.delete(a.id);
                            }
                            setSelectedArchitects(newSet);
                          }}
                        />
                        <span className="text-sm">
                          {a.full_name || a.id.substring(0, 8)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleBulkAssign}
                  disabled={selectedArchitects.size === 0 || bulkAssigning}
                  className="w-full"
                >
                  {bulkAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    `Create ${selectedArchitects.size} Project(s)`
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects ({filteredAssignments.length})</CardTitle>
              <CardDescription>
                {selectedAssignments.size > 0 && `${selectedAssignments.size} selected`}
              </CardDescription>
            </div>
            {selectedAssignments.size > 0 && (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleDeleteAssignments}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedAssignments.size})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by architect or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">
                    <Checkbox
                      checked={selectedAssignments.size === filteredAssignments.length && filteredAssignments.length > 0}
                      onCheckedChange={toggleAllAssignments}
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium">Architect</th>
                  <th className="p-3 text-left text-sm font-medium">Project</th>
                  <th className="p-3 text-left text-sm font-medium">Location</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-left text-sm font-medium">Proposals</th>
                  <th className="p-3 text-left text-sm font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="border-t hover:bg-muted/50">
                    <td className="p-3">
                      <Checkbox
                        checked={selectedAssignments.has(assignment.id)}
                        onCheckedChange={() => toggleAssignment(assignment.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium">
                        {assignment.architect_name || "Unknown"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{assignment.project_name}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-muted-foreground">
                        {assignment.project_location}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={
                        assignment.project_status === "active" ? "default" :
                        assignment.project_status === "completed" ? "secondary" :
                        "outline"
                      }>
                        {assignment.project_status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {assignment.proposal_count}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(assignment.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
