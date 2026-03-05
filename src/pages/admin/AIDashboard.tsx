import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, TrendingUp, Link, Bug, FileText, Bot } from "lucide-react";
import SiteHealthCopilot from "@/components/admin/SiteHealthCopilot";

export default function AIDashboard() {
  // Fetch latest reports for overview
  const { data: latestReports } = useQuery({
    queryKey: ['latest-ai-reports'],
    queryFn: async () => {
      const [seo, performance, redirect, error, content] = await Promise.all([
        supabase.from('ai_seo_reports').select('*').order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('ai_performance_reports').select('*').order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('ai_redirect_reports').select('*').order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('ai_error_log_reports').select('*').order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('ai_content_reports').select('*').order('created_at', { ascending: false }).limit(1).single(),
      ]);

      return {
        seo: seo.data,
        performance: performance.data,
        redirect: redirect.data,
        error: error.data,
        content: content.data,
      };
    }
  });

  const performanceScore = latestReports?.performance?.average_performance_score || 0;
  const brokenLinks = latestReports?.redirect?.broken_links_found || 0;
  const criticalErrors = latestReports?.error?.critical_errors || 0;
  const seoRecommendations = latestReports?.seo?.recommendations_count || 0;
  const contentIdeas = latestReports?.content?.ideas_generated || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Maintenance Dashboard</h1>
          <p className="text-muted-foreground">Automated site monitoring and optimization</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScore}/100</div>
            <p className="text-xs text-muted-foreground">Avg score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Broken Links</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brokenLinks}</div>
            <p className="text-xs text-muted-foreground">Need fixing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalErrors}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SEO Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seoRecommendations}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Ideas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentIdeas}</div>
            <p className="text-xs text-muted-foreground">To review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="copilot" className="space-y-4">
        <TabsList>
          <TabsTrigger value="copilot">
            <Bot className="h-4 w-4 mr-2" />
            AI Copilot
          </TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="copilot" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SiteHealthCopilot />
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Example Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm p-2 bg-muted rounded">
                    "Why did my performance score drop?"
                  </div>
                  <div className="text-sm p-2 bg-muted rounded">
                    "What broken links need fixing?"
                  </div>
                  <div className="text-sm p-2 bg-muted rounded">
                    "Show me critical errors from this week"
                  </div>
                  <div className="text-sm p-2 bg-muted rounded">
                    "Which SEO pages need updates?"
                  </div>
                  <div className="text-sm p-2 bg-muted rounded">
                    "What content should I create next?"
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {latestReports?.performance && (
                      <div className="flex items-start gap-2">
                        <Activity className="h-4 w-4 mt-0.5 text-primary" />
                        <div>
                          <div className="font-medium">Performance Audit</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(latestReports.performance.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                    {latestReports?.seo && (
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
                        <div>
                          <div className="font-medium">SEO Review</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(latestReports.seo.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                    {latestReports?.error && (
                      <div className="flex items-start gap-2">
                        <Bug className="h-4 w-4 mt-0.5 text-primary" />
                        <div>
                          <div className="font-medium">Error Analysis</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(latestReports.error.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health Summary</CardTitle>
                <CardDescription>Current status across all monitoring systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Performance Score</span>
                  <span className="font-bold">{performanceScore}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">SEO Health</span>
                  <span className="font-bold">{seoRecommendations} tasks</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Link Health</span>
                  <span className="font-bold">{brokenLinks} broken</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Error Rate</span>
                  <span className="font-bold">{criticalErrors} critical</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Automation Status</CardTitle>
                <CardDescription>Automated monitoring and maintenance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">SEO Monitoring</span>
                  <span className="text-xs text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Performance Audits</span>
                  <span className="text-xs text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Link Checker</span>
                  <span className="text-xs text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Detection</span>
                  <span className="text-xs text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Content Pipeline</span>
                  <span className="text-xs text-green-600">Active</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Quick actions will be available here. For now, use the AI Copilot to get help with specific tasks, 
                or navigate to the detailed dashboards:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>SEO Management: /admin/seo-management</li>
                <li>Performance Audits: /admin/ai-maintenance</li>
                <li>Retargeting: /admin/retargeting</li>
                <li>Contractor Acquisition: /admin/contractor-acquisition</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
