import { useNavigate, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  ShoppingCart, 
  FolderOpen, 
  MessageSquare, 
  Settings, 
  HelpCircle,
  Wallet,
  Users,
  Calendar,
  FileText,
  Image,
  HardDrive
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { label: "Orders", path: "/contractor/orders", icon: ShoppingCart },
      { label: "Vendors", path: "/contractor/vendors", icon: Users },
      { label: "Calendar", path: "/contractor/calendar", icon: Calendar },
    ]
  },
  {
    title: "Files & Photos",
    items: [
      { label: "File Management", path: "/contractor/files", icon: FolderOpen },
      { label: "Photos", path: "/contractor/photos", icon: Image },
      { label: "SmartReno Drive", path: "/contractor/drive", icon: HardDrive },
    ]
  },
  {
    title: "Finance",
    items: [
      { label: "Finance & Billing", path: "/contractor/finance", icon: Wallet },
      { label: "Contracts", path: "/contractor/contracts", icon: FileText },
    ]
  },
  {
    title: "Support",
    items: [
      { label: "Messages", path: "/contractor/messages", icon: MessageSquare },
      { label: "Help Center", path: "/contractor/help-center", icon: HelpCircle },
      { label: "Settings", path: "/contractor/settings", icon: Settings },
    ]
  }
];

export function BottomNavDrawer({ open, onOpenChange }: BottomNavDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">More</SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto space-y-6 pb-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {section.title}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {section.items.map((item) => {
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
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
