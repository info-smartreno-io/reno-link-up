
-- Site visit appointments table
CREATE TABLE IF NOT EXISTS public.site_visit_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_visit_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can view own appointments"
  ON public.site_visit_appointments FOR SELECT
  TO authenticated
  USING (homeowner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Homeowners can create appointments"
  ON public.site_visit_appointments FOR INSERT
  TO authenticated
  WITH CHECK (homeowner_id = auth.uid());

CREATE POLICY "Homeowners can update own appointments"
  ON public.site_visit_appointments FOR UPDATE
  TO authenticated
  USING (homeowner_id = auth.uid() OR public.is_admin(auth.uid()));

-- Add intake fields to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS budget_range TEXT,
  ADD COLUMN IF NOT EXISTS financing_needed TEXT,
  ADD COLUMN IF NOT EXISTS design_needed TEXT,
  ADD COLUMN IF NOT EXISTS material_help TEXT,
  ADD COLUMN IF NOT EXISTS permit_expectation TEXT,
  ADD COLUMN IF NOT EXISTS project_size TEXT,
  ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS property_data JSONB,
  ADD COLUMN IF NOT EXISTS homeowner_id UUID;

-- Add homeowner profile fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS homeowner_status TEXT,
  ADD COLUMN IF NOT EXISTS has_renovated_before BOOLEAN,
  ADD COLUMN IF NOT EXISTS preferred_communication TEXT,
  ADD COLUMN IF NOT EXISTS project_timeline TEXT;
