import {
  LayoutDashboard,
  Sparkles,
  ClipboardList,
  CalendarCheck,
  ShieldCheck,
  LineChart,
  FileText,
  Handshake,
  CheckSquare,
  Users,
  FolderArchive,
  Settings,
  Calculator,
  Briefcase,
  UserCog,
  MapPin,
  ClipboardCheck,
  Calendar,
  Building,
  Mail,
  Home,
  DollarSign,
  Wallet,
  HelpCircle,
  Image,
  FolderOpen,
  HardDrive,
  BarChart3,
  Target,
  TrendingUp,
} from "lucide-react";
import { NavSection } from "@/types/nav";

/**
 * Consolidated Contractor Navigation
 * Groups all contractor functionality into logical sections with integrated AI
 */
export const consolidatedContractorNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { 
        label: "Dashboard", 
        path: "/contractor/dashboard", 
        icon: LayoutDashboard
      },
      { 
        label: "SmartReno AI Hub", 
        path: "/contractor/ai", 
        icon: Sparkles, 
        aiContext: "global", 
        badge: "ai" 
      }
    ]
  },
  {
    title: "Work",
    items: [
      { 
        label: "Projects", 
        path: "/contractor/project-management", 
        icon: ClipboardList, 
        aiContext: "project" 
      },
      { 
        label: "Schedule & Walkthroughs", 
        path: "/contractor/calendar", 
        icon: CalendarCheck 
      },
      { 
        label: "Warranty & Service", 
        path: "/contractor/warranty", 
        icon: ShieldCheck, 
        aiContext: "operations" 
      }
    ]
  },
  {
    title: "Pipeline",
    items: [
      { 
        label: "My Leads", 
        path: "/contractor/leads", 
        icon: Users, 
        aiContext: "sales"
      },
      { 
        label: "Sales Management", 
        path: "/contractor/sales-kpi", 
        icon: LineChart, 
        aiContext: "sales",
        requiredRoles: ["admin", "contractor", "inside_sales", "vp_of_sales"]
      },
      { 
        label: "Leads & Inside Sales", 
        path: "/contractor/inside-sales", 
        icon: Users, 
        aiContext: "sales",
        requiredRoles: ["admin", "contractor", "inside_sales", "vp_of_sales"]
      },
      { 
        label: "Estimates & Quotes", 
        path: "/contractor/estimates", 
        icon: FileText, 
        aiContext: "estimating" 
      },
      { 
        label: "Estimator Dashboard", 
        path: "/contractor/estimator", 
        icon: Calculator, 
        aiContext: "estimating",
        requiredRoles: ["estimator", "contractor_admin"]
      },
      { 
        label: "SMART Estimate", 
        path: "/estimator/prepare-estimate", 
        icon: Calculator, 
        aiContext: "estimating",
        badge: "ai",
        requiredRoles: ["estimator", "admin", "contractor"]
      },
      { 
        label: "Bids & RFPs", 
        path: "/contractor/bids", 
        icon: Handshake 
      }
    ]
  },
  {
    title: "Marketing",
    items: [
      { 
        label: "Marketing Dashboard", 
        path: "/contractor/marketing", 
        icon: BarChart3,
        requiredRoles: ["admin", "contractor", "inside_sales"]
      },
      { 
        label: "Lead Sources", 
        path: "/contractor/marketing/sources", 
        icon: Target,
        requiredRoles: ["admin", "contractor", "inside_sales"]
      },
      { 
        label: "Town Performance", 
        path: "/contractor/marketing/towns", 
        icon: MapPin,
        requiredRoles: ["admin", "contractor", "inside_sales", "estimator"]
      }
    ],
    requiredRoles: ["admin", "contractor", "inside_sales", "estimator"]
  },
  {
    title: "Collections",
    items: [
      { 
        label: "Collections Overview", 
        path: "/contractor/collections", 
        icon: DollarSign 
      },
      { 
        label: "Collected This Week", 
        path: "/contractor/collections?view=this-week", 
        icon: Wallet 
      },
      { 
        label: "Uncollected", 
        path: "/contractor/collections?view=uncollected", 
        icon: DollarSign 
      }
    ]
  },
  {
    title: "Finance",
    items: [
      { 
        label: "Expenses", 
        path: "/contractor/expenses", 
        icon: Wallet 
      },
      { 
        label: "Expense Reports", 
        path: "/contractor/expense-reports", 
        icon: FileText 
      }
    ]
  },
  {
    title: "Operations",
    items: [
      { 
        label: "SmartPlan Tasks", 
        path: "/contractor/smartplan", 
        icon: CheckSquare, 
        aiContext: "operations", 
        badge: "ai" 
      },
      { 
        label: "Documents & Permits", 
        path: "/contractor/documents", 
        icon: FolderArchive 
      }
    ]
  },
  {
    title: "Files & Photos",
    items: [
      { 
        label: "File Management", 
        path: "/contractor/files", 
        icon: FolderOpen 
      },
      { 
        label: "Photos", 
        path: "/contractor/photos", 
        icon: Image 
      },
      { 
        label: "SmartReno Drive", 
        path: "/contractor/drive", 
        icon: HardDrive 
      }
    ]
  },
  {
    title: "Team Management",
    items: [
      {
        label: "Architect/Designer",
        path: "/architect/dashboard",
        icon: Briefcase,
        requiredRoles: ["admin", "contractor", "architect"]
      },
      {
        label: "Estimator Team",
        path: "/estimator/dashboard",
        icon: Calculator,
        requiredRoles: ["admin", "contractor", "estimator"]
      },
      {
        label: "Foreman Portal",
        path: "/contractor/foreman-portal",
        icon: UserCog,
        requiredRoles: ["admin", "contractor", "foreman"]
      },
      {
        label: "Outside Sales",
        path: "/contractor/outside-sales",
        icon: MapPin,
        requiredRoles: ["admin", "contractor", "outside_sales"]
      },
      {
        label: "Project Coordinator",
        path: "/contractor/coordinator-pipeline",
        icon: ClipboardCheck,
        requiredRoles: ["admin", "contractor", "project_coordinator"]
      },
      {
        label: "Project Manager",
        path: "/contractor/project-manager-pipeline",
        icon: ClipboardList,
        requiredRoles: ["admin", "contractor", "project_manager"]
      },
      {
        label: "PM Appointment Requests",
        path: "/contractor/pm-appointments",
        icon: Calendar,
        requiredRoles: ["admin", "contractor", "project_manager"]
      },
      {
        label: "Subcontractor Appointments",
        path: "/contractor/subcontractor-appointments",
        icon: Calendar,
        requiredRoles: ["admin", "contractor", "subcontractor"]
      },
      {
        label: "Subcontractor Portal",
        path: "/contractor/subcontractor-portal",
        icon: Building,
        requiredRoles: ["admin", "contractor", "subcontractor"]
      },
      {
        label: "Team Invitations",
        path: "/contractor/team-invitations",
        icon: Mail,
        requiredRoles: ["admin", "contractor"]
      }
    ]
  },
  {
    title: "Account",
    items: [
      { 
        label: "Settings", 
        path: "/contractor/settings", 
        icon: Settings 
      },
      { 
        label: "Finance & Billing", 
        path: "/contractor/finance", 
        icon: Wallet 
      },
      { 
        label: "Help Center & Demos", 
        path: "/contractor/help-center", 
        icon: HelpCircle 
      }
    ]
  }
];
