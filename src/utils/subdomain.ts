/**
 * Detect if the current hostname is the admin subdomain.
 * Matches: admin.smartreno.io, admin.localhost, etc.
 * In development/preview, also check for ?subdomain=admin query param.
 */
export function isAdminSubdomain(): boolean {
  const hostname = window.location.hostname;
  
  // Production: admin.smartreno.io
  if (hostname === "admin.smartreno.io") return true;
  
  // Development: admin.localhost
  if (hostname === "admin.localhost") return true;
  
  // Preview/dev fallback: ?subdomain=admin query param
  const params = new URLSearchParams(window.location.search);
  if (params.get("subdomain") === "admin") return true;
  
  return false;
}

/**
 * Get the admin subdomain URL for redirecting internal users.
 */
export function getAdminSubdomainUrl(): string {
  if (window.location.hostname.includes("smartreno.io")) {
    return "https://admin.smartreno.io";
  }
  // Fallback for dev/preview
  return window.location.origin + "?subdomain=admin";
}
