import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  FolderOpen,
  Bell,
  User,
  Home,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessages";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Dashboard", url: "/homeowner/dashboard", icon: LayoutDashboard, badgeKey: null },
  { title: "My Projects", url: "/homeowner/projects", icon: FolderKanban, badgeKey: null },
  { title: "Messages", url: "/homeowner/messages", icon: MessageSquare, badgeKey: "messages" as const },
  { title: "Files", url: "/homeowner/files", icon: FolderOpen, badgeKey: null },
  { title: "My Home", url: "/homeowner/my-home", icon: Home, badgeKey: null },
  { title: "Notifications", url: "/homeowner/notifications", icon: Bell, badgeKey: "notifications" as const },
  { title: "Profile", url: "/homeowner/profile", icon: User, badgeKey: null },
];

export function HomeownerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: unreadNotifs } = useUnreadNotificationCount();
  const { data: unreadMsgs } = useUnreadMessageCount();

  const badges: Record<string, number> = {
    notifications: unreadNotifs ?? 0,
    messages: unreadMsgs ?? 0,
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="flex h-full w-full flex-col bg-card">
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SR</span>
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-foreground">SmartReno</p>
              <p className="text-[11px] text-muted-foreground">Homeowner Portal</p>
            </div>
          )}
        </div>

        <SidebarContent className="px-3 py-4">
          <SidebarMenu className="space-y-1">
            {navItems.map((item) => {
              const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                        "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                      {!collapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                      {!collapsed && badgeCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
