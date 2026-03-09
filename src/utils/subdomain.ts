/**
 * Subdomain detection utility for SmartReno.
 * Determines whether the app is running on the admin subdomain
 * to serve internal-only routes.
 */

const ADMIN_HOSTNAMES = [
  "admin.smartreno.io",
  "admin.localhost",
];

let _cachedResult: boolean | null = null;

/**
 * Detect if the current hostname is the admin subdomain.
 * Result is cached after first call for the lifetime of the page.
 * 
 * Matches:
 * - admin.smartreno.io (production)
 * - admin.localhost (local development)
 * - Any URL with ?subdomain=admin (preview/testing)
 */
export function isAdminSubdomain(): boolean {
  if (_cachedResult !== null) return _cachedResult;

  const hostname = window.location.hostname;

  // Check known admin hostnames
  if (ADMIN_HOSTNAMES.includes(hostname)) {
    _cachedResult = true;
    return true;
  }

  // Preview/dev fallback: ?subdomain=admin query param
  const params = new URLSearchParams(window.location.search);
  if (params.get("subdomain") === "admin") {
    _cachedResult = true;
    return true;
  }

  _cachedResult = false;
  return false;
}

/**
 * Get the admin subdomain URL for linking internal users.
 */
export function getAdminSubdomainUrl(): string {
  if (window.location.hostname.includes("smartreno.io")) {
    return "https://admin.smartreno.io";
  }
  // Fallback for dev/preview — append query param
  return window.location.origin + "?subdomain=admin";
}
