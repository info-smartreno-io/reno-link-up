-- Create storage bucket for project intake photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-intake-photos', 'project-intake-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for project intake photos
CREATE POLICY "Users can upload their own project photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-intake-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own project photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-intake-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Estimators can view all project intake photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-intake-photos' AND 
    (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Users can delete their own project photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-intake-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );