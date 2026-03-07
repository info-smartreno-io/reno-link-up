import {
  LayoutDashboard,
  Briefcase,
  FileText,
  FolderOpen,
  MessageSquare,
  User,
  Settings,
  ClipboardList,
} from "lucide-react";
import { NavSection } from "@/types/nav";

/**
 * Simplified Contractor Navigation
 * Focused on the core contractor portal workflow
 */
export const consolidatedContractorNav: NavSection[] = [
  {
    title: "Main",
    items: [
      {
        label: "Dashboard",
        path: "/contractor/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Opportunities",
        path: "/contractor/opportunities",
        icon: Briefcase,
      },
      {
        label: "My Bids",
        path: "/contractor/bids",
        icon: FileText,
      },
      {
        label: "Projects",
        path: "/contractor/projects",
        icon: ClipboardList,
      },
      {
        label: "Messages",
        path: "/contractor/messages",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Profile",
        path: "/contractor/profile",
        icon: User,
      },
      {
        label: "Settings",
        path: "/contractor/settings",
        icon: Settings,
      },
    ],
  },
];
