-- Secure storage bucket policies for applications bucket
-- Remove overly permissive policy and add proper restrictions

-- Drop the insecure policy
DROP POLICY IF EXISTS "Anyone can upload application files" ON storage.objects;

-- Create secure policy with authentication and file type restrictions
CREATE POLICY "Authenticated users can upload to applications bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'applications'
  -- User can only upload to their own folder
  AND (storage.foldername(name))[1] = auth.uid()::text
  -- File type restrictions: only common document and image types
  AND (storage.extension(name) = ANY(ARRAY['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt']))
);

-- Add policy for authenticated users to view their own files
CREATE POLICY "Users can view their own application files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'applications'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add policy for authenticated users to delete their own files
CREATE POLICY "Users can delete their own application files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'applications'
  AND (storage.foldername(name))[1] = auth.uid()::text
);