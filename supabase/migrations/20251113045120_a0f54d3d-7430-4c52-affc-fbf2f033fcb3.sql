-- ============================================================
-- PROJECTS TABLE ADDITIONS FOR COORDINATOR + PM PIPELINES
-- ============================================================

-- Add coordinator and project manager columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS coordinator_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS project_manager_id uuid REFERENCES auth.users(id);

-- Add coordinator pipeline status
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS coordinator_status text CHECK (
    coordinator_status IN (
      'pc_kickoff_needed',
      'pc_kickoff_scheduled',
      'selections_meeting',
      'scope_locked',
      'permit_prep',
      'permit_submitted',
      'permit_approved',
      'materials_ordered',
      'schedule_locked',
      'in_production',
      'punch_list',
      'complete',
      'on_hold',
      'cancelled'
    )
  );

-- Add permit and materials tracking
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS permit_status text,
  ADD COLUMN IF NOT EXISTS materials_status text;

-- Add PM pipeline status
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS pm_status text CHECK (
    pm_status IN (
      'pm_pre_construction',
      'pm_scheduled',
      'pm_mobilization',
      'pm_in_progress',
      'pm_inspection_pending',
      'pm_inspection_failed',
      'pm_inspection_passed',
      'pm_change_order_review',
      'pm_delayed',
      'pm_punch_list',
      'pm_substantial_completion',
      'pm_closed_out',
      'pm_warranty',
      'on_hold',
      'cancelled'
    )
  );

-- Add PM tracking fields
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS target_start_date date,
  ADD COLUMN IF NOT EXISTS target_completion_date date,
  ADD COLUMN IF NOT EXISTS percent_complete numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inspection_status text,
  ADD COLUMN IF NOT EXISTS change_order_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_update_at timestamptz;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_pm_status
  ON public.projects (pm_status);

CREATE INDEX IF NOT EXISTS idx_projects_coordinator_status
  ON public.projects (coordinator_status);

CREATE INDEX IF NOT EXISTS idx_projects_project_manager_id
  ON public.projects (project_manager_id);

CREATE INDEX IF NOT EXISTS idx_projects_coordinator_id
  ON public.projects (coordinator_id);

-- ============================================================
-- PROJECT DAILY LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  
  log_date date NOT NULL,
  weather text,
  crew_summary text,
  work_completed text,
  materials_delivered text,
  inspections text,
  blockers text,
  next_steps text,
  is_client_visible boolean DEFAULT true,
  uploads jsonb DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_project_daily_logs_project_id
  ON public.project_daily_logs (project_id, log_date DESC);

-- Enable RLS
ALTER TABLE public.project_daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily logs
CREATE POLICY "PMs can view logs for their projects"
  ON public.project_daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_daily_logs.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "PMs can insert logs for their projects"
  ON public.project_daily_logs FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_daily_logs.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "PMs can update their own logs"
  ON public.project_daily_logs FOR UPDATE
  USING (
    auth.uid() = created_by
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================
-- PROJECT INSPECTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  
  inspection_type text NOT NULL,
  jurisdiction text,
  inspector_name text,
  scheduled_date timestamptz,
  result text CHECK (result IN ('pending','passed','failed','cancelled')) DEFAULT 'pending',
  result_date timestamptz,
  notes text,
  required_follow_up text
);

CREATE INDEX IF NOT EXISTS idx_project_inspections_project_id
  ON public.project_inspections (project_id, scheduled_date);

-- Enable RLS
ALTER TABLE public.project_inspections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspections
CREATE POLICY "PMs can view inspections for their projects"
  ON public.project_inspections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_inspections.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "PMs can insert inspections for their projects"
  ON public.project_inspections FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_inspections.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "PMs can update inspections for their projects"
  ON public.project_inspections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_inspections.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- ============================================================
-- PROJECT CHANGE ORDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_change_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  
  co_number text,
  title text NOT NULL,
  description text NOT NULL,
  reason text,
  status text CHECK (status IN (
    'draft',
    'sent_to_client',
    'client_review',
    'client_approved',
    'client_rejected',
    'applied_to_contract'
  )) DEFAULT 'draft',
  
  price_delta numeric(12,2) DEFAULT 0,
  days_delta integer DEFAULT 0,
  client_viewed_at timestamptz,
  client_approved_at timestamptz,
  client_rejected_at timestamptz,
  notes_internal text
);

CREATE INDEX IF NOT EXISTS idx_project_change_orders_project_id
  ON public.project_change_orders (project_id);

CREATE INDEX IF NOT EXISTS idx_project_change_orders_status
  ON public.project_change_orders (status);

-- Enable RLS
ALTER TABLE public.project_change_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for change orders
CREATE POLICY "PMs can view change orders for their projects"
  ON public.project_change_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_change_orders.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "PMs can insert change orders for their projects"
  ON public.project_change_orders FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_change_orders.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "PMs can update change orders for their projects"
  ON public.project_change_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_change_orders.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- ============================================================
-- PROJECT ISSUES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  
  type text CHECK (type IN (
    'safety',
    'quality',
    'schedule_delay',
    'material',
    'subcontractor',
    'client_request',
    'other'
  )) DEFAULT 'other',
  
  severity text CHECK (severity IN ('low','medium','high','critical')) DEFAULT 'low',
  
  title text NOT NULL,
  description text NOT NULL,
  
  status text CHECK (status IN (
    'open',
    'in_progress',
    'resolved',
    'closed',
    'won_t_fix'
  )) DEFAULT 'open',
  
  owner_id uuid REFERENCES auth.users(id),
  target_resolution_date date,
  resolved_at timestamptz,
  resolution_notes text
);

CREATE INDEX IF NOT EXISTS idx_project_issues_project_id
  ON public.project_issues (project_id);

CREATE INDEX IF NOT EXISTS idx_project_issues_status
  ON public.project_issues (status);

-- Enable RLS
ALTER TABLE public.project_issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issues
CREATE POLICY "PMs can view issues for their projects"
  ON public.project_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_issues.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "PMs can insert issues for their projects"
  ON public.project_issues FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_issues.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "PMs can update issues for their projects"
  ON public.project_issues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_issues.project_id
      AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- ============================================================
-- TRIGGERS FOR AUTO-UPDATING COUNTS
-- ============================================================

-- Update change_order_count when change orders are created/deleted
CREATE OR REPLACE FUNCTION update_project_change_order_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects
    SET change_order_count = change_order_count + 1
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects
    SET change_order_count = GREATEST(change_order_count - 1, 0)
    WHERE id = OLD.project_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_project_change_order_change ON public.project_change_orders;
CREATE TRIGGER on_project_change_order_change
  AFTER INSERT OR DELETE ON public.project_change_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_project_change_order_count();

-- Update last_update_at when daily logs are added
CREATE OR REPLACE FUNCTION update_project_last_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projects
  SET last_update_at = NEW.created_at
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_daily_log_insert ON public.project_daily_logs;
CREATE TRIGGER on_daily_log_insert
  AFTER INSERT ON public.project_daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_project_last_update();