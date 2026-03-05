import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Activity, CheckCircle, XCircle, Clock, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function AIOverview() {
  const { data: agentActivity, isLoading } = useQuery({
    queryKey: ["ai-agent-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const agentStatus = [
    { name: "Smart Intake", status: "online", lastRun: "2 min ago", totalRuns: 142, successRate: 98.5 },
    { name: "Smart QA", status: "online", lastRun: "5 min ago", totalRuns: 89, successRate: 94.2 },
    { name: "Smart Estimate", status: "online", lastRun: "10 min ago", totalRuns: 67, successRate: 96.8 },
    { name: "Contractor Intake", status: "online", lastRun: "1 hour ago", totalRuns: 34, successRate: 91.5 },
    { name: "Timeline Generator", status: "online", lastRun: "30 min ago", totalRuns: 45, successRate: 88.9 },
    { name: "Permit Assistant", status: "online", lastRun: "45 min ago", totalRuns: 28, successRate: 95.3 },
    { name: "Warranty Triage", status: "online", lastRun: "15 min ago", totalRuns: 56, successRate: 93.7 },
  ];

  const metrics = {
    totalProcessed: 461,
    avgProcessingTime: "2.3s",
    successRate: 94.3,
    costSavings: "$12,450",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            AI Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Central visibility of all SmartReno AI activity
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Processed</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.totalProcessed}
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Processing Time</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.avgProcessingTime}
                <Zap className="h-5 w-5 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Per request</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.successRate}%
                <CheckCircle className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">All agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cost Savings</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.costSavings}
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList>
            <TabsTrigger value="status">Agent Status</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agentStatus.map((agent) => (
                <Card key={agent.name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      {agent.name}
                      {agent.status === "online" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      Last run: {agent.lastRun}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Runs:</span>
                      <span className="font-medium">{agent.totalRuns}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="font-medium">{agent.successRate}%</span>
                    </div>
                    <Badge variant={agent.status === "online" ? "default" : "destructive"} className="w-full justify-center">
                      {agent.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent AI Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading activity...</p>
                ) : agentActivity && agentActivity.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentActivity.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">{activity.agent_type}</TableCell>
                          <TableCell>{activity.user_role}</TableCell>
                          <TableCell>
                            <Badge variant={
                              activity.status === "completed" ? "default" :
                              activity.status === "pending" ? "secondary" :
                              activity.status === "approved" ? "default" : "destructive"
                            }>
                              {activity.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(activity.created_at || ""), "MMM dd, HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">View</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Settings</CardTitle>
                <CardDescription>
                  Enable or disable AI autofill for specific workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="intake-ai" className="font-medium">Smart Intake Autofill</Label>
                    <p className="text-sm text-muted-foreground">Automatically extract project data from homeowner submissions</p>
                  </div>
                  <Switch id="intake-ai" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="estimate-ai" className="font-medium">Smart Estimate Suggestions</Label>
                    <p className="text-sm text-muted-foreground">AI-powered line item suggestions for estimates</p>
                  </div>
                  <Switch id="estimate-ai" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="contractor-ai" className="font-medium">Contractor Data Extraction</Label>
                    <p className="text-sm text-muted-foreground">Extract contractor info from websites and profiles</p>
                  </div>
                  <Switch id="contractor-ai" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="timeline-ai" className="font-medium">Timeline Auto-generation</Label>
                    <p className="text-sm text-muted-foreground">Generate project timelines automatically</p>
                  </div>
                  <Switch id="timeline-ai" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="warranty-ai" className="font-medium">Warranty Triage</Label>
                    <p className="text-sm text-muted-foreground">Automatically classify and route warranty claims</p>
                  </div>
                  <Switch id="warranty-ai" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
