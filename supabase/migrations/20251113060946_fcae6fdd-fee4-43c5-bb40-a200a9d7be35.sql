-- Create storage bucket for contractor project documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-project-documents', 'contractor-project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for contractor project documents bucket
CREATE POLICY "Contractors can upload documents to their projects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contractor-project-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM contractor_projects WHERE contractor_id = auth.uid()
  )
);

CREATE POLICY "Contractors can view their project documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contractor-project-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM contractor_projects WHERE contractor_id = auth.uid()
  )
);

CREATE POLICY "Contractors can delete their project documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'contractor-project-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM contractor_projects WHERE contractor_id = auth.uid()
  )
);

-- Create table for contractor project documents metadata
CREATE TABLE IF NOT EXISTS contractor_project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES contractor_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL,
  description TEXT,
  document_type TEXT, -- 'blueprint', 'contract', 'permit', 'photo', 'other'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on contractor_project_documents
ALTER TABLE contractor_project_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for contractor_project_documents
CREATE POLICY "Contractors can view their project documents metadata"
ON contractor_project_documents
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM contractor_projects WHERE contractor_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Contractors can insert documents to their projects"
ON contractor_project_documents
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND project_id IN (
    SELECT id FROM contractor_projects WHERE contractor_id = auth.uid()
  )
);

CREATE POLICY "Contractors can delete their project documents"
ON contractor_project_documents
FOR DELETE
TO authenticated
USING (
  project_id IN (
    SELECT id FROM contractor_projects WHERE contractor_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger to update updated_at
CREATE TRIGGER update_contractor_project_documents_updated_at
  BEFORE UPDATE ON contractor_project_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();