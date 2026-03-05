-- Create storage bucket for architect proposal attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('architect-proposals', 'architect-proposals', true);

-- Create RLS policies for architect proposal attachments
CREATE POLICY "Architects can upload their proposal attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'architect-proposals' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Architects can view their proposal attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'architect-proposals' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Architects can delete their proposal attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'architect-proposals' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add attachment columns to architect_proposals table
ALTER TABLE architect_proposals
ADD COLUMN IF NOT EXISTS attachment_urls jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS line_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS terms text;