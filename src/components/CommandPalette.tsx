import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Users,
  FolderKanban,
  BarChart3,
  FileText,
  Calendar,
  Settings,
  Briefcase,
  Building2,
  Hammer,
  PaintBucket,
  UserCog,
  ClipboardList,
  DollarSign,
  Package,
  MessageSquare,
} from "lucide-react";

interface CommandItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  category: string;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current portal
  const getCurrentPortal = () => {
    if (location.pathname.startsWith("/admin")) return "admin";
    if (location.pathname.startsWith("/contractor")) return "contractor";
    if (location.pathname.startsWith("/architect")) return "architect";
    if (location.pathname.startsWith("/estimator")) return "estimator";
    if (location.pathname.startsWith("/interiordesigner")) return "interiordesigner";
    return "public";
  };

  const portal = getCurrentPortal();

  // Define all available commands based on portal
  const getCommands = (): CommandItem[] => {
    const commands: CommandItem[] = [];

    // Admin commands
    if (portal === "admin") {
      commands.push(
        { label: "Dashboard", path: "/admin/dashboard", icon: <Home className="w-4 h-4" />, category: "Navigation" },
        { label: "Analytics", path: "/admin/analytics", icon: <BarChart3 className="w-4 h-4" />, category: "Navigation" },
        { label: "CRM", path: "/admin/crm", icon: <Users className="w-4 h-4" />, category: "Navigation" },
        { label: "Projects", path: "/admin/project-assignments", icon: <FolderKanban className="w-4 h-4" />, category: "Navigation" },
        { label: "Estimates", path: "/admin/estimate-requests", icon: <FileText className="w-4 h-4" />, category: "Navigation" },
        { label: "Schedule", path: "/admin/schedule", icon: <Calendar className="w-4 h-4" />, category: "Navigation" },
        { label: "Team Calendars", path: "/admin/calendars", icon: <Calendar className="w-4 h-4" />, category: "Navigation" },
        { label: "Sales Performance", path: "/admin/sales-performance", icon: <BarChart3 className="w-4 h-4" />, category: "Navigation" },
        { label: "User Management", path: "/admin/user-management", icon: <UserCog className="w-4 h-4" />, category: "Navigation" },
        { label: "Pricing", path: "/admin/pricing", icon: <DollarSign className="w-4 h-4" />, category: "Navigation" },
        { label: "Applications", path: "/admin/applications", icon: <ClipboardList className="w-4 h-4" />, category: "Navigation" },
        { label: "Invoicing", path: "/admin/invoicing", icon: <FileText className="w-4 h-4" />, category: "Navigation" },
        { label: "Purchasing", path: "/admin/purchasing", icon: <Package className="w-4 h-4" />, category: "Navigation" },
      );
    }

    // Contractor commands
    if (portal === "contractor") {
      commands.push(
        { label: "Dashboard", path: "/contractor/dashboard", icon: <Home className="w-4 h-4" />, category: "Navigation" },
        { label: "Projects", path: "/contractor/projects", icon: <FolderKanban className="w-4 h-4" />, category: "Navigation" },
        { label: "Bid Room", path: "/contractor/bid-room", icon: <Briefcase className="w-4 h-4" />, category: "Navigation" },
        { label: "Calendar", path: "/contractor/calendar", icon: <Calendar className="w-4 h-4" />, category: "Navigation" },
        { label: "Estimates", path: "/contractor/estimates", icon: <FileText className="w-4 h-4" />, category: "Navigation" },
        { label: "Team Management", path: "/contractor/team-management", icon: <Users className="w-4 h-4" />, category: "Navigation" },
        { label: "User Applicants", path: "/contractor/user-applicants", icon: <Users className="w-4 h-4" />, category: "Navigation" },
      );
    }

    // Architect commands
    if (portal === "architect") {
      commands.push(
        { label: "Dashboard", path: "/architect/dashboard", icon: <Home className="w-4 h-4" />, category: "Navigation" },
        { label: "Projects", path: "/architect/projects", icon: <FolderKanban className="w-4 h-4" />, category: "Navigation" },
        { label: "Bid Room", path: "/architect/bid-room", icon: <Briefcase className="w-4 h-4" />, category: "Navigation" },
        { label: "Proposals", path: "/architect/proposals", icon: <FileText className="w-4 h-4" />, category: "Navigation" },
        { label: "Messages", path: "/architect/messages", icon: <MessageSquare className="w-4 h-4" />, category: "Navigation" },
      );
    }

    // Estimator commands
    if (portal === "estimator") {
      commands.push(
        { label: "Dashboard", path: "/estimator-dashboard", icon: <Home className="w-4 h-4" />, category: "Navigation" },
        { label: "Leads", path: "/estimator/leads", icon: <Users className="w-4 h-4" />, category: "Navigation" },
        { label: "Estimates", path: "/estimator/estimates", icon: <FileText className="w-4 h-4" />, category: "Navigation" },
        { label: "Walkthroughs", path: "/estimator/walkthroughs", icon: <Calendar className="w-4 h-4" />, category: "Navigation" },
        { label: "Calendar", path: "/estimator/calendar", icon: <Calendar className="w-4 h-4" />, category: "Navigation" },
      );
    }

    // Interior Designer commands
    if (portal === "interiordesigner") {
      commands.push(
        { label: "Dashboard", path: "/interiordesigner/dashboard", icon: <Home className="w-4 h-4" />, category: "Navigation" },
        { label: "Bid Room", path: "/interiordesigner/bid-room", icon: <Briefcase className="w-4 h-4" />, category: "Navigation" },
      );
    }

    return commands;
  };

  const commands = getCommands();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const categories = Array.from(new Set(commands.map((c) => c.category)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {categories.map((category) => (
          <div key={category}>
            <CommandGroup heading={category}>
              {commands
                .filter((c) => c.category === category)
                .map((command) => (
                  <CommandItem
                    key={command.path}
                    onSelect={() => handleSelect(command.path)}
                  >
                    <div className="flex items-center gap-2">
                      {command.icon}
                      <span>{command.label}</span>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
            <CommandSeparator />
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
