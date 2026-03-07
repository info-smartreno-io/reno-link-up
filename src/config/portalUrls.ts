export type PortalKey = "homeowner" | "contractor" | "estimator" | "admin" | "design_professional" | "vendor";

export const PORTAL_URLS: Record<PortalKey, string> = {
  homeowner: "/homeowner/dashboard",
  contractor: "/contractor/dashboard",
  estimator: "/estimator/dashboard",
  admin: "/admin/dashboard",
  design_professional: "/design-professional/dashboard",
  vendor: "/vendor/dashboard",
};

export const PORTAL_LABELS: Record<PortalKey, string> = {
  homeowner: "Homeowner Portal",
  contractor: "Contractor Portal",
  estimator: "Estimator Portal",
  admin: "Admin Portal",
  design_professional: "Design Professional Portal",
  vendor: "Vendor Portal",
};
