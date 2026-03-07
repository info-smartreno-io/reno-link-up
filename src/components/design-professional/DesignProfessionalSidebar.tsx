import {
  LayoutDashboard,
  User,
  Images,
  Briefcase,
  FolderOpen,
  MessageSquare,
  FileText,
  Settings,
  Package,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";

const navItems = [
  { title: "Overview", url: "/design-professional/dashboard", icon: LayoutDashboard },
  { title: "My Profile", url: "/design-professional/profile", icon: User },
  { title: "Portfolio", url: "/design-professional/portfolio", icon: Images },
  { title: "Design Packages", url: "/design-professional/design-packages", icon: Package },
  { title: "Opportunities", url: "/design-professional/opportunities", icon: Briefcase },
  { title: "Projects", url: "/design-professional/projects", icon: FolderOpen },
  { title: "Messages", url: "/design-professional/messages", icon: MessageSquare },
  { title: "Documents", url: "/design-professional/documents", icon: FileText },
  { title: "Settings", url: "/design-professional/settings", icon: Settings },
];

export function DesignProfessionalSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <img src={smartRenoLogo} alt="SmartReno" className="h-8" />
          {!collapsed && (
            <span className="text-sm font-semibold text-foreground">Design Pro</span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/design-professional/dashboard"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
