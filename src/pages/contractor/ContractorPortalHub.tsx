import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePortalPreviewStats } from "@/hooks/usePortalPreviewStats";
import { PortalSectionCard } from "@/components/contractor/PortalSectionCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  DollarSign,
  FolderKanban,
  Users,
  FolderOpen,
  MessageSquare,
  Plus,
  Calendar,
  LayoutDashboard,
  Sparkles,
  Zap
} from "lucide-react";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoStats } from "@/utils/demoContractorData";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";

export default function ContractorPortalHub() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const { data: stats, isLoading: statsLoading } = usePortalPreviewStats();
  const [userName, setUserName] = useState<string>("");

  // Demo stats
  const demoStats = isDemoMode ? getDemoStats() : null;
  const isLoading = isDemoMode ? false : statsLoading;

  useEffect(() => {
    if (isDemoMode) {
      setUserName("Demo User");
      return;
    }
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        setUserName(profile?.full_name || user.email?.split('@')[0] || 'there');
      }
    };
    fetchUserName();
  }, [isDemoMode]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const effectiveStats = isDemoMode ? {
    salesPipeline: { activeLeads: demoStats?.pendingBids || 12, totalValue: demoStats?.totalRevenue || 485000 },
    collections: { pendingAmount: 32500, dueThisWeek: 3 },
    projects: { activeProjects: demoStats?.activeProjects || 8, startingSoon: 2 },
    team: { totalMembers: demoStats?.teamMembers || 15, activeToday: 12 },
    files: { totalFiles: 156, recentUploads: 8 },
    messages: { unreadCount: 5, urgentCount: 2 }
  } : stats;

  const sections = [
    {
      title: "Sales Pipeline",
      icon: TrendingUp,
      href: "/contractor/sales-pipeline",
      accentColor: "bg-blue-500",
      stats: [
        { label: "Active Leads", value: effectiveStats?.salesPipeline.activeLeads || 0 },
        { label: "Pipeline Value", value: formatCurrency(effectiveStats?.salesPipeline.totalValue || 0) }
      ]
    },
    {
      title: "Collections",
      icon: DollarSign,
      href: "/contractor/collections",
      accentColor: "bg-green-500",
      notificationCount: effectiveStats?.collections.dueThisWeek || 0,
      stats: [
        { label: "Pending Amount", value: formatCurrency(effectiveStats?.collections.pendingAmount || 0) },
        { label: "Due This Week", value: effectiveStats?.collections.dueThisWeek || 0 }
      ]
    },
    {
      title: "Projects",
      icon: FolderKanban,
      href: "/contractor/projects",
      accentColor: "bg-purple-500",
      stats: [
        { label: "Active Projects", value: effectiveStats?.projects.activeProjects || 0 },
        { label: "Starting Soon", value: effectiveStats?.projects.startingSoon || 0 }
      ]
    },
    {
      title: "Team",
      icon: Users,
      href: "/contractor/team",
      accentColor: "bg-orange-500",
      stats: [
        { label: "Team Members", value: effectiveStats?.team.totalMembers || 0 },
        { label: "Active Today", value: effectiveStats?.team.activeToday || 0 }
      ]
    },
    {
      title: "Files & Photos",
      icon: FolderOpen,
      href: "/contractor/files",
      accentColor: "bg-cyan-500",
      stats: [
        { label: "Total Files", value: effectiveStats?.files.totalFiles || 0 },
        { label: "Recent Uploads", value: effectiveStats?.files.recentUploads || 0 }
      ]
    },
    {
      title: "Messages",
      icon: MessageSquare,
      href: "/contractor/messages",
      accentColor: "bg-pink-500",
      notificationCount: effectiveStats?.messages.unreadCount || 0,
      stats: [
        { label: "Recent Messages", value: effectiveStats?.messages.unreadCount || 0 },
        { label: "Urgent", value: effectiveStats?.messages.urgentCount || 0 }
      ]
    }
  ];

  return (
    <ContractorLayout>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {userName}!
            </h1>
          </div>
          <p className="text-muted-foreground">{today}</p>
        </div>

        {/* Section Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[180px] w-full rounded-lg" />
              </div>
            ))
          ) : (
            sections.map((section) => (
              <PortalSectionCard
                key={section.title}
                title={section.title}
                icon={section.icon}
                stats={section.stats}
                href={section.href}
                accentColor={section.accentColor}
                notificationCount={section.notificationCount}
              />
            ))
          )}
        </div>

        {/* Quick Actions Bar */}
        <div className="border-t pt-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" /> Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/contractor/leads/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
            <Button onClick={() => navigate('/contractor/projects/new')} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
            <Button onClick={() => navigate('/contractor/calendar')} variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              View Calendar
            </Button>
            <Button onClick={() => navigate('/contractor/dashboard')} variant="outline" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Full Dashboard
            </Button>
          </div>
        </div>
      </div>
    </ContractorLayout>
  );
}
