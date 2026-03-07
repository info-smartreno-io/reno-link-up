// src/config/adminSidebar.ts
import type { ComponentType } from "react";
import {
  LayoutDashboard, CalendarClock, ClipboardList, FileBarChart2, ShieldCheck,
  Wrench, ListChecks, BookOpen, FileStack, CheckSquare, HardHat, DollarSign,
  FileEdit, ShoppingCart, Receipt, FileText, Building2, Users, MessageSquare,
  FolderClosed, Clock3, MapPinned, BusFront, Boxes, BarChart3, Sliders,
  Sparkles, FolderKanban, TrendingUp, Shield, UserPlus, Home, Briefcase,
  Palette, Package, Handshake, HardDrive, Calculator, Brain, Network,
  Clock, FileCheck, ThumbsUp, Gavel, FolderOpen, Bell, Settings
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
  | "schedule_conflicts"
  | "logs_today"
  | "rfis_open"
  | "submittals_due"
  | "punch_open"
  | "safety_incidents_open"
  | "co_pending"
  | "pos_pending"
  | "bills_unapproved"
  | "invoices_outstanding"
  | "leads_new"
  | "estimates_due"
  | "selections_pending"
  | "bids_open"
  | "messages_unread"
  | "time_approvals"
  | "fleet_maintenance_due";

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
  // ── Operations (Primary Admin Lifecycle) ──
  {
    id: "operations",
    label: "Operations",
    icon: LayoutDashboard,
    children: [
      { id: "ops.dashboard", label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
      { id: "ops.intake", label: "Intake Review", to: "/admin/intake", icon: ClipboardList, badgeKey: "leads_new" },
      { id: "ops.estimating", label: "Estimating Hub", to: "/admin/estimating", icon: Calculator },
      { id: "ops.contractors", label: "Contractors", to: "/admin/contractors", icon: Users },
      { id: "ops.designers", label: "Designers / Architects", to: "/admin/designers", icon: Palette },
      { id: "ops.vendors_monitor", label: "Vendors", to: "/admin/vendor-monitoring", icon: Package },
      { id: "ops.rfps", label: "RFPs", to: "/admin/rfps", icon: FileText, badgeKey: "bids_open" },
      { id: "ops.bids", label: "Bid Review", to: "/admin/bids", icon: Gavel },
      { id: "ops.live_projects", label: "Live Projects", to: "/admin/live-projects", icon: Building2, badgeKey: "projects_open" },
      { id: "ops.files", label: "File Storage", to: "/admin/file-storage", icon: FolderOpen },
    ],
  },

  // ── Financials ──
  {
    id: "financials",
    label: "Financials",
    icon: DollarSign,
    children: [
      { id: "fin.estimate_requests", label: "Estimate Requests", to: "/admin/estimate-requests", icon: ClipboardList, badgeKey: "leads_new" },
      { id: "fin.estimates", label: "Estimates & Proposals", to: "/admin/crm", icon: FileBarChart2, badgeKey: "estimates_due" },
      { id: "fin.selections", label: "Client Selections", to: "/admin/selections", icon: Sliders },
      { id: "fin.change_orders", label: "Change Orders", to: "/admin/change-orders", icon: FileEdit, badgeKey: "co_pending" },
      { id: "fin.quickbooks", label: "QuickBooks® Integration", to: "/admin/quickbooks", icon: DollarSign },
      { id: "fin.invoicing", label: "Invoicing", to: "/admin/invoicing", icon: Receipt },
      { id: "fin.purchasing", label: "Purchasing", to: "/admin/procurement", icon: ShoppingCart },
      { id: "fin.vendors", label: "Vendors", to: "/admin/vendors", icon: Users },
      { id: "fin.docusign", label: "DocuSign® eSignatures", to: "/admin/docusign", icon: FileText },
    ],
  },

  // ── Scheduling ──
  {
    id: "scheduling",
    label: "Scheduling",
    icon: CalendarClock,
    children: [
      { id: "sched.projects", label: "Project Scheduling", to: "/admin/schedule", icon: CalendarClock },
      { id: "sched.calendars", label: "Calendars", to: "/admin/calendars", icon: CalendarClock },
      { id: "sched.smartplan", label: "SmartPlan Task List", to: "/admin/smartplan", icon: CheckSquare },
    ],
  },

  // ── Project Tracking ──
  {
    id: "project_tracking",
    label: "Project Tracking",
    icon: FolderKanban,
    children: [
      { id: "pt.logs", label: "Daily Logs", to: "/admin/logs", icon: FileStack, badgeKey: "logs_today" },
      { id: "pt.punch", label: "Punch Lists", to: "/admin/punch-list", icon: CheckSquare },
      { id: "pt.permits", label: "Permit Tracking", to: "/admin/permits", icon: FileText },
      { id: "pt.warranty", label: "Warranty Tracking", to: "/admin/warranty", icon: ShieldCheck },
    ],
  },

  // ── Communication ──
  {
    id: "communication",
    label: "Communication",
    icon: MessageSquare,
    children: [
      { id: "comm.messaging", label: "Messaging", to: "/admin/messages", icon: MessageSquare, badgeKey: "messages_unread" },
      { id: "comm.announcements", label: "Announcements", to: "/admin/announcements", icon: MessageSquare },
      { id: "comm.emails", label: "Inbound Emails", to: "/admin/emails", icon: MessageSquare },
      { id: "comm.portals", label: "Client Portals", to: "/admin/portal", icon: Users },
      { id: "comm.minutes", label: "Meeting Minutes", to: "/admin/minutes", icon: FileText },
    ],
  },

  // ── Sales & CRM ──
  {
    id: "sales_crm",
    label: "Sales & CRM",
    icon: Users,
    children: [
      { id: "crm.leads", label: "Lead Tracking", to: "/admin/crm", icon: Users, badgeKey: "leads_new" },
      { id: "crm.opportunities", label: "Opportunities", to: "/admin/opportunities", icon: TrendingUp },
      { id: "crm.reporting", label: "Sales Reporting", to: "/admin/sales-reports", icon: BarChart3 },
    ],
  },

  // ── Files & Photos ──
  {
    id: "files_photos",
    label: "Files & Photos",
    icon: FolderClosed,
    children: [
      { id: "files.management", label: "File Management", to: "/admin/files", icon: FileText },
      { id: "files.photos", label: "Photos", to: "/admin/photos", icon: FileText },
      { id: "files.drive", label: "SmartReno Drive", to: "/admin/drive", icon: FolderClosed },
    ],
  },

  // ── Team Management ──
  {
    id: "team_management",
    label: "Team Management",
    icon: Users,
    children: [
      { id: "team.contacts", label: "Contacts & Companies", to: "/admin/users", icon: Users },
      { id: "team.roles", label: "Role Management", to: "/admin/role-management", icon: ShieldCheck },
      { id: "team.time", label: "Time Tracking", to: "/admin/time", icon: Clock3, badgeKey: "time_approvals" },
      { id: "team.subs", label: "Subcontractor Portals", to: "/admin/vendor-applications", icon: Building2 },
      { id: "team.insurance", label: "Insurance & Certificates", to: "/admin/insurance", icon: ShieldCheck },
    ],
  },

  // ── Planroom & Takeoff ──
  {
    id: "planroom",
    label: "Planroom & Takeoff",
    icon: FileText,
    children: [
      { id: "plan.markup", label: "Planroom & Markup", to: "/admin/docs", icon: FileText },
      { id: "plan.takeoff", label: "Integrated Takeoff", to: "/admin/takeoff", icon: FileBarChart2 },
    ],
  },

  // ── Document Management ──
  {
    id: "document_mgmt",
    label: "Document Management",
    icon: FileStack,
    children: [
      { id: "doc.rfis", label: "RFI Tracking", to: "/admin/rfis", icon: BookOpen, badgeKey: "rfis_open" },
      { id: "doc.submittals", label: "Submittals", to: "/admin/submittals", icon: FileText, badgeKey: "submittals_due" },
      { id: "doc.transmittals", label: "Transmittals", to: "/admin/transmittals", icon: FileText },
    ],
  },

  // ── Business Intelligence ──
  {
    id: "business_intelligence",
    label: "Business Intelligence",
    icon: BarChart3,
    children: [
      { id: "bi.scorecard", label: "Project Scorecard™", to: "/admin/dashboard", icon: LayoutDashboard },
      { id: "bi.resources", label: "Resource Tracking", to: "/admin/resources", icon: Users },
      { id: "bi.multi_schedule", label: "Multi-Project Scheduling", to: "/admin/multi-schedule", icon: CalendarClock, badgeKey: "schedule_conflicts" },
      { id: "bi.profitability", label: "Profitability Reporting", to: "/admin/analytics", icon: BarChart3 },
      { id: "bi.sales_performance", label: "Sales Performance", to: "/admin/sales-performance", icon: TrendingUp },
      { id: "bi.security", label: "Security Dashboard", to: "/admin/security", icon: Shield },
    ],
  },

  // ── SmartReno Applicants ──
  {
    id: "smartreno_applicants",
    label: "SmartReno Applicants",
    icon: UserPlus,
    separatorAbove: true,
    children: [
      { id: "app.homeowner", label: "Home Owner", to: "/admin/applicants/homeowner", icon: Home },
      { id: "app.estimator", label: "Estimator", to: "/admin/applicants/estimator", icon: ClipboardList },
      { id: "app.gc", label: "General Contractor", to: "/admin/applicants/general-contractor", icon: HardHat },
      { id: "app.architect", label: "Architect/Designers", to: "/admin/applicants/architect-designers", icon: Palette },
      { id: "app.vendors", label: "Vendors", to: "/admin/applicants/vendors", icon: Package },
      { id: "app.partners", label: "Partners", to: "/admin/applicants/partners", icon: Handshake },
      { id: "app.subs", label: "Sub Contractors", to: "/admin/applicants/subcontractors", icon: Building2 },
      { id: "app.project_calculator", label: "Project Calculator", to: "/admin/applicants/project-calculator", icon: Calculator },
      { id: "app.prequalification", label: "Pre-Qualification", to: "/admin/applicants/pre-qualification", icon: FileText },
    ],
  },

  // ── SmartReno AI ──
  {
    id: "smartreno-ai",
    label: "SmartReno AI",
    icon: Brain,
    roles: ["admin"],
    separatorAbove: true,
    children: [
      { id: "ai.overview", label: "AI Overview", to: "/admin/ai/overview", icon: Brain },
      { id: "ai.project", label: "Project AI (QA & Estimates)", to: "/admin/ai/project", icon: Sparkles },
      { id: "ai.contractor", label: "Contractor & Network AI", to: "/admin/ai/contractor", icon: Network },
      { id: "ai.timeline", label: "Timeline & Communication AI", to: "/admin/ai/timeline", icon: Clock },
      { id: "ai.permit", label: "Permit AI & Compliance", to: "/admin/ai/permit", icon: FileCheck },
      { id: "ai.warranty", label: "Warranty AI", to: "/admin/ai/warranty", icon: Shield },
      { id: "ai.feedback", label: "AI Feedback & Training", to: "/admin/ai/feedback", icon: ThumbsUp },
    ],
  },

  // ── Web Dev ──
  {
    id: "web-dev",
    label: "Web Dev",
    icon: HardDrive,
    roles: ["admin"],
    separatorAbove: true,
    children: [
      { id: "webdev.ai-seo", label: "AI SEO Maintenance", to: "/admin/ai", icon: Sparkles },
      { id: "webdev.ai-images", label: "AI Image Generator", to: "/admin/ai-images", icon: Sparkles },
    ],
  },
];
