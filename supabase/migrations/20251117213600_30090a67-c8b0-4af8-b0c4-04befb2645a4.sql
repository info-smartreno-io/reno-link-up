-- Create homeowner applicants table
CREATE TABLE IF NOT EXISTS public.homeowner_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  project_type TEXT,
  budget_range TEXT,
  timeline TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create estimator applicants table
CREATE TABLE IF NOT EXISTS public.estimator_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  years_experience INTEGER,
  specializations TEXT[],
  service_areas TEXT[],
  certifications TEXT[],
  resume_url TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create general contractor applicants table
CREATE TABLE IF NOT EXISTS public.gc_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT,
  insurance_info TEXT,
  years_in_business INTEGER,
  specializations TEXT[],
  service_areas TEXT[],
  crew_size INTEGER,
  website TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendor applicants table
CREATE TABLE IF NOT EXISTS public.vendor_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  vendor_type TEXT,
  products_services TEXT,
  service_areas TEXT[],
  website TEXT,
  catalog_url TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create partner applicants table
CREATE TABLE IF NOT EXISTS public.partner_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  partnership_type TEXT,
  description TEXT,
  website TEXT,
  proposed_collaboration TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create subcontractor applicants table
CREATE TABLE IF NOT EXISTS public.subcontractor_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  trade TEXT NOT NULL,
  license_number TEXT,
  insurance_verified BOOLEAN DEFAULT false,
  years_in_business INTEGER,
  service_areas TEXT[],
  crew_size INTEGER,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create financing inquiries table
CREATE TABLE IF NOT EXISTS public.financing_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  project_cost NUMERIC,
  desired_loan_amount NUMERIC,
  credit_score_range TEXT,
  employment_status TEXT,
  annual_income NUMERIC,
  property_type TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create cost calculator submissions table
CREATE TABLE IF NOT EXISTS public.cost_calculator_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  project_type TEXT NOT NULL,
  square_footage INTEGER,
  rooms JSONB,
  location TEXT,
  estimated_cost NUMERIC,
  calculation_data JSONB,
  converted_to_lead BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homeowner_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gc_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_calculator_submissions ENABLE ROW LEVEL SECURITY;

-- Create admin policies for all tables
CREATE POLICY "Admins can view all homeowner applicants"
  ON public.homeowner_applicants FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update homeowner applicants"
  ON public.homeowner_applicants FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all estimator applicants"
  ON public.estimator_applicants FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update estimator applicants"
  ON public.estimator_applicants FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all gc applicants"
  ON public.gc_applicants FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update gc applicants"
  ON public.gc_applicants FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all vendor applicants"
  ON public.vendor_applicants FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vendor applicants"
  ON public.vendor_applicants FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all partner applicants"
  ON public.partner_applicants FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update partner applicants"
  ON public.partner_applicants FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all subcontractor applicants"
  ON public.subcontractor_applicants FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subcontractor applicants"
  ON public.subcontractor_applicants FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all financing inquiries"
  ON public.financing_inquiries FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update financing inquiries"
  ON public.financing_inquiries FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all calculator submissions"
  ON public.cost_calculator_submissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update calculator submissions"
  ON public.cost_calculator_submissions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Allow public inserts (for website forms)
CREATE POLICY "Anyone can submit homeowner applications"
  ON public.homeowner_applicants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can submit estimator applications"
  ON public.estimator_applicants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can submit gc applications"
  ON public.gc_applicants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can submit vendor applications"
  ON public.vendor_applicants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can submit partner applications"
  ON public.partner_applicants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can submit subcontractor applications"
  ON public.subcontractor_applicants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can submit financing inquiries"
  ON public.financing_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can submit calculator data"
  ON public.cost_calculator_submissions FOR INSERT
  WITH CHECK (true);