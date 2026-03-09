
-- Property evaluation reports table
CREATE TABLE IF NOT EXISTS public.property_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'NJ',
  zip TEXT,
  square_feet INTEGER,
  year_built INTEGER,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  lot_size NUMERIC(6,2),
  selected_scopes TEXT[] DEFAULT '{}',
  estimated_cost_low INTEGER,
  estimated_cost_high INTEGER,
  property_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  converted_to_project_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Form submission logs table
CREATE TABLE IF NOT EXISTS public.form_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name TEXT NOT NULL,
  submission_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_logs ENABLE ROW LEVEL SECURITY;

-- Public can insert property reports (anonymous submissions allowed)
CREATE POLICY "Anyone can insert property reports"
ON public.property_reports FOR INSERT
WITH CHECK (true);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.property_reports FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can manage all reports
CREATE POLICY "Admins can manage property reports"
ON public.property_reports FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Form logs policies
CREATE POLICY "Anyone can insert form logs"
ON public.form_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view form logs"
ON public.form_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Index for faster queries
CREATE INDEX idx_property_reports_created ON public.property_reports(created_at DESC);
CREATE INDEX idx_form_logs_created ON public.form_logs(created_at DESC);
CREATE INDEX idx_form_logs_form_name ON public.form_logs(form_name);
