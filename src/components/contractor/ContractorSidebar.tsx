import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CONTRACTOR_SIDENAV, type ContractorNavItem } from "@/config/contractorSidebar";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { NavLink } from "@/components/NavLink";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useContractorRole } from "@/hooks/useContractorRole";
import { Skeleton } from "@/components/ui/skeleton";
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

export function ContractorSidebar() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(CONTRACTOR_SIDENAV.map(g => g.id))
  );
  const { pathname } = useLocation();
  const { hasRole, loading: rolesLoading } = useUserRoles();
  const { contractorUser, loading: contractorLoading } = useContractorRole();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

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

  const isGroupVisible = (group: ContractorNavItem): boolean => {
    if (!group.requiredRoles || group.requiredRoles.length === 0) return true;
    
    const hasStandardRole = hasRole(group.requiredRoles);
    const hasContractorRole = contractorUser && group.requiredRoles.includes(contractorUser.role);
    
    return hasStandardRole || hasContractorRole;
  };

  const isItemVisible = (item: ContractorNavItem): boolean => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
    
    const hasStandardRole = hasRole(item.requiredRoles);
    const hasContractorRole = contractorUser && item.requiredRoles.includes(contractorUser.role);
    
    return hasStandardRole || hasContractorRole;
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
          <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
            {!collapsed && <BackButton variant="ghost" className="h-7" />}
            <div className={cn("text-xs font-medium text-[hsl(217,15%,60%)]", collapsed && "sr-only")}>
              Contractor Portal
            </div>
          </div>
        </div>

        <SidebarContent>
          {rolesLoading ? (
            <div className="px-4 space-y-3 py-4">
              <Skeleton className="h-8 w-full bg-[hsl(217,28%,11%)]" />
              <Skeleton className="h-8 w-full bg-[hsl(217,28%,11%)]" />
              <Skeleton className="h-8 w-full bg-[hsl(217,28%,11%)]" />
            </div>
          ) : (
            <div className="px-2 space-y-2 py-2">
              {CONTRACTOR_SIDENAV.filter(isGroupVisible).map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                const visibleChildren = group.children?.filter(isItemVisible) || [];
                
                if (visibleChildren.length === 0) return null;

                return (
                  <SidebarGroup 
                    key={group.id} 
                    className={group.separatorAbove ? "mt-2 pt-2 border-t border-[hsl(217,32%,14%)]" : ""}
                  >
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        "w-full px-2 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[hsl(217,15%,60%)] flex items-center gap-2 mb-1.5 hover:text-[hsl(38,92%,50%)] transition-colors",
                        collapsed && "justify-center"
                      )}
                    >
                      <span className="w-2 h-2 rounded-full bg-[hsl(38,92%,50%)] opacity-80" />
                      <span className={cn(collapsed && "sr-only", "flex-1 text-left")}>{group.label}</span>
                      {!collapsed && (
                        <ChevronDown 
                          className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )} 
                        />
                      )}
                    </button>

                    {isExpanded && visibleChildren.length > 0 && (
                      <SidebarGroupContent>
                        <SidebarMenu className="space-y-1.5 px-1">
                          {visibleChildren.map((item) => {
                            const Icon = item.icon;
                            return (
                              <SidebarMenuItem key={item.id}>
                                <SidebarMenuButton asChild>
                                  <NavLink
                                    to={item.to ?? "#"}
                                    className="group flex items-center justify-between rounded-[10px] px-3 py-2.5 text-sm transition-all duration-300 ease-out bg-[hsl(217,28%,11%)] border border-[hsl(217,32%,14%)] text-[hsl(216,20%,92%)] hover:bg-[hsl(217,30%,12%)] hover:border-[hsl(217,32%,18%)] hover:shadow-md hover:translate-x-0.5"
                                    activeClassName="bg-gradient-to-r from-[hsl(38,92%,50%)]/10 to-transparent border-l-2 border-l-[hsl(38,92%,50%)] border-r border-r-[hsl(217,32%,14%)] border-t border-t-[hsl(217,32%,14%)] border-b border-b-[hsl(217,32%,14%)] font-semibold text-[hsl(216,20%,95%)] shadow-sm translate-x-1"
                                  >
                                    <span className="flex items-center gap-2.5 flex-1 min-w-0">
                                      {Icon && <Icon className="h-4 w-4 shrink-0 transition-all duration-300 group-hover:scale-110 text-[hsl(38,92%,50%)]" />}
                                      <span className={cn(collapsed && "sr-only", "truncate transition-all duration-300")}>{item.label}</span>
                                    </span>
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    )}
                  </SidebarGroup>
                );
              })}
            </div>
          )}
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
