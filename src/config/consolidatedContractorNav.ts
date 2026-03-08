import {
  LayoutDashboard,
  Briefcase,
  FileText,
  FolderOpen,
  MessageSquare,
  User,
  Settings,
  ClipboardList,
  Building2,
  MessageCircle,
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
        label: "Bid Opportunities",
        path: "/contractor/bid-packets",
        icon: Briefcase,
      },
      {
        label: "My Bids",
        path: "/contractor/bids",
        icon: FileText,
      },
      {
        label: "Clarifications",
        path: "/contractor/clarifications",
        icon: MessageCircle,
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
      {
        label: "Files",
        path: "/contractor/files",
        icon: FolderOpen,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Company Profile",
        path: "/contractor/profile",
        icon: Building2,
      },
      {
        label: "Settings",
        path: "/contractor/settings",
        icon: Settings,
      },
    ],
  },
];
