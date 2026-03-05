-- Create AI Agent Activity table for logging all AI agent actions
CREATE TABLE IF NOT EXISTS public.ai_agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  project_id UUID,
  input JSONB NOT NULL,
  output JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_agent_activity ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own activity
CREATE POLICY "Users can view their own AI agent activity"
  ON public.ai_agent_activity
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all activity
CREATE POLICY "Admins can view all AI agent activity"
  ON public.ai_agent_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System can insert activity logs
CREATE POLICY "Authenticated users can create AI agent activity"
  ON public.ai_agent_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_ai_agent_activity_user_id ON public.ai_agent_activity(user_id);
CREATE INDEX idx_ai_agent_activity_project_id ON public.ai_agent_activity(project_id);
CREATE INDEX idx_ai_agent_activity_created_at ON public.ai_agent_activity(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_ai_agent_activity_updated_at
  BEFORE UPDATE ON public.ai_agent_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();