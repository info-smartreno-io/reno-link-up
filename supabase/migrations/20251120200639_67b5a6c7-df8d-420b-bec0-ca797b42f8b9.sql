-- AI Performance Auditor Tables

-- Table to track performance audit reports
CREATE TABLE IF NOT EXISTS public.ai_performance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  pages_audited INTEGER DEFAULT 0,
  average_performance_score DECIMAL(3,2),
  average_accessibility_score DECIMAL(3,2),
  average_seo_score DECIMAL(3,2),
  average_best_practices_score DECIMAL(3,2),
  issues_found INTEGER DEFAULT 0,
  error_message TEXT
);

-- Table to store individual page performance audits
CREATE TABLE IF NOT EXISTS public.ai_performance_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.ai_performance_reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Page details
  page_url TEXT NOT NULL,
  page_name TEXT NOT NULL,
  
  -- Lighthouse scores (0.00 to 1.00)
  performance_score DECIMAL(3,2),
  accessibility_score DECIMAL(3,2),
  seo_score DECIMAL(3,2),
  best_practices_score DECIMAL(3,2),
  
  -- Core Web Vitals
  lcp_value INTEGER, -- Largest Contentful Paint (ms)
  fid_value INTEGER, -- First Input Delay (ms)
  cls_value DECIMAL(4,3), -- Cumulative Layout Shift
  
  -- Additional metrics
  fcp_value INTEGER, -- First Contentful Paint (ms)
  ttfb_value INTEGER, -- Time to First Byte (ms)
  tti_value INTEGER, -- Time to Interactive (ms)
  
  -- AI Analysis
  ai_summary TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'))
);

-- Table to store AI-suggested performance optimizations
CREATE TABLE IF NOT EXISTS public.ai_performance_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.ai_performance_audits(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Recommendation details
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'image_optimization',
    'code_splitting',
    'caching',
    'lazy_loading',
    'minification',
    'server_response_time',
    'render_blocking',
    'unused_javascript',
    'unused_css',
    'font_optimization',
    'third_party_scripts'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
  estimated_improvement TEXT, -- e.g., "Reduce LCP by 1.2s"
  implementation_notes TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ai_performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_performance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_performance_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated read on ai_performance_reports"
  ON public.ai_performance_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role all on ai_performance_reports"
  ON public.ai_performance_reports FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Allow authenticated read on ai_performance_audits"
  ON public.ai_performance_audits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role all on ai_performance_audits"
  ON public.ai_performance_audits FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Allow authenticated read on ai_performance_recommendations"
  ON public.ai_performance_recommendations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update status on ai_performance_recommendations"
  ON public.ai_performance_recommendations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all on ai_performance_recommendations"
  ON public.ai_performance_recommendations FOR ALL
  TO service_role
  USING (true);

-- Create indexes
CREATE INDEX idx_performance_audits_report_id ON public.ai_performance_audits(report_id);
CREATE INDEX idx_performance_recommendations_audit_id ON public.ai_performance_recommendations(audit_id);
CREATE INDEX idx_performance_reports_created_at ON public.ai_performance_reports(created_at DESC);
CREATE INDEX idx_performance_audits_page_url ON public.ai_performance_audits(page_url);
CREATE INDEX idx_performance_recommendations_status ON public.ai_performance_recommendations(status);