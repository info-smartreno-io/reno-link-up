-- Create storage bucket for job applications
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications', 'applications', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated and anonymous users to upload files
CREATE POLICY "Anyone can upload application files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'applications');

-- Allow public access to read application files
CREATE POLICY "Application files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'applications');