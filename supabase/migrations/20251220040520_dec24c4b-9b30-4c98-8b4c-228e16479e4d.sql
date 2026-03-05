-- Add SmartReno sync tracking columns to newsletter_subscribers
ALTER TABLE public.newsletter_subscribers 
ADD COLUMN IF NOT EXISTS smartreno_synced boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS smartreno_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS sync_retry_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sync_error text;

-- Create index for efficient querying of failed syncs
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_sync_retry 
ON public.newsletter_subscribers (smartreno_synced, sync_retry_count) 
WHERE smartreno_synced = false;