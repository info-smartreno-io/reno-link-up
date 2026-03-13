-- Allow estimators and admins to read intake site visit projects (visit_confirmed = true)
-- so they can see homeowner-scheduled visits in estimator dashboard and admin views.
-- Does not change homeowner or pipeline behavior.

CREATE POLICY "Estimators can view intake site visit projects"
  ON public.projects FOR SELECT TO authenticated
  USING (
    visit_confirmed = true
    AND has_role(auth.uid(), 'estimator'::app_role)
  );

-- Allow estimators and admins to read project_details for intake projects
CREATE POLICY "Estimators and admins can read project_details for intake visits"
  ON public.project_details FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_details.project_id AND p.visit_confirmed = true
    )
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'estimator'::app_role)
    )
  );

-- Allow estimators and admins to read public.users for homeowners linked to intake site visit projects.
-- Enable RLS on public.users if not already (required to attach policies).
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Ensure users can still read their own row (existing homeowner/contractor behavior).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can read own user row') THEN
    CREATE POLICY "Users can read own user row"
      ON public.users FOR SELECT TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

CREATE POLICY "Estimators and admins can view intake homeowner profile"
  ON public.users FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role))
    AND id IN (SELECT user_id FROM public.projects WHERE visit_confirmed = true AND user_id IS NOT NULL)
  );
