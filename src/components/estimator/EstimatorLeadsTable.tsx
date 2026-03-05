import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowUpDown, 
  Search, 
  Calendar, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  name: string;
  stage: string;
  status: string;
  blocker_type: string | null;
  next_action: string | null;
  next_action_date: string | null;
  project_type: string;
  location: string;
  created_at: string;
  sale_outcome: string | null;
  estimator_readonly: boolean;
}

interface Walkthrough {
  lead_id: string;
  date: string;
  time: string | null;
  status: string;
}

const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  walkthrough_scheduled: "Walk-Through",
  proposal_sent: "Proposal Sent",
  revisions: "Revisions",
  needs_architectural: "Needs Architectural",
  needs_financing: "Needs Financing",
  sold: "Sold",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  lost: "Lost",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: "Active", color: "bg-green-500", icon: CheckCircle2 },
  waiting: { label: "Waiting", color: "bg-amber-500", icon: Clock },
  blocked: { label: "Blocked", color: "bg-red-500", icon: AlertTriangle },
};

const BLOCKER_ICONS: Record<string, React.ElementType> = {
  architectural: Building2,
  financing: DollarSign,
};

export function EstimatorLeadsTable() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"next_action_date" | "stage" | "created_at">("next_action_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["estimator-leads-table", sortField, sortDirection],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('leads')
        .select('id, name, stage, status, blocker_type, next_action, next_action_date, project_type, location, created_at, sale_outcome, estimator_readonly')
        .eq('user_id', user.id)
        .not('sale_outcome', 'in', '("cancelled","lost")')
        .order(sortField, { ascending: sortDirection === 'asc', nullsFirst: false });

      if (error) throw error;
      return (data || []) as Lead[];
    },
  });

  // Fetch upcoming appointments for leads
  const { data: walkthroughs = [] } = useQuery({
    queryKey: ["estimator-lead-walkthroughs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('walkthroughs')
        .select('lead_id, date, time, status')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      return (data || []) as Walkthrough[];
    },
  });

  // Create a map of lead_id to next walkthrough
  const walkthroughMap = walkthroughs.reduce((acc, w) => {
    if (!acc[w.lead_id]) {
      acc[w.lead_id] = w;
    }
    return acc;
  }, {} as Record<string, Walkthrough>);

  const getLeadStatus = (lead: Lead): "active" | "waiting" | "blocked" => {
    if (lead.blocker_type) return "blocked";
    if (lead.stage === "proposal_sent" || lead.stage === "revisions") return "waiting";
    return "active";
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.project_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Leads</CardTitle>
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">My Leads</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Lead</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3"
                    onClick={() => toggleSort("stage")}
                  >
                    Stage
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Blocker</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3"
                    onClick={() => toggleSort("next_action_date")}
                  >
                    Next Action
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => {
                  const status = getLeadStatus(lead);
                  const statusConfig = STATUS_CONFIG[status];
                  const StatusIcon = statusConfig.icon;
                  const BlockerIcon = lead.blocker_type ? BLOCKER_ICONS[lead.blocker_type] : null;
                  const walkthrough = walkthroughMap[lead.id];

                  return (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/estimator/lead/${lead.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.project_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {STAGE_LABELS[lead.stage] || lead.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {walkthrough ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                              {format(new Date(walkthrough.date), "M/d")}
                              {walkthrough.time && ` ${walkthrough.time}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${statusConfig.color}`} />
                          <span className="text-sm">{statusConfig.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.blocker_type ? (
                          <Badge variant="destructive" className="gap-1">
                            {BlockerIcon && <BlockerIcon className="h-3 w-3" />}
                            {lead.blocker_type === 'architectural' ? 'Plans' : 'Financing'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{lead.next_action || "No action set"}</p>
                          {lead.next_action_date && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(lead.next_action_date), "MMM d")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}