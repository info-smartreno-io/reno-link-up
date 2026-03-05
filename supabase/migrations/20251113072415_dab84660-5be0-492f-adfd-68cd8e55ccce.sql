-- Phase 0 Emergency Security: Lock down pricing_guide table access
-- Remove public access to pricing data to prevent competitor intelligence gathering

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view pricing guide" ON public.pricing_guide;

-- Create restricted policy for authenticated estimators and admins only
CREATE POLICY "Authenticated estimators and admins can view pricing"
  ON public.pricing_guide
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'estimator'::app_role) OR
    has_role(auth.uid(), 'contractor'::app_role)
  );