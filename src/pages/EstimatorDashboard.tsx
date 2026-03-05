import React from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ClipboardList,
  FileEdit,
  ImageUp,
  Send,
  Users,
  Wand2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { useDashboardStats, useActionItems, useSchedule, useRecentActivity } from "@/hooks/useEstimatorDashboard";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// --------------- Main Page -----------------
export default function EstimatorDashboard() {
  const navigate = useNavigate();
  
  // Fetch all dashboard data using custom hooks
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: actionItems = [], isLoading: actionsLoading } = useActionItems();
  const { data: schedule = [], isLoading: scheduleLoading } = useSchedule();
  const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity();
  
  // Fetch current user profile
  const { data: profile } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      return data;
    },
  });
  
  const userName = profile?.full_name?.split(' ')[0] || "there";
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Import new snapshot component - kpis moved there
  const EstimatorSnapshotComponent = React.lazy(() => import('@/components/estimator/EstimatorSnapshot').then(m => ({ default: m.EstimatorSnapshot })));
  const EstimatorLeadsTableComponent = React.lazy(() => import('@/components/estimator/EstimatorLeadsTable').then(m => ({ default: m.EstimatorLeadsTable })));

  const kpis = [
    { label: "Active Leads", value: stats?.activeLeads ?? 0, delta: "New, contacted & qualified", icon: Users },
    { label: "Pending Estimates", value: stats?.pendingEstimates ?? 0, delta: "Awaiting approval", icon: ClipboardList },
    { label: "Approved Estimates", value: stats?.approvedEstimates ?? 0, delta: "Ready to proceed", icon: CheckCircle2 },
    { label: "Upcoming Walkthroughs", value: stats?.upcomingWalkthroughs ?? 0, delta: "Scheduled visits", icon: CalendarIcon },
  ];

  const getActionIcon = (type: string) => {
    switch (type) {
      case "estimate": return FileEdit;
      case "review": return ClipboardList;
      case "upload": return ImageUp;
      case "scope": return Wand2;
      default: return FileEdit;
    }
  };

  const getActionCta = (type: string) => {
    switch (type) {
      case "estimate": return "Prepare Estimate";
      case "review": return "Review";
      case "upload": return "Upload";
      case "scope": return "Generate";
      default: return "View";
    }
  };

  const handleActionClick = (action: typeof actionItems[0]) => {
    switch (action.type) {
      case "estimate":
        navigate(`/estimator/prepare-estimate/${action.leadId}`);
        break;
      case "review":
        navigate(`/estimator/review-lead/${action.leadId}`);
        break;
      case "upload":
        navigate(`/estimator/upload-photos/${action.walkthroughId}`);
        break;
      case "scope":
        navigate(`/estimator/generate-scope/${action.leadId}`);
        break;
    }
  };

// --------------- Utility Components -----------------
function StatCard({ label, value, delta, icon: Icon }: any) {
  return (
    <Card className="h-full">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-xl p-2 border">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{value}</span>
            <Badge variant="secondary" className="text-[10px]">{delta}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionItem({ icon: Icon, title, cta, onClick }: any) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="rounded-full h-8 w-8 flex items-center justify-center border">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 text-sm">{title}</div>
      <Button size="sm" variant="outline" onClick={onClick}>{cta}</Button>
    </div>
  );
}

function ScheduleItem({ time, title, address }: any) {
  return (
    <div className="py-3">
      <div className="text-xs text-muted-foreground">{time}</div>
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{address}</div>
    </div>
  );
}

function MessageItem({ name, text }: any) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">{text}</div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" className="h-8 px-2"><ReplyIcon /></Button>
        <Button size="sm" variant="ghost" className="h-8 px-2"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function ReplyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

// Main Component Render
  return (
    <EstimatorLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Breadcrumbs />
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold">{getGreeting()}, {userName}</h1>
          <div className="sm:ml-auto flex items-center gap-2">
            <Button variant="outline" className="gap-2"><CalendarIcon className="h-4 w-4" />{today}</Button>
            <Button className="gap-2" onClick={() => navigate("/estimator/generate-scope")}>
              <Wand2 className="h-4 w-4" />Generate Project Scope
            </Button>
          </div>
        </div>

        {/* KPI Row */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-24 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map((k) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <StatCard {...k} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left (Actions + Messages) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions Required</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {actionsLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading actions...</div>
                ) : actionItems.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>All caught up! No pending actions.</p>
                  </div>
                ) : (
                  actionItems.map((action) => (
                    <ActionItem 
                      key={action.id}
                      icon={getActionIcon(action.type)}
                      title={action.title}
                      cta={getActionCta(action.type)}
                      onClick={() => handleActionClick(action)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right (Schedule + Activity) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {scheduleLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading schedule...</div>
                ) : schedule.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No walkthroughs scheduled for today</p>
                  </div>
                ) : (
                  schedule.map((s) => (
                    <ScheduleItem key={s.id} {...s} />
                  ))
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate("/estimator/calendar")}>
                  Open Calendar
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activityLoading ? (
                  <div className="py-4 text-center text-muted-foreground text-sm">Loading activity...</div>
                ) : recentActivity.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((a) => (
                    <div key={a.id} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5" />
                      <div>
                        <div className="text-sm">{a.status}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EstimatorLayout>
  );
}
