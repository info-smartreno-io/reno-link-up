
-- Estimate Workspaces: links a lead to the estimating workflow
CREATE TABLE public.estimate_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  estimator_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'not_started',
  field_mode_status TEXT NOT NULL DEFAULT 'not_started',
  bid_packet_status TEXT NOT NULL DEFAULT 'not_started',
  site_notes TEXT,
  general_conditions JSONB DEFAULT '{}'::jsonb,
  follow_up_tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id)
);

-- Field Mode Rooms / Areas
CREATE TABLE public.field_mode_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.estimate_workspaces(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL DEFAULT 'Untitled Area',
  dimensions JSONB DEFAULT '{}'::jsonb,
  demolition_notes TEXT,
  framing_notes TEXT,
  electrical_notes TEXT,
  plumbing_notes TEXT,
  hvac_notes TEXT,
  flooring_notes TEXT,
  cabinetry_notes TEXT,
  finish_notes TEXT,
  hidden_conditions TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bid Packets
CREATE TABLE public.bid_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.estimate_workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  scope_summary TEXT,
  estimated_budget_min NUMERIC,
  estimated_budget_max NUMERIC,
  bid_due_date DATE,
  inclusions TEXT,
  exclusions TEXT,
  allowances JSONB DEFAULT '[]'::jsonb,
  bid_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

-- Bid Packet Trade Sections
CREATE TABLE public.bid_packet_trade_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_packet_id UUID NOT NULL REFERENCES public.bid_packets(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  scope_notes TEXT,
  inclusions TEXT,
  exclusions TEXT,
  allowance_amount NUMERIC DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bid Packet Line Items
CREATE TABLE public.bid_packet_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_section_id UUID NOT NULL REFERENCES public.bid_packet_trade_sections(id) ON DELETE CASCADE,
  cost_code_id UUID REFERENCES public.cost_codes(id),
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'EA',
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estimating Files (extends blueprint_files with estimating categories)
CREATE TABLE public.estimating_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.estimate_workspaces(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.field_mode_rooms(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT 'image/jpeg',
  category TEXT NOT NULL DEFAULT 'field_photo',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estimating Internal Messages
CREATE TABLE public.estimating_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.estimate_workspaces(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.estimate_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_mode_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_packet_trade_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_packet_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimating_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimating_messages ENABLE ROW LEVEL SECURITY;

-- Admin/estimator access policies
CREATE POLICY "Admins can manage estimate_workspaces" ON public.estimate_workspaces
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can manage their workspaces" ON public.estimate_workspaces
  FOR ALL TO authenticated USING (estimator_id = auth.uid()) WITH CHECK (estimator_id = auth.uid());

CREATE POLICY "Admins can manage field_mode_rooms" ON public.field_mode_rooms
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.estimate_workspaces ew WHERE ew.id = workspace_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.estimate_workspaces ew WHERE ew.id = workspace_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  );

CREATE POLICY "Admins can manage bid_packets" ON public.bid_packets
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.estimate_workspaces ew WHERE ew.id = workspace_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.estimate_workspaces ew WHERE ew.id = workspace_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  );

CREATE POLICY "Admins can manage bid_packet_trade_sections" ON public.bid_packet_trade_sections
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.bid_packets bp JOIN public.estimate_workspaces ew ON ew.id = bp.workspace_id WHERE bp.id = bid_packet_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.bid_packets bp JOIN public.estimate_workspaces ew ON ew.id = bp.workspace_id WHERE bp.id = bid_packet_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  );

CREATE POLICY "Admins can manage bid_packet_line_items" ON public.bid_packet_line_items
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.bid_packet_trade_sections ts JOIN public.bid_packets bp ON bp.id = ts.bid_packet_id JOIN public.estimate_workspaces ew ON ew.id = bp.workspace_id WHERE ts.id = trade_section_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.bid_packet_trade_sections ts JOIN public.bid_packets bp ON bp.id = ts.bid_packet_id JOIN public.estimate_workspaces ew ON ew.id = bp.workspace_id WHERE ts.id = trade_section_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  );

CREATE POLICY "Admins can manage estimating_files" ON public.estimating_files
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.estimate_workspaces ew WHERE ew.id = workspace_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.estimate_workspaces ew WHERE ew.id = workspace_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  );

CREATE POLICY "Admins can manage estimating_messages" ON public.estimating_messages
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.estimate_workspaces ew WHERE ew.id = workspace_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.estimate_workspaces ew WHERE ew.id = workspace_id AND (has_role(auth.uid(), 'admin'::app_role) OR ew.estimator_id = auth.uid()))
  );

-- Storage bucket for estimating files
INSERT INTO storage.buckets (id, name, public) VALUES ('estimating-files', 'estimating-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for estimating files bucket
CREATE POLICY "Authenticated users can upload estimating files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'estimating-files');

CREATE POLICY "Authenticated users can view estimating files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'estimating-files');
