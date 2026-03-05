import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoForemanTasks } from "@/utils/demoContractorData";

export default function ForemanPortal() {
  const { isDemoMode } = useDemoMode();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["foreman-tasks", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoForemanTasks();
      }

      const { data, error } = await supabase
        .from("foreman_tasks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const pendingTasks = tasks?.filter(t => t.status === "pending") || [];
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];
  const blockedTasks = tasks?.filter(t => t.status === "blocked") || [];

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Foreman Portal</h1>
          <p className="text-muted-foreground">Manage field operations and crew tasks</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{blockedTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Task Lists */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="blocked">Blocked</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : pendingTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No pending tasks
                </CardContent>
              </Card>
            ) : (
              pendingTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{task.task_title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                      </div>
                      <Badge variant={task.priority === "high" ? "destructive" : "outline"}>
                        {task.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {task.location && <span>📍 {task.location}</span>}
                      </div>
                      <Button size="sm">Start Task</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            {inProgressTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No tasks in progress
                </CardContent>
              </Card>
            ) : (
              inProgressTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <CardTitle>{task.task_title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" variant="outline">Complete Task</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No completed tasks
                </CardContent>
              </Card>
            ) : (
              completedTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <CardTitle>{task.task_title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="blocked" className="space-y-4">
            {blockedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No blocked tasks
                </CardContent>
              </Card>
            ) : (
              blockedTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <CardTitle>{task.task_title}</CardTitle>
                    <CardDescription className="text-destructive">
                      {task.blocked_reason}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ContractorLayout>
  );
}
