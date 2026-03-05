-- Phase 10: AI Autonomous Coordinator Mode
-- Create coordinator_reports table
CREATE TABLE IF NOT EXISTS public.coordinator_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  report JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create task_queue table
CREATE TABLE IF NOT EXISTS public.task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  task_list JSONB NOT NULL,
  priority_levels JSONB,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending',
  ai_generated BOOLEAN DEFAULT true,
  human_modified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.coordinator_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coordinator_reports
CREATE POLICY "Admin and coordinators can view coordinator reports"
  ON public.coordinator_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'project_coordinator'::app_role)
    )
  );

CREATE POLICY "Admin and coordinators can insert coordinator reports"
  ON public.coordinator_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'project_coordinator'::app_role)
    )
  );

-- RLS Policies for task_queue
CREATE POLICY "Users can view their assigned tasks"
  ON public.task_queue FOR SELECT
  USING (
    assigned_to = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'project_coordinator'::app_role)
    )
  );

CREATE POLICY "Admin and coordinators can manage task queue"
  ON public.task_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'project_coordinator'::app_role)
    )
  );

-- Create indexes for performance
CREATE INDEX idx_coordinator_reports_project ON public.coordinator_reports(project_id);
CREATE INDEX idx_coordinator_reports_created ON public.coordinator_reports(created_at DESC);
CREATE INDEX idx_task_queue_project ON public.task_queue(project_id);
CREATE INDEX idx_task_queue_assigned ON public.task_queue(assigned_to);
CREATE INDEX idx_task_queue_status ON public.task_queue(status);

-- Add triggers for updated_at
CREATE TRIGGER update_coordinator_reports_updated_at
  BEFORE UPDATE ON public.coordinator_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_queue_updated_at
  BEFORE UPDATE ON public.task_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();