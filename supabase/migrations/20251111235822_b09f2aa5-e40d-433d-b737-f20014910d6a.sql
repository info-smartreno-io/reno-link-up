-- Create team_members table for foremen and other crew
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('foreman', 'crew_member', 'supervisor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'invited')),
  invitation_sent_at TIMESTAMPTZ,
  invitation_accepted_at TIMESTAMPTZ,
  skills TEXT[],
  certifications TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subcontractors table
CREATE TABLE public.subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  trade TEXT NOT NULL,
  license_number TEXT,
  insurance_verified BOOLEAN DEFAULT false,
  insurance_expiry DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'invited')),
  rating NUMERIC,
  projects_completed INTEGER DEFAULT 0,
  invitation_sent_at TIMESTAMPTZ,
  invitation_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create project_assignments for team members and subcontractors
CREATE TABLE public.project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id),
  assigned_type TEXT NOT NULL CHECK (assigned_type IN ('team_member', 'subcontractor')),
  team_member_id UUID REFERENCES public.team_members(id),
  subcontractor_id UUID REFERENCES public.subcontractors(id),
  role_on_project TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'active', 'completed', 'removed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assignment_type_check CHECK (
    (assigned_type = 'team_member' AND team_member_id IS NOT NULL AND subcontractor_id IS NULL) OR
    (assigned_type = 'subcontractor' AND subcontractor_id IS NOT NULL AND team_member_id IS NULL)
  )
);

-- Create invitations table for tracking invitation links
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES auth.users(id),
  invitation_type TEXT NOT NULL CHECK (invitation_type IN ('foreman', 'team_member', 'subcontractor')),
  team_member_id UUID REFERENCES public.team_members(id),
  subcontractor_id UUID REFERENCES public.subcontractors(id),
  email TEXT,
  phone TEXT,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_team_members_contractor ON public.team_members(contractor_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_status ON public.team_members(status);

CREATE INDEX idx_subcontractors_contractor ON public.subcontractors(contractor_id);
CREATE INDEX idx_subcontractors_user ON public.subcontractors(user_id);
CREATE INDEX idx_subcontractors_status ON public.subcontractors(status);
CREATE INDEX idx_subcontractors_trade ON public.subcontractors(trade);

CREATE INDEX idx_project_assignments_project ON public.project_assignments(project_id);
CREATE INDEX idx_project_assignments_team_member ON public.project_assignments(team_member_id);
CREATE INDEX idx_project_assignments_subcontractor ON public.project_assignments(subcontractor_id);

CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_expires ON public.invitations(expires_at);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
CREATE POLICY "Contractors can manage their team members"
  ON public.team_members FOR ALL
  USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view their own record"
  ON public.team_members FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for subcontractors
CREATE POLICY "Contractors can manage their subcontractors"
  ON public.subcontractors FOR ALL
  USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Subcontractors can view their own record"
  ON public.subcontractors FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for project_assignments
CREATE POLICY "Contractors can manage project assignments"
  ON public.project_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contractor_projects
      WHERE contractor_projects.id = project_assignments.project_id
      AND contractor_projects.contractor_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Team members can view their assignments"
  ON public.project_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = project_assignments.team_member_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Subcontractors can view their assignments"
  ON public.project_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subcontractors
      WHERE subcontractors.id = project_assignments.subcontractor_id
      AND subcontractors.user_id = auth.uid()
    )
  );

-- RLS Policies for invitations
CREATE POLICY "Contractors can manage invitations"
  ON public.invitations FOR ALL
  USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_members_timestamp
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

CREATE OR REPLACE FUNCTION update_subcontractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subcontractors_timestamp
  BEFORE UPDATE ON public.subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION update_subcontractors_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subcontractors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_assignments;