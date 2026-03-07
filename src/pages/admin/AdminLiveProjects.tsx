import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminLiveProjects } from "@/hooks/useAdminLiveProjects";
import { Search, Eye, AlertTriangle, CheckCircle, Clock, Flag } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

function healthBadge(status: string) {
  switch (status) {
    case "active":
    case "in_progress": return { label: "On Track", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle };
    case "awarded":
    case "pre_construction": return { label: "Watch", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: Clock };
    case "delayed": return { label: "Delayed", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: AlertTriangle };
    default: return { label: status, color: "bg-muted text-muted-foreground", icon: Flag };
  }
}

export default function AdminLiveProjects() {
  const [search, setSearch] = useState("");
  const { data: projects, isLoading } = useAdminLiveProjects();

  const filtered = projects?.filter((p) =>
    !search ||
    p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.project_type?.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Projects Command Center</h1>
          <p className="text-muted-foreground">Monitor all awarded and active projects</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Active", value: projects?.length ?? 0, color: "text-foreground" },
            { label: "On Track", value: projects?.filter(p => p.status === "active" || p.status === "in_progress").length ?? 0, color: "text-green-500" },
            { label: "Pre-Construction", value: projects?.filter(p => p.status === "awarded" || p.status === "pre_construction").length ?? 0, color: "text-amber-500" },
            { label: "Delayed", value: projects?.filter(p => p.status === "delayed").length ?? 0, color: "text-red-500" },
          ].map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Homeowner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No active projects</TableCell></TableRow>
                ) : (
                  filtered?.map((project) => {
                    const health = healthBadge(project.status);
                    const HealthIcon = health.icon;
                    return (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.project_name || "Project"}</TableCell>
                        <TableCell>{project.client_name || "—"}</TableCell>
                        <TableCell>{project.project_type || "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{project.location || "—"}</TableCell>
                        <TableCell>
                          <Badge className={health.color}>
                            <HealthIcon className="h-3 w-3 mr-1" />{health.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{project.status?.replace(/_/g, " ")}</TableCell>
                        <TableCell>{format(new Date(project.updated_at), "MMM d")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/contractor/projects/${project.id}/workspace`}>
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
