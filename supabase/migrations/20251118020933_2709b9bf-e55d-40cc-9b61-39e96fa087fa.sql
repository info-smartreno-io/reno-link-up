-- PHASE 12: SmartReno Pro+ Monetization AI Layer

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro_plus', 'home_plus', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  renewal_date DATE,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: premium_routing_logs
CREATE TABLE IF NOT EXISTS public.premium_routing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  contractor_id TEXT,
  priority_score INTEGER,
  boost_applied BOOLEAN DEFAULT false,
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: lead_scores
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  contractor_id TEXT,
  lead_score INTEGER CHECK (lead_score >= 0 AND lead_score <= 100),
  fit_reason TEXT,
  conversion_probability NUMERIC(3,2) CHECK (conversion_probability >= 0 AND conversion_probability <= 1),
  recommended_pitch TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: proplus_insights
CREATE TABLE IF NOT EXISTS public.proplus_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id TEXT NOT NULL,
  summary TEXT,
  recommended_project_types JSONB DEFAULT '[]',
  average_bid_position NUMERIC(4,2),
  win_rate INTEGER,
  improvement_areas JSONB DEFAULT '[]',
  market_trends JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add premium fields to ai_agent_activity
ALTER TABLE public.ai_agent_activity
ADD COLUMN IF NOT EXISTS plan_used TEXT,
ADD COLUMN IF NOT EXISTS subscription_level TEXT,
ADD COLUMN IF NOT EXISTS premium_boost_applied BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_routing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proplus_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions (authenticated users can view own, all can insert/update own)
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- RLS Policies for premium_routing_logs (authenticated users can view)
CREATE POLICY "Authenticated users can view routing logs"
  ON public.premium_routing_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert routing logs"
  ON public.premium_routing_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for lead_scores
CREATE POLICY "Contractors can view own lead scores"
  ON public.lead_scores FOR SELECT
  USING (auth.uid()::text = contractor_id);

CREATE POLICY "Authenticated users can insert lead scores"
  ON public.lead_scores FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for proplus_insights
CREATE POLICY "Contractors can view own insights"
  ON public.proplus_insights FOR SELECT
  USING (auth.uid()::text = contractor_id);

CREATE POLICY "Authenticated users can insert insights"
  ON public.proplus_insights FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Contractors can update own insights"
  ON public.proplus_insights FOR UPDATE
  USING (auth.uid()::text = contractor_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_premium_routing_logs_project_id ON public.premium_routing_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_premium_routing_logs_contractor_id ON public.premium_routing_logs(contractor_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_project_id ON public.lead_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_contractor_id ON public.lead_scores(contractor_id);
CREATE INDEX IF NOT EXISTS idx_proplus_insights_contractor_id ON public.proplus_insights(contractor_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proplus_insights_updated_at
  BEFORE UPDATE ON public.proplus_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();