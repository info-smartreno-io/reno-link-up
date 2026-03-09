
CREATE TABLE IF NOT EXISTS public.project_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  cost_code TEXT,
  trade TEXT NOT NULL,
  phase TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  duration_days INTEGER NOT NULL DEFAULT 1,
  dependency UUID REFERENCES public.project_schedule(id),
  status TEXT NOT NULL DEFAULT 'not_started',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_project_schedule" ON public.project_schedule
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "estimator_read_project_schedule" ON public.project_schedule
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'estimator'));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scope_items' AND column_name = 'schedule_phase') THEN
    ALTER TABLE public.scope_items ADD COLUMN schedule_phase TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scope_items' AND column_name = 'estimated_duration_days') THEN
    ALTER TABLE public.scope_items ADD COLUMN estimated_duration_days INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scope_items' AND column_name = 'total_estimated_cost') THEN
    ALTER TABLE public.scope_items ADD COLUMN total_estimated_cost NUMERIC;
  END IF;
END $$;
