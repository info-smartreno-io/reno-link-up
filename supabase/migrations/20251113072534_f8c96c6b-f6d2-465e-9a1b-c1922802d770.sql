-- Phase 0 Emergency Security: Restrict file uploads to authenticated users
-- Remove public upload access to prevent storage abuse and malware distribution

-- Drop the overly permissive public upload policy for contractor applications
DROP POLICY IF EXISTS "Anyone can upload contractor application files" ON storage.objects;

-- Create restricted policy requiring authentication
CREATE POLICY "Authenticated users can upload application files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'applications' 
    AND (storage.foldername(name))[1] = 'contractor-applications'
  );

-- Add similar restrictions for other public upload policies if they exist
-- This ensures only authenticated users can upload files