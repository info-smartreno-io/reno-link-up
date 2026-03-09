
-- Imported businesses from Google Places API
CREATE TABLE public.imported_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type TEXT NOT NULL CHECK (business_type IN ('contractor', 'designer')),
  slug TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  category TEXT,
  primary_type TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'NJ',
  zip TEXT,
  phone TEXT,
  website TEXT,
  google_rating NUMERIC(2,1),
  review_count INTEGER DEFAULT 0,
  google_place_id TEXT UNIQUE,
  map_link TEXT,
  business_status TEXT DEFAULT 'operational',
  service_area_tags TEXT[] DEFAULT '{}',
  photo_url TEXT,
  photo_attributions JSONB,
  source TEXT DEFAULT 'google_places',
  claim_status TEXT DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed', 'claimed', 'pending_review', 'verified')),
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  search_query TEXT,
  raw_place_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for directory queries
CREATE INDEX idx_imported_businesses_type ON public.imported_businesses(business_type, is_active);
CREATE INDEX idx_imported_businesses_slug ON public.imported_businesses(slug);
CREATE INDEX idx_imported_businesses_place_id ON public.imported_businesses(google_place_id);
CREATE INDEX idx_imported_businesses_city ON public.imported_businesses(city);

-- Claim profile requests
CREATE TABLE public.profile_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.imported_businesses(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  relationship TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin import logs
CREATE TABLE public.google_places_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL,
  business_type TEXT NOT NULL,
  results_found INTEGER DEFAULT 0,
  new_imported INTEGER DEFAULT 0,
  duplicates_skipped INTEGER DEFAULT 0,
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.imported_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_places_import_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for directory
CREATE POLICY "Anyone can view active businesses"
ON public.imported_businesses FOR SELECT
USING (is_active = true);

-- Admins can manage businesses
CREATE POLICY "Admins can manage businesses"
ON public.imported_businesses FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can submit claim requests
CREATE POLICY "Anyone can submit claim requests"
ON public.profile_claim_requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can view their own claims
CREATE POLICY "Users can view own claims"
ON public.profile_claim_requests FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Admins can manage claims
CREATE POLICY "Admins can manage claims"
ON public.profile_claim_requests FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can view import logs
CREATE POLICY "Admins can manage import logs"
ON public.google_places_import_logs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
