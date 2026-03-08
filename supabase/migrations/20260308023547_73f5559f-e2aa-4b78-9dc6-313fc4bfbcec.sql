-- Fix storage RLS for bid-attachments to match corrected path structure
-- Path is now: {packetId}/{userId}/{filename} (no redundant bid-attachments/ prefix)
-- foldername returns ['packetId', 'userId'], so userId is at index 2

DROP POLICY IF EXISTS "Contractors can upload bid attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can read bid attachments" ON storage.objects;

CREATE POLICY "Contractors can upload bid attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bid-attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can read bid attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bid-attachments'
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);