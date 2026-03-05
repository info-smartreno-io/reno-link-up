import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, CheckCircle, XCircle, Clock, Sparkles, Link2, AlertTriangle, Gauge, TrendingUp, FileText, Lightbulb, MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminAI() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch latest reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ['ai-seo-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_seo_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  // Fetch recommendations for the latest report
  const latestReport = reports?.[0];
  const { data: recommendations } = useQuery({
    queryKey: ['ai-seo-recommendations', latestReport?.id],
    enabled: !!latestReport?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_seo_recommendations')
        .select('*')
        .eq('report_id', latestReport.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // Run SEO refresh
  const runRefreshMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-seo-refresh');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "SEO Refresh Started",
        description: "AI is analyzing pages for SEO improvements...",
      });
      queryClient.invalidateQueries({ queryKey: ['ai-seo-reports'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start SEO refresh",
        variant: "destructive",
      });
    }
  });

  // Approve recommendation
  const approveMutation = useMutation({
    mutationFn: async (recId: string) => {
      const { error } = await supabase
        .from('ai_seo_recommendations')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', recId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Recommendation Approved",
        description: "This SEO improvement has been marked for implementation.",
      });
      queryClient.invalidateQueries({ queryKey: ['ai-seo-recommendations'] });
    }
  });

  // Reject recommendation
  const rejectMutation = useMutation({
    mutationFn: async (recId: string) => {
      const { error } = await supabase
        .from('ai_seo_recommendations')
        .update({ status: 'rejected' })
        .eq('id', recId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-seo-recommendations'] });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Maintenance System
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated SEO optimization, broken link detection, and site health monitoring
          </p>
        </div>

        <Tabs defaultValue="seo" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="seo">SEO Refresh</TabsTrigger>
            <TabsTrigger value="redirects">Broken Links</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="errors">Error Logs</TabsTrigger>
            <TabsTrigger value="content">Content Pipeline</TabsTrigger>
            <TabsTrigger value="copilot">AI Copilot</TabsTrigger>
          </TabsList>

          <TabsContent value="seo" className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => runRefreshMutation.mutate()}
                disabled={runRefreshMutation.isPending}
              >
                {runRefreshMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run SEO Refresh
                  </>
                )}
              </Button>
            </div>

            {/* Report History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>SEO analysis history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reports?.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(report.status)}
                        <div>
                          <p className="font-medium">
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {report.pages_analyzed} pages · {report.recommendations_count} recommendations
                          </p>
                        </div>
                      </div>
                      <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Latest Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>SEO Recommendations</CardTitle>
                  <CardDescription>
                    Latest analysis from {latestReport && formatDistanceToNow(new Date(latestReport.created_at), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(rec.priority)}>
                                {rec.priority}
                              </Badge>
                              <Badge variant="outline">{rec.page_path}</Badge>
                              <Badge variant="secondary">{rec.recommendation_type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{rec.reasoning}</p>
                          </div>
                        </div>

                        {rec.current_value && (
                          <div className="bg-muted/50 p-2 rounded text-sm">
                            <span className="font-medium">Current: </span>
                            {rec.current_value}
                          </div>
                        )}

                        <div className="bg-primary/5 p-2 rounded text-sm">
                          <span className="font-medium">Suggested: </span>
                          {rec.suggested_value}
                        </div>

                        {rec.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(rec.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectMutation.mutate(rec.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {rec.status === 'approved' && (
                          <Badge variant="default" className="w-fit">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Approved
                          </Badge>
                        )}

                        {rec.status === 'rejected' && (
                          <Badge variant="secondary" className="w-fit">
                            Rejected
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {recommendations && recommendations.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No recommendations yet. Run an SEO refresh to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="redirects" className="space-y-6">
            <RedirectsTab />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceTab />
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <ErrorLogsTab />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <ContentPipelineTab />
          </TabsContent>

          <TabsContent value="copilot" className="space-y-6">
            <SiteHealthCopilotTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Redirects Tab Component
function RedirectsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Fetch redirect reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['ai-redirect-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_redirect_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch recommendations for selected report
  const { data: recommendations, isLoading: recsLoading } = useQuery({
    queryKey: ['ai-redirect-recommendations', selectedReport],
    enabled: !!selectedReport,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_redirect_recommendations')
        .select('*')
        .eq('report_id', selectedReport!)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Run broken link analysis
  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-broken-links');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Broken link analysis has been completed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['ai-redirect-reports'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update recommendation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('ai_redirect_recommendations')
        .update({ 
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
          approved_by: status === 'approved' ? (await supabase.auth.getUser()).data.user?.id : null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status Updated" });
      queryClient.invalidateQueries({ queryKey: ['ai-redirect-recommendations'] });
    },
  });

  const latestReport = reports?.[0];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Broken Link Analysis
          </CardTitle>
          <CardDescription>
            Automatically detect broken links and suggest redirects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => runAnalysisMutation.mutate()}
            disabled={runAnalysisMutation.isPending}
          >
            {runAnalysisMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Link Analysis
              </>
            )}
          </Button>

          {latestReport && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Pages Crawled</p>
                <p className="text-2xl font-bold">{latestReport.pages_crawled}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Broken Links</p>
                <p className="text-2xl font-bold text-destructive">{latestReport.broken_links_found}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Redirects Suggested</p>
                <p className="text-2xl font-bold text-primary">{latestReport.redirects_suggested}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {reportsLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : reports && reports.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Recent Analysis Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedReport === report.id ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedReport(report.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {report.broken_links_found} broken links found
                        </p>
                      </div>
                      <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedReport && (
            <Card>
              <CardHeader>
                <CardTitle>Redirect Recommendations</CardTitle>
                <CardDescription>Review and approve suggested redirects</CardDescription>
              </CardHeader>
              <CardContent>
                {recsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : recommendations && recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {rec.broken_url}
                              </code>
                              <Badge variant="outline">{rec.error_type}</Badge>
                              <Badge variant={
                                rec.priority === 'high' ? 'destructive' :
                                rec.priority === 'medium' ? 'default' : 'secondary'
                              }>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Found on: {rec.found_on_page}
                            </p>
                          </div>
                          <Badge variant={
                            rec.status === 'approved' ? 'default' :
                            rec.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {rec.status}
                          </Badge>
                        </div>

                        <div className="pl-6 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">Suggested redirect:</span>
                            <code className="text-sm bg-primary/10 px-2 py-1 rounded">
                              {rec.suggested_redirect_url}
                            </code>
                            <span className="text-sm text-muted-foreground">
                              ({Math.round((rec.confidence_score || 0) * 100)}% confidence)
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rec.reasoning}
                          </p>
                        </div>

                        {rec.status === 'pending' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'approved' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'rejected' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recommendations found for this report
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No analysis reports yet. Run your first link analysis to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Performance Tab Component
function PerformanceTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);

  // Fetch performance reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['ai-performance-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_performance_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch audits for selected report
  const { data: audits, isLoading: auditsLoading } = useQuery({
    queryKey: ['ai-performance-audits', selectedReport],
    enabled: !!selectedReport,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_performance_audits')
        .select('*')
        .eq('report_id', selectedReport!)
        .order('performance_score', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch recommendations for selected audit
  const { data: recommendations, isLoading: recsLoading } = useQuery({
    queryKey: ['ai-performance-recommendations', selectedAudit],
    enabled: !!selectedAudit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_performance_recommendations')
        .select('*')
        .eq('audit_id', selectedAudit!)
        .order('impact', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Run performance audit
  const runAuditMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-performance-audit');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Audit Complete",
        description: "Performance audit has been completed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['ai-performance-reports'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Audit Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update recommendation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('ai_performance_recommendations')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          completed_by: status === 'completed' ? (await supabase.auth.getUser()).data.user?.id : null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status Updated" });
      queryClient.invalidateQueries({ queryKey: ['ai-performance-recommendations'] });
    },
  });

  const latestReport = reports?.[0];

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.9) return 'default';
    if (score >= 0.5) return 'secondary';
    return 'destructive';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Performance Auditor (Lighthouse)
          </CardTitle>
          <CardDescription>
            Analyze page performance, Core Web Vitals, and get AI-powered optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => runAuditMutation.mutate()}
            disabled={runAuditMutation.isPending}
          >
            {runAuditMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Auditing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Performance Audit
              </>
            )}
          </Button>

          {latestReport && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className={`text-2xl font-bold ${getScoreColor(latestReport.average_performance_score || 0)}`}>
                  {Math.round((latestReport.average_performance_score || 0) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accessibility</p>
                <p className={`text-2xl font-bold ${getScoreColor(latestReport.average_accessibility_score || 0)}`}>
                  {Math.round((latestReport.average_accessibility_score || 0) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SEO</p>
                <p className={`text-2xl font-bold ${getScoreColor(latestReport.average_seo_score || 0)}`}>
                  {Math.round((latestReport.average_seo_score || 0) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Practices</p>
                <p className={`text-2xl font-bold ${getScoreColor(latestReport.average_best_practices_score || 0)}`}>
                  {Math.round((latestReport.average_best_practices_score || 0) * 100)}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {reportsLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : reports && reports.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedReport === report.id ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => {
                      setSelectedReport(report.id);
                      setSelectedAudit(null);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {report.pages_audited} pages · Avg Performance: {Math.round((report.average_performance_score || 0) * 100)}%
                        </p>
                      </div>
                      <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedReport && (
            <Card>
              <CardHeader>
                <CardTitle>Page Audits</CardTitle>
                <CardDescription>Click a page to see detailed recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                {auditsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : audits && audits.length > 0 ? (
                  <div className="space-y-2">
                    {audits.map((audit) => (
                      <div
                        key={audit.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAudit === audit.id ? 'bg-accent' : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedAudit(audit.id)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{audit.page_name}</p>
                              <code className="text-xs text-muted-foreground">{audit.page_url}</code>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Performance</p>
                              <Badge variant={getScoreBadge(audit.performance_score || 0)}>
                                {Math.round((audit.performance_score || 0) * 100)}%
                              </Badge>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Accessibility</p>
                              <Badge variant={getScoreBadge(audit.accessibility_score || 0)}>
                                {Math.round((audit.accessibility_score || 0) * 100)}%
                              </Badge>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">SEO</p>
                              <Badge variant={getScoreBadge(audit.seo_score || 0)}>
                                {Math.round((audit.seo_score || 0) * 100)}%
                              </Badge>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Best Practices</p>
                              <Badge variant={getScoreBadge(audit.best_practices_score || 0)}>
                                {Math.round((audit.best_practices_score || 0) * 100)}%
                              </Badge>
                            </div>
                          </div>

                          <div className="border-t pt-2 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">LCP:</span>
                              <span className={`ml-1 font-medium ${audit.lcp_value && audit.lcp_value > 2500 ? 'text-red-600' : 'text-green-600'}`}>
                                {audit.lcp_value}ms
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">FID:</span>
                              <span className={`ml-1 font-medium ${audit.fid_value && audit.fid_value > 100 ? 'text-red-600' : 'text-green-600'}`}>
                                {audit.fid_value}ms
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">CLS:</span>
                              <span className={`ml-1 font-medium ${audit.cls_value && audit.cls_value > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                                {audit.cls_value}
                              </span>
                            </div>
                          </div>

                          {audit.ai_summary && (
                            <p className="text-sm text-muted-foreground border-t pt-2">
                              {audit.ai_summary}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No audits found for this report
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {selectedAudit && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Recommendations
                </CardTitle>
                <CardDescription>AI-powered optimization suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                {recsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : recommendations && recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <Badge variant={
                                rec.impact === 'high' ? 'destructive' :
                                rec.impact === 'medium' ? 'default' : 'secondary'
                              }>
                                {rec.impact} impact
                              </Badge>
                              <Badge variant="outline">{rec.recommendation_type.replace(/_/g, ' ')}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                          </div>
                          <Badge variant={
                            rec.status === 'completed' ? 'default' :
                            rec.status === 'in_progress' ? 'secondary' :
                            rec.status === 'dismissed' ? 'destructive' : 'outline'
                          }>
                            {rec.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        {rec.estimated_improvement && (
                          <div className="bg-primary/5 p-2 rounded text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="font-medium">Estimated improvement:</span>
                            <span>{rec.estimated_improvement}</span>
                          </div>
                        )}

                        {rec.implementation_notes && (
                          <div className="bg-muted/50 p-2 rounded text-sm">
                            <span className="font-medium">Implementation:</span>
                            <p className="mt-1">{rec.implementation_notes}</p>
                          </div>
                        )}

                        {rec.status === 'pending' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'in_progress' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              Start Work
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'completed' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'dismissed' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recommendations found for this audit
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No audit reports yet. Run your first performance audit to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Error Logs Tab Component  
function ErrorLogsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const { data: reports } = useQuery({
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

  const { data: errorGroups } = useQuery({
    queryKey: ['ai-error-groups', selectedReport],
    queryFn: async () => {
      if (!selectedReport) return [];
      const { data, error } = await supabase
        .from('ai_error_groups')
        .select('*')
        .eq('report_id', selectedReport)
        .order('severity', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedReport,
  });

  const runAnalysis = useMutation({
    mutationFn: async (hours: number) => {
      const { data, error } = await supabase.functions.invoke('ai-error-log-analyzer', {
        body: { timeRangeHours: hours },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Error analysis completed' });
      queryClient.invalidateQueries({ queryKey: ['ai-error-reports'] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('ai_error_groups')
        .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-error-groups'] }),
  });

  const latestReport = reports?.[0];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            AI Error Log Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => runAnalysis.mutate(24)} disabled={runAnalysis.isPending}>
            {runAnalysis.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : 'Run Analysis (24h)'}
          </Button>
          {latestReport && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div><p className="text-sm text-muted-foreground">Total Errors</p><p className="text-2xl font-bold">{latestReport.total_errors_found}</p></div>
              <div><p className="text-sm text-muted-foreground">Error Groups</p><p className="text-2xl font-bold">{latestReport.grouped_errors_count}</p></div>
              <div><p className="text-sm text-muted-foreground">Critical</p><p className="text-2xl font-bold text-destructive">{latestReport.critical_errors}</p></div>
              <div><p className="text-sm text-muted-foreground">Warnings</p><p className="text-2xl font-bold text-yellow-500">{latestReport.warnings}</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      {reports && reports.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Reports & Error Groups</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="p-3 border rounded cursor-pointer hover:bg-accent" onClick={() => setSelectedReport(r.id)}>
                  <div className="flex justify-between"><span>{new Date(r.started_at).toLocaleDateString()}</span><Badge>{r.status}</Badge></div>
                  <p className="text-sm text-muted-foreground">{r.grouped_errors_count} groups</p>
                </div>
              ))}
            </div>
            {selectedReport && errorGroups && errorGroups.map((g) => (
              <Card key={g.id} className="mt-4">
                <CardHeader>
                  <div className="flex gap-2"><Badge variant={g.severity === 'critical' ? 'destructive' : 'default'}>{g.severity}</Badge><Badge>{g.status}</Badge></div>
                  <p className="text-sm">{g.error_message}</p>
                  {g.ai_analysis && <p className="text-xs text-muted-foreground mt-2">{g.ai_analysis.substring(0, 200)}...</p>}
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: g.id, status: 'investigating' })}>Investigating</Button>
                  <Button size="sm" onClick={() => updateStatus.mutate({ id: g.id, status: 'resolved' })}>Resolve</Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Content Pipeline Tab
function ContentPipelineTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const { data: reports } = useQuery({
    queryKey: ['ai-content-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_content_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: ideas } = useQuery({
    queryKey: ['ai-content-ideas', selectedReport],
    queryFn: async () => {
      if (!selectedReport) return [];
      const { data, error } = await supabase
        .from('ai_content_ideas')
        .select('*')
        .eq('report_id', selectedReport)
        .order('priority', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedReport,
  });

  const { data: keywords } = useQuery({
    queryKey: ['ai-keywords', selectedReport],
    queryFn: async () => {
      if (!selectedReport) return [];
      const { data, error } = await supabase
        .from('ai_keyword_research')
        .select('*')
        .eq('report_id', selectedReport)
        .order('priority_score', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedReport,
  });

  const runPipeline = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-content-pipeline', {
        body: { reportType: 'monthly' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Content pipeline completed' });
      queryClient.invalidateQueries({ queryKey: ['ai-content-reports'] });
    },
  });

  const updateIdeaStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('ai_content_ideas')
        .update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-content-ideas'] }),
  });

  const latestReport = reports?.[0];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Content Pipeline
          </CardTitle>
          <CardDescription>
            Monthly content generation: blog ideas, cost guides, keyword research
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => runPipeline.mutate()} disabled={runPipeline.isPending}>
            {runPipeline.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : 'Generate Content Ideas'}
          </Button>
          {latestReport && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div><p className="text-sm text-muted-foreground">Total Ideas</p><p className="text-2xl font-bold">{latestReport.ideas_generated}</p></div>
              <div><p className="text-sm text-muted-foreground">Blog Posts</p><p className="text-2xl font-bold">{latestReport.blog_ideas}</p></div>
              <div><p className="text-sm text-muted-foreground">Cost Guides</p><p className="text-2xl font-bold">{latestReport.cost_guide_ideas}</p></div>
              <div><p className="text-sm text-muted-foreground">Keywords</p><p className="text-2xl font-bold">{latestReport.keyword_suggestions}</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      {reports && reports.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="p-3 border rounded cursor-pointer hover:bg-accent" onClick={() => setSelectedReport(r.id)}>
                  <div className="flex justify-between"><span>{new Date(r.started_at).toLocaleDateString()}</span><Badge>{r.status}</Badge></div>
                  <p className="text-sm text-muted-foreground">{r.ideas_generated} ideas generated</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport && ideas && ideas.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Content Ideas</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="blog">Blog Posts</TabsTrigger><TabsTrigger value="cost">Cost Guides</TabsTrigger></TabsList>
              <TabsContent value="all" className="space-y-3 mt-4">
                {ideas.map((idea) => (
                  <Card key={idea.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex gap-2 mb-2">
                            <Badge variant={idea.priority === 'high' ? 'destructive' : 'default'}>{idea.priority}</Badge>
                            <Badge variant="outline">{idea.content_type}</Badge>
                            <Badge>{idea.status}</Badge>
                          </div>
                          <h4 className="font-semibold">{idea.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{idea.description}</p>
                          {idea.target_keywords && idea.target_keywords.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">Keywords: {idea.target_keywords.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {idea.status === 'pending' && (
                      <CardContent className="flex gap-2 pt-0">
                        <Button size="sm" onClick={() => updateIdeaStatus.mutate({ id: idea.id, status: 'approved' })}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => updateIdeaStatus.mutate({ id: idea.id, status: 'in_progress' })}>Start</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateIdeaStatus.mutate({ id: idea.id, status: 'rejected' })}>Reject</Button>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="blog" className="space-y-3 mt-4">
                {ideas.filter(i => i.content_type === 'blog_post').map((idea) => (
                  <Card key={idea.id}>
                    <CardHeader><h4 className="font-semibold">{idea.title}</h4><p className="text-sm text-muted-foreground">{idea.description}</p></CardHeader>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="cost" className="space-y-3 mt-4">
                {ideas.filter(i => i.content_type === 'cost_guide').map((idea) => (
                  <Card key={idea.id}>
                    <CardHeader><h4 className="font-semibold">{idea.title}</h4><p className="text-sm text-muted-foreground">{idea.description}</p></CardHeader>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {selectedReport && keywords && keywords.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Keyword Opportunities</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {keywords.map((kw) => (
                <div key={kw.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{kw.keyword}</p>
                      <p className="text-xs text-muted-foreground">{kw.search_intent} • {kw.competition} competition</p>
                      {kw.content_gap_opportunity && <p className="text-xs mt-1">{kw.content_gap_opportunity}</p>}
                    </div>
                    <Badge variant="outline">{kw.search_volume_estimate || 0} vol</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Site Health Copilot Tab
function SiteHealthCopilotTab() {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('site-health-copilot', {
        body: {
          sessionId,
          message: userMessage,
          history: messages,
        },
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Copilot error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the most critical issues right now?",
    "How's our SEO performance?",
    "Are there any broken links I should fix?",
    "What errors are affecting the site?",
    "What content should we create next?",
    "How can I improve our Core Web Vitals?",
  ];

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Site Health Copilot
        </CardTitle>
        <CardDescription>
          Ask me anything about your site's SEO, performance, errors, or content strategy
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-2">
              <Sparkles className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Welcome to Site Health Copilot</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                I can help you understand your site's health across SEO, performance, errors, and content. Ask me anything!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-2xl">
              {suggestedQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-left h-auto py-2 px-3"
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => sendMessage(), 100);
                  }}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about SEO, performance, errors, or content..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


