import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  FolderOpen,
  Bell,
  User,
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

const navItems = [
  { title: "Dashboard", url: "/homeowner/dashboard", icon: LayoutDashboard },
  { title: "My Projects", url: "/homeowner/projects", icon: FolderKanban },
  { title: "Messages", url: "/homeowner/messages", icon: MessageSquare },
  { title: "Files", url: "/homeowner/files", icon: FolderOpen },
  { title: "Notifications", url: "/homeowner/notifications", icon: Bell },
  { title: "Profile", url: "/homeowner/profile", icon: User },
];

export function HomeownerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
            {navItems.map((item) => (
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
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
