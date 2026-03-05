import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, ArrowUpDown, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

interface PCProjectsTableProps {
  coordinatorId?: string;
}

type SortField = "name" | "target_start_date" | "risk_level";
type SortDirection = "asc" | "desc";

function StatusIcon({ status }: { status: string | null }) {
  switch (status) {
    case "completed":
    case "approved":
    case "ordered":
    case "awarded":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "pending":
    case "in_progress":
    case "partial":
      return <Clock className="h-4 w-4 text-amber-600" />;
    case "missing":
    case "not_started":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

function RiskBadge({ risk }: { risk: string | null }) {
  const variants: Record<string, { className: string; label: string }> = {
    low: { className: "bg-green-500/20 text-green-700 border-green-500/30", label: "Low" },
    medium: { className: "bg-amber-500/20 text-amber-700 border-amber-500/30", label: "Med" },
    high: { className: "bg-red-500/20 text-red-700 border-red-500/30", label: "High" },
    critical: { className: "bg-red-600/30 text-red-800 border-red-600/40", label: "Critical" },
  };
  const variant = variants[risk || "low"] || variants.low;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
}

function PhaseBadge({ phase }: { phase: string | null }) {
  const phaseMap: Record<string, { label: string; color: string }> = {
    pre_construction: { label: "Pre-Construction", color: "bg-purple-500/20 text-purple-700" },
    procurement: { label: "Procurement", color: "bg-blue-500/20 text-blue-700" },
    build_ready: { label: "Build-Ready", color: "bg-green-500/20 text-green-700" },
    handoff: { label: "Handoff", color: "bg-indigo-500/20 text-indigo-700" },
  };
  const config = phaseMap[phase || "pre_construction"] || phaseMap.pre_construction;
  return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
}

export function PCProjectsTable({ coordinatorId }: PCProjectsTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("target_start_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["pc-projects", coordinatorId, sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*")
        .not("coordinator_status", "in", '("completed","cancelled")');

      if (coordinatorId) {
        query = query.eq("coordinator_id", coordinatorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Sort in JS for flexibility
      return (data || []).sort((a, b) => {
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];

        if (sortField === "target_start_date") {
          aVal = aVal ? new Date(aVal).getTime() : Infinity;
          bVal = bVal ? new Date(bVal).getTime() : Infinity;
        }

        if (sortField === "risk_level") {
          const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          aVal = riskOrder[aVal as keyof typeof riskOrder] ?? 4;
          bVal = riskOrder[bVal as keyof typeof riskOrder] ?? 4;
        }

        if (sortDirection === "asc") {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getZoningStatus = (project: any) => {
    if (project.zoning_prepared_at) return "ready";
    return "missing";
  };

  const getPermitStatus = (project: any) => {
    if (project.permit_prepared_at) return "ready";
    if (project.permit_status === "pending") return "pending";
    return "missing";
  };

  const getSubsStatus = (project: any) => {
    if (project.subs_awarded_at) return "awarded";
    if (project.subs_status === "partial") return "partial";
    return "open";
  };

  const getMaterialsStatus = (project: any) => {
    if (project.materials_ordered_at) return "ordered";
    if (project.materials_status === "partial") return "partial";
    return "no";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>My Projects</span>
          <Badge variant="secondary">{projects.length} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No active projects assigned
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="gap-1">
                    Project <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("target_start_date")} className="gap-1">
                    Start Date <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Zoning</TableHead>
                <TableHead>Permit</TableHead>
                <TableHead>Subs</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("risk_level")} className="gap-1">
                    Risk <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.project_type}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PhaseBadge phase={project.coordinator_status} />
                  </TableCell>
                  <TableCell>
                    {project.target_start_date 
                      ? format(new Date(project.target_start_date), "MM/dd")
                      : "—"
                    }
                  </TableCell>
                  <TableCell>
                    <StatusIcon status={getZoningStatus(project)} />
                  </TableCell>
                  <TableCell>
                    <StatusIcon status={getPermitStatus(project)} />
                  </TableCell>
                  <TableCell>
                    <StatusIcon status={getSubsStatus(project)} />
                  </TableCell>
                  <TableCell>
                    <StatusIcon status={getMaterialsStatus(project)} />
                  </TableCell>
                  <TableCell>
                    <RiskBadge risk={project.risk_level} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground truncate max-w-[120px] block">
                      {project.next_action || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/coordinator/project/${project.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
