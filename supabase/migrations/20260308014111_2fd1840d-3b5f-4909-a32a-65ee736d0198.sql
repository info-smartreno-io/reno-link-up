
-- Add linkage columns to design_packages
ALTER TABLE public.design_packages 
  ADD COLUMN IF NOT EXISTS source_smart_estimate_id uuid REFERENCES public.smart_estimates(id),
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_mapping_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS last_synced_from_smart_estimate_at timestamptz;

-- Add linkage columns to bid_packets
ALTER TABLE public.bid_packets
  ADD COLUMN IF NOT EXISTS source_smart_estimate_id uuid REFERENCES public.smart_estimates(id),
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_mapping_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS last_synced_from_smart_estimate_at timestamptz;
