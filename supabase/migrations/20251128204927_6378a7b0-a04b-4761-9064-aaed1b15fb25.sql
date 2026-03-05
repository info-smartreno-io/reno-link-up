-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS public.conversion_events CASCADE;
DROP TABLE IF EXISTS public.retargeting_audiences CASCADE;

-- Create conversion_events table
CREATE TABLE public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  event_type TEXT NOT NULL,
  event_category TEXT,
  user_id UUID,
  lead_id UUID,
  session_id TEXT,
  lead_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  page_path TEXT,
  page_title TEXT,
  referrer TEXT,
  conversion_value DECIMAL(10,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  fb_pixel_fired BOOLEAN DEFAULT false,
  tiktok_pixel_fired BOOLEAN DEFAULT false,
  google_ads_fired BOOLEAN DEFAULT false
);

CREATE INDEX idx_conversion_events_created_at ON public.conversion_events(created_at);
CREATE INDEX idx_conversion_events_event_type ON public.conversion_events(event_type);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.conversion_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read" ON public.conversion_events FOR SELECT TO authenticated USING (true);

-- Create retargeting_audiences table
CREATE TABLE public.retargeting_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  audience_name TEXT NOT NULL,
  audience_type TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  fb_audience_id TEXT,
  tiktok_audience_id TEXT,
  google_audience_id TEXT,
  estimated_size INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.retargeting_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated all" ON public.retargeting_audiences FOR ALL TO authenticated USING (true);