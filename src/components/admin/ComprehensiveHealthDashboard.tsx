import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  FileText,
  Link2,
  Gauge,
  Bug,
  Lightbulb
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ComprehensiveHealthDashboard() {
  // Fetch latest reports from all AI modules
  const { data: seoReport } = useQuery({
    queryKey: ['latest-seo-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_seo_reports')
        .select('*, ai_seo_recommendations(count)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: redirectReport } = useQuery({
    queryKey: ['latest-redirect-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_redirect_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: perfReport } = useQuery({
    queryKey: ['latest-perf-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_performance_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: errorReport } = useQuery({
    queryKey: ['latest-error-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_error_log_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: contentReport } = useQuery({
    queryKey: ['latest-content-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_content_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: criticalIssues } = useQuery({
    queryKey: ['critical-issues'],
    queryFn: async () => {
      const [seoCount, perfCount, errorCount] = await Promise.all([
        supabase
          .from('ai_seo_recommendations')
          .select('*', { count: 'exact', head: true })
          .eq('priority', 'high')
          .eq('status', 'pending'),
        supabase
          .from('ai_performance_recommendations')
          .select('*', { count: 'exact', head: true })
          .eq('impact', 'high')
          .eq('status', 'pending'),
        supabase
          .from('ai_error_groups')
          .select('*', { count: 'exact', head: true })
          .in('severity', ['critical', 'high'])
          .eq('status', 'new'),
      ]);

      return {
        seo: seoCount.count || 0,
        performance: perfCount.count || 0,
        errors: errorCount.count || 0,
      };
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return { icon: CheckCircle2, text: 'Excellent', variant: 'default' as const };
    if (score >= 75) return { icon: Clock, text: 'Good', variant: 'secondary' as const };
    return { icon: AlertCircle, text: 'Needs Work', variant: 'destructive' as const };
  };

  const overallHealth = Math.round(
    ((perfReport?.average_performance_score || 0) +
     (perfReport?.average_seo_score || 0) +
     (perfReport?.average_accessibility_score || 0)) / 3
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Website Health Overview
        </CardTitle>
        <CardDescription>
          Real-time insights from AI maintenance systems
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overall Health Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Overall Health Score</h3>
                <Badge variant={getScoreStatus(overallHealth).variant}>
                  {getScoreStatus(overallHealth).text}
                </Badge>
              </div>
              <div className="space-y-2">
                <Progress value={overallHealth} className="h-3" />
                <p className={`text-3xl font-bold ${getScoreColor(overallHealth)}`}>
                  {overallHealth}%
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">SEO</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {seoReport?.recommendations_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recommendations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Links</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {redirectReport?.broken_links_found || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Broken Links
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {errorReport?.grouped_errors_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Error Groups
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Content</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {contentReport?.ideas_generated || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Content Ideas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Speed</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {perfReport?.average_performance_score || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Performance Score
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Critical</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {(criticalIssues?.seo || 0) + (criticalIssues?.performance || 0) + (criticalIssues?.errors || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Priority Issues
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Performance Score</p>
                  <span className={`text-lg font-bold ${getScoreColor(perfReport?.average_performance_score || 0)}`}>
                    {perfReport?.average_performance_score || 0}
                  </span>
                </div>
                <Progress value={perfReport?.average_performance_score || 0} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">SEO Score</p>
                  <span className={`text-lg font-bold ${getScoreColor(perfReport?.average_seo_score || 0)}`}>
                    {perfReport?.average_seo_score || 0}
                  </span>
                </div>
                <Progress value={perfReport?.average_seo_score || 0} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Accessibility Score</p>
                  <span className={`text-lg font-bold ${getScoreColor(perfReport?.average_accessibility_score || 0)}`}>
                    {perfReport?.average_accessibility_score || 0}
                  </span>
                </div>
                <Progress value={perfReport?.average_accessibility_score || 0} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Best Practices Score</p>
                  <span className={`text-lg font-bold ${getScoreColor(perfReport?.average_best_practices_score || 0)}`}>
                    {perfReport?.average_best_practices_score || 0}
                  </span>
                </div>
                <Progress value={perfReport?.average_best_practices_score || 0} />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {perfReport?.pages_audited || 0} pages audited • {perfReport?.issues_found || 0} issues found
                </p>
                {perfReport?.completed_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {new Date(perfReport.completed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <div className="space-y-4">
              {/* Critical Issues */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold">Critical Issues</h3>
                    </div>
                    <Badge variant="destructive">
                      {(criticalIssues?.seo || 0) + (criticalIssues?.performance || 0) + (criticalIssues?.errors || 0)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Priority SEO</span>
                      <Badge variant="outline">{criticalIssues?.seo || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Impact Performance</span>
                      <Badge variant="outline">{criticalIssues?.performance || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Critical Errors</span>
                      <Badge variant="outline">{criticalIssues?.errors || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trends */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {seoReport && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="text-sm">
                          SEO analysis completed with {seoReport.recommendations_count} recommendations
                        </p>
                      </div>
                    )}
                    {redirectReport && (
                      <div className="flex items-center gap-2">
                        {redirectReport.broken_links_found > 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <p className="text-sm">
                          {redirectReport.broken_links_found > 0 
                            ? `Found ${redirectReport.broken_links_found} broken links`
                            : 'No broken links found'}
                        </p>
                      </div>
                    )}
                    {errorReport && (
                      <div className="flex items-center gap-2">
                        {errorReport.critical_errors > 0 ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <p className="text-sm">
                          {errorReport.critical_errors > 0
                            ? `${errorReport.critical_errors} critical errors detected`
                            : 'No critical errors'}
                        </p>
                      </div>
                    )}
                    {contentReport && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <p className="text-sm">
                          Generated {contentReport.ideas_generated} content ideas
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
