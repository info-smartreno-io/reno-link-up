import { Settings, User, LogOut, Home, FileText, MessageSquare, DollarSign, HelpCircle, Globe, Wallet, Receipt, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLogout } from "@/hooks/useLogout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SettingsDropdownProps {
  userRole?: string;
}

export const SettingsDropdown = ({ userRole }: SettingsDropdownProps) => {
  const navigate = useNavigate();
  const { logout } = useLogout("/");

  const getMenuItems = () => {
    const commonItems = [
      { icon: User, label: "My Account", onClick: () => {
        if (userRole === 'homeowner') {
          navigate("/homeowner/account-settings");
        } else {
          navigate("/profile-setup");
        }
      }},
      { icon: Settings, label: "Settings", onClick: () => navigate("/profile-setup") },
    ];

    // Add QuickBooks and Invoicing for professional roles
    const isProfessional = ['estimator', 'contractor', 'architect', 'interiordesigner', 'design_professional'].includes(userRole || '');
    if (isProfessional) {
      commonItems.push({ icon: Wallet, label: "QuickBooks", onClick: () => navigate("/quickbooks") });
      commonItems.push({ icon: Receipt, label: "Invoicing", onClick: () => navigate("/invoicing") });
    }

    const roleSpecificItems = {
      homeowner: [
        { icon: Home, label: "My Portal", onClick: () => navigate("/homeowner/dashboard") },
        { icon: FileText, label: "Projects", onClick: () => navigate("/homeowner/projects") },
        { icon: FolderOpen, label: "Files", onClick: () => navigate("/homeowner/files") },
        { icon: MessageSquare, label: "Messages", onClick: () => navigate("/homeowner/messages") },
      ],
      estimator: [
        { icon: Home, label: "Dashboard", onClick: () => navigate("/estimator/dashboard") },
        { icon: FileText, label: "Estimates", onClick: () => navigate("/estimator/estimates") },
        { icon: MessageSquare, label: "Leads", onClick: () => navigate("/estimator/leads") },
      ],
      contractor: [
        { icon: Home, label: "Dashboard", onClick: () => navigate("/contractor/dashboard") },
        { icon: FileText, label: "Projects", onClick: () => navigate("/contractor/projects") },
        { icon: DollarSign, label: "Estimates", onClick: () => navigate("/contractor/estimates") },
      ],
      architect: [
        { icon: Home, label: "Dashboard", onClick: () => navigate("/design-professional/dashboard") },
        { icon: FileText, label: "Portfolio", onClick: () => navigate("/design-professional/portfolio") },
        { icon: MessageSquare, label: "Messages", onClick: () => navigate("/design-professional/messages") },
      ],
      interiordesigner: [
        { icon: Home, label: "Dashboard", onClick: () => navigate("/design-professional/dashboard") },
        { icon: FileText, label: "Portfolio", onClick: () => navigate("/design-professional/portfolio") },
        { icon: MessageSquare, label: "Opportunities", onClick: () => navigate("/design-professional/opportunities") },
      ],
      design_professional: [
        { icon: Home, label: "Dashboard", onClick: () => navigate("/design-professional/dashboard") },
        { icon: FileText, label: "Portfolio", onClick: () => navigate("/design-professional/portfolio") },
        { icon: MessageSquare, label: "Opportunities", onClick: () => navigate("/design-professional/opportunities") },
      ],
      admin: [
        { icon: Home, label: "Admin Dashboard", onClick: () => navigate("/admin/dashboard") },
        { icon: FileText, label: "Workflow", onClick: () => navigate("/admin/workflow") },
        { icon: User, label: "User Management", onClick: () => navigate("/admin/user-management") },
      ],
    };

    const specific = roleSpecificItems[userRole as keyof typeof roleSpecificItems] || [];

    const discover =
      userRole === "homeowner"
        ? [
            {
              icon: HelpCircle,
              label: "Help Center",
              onClick: () => navigate("/homeowner/messages"),
            },
            { icon: Globe, label: "Full Site", onClick: () => navigate("/") },
          ]
        : [
            {
              icon: HelpCircle,
              label: "Help Center",
              onClick: () => window.open("https://help.smartreno.com", "_blank"),
            },
            { icon: Globe, label: "Full Site", onClick: () => navigate("/") },
          ];

    return {
      specific,
      common: commonItems,
      discover,
    };
  };

  const menuItems = getMenuItems();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        {menuItems.common.map((item) => (
          <DropdownMenuItem key={item.label} onClick={item.onClick}>
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Discover</DropdownMenuLabel>
        {menuItems.discover.map((item) => (
          <DropdownMenuItem key={item.label} onClick={item.onClick}>
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={logout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
