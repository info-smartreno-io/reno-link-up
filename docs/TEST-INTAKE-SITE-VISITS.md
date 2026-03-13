# How to test intake site visits (estimator/admin) after deploy

## 1. Deploy

- **Git:** Changes are pushed to `main` (commit: feat: estimator/admin visibility for intake site visits).
- **Vercel:** If your repo is connected to Vercel, a deploy will start automatically on push to `main`. Check the Vercel dashboard for the new deployment.
- **Manual Vercel deploy (optional):**
  ```bash
  npx vercel --prod
  ```
  Or use the Vercel dashboard: **Deployments** → **Redeploy** the latest, or **Create Deployment** from `main`.

---

## 2. Apply database migration (required)

The new RLS policies only exist after you run the migration. Use your **Supabase** project (the one your app uses in production/staging).

**Option A – Supabase Dashboard (recommended for production):**
1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Open the migration file `supabase/migrations/20260313100000_intake_site_visits_estimator_admin_rls.sql` locally, copy its full contents, paste into the SQL Editor, and **Run**.

**Option B – Supabase CLI (linked to same project):**
```bash
npx supabase db push
```
Or run migrations one by one; ensure `20260313100000_intake_site_visits_estimator_admin_rls.sql` is applied.

If the migration fails (e.g. on `public.users`), check that:
- The `has_role` function exists (from earlier migrations).
- There are no conflicting policy names. If “Users can read own user row” already exists, you can skip that part of the migration or adjust the policy name.

---

## 3. Test on the deployed app

Use the **deployed URL** (e.g. `https://your-app.vercel.app`) so you’re testing the same build and env as production.

### A. Estimator dashboard

1. Log in as a user with **estimator** role.
2. Go to **/estimator/dashboard**.
3. **Intake Site Visits card** (right column, below “Recent Activity”):
   - You should see either:
     - **“No intake site visits”** (empty state), or
     - A list of intake visits with homeowner name, project type, address, scheduled date, and “Details done” or “Missing details”.
4. If there is at least one visit:
   - Click **“View details”** on a row.
   - A sheet should open with project info and, if the homeowner submitted details, description, measurements, materials, inspiration links, photo links. If they didn’t, it should say **“Details not yet provided”** (no error, no white screen).
5. Check:
   - Loading state appears briefly when the list or sheet loads.
   - No white screen; errors show a message, not a crash.

### B. Admin Intake Review

1. Log in as **admin**.
2. Go to **/admin/intake** (Intake Review).
3. Below the pipeline leads table you should see **“Homeowner-scheduled site visits”**.
4. Same checks as estimator:
   - Empty state or list with correct columns.
   - Click a row or “View” to open the detail sheet.
   - “Details not yet provided” when there are no project details; no error/white screen.

### C. Create test data (if list is empty)

To see rows in the intake lists:

1. Log in as a **homeowner** (or create a test homeowner).
2. Complete intake so you have a project.
3. Go to **/homeowner/schedule-visit**, pick a date/time, and confirm (this sets `visit_confirmed = true` and `scheduled_visit_at`).
4. Optionally go to **/homeowner/project-details** and submit description, measurements, etc.
5. Log back in as **estimator** or **admin** and refresh the dashboard or Intake Review; the new intake visit should appear. Open “View details” to confirm full project + details (or “Details not yet provided”).

### D. Sanity checks

- **Pipeline unchanged:** As estimator, “Actions Required”, “Upcoming Schedule”, “Recent Activity” still load and look correct.
- **Homeowner flow unchanged:** Schedule visit and project details as homeowner; no new errors or broken pages.
- **RLS:** Estimator only sees intake projects (visit_confirmed), not other homeowners’ projects. Admin sees the same intake list and can open details.

---

## 4. If something fails

- **“Could not load intake visits” / 403:** Migration not applied or RLS policy missing. Re-run the migration (or the relevant policy part) in Supabase.
- **Empty list when you expect data:** Confirm the project has `visit_confirmed = true` in Supabase (**Table Editor** → `projects`). Confirm the logged-in user has **estimator** or **admin** role in `user_roles`.
- **Vercel build errors:** Check the build logs in the Vercel dashboard; the committed code is only the intake site visits feature (EstimatorDashboard, AdminIntakeReview, useIntakeSiteVisits, migration, QA doc).
