// src/config/adminSidebar.ts
import type { ComponentType } from "react";
import {
  LayoutDashboard, ClipboardList, Calculator, Users, Palette,
  BarChart3, Building2, FileText, Gavel, Brain, Package,
  TrendingUp, DollarSign, MapPinned, Home, FolderKanban,
  Bell, Settings, FlaskConical, Sparkles, HardDrive,
  UserPlus, HardHat, Handshake, Shield, CreditCard, Calendar,
  ArrowRightLeft
} from "lucide-react";

/** Which roles can see which items */
export type NavRole =
  | "admin"
  | "estimator"
  | "project_coordinator"
  | "client_success"
  | "call_center";

/** Optional keys used by your store/API to show live counts */
export type BadgeKey =
  | "projects_open"
  | "leads_new"
  | "estimates_due"
  | "bids_open"
  | "messages_unread"
  | "co_pending"
  | "logs_today"
  | "rfis_open"
  | "selections_pending"
  | "fleet_maintenance_due"
  | "schedule_conflicts";

export type NavItem = {
  id: string;
  label: string;
  to?: string;
  icon?: ComponentType<any>;
  roles?: NavRole[];
  badgeKey?: BadgeKey;
  children?: NavItem[];
  separatorAbove?: boolean;
};

export const ADMIN_SIDENAV: NavItem[] = [
  // ── 1. Dashboard (Platform KPIs) ──
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    children: [
      { id: "dash.overview", label: "Platform KPIs", to: "/admin/dashboard", icon: LayoutDashboard },
      { id: "dash.pipeline", label: "Project Pipeline", to: "/admin/pipeline", icon: FolderKanban, badgeKey: "projects_open" },
    ],
  },

  // ── 2. Project Pipeline ──
  {
    id: "projects",
    label: "Projects",
    icon: Building2,
    children: [
      { id: "proj.intake", label: "Intake Review", to: "/admin/intake", icon: ClipboardList, badgeKey: "leads_new" },
      { id: "proj.property_reports", label: "Property Reports", to: "/admin/property-reports", icon: Home },
      { id: "proj.smart_estimates", label: "Smart Estimates", to: "/admin/smart-estimates", icon: Brain },
      { id: "proj.rfps", label: "RFPs", to: "/admin/rfps", icon: FileText, badgeKey: "bids_open" },
      { id: "proj.bid_packets", label: "Bid Packets", to: "/admin/bid-packets", icon: Package },
      { id: "proj.bids", label: "Bid Review", to: "/admin/bids", icon: Gavel },
      { id: "proj.live", label: "Live Projects", to: "/admin/live-projects", icon: Building2, badgeKey: "projects_open" },
      { id: "proj.timeline", label: "Project Timeline", to: "/admin/project-timeline", icon: Calendar },
    ],
  },

  // ── 3. Cost Code Library ──
  {
    id: "cost-codes",
    label: "Cost Code Library",
    icon: Calculator,
    children: [
      { id: "cc.library", label: "Master Cost Codes", to: "/admin/cost-codes", icon: Calculator },
      { id: "cc.contractor", label: "Contractor Cost Codes", to: "/admin/estimating", icon: ClipboardList },
    ],
  },

  // ── 4. Financial Engine ──
  {
    id: "financials",
    label: "Financial Engine",
    icon: DollarSign,
    children: [
      { id: "fin.overview", label: "Financial Overview", to: "/admin/financial-engine", icon: DollarSign },
      { id: "fin.change_orders", label: "Change Orders", to: "/admin/change-orders-manager", icon: ArrowRightLeft, badgeKey: "co_pending" },
      { id: "fin.vendor_quotes", label: "Vendor Quotes", to: "/admin/vendor-quotes", icon: Package },
    ],
  },

  // ── 5. Contractor Network ──
  {
    id: "contractor-network",
    label: "Contractor Network",
    icon: Users,
    children: [
      { id: "cn.contractors", label: "Contractors", to: "/admin/contractors", icon: Users },
      { id: "cn.imported", label: "Imported Businesses", to: "/admin/imported-businesses", icon: MapPinned },
      { id: "cn.vendors", label: "Vendors", to: "/admin/vendor-monitoring", icon: Package },
    ],
  },

  // ── 6. Designer / Architect Network ──
  {
    id: "designer-network",
    label: "Designer Network",
    icon: Palette,
    children: [
      { id: "dn.professionals", label: "Design Professionals", to: "/admin/design-professionals", icon: Palette },
      { id: "dn.packages", label: "Design Packages", to: "/admin/design-packages", icon: FolderKanban },
    ],
  },

  // ── 7. Platform Analytics ──
  {
    id: "analytics",
    label: "Platform Analytics",
    icon: BarChart3,
    children: [
      { id: "an.overview", label: "Analytics Overview", to: "/admin/analytics", icon: BarChart3 },
      { id: "an.deep", label: "Analytics Deep Dive", to: "/admin/analytics-deep", icon: TrendingUp },
      { id: "an.financials", label: "Financials", to: "/admin/financials", icon: DollarSign },
      { id: "an.sales", label: "Sales Performance", to: "/admin/sales-performance", icon: TrendingUp },
    ],
  },

  // ── System (admin only) ──
  {
    id: "system",
    label: "System",
    icon: Settings,
    roles: ["admin"],
    separatorAbove: true,
    children: [
      { id: "sys.notifications", label: "Notifications", to: "/admin/notifications", icon: Bell },
      { id: "sys.ai", label: "SmartReno AI", to: "/admin/ai/overview", icon: Sparkles },
      { id: "sys.security", label: "Security", to: "/admin/security", icon: Shield },
      { id: "sys.test", label: "Test Accounts", to: "/admin/test-accounts", icon: FlaskConical },
      { id: "sys.webdev", label: "Web Dev", to: "/admin/ai", icon: HardDrive },
    ],
  },
];
