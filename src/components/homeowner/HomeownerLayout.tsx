import { ReactNode } from "react";
import { HomeownerSidebar } from "./HomeownerSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SettingsDropdown } from "@/components/SettingsDropdown";

interface HomeownerLayoutProps {
  children: ReactNode;
}

function HomeownerLayoutContent({ children }: HomeownerLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <div className="flex-1 flex w-full">
        <HomeownerSidebar />

        <div className="flex-1 flex flex-col w-full">
          {/* Top bar */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SidebarTrigger>
              <span className="text-sm font-medium text-muted-foreground hidden md:block">
                My Renovation
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <SettingsDropdown />
            </div>
          </header>

          <main className="flex-1">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function HomeownerLayout({ children }: HomeownerLayoutProps) {
  return (
    <SidebarProvider>
      <HomeownerLayoutContent>{children}</HomeownerLayoutContent>
    </SidebarProvider>
  );
}
