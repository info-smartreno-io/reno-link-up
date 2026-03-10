import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Home,
  ClipboardList,
  Users,
  Calendar,
  BarChart3,
  TrendingUp,
  Wand2,
  LogOut,
  Hammer,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Kanban,
  Brain,
  MessageSquare,
  FolderOpen,
  Settings,
  MapPin,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLogout } from "@/hooks/useLogout";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { useSidebarCollapse } from "./EstimatorLayout";

const navigationItems = [
  { title: "Dashboard", url: "/estimator/dashboard", icon: Home },
  { title: "Appointments", url: "/estimator/calendar", icon: Calendar },
  { title: "Site Visits", url: "/estimator/walkthroughs", icon: MapPin },
  { title: "Smart Estimates", url: "/estimator/smart-estimates", icon: Brain },
  { title: "Projects", url: "/estimator/projects", icon: Hammer },
  { title: "Messages", url: "/estimator/messages", icon: MessageSquare },
  { title: "Files", url: "/estimator/files", icon: FolderOpen },
];

const workflowItems = [
  { title: "Lead Pipeline", url: "/estimator/pipeline", icon: Kanban },
  { title: "Leads", url: "/estimator/leads", icon: Users },
  { title: "Requests", url: "/estimator/estimate-requests", icon: ClipboardList, showBadge: true },
  { title: "Estimates", url: "/estimator/estimates", icon: ClipboardList },
  { title: "Bid Review", url: "/estimator/bid-review", icon: Users },
  { title: "Analytics", url: "/estimator/bid-analytics", icon: BarChart3 },
];

const toolsItems = [
  { title: "Generate Scope", url: "/estimator/generate-scope", icon: Wand2 },
  { title: "Profile", url: "/estimator/profile", icon: Users },
  { title: "Settings", url: "/estimator/settings", icon: Settings },
];

export function EstimatorSidebar() {
  const location = useLocation();
  const { logout } = useLogout("/");
  const currentPath = location.pathname;
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const { collapsed, setCollapsed } = useSidebarCollapse();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["navigation", "workflow", "tools"])
  );

  useEffect(() => {
    fetchPendingRequestsCount();

    const requestsChannel = supabase
      .channel('sidebar-estimate-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estimate_requests' }, () => {
        fetchPendingRequestsCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  const fetchPendingRequestsCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('estimate_requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('status', 'pending');

      setPendingRequestsCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };


  const renderGroup = (
    groupId: string,
    label: string,
    items: Array<{ title: string; url: string; icon: any; showBadge?: boolean }>,
    separatorAbove?: boolean
  ) => {
    const isExpanded = expandedGroups.has(groupId);
    
    return (
      <li key={groupId} className={separatorAbove ? "mt-2 pt-2 border-t border-[hsl(217,32%,14%)]" : ""}>
        <button
          onClick={() => toggleGroup(groupId)}
          className={cn(
            "w-full px-2 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[hsl(217,15%,60%)] flex items-center gap-2 mb-1.5 hover:text-[hsl(38,92%,50%)] transition-colors",
            collapsed && "justify-center"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-[hsl(38,92%,50%)] opacity-80" />
          <span className={cn(collapsed && "sr-only", "flex-1 text-left")}>{label}</span>
          {!collapsed && (
            <ChevronDown 
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                isExpanded && "rotate-180"
              )} 
            />
          )}
        </button>
        {isExpanded && (
          <ul className="space-y-1.5 px-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title}>
                  <NavLink
                    to={item.url}
                    end
                    className="group flex items-center justify-between rounded-[10px] px-3 py-2.5 text-sm transition-all duration-300 ease-out bg-[hsl(217,28%,11%)] border border-[hsl(217,32%,14%)] text-[hsl(216,20%,92%)] hover:bg-[hsl(217,30%,12%)] hover:border-[hsl(217,32%,18%)] hover:shadow-md hover:translate-x-0.5"
                    activeClassName="bg-gradient-to-r from-[hsl(38,92%,50%)]/10 to-transparent border-l-2 border-l-[hsl(38,92%,50%)] border-r border-r-[hsl(217,32%,14%)] border-t border-t-[hsl(217,32%,14%)] border-b border-b-[hsl(217,32%,14%)] font-semibold text-[hsl(216,20%,95%)] shadow-sm translate-x-1"
                  >
                    <span className="flex items-center gap-2.5 flex-1 min-w-0">
                      {Icon && <Icon className="h-4 w-4 shrink-0 transition-all duration-300 group-hover:scale-110 text-[hsl(38,92%,50%)]" />}
                      <span className={cn(collapsed && "sr-only", "truncate transition-all duration-300")}>{item.title}</span>
                    </span>
                    {item.showBadge && pendingRequestsCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "ml-2 min-w-[22px] h-5 px-1.5 text-[11px] font-semibold bg-[hsl(199,100%,20%)] text-[hsl(199,100%,73%)] border border-[hsl(199,80%,30%)]",
                          collapsed && "sr-only"
                        )}
                      >
                        {pendingRequestsCount}
                      </Badge>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside
      className="hidden md:flex fixed left-0 bg-[hsl(217,32%,8%)] border-r border-[hsl(217,32%,14%)] z-40 transition-all duration-300"
      style={{
        top: 56,
        width: collapsed ? 56 : 240,
        bottom: 0,
      }}
      aria-label="Construction Agent side navigation"
    >
      <div className="flex h-full w-full flex-col">
        {/* Back Button & Collapse / Expand */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-[hsl(217,32%,14%)]">
          <div className={cn("flex items-center gap-2 transition-all duration-300", collapsed && "justify-center w-full")}>
            {!collapsed && <BackButton variant="ghost" className="h-7" />}
            <div className={cn("text-xs font-medium text-[hsl(217,15%,60%)] transition-opacity duration-300", collapsed && "sr-only")}>
              Construction Agent Portal
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[hsl(216,20%,92%)] hover:bg-[hsl(38,92%,50%)]/10 hover:text-[hsl(38,92%,50%)] hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-300 ease-out group relative overflow-hidden"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="absolute inset-0 bg-[hsl(38,92%,50%)]/0 group-hover:bg-[hsl(38,92%,50%)]/5 transition-colors duration-300 rounded-md" />
            {collapsed ? (
              <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            ) : (
              <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            )}
          </Button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-auto py-2">
          <ul className="px-2 space-y-2">
            {renderGroup("navigation", "Navigation", navigationItems)}
            {renderGroup("workflow", "Workflow", workflowItems)}
            {renderGroup("tools", "Tools", toolsItems)}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-[hsl(217,32%,14%)] p-2">
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "w-full justify-start text-sm bg-[hsl(217,28%,11%)] border border-[hsl(217,32%,14%)] text-[hsl(216,20%,92%)] hover:bg-[hsl(217,30%,12%)] hover:text-destructive transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
