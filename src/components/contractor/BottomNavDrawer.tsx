import { useNavigate, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  MessageCircle, 
  FolderOpen, 
  Building2, 
  Settings, 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const drawerItems = [
  { label: "Clarifications", path: "/contractor/clarifications", icon: MessageCircle },
  { label: "Files", path: "/contractor/files", icon: FolderOpen },
  { label: "Company Profile", path: "/contractor/profile", icon: Building2 },
  { label: "Settings", path: "/contractor/settings", icon: Settings },
];

export function BottomNavDrawer({ open, onOpenChange }: BottomNavDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-2xl pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">More</SheetTitle>
        </SheetHeader>
        
        <div className="grid grid-cols-4 gap-2">
          {drawerItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all",
                  "min-h-[80px] touch-manipulation active:scale-95",
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
