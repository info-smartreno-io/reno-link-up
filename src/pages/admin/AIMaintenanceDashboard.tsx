import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, CheckCircle2, AlertCircle, Activity, Link, Bug, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AIMaintenanceDashboard() {
  const [activeTab, setActiveTab] = useState("performance");
  const queryClient = useQueryClient();

  // Fetch latest reports
  const { data: performanceReports } = useQuery({
    queryKey: ['performance-reports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_performance_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  const { data: redirectReports } = useQuery({
    queryKey: ['redirect-reports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_redirect_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  const { data: errorReports } = useQuery({
    queryKey: ['error-reports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_error_log_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  // Run audits
  const runPerformanceAudit = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-performance-auditor');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Performance audit completed');
      queryClient.invalidateQueries({ queryKey: ['performance-reports'] });
    },
    onError: (error: Error) => {
      toast.error(`Audit failed: ${error.message}`);
    }
  });

  const runRedirectScan = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-redirect-manager');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Broken link scan completed');
      queryClient.invalidateQueries({ queryKey: ['redirect-reports'] });
    },
    onError: (error: Error) => {
      toast.error(`Scan failed: ${error.message}`);
    }
  });

  const runErrorAnalysis = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-error-analyzer', {
        body: { timeRangeHours: 24 }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Error analysis completed');
      queryClient.invalidateQueries({ queryKey: ['error-reports'] });
    },
    onError: (error: Error) => {
      toast.error(`Analysis failed: ${error.message}`);
    }
  });

  const latestPerformance = performanceReports?.[0];
  const latestRedirect = redirectReports?.[0];
  const latestError = errorReports?.[0];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Maintenance Dashboard</h1>
          <p className="text-muted-foreground">Automated monitoring and optimization</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestPerformance?.average_performance_score || 0}/100
            </div>
            <p className="text-xs text-muted-foreground">
              {latestPerformance?.pages_audited || 0} pages audited
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Broken Links</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestRedirect?.broken_links_found || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestRedirect?.redirects_suggested || 0} redirects suggested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Groups</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestError?.grouped_errors_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestError?.critical_errors || 0} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="redirects">Redirects</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Performance Audits</CardTitle>
                  <CardDescription>Weekly Lighthouse-style performance checks</CardDescription>
                </div>
                <Button 
                  onClick={() => runPerformanceAudit.mutate()}
                  disabled={runPerformanceAudit.isPending}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Run Audit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Accessibility</TableHead>
                    <TableHead>SEO</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceReports?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{report.pages_audited}</TableCell>
                      <TableCell>
                        <Badge variant={report.average_performance_score >= 90 ? "default" : "secondary"}>
                          {report.average_performance_score}/100
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.average_accessibility_score >= 90 ? "default" : "secondary"}>
                          {report.average_accessibility_score}/100
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.average_seo_score >= 90 ? "default" : "secondary"}>
                          {report.average_seo_score}/100
                        </Badge>
                      </TableCell>
                      <TableCell>{report.issues_found}</TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'completed' ? "default" : "secondary"}>
                          {report.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redirects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Broken Link Scans</CardTitle>
                  <CardDescription>Weekly crawl for 404s and redirect opportunities</CardDescription>
                </div>
                <Button 
                  onClick={() => runRedirectScan.mutate()}
                  disabled={runRedirectScan.isPending}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Run Scan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Pages Crawled</TableHead>
                    <TableHead>Broken Links</TableHead>
                    <TableHead>Redirects</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redirectReports?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{report.pages_crawled}</TableCell>
                      <TableCell>
                        <Badge variant={report.broken_links_found === 0 ? "default" : "secondary"}>
                          {report.broken_links_found}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.redirects_suggested}</TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'completed' ? "default" : "secondary"}>
                          {report.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Error Log Analysis</CardTitle>
                  <CardDescription>Daily error detection and suggested fixes</CardDescription>
                </div>
                <Button 
                  onClick={() => runErrorAnalysis.mutate()}
                  disabled={runErrorAnalysis.isPending}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Analyze Errors
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Errors</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead>Critical</TableHead>
                    <TableHead>Warnings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorReports?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{report.total_errors_found}</TableCell>
                      <TableCell>{report.grouped_errors_count}</TableCell>
                      <TableCell>
                        <Badge variant={report.critical_errors === 0 ? "default" : "destructive"}>
                          {report.critical_errors}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.warnings}</TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'completed' ? "default" : "secondary"}>
                          {report.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
