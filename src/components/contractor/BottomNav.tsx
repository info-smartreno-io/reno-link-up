import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Briefcase, ClipboardList, MessageSquare, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useContractorCounts } from "@/hooks/useContractorCounts";
import { BottomNavDrawer } from "./BottomNavDrawer";

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  getBadgeCount?: (counts: ReturnType<typeof useContractorCounts>['counts']) => number;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/contractor/dashboard",
  },
  {
    id: "bids",
    label: "Bid Opps",
    icon: Briefcase,
    path: "/contractor/bid-packets",
    getBadgeCount: (counts) => counts.totalPending,
  },
  {
    id: "projects",
    label: "Projects",
    icon: ClipboardList,
    path: "/contractor/projects",
    getBadgeCount: (counts) => counts.newProjects,
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    path: "/contractor/messages",
  },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { counts } = useContractorCounts();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const badgeCount = item.getBadgeCount ? item.getBadgeCount(counts) : 0;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors relative touch-manipulation",
                  "min-h-[44px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground active:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5", active && "fill-primary/20")} />
                  {badgeCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold rounded-full"
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          
          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors relative touch-manipulation",
              "min-h-[44px]",
              drawerOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground active:text-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
      
      <BottomNavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
