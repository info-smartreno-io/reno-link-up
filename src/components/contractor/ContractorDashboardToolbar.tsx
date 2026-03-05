import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import {
  Plus,
  Search,
  Calendar,
  Users,
  FolderKanban,
  ChevronDown,
} from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";

export function ContractorDashboardToolbar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or filter
      console.log("Search:", searchQuery);
    }
  };

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={smartRenoLogo} alt="SmartReno" className="h-8 w-auto" />
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search leads, projects, messages..."
              className="pl-10 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Spacer */}
        <div className="flex-1 md:hidden" />

        {/* Quick Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Action</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/contractor/leads/new')}>
              <Users className="h-4 w-4 mr-2" />
              New Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/contractor/projects/new')}>
              <FolderKanban className="h-4 w-4 mr-2" />
              New Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/contractor/calendar')}>
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Settings/Profile */}
        <SettingsDropdown />
      </div>
    </div>
  );
}
