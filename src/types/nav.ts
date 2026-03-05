import { LucideIcon } from "lucide-react";

export type AiContext = "global" | "sales" | "estimating" | "operations" | "project";

export interface NavItem {
  label: string;
  path?: string;
  icon?: LucideIcon;
  aiContext?: AiContext;
  badge?: "new" | "ai" | "beta";
  requiredRoles?: string[];
  subItems?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
  requiredRoles?: string[];
}
