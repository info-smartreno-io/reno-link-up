
-- Expand contractors table with qualification fields
ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'general_contractor',
  ADD COLUMN IF NOT EXISTS business_phone text,
  ADD COLUMN IF NOT EXISTS business_email text,
  ADD COLUMN IF NOT EXISTS google_business_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS houzz_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS has_office boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS office_address text,
  ADD COLUMN IF NOT EXISTS office_staff_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS project_manager_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_in_house_designer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS designer_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_dedicated_estimator boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_foreman_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS work_type text DEFAULT 'mix',
  ADD COLUMN IF NOT EXISTS uses_subcontractors boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subcontracted_trades text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS project_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS typical_budget_range text,
  ADD COLUMN IF NOT EXISTS avg_projects_per_year integer,
  ADD COLUMN IF NOT EXISTS typical_project_duration text,
  ADD COLUMN IF NOT EXISTS service_zip_codes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_counties text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_bonded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_rating numeric,
  ADD COLUMN IF NOT EXISTS google_review_count integer,
  ADD COLUMN IF NOT EXISTS profile_completion_pct integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS workers_comp_verified boolean DEFAULT false;

-- Create smart match scores table to cache match results
CREATE TABLE IF NOT EXISTS public.contractor_opportunity_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  bid_opportunity_id uuid NOT NULL REFERENCES public.bid_opportunities(id) ON DELETE CASCADE,
  match_score integer NOT NULL DEFAULT 0,
  trade_score integer DEFAULT 0,
  location_score integer DEFAULT 0,
  budget_score integer DEFAULT 0,
  type_score integer DEFAULT 0,
  capacity_score integer DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(contractor_id, bid_opportunity_id)
);

ALTER TABLE public.contractor_opportunity_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contractors_view_own_matches" ON public.contractor_opportunity_matches
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_users cu
      WHERE cu.contractor_id = contractor_opportunity_matches.contractor_id
        AND cu.user_id = auth.uid()
        AND cu.is_active = true
    )
  );

CREATE POLICY "admins_manage_matches" ON public.contractor_opportunity_matches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
