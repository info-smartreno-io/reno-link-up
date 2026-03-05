-- Phase 9: Revenue Engine & Marketplace Optimization AI
-- Create tables for tracking revenue optimization events

-- 1. Upsell events tracking
CREATE TABLE IF NOT EXISTS public.upsell_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  upsell_title TEXT NOT NULL,
  estimated_increase NUMERIC(10,2) NOT NULL,
  accepted BOOLEAN DEFAULT false,
  ai_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Pricing adjustments logging
CREATE TABLE IF NOT EXISTS public.pricing_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID,
  project_type TEXT,
  zip_code TEXT,
  pricing_adjustment TEXT,
  risk_level TEXT,
  suggested_fee NUMERIC(5,2),
  expected_gross_profit NUMERIC(10,2),
  ai_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Finance recommendations
CREATE TABLE IF NOT EXISTS public.finance_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  homeowner_id UUID,
  recommended_options JSONB,
  viewed BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Match scores for contractor optimization
CREATE TABLE IF NOT EXISTS public.match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  contractor_id UUID,
  match_score NUMERIC(5,2),
  fit_reason TEXT,
  recommended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Conversion events tracking
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  session_data JSONB,
  conversion_probability NUMERIC(3,2),
  recommended_steps JSONB,
  ai_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upsell_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin-only access for revenue optimization data)
CREATE POLICY "Admin full access to upsell_events"
  ON public.upsell_events
  FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access to pricing_adjustments"
  ON public.pricing_adjustments
  FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access to finance_recommendations"
  ON public.finance_recommendations
  FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access to match_scores"
  ON public.match_scores
  FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access to conversion_events"
  ON public.conversion_events
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_upsell_events_project ON public.upsell_events(project_id);
CREATE INDEX idx_upsell_events_created ON public.upsell_events(created_at);

CREATE INDEX idx_pricing_adjustments_created ON public.pricing_adjustments(created_at);

CREATE INDEX idx_finance_recommendations_project ON public.finance_recommendations(project_id);
CREATE INDEX idx_finance_recommendations_homeowner ON public.finance_recommendations(homeowner_id);

CREATE INDEX idx_match_scores_project ON public.match_scores(project_id);
CREATE INDEX idx_match_scores_contractor ON public.match_scores(contractor_id);

CREATE INDEX idx_conversion_events_homeowner ON public.conversion_events(homeowner_id);
CREATE INDEX idx_conversion_events_project ON public.conversion_events(project_id);