import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/contractor/StatusBadge";
import { Deadline } from "@/components/contractor/Deadline";
import { ProjectDetailDrawer } from "@/components/contractor/ProjectDetailDrawer";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { useDemoMode } from "@/hooks/demo/useDemoMode";
import { getDemoManagedProjects } from "@/utils/demoContractorData";

type ContractorProjectRow = {
  id: string;
  name: string;
  address: string | null;
  workflow_status: string;
  budget_estimate: number | null;
  contractor_role: string;
  last_contact_at: string | null;
  next_action_id: number | null;
  next_step_title: string | null;
  next_step_due_at: string | null;
  next_step_status: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_OPTIONS = [
  "intake",
  "rfp_out",
  "contractor_selected",
  "contract_signed",
  "pre_construction",
  "in_progress",
  "punchlist",
  "complete",
  "archived"
];

export default function ContractorProjectManagement() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ContractorProjectRow | null>(null);

  useEffect(() => {
    if (!isDemoMode) {
      checkAuth();
    }
  }, [isDemoMode]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/contractor/auth");
    }
  };

  const { data: projects, isLoading } = useQuery({
    queryKey: ["contractor-projects", statusFilter, searchQuery, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        let demoProjects = getDemoManagedProjects();
        
        if (statusFilter && statusFilter !== "all") {
          demoProjects = demoProjects.filter(p => p.workflow_status === statusFilter);
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          demoProjects = demoProjects.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.address && p.address.toLowerCase().includes(query))
          );
        }
        
        return demoProjects as ContractorProjectRow[];
      }

      let query = supabase
        .from("v_contractor_projects" as any)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(200);

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("workflow_status", statusFilter);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any as ContractorProjectRow[];
    },
    enabled: true
  });

  const rows = useMemo(() => projects ?? [], [projects]);

  const handleViewProject = (project: ContractorProjectRow) => {
    setSelectedProject(project);
    setDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Track ongoing projects, see last contact, and handle next steps.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects or addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.split("_").map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Projects Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Next Step</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((project) => (
                  <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {project.address || "No address"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={project.workflow_status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {project.last_contact_at
                          ? format(new Date(project.last_contact_at), "MMM d, yyyy")
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{project.next_step_title || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Deadline dueAt={project.next_step_due_at} />
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleViewProject(project)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Detail Drawer */}
        <ProjectDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          project={selectedProject}
        />
      </div>
    </ContractorLayout>
  );
}