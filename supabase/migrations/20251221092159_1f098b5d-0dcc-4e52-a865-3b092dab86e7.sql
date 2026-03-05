-- =====================================================
-- AGENTIC WORKFLOW ENGINE TABLES
-- =====================================================

-- Table: agents - Defines configurable automation agents
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL, -- e.g., 'lead.status_change', 'project.created'
  trigger_conditions JSONB DEFAULT '{}', -- e.g., {"status": "intake", "project_type": ["Kitchen"]}
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER DEFAULT 10, -- Lower = higher priority
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Table: agent_actions - Actions that an agent performs in sequence
CREATE TABLE public.agent_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- e.g., 'assign_estimator', 'send_notification', 'update_status'
  action_config JSONB NOT NULL DEFAULT '{}', -- Config for the action
  sequence_order INTEGER NOT NULL DEFAULT 0,
  stop_on_failure BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: agent_runs - Execution history for agent runs
CREATE TABLE public.agent_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  trigger_source TEXT NOT NULL, -- 'leads', 'projects', etc.
  trigger_source_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  result_summary JSONB,
  triggered_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: agent_audit_logs - Detailed action-level audit logs
CREATE TABLE public.agent_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  action_id UUID REFERENCES public.agent_actions(id),
  action_type TEXT NOT NULL,
  status TEXT NOT NULL, -- success, failed, skipped
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins and contractors can manage agents
CREATE POLICY "Admins can manage agents"
ON public.agents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND role IN ('admin', 'contractor')
  )
);

CREATE POLICY "Admins can manage agent_actions"
ON public.agent_actions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND role IN ('admin', 'contractor')
  )
);

CREATE POLICY "Admins can view agent_runs"
ON public.agent_runs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND role IN ('admin', 'contractor', 'project_coordinator')
  )
);

CREATE POLICY "System can insert agent_runs"
ON public.agent_runs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update agent_runs"
ON public.agent_runs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND role IN ('admin', 'contractor')
  )
);

CREATE POLICY "Admins can view agent_audit_logs"
ON public.agent_audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND role IN ('admin', 'contractor', 'project_coordinator')
  )
);

CREATE POLICY "System can insert agent_audit_logs"
ON public.agent_audit_logs FOR INSERT
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_agents_trigger_event ON public.agents(trigger_event) WHERE is_active = true;
CREATE INDEX idx_agent_actions_agent_id ON public.agent_actions(agent_id);
CREATE INDEX idx_agent_runs_agent_id ON public.agent_runs(agent_id);
CREATE INDEX idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX idx_agent_runs_trigger ON public.agent_runs(trigger_source, trigger_source_id);
CREATE INDEX idx_agent_audit_logs_run_id ON public.agent_audit_logs(run_id);

-- Trigger to update agents.updated_at
CREATE OR REPLACE FUNCTION public.update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.update_agents_updated_at();

-- Seed initial agents
INSERT INTO public.agents (name, description, trigger_event, trigger_conditions, is_active, requires_approval, priority)
VALUES
  (
    'Lead Auto-Assignment',
    'Automatically assigns new leads to estimators based on specialty and ZIP code',
    'lead.created',
    '{"status": ["new_lead", "intake"]}',
    true,
    false,
    1
  ),
  (
    'Walkthrough Complete Processor',
    'Locks fields and queues estimate task when walkthrough is completed',
    'lead.status_change',
    '{"to_status": "walkthrough_complete"}',
    true,
    false,
    2
  ),
  (
    'RFP Creator',
    'Matches contractors and sends bid invitations when RFP is out',
    'project.status_change',
    '{"to_status": "rfp_out"}',
    true,
    true,
    3
  );

-- Seed actions for Lead Auto-Assignment agent
INSERT INTO public.agent_actions (agent_id, action_type, action_config, sequence_order)
SELECT 
  id,
  'assign_estimator',
  '{"match_by": ["specialty", "zip_code"], "fallback": "least_loaded"}',
  1
FROM public.agents WHERE name = 'Lead Auto-Assignment';

INSERT INTO public.agent_actions (agent_id, action_type, action_config, sequence_order)
SELECT 
  id,
  'send_notification',
  '{"type": "sms", "template": "estimator_assigned", "recipient": "estimator"}',
  2
FROM public.agents WHERE name = 'Lead Auto-Assignment';

INSERT INTO public.agent_actions (agent_id, action_type, action_config, sequence_order)
SELECT 
  id,
  'send_notification',
  '{"type": "email", "template": "lead_assigned_confirmation", "recipient": "homeowner"}',
  3
FROM public.agents WHERE name = 'Lead Auto-Assignment';

-- Seed actions for Walkthrough Complete agent
INSERT INTO public.agent_actions (agent_id, action_type, action_config, sequence_order)
SELECT 
  id,
  'lock_fields',
  '{"fields": ["project_type", "location", "scope_notes"]}',
  1
FROM public.agents WHERE name = 'Walkthrough Complete Processor';

INSERT INTO public.agent_actions (agent_id, action_type, action_config, sequence_order)
SELECT 
  id,
  'create_task',
  '{"task_type": "prepare_estimate", "assign_to": "estimator", "due_days": 3}',
  2
FROM public.agents WHERE name = 'Walkthrough Complete Processor';

-- Seed actions for RFP Creator agent
INSERT INTO public.agent_actions (agent_id, action_type, action_config, sequence_order)
SELECT 
  id,
  'match_contractors',
  '{"criteria": ["specialty", "rating", "availability"], "limit": 5}',
  1
FROM public.agents WHERE name = 'RFP Creator';

INSERT INTO public.agent_actions (agent_id, action_type, action_config, sequence_order)
SELECT 
  id,
  'send_bid_invitations',
  '{"deadline_days": 7, "include_scope": true}',
  2
FROM public.agents WHERE name = 'RFP Creator';