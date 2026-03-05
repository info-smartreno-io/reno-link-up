-- Create storage bucket for estimator site visit photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('estimator-site-photos', 'estimator-site-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for estimator site photos
CREATE POLICY "Estimators can upload site photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'estimator-site-photos' AND 
    has_role(auth.uid(), 'estimator'::app_role)
  );

CREATE POLICY "Estimators can view site photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'estimator-site-photos' AND 
    (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Estimators can delete site photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'estimator-site-photos' AND 
    has_role(auth.uid(), 'estimator'::app_role)
  );

CREATE POLICY "Contractors can view site photos for matched RFPs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'estimator-site-photos' AND 
    has_role(auth.uid(), 'contractor'::app_role)
  );