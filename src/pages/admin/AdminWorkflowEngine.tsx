import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  ArrowRight, ArrowRightLeft, Search, Filter, Activity,
  Zap, Clock, CheckCircle2, AlertTriangle, RefreshCw
} from "lucide-react";

const WORKFLOW_STAGES = [
  { status: "new_lead", label: "Lead", color: "bg-slate-400" },
  { status: "intake_submitted", label: "Intake", color: "bg-blue-500" },
  { status: "walkthrough_scheduled", label: "Walkthrough Scheduled", color: "bg-amber-400" },
  { status: "walkthrough_complete", label: "Walkthrough Done", color: "bg-amber-600" },
  { status: "estimate_in_progress", label: "Estimating", color: "bg-purple-500" },
  { status: "scope_review", label: "Scope Review", color: "bg-purple-600" },
  { status: "estimate_sent", label: "RFP Out", color: "bg-indigo-500" },
  { status: "contractor_selected", label: "Contractor Selected", color: "bg-emerald-500" },
  { status: "in_progress", label: "In Progress", color: "bg-cyan-500" },
  { status: "completed", label: "Completed", color: "bg-green-600" },
];

const AUTOMATION_RULES = [
  {
    trigger: "intake_submitted",
    actions: ["Create project record", "Notify admin", "Allow estimator scheduling"],
    icon: Zap,
  },
  {
    trigger: "walkthrough_complete",
    actions: ["Unlock scope builder", "Notify estimator", "Start AI analysis"],
    icon: CheckCircle2,
  },
  {
    trigger: "scope_review → estimate_sent",
    actions: ["Generate financials", "Generate timeline", "Create RFP", "Notify contractors"],
    icon: ArrowRightLeft,
  },
  {
    trigger: "contractor_selected",
    actions: ["Generate contract", "Generate payment schedule", "Start timeline"],
    icon: Activity,
  },
  {
    trigger: "in_progress",
    actions: ["Enable change orders", "Enable progress tracking", "Enable daily logs"],
    icon: Clock,
  },
  {
    trigger: "completed",
    actions: ["Request homeowner review", "Archive project", "Update analytics"],
    icon: CheckCircle2,
  },
];

export default function AdminWorkflowEngine() {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["workflow-events", eventTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("workflow_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (eventTypeFilter !== "all") {
        query = query.eq("event_type", eventTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filteredEvents = events?.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.from_status?.toLowerCase().includes(term) ||
      e.to_status?.toLowerCase().includes(term) ||
      e.event_type?.toLowerCase().includes(term) ||
      JSON.stringify(e.event_data).toLowerCase().includes(term)
    );
  });

  const statusBadge = (status: string | null) => {
    if (!status) return null;
    const stage = WORKFLOW_STAGES.find((s) => s.status === status);
    return (
      <Badge variant="outline" className="text-xs">
        {stage?.label || status.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workflow Automation Engine</h1>
            <p className="text-muted-foreground">
              Automated project lifecycle management and event audit trail
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Workflow Pipeline Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Project Lifecycle Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {WORKFLOW_STAGES.map((stage, i) => (
                <div key={stage.status} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className={`w-8 h-8 rounded-full ${stage.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {i + 1}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
                      {stage.label}
                    </span>
                  </div>
                  {i < WORKFLOW_STAGES.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Automation Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Automation Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AUTOMATION_RULES.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div
                    key={rule.trigger}
                    className="border rounded-lg p-4 space-y-2 bg-card"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {rule.trigger}
                      </span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {rule.actions.map((action) => (
                        <li key={action} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Event Log */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Event Audit Trail
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="pl-9 w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="status_change">Project Status</SelectItem>
                    <SelectItem value="lead_status_change">Lead Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading events...</p>
            ) : !filteredEvents?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No workflow events yet</p>
                <p className="text-xs mt-1">Events will appear here as projects move through stages</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${event.automated ? "bg-amber-500" : "bg-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={event.event_type === "status_change" ? "default" : "secondary"} className="text-[10px]">
                          {event.event_type.replace(/_/g, " ")}
                        </Badge>
                        {statusBadge(event.from_status)}
                        {event.from_status && event.to_status && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        )}
                        {statusBadge(event.to_status)}
                        {event.automated && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                            <Zap className="h-2.5 w-2.5 mr-1" />
                            Auto
                          </Badge>
                        )}
                      </div>
                      {event.event_data && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {(event.event_data as any)?.name || (event.event_data as any)?.client_name || ""}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {format(new Date(event.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
