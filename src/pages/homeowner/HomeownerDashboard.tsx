import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHomeownerProjects,
  getHomeownerStatus,
  getNextStep,
  HOMEOWNER_MILESTONES,
} from "@/hooks/useHomeownerData";
import { useRecentActivityForUser } from "@/hooks/useProjectActivityLog";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  MapPin,
  Calendar,
  MessageSquare,
  FolderOpen,
  ClipboardList,
  CheckCircle2,
  Circle,
  Bell,
  Wrench,
  FileText,
  Users,
  Clock,
  CalendarDays,
  CalendarCheck,
  FileEdit,
} from "lucide-react";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { DashboardInspirationSection } from "@/components/homeowner/DashboardInspirationSection";
import { HomeownerNotebook } from "@/components/homeowner/HomeownerNotebook";
import { IntakeStatusCard } from "@/components/homeowner/IntakeStatusCard";

const ACTIVITY_ICONS: Record<string, typeof Wrench> = {
  status_change: ArrowRight,
  daily_log: Wrench,
  contractor_selected: Users,
  file_upload: FileText,
  message: MessageSquare,
  bid_submitted: ClipboardList,
};

const TIME_SLOT_LABELS: Record<string, string> = {
  "10-11": "10:00 AM – 11:00 AM",
  "11-12": "11:00 AM – 12:00 PM",
  "12-1": "12:00 PM – 1:00 PM",
  "1-2": "1:00 PM – 2:00 PM",
  "2-3": "2:00 PM – 3:00 PM",
  "3-4": "3:00 PM – 4:00 PM",
  "4-5": "4:00 PM – 5:00 PM",
  "6-7": "6:00 PM – 7:00 PM",
  "7-8": "7:00 PM – 8:00 PM",
};

function useSiteVisitAppointments() {
  return useQuery({
    queryKey: ["site-visit-appointments"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("site_visit_appointments")
        .select("*")
        .eq("homeowner_id", user.id)
        .eq("status", "scheduled")
        .order("appointment_date", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    retry: 1,
  });
}

export default function HomeownerDashboard() {
  const { data: projects, isLoading } = useHomeownerProjects();
  const { data: recentActivity } = useRecentActivityForUser(5);
  const { data: unreadNotifs } = useUnreadNotificationCount();
  const { data: appointments } = useSiteVisitAppointments();
  const navigate = useNavigate();

  const activeProject = projects?.[0];
  const status = activeProject ? getHomeownerStatus(activeProject.status || "intake") : null;
  const nextStep = activeProject ? getNextStep(activeProject.status || "intake") : "";
  const progressPercent = status ? Math.round((status.step / (HOMEOWNER_MILESTONES.length - 1)) * 100) : 0;

  console.log("[HomeownerDashboard] projects from useHomeownerProjects", projects);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Here's the latest on your renovation.</p>
        </div>
        <div className="flex items-center gap-2">
          {(unreadNotifs ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/homeowner/notifications")}
              className="gap-2"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifs} unread
            </Button>
          )}
          <Button size="sm" className="gap-2" onClick={() => navigate("/homeowner-intake")}>
            <ArrowRight className="h-4 w-4" />
            Start Your Renovation
          </Button>
        </div>
      </div>

      {/* Upcoming Site Visit */}
      {appointments && appointments.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Upcoming Site Visit</p>
                <p className="text-lg font-semibold text-foreground mt-0.5">
                  SmartReno Construction Agent Visit
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(parseISO((appointments[0] as any).appointment_date), "EEEE, MMMM d")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {TIME_SLOT_LABELS[(appointments[0] as any).appointment_time] || (appointments[0] as any).appointment_time}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeProject ? (
        <>
          {/* Active Project Card */}
          <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    {activeProject.project_type || "Renovation Project"}
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{activeProject.address || "Address pending"}</span>
                  </div>
                  {activeProject.estimated_completion && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Est. completion: {new Date(activeProject.estimated_completion).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <Badge className="self-start bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                  {status?.label}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                
                {/* Milestone dots */}
                <div className="flex justify-between mt-2">
                  {HOMEOWNER_MILESTONES.map((milestone, i) => (
                    <div key={milestone} className="flex flex-col items-center" style={{ width: `${100 / HOMEOWNER_MILESTONES.length}%` }}>
                      {i <= (status?.step || 0) ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/30" />
                      )}
                      <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight hidden md:block">
                        {milestone}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What Happens Next */}
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs font-medium text-primary mb-1">What Happens Next</p>
                <p className="text-sm text-foreground">{nextStep}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Project", icon: ArrowRight, action: () => navigate(`/homeowner/projects/${activeProject.id}/overview`) },
              { label: "Messages", icon: MessageSquare, action: () => navigate(`/homeowner/projects/${activeProject.id}/messages`) },
              { label: "Files", icon: FolderOpen, action: () => navigate(`/homeowner/projects/${activeProject.id}/files`) },
              { label: "Proposals", icon: ClipboardList, action: () => navigate(`/homeowner/projects/${activeProject.id}/proposals`) },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:bg-muted/50"
                onClick={action.action}
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>

          {/* Recent Activity Feed */}
          {recentActivity && recentActivity.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-medium text-foreground">Recent Updates</h3>
                <div className="space-y-3">
                  {recentActivity.map((activity: any) => {
                    const Icon = ACTIVITY_ICONS[activity.activity_type] || ArrowRight;
                    return (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <FallbackIntakeProjectCard />
      )}

      {/* Next Steps: Schedule Visit or Complete Project Details (intake-only path) */}
      {!activeProject && <NextStepsCard />}

      {/* Notebook */}
      <HomeownerNotebook />

      {/* Inspiration & Materials Section - always visible */}
      <DashboardInspirationSection />
    </div>
  );
}

function NextStepsCard() {
  const navigate = useNavigate();
  const { data: intakeProject, isLoading: loadingIntake } = useQuery({
    queryKey: ["homeowner-intake-next-step"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("id, scheduled_visit_at, visit_confirmed")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    staleTime: 30000,
    retry: 1,
  });

  const { data: projectDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["homeowner-project-details-check", intakeProject?.id],
    enabled: !!intakeProject?.id && intakeProject?.visit_confirmed === true,
    queryFn: async () => {
      if (!intakeProject?.id) return null;
      const { data } = await supabase
        .from("project_details")
        .select("id")
        .eq("project_id", intakeProject.id)
        .maybeSingle();
      return data;
    },
    staleTime: 30000,
    retry: 1,
  });

  if (loadingIntake || !intakeProject) return null;
  if (intakeProject.visit_confirmed !== true) {
    return (
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Schedule Your Site Visit</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Choose a time for our estimator to visit your home and review your project.
              </p>
            </div>
          </div>
          <Button
            className="gap-2 flex-shrink-0"
            onClick={() => navigate("/homeowner/schedule-visit")}
          >
            Schedule Visit
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (loadingDetails) return null;
  if (!projectDetails) {
    return (
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileEdit className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Provide Additional Project Details</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Help our estimators prepare by sharing room dimensions, materials, and inspiration.
              </p>
            </div>
          </div>
          <Button
            className="gap-2 flex-shrink-0"
            onClick={() => navigate("/homeowner/project-details")}
          >
            Complete Details
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }
  return null;
}

function FallbackIntakeProjectCard() {
  const navigate = useNavigate();
  const { data: fallbackProject, isLoading } = useQuery({
    queryKey: ["homeowner-intake-project-fallback"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("projects")
        .select("project_name, project_type, created_at, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[FallbackIntakeProjectCard] projects fallback error", error);
        return null;
      }
      console.log("[FallbackIntakeProjectCard] projects fallback result", data);
      return data;
    },
    staleTime: 30000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card className="border border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Checking your renovation request…</h3>
            <p className="text-xs text-muted-foreground">
              We’re looking for any recent project requests linked to your account.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fallbackProject) {
    return (
      <Card className="border border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Start Your First Project</h3>
            <p className="text-xs text-muted-foreground">
              Tell us about your renovation and we'll guide the next steps.
            </p>
          </div>
          <Button
          size="sm"
          className="gap-1.5 flex-shrink-0"
          onClick={() => navigate("/homeowner-intake")}
          >
            Start Your Renovation
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <IntakeStatusCard project={fallbackProject as any} />
  );
}
