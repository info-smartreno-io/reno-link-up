-- Fix RLS policies for estimate_requests table
DROP POLICY IF EXISTS "Allow anonymous inserts to estimate_requests" ON public.estimate_requests;
CREATE POLICY "Allow anonymous inserts to estimate_requests" 
ON public.estimate_requests 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Fix RLS policies for vendor_applications table  
DROP POLICY IF EXISTS "Allow anonymous inserts to vendor_applications" ON public.vendor_applications;
CREATE POLICY "Allow anonymous inserts to vendor_applications"
ON public.vendor_applications
FOR INSERT
TO anon
WITH CHECK (true);

-- Create applications storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'applications',
  'applications', 
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for applications bucket
DROP POLICY IF EXISTS "Allow anonymous uploads to applications bucket" ON storage.objects;
CREATE POLICY "Allow anonymous uploads to applications bucket"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'applications');

DROP POLICY IF EXISTS "Allow authenticated users to read applications" ON storage.objects;
CREATE POLICY "Allow authenticated users to read applications"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'applications');