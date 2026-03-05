-- Phase 15: SmartReno National Expansion & Multi-Market Intelligence

-- 1. Regional cost index table
CREATE TABLE IF NOT EXISTS public.regional_cost_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  county TEXT,
  city TEXT,
  labor_multiplier NUMERIC(4,2) DEFAULT 1.00,
  material_multiplier NUMERIC(4,2) DEFAULT 1.00,
  permit_fee_multiplier NUMERIC(4,2) DEFAULT 1.00,
  disposal_fee_multiplier NUMERIC(4,2) DEFAULT 1.00,
  seasonal_factors JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(state, county, city)
);

-- 2. Regional labor rates table
CREATE TABLE IF NOT EXISTS public.regional_labor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  county TEXT,
  trade TEXT NOT NULL,
  hourly_rate NUMERIC(10,2),
  prevailing_wage NUMERIC(10,2),
  union_rate NUMERIC(10,2),
  seasonality JSONB,
  demand_level TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Regional permit rules table
CREATE TABLE IF NOT EXISTS public.regional_permit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  county TEXT,
  municipality TEXT,
  project_type TEXT NOT NULL,
  required_permits TEXT[] DEFAULT '{}',
  submission_format TEXT,
  processing_time_days INTEGER,
  fee_structure JSONB,
  special_requirements TEXT[],
  climate_zone TEXT,
  seismic_zone TEXT,
  wind_zone TEXT,
  snow_load_requirements TEXT,
  fire_code_version TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Market opportunity scores table
CREATE TABLE IF NOT EXISTS public.market_opportunity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  metro_area TEXT,
  county TEXT,
  opportunity_score INTEGER,
  renovation_demand_score INTEGER,
  housing_stock_age NUMERIC(5,1),
  median_home_value NUMERIC(12,2),
  renovation_volume_trend TEXT,
  contractor_competition_level TEXT,
  expansion_priority INTEGER,
  market_analysis JSONB,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Contractor density map table
CREATE TABLE IF NOT EXISTS public.contractor_density_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  county TEXT,
  zip_code TEXT,
  trade TEXT,
  contractor_count INTEGER DEFAULT 0,
  coverage_level TEXT,
  rating_average NUMERIC(3,2),
  responsiveness_score NUMERIC(3,2),
  recruiting_priority TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Inspection delay patterns table
CREATE TABLE IF NOT EXISTS public.inspection_delay_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  county TEXT,
  municipality TEXT,
  inspection_type TEXT NOT NULL,
  average_wait_days INTEGER,
  seasonal_variation JSONB,
  inspector_backlog_level TEXT,
  peak_delay_months TEXT[],
  predicted_delay_days INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Regional financing options table
CREATE TABLE IF NOT EXISTS public.regional_financing_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  county TEXT,
  financing_type TEXT NOT NULL,
  provider_name TEXT,
  min_amount NUMERIC(12,2),
  max_amount NUMERIC(12,2),
  interest_rate_range TEXT,
  program_details JSONB,
  eligibility_requirements TEXT[],
  state_incentives TEXT[],
  energy_rebates TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.regional_cost_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_labor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_permit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_opportunity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_density_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_delay_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_financing_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin full access, public read for regional data)
CREATE POLICY "Admin full access regional_cost_index" ON public.regional_cost_index
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Public read regional_cost_index" ON public.regional_cost_index
  FOR SELECT USING (true);

CREATE POLICY "Admin full access regional_labor_rates" ON public.regional_labor_rates
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Public read regional_labor_rates" ON public.regional_labor_rates
  FOR SELECT USING (true);

CREATE POLICY "Admin full access regional_permit_rules" ON public.regional_permit_rules
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Public read regional_permit_rules" ON public.regional_permit_rules
  FOR SELECT USING (true);

CREATE POLICY "Admin full access market_opportunity_scores" ON public.market_opportunity_scores
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access contractor_density_map" ON public.contractor_density_map
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access inspection_delay_patterns" ON public.inspection_delay_patterns
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Public read inspection_delay_patterns" ON public.inspection_delay_patterns
  FOR SELECT USING (true);

CREATE POLICY "Admin full access regional_financing_options" ON public.regional_financing_options
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Public read regional_financing_options" ON public.regional_financing_options
  FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_regional_cost_index_state_county ON public.regional_cost_index(state, county);
CREATE INDEX idx_regional_labor_rates_state_trade ON public.regional_labor_rates(state, trade);
CREATE INDEX idx_regional_permit_rules_state_county ON public.regional_permit_rules(state, county);
CREATE INDEX idx_market_opportunity_scores_state ON public.market_opportunity_scores(state);
CREATE INDEX idx_market_opportunity_scores_priority ON public.market_opportunity_scores(expansion_priority);
CREATE INDEX idx_contractor_density_map_state_zip ON public.contractor_density_map(state, zip_code);
CREATE INDEX idx_inspection_delay_patterns_state_county ON public.inspection_delay_patterns(state, county);
CREATE INDEX idx_regional_financing_options_state ON public.regional_financing_options(state);