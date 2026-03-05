-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true);

-- Create message_attachments table first
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES project_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on message_attachments
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_attachments table
CREATE POLICY "Users can view attachments from their project messages"
ON message_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_messages pm
    WHERE pm.id = message_attachments.message_id
    AND (
      -- User is part of the project as a contractor
      EXISTS (
        SELECT 1 FROM contractor_projects cp
        WHERE cp.id = pm.project_id
        AND cp.contractor_id = auth.uid()
      )
      OR
      -- User is part of the project as a homeowner
      EXISTS (
        SELECT 1 FROM homeowner_projects hp
        WHERE hp.project_id = pm.project_id
        AND hp.homeowner_id = auth.uid()
      )
      OR
      -- User is an admin
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "Users can insert attachments to their messages"
ON message_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_messages pm
    WHERE pm.id = message_attachments.message_id
    AND pm.sender_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own attachments"
ON message_attachments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM project_messages pm
    WHERE pm.id = message_attachments.message_id
    AND pm.sender_id = auth.uid()
  )
  OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add index for better performance
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);

-- Now create RLS policies for storage bucket
CREATE POLICY "Users can upload attachments to their messages"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments' AND
  (
    -- User is part of the project as a contractor
    EXISTS (
      SELECT 1 FROM contractor_projects cp
      WHERE cp.id::text = (storage.foldername(name))[1]
      AND cp.contractor_id = auth.uid()
    )
    OR
    -- User is part of the project as a homeowner
    EXISTS (
      SELECT 1 FROM homeowner_projects hp
      WHERE hp.project_id::text = (storage.foldername(name))[1]
      AND hp.homeowner_id = auth.uid()
    )
    OR
    -- User is an admin
    has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can view attachments from their projects"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'message-attachments' AND
  (
    -- User is part of the project as a contractor
    EXISTS (
      SELECT 1 FROM contractor_projects cp
      WHERE cp.id::text = (storage.foldername(name))[1]
      AND cp.contractor_id = auth.uid()
    )
    OR
    -- User is part of the project as a homeowner
    EXISTS (
      SELECT 1 FROM homeowner_projects hp
      WHERE hp.project_id::text = (storage.foldername(name))[1]
      AND hp.homeowner_id = auth.uid()
    )
    OR
    -- User is an admin
    has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'message-attachments' AND
  (
    -- Check if user owns the message this attachment belongs to
    EXISTS (
      SELECT 1 FROM project_messages pm
      JOIN message_attachments ma ON ma.message_id = pm.id
      WHERE ma.file_path = name
      AND pm.sender_id = auth.uid()
    )
    OR
    -- User is an admin
    has_role(auth.uid(), 'admin'::app_role)
  )
);