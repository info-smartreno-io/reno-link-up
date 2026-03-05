-- Create municipality_permit_timelines table for tracking average review times
CREATE TABLE IF NOT EXISTS municipality_permit_timelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL DEFAULT 'NJ',
  municipality text NOT NULL,
  stage text NOT NULL,
  average_days integer NOT NULL,
  min_days integer,
  max_days integer,
  notes text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(state, municipality, stage)
);

CREATE INDEX IF NOT EXISTS municipality_permit_timelines_lookup_idx 
  ON municipality_permit_timelines(state, municipality);

-- Enable RLS
ALTER TABLE municipality_permit_timelines ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view municipality timelines"
  ON municipality_permit_timelines FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage municipality timelines"
  ON municipality_permit_timelines FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed NJ municipality data with typical review times
INSERT INTO municipality_permit_timelines (state, municipality, stage, average_days, min_days, max_days, notes) VALUES
  -- Bergen County municipalities
  ('NJ', 'Ridgewood', 'zoning_review', 14, 10, 21, 'Zoning board reviews residential projects'),
  ('NJ', 'Ridgewood', 'permit_review', 10, 7, 14, 'Building department UCC review'),
  ('NJ', 'Ridgewood', 'plan_approval', 5, 3, 7, 'Final plan approval and permit issuance'),
  
  ('NJ', 'Paramus', 'zoning_review', 21, 14, 30, 'Zoning review can take longer for commercial'),
  ('NJ', 'Paramus', 'permit_review', 14, 10, 21, 'Building department review'),
  ('NJ', 'Paramus', 'plan_approval', 7, 5, 10, 'Final approval'),
  
  -- Hudson County municipalities
  ('NJ', 'Jersey City', 'zoning_review', 21, 14, 30, 'Urban zoning reviews'),
  ('NJ', 'Jersey City', 'permit_review', 14, 10, 21, 'Building department review'),
  ('NJ', 'Jersey City', 'plan_approval', 7, 5, 14, 'Final approval'),
  
  ('NJ', 'Hoboken', 'zoning_review', 14, 10, 21, 'Historic district considerations'),
  ('NJ', 'Hoboken', 'permit_review', 10, 7, 14, 'Building department review'),
  ('NJ', 'Hoboken', 'plan_approval', 5, 3, 7, 'Final approval'),
  
  -- Morris County municipalities
  ('NJ', 'Morristown', 'zoning_review', 14, 10, 21, 'Zoning board review'),
  ('NJ', 'Morristown', 'permit_review', 10, 7, 14, 'Building department review'),
  ('NJ', 'Morristown', 'plan_approval', 5, 3, 7, 'Final approval'),
  
  -- Essex County municipalities
  ('NJ', 'Montclair', 'zoning_review', 14, 10, 21, 'Zoning review'),
  ('NJ', 'Montclair', 'permit_review', 10, 7, 14, 'Building department review'),
  ('NJ', 'Montclair', 'plan_approval', 5, 3, 7, 'Final approval'),
  
  -- Passaic County municipalities
  ('NJ', 'Wayne', 'zoning_review', 14, 10, 21, 'Zoning review'),
  ('NJ', 'Wayne', 'permit_review', 10, 7, 14, 'Building department review'),
  ('NJ', 'Wayne', 'plan_approval', 5, 3, 7, 'Final approval'),
  
  -- Default NJ timelines (used when specific municipality not found)
  ('NJ', 'DEFAULT', 'zoning_review', 14, 10, 21, 'Typical NJ zoning review time'),
  ('NJ', 'DEFAULT', 'permit_review', 10, 7, 14, 'Typical NJ building permit review'),
  ('NJ', 'DEFAULT', 'plan_approval', 7, 5, 10, 'Typical NJ final approval time')
ON CONFLICT (state, municipality, stage) DO NOTHING;

-- Add timeline tracking columns to permits table
ALTER TABLE permits ADD COLUMN IF NOT EXISTS zoning_submitted_at timestamptz;
ALTER TABLE permits ADD COLUMN IF NOT EXISTS zoning_approved_at timestamptz;
ALTER TABLE permits ADD COLUMN IF NOT EXISTS ucc_submitted_at timestamptz;
ALTER TABLE permits ADD COLUMN IF NOT EXISTS ucc_approved_at timestamptz;
ALTER TABLE permits ADD COLUMN IF NOT EXISTS estimated_approval_date date;

-- Function to calculate estimated approval date
CREATE OR REPLACE FUNCTION calculate_permit_approval_date(
  p_permit_id uuid
)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_municipality text;
  v_state text;
  v_status text;
  v_submitted_date date;
  v_total_days integer := 0;
  v_zoning_days integer;
  v_permit_days integer;
  v_approval_days integer;
BEGIN
  -- Get permit details
  SELECT 
    jurisdiction_municipality,
    jurisdiction_state,
    status,
    COALESCE(applied_at, created_at)::date
  INTO v_municipality, v_state, v_status, v_submitted_date
  FROM permits
  WHERE id = p_permit_id;
  
  -- Get timeline estimates for this municipality
  SELECT 
    COALESCE(
      (SELECT average_days FROM municipality_permit_timelines 
       WHERE state = v_state AND municipality = v_municipality AND stage = 'zoning_review'),
      (SELECT average_days FROM municipality_permit_timelines 
       WHERE state = v_state AND municipality = 'DEFAULT' AND stage = 'zoning_review'),
      14
    ),
    COALESCE(
      (SELECT average_days FROM municipality_permit_timelines 
       WHERE state = v_state AND municipality = v_municipality AND stage = 'permit_review'),
      (SELECT average_days FROM municipality_permit_timelines 
       WHERE state = v_state AND municipality = 'DEFAULT' AND stage = 'permit_review'),
      10
    ),
    COALESCE(
      (SELECT average_days FROM municipality_permit_timelines 
       WHERE state = v_state AND municipality = v_municipality AND stage = 'plan_approval'),
      (SELECT average_days FROM municipality_permit_timelines 
       WHERE state = v_state AND municipality = 'DEFAULT' AND stage = 'plan_approval'),
      7
    )
  INTO v_zoning_days, v_permit_days, v_approval_days;
  
  -- Calculate total based on current status
  CASE v_status
    WHEN 'draft' THEN
      v_total_days := v_zoning_days + v_permit_days + v_approval_days;
    WHEN 'zoning_pending' THEN
      v_total_days := v_zoning_days + v_permit_days + v_approval_days;
    WHEN 'ucc_pending', 'submitted' THEN
      v_total_days := v_permit_days + v_approval_days;
    WHEN 'revisions_required' THEN
      v_total_days := 7 + v_permit_days; -- Add 7 days for revisions
    ELSE
      v_total_days := 0;
  END CASE;
  
  RETURN v_submitted_date + v_total_days;
END;
$$;

-- Add comments
COMMENT ON TABLE municipality_permit_timelines IS 'Stores average permit review times by municipality and stage';
COMMENT ON FUNCTION calculate_permit_approval_date IS 'Calculates estimated approval date based on municipality timelines';
