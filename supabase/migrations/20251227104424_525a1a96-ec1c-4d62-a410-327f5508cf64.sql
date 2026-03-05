-- Create homeowner_messages table for customer portal messaging
CREATE TABLE IF NOT EXISTS public.homeowner_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('homeowner', 'staff', 'system')),
  sender_name TEXT,
  sender_user_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_homeowner_messages_project ON public.homeowner_messages(project_id);
CREATE INDEX idx_homeowner_messages_created ON public.homeowner_messages(created_at);

-- Enable RLS
ALTER TABLE public.homeowner_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Staff can manage all messages"
  ON public.homeowner_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND role IN ('admin', 'project_coordinator', 'estimator', 'foreman')
    )
  );

CREATE POLICY "Messages viewable via portal access"
  ON public.homeowner_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.homeowner_portal_access
      WHERE homeowner_portal_access.project_id = homeowner_messages.project_id
      AND homeowner_portal_access.is_active = true
    )
  );

-- Add comment
COMMENT ON TABLE public.homeowner_messages IS 'Stores messages between homeowners and project staff via customer portal';