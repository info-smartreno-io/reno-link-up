-- Create storage bucket for blueprints
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blueprints',
  'blueprints',
  false,
  104857600, -- 100MB limit for large blueprint files
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/tiff',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/dwg',
    'application/dxf'
  ]
);

-- Allow architects to upload blueprints for their projects
CREATE POLICY "Architects can upload blueprints for their projects"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'blueprints'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM architect_projects
    WHERE architect_id = auth.uid()
  )
);

-- Allow architects to view blueprints for their projects
CREATE POLICY "Architects can view blueprints for their projects"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'blueprints'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text
      FROM architect_projects
      WHERE architect_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Allow architects to delete blueprints for their projects
CREATE POLICY "Architects can delete blueprints for their projects"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'blueprints'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM architect_projects
    WHERE architect_id = auth.uid()
  )
);

-- Allow architects to update blueprints for their projects
CREATE POLICY "Architects can update blueprints for their projects"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'blueprints'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM architect_projects
    WHERE architect_id = auth.uid()
  )
);

-- Create a table to track blueprint metadata
CREATE TABLE IF NOT EXISTS public.blueprint_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES architect_projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on blueprint_files
ALTER TABLE public.blueprint_files ENABLE ROW LEVEL SECURITY;

-- Architects can insert blueprint records for their projects
CREATE POLICY "Architects can insert blueprint records for their projects"
ON public.blueprint_files
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by
  AND project_id IN (
    SELECT id FROM architect_projects WHERE architect_id = auth.uid()
  )
);

-- Architects can view blueprint records for their projects
CREATE POLICY "Architects can view blueprint records for their projects"
ON public.blueprint_files
FOR SELECT
USING (
  project_id IN (
    SELECT id FROM architect_projects WHERE architect_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Architects can delete blueprint records for their projects
CREATE POLICY "Architects can delete blueprint records for their projects"
ON public.blueprint_files
FOR DELETE
USING (
  project_id IN (
    SELECT id FROM architect_projects WHERE architect_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_blueprint_files_project_id ON blueprint_files(project_id);