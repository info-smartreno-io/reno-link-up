-- Allow anonymous users to submit vendor applications (contractor onboarding form)
CREATE POLICY "Allow anonymous vendor application submissions"
ON public.vendor_applications
FOR INSERT
TO anon
WITH CHECK (true);

-- Also ensure the storage bucket exists for contractor applications
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications', 'applications', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous uploads to applications" ON storage.objects;
DROP POLICY IF EXISTS "Users can read application files" ON storage.objects;

-- Allow anonymous users to upload to applications bucket
CREATE POLICY "Allow anonymous uploads to applications"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'applications');

-- Allow authenticated users to read their own uploads  
CREATE POLICY "Users can read application files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'applications');