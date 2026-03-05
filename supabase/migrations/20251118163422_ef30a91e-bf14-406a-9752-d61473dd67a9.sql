-- Fix PUBLIC_DATA_EXPOSURE: Restrict pricing_guide access to authenticated professionals only
DROP POLICY IF EXISTS "Anyone can view pricing guide" ON public.pricing_guide;

CREATE POLICY "Estimators and admins can view pricing"
  ON public.pricing_guide
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'estimator'::app_role) OR
    has_role(auth.uid(), 'contractor'::app_role)
  );