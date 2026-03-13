# QA: Intake Site Visits – Estimator/Admin Visibility

## Summary

Homeowner post-intake scheduling and project details are now visible to estimators and admins. No homeowner UX or routing was changed. Pipeline (leads/walkthroughs/estimates) behavior is unchanged.

---

## Files changed

| File | Change |
|------|--------|
| `supabase/migrations/20260313100000_intake_site_visits_estimator_admin_rls.sql` | **New.** RLS: estimators can SELECT intake projects; estimators + admin can SELECT project_details and users for those projects; RLS + “own row” policy on `public.users` if needed. |
| `src/hooks/useIntakeSiteVisits.ts` | **New.** Hook `useIntakeSiteVisits()` and `fetchIntakeProjectDetails(projectId)` for list + detail with loading/error; treats missing `project_details` as incomplete, not error. |
| `src/pages/EstimatorDashboard.tsx` | Intake Site Visits card (list + “Details done” / “Missing details”), “View details” opens sheet with full project + details; loading, empty, error states. |
| `src/pages/admin/AdminIntakeReview.tsx` | “Homeowner-scheduled site visits” table (same data as estimator), detail sheet; loading, empty, error states. |
| `docs/QA-INTAKE-SITE-VISITS-STAFF-VISIBILITY.md` | This QA deliverable. |

---

## Logic summary

1. **Data source**  
   Intake site visits = `projects` with `visit_confirmed = true`. No new tables. Homeowner name from `public.users` (via `projects.user_id`). Details from `project_details` (one row per project); photo URLs in `measurements.photo_urls`.

2. **RLS**  
   - **projects:** New policy lets estimators SELECT where `visit_confirmed = true`. Admin already had full SELECT.  
   - **project_details:** New policy lets estimators and admin SELECT rows whose project has `visit_confirmed = true`.  
   - **users:** RLS enabled on `public.users` if not already; “Users can read own user row” added so existing app behavior still works; new policy lets estimators and admin SELECT users that appear as `user_id` on intake projects.

3. **Estimator dashboard**  
   New “Intake Site Visits” card on the right column: list of intake visits with homeowner name, project type, address, scheduled date, and “Details done” / “Missing details”. “View details” opens a sheet with full project + project_details (description, measurements, materials, inspiration links, photo URLs). Missing `project_details` shows “Details not yet provided” (no error/white screen).

4. **Admin**  
   On Intake Review, new “Homeowner-scheduled site visits” table below the pipeline leads table. Same columns and detail sheet as estimator. Admin can see which intake projects have a visit scheduled, which have details, and which are ready for estimator review.

5. **Loading / empty / error**  
   All list and detail views: loading state, empty state (“No intake site visits” / “No homeowner-scheduled visits”), and error state (message, no white screen). Missing details = “Missing details” / “Details not yet provided”, not an error.

---

## SQL (migration)

Migration: `supabase/migrations/20260313100000_intake_site_visits_estimator_admin_rls.sql`

- `CREATE POLICY "Estimators can view intake site visit projects"` on `public.projects` (SELECT where `visit_confirmed = true` and estimator role).
- `CREATE POLICY "Estimators and admins can read project_details for intake visits"` on `public.project_details` (SELECT where project has `visit_confirmed = true` and user is estimator or admin).
- `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY` (if not already).
- `CREATE POLICY "Users can read own user row"` on `public.users` (SELECT where `auth.uid() = id`) if it does not already exist.
- `CREATE POLICY "Estimators and admins can view intake homeowner profile"` on `public.users` (SELECT for estimator/admin and `id IN (SELECT user_id FROM projects WHERE visit_confirmed = true)`).

Apply with:

```bash
npx supabase db push
# or
npx supabase migration up
```

---

## Manual QA steps

1. **Apply migration**  
   Run the migration above. Confirm no errors (especially on `public.users` if RLS was not previously enabled).

2. **Homeowner flow (unchanged)**  
   - Log in as homeowner, complete intake, go to dashboard.  
   - Schedule a visit (`/homeowner/schedule-visit`), confirm.  
   - Submit project details (`/homeowner/project-details`) (optionally with description, measurements, materials, inspiration links, photos).  
   - Confirm NextStepsCard and routes behave as before. No new errors or white screens.

3. **Estimator dashboard**  
   - Log in as a user with estimator role.  
   - Open `/estimator/dashboard`.  
   - Find the “Intake Site Visits” card (right column, below “Recent Activity”).  
   - **Empty:** With no intake projects with `visit_confirmed = true`, see “No intake site visits” and no error.  
   - **With data:** Create at least one project with `visit_confirmed = true` (e.g. via homeowner flow). Refresh; list shows homeowner name, project type, address, scheduled visit date, and “Details done” or “Missing details”.  
   - Click “View details”: sheet opens with project + details. If `project_details` exists, show description, measurements, materials, inspiration links, photo URLs. If not, show “Details not yet provided” (no error).  
   - Confirm loading state while list/detail is fetching.  
   - Simulate error (e.g. disconnect or invalid role): see error message, no white screen.

4. **Admin Intake Review**  
   - Log in as admin.  
   - Open the Intake Review page (`/admin/intake` or as in your sidebar).  
   - Below the pipeline leads table, find “Homeowner-scheduled site visits”.  
   - Same checks: empty state, list with correct columns, “View details” sheet, loading/error, missing details shown as “Missing” / “Details not yet provided”.

5. **Pipeline unchanged**  
   - As estimator, confirm “Actions Required”, “Upcoming Schedule”, “Recent Activity” still load from leads/walkthroughs and behave as before.  
   - As admin, confirm existing Intake Review leads table and Estimating Hub still work.

6. **RLS**  
   - As estimator, confirm you only see intake projects (visit_confirmed = true), not other homeowners’ projects.  
   - As admin, confirm you see the same intake list and can open details.  
   - As homeowner, confirm you can still read your own `users` row and your project/project_details (no regression).

---

## Assumptions

- **Roles:** Estimator and admin are enforced via `user_roles` and `has_role(auth.uid(), 'estimator'::app_role)` / `has_role(auth.uid(), 'admin'::app_role)`.  
- **Intake vs pipeline:** Intake site visits are identified by `projects.visit_confirmed = true` and are separate from `leads` / `walkthroughs`; no sync into `site_visit_appointments` or walkthroughs in this change.  
- **Routing:** Estimator dashboard at `/estimator/dashboard`; admin Intake Review at `/admin/intake`. No new routes added.  
- **Queue pattern:** Reused existing estimator dashboard card layout and admin Intake Review table + sheet; no second queue or duplicate system.  
- **public.users RLS:** If `public.users` did not have RLS before, the migration enables it and adds “Users can read own user row” so existing reads (e.g. homeowner profile) continue to work.
