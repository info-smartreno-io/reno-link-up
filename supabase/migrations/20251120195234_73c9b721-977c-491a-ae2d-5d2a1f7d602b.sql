-- AI Broken Link & Redirect Manager Tables

-- Table to track redirect analysis reports
CREATE TABLE IF NOT EXISTS public.ai_redirect_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  pages_crawled INTEGER DEFAULT 0,
  broken_links_found INTEGER DEFAULT 0,
  redirects_suggested INTEGER DEFAULT 0,
  error_message TEXT
);

-- Table to store individual broken link findings and redirect suggestions
CREATE TABLE IF NOT EXISTS public.ai_redirect_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.ai_redirect_reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Broken link details
  broken_url TEXT NOT NULL,
  found_on_page TEXT NOT NULL,
  link_text TEXT,
  error_type TEXT NOT NULL CHECK (error_type IN ('404', '500', 'timeout', 'invalid', 'external_broken')),
  
  -- AI suggestion
  suggested_redirect_url TEXT,
  confidence_score DECIMAL(3,2),
  reasoning TEXT,
  
  -- Priority and status
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  applied_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.ai_redirect_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_redirect_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to read, only service role to write
CREATE POLICY "Allow authenticated read on ai_redirect_reports"
  ON public.ai_redirect_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role all on ai_redirect_reports"
  ON public.ai_redirect_reports FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Allow authenticated read on ai_redirect_recommendations"
  ON public.ai_redirect_recommendations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update status on ai_redirect_recommendations"
  ON public.ai_redirect_recommendations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all on ai_redirect_recommendations"
  ON public.ai_redirect_recommendations FOR ALL
  TO service_role
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_redirect_recommendations_report_id ON public.ai_redirect_recommendations(report_id);
CREATE INDEX idx_redirect_recommendations_status ON public.ai_redirect_recommendations(status);
CREATE INDEX idx_redirect_reports_created_at ON public.ai_redirect_reports(created_at DESC);