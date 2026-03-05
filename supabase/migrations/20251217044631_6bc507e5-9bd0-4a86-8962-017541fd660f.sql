-- Add new columns to leads table for estimator workflow
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS blocker_type TEXT,
ADD COLUMN IF NOT EXISTS next_action TEXT,
ADD COLUMN IF NOT EXISTS next_action_date DATE,
ADD COLUMN IF NOT EXISTS sale_outcome TEXT,
ADD COLUMN IF NOT EXISTS sale_outcome_reason TEXT,
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimator_readonly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new_lead';

-- Create estimator_tasks table for task checklist
CREATE TABLE public.estimator_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  task_type TEXT NOT NULL,
  task_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  required_for_gate BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create proposals table
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  estimator_id UUID NOT NULL,
  amount DECIMAL(12,2),
  status TEXT DEFAULT 'draft',
  current_version INTEGER DEFAULT 1,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create proposal_versions table
CREATE TABLE public.proposal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  line_items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  revision_reason TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create blockers table
CREATE TABLE public.blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  blocker_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_by UUID NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.estimator_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;

-- RLS policies for estimator_tasks
CREATE POLICY "Estimators can view tasks for their leads" ON public.estimator_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.leads WHERE leads.id = estimator_tasks.lead_id AND leads.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'estimator'::app_role)
  );

CREATE POLICY "Estimators can insert tasks" ON public.estimator_tasks
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Estimators can update tasks" ON public.estimator_tasks
  FOR UPDATE USING (
    has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS policies for proposals
CREATE POLICY "Estimators can view proposals" ON public.proposals
  FOR SELECT USING (
    estimator_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'estimator'::app_role)
  );

CREATE POLICY "Estimators can insert proposals" ON public.proposals
  FOR INSERT WITH CHECK (
    estimator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Estimators can update proposals" ON public.proposals
  FOR UPDATE USING (
    estimator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS policies for proposal_versions
CREATE POLICY "Estimators can view proposal versions" ON public.proposal_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_versions.proposal_id AND (proposals.estimator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'estimator'::app_role)))
  );

CREATE POLICY "Estimators can insert proposal versions" ON public.proposal_versions
  FOR INSERT WITH CHECK (
    created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS policies for blockers
CREATE POLICY "Estimators can view blockers" ON public.blockers
  FOR SELECT USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'estimator'::app_role)
  );

CREATE POLICY "Estimators can insert blockers" ON public.blockers
  FOR INSERT WITH CHECK (
    created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Estimators can update blockers" ON public.blockers
  FOR UPDATE USING (
    created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_estimator_tasks_lead_id ON public.estimator_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_estimator_id ON public.proposals(estimator_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id ON public.proposal_versions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_blockers_lead_id ON public.blockers(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_blocker_type ON public.leads(blocker_type);
CREATE INDEX IF NOT EXISTS idx_leads_next_action_date ON public.leads(next_action_date);