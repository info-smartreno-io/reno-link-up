-- =============================================
-- PROJECT COORDINATOR PORTAL SCHEMA UPDATES
-- =============================================

-- Add PC-specific columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS pc_assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pc_readonly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS build_ready_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deposit_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS final_plans_complete_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS final_scope_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS zoning_prepared_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS permit_prepared_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subs_awarded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS budget_finalized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS materials_ordered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pm_approved_start_at TIMESTAMPTZ;

-- =============================================
-- BUILD GATES TABLE - Track readiness gates
-- =============================================
CREATE TABLE IF NOT EXISTS public.build_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  gate_type TEXT NOT NULL, -- 'contract_signed', 'deposit_received', 'final_plans', 'scope_approved', 'zoning_prepared', 'permit_prepared', 'subs_awarded', 'budget_finalized', 'materials_ordered'
  gate_name TEXT NOT NULL,
  owner TEXT NOT NULL, -- 'financing', 'estimator', 'homeowner', 'pc', 'pm'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked'
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, gate_type)
);

-- Enable RLS
ALTER TABLE public.build_gates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for build_gates
CREATE POLICY "PC and admins can view build gates"
  ON public.build_gates FOR SELECT
  USING (
    has_role(auth.uid(), 'project_coordinator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'contractor'::app_role)
  );

CREATE POLICY "PC and admins can insert build gates"
  ON public.build_gates FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'project_coordinator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "PC and admins can update build gates"
  ON public.build_gates FOR UPDATE
  USING (
    has_role(auth.uid(), 'project_coordinator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- =============================================
-- SUB BID PACKAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.sub_bid_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  trade TEXT NOT NULL, -- 'exterior', 'mechanicals', 'interior', 'electrical', 'plumbing', 'hvac', 'framing', 'roofing'
  description TEXT,
  budget_amount NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'not_sent', -- 'not_sent', 'sent', 'bids_received', 'awarded'
  sent_at TIMESTAMPTZ,
  sent_by UUID,
  due_date DATE,
  bid_count INTEGER DEFAULT 0,
  awarded_sub_id UUID,
  awarded_amount NUMERIC(12,2),
  awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sub_bid_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "PC and admins can manage sub bid packages"
  ON public.sub_bid_packages FOR ALL
  USING (
    has_role(auth.uid(), 'project_coordinator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'contractor'::app_role)
  );

-- =============================================
-- SUB BID RESPONSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.sub_bid_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.sub_bid_packages(id) ON DELETE CASCADE,
  subcontractor_id UUID REFERENCES public.subcontractors(id),
  subcontractor_name TEXT NOT NULL,
  bid_amount NUMERIC(12,2) NOT NULL,
  timeline_weeks INTEGER,
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted', -- 'submitted', 'under_review', 'selected', 'rejected'
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sub_bid_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PC and admins can manage sub bid responses"
  ON public.sub_bid_responses FOR ALL
  USING (
    has_role(auth.uid(), 'project_coordinator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'contractor'::app_role)
  );

-- =============================================
-- PC BUDGET CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.pc_budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'framing', 'hvac', 'electrical', 'plumbing', 'roofing', 'exterior', 'interior', 'materials', 'labor', 'permits'
  budget_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  awarded_amount NUMERIC(12,2) DEFAULT 0,
  variance NUMERIC(12,2) GENERATED ALWAYS AS (awarded_amount - budget_amount) STORED,
  notes TEXT,
  flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, category)
);

-- Enable RLS
ALTER TABLE public.pc_budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PC and admins can manage budget categories"
  ON public.pc_budget_categories FOR ALL
  USING (
    has_role(auth.uid(), 'project_coordinator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'contractor'::app_role)
  );

-- =============================================
-- PC START DATE REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.pc_start_date_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  proposed_start_date DATE NOT NULL,
  proposed_by UUID NOT NULL,
  proposed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pm_approved BOOLEAN,
  pm_approved_by UUID,
  pm_approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pc_start_date_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PC and PM can manage start date requests"
  ON public.pc_start_date_requests FOR ALL
  USING (
    has_role(auth.uid(), 'project_coordinator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'contractor'::app_role)
  );

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_build_gates_project ON public.build_gates(project_id);
CREATE INDEX IF NOT EXISTS idx_sub_bid_packages_project ON public.sub_bid_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_sub_bid_responses_package ON public.sub_bid_responses(package_id);
CREATE INDEX IF NOT EXISTS idx_pc_budget_categories_project ON public.pc_budget_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_pc_start_date_requests_project ON public.pc_start_date_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_coordinator ON public.projects(coordinator_id);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_build_gates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_build_gates_timestamp
  BEFORE UPDATE ON public.build_gates
  FOR EACH ROW EXECUTE FUNCTION public.update_build_gates_updated_at();

CREATE TRIGGER update_sub_bid_packages_timestamp
  BEFORE UPDATE ON public.sub_bid_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_build_gates_updated_at();

CREATE TRIGGER update_pc_budget_categories_timestamp
  BEFORE UPDATE ON public.pc_budget_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_build_gates_updated_at();