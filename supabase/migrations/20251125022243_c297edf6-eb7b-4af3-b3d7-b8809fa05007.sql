-- Fix RLS for estimate_requests - allow both anon and authenticated
DROP POLICY IF EXISTS "Allow public estimate request submissions" ON public.estimate_requests;
DROP POLICY IF EXISTS "Allow anonymous inserts to estimate_requests" ON public.estimate_requests;

CREATE POLICY "Public can submit estimate requests"
ON public.estimate_requests
FOR INSERT
TO public
WITH CHECK (true);

-- Fix RLS for vendor_applications - allow both anon and authenticated  
DROP POLICY IF EXISTS "Allow anonymous vendor application submissions" ON public.vendor_applications;
DROP POLICY IF EXISTS "Allow anonymous inserts to vendor_applications" ON public.vendor_applications;

CREATE POLICY "Public can submit vendor applications"
ON public.vendor_applications
FOR INSERT
TO public
WITH CHECK (true);

-- Recreate storage bucket with correct config
DELETE FROM storage.buckets WHERE id = 'applications';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'applications',
  'applications',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);

-- Fix storage policies
DROP POLICY IF EXISTS "Allow anonymous uploads to applications bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read applications" ON storage.objects;

CREATE POLICY "Public can upload to applications"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'applications');

CREATE POLICY "Authenticated can read applications"
ON storage.objects  
FOR SELECT
TO authenticated
USING (bucket_id = 'applications');