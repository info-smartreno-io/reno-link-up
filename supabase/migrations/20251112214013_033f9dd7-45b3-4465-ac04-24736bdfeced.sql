-- Create estimate_requests table
CREATE TABLE IF NOT EXISTS public.estimate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  project_type text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.estimate_requests ENABLE ROW LEVEL SECURITY;

-- Admins can view all estimate requests
CREATE POLICY "Admins can view all estimate requests"
  ON public.estimate_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Estimators can view all estimate requests
CREATE POLICY "Estimators can view all estimate requests"
  ON public.estimate_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'estimator'::app_role));

-- Admins can update estimate requests
CREATE POLICY "Admins can update estimate requests"
  ON public.estimate_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Estimators can update their assigned requests
CREATE POLICY "Estimators can update assigned requests"
  ON public.estimate_requests
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'estimator'::app_role) 
    AND assigned_to = auth.uid()
  );

-- Allow public inserts (from the estimate form)
CREATE POLICY "Anyone can submit estimate requests"
  ON public.estimate_requests
  FOR INSERT
  WITH CHECK (true);

-- Update timestamp trigger
CREATE TRIGGER update_estimate_requests_updated_at
  BEFORE UPDATE ON public.estimate_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

-- Create index for filtering by status and assigned estimator
CREATE INDEX idx_estimate_requests_status ON public.estimate_requests(status);
CREATE INDEX idx_estimate_requests_assigned ON public.estimate_requests(assigned_to);
CREATE INDEX idx_estimate_requests_created ON public.estimate_requests(created_at DESC);