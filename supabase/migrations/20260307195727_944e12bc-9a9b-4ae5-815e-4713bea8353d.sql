-- Add new columns to design_professional_profiles
ALTER TABLE public.design_professional_profiles
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS unique_value_proposition text,
  ADD COLUMN IF NOT EXISTS brand_positioning text,
  ADD COLUMN IF NOT EXISTS notable_projects_summary text,
  ADD COLUMN IF NOT EXISTS awards_or_publications text,
  ADD COLUMN IF NOT EXISTS do_you_source_materials boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS material_sourcing_notes text,
  ADD COLUMN IF NOT EXISTS primary_service_zip text,
  ADD COLUMN IF NOT EXISTS primary_service_city text,
  ADD COLUMN IF NOT EXISTS primary_service_state text,
  ADD COLUMN IF NOT EXISTS service_area_type text DEFAULT 'radius',
  ADD COLUMN IF NOT EXISTS service_radius_miles integer,
  ADD COLUMN IF NOT EXISTS region_notes text,
  ADD COLUMN IF NOT EXISTS architect_license_document_url text,
  ADD COLUMN IF NOT EXISTS architect_certificate_upload text,
  ADD COLUMN IF NOT EXISTS insurance_certificate_upload text,
  ADD COLUMN IF NOT EXISTS business_registration_document text,
  ADD COLUMN IF NOT EXISTS can_coordinate_engineering boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS works_with_structural_engineer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS works_with_mep_engineer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS engineering_services_supported text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS staging_services_offered text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS inventory_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS average_staging_cost_range text,
  ADD COLUMN IF NOT EXISTS staging_turnaround_time_days integer;

-- Add before/after images to portfolio items
ALTER TABLE public.design_professional_portfolio_items
  ADD COLUMN IF NOT EXISTS before_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS after_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS renderings text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS proposal_documents text[] DEFAULT '{}';

-- Create design packages table
CREATE TABLE IF NOT EXISTS public.design_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  assigned_estimator_id uuid,
  assigned_design_professional_id uuid,
  package_status text NOT NULL DEFAULT 'draft',
  package_completion_percent integer DEFAULT 0,
  ready_for_rfp boolean DEFAULT false,
  internal_review_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.design_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access design_packages" ON public.design_packages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Design pro can view assigned packages" ON public.design_packages
  FOR SELECT TO authenticated
  USING (assigned_design_professional_id = auth.uid());

CREATE POLICY "Design pro can update assigned packages" ON public.design_packages
  FOR UPDATE TO authenticated
  USING (assigned_design_professional_id = auth.uid());

CREATE POLICY "Estimator can view assigned packages" ON public.design_packages
  FOR SELECT TO authenticated
  USING (assigned_estimator_id = auth.uid());

CREATE POLICY "Estimator can update assigned packages" ON public.design_packages
  FOR UPDATE TO authenticated
  USING (assigned_estimator_id = auth.uid());

-- Design package sections
CREATE TABLE IF NOT EXISTS public.design_package_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_package_id uuid REFERENCES public.design_packages(id) ON DELETE CASCADE NOT NULL,
  section_key text NOT NULL,
  section_data jsonb DEFAULT '{}',
  completion_percent integer DEFAULT 0,
  is_complete boolean DEFAULT false,
  last_edited_by uuid,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.design_package_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access design_package_sections" ON public.design_package_sections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned users can view sections" ON public.design_package_sections
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.design_packages dp
    WHERE dp.id = design_package_id
    AND (dp.assigned_design_professional_id = auth.uid() OR dp.assigned_estimator_id = auth.uid())
  ));

CREATE POLICY "Assigned users can update sections" ON public.design_package_sections
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.design_packages dp
    WHERE dp.id = design_package_id
    AND (dp.assigned_design_professional_id = auth.uid() OR dp.assigned_estimator_id = auth.uid())
  ));

-- Design package files
CREATE TABLE IF NOT EXISTS public.design_package_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_package_id uuid REFERENCES public.design_packages(id) ON DELETE CASCADE NOT NULL,
  section_key text,
  file_url text NOT NULL,
  file_category text,
  visible_to_roles text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.design_package_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access design_package_files" ON public.design_package_files
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned users can view files" ON public.design_package_files
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.design_packages dp
    WHERE dp.id = design_package_id
    AND (dp.assigned_design_professional_id = auth.uid() OR dp.assigned_estimator_id = auth.uid())
  ));

-- Design package activity log
CREATE TABLE IF NOT EXISTS public.design_package_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_package_id uuid REFERENCES public.design_packages(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid,
  actor_role text,
  action_type text NOT NULL,
  action_details text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.design_package_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access activity_log" ON public.design_package_activity_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned users can view activity_log" ON public.design_package_activity_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.design_packages dp
    WHERE dp.id = design_package_id
    AND (dp.assigned_design_professional_id = auth.uid() OR dp.assigned_estimator_id = auth.uid())
  ));

CREATE POLICY "Assigned users can insert activity_log" ON public.design_package_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.design_packages dp
    WHERE dp.id = design_package_id
    AND (dp.assigned_design_professional_id = auth.uid() OR dp.assigned_estimator_id = auth.uid())
  ));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('design-professional-credentials', 'design-professional-credentials', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('design-professional-proposals', 'design-professional-proposals', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('design-packages', 'design-packages', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('design-package-renderings', 'design-package-renderings', false) ON CONFLICT (id) DO NOTHING;

-- Storage RLS for credentials bucket
CREATE POLICY "Users can upload own credentials" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'design-professional-credentials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own credentials" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'design-professional-credentials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins view all credentials" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'design-professional-credentials' AND public.has_role(auth.uid(), 'admin'));

-- Storage RLS for proposals bucket  
CREATE POLICY "Users can upload own proposals" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'design-professional-proposals' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own proposals" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'design-professional-proposals' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS for design-packages bucket
CREATE POLICY "Admins manage design packages files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id IN ('design-packages', 'design-package-renderings') AND public.has_role(auth.uid(), 'admin'));
