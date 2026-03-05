import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Bot, 
  Play, 
  Pause, 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Settings,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  trigger_conditions: any;
  is_active: boolean;
  requires_approval: boolean;
  priority: number;
  created_at: string;
}

interface AgentRun {
  id: string;
  agent_id: string;
  trigger_source: string;
  trigger_source_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  result_summary: any;
  created_at: string;
  agent?: any;
}

interface AgentAuditLog {
  id: string;
  run_id: string;
  action_type: string;
  status: string;
  input_data: any;
  output_data: any;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export default function AgentConsole() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchAgents();
    fetchRuns();

    // Subscribe to realtime updates
    const runsChannel = supabase
      .channel('agent-runs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_runs' }, () => {
        fetchRuns();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(runsChannel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching agents:', error);
      return;
    }
    setAgents(data || []);
    setLoading(false);
  };

  const fetchRuns = async () => {
    const { data, error } = await supabase
      .from('agent_runs')
      .select(`
        *,
        agent:agents(name, description)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching runs:', error);
      return;
    }
    setRuns(data || []);
  };

  const fetchAuditLogs = async (runId: string) => {
    const { data, error } = await supabase
      .from('agent_audit_logs')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching audit logs:', error);
      return;
    }
    setAuditLogs(data || []);
  };

  const toggleAgent = async (agentId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('agents')
      .update({ is_active: !isActive })
      .eq('id', agentId);

    if (error) {
      toast.error('Failed to update agent');
      return;
    }

    toast.success(`Agent ${isActive ? 'disabled' : 'enabled'}`);
    fetchAgents();
  };

  const approveRun = async (runId: string) => {
    const { error } = await supabase
      .from('agent_runs')
      .update({ 
        status: 'running',
        approved_at: new Date().toISOString(),
        started_at: new Date().toISOString()
      })
      .eq('id', runId);

    if (error) {
      toast.error('Failed to approve run');
      return;
    }

    toast.success('Run approved and started');
    fetchRuns();
  };

  const rejectRun = async (runId: string) => {
    const { error } = await supabase
      .from('agent_runs')
      .update({ 
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', runId);

    if (error) {
      toast.error('Failed to reject run');
      return;
    }

    toast.success('Run cancelled');
    fetchRuns();
  };

  const retryRun = async (run: AgentRun) => {
    try {
      const { error } = await supabase.functions.invoke('run-agent-orchestrator', {
        body: {
          trigger_event: agents.find(a => a.id === run.agent_id)?.trigger_event,
          trigger_source: run.trigger_source,
          trigger_source_id: run.trigger_source_id,
          trigger_data: {}
        }
      });

      if (error) throw error;
      toast.success('Retry initiated');
      fetchRuns();
    } catch (error) {
      toast.error('Failed to retry run');
    }
  };

  const viewRunDetails = async (run: AgentRun) => {
    setSelectedRun(run);
    await fetchAuditLogs(run.id);
    setDetailsOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      failed: "destructive",
      running: "secondary",
      pending: "outline",
      cancelled: "outline"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const pendingApprovals = runs.filter(r => r.status === 'pending');
  const recentRuns = runs.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Agent Console</h1>
            <p className="text-sm text-muted-foreground">
              Manage workflow automation agents
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <Settings className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApprovals.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{(run.agent as any)?.name || 'Unknown Agent'}</p>
                    <p className="text-sm text-muted-foreground">
                      {run.trigger_source}/{run.trigger_source_id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => rejectRun(run.id)}>
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => approveRun(run.id)}>
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="agents" className="w-full">
        <TabsList>
          <TabsTrigger value="agents" className="gap-2">
            <Zap className="h-4 w-4" />
            Agents ({agents.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Run History
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className={!agent.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                    </div>
                    <Switch
                      checked={agent.is_active}
                      onCheckedChange={() => toggleAgent(agent.id, agent.is_active)}
                    />
                  </div>
                  <CardDescription className="text-xs">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {agent.trigger_event}
                    </Badge>
                    {agent.requires_approval && (
                      <Badge variant="secondary" className="text-xs">
                        Requires Approval
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      Priority: {agent.priority}
                    </Badge>
                  </div>
                  {Object.keys(agent.trigger_conditions).length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Conditions: {JSON.stringify(agent.trigger_conditions)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Agent Runs</CardTitle>
              <CardDescription>
                View execution history and audit logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          {getStatusBadge(run.status)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {(run.agent as any)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {run.trigger_source}/{run.trigger_source_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm">
                        {run.started_at 
                          ? format(new Date(run.started_at), 'MMM d, HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {run.started_at && run.completed_at
                          ? `${Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewRunDetails(run)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {run.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => retryRun(run)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentRuns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No agent runs yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Run Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Run Details</DialogTitle>
            <DialogDescription>
              {selectedRun && (
                <span>
                  {(selectedRun.agent as any)?.name} - {selectedRun.trigger_source}/{selectedRun.trigger_source_id.slice(0, 8)}...
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRun && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {getStatusIcon(selectedRun.status)}
                {getStatusBadge(selectedRun.status)}
                {selectedRun.error_message && (
                  <span className="text-sm text-red-500">{selectedRun.error_message}</span>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Action Audit Log</h4>
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No actions executed</p>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="font-medium">{log.action_type}</span>
                          </div>
                          {log.duration_ms && (
                            <span className="text-xs text-muted-foreground">
                              {log.duration_ms}ms
                            </span>
                          )}
                        </div>
                        {log.error_message && (
                          <p className="text-sm text-red-500">{log.error_message}</p>
                        )}
                        {log.output_data && (
                          <pre className="text-xs bg-background p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(log.output_data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedRun.result_summary && (
                <div className="space-y-2">
                  <h4 className="font-medium">Result Summary</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedRun.result_summary, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
