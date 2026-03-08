
-- Home Profiles
CREATE TABLE public.home_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_user_id uuid NOT NULL,
  project_id uuid NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  property_address text NOT NULL,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  zip_code text,
  year_built integer,
  square_footage integer,
  lot_size_sqft integer,
  home_type text,
  occupancy_status text,
  bedrooms numeric(4,1),
  bathrooms numeric(4,1),
  floors integer,
  purchase_year integer,
  parcel_id text,
  block_lot text,
  county text,
  sewer_type text,
  water_type text,
  heat_fuel_type text,
  hoa_flag boolean DEFAULT false,
  historic_home_flag boolean DEFAULT false,
  flood_zone_flag boolean DEFAULT false,
  enrichment_status text DEFAULT 'not_started',
  enrichment_last_run_at timestamptz,
  ai_last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can manage own home profiles" ON public.home_profiles
  FOR ALL USING (homeowner_user_id = auth.uid())
  WITH CHECK (homeowner_user_id = auth.uid());

CREATE POLICY "Admins can manage all home profiles" ON public.home_profiles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Home Systems
CREATE TABLE public.home_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_profile_id uuid NOT NULL REFERENCES public.home_profiles(id) ON DELETE CASCADE,
  system_type text NOT NULL,
  system_label text,
  brand text,
  manufacturer text,
  model_number text,
  serial_number text,
  install_year integer,
  approximate_age integer,
  last_service_date date,
  condition_rating text,
  known_issues boolean DEFAULT false,
  issue_summary text,
  repair_history text,
  homeowner_notes text,
  source_install_year text,
  source_condition text,
  source_system_data text,
  ai_typical_lifespan text,
  ai_estimated_replacement_window text,
  ai_risk_level text,
  ai_confidence text,
  ai_recommendation text,
  ai_reasoning_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can manage own home systems" ON public.home_systems
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.home_profiles hp WHERE hp.id = home_systems.home_profile_id AND hp.homeowner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.home_profiles hp WHERE hp.id = home_systems.home_profile_id AND hp.homeowner_user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all home systems" ON public.home_systems
  FOR ALL USING (public.is_admin(auth.uid()));

-- Home Documents
CREATE TABLE public.home_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_profile_id uuid NOT NULL REFERENCES public.home_profiles(id) ON DELETE CASCADE,
  related_system_id uuid NULL REFERENCES public.home_systems(id) ON DELETE SET NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_path text,
  mime_type text,
  file_size_bytes bigint,
  extracted_text text,
  extraction_status text DEFAULT 'not_started',
  upload_source text DEFAULT 'homeowner',
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can manage own home documents" ON public.home_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.home_profiles hp WHERE hp.id = home_documents.home_profile_id AND hp.homeowner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.home_profiles hp WHERE hp.id = home_documents.home_profile_id AND hp.homeowner_user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all home documents" ON public.home_documents
  FOR ALL USING (public.is_admin(auth.uid()));

-- Home Photos
CREATE TABLE public.home_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_profile_id uuid NOT NULL REFERENCES public.home_profiles(id) ON DELETE CASCADE,
  related_system_id uuid NULL REFERENCES public.home_systems(id) ON DELETE SET NULL,
  category text NOT NULL,
  file_name text,
  file_url text NOT NULL,
  file_path text,
  caption text,
  is_cover boolean DEFAULT false,
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can manage own home photos" ON public.home_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.home_profiles hp WHERE hp.id = home_photos.home_profile_id AND hp.homeowner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.home_profiles hp WHERE hp.id = home_photos.home_profile_id AND hp.homeowner_user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all home photos" ON public.home_photos
  FOR ALL USING (public.is_admin(auth.uid()));

-- Home Maintenance Events
CREATE TABLE public.home_maintenance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_profile_id uuid NOT NULL REFERENCES public.home_profiles(id) ON DELETE CASCADE,
  related_system_id uuid NULL REFERENCES public.home_systems(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_date date,
  vendor_name text,
  cost numeric(12,2),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_maintenance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can manage own maintenance events" ON public.home_maintenance_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.home_profiles hp WHERE hp.id = home_maintenance_events.home_profile_id AND hp.homeowner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.home_profiles hp WHERE hp.id = home_maintenance_events.home_profile_id AND hp.homeowner_user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all maintenance events" ON public.home_maintenance_events
  FOR ALL USING (public.is_admin(auth.uid()));

-- Home AI Insights
CREATE TABLE public.home_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_profile_id uuid NOT NULL REFERENCES public.home_profiles(id) ON DELETE CASCADE,
  related_system_id uuid NULL REFERENCES public.home_systems(id) ON DELETE SET NULL,
  insight_type text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  recommendation text,
  risk_level text,
  confidence_level text,
  supporting_factors jsonb DEFAULT '[]'::jsonb,
  source_summary jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can view own insights" ON public.home_ai_insights
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.home_profiles hp WHERE hp.id = home_ai_insights.home_profile_id AND hp.homeowner_user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all insights" ON public.home_ai_insights
  FOR ALL USING (public.is_admin(auth.uid()));

-- Property Enrichment Runs
CREATE TABLE public.property_enrichment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_profile_id uuid NOT NULL REFERENCES public.home_profiles(id) ON DELETE CASCADE,
  provider_name text NOT NULL,
  request_payload jsonb,
  response_payload jsonb,
  mapped_fields jsonb,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.property_enrichment_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage enrichment runs" ON public.property_enrichment_runs
  FOR ALL USING (public.is_admin(auth.uid()));

-- Home Profile Field Sources (provenance)
CREATE TABLE public.home_profile_field_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_profile_id uuid NOT NULL REFERENCES public.home_profiles(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_value text,
  source_name text NOT NULL,
  confidence_level text NOT NULL,
  source_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_profile_field_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can view own field sources" ON public.home_profile_field_sources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.home_profiles hp WHERE hp.id = home_profile_field_sources.home_profile_id AND hp.homeowner_user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all field sources" ON public.home_profile_field_sources
  FOR ALL USING (public.is_admin(auth.uid()));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('home-photos', 'home-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('home-documents', 'home-documents', false) ON CONFLICT (id) DO NOTHING;

-- Storage RLS for home-photos
CREATE POLICY "Homeowners can upload home photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'home-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Homeowners can view own home photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'home-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Homeowners can delete own home photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'home-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view home photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'home-photos');

-- Storage RLS for home-documents
CREATE POLICY "Homeowners can upload home documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'home-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Homeowners can view own home documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'home-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Homeowners can delete own home documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'home-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
