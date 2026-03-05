-- Add estimator assignment tracking to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS estimator_id uuid;

-- Add walkthrough scheduling tracking to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS walkthrough_scheduled_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS walkthrough_completed_at timestamptz;

-- Create index for estimator lookups
CREATE INDEX IF NOT EXISTS idx_leads_estimator_id ON public.leads(estimator_id);

-- Create index for pipeline stage queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

COMMENT ON COLUMN public.leads.estimator_id IS 'The estimator assigned to this lead';
COMMENT ON COLUMN public.leads.walkthrough_scheduled_at IS 'When the walkthrough was scheduled';
COMMENT ON COLUMN public.leads.walkthrough_completed_at IS 'When the walkthrough was completed';