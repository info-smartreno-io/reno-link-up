-- Allow anonymous INSERT into public.projects for /start-your-renovation (marketing intake only).
-- Does not grant SELECT/UPDATE/DELETE to anon. Existing estimator/auth policies unchanged.

DROP POLICY IF EXISTS "Anon can insert marketing projects" ON public.projects;

CREATE POLICY "Anon can insert marketing projects"
  ON public.projects
  FOR INSERT
  TO anon
  WITH CHECK (
    homeowner_id IS NULL
    AND user_id IS NULL
  );
