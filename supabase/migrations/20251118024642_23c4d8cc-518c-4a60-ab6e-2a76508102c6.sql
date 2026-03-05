-- Phase 14: Autonomous Operations Tables (Fixed)

-- 1. Operations run logs
CREATE TABLE IF NOT EXISTS public.operations_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL,
  auto_actions JSONB,
  risks_detected JSONB,
  tasks_completed INTEGER DEFAULT 0,
  requires_approval BOOLEAN DEFAULT true,
  approved_by UUID,
  approval_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Inspection scheduler
CREATE TABLE IF NOT EXISTS public.inspection_scheduler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  status TEXT DEFAULT 'pending',
  predicted_outcome TEXT,
  risk_level TEXT DEFAULT 'low',
  ai_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Payment milestone logs
CREATE TABLE IF NOT EXISTS public.payment_milestone_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  payment_amount DECIMAL(10,2),
  trigger_reason TEXT,
  scheduled_date DATE,
  status TEXT DEFAULT 'pending',
  auto_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Change order AI logs
CREATE TABLE IF NOT EXISTS public.change_order_ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  change_order_id UUID,
  price_change DECIMAL(10,2),
  timeline_change_days INTEGER,
  reason TEXT,
  message_homeowner TEXT,
  message_contractor TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Material ETA logs
CREATE TABLE IF NOT EXISTS public.material_eta_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  original_eta DATE,
  updated_eta DATE,
  delay_days INTEGER,
  recommended_actions JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Expand ai_agent_activity table
ALTER TABLE public.ai_agent_activity
ADD COLUMN IF NOT EXISTS automation_level TEXT,
ADD COLUMN IF NOT EXISTS autonomous_decision BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- RLS Policies
ALTER TABLE public.operations_run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_scheduler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_milestone_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_order_ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_eta_logs ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access to operations_run_logs"
  ON public.operations_run_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin full access to inspection_scheduler"
  ON public.inspection_scheduler FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin full access to payment_milestone_logs"
  ON public.payment_milestone_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin full access to change_order_ai_logs"
  ON public.change_order_ai_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin full access to material_eta_logs"
  ON public.material_eta_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
    )
  );

-- Indexes for performance
CREATE INDEX idx_operations_run_logs_project ON public.operations_run_logs(project_id);
CREATE INDEX idx_inspection_scheduler_project ON public.inspection_scheduler(project_id);
CREATE INDEX idx_payment_milestone_logs_project ON public.payment_milestone_logs(project_id);
CREATE INDEX idx_change_order_ai_logs_project ON public.change_order_ai_logs(project_id);
CREATE INDEX idx_material_eta_logs_project ON public.material_eta_logs(project_id);