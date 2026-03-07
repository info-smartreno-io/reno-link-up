

## Problem

There are **two separate homeowner portal systems** running in parallel:

1. **Legacy portal** (`/homeowner-portal`) — `HomeownerPortal.tsx` (1047 lines, old monolithic component with inline tabs, old project form, SearchBar). This is what the user sees and what login redirects to.
2. **New portal** (`/homeowner/dashboard`) — `HomeownerDashboard.tsx` (260 lines, uses hooks, site visit appointments, milestone tracker). This has the Intake 2.0 improvements but is orphaned — nobody navigates to it.

The Intake 2.0 changes (dynamic project types, site visit scheduling, expanded intake wizard) exist but are disconnected from the actual homeowner experience.

## Plan

### 1. Consolidate routing — make `/homeowner-portal` use the new system

- Change `/homeowner-portal` and `/homeowner/portal` routes in `App.tsx` to render `HomeownerLayout > HomeownerDashboardNew` instead of the legacy `HomeownerPortal`
- Update all login/redirect references (`UnifiedLogin.tsx`, `ProfileSetup.tsx`, `SettingsDropdown.tsx`) to point to `/homeowner/dashboard` as the canonical route
- Keep `/homeowner-portal` as a redirect to `/homeowner/dashboard` for backward compatibility

### 2. Add "Start a Project" button to the new dashboard

- Add a prominent CTA on `HomeownerDashboard.tsx` that links to `/start-your-renovation` (the Intake 2.0 wizard)
- Show this when the homeowner has no projects or as a secondary action

### 3. Clean up the old HomeownerPortal

- Remove the old `SearchBar` import and the inline search bar from the portal header
- The legacy `HomeownerPortal.tsx` file can be kept temporarily but will no longer be routed to

### 4. Mobile and desktop cleanup

- Remove the search bar from the homeowner overview (as requested: "remove the search bar that says 'search projects, clients and tasks'")
- Clean up the overview page layout for mobile (tighter spacing, better card stacking)
- Ensure the new `HomeownerLayout` sidebar works cleanly on mobile

### Files to modify

- `src/App.tsx` — redirect `/homeowner-portal` to new dashboard
- `src/pages/UnifiedLogin.tsx` — update redirect path
- `src/pages/ProfileSetup.tsx` — update redirect path
- `src/components/SettingsDropdown.tsx` — update navigation paths
- `src/pages/homeowner/HomeownerDashboard.tsx` — add "Start a Project" CTA, remove any search bar, mobile cleanup
- `src/pages/HomeownerAppointments.tsx`, `src/pages/HomeownerWarrantyClaim.tsx`, `src/pages/homeowner/HomeownerFiles.tsx` — update back-navigation to `/homeowner/dashboard`

