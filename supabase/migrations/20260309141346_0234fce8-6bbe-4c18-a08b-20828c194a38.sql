
-- Platform-level master cost code library (admin-managed)
CREATE TABLE public.platform_cost_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  trade TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'EA',
  labor_cost_low NUMERIC NOT NULL DEFAULT 0,
  labor_cost_high NUMERIC NOT NULL DEFAULT 0,
  material_cost_low NUMERIC NOT NULL DEFAULT 0,
  material_cost_high NUMERIC NOT NULL DEFAULT 0,
  estimated_duration_days NUMERIC DEFAULT 0,
  trade_dependency TEXT,
  schedule_phase TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.platform_cost_codes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to platform_cost_codes"
ON public.platform_cost_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Estimators can read
CREATE POLICY "Estimators can read platform_cost_codes"
ON public.platform_cost_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'estimator'));

-- Project financials table
CREATE TABLE public.project_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  estimated_project_value NUMERIC DEFAULT 0,
  approved_project_value NUMERIC DEFAULT 0,
  contractor_bid_value NUMERIC DEFAULT 0,
  smartreno_platform_fee NUMERIC DEFAULT 0,
  total_change_orders NUMERIC DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  remaining_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to project_financials"
ON public.project_financials
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Payment milestones table
CREATE TABLE public.payment_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  milestone_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  payer TEXT,
  payee TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to payment_milestones"
ON public.payment_milestones
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Contractor payments table
CREATE TABLE public.contractor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  contractor_id UUID,
  milestone_id UUID REFERENCES public.payment_milestones(id),
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contractor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to contractor_payments"
ON public.contractor_payments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Scope items table (links generated scopes to platform cost codes)
CREATE TABLE public.scope_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  platform_cost_code_id UUID REFERENCES public.platform_cost_codes(id),
  cost_code TEXT NOT NULL,
  description TEXT NOT NULL,
  trade TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'EA',
  labor_cost_low NUMERIC DEFAULT 0,
  labor_cost_high NUMERIC DEFAULT 0,
  material_cost_low NUMERIC DEFAULT 0,
  material_cost_high NUMERIC DEFAULT 0,
  notes TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scope_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to scope_items"
ON public.scope_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Estimators can manage scope_items"
ON public.scope_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'estimator'))
WITH CHECK (public.has_role(auth.uid(), 'estimator'));

-- Property profiles table
CREATE TABLE public.property_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  year_built INTEGER,
  square_feet INTEGER,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  lot_size TEXT,
  property_type TEXT,
  last_sale_price NUMERIC,
  project_id UUID,
  lead_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to property_profiles"
ON public.property_profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Estimators can manage property_profiles"
ON public.property_profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'estimator'))
WITH CHECK (public.has_role(auth.uid(), 'estimator'));

-- Vendor quote requests table
CREATE TABLE public.vendor_quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  vendor_type TEXT NOT NULL,
  materials JSONB NOT NULL DEFAULT '[]',
  delivery_timeline TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  vendor_response JSONB,
  requested_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to vendor_quote_requests"
ON public.vendor_quote_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Estimators can manage vendor_quote_requests"
ON public.vendor_quote_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'estimator'))
WITH CHECK (public.has_role(auth.uid(), 'estimator'));
