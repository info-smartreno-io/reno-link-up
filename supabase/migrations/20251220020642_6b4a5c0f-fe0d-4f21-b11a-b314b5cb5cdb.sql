-- Create API keys table for partner authentication
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policy for admin access only
CREATE POLICY "Admins can manage api_keys"
  ON public.api_keys FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add source tracking columns to leads table
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS source_api_key_id UUID REFERENCES public.api_keys(id),
  ADD COLUMN IF NOT EXISTS external_reference_id TEXT;

-- Make user_id nullable for external leads (they get assigned later)
ALTER TABLE public.leads 
  ALTER COLUMN user_id DROP NOT NULL;

-- Create index for API key lookups
CREATE INDEX idx_api_keys_key ON public.api_keys(api_key) WHERE is_active = true;

-- Create index for lead source tracking
CREATE INDEX idx_leads_source ON public.leads(source);