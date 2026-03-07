
-- Add design_professional to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'design_professional';

-- Create design_professional_profiles table
CREATE TABLE public.design_professional_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name text,
  website text,
  instagram_or_portfolio_link text,
  business_address text,
  primary_service_area text,
  years_in_business integer,
  team_size integer,
  profile_photo_url text,
  company_logo_url text,
  headline text,
  full_bio text,
  design_philosophy text,
  ideal_client_type text,
  specialties text[] DEFAULT '{}',
  services_offered text[] DEFAULT '{}',
  project_types text[] DEFAULT '{}',
  budget_ranges text[] DEFAULT '{}',
  zip_codes_served text[] DEFAULT '{}',
  counties_served text[] DEFAULT '{}',
  pricing_model text[] DEFAULT '{}',
  preferred_lead_types text[] DEFAULT '{}',
  preferred_communication text[] DEFAULT '{}',
  starting_consultation_fee numeric,
  minimum_project_size numeric,
  pricing_notes text,
  credentials jsonb DEFAULT '{}',
  architect_license_number text,
  licensed_states text[] DEFAULT '{}',
  aia_member boolean DEFAULT false,
  ncarb boolean DEFAULT false,
  nkba_member boolean DEFAULT false,
  leed_accredited boolean DEFAULT false,
  insurance_status text,
  business_registered boolean DEFAULT false,
  certification_notes text,
  accepting_new_projects boolean DEFAULT true,
  consultation_availability text DEFAULT '1_week',
  service_mode text DEFAULT 'both',
  travel_radius_miles integer DEFAULT 25,
  willing_to_travel_for_premium_projects boolean DEFAULT false,
  profile_completion_percent integer DEFAULT 0,
  application_status text DEFAULT 'pending',
  approved_at timestamptz,
  approved_by uuid,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create portfolio items table
CREATE TABLE public.design_professional_portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  location text,
  project_type text,
  description text,
  scope_of_work text,
  budget_range text,
  style_tags text[] DEFAULT '{}',
  cover_image_url text,
  featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create portfolio media table
CREATE TABLE public.design_professional_portfolio_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id uuid REFERENCES public.design_professional_portfolio_items(id) ON DELETE CASCADE NOT NULL,
  media_type text DEFAULT 'image',
  file_url text NOT NULL,
  file_name text,
  mime_type text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE public.design_professional_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  design_professional_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_score numeric DEFAULT 0,
  match_reason jsonb DEFAULT '{}',
  status text DEFAULT 'suggested',
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_professional_portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_professional_portfolio_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_professional_matches ENABLE ROW LEVEL SECURITY;

-- RLS: design_professional_profiles
CREATE POLICY "Users can view own profile" ON public.design_professional_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.design_professional_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.design_professional_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.design_professional_profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.design_professional_profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS: portfolio items
CREATE POLICY "Users can manage own portfolio items" ON public.design_professional_portfolio_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all portfolio items" ON public.design_professional_portfolio_items
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view portfolio items" ON public.design_professional_portfolio_items
  FOR SELECT USING (true);

-- RLS: portfolio media
CREATE POLICY "Users can manage own portfolio media" ON public.design_professional_portfolio_media
  FOR ALL USING (
    portfolio_item_id IN (
      SELECT id FROM public.design_professional_portfolio_items WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view portfolio media" ON public.design_professional_portfolio_media
  FOR SELECT USING (true);

-- RLS: matches
CREATE POLICY "Users can view own matches" ON public.design_professional_matches
  FOR SELECT USING (auth.uid() = design_professional_user_id);

CREATE POLICY "Users can update own matches" ON public.design_professional_matches
  FOR UPDATE USING (auth.uid() = design_professional_user_id);

CREATE POLICY "Admins can manage all matches" ON public.design_professional_matches
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for portfolio
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-portfolio', 'design-portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Authenticated users can upload portfolio files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'design-portfolio');

CREATE POLICY "Anyone can view portfolio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-portfolio');

CREATE POLICY "Users can delete own portfolio files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'design-portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
