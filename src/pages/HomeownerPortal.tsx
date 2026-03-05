import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Home,
  ClipboardList,
  Calendar,
  FileText,
  MessageSquare,
  CreditCard,
  HelpCircle,
  Plus,
  Upload,
  CheckCircle2,
  ArrowRight,
  Clock,
  Building2,
  Wrench,
  Bath,
  Sofa,
  BrickWall,
  Ruler,
  ShieldCheck,
  LogOut,
  CalendarClock,
  Menu,
  X,
  FolderOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLogout } from "@/hooks/useLogout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProjectMessaging from "@/components/ProjectMessaging";
import { BidComparisonReview } from "@/components/homeowner/BidComparisonReview";
import { HomeownerWarrantyHistory } from "@/components/homeowner/HomeownerWarrantyHistory";
import { WarrantyCoverageChecker } from "@/components/homeowner/WarrantyCoverageChecker";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import SearchBar from "@/components/blog/SearchBar";
import { PortalCopilot } from "@/components/ai/PortalCopilot";

const brand = {
  name: "SmartReno",
  tagline: "Renovations, Simplified.",
};

interface Project {
  id: string;
  project_name: string;
  location: string;
  project_type: string;
  estimated_value: number;
  status: string;
  created_at: string;
  deadline?: string;
  description?: string;
}

interface Milestone {
  id: string;
  milestone_name: string;
  milestone_date: string;
  completed: boolean;
}

export default function HomeownerPortal() {
  const navigate = useNavigate();
  const { logout } = useLogout("/login");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [estimateRequests, setEstimateRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // New project form state
  const [newProject, setNewProject] = useState({
    title: "",
    address: "",
    type: "Kitchen",
    budget: "$25k–$60k",
    description: "",
  });

  useEffect(() => {
    checkUser();
    fetchProjects();
    fetchSchedules();
    fetchEstimateRequests();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setUser(user);

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profileData);
  };

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch projects linked to this homeowner through the homeowner_projects table
      const { data, error } = await supabase
        .from("homeowner_projects")
        .select(`
          id,
          project_id,
          contractor_projects (
            id,
            project_name,
            location,
            project_type,
            estimated_value,
            status,
            created_at,
            deadline,
            description
          )
        `)
        .eq("homeowner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match the Project interface
      const transformedProjects = data?.map((hp: any) => ({
        id: hp.contractor_projects.id,
        project_name: hp.contractor_projects.project_name,
        location: hp.contractor_projects.location,
        project_type: hp.contractor_projects.project_type,
        estimated_value: hp.contractor_projects.estimated_value,
        status: hp.contractor_projects.status,
        created_at: hp.contractor_projects.created_at,
        deadline: hp.contractor_projects.deadline,
        description: hp.contractor_projects.description,
      })) || [];
      
      setProjects(transformedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch schedules shared with this homeowner
      const { data, error } = await supabase
        .from("project_schedules")
        .select(`
          *,
          schedule_tasks (
            id,
            name,
            start_date,
            end_date,
            status,
            workdays
          )
        `)
        .contains("shared_with_homeowners", [user.id])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSchedules(data || []);

      // Set up realtime subscription
      const channel = supabase
        .channel('schedule-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_schedules',
          },
          () => fetchSchedules()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'schedule_tasks',
          },
          () => fetchSchedules()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchEstimateRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("estimate_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEstimateRequests(data || []);
    } catch (error) {
      console.error("Error fetching estimate requests:", error);
    }
  };


  const handleCreateProject = async () => {
    if (!newProject.title || !newProject.address) {
      toast.error("Please fill in project title and address");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For now, we'll create a lead which can be converted to a project
      const { error } = await supabase.from("leads").insert({
        name: profile?.full_name || user.email,
        email: user.email,
        phone: profile?.phone || "",
        location: newProject.address,
        project_type: newProject.type,
        estimated_budget: newProject.budget,
        client_notes: newProject.description,
        status: "new",
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Project request submitted! We'll contact you soon.");
      setNewProject({
        title: "",
        address: "",
        type: "Kitchen",
        budget: "$25k–$60k",
        description: "",
      });
      setActiveTab("projects");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    }
  };

  const Overview = () => {
    const activeProject = projects[0];
    const activeSchedule = schedules[0];

    return (
      <div className="grid gap-4 sm:gap-6">
        {/* Mobile Page Title */}
        <div className="lg:hidden">
          <h2 className="text-2xl font-bold">Overview</h2>
          <p className="text-sm text-muted-foreground">Your project dashboard</p>
        </div>
        {/* Project Schedules Section */}
        {schedules.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  Project Schedule
                </CardTitle>
                <Badge variant="secondary">
                  {schedules.length} {schedules.length === 1 ? "Schedule" : "Schedules"}
                </Badge>
              </div>
              <CardDescription>
                View your project timeline and upcoming tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.map((schedule: any) => {
                const totalTasks = schedule.schedule_tasks?.length || 0;
                const completedTasks = schedule.schedule_tasks?.filter((t: any) => t.status === "completed").length || 0;
                const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                return (
                  <div key={schedule.id} className="space-y-3 sm:space-y-4 border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base sm:text-lg">{schedule.project_name}</h4>
                        {schedule.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{schedule.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {new Date(schedule.start_date).toLocaleDateString()}
                              {schedule.end_date && ` - ${new Date(schedule.end_date).toLocaleDateString()}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {completedTasks} of {totalTasks} tasks completed
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Upcoming Tasks */}
                    {schedule.schedule_tasks && schedule.schedule_tasks.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Upcoming Tasks</h5>
                        <div className="space-y-2">
                          {schedule.schedule_tasks
                            .filter((task: any) => task.status !== "completed")
                            .slice(0, 3)
                            .map((task: any) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-3 p-2 rounded-md bg-muted/30"
                              >
                                <div className={`h-2 w-2 rounded-full ${
                                  task.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                                }`} />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{task.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(task.start_date).toLocaleDateString()} - {new Date(task.end_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant={task.status === "in_progress" ? "default" : "secondary"}>
                                  {task.status === "in_progress" ? "In Progress" : "Pending"}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Estimate Requests */}
        {estimateRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Estimate Requests
              </CardTitle>
              <CardDescription>Track the status of your estimate requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {estimateRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <h5 className="font-semibold">{request.project_type}</h5>
                      <p className="text-sm text-muted-foreground">{request.address}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={request.status === "pending" ? "secondary" : request.status === "scheduled" ? "default" : "outline"}>
                      {request.status}
                    </Badge>
                  </div>
                  {request.message && (
                    <p className="text-sm text-muted-foreground border-t pt-2">
                      {request.message}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Existing Project Overview */}
        <div className="mb-6 max-w-2xl">
          <SearchBar />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Welcome back, {profile?.full_name || user?.email} 👋</CardTitle>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Powered by {brand.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Current Project</div>
                      <div className="font-medium">{activeProject?.project_name || "No active project"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">{activeProject?.location || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="font-medium capitalize">{activeProject?.status || "—"}</div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Type</div>
                      <div className="font-medium">{activeProject?.project_type || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Project Status</div>
                      <div className="font-medium text-sm sm:text-base truncate capitalize">
                        {activeProject?.status || "Not started"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm text-muted-foreground">Payment Progress</div>
                      <div className="font-medium text-sm sm:text-base truncate">
                        {activeProject?.estimated_value ? `$${activeProject.estimated_value.toLocaleString()}` : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:gap-3">
              <Button onClick={() => setActiveTab("start")} className="w-full justify-start text-sm sm:text-base">
                <Plus className="h-4 w-4 mr-2" /> Start a Project
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm sm:text-base" onClick={() => navigate("/homeowner/appointments")}>
                <CalendarClock className="h-4 w-4 mr-2" /> Request Site Visit
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm sm:text-base" onClick={() => navigate("/homeowner/warranty-claim")}>
                <ShieldCheck className="h-4 w-4 mr-2" /> Submit Warranty Claim
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm sm:text-base" onClick={() => navigate("/homeowner/files")}>
                <FolderOpen className="h-4 w-4 mr-2" /> View Project Files
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
                <MessageSquare className="h-4 w-4 mr-2" /> Message Support
              </Button>
              <a className="text-xs sm:text-sm text-primary hover:underline px-1" href="/blog">
                Read Remodeling Guides →
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const StartProject = () => {
    return (
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Mobile Page Title */}
        <div className="lg:hidden lg:col-span-3">
          <h2 className="text-2xl font-bold">Start a Project</h2>
          <p className="text-sm text-muted-foreground">Tell us about your renovation project</p>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-lg sm:text-xl">Get an Estimate</CardTitle>
              <Badge variant="secondary" className="self-start sm:self-center">Step 1 of 3</Badge>
            </div>
            <CardDescription className="text-sm">Tell us about your project and we'll get you started</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 md:col-span-1">
                <Label>Project Title</Label>
                <Input
                  placeholder="e.g., Sunny Kitchen Remodel"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Project Address</Label>
                <Input
                  placeholder="Street, City, State"
                  value={newProject.address}
                  onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Project Type</Label>
                <Select value={newProject.type} onValueChange={(value) => setNewProject({ ...newProject, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kitchen">Kitchen</SelectItem>
                    <SelectItem value="Bathroom">Bathroom</SelectItem>
                    <SelectItem value="Basement">Basement</SelectItem>
                    <SelectItem value="Addition">Addition</SelectItem>
                    <SelectItem value="Interior">Interior</SelectItem>
                    <SelectItem value="Exterior">Exterior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget Range</Label>
                <Select value={newProject.budget} onValueChange={(value) => setNewProject({ ...newProject, budget: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$10k–$25k">$10k–$25k</SelectItem>
                    <SelectItem value="$25k–$60k">$25k–$60k</SelectItem>
                    <SelectItem value="$60k–$120k">$60k–$120k</SelectItem>
                    <SelectItem value="$120k–$250k">$120k–$250k</SelectItem>
                    <SelectItem value="$250k+">$250k+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Describe your project</Label>
              <Textarea
                placeholder="What are you planning? Include measurements or details if you have them."
                rows={4}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted p-4">
              <div>
                <div className="text-sm text-muted-foreground">Ready to get started?</div>
                <div className="text-lg font-semibold">Submit your project request</div>
              </div>
              <Button onClick={handleCreateProject}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Licensed & vetted contractors
              </div>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Accurate measuring software
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Project Types</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center gap-3">
              <Wrench className="h-4 w-4" />
              Kitchens
            </div>
            <div className="flex items-center gap-3">
              <Bath className="h-4 w-4" />
              Bathrooms
            </div>
            <div className="flex items-center gap-3">
              <Sofa className="h-4 w-4" />
              Basements
            </div>
            <div className="flex items-center gap-3">
              <BrickWall className="h-4 w-4" />
              Additions
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const MyProjects = () => {
    return (
      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No projects yet. Start your first project to get started!</p>
              <Button onClick={() => setActiveTab("start")} className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Start a Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          projects.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.project_name}</CardTitle>
                  <Badge variant={p.status === "in_progress" ? "default" : "secondary"}>{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Type</div>
                    <div className="font-medium">{p.project_type}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Budget</div>
                    <div className="font-medium">${p.estimated_value?.toLocaleString() || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Address</div>
                    <div className="font-medium">{p.location}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div className="font-medium">{new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{brand.name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{brand.tagline}</p>
            </div>
            {/* Desktop User Info */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">{profile?.full_name || "Homeowner"}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <NotificationBell />
              <SettingsDropdown userRole="homeowner" />
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-2">
              <NotificationBell />
              <SettingsDropdown userRole="homeowner" />
              
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Button
                      variant={activeTab === "overview" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("overview");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Home className="h-4 w-4 mr-3" /> Overview
                    </Button>
                    <Button
                      variant={activeTab === "start" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("start");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-3" /> Start Project
                    </Button>
                    <Button
                      variant={activeTab === "projects" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("projects");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <ClipboardList className="h-4 w-4 mr-3" /> My Projects
                    </Button>
                    <Button
                      variant={activeTab === "schedule" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("schedule");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-3" /> Schedule
                    </Button>
                    <Button
                      variant={activeTab === "messages" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("messages");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-3" /> Messages
                    </Button>
                    <Button
                      variant={activeTab === "bids" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("bids");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <ClipboardList className="h-4 w-4 mr-3" /> Bid Review
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate("/homeowner/files");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <FolderOpen className="h-4 w-4 mr-3" /> Files
                    </Button>
                    <Button
                      variant={activeTab === "warranty" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab("warranty");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <ShieldCheck className="h-4 w-4 mr-3" /> Warranty
                    </Button>
                    <div className="border-t pt-4 mt-4">
                      <Button variant="outline" className="w-full justify-start" onClick={logout}>
                        <LogOut className="h-4 w-4 mr-3" /> Sign Out
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tabs */}
          <TabsList className="mb-6 hidden lg:inline-flex w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="overview" className="whitespace-nowrap">
              <Home className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="start" className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" /> Start Project
            </TabsTrigger>
            <TabsTrigger value="projects" className="whitespace-nowrap">
              <ClipboardList className="h-4 w-4 mr-2" /> My Projects
            </TabsTrigger>
            <TabsTrigger value="schedule" className="whitespace-nowrap">
              <Calendar className="h-4 w-4 mr-2" /> Schedule
            </TabsTrigger>
            <TabsTrigger value="messages" className="whitespace-nowrap">
              <MessageSquare className="h-4 w-4 mr-2" /> Messages
            </TabsTrigger>
            <TabsTrigger value="bids" className="whitespace-nowrap">
              <ClipboardList className="h-4 h-4 mr-2" /> Bid Review
            </TabsTrigger>
            <TabsTrigger value="files" className="whitespace-nowrap" onClick={() => navigate("/homeowner/files")}>
              <FolderOpen className="h-4 w-4 mr-2" /> Files
            </TabsTrigger>
            <TabsTrigger value="warranty" className="whitespace-nowrap">
              <ShieldCheck className="h-4 w-4 mr-2" /> Warranty
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Overview />
          </TabsContent>

          <TabsContent value="start">
            <StartProject />
          </TabsContent>

          <TabsContent value="projects">
            <MyProjects />
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Manage your project appointments and walkthroughs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No scheduled appointments yet.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            {projects.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>No projects assigned yet</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Once you're assigned to a project, you can message your team here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {projects.map((project) => (
                  <ProjectMessaging
                    key={project.id}
                    projectId={project.id}
                    projectName={project.project_name}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bids">
            {projects.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Bid Comparisons</CardTitle>
                  <CardDescription>No projects assigned yet</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Once you have an active project, your estimator will send bid comparisons for your review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Bid Comparisons & Selection</h2>
                  <p className="text-muted-foreground mt-1">
                    Review professional bids and select your preferred contractor
                  </p>
                </div>
                {projects.map((project) => (
                  <div key={project.id} className="space-y-4">
                    <h3 className="text-lg font-semibold">{project.project_name}</h3>
                    <BidComparisonReview projectId={project.id} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="warranty">
            <Tabs defaultValue="coverage" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="coverage">Coverage Checker</TabsTrigger>
                <TabsTrigger value="claims">Claims History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="coverage">
                <WarrantyCoverageChecker />
              </TabsContent>
              
              <TabsContent value="claims">
                <HomeownerWarrantyHistory />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-card border-t z-50 safe-area-bottom">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          <button
            onClick={() => setActiveTab("warranty")}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === "warranty" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-medium">Warranty</span>
          </button>
          
          <button
            onClick={() => setActiveTab("start")}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === "start" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs font-medium">Start</span>
          </button>
          
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === "projects" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-xs font-medium">Projects</span>
          </button>
          
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === "messages" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs font-medium">Messages</span>
          </button>
          
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === "overview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </button>
        </div>
      </nav>

      {/* AI Copilot */}
      <PortalCopilot 
        role="homeowner" 
        userId={user?.id}
        projectId={projects[0]?.id}
        contextData={{ projectCount: projects.length }}
      />
    </div>
  );
}
