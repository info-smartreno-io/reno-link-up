import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { ADMIN_SIDENAV, type NavItem, type NavRole } from "@/config/adminSidebar";
import { BackButton } from "@/components/BackButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NavLink } from "@/components/NavLink";
import { useLogout } from "@/hooks/useLogout";

/** Role-based login dropdown */
const adminRoles = [
  { label: "Admin", to: "/admin/auth" },
  { label: "Construction Agent", to: "/estimator/auth" },
  { label: "Architect", to: "/architect/auth" },
  { label: "Contractor", to: "/contractor/auth" },
  { label: "Interior Designer", to: "/interiordesigner/auth" },
];

function canSee(item: NavItem, role: NavRole) {
  return !item.roles || item.roles.includes(role);
}

type BadgeCounts = Partial<Record<NonNullable<NavItem["badgeKey"]>, number>>;

type Props = {
  /** Header height so we can sit just below it */
  topOffsetPx?: number; // default 56 (h-14)
  /** Sidebar width in px when expanded */
  widthPx?: number; // default 240
  /** Sidebar width in px when collapsed */
  collapsedWidthPx?: number; // default 56
  /** Current user role */
  role?: NavRole;
  /** Badge counts for live indicators */
  badges?: BadgeCounts;
};

export function AdminSideNav({
  topOffsetPx = 56,
  widthPx = 240,
  collapsedWidthPx = 56,
  role = "admin",
  badges = {},
}: Props) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(ADMIN_SIDENAV.map(g => g.id))
  );
  const { pathname } = useLocation();
   const { logout } = useLogout("/admin/auth");

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

  return (
    <>
      {/* Desktop fixed sidebar - Dark Theme */}
      <aside
        className="hidden md:flex fixed left-0 bg-[hsl(217,32%,8%)] border-r border-[hsl(217,32%,14%)] z-40"
        style={{
          top: topOffsetPx,
          width: collapsed ? collapsedWidthPx : widthPx,
          bottom: 0,
        }}
        aria-label="Admin side navigation"
      >
        <div className="flex h-full w-full flex-col">
          {/* Back Button & Collapse / Expand */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-[hsl(217,32%,14%)]">
            <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
              {!collapsed && <BackButton variant="ghost" className="h-7" />}
              <div className={cn("text-xs font-medium text-[hsl(217,15%,60%)]", collapsed && "sr-only")}>
                Admin Dash
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[hsl(216,20%,92%)] hover:bg-[hsl(217,28%,11%)] hover:text-[hsl(216,20%,92%)]"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Links */}
          <nav className="flex-1 overflow-auto py-2">
            <ul className="px-2 space-y-2">
              {ADMIN_SIDENAV.map((group) => {
                if (!canSee(group, role)) return null;
                const isExpanded = expandedGroups.has(group.id);
                return (
                  <li key={group.id} className={group.separatorAbove ? "mt-2 pt-2 border-t border-[hsl(217,32%,14%)]" : ""}>
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
                    {isExpanded && group.children && (
                      <ul className="space-y-1.5 px-1">
                        {group.children
                          .filter((c) => canSee(c, role))
                          .map((c) => {
                            const count = c.badgeKey ? badges[c.badgeKey] : undefined;
                            const Icon = c.icon;
                            return (
                              <li key={c.id}>
                                <NavLink
                                  to={c.to ?? "#"}
                                  className="group flex items-center justify-between rounded-[10px] px-3 py-2.5 text-sm transition-all duration-300 ease-out bg-[hsl(217,28%,11%)] border border-[hsl(217,32%,14%)] text-[hsl(216,20%,92%)] hover:bg-[hsl(217,30%,12%)] hover:border-[hsl(217,32%,18%)] hover:shadow-md hover:translate-x-0.5"
                                  activeClassName="bg-gradient-to-r from-[hsl(38,92%,50%)]/10 to-transparent border-l-2 border-l-[hsl(38,92%,50%)] border-r border-r-[hsl(217,32%,14%)] border-t border-t-[hsl(217,32%,14%)] border-b border-b-[hsl(217,32%,14%)] font-semibold text-[hsl(216,20%,95%)] shadow-sm translate-x-1"
                                >
                                  <span className="flex items-center gap-2.5 flex-1 min-w-0">
                                    {Icon && <Icon className="h-4 w-4 shrink-0 transition-all duration-300 group-hover:scale-110 text-[hsl(38,92%,50%)]" />}
                                    <span className={cn(collapsed && "sr-only", "truncate transition-all duration-300")}>{c.label}</span>
                                  </span>
                                  {typeof count === "number" && count > 0 && (
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "ml-2 min-w-[22px] h-5 px-1.5 text-[11px] font-semibold bg-[hsl(199,100%,20%)] text-[hsl(199,100%,73%)] border border-[hsl(199,80%,30%)]",
                                        collapsed && "sr-only"
                                      )}
                                    >
                                      {count}
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
              })}
            </ul>
          </nav>

          {/* Role login dropdown + Logout */}
          <div className="border-t border-[hsl(217,32%,14%)] p-2 space-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-xs bg-[hsl(217,28%,11%)] border-[hsl(217,32%,14%)] text-[hsl(216,20%,92%)] hover:bg-[hsl(217,30%,12%)] hover:text-[hsl(216,20%,92%)]"
                >
                  <span className={cn(!collapsed ? "inline" : "sr-only")}>Role Login</span>
                  {!collapsed && <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right">
                <DropdownMenuLabel className="text-xs">Choose role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {adminRoles.map((r) => (
                  <DropdownMenuItem key={r.to} asChild>
                    <Link to={r.to} className="w-full">{r.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="w-full justify-center text-xs bg-[hsl(217,28%,11%)] border-[hsl(217,32%,14%)] text-[hsl(0,84%,60%)] hover:bg-[hsl(0,84%,20%)]/20 hover:text-[hsl(0,84%,70%)]"
              onClick={logout}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span className={cn(!collapsed ? "inline" : "sr-only")}>Log out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile: tuck into the SiteNavbar sheet or render a minimal quick-jump list */}
      {/* (Optional) If you want dedicated mobile UI here, we can wire a Sheet as well. */}
    </>
  );
}
