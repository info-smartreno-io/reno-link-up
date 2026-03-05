-- Add estimator notes and recommendations to bid submissions
ALTER TABLE public.bid_submissions
ADD COLUMN estimator_notes text,
ADD COLUMN estimator_recommendation text;

-- Add preferred bid selection to comparison reports
ALTER TABLE public.bid_comparison_reports
ADD COLUMN preferred_bid_id uuid REFERENCES public.bid_submissions(id) ON DELETE SET NULL,
ADD COLUMN estimator_recommendation text;

-- Add comments to track note changes
COMMENT ON COLUMN public.bid_submissions.estimator_notes IS 'Internal notes from estimator about this specific bid submission';
COMMENT ON COLUMN public.bid_submissions.estimator_recommendation IS 'Estimator recommendation text visible to homeowner (e.g., "Best value", "Premium quality", "Fastest timeline")';
COMMENT ON COLUMN public.bid_comparison_reports.preferred_bid_id IS 'Estimator preferred/recommended bid for this project';
COMMENT ON COLUMN public.bid_comparison_reports.estimator_recommendation IS 'Overall recommendation text from estimator to homeowner';