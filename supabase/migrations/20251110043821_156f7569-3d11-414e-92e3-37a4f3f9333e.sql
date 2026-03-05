-- Add file upload columns to vendor_applications table
ALTER TABLE vendor_applications
ADD COLUMN license_url text,
ADD COLUMN insurance_url text,
ADD COLUMN portfolio_urls text[];

-- Add storage policy for contractor applications in the applications bucket
CREATE POLICY "Anyone can upload contractor application files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'applications' AND (storage.foldername(name))[1] = 'contractor-applications');

CREATE POLICY "Admins can view contractor application files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'applications' AND (storage.foldername(name))[1] = 'contractor-applications' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view their uploaded contractor files temporarily"
ON storage.objects
FOR SELECT
USING (bucket_id = 'applications' AND (storage.foldername(name))[1] = 'contractor-applications');