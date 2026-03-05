import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Clock, Play, TrendingUp, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ErrorLogAnalyzerPanel() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch error log reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['ai-error-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_error_log_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch error groups for selected report
  const { data: errorGroups } = useQuery({
    queryKey: ['ai-error-groups', selectedReport],
    queryFn: async () => {
      if (!selectedReport) return [];
      
      const { data, error } = await supabase
        .from('ai_error_groups')
        .select('*')
        .eq('report_id', selectedReport)
        .order('severity', { ascending: false })
        .order('occurrence_count', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedReport,
  });

  // Run analysis mutation
  const runAnalysis = useMutation({
    mutationFn: async (timeRangeHours: number) => {
      const { data, error } = await supabase.functions.invoke('ai-error-log-analyzer', {
        body: { timeRangeHours },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Error log analysis completed');
      queryClient.invalidateQueries({ queryKey: ['ai-error-reports'] });
    },
    onError: (error: Error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // Update error status mutation
  const updateErrorStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('ai_error_groups')
        .update({ 
          status,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Error status updated');
      queryClient.invalidateQueries({ queryKey: ['ai-error-groups'] });
    },
  });

  const latestReport = reports?.[0];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'destructive';
      case 'investigating': return 'default';
      case 'resolved': return 'secondary';
      case 'ignored': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Error Log Analyzer</CardTitle>
              <CardDescription>
                Automated error detection, grouping, and AI-powered fix suggestions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => runAnalysis.mutate(24)}
                disabled={runAnalysis.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                {runAnalysis.isPending ? 'Analyzing...' : 'Run Analysis (24h)'}
              </Button>
              <Button
                variant="outline"
                onClick={() => runAnalysis.mutate(168)}
                disabled={runAnalysis.isPending}
              >
                Run (7 days)
              </Button>
            </div>
          </div>
        </CardHeader>

        {latestReport && (
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold">{latestReport.total_errors_found}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Error Groups</p>
                <p className="text-2xl font-bold">{latestReport.grouped_errors_count}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  Critical
                </p>
                <p className="text-2xl font-bold text-destructive">{latestReport.critical_errors}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Warnings
                </p>
                <p className="text-2xl font-bold text-yellow-500">{latestReport.warnings}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analysis Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {reportsLoading ? (
                <p className="text-sm text-muted-foreground">Loading reports...</p>
              ) : reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReport === report.id ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedReport(report.id)}
                  >
                    <div className="flex items-center gap-3">
                      {report.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {report.status === 'running' && (
                        <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
                      )}
                      {report.status === 'failed' && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(report.started_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.grouped_errors_count} groups, {report.total_errors_found} errors
                        </p>
                      </div>
                    </div>
                    <Badge variant={report.status === 'completed' ? 'secondary' : 'default'}>
                      {report.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reports yet. Run an analysis to get started.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Error Groups */}
      {selectedReport && errorGroups && errorGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Error Groups</CardTitle>
            <CardDescription>
              Grouped errors with AI-powered fix suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="critical">Critical</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-4">
                {errorGroups.map((group) => (
                  <ErrorGroupCard
                    key={group.id}
                    group={group}
                    onStatusUpdate={(status) => updateErrorStatus.mutate({ id: group.id, status })}
                  />
                ))}
              </TabsContent>

              <TabsContent value="critical" className="space-y-4 mt-4">
                {errorGroups
                  .filter((g) => g.severity === 'critical' || g.severity === 'high')
                  .map((group) => (
                    <ErrorGroupCard
                      key={group.id}
                      group={group}
                      onStatusUpdate={(status) => updateErrorStatus.mutate({ id: group.id, status })}
                    />
                  ))}
              </TabsContent>

              <TabsContent value="new" className="space-y-4 mt-4">
                {errorGroups
                  .filter((g) => g.status === 'new')
                  .map((group) => (
                    <ErrorGroupCard
                      key={group.id}
                      group={group}
                      onStatusUpdate={(status) => updateErrorStatus.mutate({ id: group.id, status })}
                    />
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ErrorGroupCard({
  group,
  onStatusUpdate,
}: {
  group: any;
  onStatusUpdate: (status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={getSeverityColor(group.severity)}>
                {group.severity}
              </Badge>
              <Badge variant={getStatusColor(group.status)}>
                {group.status}
              </Badge>
              <Badge variant="outline">
                {group.error_type}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {group.occurrence_count} occurrences
              </span>
            </div>
            <p className="text-sm font-mono">{group.error_message}</p>
            {group.affected_functions && group.affected_functions.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Functions: {group.affected_functions.join(', ')}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {group.ai_analysis && (
            <div>
              <h4 className="font-semibold text-sm mb-2">AI Analysis</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {group.ai_analysis}
              </p>
              {group.fix_confidence && (
                <p className="text-xs text-muted-foreground mt-2">
                  Confidence: {(group.fix_confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
          )}

          {group.suggested_fix && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Suggested Fix</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {group.suggested_fix}
              </pre>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusUpdate('investigating')}
            >
              Investigating
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusUpdate('resolved')}
            >
              Mark Resolved
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusUpdate('ignored')}
            >
              Ignore
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'secondary';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'new': return 'destructive';
    case 'investigating': return 'default';
    case 'resolved': return 'secondary';
    case 'ignored': return 'outline';
    default: return 'secondary';
  }
}
