import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ArrowUpDown, Check, Clock, AlertTriangle, X, Circle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

type SortField = 'start_date' | 'risk_level' | 'status';
type SortDirection = 'asc' | 'desc';

interface Project {
  id: string;
  name: string;
  project_type: string;
  status: string;
  start_date: string | null;
  risk_level: string;
  next_action: string | null;
  subs_status: string;
  materials_status: string;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'approved':
    case 'issued':
    case 'delivered':
    case 'locked':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'submitted':
    case 'ordered':
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'partial':
    case 'backordered':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default:
      return <X className="h-4 w-4 text-red-500" />;
  }
}

function RiskBadge({ level }: { level: string }) {
  const variants: Record<string, { bg: string; text: string; label: string; iconColor: string }> = {
    high: { bg: 'bg-red-500/20', text: 'text-red-500', label: 'High', iconColor: 'text-red-500' },
    medium: { bg: 'bg-amber-500/20', text: 'text-amber-500', label: 'Med', iconColor: 'text-amber-500' },
    low: { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Low', iconColor: 'text-green-500' }
  };
  const variant = variants[level] || variants.low;
  return (
    <Badge className={`${variant.bg} ${variant.text} border-0 font-medium flex items-center gap-1`}>
      <Circle className={`h-2 w-2 fill-current ${variant.iconColor}`} />
      {variant.label}
    </Badge>
  );
}

function PhaseBadge({ status }: { status: string }) {
  const phaseLabels: Record<string, string> = {
    'pre_construction': 'Pre-Construction',
    'pm_pre_construction': 'Pre-Construction',
    'procurement': 'Procurement',
    'construction': 'Construction',
    'pm_in_progress': 'In Progress',
    'closeout': 'Closeout',
    'completed': 'Completed'
  };
  return <Badge variant="outline" className="font-normal">{phaseLabels[status] || status}</Badge>;
}

export function PMActiveProjectsTable() {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('start_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['pm-active-projects', sortField, sortDirection],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, project_type, status, start_date, risk_level, next_action, subs_status, materials_status')
        .or(`project_manager_id.eq.${user.id},estimator_id.eq.${user.id}`)
        .in('status', ['pre_construction', 'procurement', 'construction', 'pm_pre_construction', 'pm_in_progress', 'closeout'])
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      return (data || []) as Project[];
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" className="h-auto p-0 font-medium hover:bg-transparent" onClick={() => handleSort('start_date')}>
                Start Date <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-center">Materials</TableHead>
            <TableHead className="text-center">Subs</TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" className="h-auto p-0 font-medium hover:bg-transparent" onClick={() => handleSort('risk_level')}>
                Risk <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>Next Action</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div>
                    <p className="font-medium">{project.name || 'Untitled Project'}</p>
                    <p className="text-xs text-muted-foreground">{project.project_type}</p>
                  </div>
                </TableCell>
                <TableCell><PhaseBadge status={project.status} /></TableCell>
                <TableCell>{project.start_date ? format(new Date(project.start_date), 'MM/dd') : '—'}</TableCell>
                <TableCell className="text-center"><StatusIcon status={project.materials_status || 'not_ordered'} /></TableCell>
                <TableCell className="text-center"><StatusIcon status={project.subs_status || 'not_started'} /></TableCell>
                <TableCell><RiskBadge level={project.risk_level || 'low'} /></TableCell>
                <TableCell className="max-w-[200px]"><p className="text-sm truncate">{project.next_action || '—'}</p></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/contractor/pm-project/${project.id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No active projects found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}