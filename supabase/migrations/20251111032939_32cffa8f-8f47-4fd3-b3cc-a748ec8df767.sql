-- Create project_schedules table
CREATE TABLE public.project_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  project_id UUID,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedule_phases table
CREATE TABLE public.schedule_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.project_schedules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-blue-600',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedule_resources table
CREATE TABLE public.schedule_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  hourly_rate NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedule_tasks table
CREATE TABLE public.schedule_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.project_schedules(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.schedule_phases(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  workdays INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold')),
  color TEXT NOT NULL DEFAULT 'bg-blue-600',
  sort_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Create schedule_dependencies table (for task predecessors)
CREATE TABLE public.schedule_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.schedule_tasks(id) ON DELETE CASCADE,
  predecessor_task_id UUID NOT NULL REFERENCES public.schedule_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, predecessor_task_id)
);

-- Create schedule_assignments table (resource assignments to tasks)
CREATE TABLE public.schedule_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.schedule_tasks(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.schedule_resources(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL,
  UNIQUE(task_id, resource_id)
);

-- Enable RLS
ALTER TABLE public.project_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_schedules
CREATE POLICY "Admins and estimators can view all schedules"
  ON public.project_schedules FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins and estimators can create schedules"
  ON public.project_schedules FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins and estimators can update schedules"
  ON public.project_schedules FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins can delete schedules"
  ON public.project_schedules FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for schedule_phases
CREATE POLICY "Admins and estimators can view phases"
  ON public.schedule_phases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins and estimators can manage phases"
  ON public.schedule_phases FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

-- RLS Policies for schedule_resources
CREATE POLICY "Admins and estimators can view resources"
  ON public.schedule_resources FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins can manage resources"
  ON public.schedule_resources FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for schedule_tasks
CREATE POLICY "Admins and estimators can view tasks"
  ON public.schedule_tasks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins and estimators can create tasks"
  ON public.schedule_tasks FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins and estimators can update tasks"
  ON public.schedule_tasks FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins can delete tasks"
  ON public.schedule_tasks FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for schedule_dependencies
CREATE POLICY "Admins and estimators can view dependencies"
  ON public.schedule_dependencies FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins and estimators can manage dependencies"
  ON public.schedule_dependencies FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

-- RLS Policies for schedule_assignments
CREATE POLICY "Admins and estimators can view assignments"
  ON public.schedule_assignments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins and estimators can manage assignments"
  ON public.schedule_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

-- Create updated_at triggers
CREATE TRIGGER update_project_schedules_updated_at
  BEFORE UPDATE ON public.project_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_updated_at();

CREATE TRIGGER update_schedule_resources_updated_at
  BEFORE UPDATE ON public.schedule_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_updated_at();

CREATE TRIGGER update_schedule_tasks_updated_at
  BEFORE UPDATE ON public.schedule_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_schedule_tasks_schedule_id ON public.schedule_tasks(schedule_id);
CREATE INDEX idx_schedule_tasks_phase_id ON public.schedule_tasks(phase_id);
CREATE INDEX idx_schedule_tasks_status ON public.schedule_tasks(status);
CREATE INDEX idx_schedule_phases_schedule_id ON public.schedule_phases(schedule_id);
CREATE INDEX idx_schedule_dependencies_task_id ON public.schedule_dependencies(task_id);
CREATE INDEX idx_schedule_dependencies_predecessor ON public.schedule_dependencies(predecessor_task_id);
CREATE INDEX idx_schedule_assignments_task_id ON public.schedule_assignments(task_id);
CREATE INDEX idx_schedule_assignments_resource_id ON public.schedule_assignments(resource_id);