-- Create schedule templates table
CREATE TABLE IF NOT EXISTS public.schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL,
  estimated_duration_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create schedule template phases table
CREATE TABLE IF NOT EXISTS public.schedule_template_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.schedule_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create schedule template tasks table
CREATE TABLE IF NOT EXISTS public.schedule_template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_phase_id UUID NOT NULL REFERENCES public.schedule_template_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_template_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_template_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule_templates
CREATE POLICY "Anyone can view templates"
  ON public.schedule_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert templates"
  ON public.schedule_templates
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update templates"
  ON public.schedule_templates
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete templates"
  ON public.schedule_templates
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for schedule_template_phases
CREATE POLICY "Anyone can view template phases"
  ON public.schedule_template_phases
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert template phases"
  ON public.schedule_template_phases
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update template phases"
  ON public.schedule_template_phases
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete template phases"
  ON public.schedule_template_phases
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for schedule_template_tasks
CREATE POLICY "Anyone can view template tasks"
  ON public.schedule_template_tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert template tasks"
  ON public.schedule_template_tasks
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update template tasks"
  ON public.schedule_template_tasks
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete template tasks"
  ON public.schedule_template_tasks
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for better performance
CREATE INDEX idx_template_phases_template_id ON public.schedule_template_phases(template_id);
CREATE INDEX idx_template_tasks_phase_id ON public.schedule_template_tasks(template_phase_id);

-- Add trigger for updated_at
CREATE TRIGGER update_schedule_templates_updated_at
  BEFORE UPDATE ON public.schedule_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_updated_at();