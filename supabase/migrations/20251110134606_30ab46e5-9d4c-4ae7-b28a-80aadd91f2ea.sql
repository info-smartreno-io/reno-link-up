-- Create project_messages table for real-time messaging
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_by JSONB DEFAULT '[]'::jsonb,
  
  -- Constraints
  CONSTRAINT message_not_empty CHECK (length(trim(message)) > 0)
);

-- Create index for better query performance
CREATE INDEX idx_project_messages_project_id ON public.project_messages(project_id);
CREATE INDEX idx_project_messages_created_at ON public.project_messages(created_at DESC);
CREATE INDEX idx_project_messages_sender_id ON public.project_messages(sender_id);

-- Enable Row Level Security
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages table
ALTER TABLE public.project_messages REPLICA IDENTITY FULL;

-- RLS Policy: Users can view messages for projects they're associated with (as homeowner or contractor)
CREATE POLICY "Users can view messages for their projects" 
ON public.project_messages 
FOR SELECT 
USING (
  -- Contractors can see messages for their projects
  EXISTS (
    SELECT 1 FROM public.contractor_projects
    WHERE contractor_projects.id = project_messages.project_id
    AND contractor_projects.contractor_id = auth.uid()
  )
  OR
  -- Homeowners can see messages for their projects
  EXISTS (
    SELECT 1 FROM public.homeowner_projects
    WHERE homeowner_projects.project_id = project_messages.project_id
    AND homeowner_projects.homeowner_id = auth.uid()
  )
  OR
  -- Admins can see all messages
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policy: Users can send messages to projects they're associated with
CREATE POLICY "Users can send messages to their projects" 
ON public.project_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id
  AND (
    -- Contractors can send to their projects
    EXISTS (
      SELECT 1 FROM public.contractor_projects
      WHERE contractor_projects.id = project_messages.project_id
      AND contractor_projects.contractor_id = auth.uid()
    )
    OR
    -- Homeowners can send to their projects
    EXISTS (
      SELECT 1 FROM public.homeowner_projects
      WHERE homeowner_projects.project_id = project_messages.project_id
      AND homeowner_projects.homeowner_id = auth.uid()
    )
    OR
    -- Admins can send to any project
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- RLS Policy: Users can update messages they sent (for read receipts)
CREATE POLICY "Users can update messages for read status" 
ON public.project_messages 
FOR UPDATE 
USING (
  -- Can update if they're part of the project
  EXISTS (
    SELECT 1 FROM public.contractor_projects
    WHERE contractor_projects.id = project_messages.project_id
    AND contractor_projects.contractor_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.homeowner_projects
    WHERE homeowner_projects.project_id = project_messages.project_id
    AND homeowner_projects.homeowner_id = auth.uid()
  )
  OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.project_messages 
FOR DELETE 
USING (
  auth.uid() = sender_id
  OR
  has_role(auth.uid(), 'admin'::app_role)
);