import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useDemoMode } from "@/context/DemoModeContext";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { ContractorDashboardToolbar } from "@/components/contractor/ContractorDashboardToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useContractorLeads } from "@/hooks/contractor/useContractorLeads";
import {
  Loader2,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Home,
  ChevronRight,
  Sparkles,
  CheckCircle,
  RefreshCw,
  Users,
  Plus,
  MapPin,
  ExternalLink,
  FolderKanban,
  Bell,
  HardHat,
} from "lucide-react";
import { useSubcontractorNotifications } from "@/hooks/useSubcontractorNotifications";
import { format, formatDistanceToNow } from "date-fns";
import { getDemoStats } from "@/utils/demoContractorData";
import { 
  useContractorStats, 
  useContractorActions, 
  useContractorSchedule, 
  useContractorProjects 
} from "@/hooks/useContractorDashboard";

export default function ContractorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode, demoContractor } = useDemoMode();
  
  // Fetch all dashboard data using custom hooks
  const { data: stats, isLoading: statsLoading } = useContractorStats();
  const { data: todaysActions = [], isLoading: actionsLoading } = useContractorActions();
  const { data: scheduleEvents = [], isLoading: scheduleLoading } = useContractorSchedule();
  const { data: projects = [], isLoading: projectsLoading } = useContractorProjects();
  
  // Subcontractor notifications
  const { notifications: subNotifications, unreadCount: subUnreadCount, markAsRead } = useSubcontractorNotifications();
  
  // Recent leads
  const { data: leadsData, isLoading: leadsLoading } = useContractorLeads();
  const recentLeads = leadsData?.slice(0, 5) || [];
  
  // Demo stats
  const demoStats = isDemoMode ? getDemoStats() : null;
  
  // AI Workflow Recommendations State
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    const checkContractorAccess = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "contractor",
        });

        if (!data) {
          toast({
            title: "Access Denied",
            description: "You don't have contractor access.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Error checking contractor access:", error);
        navigate("/");
      }
    };

    checkContractorAccess();
  }, [user, navigate, toast, isDemoMode]);

  const handleRefreshAIRecommendations = async () => {
    if (!user && !isDemoMode) return;
    
    setLoadingRecommendations(true);
    try {
      const { data: activeProjects } = await supabase
        .from('contractor_projects')
        .select('*')
        .eq('contractor_id', user?.id)
        .in('status', ['planning', 'in_progress', 'pending'])
        .limit(10);
      
      const { data: rfps } = await supabase
        .from('bid_opportunities')
        .select('*')
        .eq('status', 'open')
        .limit(10);
      
      const { data, error } = await supabase.functions.invoke('ai-contractor-workflow', {
        body: {
          contractorId: user?.id,
          activeProjects: activeProjects || [],
          rfps: rfps || [],
          messages: [],
          recentActivity: []
        }
      });

      if (error) throw error;

      setAiRecommendations(data);
      setCompletedTasks(new Set());
      
      toast({
        title: "Recommendations Updated",
        description: `Generated ${data.tasks?.length || 0} AI-powered tasks`,
      });
    } catch (error: any) {
      console.error('Error fetching AI recommendations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch recommendations",
        variant: "destructive",
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleToggleTask = (taskIndex: number) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskIndex)) {
      newCompleted.delete(taskIndex);
    } else {
      newCompleted.add(taskIndex);
    }
    setCompletedTasks(newCompleted);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 border-destructive/20";
      case "medium":
        return "bg-warning-muted border-warning/20";
      default:
        return "bg-success-muted border-success/20";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "medium":
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Home className="h-5 w-5 text-success" />;
    }
  };

  const getLeadStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      new: { bg: "bg-info-muted", text: "text-info" },
      contacted: { bg: "bg-warning-muted", text: "text-warning" },
      qualified: { bg: "bg-success-muted", text: "text-success" },
      proposal_sent: { bg: "bg-primary/10", text: "text-primary" },
      won: { bg: "bg-success-muted", text: "text-success" },
      lost: { bg: "bg-destructive/10", text: "text-destructive" },
    };
    const variant = variants[status] || { bg: "bg-muted", text: "text-muted-foreground" };
    return `${variant.bg} ${variant.text}`;
  };

  const getProjectStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      "in_progress": "bg-warning-muted text-warning border-warning/20",
      "planning": "bg-info-muted text-info border-info/20",
      "completed": "bg-success-muted text-success border-success/20",
      "pending": "bg-muted text-muted-foreground border-border",
    };
    return variants[status] || "bg-muted text-muted-foreground border-border";
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
    return `$${amount.toLocaleString()}`;
  };

  // Unified stats for display
  const unifiedStats = [
    {
      label: "Active Projects",
      value: stats?.activeProjects || projects.filter(p => p.status === 'in_progress').length || demoStats?.activeProjects || 0,
      subtext: `${stats?.newProjects || 0} new`,
      icon: FolderKanban,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Pending Bids",
      value: stats?.pendingBids || demoStats?.pendingBids || 0,
      subtext: `${stats?.successfulBids || 0} won`,
      icon: FileText,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      label: "Revenue",
      value: formatCurrency(stats?.revenue || demoStats?.totalRevenue || 0),
      subtext: "From accepted bids",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Notifications",
      value: (stats?.unreadNotifications || 0) + (stats?.unreadMessages || 0),
      subtext: `${stats?.unreadMessages || 0} messages`,
      icon: Bell,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  if (loading) {
    return (
      <ContractorLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      {/* Top Toolbar */}
      <ContractorDashboardToolbar />

      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Section (compact) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Welcome back, {isDemoMode ? demoContractor?.full_name?.split(' ')[0] : user?.user_metadata?.full_name?.split(' ')[0] || "Contractor"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Unified KPI Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))
          ) : (
            unifiedStats.map((stat) => (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.subtext}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Leads & Active Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Leads */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-primary" />
                  Recent Leads
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/contractor/leads')}
                  className="gap-1 text-xs"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : recentLeads.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No leads yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => navigate('/contractor/leads/new')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lead
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentLeads.map((lead) => (
                      <div 
                        key={lead.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/contractor/leads/${lead.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{lead.name}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getLeadStatusBadge(lead.status)}`}
                            >
                              {lead.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              {lead.project_type?.replace('_', ' ') || 'General'}
                            </span>
                            {lead.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {lead.location}
                              </span>
                            )}
                            <span>
                              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {lead.source && lead.source !== 'website' && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {lead.source === 'api' ? 'Partner' : lead.source}
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  Active Projects
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/contractor/projects')}
                  className="gap-1 text-xs"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <FolderKanban className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active projects</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projects.slice(0, 5).map((project) => (
                      <div 
                        key={project.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/contractor/projects?projectId=${project.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{project.title}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getProjectStatusBadge(project.status)}`}
                            >
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{project.location}</span>
                            <span>{project.value}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Actions (collapsible, only shows if has items) */}
            {todaysActions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Today's Actions
                    <Badge variant="secondary" className="ml-auto">{todaysActions.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {todaysActions.slice(0, 3).map((action) => (
                    <div
                      key={action.id}
                      className={`p-3 rounded-lg border ${getPriorityColor(action.priority)} flex items-center justify-between gap-3`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getPriorityIcon(action.priority)}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{action.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{action.subtitle}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        {action.buttonText}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Schedule & AI Recommendations */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-primary" />
                  Today's Schedule
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/contractor/calendar')}
                  className="text-xs"
                >
                  Calendar
                </Button>
              </CardHeader>
              <CardContent>
                {scheduleLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : scheduleEvents.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scheduleEvents.slice(0, 4).map((event) => (
                      <div key={event.id} className="border-l-2 border-primary pl-3">
                        <p className="text-xs text-muted-foreground">{event.time}</p>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.location}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Recommendations (compact) */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Insights
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshAIRecommendations}
                    disabled={loadingRecommendations}
                  >
                    {loadingRecommendations ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!aiRecommendations && !loadingRecommendations && (
                  <div className="text-center py-4">
                    <Sparkles className="h-8 w-8 text-primary mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-muted-foreground mb-3">
                      Get AI-powered recommendations
                    </p>
                    <Button size="sm" onClick={handleRefreshAIRecommendations}>
                      Generate
                    </Button>
                  </div>
                )}

                {loadingRecommendations && (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Analyzing...</p>
                  </div>
                )}

                {aiRecommendations && !loadingRecommendations && aiRecommendations.tasks && (
                  <div className="space-y-2">
                    {aiRecommendations.tasks.slice(0, 3).map((task: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 p-2 rounded-lg border bg-background text-sm ${
                          completedTasks.has(idx) ? 'opacity-60' : ''
                        }`}
                      >
                        <button onClick={() => handleToggleTask(idx)} className="mt-0.5 flex-shrink-0">
                          {completedTasks.has(idx) ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                          )}
                        </button>
                        <p className={`text-xs ${completedTasks.has(idx) ? 'line-through' : ''}`}>
                          {task.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subcontractor Notifications */}
            {subNotifications.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HardHat className="h-5 w-5 text-primary" />
                    Sub Notifications
                    {subUnreadCount > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {subUnreadCount}
                      </Badge>
                    )}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/contractor/subcontractor-portal')}
                    className="text-xs"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {subNotifications.slice(0, 4).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead.mutate(notification.id);
                        }
                        if (notification.link) {
                          navigate(notification.link);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Bell className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          !notification.is_read ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${
                            !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ContractorLayout>
  );
}
