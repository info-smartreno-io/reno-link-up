export type PortalKey = "homeowner" | "contractor" | "estimator" | "admin" | "architect" | "interiordesigner" | "vendor";

export const PORTAL_URLS: Record<PortalKey, string> = {
  homeowner: "/homeowner/portal",
  contractor: "/contractor/dashboard",
  estimator: "/estimator/dashboard",
  admin: "/admin/dashboard",
  architect: "/architect/dashboard",
  interiordesigner: "/interiordesigner/dashboard",
  vendor: "/vendor/dashboard",
};

export const PORTAL_LABELS: Record<PortalKey, string> = {
  homeowner: "Homeowner Portal",
  contractor: "Contractor Portal",
  estimator: "Estimator Portal",
  admin: "Admin Portal",
  architect: "Architect Portal",
  interiordesigner: "Interior Designer Portal",
  vendor: "Vendor Portal",
};
