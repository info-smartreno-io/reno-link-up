-- Add source tracking columns to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS source_api_key_id uuid REFERENCES public.api_keys(id),
ADD COLUMN IF NOT EXISTS external_candidate_id text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS years_experience text,
ADD COLUMN IF NOT EXISTS availability text,
ADD COLUMN IF NOT EXISTS trade_specialty text;

-- Add index for source tracking
CREATE INDEX IF NOT EXISTS idx_job_applications_source ON public.job_applications(source);
CREATE INDEX IF NOT EXISTS idx_job_applications_external_candidate_id ON public.job_applications(external_candidate_id);