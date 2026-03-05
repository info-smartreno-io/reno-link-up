-- Website AI Enhancements Tables

-- 1. AI cost estimates (public widget)
CREATE TABLE IF NOT EXISTS public.website_cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code TEXT,
  project_type TEXT NOT NULL,
  square_footage INTEGER,
  room_count INTEGER,
  estimated_range JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  converted_to_lead BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Public chat conversations
CREATE TABLE IF NOT EXISTS public.website_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  ip_address TEXT,
  user_location TEXT,
  converted_to_lead BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. AI-generated blog posts
CREATE TABLE IF NOT EXISTS public.ai_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  keywords TEXT[],
  target_location TEXT,
  project_type TEXT,
  status TEXT DEFAULT 'draft',
  generated_by UUID,
  reviewed_by UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Location-based content personalization
CREATE TABLE IF NOT EXISTS public.location_personalizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  county TEXT,
  popular_projects JSONB,
  local_insights TEXT,
  pricing_adjustments JSONB,
  seasonal_notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Website optimization insights
CREATE TABLE IF NOT EXISTS public.website_optimization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  recommendations JSONB,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies (Public access for website features)
ALTER TABLE public.website_cost_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_personalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_optimization_logs ENABLE ROW LEVEL SECURITY;

-- Public can insert their own data
CREATE POLICY "Anyone can insert cost estimates"
  ON public.website_cost_estimates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert chat conversations"
  ON public.website_chat_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own chat conversation"
  ON public.website_chat_conversations FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can read published blog posts"
  ON public.ai_blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Anyone can read location personalizations"
  ON public.location_personalizations FOR SELECT
  USING (true);

-- Admin full access to all tables
CREATE POLICY "Admin full access to cost estimates"
  ON public.website_cost_estimates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin full access to chat conversations"
  ON public.website_chat_conversations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin full access to blog posts"
  ON public.ai_blog_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin full access to location personalizations"
  ON public.location_personalizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin full access to optimization logs"
  ON public.website_optimization_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

-- Indexes
CREATE INDEX idx_cost_estimates_zip ON public.website_cost_estimates(zip_code);
CREATE INDEX idx_cost_estimates_created ON public.website_cost_estimates(created_at DESC);
CREATE INDEX idx_chat_session ON public.website_chat_conversations(session_id);
CREATE INDEX idx_blog_posts_slug ON public.ai_blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.ai_blog_posts(status);
CREATE INDEX idx_location_personalizations_location ON public.location_personalizations(location);