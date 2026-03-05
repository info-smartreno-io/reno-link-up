-- Add professional qualification fields to bid_submissions table
ALTER TABLE public.bid_submissions
ADD COLUMN years_in_business integer,
ADD COLUMN crew_size integer,
ADD COLUMN has_project_manager boolean DEFAULT false,
ADD COLUMN platform_ratings jsonb DEFAULT '{"google": null, "yelp": null, "angi": null, "houzz": null}'::jsonb,
ADD COLUMN overall_rating numeric(3,2),
ADD COLUMN anticipated_start_date date,
ADD COLUMN project_duration_weeks integer,
ADD COLUMN insurance_verified boolean DEFAULT false,
ADD COLUMN workers_comp_verified boolean DEFAULT false,
ADD COLUMN license_verified boolean DEFAULT false,
ADD COLUMN warranty_years numeric(3,1),
ADD COLUMN warranty_terms text,
ADD COLUMN references_count integer DEFAULT 0,
ADD COLUMN portfolio_projects_count integer DEFAULT 0,
ADD COLUMN certifications jsonb DEFAULT '[]'::jsonb;

-- Add comment explaining the new fields
COMMENT ON COLUMN public.bid_submissions.platform_ratings IS 'JSON object storing ratings from different platforms: {"google": 4.5, "yelp": 4.8, "angi": 4.7, "houzz": 4.9}';
COMMENT ON COLUMN public.bid_submissions.certifications IS 'Array of certification objects: [{"name": "LEED Certified", "issuer": "USGBC", "year": 2020}]';