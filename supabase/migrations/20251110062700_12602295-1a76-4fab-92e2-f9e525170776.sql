-- Create table for storing project tasks
CREATE TABLE public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'pending',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing project milestones
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_date DATE NOT NULL,
  milestone_type TEXT NOT NULL DEFAULT 'major',
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  icon_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_tasks
CREATE POLICY "Contractors can view tasks for their projects"
  ON public.project_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_projects
      WHERE contractor_projects.id = project_tasks.project_id
      AND contractor_projects.contractor_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can insert tasks for their projects"
  ON public.project_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contractor_projects
      WHERE contractor_projects.id = project_tasks.project_id
      AND contractor_projects.contractor_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can update tasks for their projects"
  ON public.project_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_projects
      WHERE contractor_projects.id = project_tasks.project_id
      AND contractor_projects.contractor_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can delete tasks for their projects"
  ON public.project_tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_projects
      WHERE contractor_projects.id = project_tasks.project_id
      AND contractor_projects.contractor_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for project_milestones
CREATE POLICY "Contractors can view milestones for their projects"
  ON public.project_milestones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_projects
      WHERE contractor_projects.id = project_milestones.project_id
      AND contractor_projects.contractor_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can insert milestones for their projects"
  ON public.project_milestones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contractor_projects
      WHERE contractor_projects.id = project_milestones.project_id
      AND contractor_projects.contractor_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can update milestones for their projects"
  ON public.project_milestones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_projects
      WHERE contractor_projects.id = project_milestones.project_id
      AND contractor_projects.contractor_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can delete milestones for their projects"
  ON public.project_milestones
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_projects
      WHERE contractor_projects.id = project_milestones.project_id
      AND contractor_projects.contractor_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Create indexes for performance
CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_start_date ON public.project_tasks(start_date);
CREATE INDEX idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX idx_project_milestones_date ON public.project_milestones(milestone_date);

-- Create triggers to update updated_at
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_updated_at();

CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_updated_at();