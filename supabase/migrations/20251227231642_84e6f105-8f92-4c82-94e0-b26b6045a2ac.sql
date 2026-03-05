-- Add marketing attribution fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS channel text,
ADD COLUMN IF NOT EXISTS campaign_name text,
ADD COLUMN IF NOT EXISTS sub_source text,
ADD COLUMN IF NOT EXISTS ad_group text,
ADD COLUMN IF NOT EXISTS gclid text,
ADD COLUMN IF NOT EXISTS fbclid text,
ADD COLUMN IF NOT EXISTS referral_type text;

-- Create indexes for marketing analytics queries
CREATE INDEX IF NOT EXISTS idx_leads_source_channel ON public.leads(source, channel);
CREATE INDEX IF NOT EXISTS idx_leads_location ON public.leads(location);
CREATE INDEX IF NOT EXISTS idx_leads_project_type ON public.leads(project_type);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- Add comment for documentation
COMMENT ON COLUMN public.leads.channel IS 'Marketing channel: search, lsa, group, organic, ads, referral';
COMMENT ON COLUMN public.leads.campaign_name IS 'Human-readable marketing campaign name';
COMMENT ON COLUMN public.leads.sub_source IS 'Sub-source like FB group name, keyword, etc.';
COMMENT ON COLUMN public.leads.ad_group IS 'Google Ads ad group name';
COMMENT ON COLUMN public.leads.gclid IS 'Google Click ID for attribution';
COMMENT ON COLUMN public.leads.fbclid IS 'Facebook Click ID for attribution';
COMMENT ON COLUMN public.leads.referral_type IS 'Type of referral: architect, client, yard_sign, word_of_mouth';