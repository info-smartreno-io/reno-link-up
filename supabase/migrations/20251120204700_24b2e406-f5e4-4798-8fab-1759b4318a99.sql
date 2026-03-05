-- AI Content Pipeline Tables

-- Content generation reports
CREATE TABLE IF NOT EXISTS public.ai_content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  report_type TEXT DEFAULT 'monthly' CHECK (report_type IN ('monthly', 'weekly', 'on_demand')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  ideas_generated INTEGER DEFAULT 0,
  blog_ideas INTEGER DEFAULT 0,
  cost_guide_ideas INTEGER DEFAULT 0,
  keyword_suggestions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content ideas with AI analysis
CREATE TABLE IF NOT EXISTS public.ai_content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.ai_content_reports(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog_post', 'cost_guide', 'landing_page', 'faq', 'case_study')),
  title TEXT NOT NULL,
  description TEXT,
  target_keywords TEXT[],
  search_volume_estimate INTEGER,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  target_location TEXT,
  project_type TEXT,
  estimated_word_count INTEGER,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected')),
  ai_outline TEXT,
  ai_reasoning TEXT,
  seo_potential_score DECIMAL(3,2), -- 0.00 to 1.00
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Keyword research results
CREATE TABLE IF NOT EXISTS public.ai_keyword_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.ai_content_reports(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_intent TEXT, -- informational, transactional, navigational, commercial
  search_volume_estimate INTEGER,
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  related_keywords TEXT[],
  content_gap_opportunity TEXT,
  suggested_content_types TEXT[],
  priority_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_keyword_research ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only)
CREATE POLICY "Admin full access to content reports"
  ON public.ai_content_reports FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to content ideas"
  ON public.ai_content_ideas FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to keyword research"
  ON public.ai_keyword_research FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_content_ideas_report_id ON public.ai_content_ideas(report_id);
CREATE INDEX idx_content_ideas_status ON public.ai_content_ideas(status);
CREATE INDEX idx_content_ideas_priority ON public.ai_content_ideas(priority);
CREATE INDEX idx_content_ideas_content_type ON public.ai_content_ideas(content_type);
CREATE INDEX idx_keyword_research_report_id ON public.ai_keyword_research(report_id);
CREATE INDEX idx_keyword_research_priority ON public.ai_keyword_research(priority_score DESC);