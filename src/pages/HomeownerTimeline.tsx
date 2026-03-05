import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, Calendar, Clock, CheckCircle, AlertCircle, Home, Package, Wrench, Zap, Droplet, Wind, Hammer, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, isBefore, isToday } from "date-fns";

interface Project {
  id: string;
  contractor_id: string;
  project_name: string;
  client_name: string;
  location: string;
  project_type: string;
  status: string;
  deadline: string | null;
  created_at: string;
  estimated_value: number | null;
  description: string | null;
}

interface Task {
  id: string;
  task_name: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: string;
  color: string;
  completed: boolean;
}

interface Milestone {
  id: string;
  milestone_name: string;
  milestone_date: string;
  milestone_type: string;
  description: string | null;
  icon_name: string | null;
  completed: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  notification_type: string;
}

export default function HomeownerTimeline() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('contractor_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_date', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);

      // Fetch recent notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('project_notifications')
        .select('id, title, message, created_at, notification_type')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);
    } catch (error: any) {
      console.error('Error fetching project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string | null) => {
    const iconMap: Record<string, any> = {
      'Zap': Zap,
      'Droplet': Droplet,
      'Wind': Wind,
      'Hammer': Hammer,
      'Package': Package,
      'CheckCircle': CheckCircle,
      'Flag': Flag,
      'Wrench': Wrench,
    };
    return iconMap[iconName || 'Flag'] || Flag;
  };

  const getOverallProgress = () => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  };

  const getUpcomingMilestones = () => {
    const today = new Date();
    return milestones
      .filter(m => !m.completed && isAfter(new Date(m.milestone_date), today))
      .slice(0, 5);
  };

  const getCompletedTasks = () => {
    return tasks.filter(t => t.completed).length;
  };

  const getDaysUntilDeadline = () => {
    if (!project?.deadline) return null;
    return differenceInDays(new Date(project.deadline), new Date());
  };

  const getTimelinePhase = () => {
    const progress = getOverallProgress();
    if (progress < 25) return { phase: 'Planning & Preparation', color: 'text-blue-500' };
    if (progress < 50) return { phase: 'Early Construction', color: 'text-yellow-500' };
    if (progress < 75) return { phase: 'Mid Construction', color: 'text-orange-500' };
    if (progress < 100) return { phase: 'Final Phases', color: 'text-purple-500' };
    return { phase: 'Project Complete', color: 'text-green-500' };
  };

  const getDaysInView = () => {
    const start = startOfMonth(viewMonth);
    const end = endOfMonth(viewMonth);
    return eachDayOfInterval({ start, end });
  };

  const getTaskPosition = (task: Task, days: Date[]) => {
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    
    const taskStart = new Date(task.start_date) < firstDay ? firstDay : new Date(task.start_date);
    const taskEnd = new Date(task.end_date) > lastDay ? lastDay : new Date(task.end_date);
    
    const startIndex = differenceInDays(taskStart, firstDay);
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    
    return {
      left: `${(startIndex / days.length) * 100}%`,
      width: `${(duration / days.length) * 100}%`,
    };
  };

  const getMilestonePosition = (milestone: Milestone, days: Date[]) => {
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    const milestoneDate = new Date(milestone.milestone_date);
    
    if (milestoneDate < firstDay || milestoneDate > lastDay) {
      return null;
    }
    
    const dayIndex = differenceInDays(milestoneDate, firstDay);
    return {
      left: `${(dayIndex / days.length) * 100}%`,
    };
  };

  const timelinePhase = getTimelinePhase();
  const days = getDaysInView();
  const overallProgress = getOverallProgress();
  const upcomingMilestones = getUpcomingMilestones();
  const completedTasks = getCompletedTasks();
  const daysUntilDeadline = getDaysUntilDeadline();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>
              The project you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={smartRenoLogo} alt="SmartReno" className="h-8" />
            <div className="hidden md:block">
              <h1 className="font-semibold text-lg">{project.project_name}</h1>
              <p className="text-xs text-muted-foreground">{project.client_name}</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-2">
            <Home className="h-3 w-3" />
            Homeowner View
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Project Overview */}
        <div>
          <h2 className="text-3xl font-bold mb-2">Your Project Timeline</h2>
          <p className="text-muted-foreground">
            Track your renovation progress and stay updated on upcoming milestones
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold">{overallProgress}%</div>
                <Progress value={overallProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {completedTasks} of {tasks.length} tasks completed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${timelinePhase.color}`}>
                {timelinePhase.phase}
              </div>
              <Badge variant="outline" className="mt-2">{project.status.replace('_', ' ').toUpperCase()}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  {daysUntilDeadline !== null ? (
                    <>
                      <div className="text-2xl font-bold">{daysUntilDeadline}</div>
                      <p className="text-xs text-muted-foreground">days remaining</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No deadline set</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{upcomingMilestones.length}</div>
              <p className="text-xs text-muted-foreground">
                Next: {upcomingMilestones[0]?.milestone_name || 'None scheduled'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Timeline Visualization */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Timeline</CardTitle>
                  <CardDescription>Visual representation of your project schedule</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(viewMonth, 'MMMM yyyy')}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {/* Timeline Header */}
                <div className="flex border-b mb-4 pb-2">
                  <div className="w-48 font-semibold text-sm">Task</div>
                  <div className="flex-1 flex">
                    {days.map((day, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 text-center text-xs ${
                          isToday(day) ? 'text-primary font-bold' : 'text-muted-foreground'
                        }`}
                        style={{ minWidth: '30px' }}
                      >
                        {format(day, 'd')}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Rows */}
                <div className="space-y-4 relative">
                  {/* Milestone markers */}
                  <div className="absolute inset-0 pointer-events-none">
                    {milestones.map((milestone) => {
                      const position = getMilestonePosition(milestone, days);
                      if (!position) return null;

                      const MilestoneIcon = getIconComponent(milestone.icon_name);
                      const typeColors = {
                        trade: 'bg-blue-500',
                        delivery: 'bg-orange-500',
                        inspection: 'bg-purple-500',
                        major: 'bg-green-500',
                      };

                      return (
                        <div
                          key={milestone.id}
                          className="absolute top-0 bottom-0"
                          style={{ left: position.left }}
                        >
                          <div className="relative h-full flex flex-col items-center">
                            <div className={`w-0.5 h-full ${milestone.completed ? 'bg-muted-foreground/30' : typeColors[milestone.milestone_type as keyof typeof typeColors]}`} />
                            <div 
                              className={`absolute -top-1 ${typeColors[milestone.milestone_type as keyof typeof typeColors]} rounded-full p-1.5 ${milestone.completed ? 'opacity-50' : ''}`}
                              title={`${milestone.milestone_name}\n${milestone.description || ''}\n${format(new Date(milestone.milestone_date), 'MMM dd, yyyy')}`}
                            >
                              <MilestoneIcon className="h-3 w-3 text-white" />
                            </div>
                            <div className="absolute -top-8 whitespace-nowrap text-xs font-medium">
                              <div className={`px-2 py-1 rounded ${typeColors[milestone.milestone_type as keyof typeof typeColors]} text-white ${milestone.completed ? 'line-through opacity-50' : ''}`}>
                                {milestone.milestone_name}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {tasks.map((task) => {
                    const position = getTaskPosition(task, days);
                    return (
                      <div key={task.id} className="flex items-center">
                        <div className="w-48 text-sm font-medium truncate pr-4">
                          {task.task_name}
                        </div>
                        <div className="flex-1 relative h-8 bg-muted/30 rounded">
                          <div
                            className={`absolute h-full ${task.color} rounded flex items-center justify-center text-white text-xs font-medium ${
                              task.completed ? 'opacity-60' : 'opacity-90'
                            }`}
                            style={{
                              left: position.left,
                              width: position.width,
                            }}
                            title={`${format(new Date(task.start_date), 'MMM dd')} - ${format(new Date(task.end_date), 'MMM dd')}`}
                          >
                            {task.progress}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar - Milestones & Updates */}
          <div className="space-y-6">
            {/* Upcoming Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Upcoming Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {upcomingMilestones.length > 0 ? (
                      upcomingMilestones.map((milestone) => {
                        const MilestoneIcon = getIconComponent(milestone.icon_name);
                        const typeColors = {
                          trade: 'text-blue-500 bg-blue-500/10',
                          delivery: 'text-orange-500 bg-orange-500/10',
                          inspection: 'text-purple-500 bg-purple-500/10',
                          major: 'text-green-500 bg-green-500/10',
                        };

                        return (
                          <div
                            key={milestone.id}
                            className={`p-3 border rounded-lg ${typeColors[milestone.milestone_type as keyof typeof typeColors]}`}
                          >
                            <div className="flex items-start gap-3">
                              <MilestoneIcon className={`h-5 w-5 mt-0.5 ${typeColors[milestone.milestone_type as keyof typeof typeColors].split(' ')[0]}`} />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{milestone.milestone_name}</div>
                                {milestone.description && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {milestone.description}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(milestone.milestone_date), 'MMM dd, yyyy')}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No upcoming milestones
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div key={notification.id} className="border-l-2 border-primary pl-3 py-2">
                          <div className="font-medium text-sm">{notification.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(notification.created_at), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent updates
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Task Progress List */}
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>Detailed breakdown of project tasks and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50">
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.task_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(task.start_date), 'MMM dd')} - {format(new Date(task.end_date), 'MMM dd')}
                    </div>
                  </div>
                  <div className="w-32">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>{task.progress}%</span>
                      <Badge variant={task.completed ? 'default' : 'secondary'} className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                    <Progress value={task.progress} className="h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
