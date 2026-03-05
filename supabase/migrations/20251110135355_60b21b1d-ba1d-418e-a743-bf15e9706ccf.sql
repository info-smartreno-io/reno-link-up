-- Create architect_projects table
CREATE TABLE architect_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  architect_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT NOT NULL,
  project_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  estimated_value NUMERIC,
  square_footage INTEGER,
  deadline DATE,
  lead_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE architect_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Architects can view their own projects"
ON architect_projects
FOR SELECT
USING (auth.uid() = architect_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Architects can insert their own projects"
ON architect_projects
FOR INSERT
WITH CHECK (auth.uid() = architect_id);

CREATE POLICY "Architects can update their own projects"
ON architect_projects
FOR UPDATE
USING (auth.uid() = architect_id OR has_role(auth.uid(), 'admin'::app_role));

-- Create architect_proposals table
CREATE TABLE architect_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  architect_id UUID NOT NULL,
  project_id UUID REFERENCES architect_projects(id) ON DELETE CASCADE,
  proposal_amount NUMERIC NOT NULL,
  design_phase TEXT NOT NULL,
  estimated_timeline TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE architect_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Architects can view their own proposals"
ON architect_proposals
FOR SELECT
USING (auth.uid() = architect_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Architects can insert their own proposals"
ON architect_proposals
FOR INSERT
WITH CHECK (auth.uid() = architect_id);

CREATE POLICY "Architects can update their own proposals"
ON architect_proposals
FOR UPDATE
USING (auth.uid() = architect_id OR has_role(auth.uid(), 'admin'::app_role));

-- Add indexes
CREATE INDEX idx_architect_projects_architect_id ON architect_projects(architect_id);
CREATE INDEX idx_architect_proposals_architect_id ON architect_proposals(architect_id);
CREATE INDEX idx_architect_proposals_project_id ON architect_proposals(project_id);