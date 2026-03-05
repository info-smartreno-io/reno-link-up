-- AI SEO Reports Table
CREATE TABLE IF NOT EXISTS public.ai_seo_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_type TEXT NOT NULL DEFAULT 'weekly_refresh',
  status TEXT NOT NULL DEFAULT 'pending',
  pages_analyzed INTEGER DEFAULT 0,
  recommendations_count INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- AI SEO Recommendations Table
CREATE TABLE IF NOT EXISTS public.ai_seo_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.ai_seo_reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  page_path TEXT NOT NULL,
  page_type TEXT NOT NULL,
  recommendation_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  current_value TEXT,
  suggested_value TEXT,
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.ai_seo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_seo_recommendations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view and manage SEO data
CREATE POLICY "Authenticated users can view SEO reports"
  ON public.ai_seo_reports FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert SEO reports"
  ON public.ai_seo_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update SEO reports"
  ON public.ai_seo_reports FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can view SEO recommendations"
  ON public.ai_seo_recommendations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update SEO recommendations"
  ON public.ai_seo_recommendations FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert SEO recommendations"
  ON public.ai_seo_recommendations FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_seo_reports_created_at ON public.ai_seo_reports(created_at DESC);
CREATE INDEX idx_seo_reports_status ON public.ai_seo_reports(status);
CREATE INDEX idx_seo_recommendations_report_id ON public.ai_seo_recommendations(report_id);
CREATE INDEX idx_seo_recommendations_status ON public.ai_seo_recommendations(status);
CREATE INDEX idx_seo_recommendations_priority ON public.ai_seo_recommendations(priority);