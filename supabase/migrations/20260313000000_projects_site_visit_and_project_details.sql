-- Add site visit fields to public.projects for homeowner next-steps workflow
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS scheduled_visit_at TIMESTAMPTZ;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS visit_confirmed BOOLEAN DEFAULT false;

-- project_details: detailed project info collected after site visit is scheduled
CREATE TABLE IF NOT EXISTS public.project_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  description TEXT,
  measurements JSONB DEFAULT '{}',
  materials JSONB DEFAULT '{}',
  inspiration_links TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_details_project_id ON public.project_details(project_id);

ALTER TABLE public.project_details ENABLE ROW LEVEL SECURITY;

-- Homeowner can manage project_details for their own projects
CREATE POLICY "Users can read own project_details"
  ON public.project_details FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_details.project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project_details"
  ON public.project_details FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_details.project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project_details"
  ON public.project_details FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_details.project_id AND p.user_id = auth.uid()
    )
  );
