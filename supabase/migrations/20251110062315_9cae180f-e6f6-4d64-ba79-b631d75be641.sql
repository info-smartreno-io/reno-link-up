-- Create enum for notification types
CREATE TYPE notification_type AS ENUM (
  'task_starting',
  'task_due',
  'milestone_approaching',
  'homeowner_action_needed',
  'contractor_action_needed',
  'material_delivery',
  'inspection_scheduled'
);

-- Create enum for notification status
CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'acknowledged',
  'dismissed'
);

-- Create project_notifications table
CREATE TABLE public.project_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  related_task_id TEXT,
  related_milestone_id TEXT,
  status notification_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Contractors can view their project notifications"
  ON public.project_notifications
  FOR SELECT
  USING (auth.uid() = contractor_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can create notifications for their projects"
  ON public.project_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update their project notifications"
  ON public.project_notifications
  FOR UPDATE
  USING (auth.uid() = contractor_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can delete their project notifications"
  ON public.project_notifications
  FOR DELETE
  USING (auth.uid() = contractor_id OR has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_project_notifications_project_id ON public.project_notifications(project_id);
CREATE INDEX idx_project_notifications_status ON public.project_notifications(status);
CREATE INDEX idx_project_notifications_due_date ON public.project_notifications(due_date);

-- Create trigger to update updated_at
CREATE TRIGGER update_project_notifications_updated_at
  BEFORE UPDATE ON public.project_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_updated_at();