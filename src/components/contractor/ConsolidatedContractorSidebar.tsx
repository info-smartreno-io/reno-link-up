import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { consolidatedContractorNav } from "@/config/consolidatedContractorNav";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useContractorRole } from "@/hooks/useContractorRole";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/useLogout";

export function ConsolidatedContractorSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { hasRole, loading: rolesLoading } = useUserRoles();
  const { contractorUser, loading: contractorLoading } = useContractorRole();
  const { logout } = useLogout("/contractor/auth");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(consolidatedContractorNav.map(s => s.title))
  );

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const isItemVisible = (requiredRoles?: string[]) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    
    const hasStandardRole = hasRole(requiredRoles);
    const hasContractorRole = contractorUser && requiredRoles.includes(contractorUser.role);
    
    return hasStandardRole || hasContractorRole;
  };

  const isActive = (path?: string) => path && currentPath === path;

  const getGroupOpen = (items: typeof consolidatedContractorNav[0]['items']) => {
    return items.some(item => isActive(item.path));
  };

  return (
    <Sidebar
      className={cn(
        "border-r border-[hsl(217,32%,14%)]",
        collapsed ? "w-14" : "w-60"
      )}
      collapsible="icon"
    >
      <div className="flex h-full w-full flex-col bg-[hsl(217,32%,8%)]">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-3 border-b border-[hsl(217,32%,14%)]">
          <div className={cn("text-xs font-medium text-[hsl(217,15%,60%)]", collapsed && "sr-only")}>
            Contractor Portal
          </div>
        </div>

        <SidebarContent>
          {rolesLoading || contractorLoading ? (
            <div className="px-4 space-y-3 py-4">
              <Skeleton className="h-8 w-full bg-[hsl(217,28%,11%)]" />
              <Skeleton className="h-8 w-full bg-[hsl(217,28%,11%)]" />
              <Skeleton className="h-8 w-full bg-[hsl(217,28%,11%)]" />
            </div>
          ) : (
            <div className="px-2 space-y-2 py-2">
              {consolidatedContractorNav.map((section) => {
                const visibleItems = section.items.filter(item => isItemVisible(item.requiredRoles));
                if (visibleItems.length === 0) return null;

                const isExpanded = expandedGroups.has(section.title);
                const isGroupActive = getGroupOpen(visibleItems);

                return (
                  <SidebarGroup key={section.title}>
                    <button
                      onClick={() => toggleGroup(section.title)}
                      className={cn(
                        "flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded",
                        "text-[hsl(217,15%,60%)] hover:bg-[hsl(217,28%,11%)]",
                        collapsed && "justify-center"
                      )}
                    >
                      {!collapsed && <span>{section.title}</span>}
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      )}
                    </button>

                    {isExpanded && (
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {visibleItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={item.path || "#"}
                                  end
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                                    "text-[hsl(217,15%,70%)] hover:bg-[hsl(217,28%,11%)] hover:text-[hsl(217,15%,90%)]",
                                    item.aiContext && "hover:bg-accent/10"
                                  )}
                                  activeClassName="bg-[hsl(217,28%,14%)] text-white font-medium"
                                >
                                  {item.icon && (
                                    <item.icon className={cn(
                                      "h-5 w-5 flex-shrink-0",
                                      item.aiContext && "text-accent"
                                    )} />
                                  )}
                                  {!collapsed && (
                                    <>
                                      <span className="flex-1">{item.label}</span>
                                      {item.badge && (
                                        <Badge 
                                          variant={item.badge === "ai" ? "default" : "secondary"}
                                          className={cn(
                                            "text-[10px] px-1.5 py-0",
                                            item.badge === "ai" && "bg-accent text-accent-foreground"
                                          )}
                                        >
                                          {item.badge.toUpperCase()}
                                        </Badge>
                                      )}
                                    </>
                                  )}
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    )}
                  </SidebarGroup>
                );
              })}
            </div>
          )}
        </SidebarContent>

        {/* Footer with Logout */}
        <div className="mt-auto border-t border-[hsl(217,32%,14%)] p-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full justify-center text-xs bg-[hsl(217,28%,11%)] border-[hsl(217,32%,14%)] text-[hsl(0,84%,60%)] hover:bg-[hsl(0,84%,20%)]/20 hover:text-[hsl(0,84%,70%)]",
              collapsed && "px-0"
            )}
            onClick={logout}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            {!collapsed && <span>Log out</span>}
          </Button>
        </div>
      </div>
    </Sidebar>
  );
}
