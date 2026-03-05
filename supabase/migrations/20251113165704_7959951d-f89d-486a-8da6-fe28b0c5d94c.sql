-- Create storage bucket for warranty claim photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('warranty-claim-photos', 'warranty-claim-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for warranty claim photos
CREATE POLICY "Homeowners can upload their warranty claim photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'warranty-claim-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Homeowners can view their warranty claim photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'warranty-claim-photos' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can view all warranty claim photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'warranty-claim-photos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete their own warranty claim photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'warranty-claim-photos' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);