
-- Smart Estimate tables

CREATE TABLE IF NOT EXISTS public.smart_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.estimate_workspaces(id) ON DELETE SET NULL,
  assigned_estimator_id uuid,
  status text NOT NULL DEFAULT 'draft',
  estimate_completion_percent numeric DEFAULT 0,
  estimate_confidence_score numeric DEFAULT 0,
  ai_scope_summary text,
  ai_budget_guidance text,
  ai_missing_info_summary text,
  internal_notes text,
  review_notes text,
  generated_at timestamptz,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.smart_estimate_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_estimate_id uuid REFERENCES public.smart_estimates(id) ON DELETE CASCADE NOT NULL,
  section_key text NOT NULL,
  section_data jsonb DEFAULT '{}'::jsonb,
  completion_percent numeric DEFAULT 0,
  is_complete boolean DEFAULT false,
  ai_generated boolean DEFAULT false,
  last_edited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (smart_estimate_id, section_key)
);

CREATE TABLE IF NOT EXISTS public.smart_estimate_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_estimate_id uuid REFERENCES public.smart_estimates(id) ON DELETE CASCADE NOT NULL,
  room_name text NOT NULL,
  room_type text,
  floor_level text,
  dimensions jsonb DEFAULT '{}'::jsonb,
  square_footage numeric,
  ceiling_height numeric,
  notes text,
  photos jsonb DEFAULT '[]'::jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.smart_estimate_trade_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_estimate_id uuid REFERENCES public.smart_estimates(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES public.smart_estimate_rooms(id) ON DELETE SET NULL,
  trade_category text NOT NULL,
  line_item_name text NOT NULL,
  scope_description text,
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'EA',
  allowance_value numeric DEFAULT 0,
  labor_complexity text DEFAULT 'standard',
  material_complexity text DEFAULT 'standard',
  pricing_confidence text DEFAULT 'medium',
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.smart_estimate_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_estimate_id uuid REFERENCES public.smart_estimates(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid,
  file_url text NOT NULL,
  file_name text,
  file_category text DEFAULT 'other',
  visible_to_roles text[] DEFAULT ARRAY['admin', 'estimator'],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.smart_estimate_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_estimate_id uuid REFERENCES public.smart_estimates(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid,
  actor_role text,
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.smart_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_estimate_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_estimate_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_estimate_trade_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_estimate_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_estimate_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins full access smart_estimates" ON public.smart_estimates FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins full access smart_estimate_sections" ON public.smart_estimate_sections FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins full access smart_estimate_rooms" ON public.smart_estimate_rooms FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins full access smart_estimate_trade_items" ON public.smart_estimate_trade_items FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins full access smart_estimate_files" ON public.smart_estimate_files FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins full access smart_estimate_activity_log" ON public.smart_estimate_activity_log FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Estimator access (assigned estimates)
CREATE POLICY "Estimators access assigned smart_estimates" ON public.smart_estimates FOR ALL TO authenticated
USING (assigned_estimator_id = auth.uid());

CREATE POLICY "Estimators access sections of assigned estimates" ON public.smart_estimate_sections FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.smart_estimates se WHERE se.id = smart_estimate_id AND se.assigned_estimator_id = auth.uid()));

CREATE POLICY "Estimators access rooms of assigned estimates" ON public.smart_estimate_rooms FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.smart_estimates se WHERE se.id = smart_estimate_id AND se.assigned_estimator_id = auth.uid()));

CREATE POLICY "Estimators access trade items of assigned estimates" ON public.smart_estimate_trade_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.smart_estimates se WHERE se.id = smart_estimate_id AND se.assigned_estimator_id = auth.uid()));

CREATE POLICY "Estimators access files of assigned estimates" ON public.smart_estimate_files FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.smart_estimates se WHERE se.id = smart_estimate_id AND se.assigned_estimator_id = auth.uid()));

CREATE POLICY "Estimators view activity of assigned estimates" ON public.smart_estimate_activity_log FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.smart_estimates se WHERE se.id = smart_estimate_id AND se.assigned_estimator_id = auth.uid()));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('smart-estimate-files', 'smart-estimate-files', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('smart-estimate-photos', 'smart-estimate-photos', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Authenticated users upload smart estimate files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('smart-estimate-files', 'smart-estimate-photos'));
CREATE POLICY "Authenticated users read smart estimate files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('smart-estimate-files', 'smart-estimate-photos'));
CREATE POLICY "Authenticated users delete own smart estimate files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('smart-estimate-files', 'smart-estimate-photos') AND (storage.foldername(name))[1] = auth.uid()::text);
