-- AI Error Log Analyzer Tables

-- Reports table: stores each analysis run
CREATE TABLE IF NOT EXISTS public.ai_error_log_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  total_errors_found INTEGER DEFAULT 0,
  critical_errors INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  grouped_errors_count INTEGER DEFAULT 0,
  time_range_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Error groups table: stores grouped errors with AI analysis
CREATE TABLE IF NOT EXISTS public.ai_error_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.ai_error_log_reports(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  error_signature TEXT NOT NULL,
  error_message TEXT NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'ignored')),
  ai_analysis TEXT,
  suggested_fix TEXT,
  fix_confidence DECIMAL(3,2),
  affected_functions TEXT[],
  affected_tables TEXT[],
  stack_trace TEXT,
  sample_log_entries JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- Error actions table: track fix attempts
CREATE TABLE IF NOT EXISTS public.ai_error_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_group_id UUID REFERENCES public.ai_error_groups(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('auto_fix_attempted', 'manual_fix', 'ignored', 'monitoring', 'escalated')),
  action_description TEXT,
  taken_by TEXT,
  taken_at TIMESTAMPTZ DEFAULT now(),
  result TEXT,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.ai_error_log_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_error_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_error_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
CREATE POLICY "Admin full access to error log reports"
  ON public.ai_error_log_reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access to error groups"
  ON public.ai_error_groups
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access to error actions"
  ON public.ai_error_actions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_error_groups_report_id ON public.ai_error_groups(report_id);
CREATE INDEX idx_error_groups_severity ON public.ai_error_groups(severity);
CREATE INDEX idx_error_groups_status ON public.ai_error_groups(status);
CREATE INDEX idx_error_groups_error_type ON public.ai_error_groups(error_type);
CREATE INDEX idx_error_groups_last_seen ON public.ai_error_groups(last_seen DESC);
CREATE INDEX idx_error_actions_error_group_id ON public.ai_error_actions(error_group_id);