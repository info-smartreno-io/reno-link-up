-- Create warranty_plans table
CREATE TABLE public.warranty_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  homeowner_id UUID REFERENCES auth.users(id),
  contractor_id UUID REFERENCES auth.users(id),
  plan_type TEXT NOT NULL DEFAULT 'standard',
  coverage_start DATE NOT NULL,
  coverage_end DATE NOT NULL,
  coverage_summary TEXT,
  terms_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranty_claims table
CREATE TABLE public.warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  warranty_plan_id UUID REFERENCES public.warranty_plans(id),
  homeowner_id UUID REFERENCES auth.users(id),
  contractor_id UUID REFERENCES auth.users(id),
  
  claim_number TEXT UNIQUE NOT NULL,
  claim_status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  
  reported_issue_title TEXT NOT NULL,
  reported_issue_desc TEXT,
  reported_area TEXT,
  severity TEXT DEFAULT 'functional',
  
  date_reported TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  within_coverage BOOLEAN DEFAULT true,
  
  assigned_csm_id UUID REFERENCES auth.users(id),
  assigned_estimator_id UUID REFERENCES auth.users(id),
  assigned_pm_id UUID REFERENCES auth.users(id),
  
  next_action TEXT,
  next_action_due_at TIMESTAMP WITH TIME ZONE,
  
  resolution_summary TEXT,
  resolution_type TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranty_claim_events table
CREATE TABLE public.warranty_claim_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.warranty_claims(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranty_claim_attachments table
CREATE TABLE public.warranty_claim_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.warranty_claims(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  label TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranty_claim_financials table
CREATE TABLE public.warranty_claim_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.warranty_claims(id) ON DELETE CASCADE,
  estimated_repair_cost NUMERIC(12,2) DEFAULT 0,
  approved_repair_cost NUMERIC(12,2) DEFAULT 0,
  contractor_share NUMERIC(12,2) DEFAULT 0,
  smartreno_share NUMERIC(12,2) DEFAULT 0,
  vendor_share NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warranty_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claim_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claim_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claim_financials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for warranty_plans
CREATE POLICY "Admins can view all warranty plans"
  ON public.warranty_plans FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert warranty plans"
  ON public.warranty_plans FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update warranty plans"
  ON public.warranty_plans FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for warranty_claims
CREATE POLICY "Admins can view all warranty claims"
  ON public.warranty_claims FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins and CSMs can insert warranty claims"
  ON public.warranty_claims FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins and CSMs can update warranty claims"
  ON public.warranty_claims FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for warranty_claim_events
CREATE POLICY "Admins can view all warranty claim events"
  ON public.warranty_claim_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert warranty claim events"
  ON public.warranty_claim_events FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- RLS Policies for warranty_claim_attachments
CREATE POLICY "Admins can view all warranty claim attachments"
  ON public.warranty_claim_attachments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert warranty claim attachments"
  ON public.warranty_claim_attachments FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can delete their attachments"
  ON public.warranty_claim_attachments FOR DELETE
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for warranty_claim_financials
CREATE POLICY "Admins can view all warranty claim financials"
  ON public.warranty_claim_financials FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert warranty claim financials"
  ON public.warranty_claim_financials FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update warranty claim financials"
  ON public.warranty_claim_financials FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_warranty_claims_status ON public.warranty_claims(claim_status);
CREATE INDEX idx_warranty_claims_priority ON public.warranty_claims(priority);
CREATE INDEX idx_warranty_claims_project ON public.warranty_claims(project_id);
CREATE INDEX idx_warranty_claims_homeowner ON public.warranty_claims(homeowner_id);
CREATE INDEX idx_warranty_claims_date_reported ON public.warranty_claims(date_reported);
CREATE INDEX idx_warranty_claim_events_claim ON public.warranty_claim_events(claim_id);
CREATE INDEX idx_warranty_claim_attachments_claim ON public.warranty_claim_attachments(claim_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_warranty_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_warranty_plans_updated_at
  BEFORE UPDATE ON public.warranty_plans
  FOR EACH ROW EXECUTE FUNCTION update_warranty_updated_at();

CREATE TRIGGER update_warranty_claims_updated_at
  BEFORE UPDATE ON public.warranty_claims
  FOR EACH ROW EXECUTE FUNCTION update_warranty_updated_at();

CREATE TRIGGER update_warranty_financials_updated_at
  BEFORE UPDATE ON public.warranty_claim_financials
  FOR EACH ROW EXECUTE FUNCTION update_warranty_updated_at();

-- Function to generate claim number
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TEXT AS $$
DECLARE
  year_prefix TEXT;
  sequence_num INT;
  claim_num TEXT;
BEGIN
  year_prefix := 'W-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-';
  
  SELECT COALESCE(MAX(SUBSTRING(claim_number FROM 9)::INT), 0) + 1
  INTO sequence_num
  FROM public.warranty_claims
  WHERE claim_number LIKE year_prefix || '%';
  
  claim_num := year_prefix || LPAD(sequence_num::TEXT, 6, '0');
  RETURN claim_num;
END;
$$ LANGUAGE plpgsql;