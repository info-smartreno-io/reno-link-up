# Homeowner Portal – Implementation Plan (Most → Least Pressing)

Prioritized list to move the portal from ~80–85% to production-ready. Order is **most pressing to least**.

---

## Tier 1 – Must-fix (blocks or confuses users)

### 1.1 Remove debug logging in homeowner code
- **Why:** `console.log` in production looks unprofessional and can leak data.
- **Where:**  
  - `src/pages/homeowner/HomeownerDashboard.tsx` (lines ~95, ~402)  
  - `src/pages/homeowner/HomeownerProjects.tsx` (lines ~17, ~40)  
  - `src/pages/homeowner/HomeownerFiles.tsx` (line ~82)
- **Action:** Remove or replace with a proper logger (e.g. only in dev).

### 1.2 Handle invalid or missing project in project detail
- **Why:** Visiting `/homeowner/projects/bad-id/overview` or a project the user doesn’t own can show a broken or empty UI.
- **Where:** `src/pages/homeowner/HomeownerProjectDetail.tsx`, `HomeownerProjectOverview.tsx`, and other project sub-pages that use `projectId`.
- **Action:** If `useHomeownerProjectDetail(projectId)` returns no project or 404, show a clear “Project not found” (or “Access denied”) state and a link back to `/homeowner/projects` or dashboard. Optionally 404/redirect for invalid UUIDs.

### 1.3 Link to payment portal from homeowner portal
- **Why:** Invoice copy says “Visit https://smartreno.io/payments” but there’s no in-app way to get there; logged-in homeowners may expect “Pay invoice” in the portal.
- **Where:**  
  - `src/components/homeowner/HomeownerSidebar.tsx` and/or `src/components/SettingsDropdown.tsx` (or Account Settings).  
  - Optionally `src/pages/homeowner/AccountSettings.tsx` (payment methods / pay invoice section).
- **Action:** Add a “Pay invoice” or “Payments” item (e.g. in sidebar under Settings, or in Account Settings) that links to `/payments`. Keep label clear (e.g. “Pay invoice”).

---

## Tier 2 – High-value UX and clarity

### 2.1 Clarify “intake project” vs “contractor project” on dashboard
- **Why:** Dashboard shows either an active contractor project or an intake-style card; users can be confused about which “project” they’re in and what “View my project” does.
- **Where:** `src/pages/homeowner/HomeownerDashboard.tsx`, `IntakeStatusCard`, `FallbackIntakeProjectCard`, and any copy that says “project” without context.
- **Action:** Use distinct labels (e.g. “Your renovation request” for intake vs “Active project” for contractor). Make “View my project” / “View my bid packet” go to the right place (intake bid packet vs contractor project overview) and use consistent wording in cards and CTAs.

### 2.2 Unify or clarify Account Settings vs Settings
- **Why:** Two entry points (“Account Settings” and “Settings”) can feel duplicated; unclear which to use for password, payment info, or profile.
- **Where:** `src/pages/homeowner/AccountSettings.tsx`, `src/pages/homeowner/HomeownerSettings.tsx`, `HomeownerSidebar`, and any nav that links to them.
- **Action:** Either merge into one “Settings” (with sections) or clearly separate (e.g. “Account” = login/payment, “Settings” = preferences/notifications) and update sidebar/labels so the difference is obvious.

### 2.3 Friendly empty states and errors for key pages
- **Why:** Empty lists or failed loads should tell the user what to do next, not show a blank screen or generic error.
- **Where:**  
  - `src/pages/homeowner/HomeownerProjects.tsx` (no projects)  
  - `src/pages/homeowner/HomeownerFiles.tsx` (no files)  
  - `src/pages/homeowner/HomeownerNotifications.tsx` (no notifications)  
  - Messages (already has some empty state; keep consistent).
- **Action:** For “no data” and for query errors, show a short message and one clear CTA (e.g. “Start your renovation”, “Go to dashboard”, “Contact support”).

---

## Tier 3 – Feature completeness (no “coming soon” confusion)

### 3.1 Schedule Visit – hide or clarify disabled options
- **Why:** “Client success (coming soon)”, “PM (coming soon)”, etc. can make the flow feel incomplete.
- **Where:** `src/pages/homeowner/ScheduleVisit.tsx` (visit-type select).
- **Action:** Either (a) remove disabled options and only show “Construction agent” until others are built, or (b) keep them but add a short line above/below: “More visit types (e.g. with your PM or designer) will be available as your project progresses.”

### 3.2 Messages – same for audience options
- **Why:** Same “coming soon” pattern in Messages can confuse.
- **Where:** `src/pages/homeowner/HomeownerProjectMessages.tsx` (chat audience select).
- **Action:** Same as 3.1: hide disabled options for now, or keep with one sentence that more options appear when relevant (e.g. “Message your PM or contractor from your project when assigned”).

---

## Tier 4 – Thin project sub-pages (optional but useful)

### 4.1 Plans & 3D and Project Videos – basic list/upload or “coming later” message
- **Why:** Pages exist but are placeholder copy only; users may expect to see or upload files.
- **Where:**  
  - `src/pages/homeowner/HomeownerProjectPlans.tsx`  
  - `src/pages/homeowner/HomeownerProjectVideos.tsx`
- **Action (pick one):**  
  - **Option A:** Add a simple “Files will appear here when your team adds plans/videos” and a link to the main project Files tab.  
  - **Option B:** If you have a shared project-files API, show a read-only list of plans/videos (by category or type) and, if applicable, an “Request upload” or “Upload” CTA.  
  Prioritize Option A if you don’t have a clear data model for “plans” vs “videos” yet.

### 4.2 Other light project sub-pages (Survey, Inclusions, Materials, Scope, Timeline preview)
- **Where:** Corresponding `HomeownerProject*.tsx` under `src/pages/homeowner/`.
- **Action:** Audit each: if it’s only a title + “content will appear here”, add the same pattern as 4.1 (clear one-line message + link to Overview or Files). If any already pull real data, ensure loading and empty states are handled.

---

## Tier 5 – Polish and performance

### 5.1 Accessibility and mobile
- **Where:** All homeowner layout and key flows (dashboard, schedule visit, bid packet, payments).
- **Action:** Spot-check focus order, button labels, and form labels; ensure Schedule Visit and Payments are usable on small screens (touch targets, no horizontal scroll on forms).

### 5.2 Optional: Homeowner-facing invoice list
- **Why:** Homeowners who get multiple invoices may want to see “My invoices” and then “Pay” instead of only using the email link.
- **Where:** New route or section, e.g. under Account Settings or a “Billing” item in the sidebar; reuse existing invoices RLS (homeowner sees their own).
- **Action:** Low priority unless you get user feedback; then add a simple list (invoice #, amount due, status) with “Pay” linking to `/payments` with invoice number pre-filled or a deep link.

### 5.3 Analytics and monitoring
- **Where:** App-level or router.
- **Action:** Ensure key homeowner events are tracked (e.g. estimate payment started/completed, invoice payment started/completed, schedule visit submitted) for funnels and support.

---

## Summary order (copy-paste checklist)

1. **Tier 1:** Remove console logs → Handle invalid/missing project → Add Pay invoice / Payments link in portal  
2. **Tier 2:** Clarify intake vs contractor project wording → Unify or clarify Settings vs Account Settings → Empty/error states for Projects, Files, Notifications  
3. **Tier 3:** Schedule Visit and Messages – hide or explain “coming soon” options  
4. **Tier 4:** Plans/Videos (and other thin sub-pages) – at least clear “content when available” + link  
5. **Tier 5:** A11y/mobile pass → Optional invoice list → Analytics for key flows  

After Tier 2, the portal should feel coherent and production-ready for a v1; Tiers 3–5 refine clarity and completeness.
