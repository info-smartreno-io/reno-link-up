-- Create timeline_tasks table
CREATE TABLE timeline_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES contractor_projects(id) ON DELETE CASCADE NOT NULL,
  phase_name text NOT NULL,
  start_date date,
  duration_days integer NOT NULL DEFAULT 7,
  sort_order integer NOT NULL DEFAULT 0,
  assigned_trade text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractor members can manage timeline tasks"
  ON timeline_tasks FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM contractor_projects cp
    WHERE cp.id = timeline_tasks.project_id
      AND cp.contractor_id IN (
        SELECT contractor_id FROM contractor_users WHERE user_id = auth.uid() AND is_active = true
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM contractor_projects cp
    WHERE cp.id = timeline_tasks.project_id
      AND cp.contractor_id IN (
        SELECT contractor_id FROM contractor_users WHERE user_id = auth.uid() AND is_active = true
      )
  ));

-- Create subcontractor_bids table
CREATE TABLE subcontractor_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES contractor_projects(id) ON DELETE CASCADE NOT NULL,
  subcontractor_id uuid REFERENCES subcontractors(id) ON DELETE SET NULL,
  trade text NOT NULL,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  phone text,
  email text,
  bid_amount numeric NOT NULL DEFAULT 0,
  duration text,
  notes text,
  proposal_url text,
  exclusions_url text,
  status text NOT NULL DEFAULT 'pending',
  meeting_date date,
  start_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subcontractor_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractor members can manage subcontractor bids"
  ON subcontractor_bids FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM contractor_projects cp
    WHERE cp.id = subcontractor_bids.project_id
      AND cp.contractor_id IN (
        SELECT contractor_id FROM contractor_users WHERE user_id = auth.uid() AND is_active = true
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM contractor_projects cp
    WHERE cp.id = subcontractor_bids.project_id
      AND cp.contractor_id IN (
        SELECT contractor_id FROM contractor_users WHERE user_id = auth.uid() AND is_active = true
      )
  ));