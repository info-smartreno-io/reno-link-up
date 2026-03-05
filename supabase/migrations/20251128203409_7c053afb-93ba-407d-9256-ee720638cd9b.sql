-- =====================================================
-- SMARTRENO LEAD GENERATION ENGINE - DATABASE FOUNDATION
-- =====================================================

-- 1. Homeowner Leads Table (Enhanced Attribution Tracking)
CREATE TABLE IF NOT EXISTS public.homeowner_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_type TEXT NOT NULL,
  zip_code TEXT,
  county TEXT,
  town TEXT,
  
  -- Attribution & Tracking
  lead_source TEXT, -- organic, paid_search, social, referral, direct
  campaign_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Journey Tracking
  landing_page TEXT,
  page_path JSONB DEFAULT '[]'::jsonb, -- array of pages visited
  completed_steps JSONB DEFAULT '[]'::jsonb, -- which intake steps completed
  drop_off_step TEXT,
  
  -- Contact & Project Details
  name TEXT,
  email TEXT,
  phone TEXT,
  estimated_budget TEXT,
  timeline TEXT,
  description TEXT,
  
  -- Status & Conversion
  status TEXT DEFAULT 'new_lead',
  converted_at TIMESTAMPTZ,
  assigned_estimator_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Contractor Leads Table (Acquisition Pipeline)
CREATE TABLE IF NOT EXISTS public.contractor_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  contractor_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Business Details
  company_size TEXT, -- solo, 2-5, 6-15, 16+
  years_in_business INTEGER,
  service_areas TEXT[], -- zip codes or towns
  specialties TEXT[], -- kitchen, bathroom, additions, etc.
  license_number TEXT,
  insurance_verified BOOLEAN DEFAULT false,
  
  -- Acquisition Source
  scraped_source TEXT, -- google, yelp, angi, thumbtack, clay
  scrape_data JSONB, -- raw data from scraping
  referral_source TEXT, -- existing contractor name or partner
  referral_id UUID, -- if referred by another contractor
  
  -- Scoring & Qualification
  quality_score INTEGER, -- 0-100
  seo_ranking_page INTEGER, -- which page they rank on Google
  review_count INTEGER,
  average_rating NUMERIC(3,2),
  website_quality_score INTEGER, -- 0-100
  
  -- Outreach Status
  outreach_status TEXT DEFAULT 'new', -- new, contacted, scheduled, onboarded, rejected
  first_contact_date TIMESTAMPTZ,
  scheduled_call_date TIMESTAMPTZ,
  onboarded_date TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Outreach Tracking
  emails_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  last_outreach_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SEO Content Updates Table (AI Maintenance)
CREATE TABLE IF NOT EXISTS public.seo_content_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Page Identification
  page_path TEXT NOT NULL,
  page_type TEXT, -- town_page, cost_guide, blog, contractor_directory
  target_location TEXT, -- Bergen County, Ridgewood, etc.
  target_project TEXT, -- kitchen, bathroom, addition, etc.
  
  -- Update Details
  update_type TEXT, -- content_refresh, seo_optimization, link_addition, new_section
  update_summary TEXT,
  changes_made JSONB, -- detailed changelog
  
  -- AI Scoring
  ai_confidence_score INTEGER, -- 0-100
  seo_impact_score INTEGER, -- predicted impact 0-100
  
  -- Performance Tracking
  before_ranking INTEGER,
  after_ranking INTEGER,
  before_traffic INTEGER,
  after_traffic INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, applied, rolled_back
  applied_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  last_refresh TIMESTAMPTZ DEFAULT now()
);

-- 4. Partner Referrals Table (Local Partnerships)
CREATE TABLE IF NOT EXISTS public.partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Partner Info
  partner_id UUID, -- references a partners table we'll create
  partner_name TEXT NOT NULL,
  partner_type TEXT, -- supplier, material_vendor, hvac, plumbing, etc.
  
  -- Referral Chain
  contractor_id UUID REFERENCES auth.users(id),
  homeowner_project_id UUID REFERENCES public.projects(id),
  
  -- Referral Details
  referral_type TEXT, -- contractor_to_smartreno, supplier_to_contractor, etc.
  referral_value NUMERIC(10,2), -- estimated project value
  referral_bonus NUMERIC(10,2), -- bonus paid to referrer
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, qualified, converted, paid
  qualified_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Contractor Onboarding Progress Table
CREATE TABLE IF NOT EXISTS public.contractor_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Onboarding Steps
  license_verified BOOLEAN DEFAULT false,
  insurance_verified BOOLEAN DEFAULT false,
  portfolio_uploaded BOOLEAN DEFAULT false,
  service_areas_mapped BOOLEAN DEFAULT false,
  trade_specialties_selected BOOLEAN DEFAULT false,
  pricing_template_created BOOLEAN DEFAULT false,
  availability_calendar_setup BOOLEAN DEFAULT false,
  
  -- Verification Documents
  license_document_url TEXT,
  insurance_document_url TEXT,
  portfolio_urls TEXT[],
  
  -- Scoring
  onboarding_completion_score INTEGER DEFAULT 0, -- 0-100
  profile_quality_score INTEGER DEFAULT 0, -- 0-100
  
  -- Performance Metrics (calculated)
  response_rate NUMERIC(5,2), -- percentage
  quality_score NUMERIC(5,2), -- 0-100
  review_score NUMERIC(3,2), -- average rating
  completion_rate NUMERIC(5,2), -- percentage of projects completed
  pricing_fairness_index NUMERIC(5,2), -- compared to market average
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_contractor_onboarding UNIQUE(contractor_id)
);

-- 6. Contractor Referrals Table (Contractor-to-Contractor)
CREATE TABLE IF NOT EXISTS public.contractor_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  referrer_contractor_id UUID REFERENCES auth.users(id) NOT NULL,
  referred_contractor_id UUID, -- may not have account yet
  referred_contractor_email TEXT NOT NULL,
  referred_contractor_name TEXT,
  referred_contractor_phone TEXT,
  
  -- Referral Status
  status TEXT DEFAULT 'invited', -- invited, signed_up, onboarded, earned_credit
  invited_at TIMESTAMPTZ DEFAULT now(),
  signed_up_at TIMESTAMPTZ,
  onboarded_at TIMESTAMPTZ,
  
  -- Reward
  referral_credit NUMERIC(10,2) DEFAULT 250.00,
  credit_applied BOOLEAN DEFAULT false,
  credit_applied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Programmatic SEO Pages Table
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Page Identity
  page_type TEXT NOT NULL, -- town_page, cost_guide, contractor_directory, blog
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT,
  
  -- Location Targeting
  state TEXT DEFAULT 'New Jersey',
  county TEXT,
  town TEXT,
  zip_code TEXT,
  
  -- Project Targeting
  project_type TEXT, -- kitchen, bathroom, addition, deck, etc.
  
  -- Content
  content JSONB, -- structured content sections
  hero_title TEXT,
  hero_description TEXT,
  
  -- SEO Data
  target_keywords TEXT[],
  internal_links JSONB, -- links to related pages
  
  -- Performance
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT now(),
  monthly_views INTEGER DEFAULT 0,
  monthly_conversions INTEGER DEFAULT 0,
  
  -- AI Maintenance
  ai_generated BOOLEAN DEFAULT false,
  last_ai_refresh TIMESTAMPTZ,
  needs_refresh BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_homeowner_leads_source ON public.homeowner_leads(lead_source);
CREATE INDEX idx_homeowner_leads_status ON public.homeowner_leads(status);
CREATE INDEX idx_homeowner_leads_created ON public.homeowner_leads(created_at DESC);
CREATE INDEX idx_homeowner_leads_zip ON public.homeowner_leads(zip_code);

CREATE INDEX idx_contractor_leads_status ON public.contractor_leads(outreach_status);
CREATE INDEX idx_contractor_leads_quality ON public.contractor_leads(quality_score DESC);
CREATE INDEX idx_contractor_leads_created ON public.contractor_leads(created_at DESC);

CREATE INDEX idx_seo_content_page ON public.seo_content_updates(page_path);
CREATE INDEX idx_seo_content_type ON public.seo_content_updates(page_type);
CREATE INDEX idx_seo_content_status ON public.seo_content_updates(status);

CREATE INDEX idx_contractor_onboarding_contractor ON public.contractor_onboarding(contractor_id);
CREATE INDEX idx_contractor_onboarding_completion ON public.contractor_onboarding(onboarding_completion_score DESC);

CREATE INDEX idx_seo_pages_slug ON public.seo_pages(slug);
CREATE INDEX idx_seo_pages_county_town ON public.seo_pages(county, town);
CREATE INDEX idx_seo_pages_published ON public.seo_pages(published) WHERE published = true;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE public.homeowner_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_content_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- Homeowner Leads Policies
CREATE POLICY "Estimators and admins can view all homeowner leads"
  ON public.homeowner_leads FOR SELECT
  USING (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can insert homeowner leads"
  ON public.homeowner_leads FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can update homeowner leads"
  ON public.homeowner_leads FOR UPDATE
  USING (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Contractor Leads Policies
CREATE POLICY "Admins can manage contractor leads"
  ON public.contractor_leads FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can view contractor leads"
  ON public.contractor_leads FOR SELECT
  USING (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- SEO Content Updates Policies
CREATE POLICY "Admins can manage SEO content"
  ON public.seo_content_updates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view published SEO pages"
  ON public.seo_pages FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can manage SEO pages"
  ON public.seo_pages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Partner Referrals Policies
CREATE POLICY "Admins can manage partner referrals"
  ON public.partner_referrals FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can view their partner referrals"
  ON public.partner_referrals FOR SELECT
  USING (contractor_id = auth.uid());

-- Contractor Onboarding Policies
CREATE POLICY "Contractors can view their own onboarding"
  ON public.contractor_onboarding FOR SELECT
  USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can update their own onboarding"
  ON public.contractor_onboarding FOR UPDATE
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can insert their own onboarding"
  ON public.contractor_onboarding FOR INSERT
  WITH CHECK (contractor_id = auth.uid());

-- Contractor Referrals Policies
CREATE POLICY "Contractors can view their referrals"
  ON public.contractor_referrals FOR SELECT
  USING (referrer_contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can create referrals"
  ON public.contractor_referrals FOR INSERT
  WITH CHECK (referrer_contractor_id = auth.uid());

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_homeowner_leads_updated_at
  BEFORE UPDATE ON public.homeowner_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractor_leads_updated_at
  BEFORE UPDATE ON public.contractor_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_referrals_updated_at
  BEFORE UPDATE ON public.partner_referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractor_onboarding_updated_at
  BEFORE UPDATE ON public.contractor_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractor_referrals_updated_at
  BEFORE UPDATE ON public.contractor_referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_pages_updated_at
  BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();