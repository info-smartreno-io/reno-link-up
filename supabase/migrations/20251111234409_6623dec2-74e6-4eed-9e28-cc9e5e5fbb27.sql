-- Create foreman_tasks table
CREATE TABLE public.foreman_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id),
  task_title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  assigned_to UUID[], -- Array of user IDs
  assigned_team TEXT,
  due_date DATE,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  contractor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  blocked_reason TEXT
);

-- Create task_updates table for real-time field updates
CREATE TABLE public.task_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.foreman_tasks(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('status_change', 'photo', 'note', 'issue', 'completion', 'time_log')),
  content TEXT,
  photo_url TEXT,
  location TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_foreman_tasks_contractor ON public.foreman_tasks(contractor_id);
CREATE INDEX idx_foreman_tasks_project ON public.foreman_tasks(project_id);
CREATE INDEX idx_foreman_tasks_status ON public.foreman_tasks(status);
CREATE INDEX idx_task_updates_task ON public.task_updates(task_id);
CREATE INDEX idx_task_updates_created_at ON public.task_updates(created_at DESC);

-- Enable RLS
ALTER TABLE public.foreman_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for foreman_tasks
CREATE POLICY "Contractors can view their tasks"
  ON public.foreman_tasks FOR SELECT
  USING (
    contractor_id = auth.uid() OR 
    auth.uid() = ANY(assigned_to) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can insert their tasks"
  ON public.foreman_tasks FOR INSERT
  WITH CHECK (
    contractor_id = auth.uid() OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can update their tasks"
  ON public.foreman_tasks FOR UPDATE
  USING (
    contractor_id = auth.uid() OR 
    auth.uid() = ANY(assigned_to) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can delete their tasks"
  ON public.foreman_tasks FOR DELETE
  USING (
    contractor_id = auth.uid() OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for task_updates
CREATE POLICY "Users can view task updates for accessible tasks"
  ON public.task_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.foreman_tasks
      WHERE foreman_tasks.id = task_updates.task_id
      AND (
        foreman_tasks.contractor_id = auth.uid() OR
        auth.uid() = ANY(foreman_tasks.assigned_to) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "Users can insert updates for assigned tasks"
  ON public.task_updates FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.foreman_tasks
      WHERE foreman_tasks.id = task_updates.task_id
      AND (
        foreman_tasks.contractor_id = auth.uid() OR
        auth.uid() = ANY(foreman_tasks.assigned_to) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

-- Update timestamp trigger for foreman_tasks
CREATE OR REPLACE FUNCTION update_foreman_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_foreman_tasks_timestamp
  BEFORE UPDATE ON public.foreman_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_foreman_tasks_updated_at();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.foreman_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_updates;