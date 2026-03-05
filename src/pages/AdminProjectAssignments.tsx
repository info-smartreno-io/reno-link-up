import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Mail, Trash2, RefreshCw, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { QAPanel } from "@/components/admin/QAPanel";

interface HomeownerProject {
  id: string;
  homeowner_id: string;
  project_id: string;
  created_at: string;
  homeowner_name: string | null;
  homeowner_email: string;
  project_name: string;
  project_location: string;
  project_status: string;
}

interface Project {
  id: string;
  project_name: string;
  location: string;
  status: string;
}

interface Homeowner {
  id: string;
  email: string;
  full_name: string | null;
}

export default function AdminProjectAssignments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<HomeownerProject[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<HomeownerProject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [sendingEmails, setSendingEmails] = useState(false);
  
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [homeowners, setHomeowners] = useState<Homeowner[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedHomeowners, setSelectedHomeowners] = useState<Set<string>>(new Set());
  const [bulkAssigning, setBulkAssigning] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchAssignments();
  }, []);

  useEffect(() => {
    const filtered = assignments.filter(a =>
      a.homeowner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.homeowner_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        .from("homeowner_projects")
        .select(`
          id,
          homeowner_id,
          project_id,
          created_at,
          contractor_projects (
            project_name,
            location,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const homeownerIds = [...new Set(data?.map(hp => hp.homeowner_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", homeownerIds);

      const enriched: HomeownerProject[] = (data || []).map((assignment: any) => ({
        id: assignment.id,
        homeowner_id: assignment.homeowner_id,
        project_id: assignment.project_id,
        created_at: assignment.created_at,
        homeowner_name: profiles?.find(p => p.id === assignment.homeowner_id)?.full_name || null,
        homeowner_email: assignment.homeowner_id,
        project_name: assignment.contractor_projects?.project_name || "Unknown Project",
        project_location: assignment.contractor_projects?.location || "",
        project_status: assignment.contractor_projects?.status || "",
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

  const fetchProjectsAndHomeowners = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from("contractor_projects")
        .select("id, project_name, location, status")
        .order("created_at", { ascending: false })
        .limit(100);

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "homeowner");

      const homeownerIds = roles?.map(r => r.user_id) || [];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", homeownerIds);

      const homeownerList: Homeowner[] = (profilesData || []).map(p => ({
        id: p.id,
        email: p.id.substring(0, 8),
        full_name: p.full_name,
      }));

      setHomeowners(homeownerList);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load projects and homeowners",
        variant: "destructive",
      });
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedProject || selectedHomeowners.size === 0) {
      toast({
        title: "Missing Selection",
        description: "Please select a project and at least one homeowner",
        variant: "destructive",
      });
      return;
    }

    setBulkAssigning(true);
    try {
      const assignments = Array.from(selectedHomeowners).map(homeownerId => ({
        homeowner_id: homeownerId,
        project_id: selectedProject,
      }));

      const { error } = await supabase
        .from("homeowner_projects")
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Assigned ${selectedHomeowners.size} homeowner(s) to the project`,
      });

      setBulkDialogOpen(false);
      setSelectedProject("");
      setSelectedHomeowners(new Set());
      fetchAssignments();
    } catch (error: any) {
      console.error("Error bulk assigning:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign homeowners",
        variant: "destructive",
      });
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleSendInvitations = async () => {
    if (selectedAssignments.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select assignments to send invitations",
        variant: "destructive",
      });
      return;
    }

    setSendingEmails(true);
    try {
      const selectedData = assignments.filter(a => selectedAssignments.has(a.id));
      
      for (const assignment of selectedData) {
        await supabase.functions.invoke("send-homeowner-invitation", {
          body: {
            homeowner_id: assignment.homeowner_id,
            project_id: assignment.project_id,
            project_name: assignment.project_name,
          },
        });
      }

      toast({
        title: "Success!",
        description: `Sent ${selectedAssignments.size} invitation email(s)`,
      });
      setSelectedAssignments(new Set());
    } catch (error: any) {
      console.error("Error sending invitations:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send some invitations",
        variant: "destructive",
      });
    } finally {
      setSendingEmails(false);
    }
  };

  const handleDeleteAssignments = async () => {
    if (selectedAssignments.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select assignments to delete",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Delete ${selectedAssignments.size} assignment(s)?`)) return;

    try {
      const { error } = await supabase
        .from("homeowner_projects")
        .delete()
        .in("id", Array.from(selectedAssignments));

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Deleted ${selectedAssignments.size} assignment(s)`,
      });
      setSelectedAssignments(new Set());
      fetchAssignments();
    } catch (error: any) {
      console.error("Error deleting assignments:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete assignments",
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
          <h1 className="text-3xl font-bold">Homeowner-Project Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Manage which homeowners can view which projects
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAssignments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={fetchProjectsAndHomeowners}>
                <UserPlus className="h-4 w-4 mr-2" />
                Bulk Assign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Assign Homeowners to Project</DialogTitle>
                <DialogDescription>
                  Select a project and choose homeowners to assign to it
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Select Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.project_name} - {p.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Select Homeowners ({selectedHomeowners.size} selected)</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2 mt-2">
                    {homeowners.map(h => (
                      <div key={h.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedHomeowners.has(h.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedHomeowners);
                            if (checked) {
                              newSet.add(h.id);
                            } else {
                              newSet.delete(h.id);
                            }
                            setSelectedHomeowners(newSet);
                          }}
                        />
                        <span className="text-sm">
                          {h.full_name || h.id.substring(0, 8)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleBulkAssign}
                  disabled={!selectedProject || selectedHomeowners.size === 0 || bulkAssigning}
                  className="w-full"
                >
                  {bulkAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    `Assign ${selectedHomeowners.size} Homeowner(s)`
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
              <CardTitle>Assignments ({filteredAssignments.length})</CardTitle>
              <CardDescription>
                {selectedAssignments.size > 0 && `${selectedAssignments.size} selected`}
              </CardDescription>
            </div>
            {selectedAssignments.size > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSendInvitations} disabled={sendingEmails}>
                  {sendingEmails ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Invites ({selectedAssignments.size})
                </Button>
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
                placeholder="Search by homeowner or project..."
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
                  <th className="p-3 text-left text-sm font-medium">Homeowner</th>
                  <th className="p-3 text-left text-sm font-medium">Project</th>
                  <th className="p-3 text-left text-sm font-medium">Location</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-left text-sm font-medium">Assigned</th>
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
                        {assignment.homeowner_name || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {assignment.homeowner_email.substring(0, 8)}...
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
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(assignment.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No assignments found
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
