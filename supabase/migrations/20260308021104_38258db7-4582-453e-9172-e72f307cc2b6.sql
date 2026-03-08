-- Create storage bucket for bid attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('bid-attachments', 'bid-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Contractors can upload to their own folder
CREATE POLICY "Contractors can upload bid attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bid-attachments' AND (storage.foldername(name))[3] = auth.uid()::text);

-- RLS: Contractors can read their own attachments, admins can read all
CREATE POLICY "Users can read bid attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'bid-attachments' AND (
  (storage.foldername(name))[3] = auth.uid()::text
  OR public.has_role(auth.uid(), 'admin')
));