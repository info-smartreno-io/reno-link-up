import { ReactNode, useEffect, useRef } from "react";
import { ConsolidatedContractorSidebar } from "./ConsolidatedContractorSidebar";
import { BottomNav } from "./BottomNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BackButton } from "@/components/BackButton";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { useDemoMode } from "@/context/DemoModeContext";

interface ContractorLayoutProps {
  children: ReactNode;
}

function ContractorLayoutContent({ children }: ContractorLayoutProps) {
  const { open, setOpen, isMobile } = useSidebar();
  const { isDemoMode } = useDemoMode();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = Math.abs(touchEndY.current - touchStartY.current);
      
      // Swipe from left edge to open (swipe right)
      if (!open && touchStartX.current < 20 && deltaX > 80 && deltaY < 100) {
        setOpen(true);
      }
      
      // Swipe left to close
      if (open && deltaX < -80 && deltaY < 100) {
        setOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [open, setOpen, isMobile]);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Demo Banner - shown when in demo mode */}
      {isDemoMode && <DemoBanner />}
      
      <div className="flex-1 flex w-full">
        <ConsolidatedContractorSidebar />
        
        <div className="flex-1 flex flex-col w-full">
        {/* Mobile header with menu trigger and actions */}
        <header className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b bg-background px-3">
          <div className="flex items-center gap-1">
            <SidebarTrigger>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
            <BackButton variant="ghost" className="h-9 px-2" />
          </div>
          <span className="text-sm font-medium text-muted-foreground truncate">
            Contractor Portal
          </span>
        </header>

        <main className="flex-1 pb-20 md:pb-0">
          <div className="p-3 sm:p-4 md:p-6">
            {/* Desktop back button */}
            <div className="hidden md:flex items-center mb-2">
              <BackButton />
            </div>
            <div className="mb-3 md:mb-4">
              <Breadcrumbs />
            </div>
            {children}
          </div>
        </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

export function ContractorLayout({ children }: ContractorLayoutProps) {
  return (
    <SidebarProvider>
      <ContractorLayoutContent>{children}</ContractorLayoutContent>
    </SidebarProvider>
  );
}
