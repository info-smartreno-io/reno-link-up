-- Create storage bucket for walkthrough photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('walkthrough-photos', 'walkthrough-photos', true);

-- RLS policies for walkthrough photos bucket
CREATE POLICY "Users can view their own walkthrough photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'walkthrough-photos' 
  AND (storage.foldername(name))[1] IN (
    SELECT walkthrough_number::text 
    FROM walkthroughs 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload photos to their walkthroughs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'walkthrough-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT walkthrough_number::text 
    FROM walkthroughs 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own walkthrough photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'walkthrough-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT walkthrough_number::text 
    FROM walkthroughs 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own walkthrough photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'walkthrough-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT walkthrough_number::text 
    FROM walkthroughs 
    WHERE user_id = auth.uid()
  )
);