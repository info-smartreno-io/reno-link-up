export type AppRole =
  | "admin"
  | "estimator"
  | "contractor"
  | "homeowner"
  | "design_professional"
  | "architect"
  | "interior_designer";

const ROLE_DASHBOARD_MAP: Record<AppRole, string> = {
  admin: "/admin/dashboard",
  estimator: "/estimator/dashboard",
  contractor: "/contractor/dashboard",
  homeowner: "/homeowner/dashboard",
  design_professional: "/design-professional/dashboard",
  architect: "/design-professional/dashboard",
  interior_designer: "/design-professional/dashboard",
};

export function getDashboardPathForRole(role: string | null | undefined): string | null {
  if (!role) return null;
  if ((ROLE_DASHBOARD_MAP as any)[role]) {
    return (ROLE_DASHBOARD_MAP as any)[role];
  }
  return null;
}

