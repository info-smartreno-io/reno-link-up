-- Create permits table
CREATE TABLE permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  jurisdiction_state TEXT NOT NULL,
  jurisdiction_municipality TEXT NOT NULL,
  requires_permit BOOLEAN NOT NULL DEFAULT true,
  permit_number TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  applied_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX permits_project_id_idx ON permits(project_id);
CREATE INDEX permits_status_idx ON permits(status);

-- Enable RLS
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;

-- Permits policies
CREATE POLICY "Estimators and admins can view permits"
  ON permits FOR SELECT
  USING (
    has_role(auth.uid(), 'estimator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'project_coordinator'::app_role)
  );

CREATE POLICY "Estimators and admins can insert permits"
  ON permits FOR INSERT
  WITH CHECK (
    (auth.uid() = created_by) AND (
      has_role(auth.uid(), 'estimator'::app_role) OR 
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  );

CREATE POLICY "Estimators and admins can update permits"
  ON permits FOR UPDATE
  USING (
    has_role(auth.uid(), 'estimator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'project_coordinator'::app_role)
  );

-- Create permit_required_forms table
CREATE TABLE permit_required_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID NOT NULL REFERENCES permits(id) ON DELETE CASCADE,
  form_code TEXT NOT NULL,
  form_name TEXT NOT NULL,
  authority TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'not_started',
  auto_filled BOOLEAN NOT NULL DEFAULT false,
  document_file_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX permit_required_forms_permit_idx ON permit_required_forms(permit_id);
CREATE INDEX permit_required_forms_form_code_idx ON permit_required_forms(form_code);

-- Enable RLS
ALTER TABLE permit_required_forms ENABLE ROW LEVEL SECURITY;

-- Permit forms policies
CREATE POLICY "Estimators and admins can view permit forms"
  ON permit_required_forms FOR SELECT
  USING (
    has_role(auth.uid(), 'estimator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'project_coordinator'::app_role)
  );

CREATE POLICY "Estimators and admins can insert permit forms"
  ON permit_required_forms FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'estimator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'project_coordinator'::app_role)
  );

CREATE POLICY "Estimators and admins can update permit forms"
  ON permit_required_forms FOR UPDATE
  USING (
    has_role(auth.uid(), 'estimator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'project_coordinator'::app_role)
  );

-- Create permit_form_rules table
CREATE TABLE permit_form_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  municipality TEXT,
  scope_tags TEXT[] NOT NULL,
  required_form_codes TEXT[] NOT NULL,
  optional_form_codes TEXT[] DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX permit_form_rules_state_idx ON permit_form_rules(state);
CREATE INDEX permit_form_rules_municipality_idx ON permit_form_rules(municipality);

-- Enable RLS
ALTER TABLE permit_form_rules ENABLE ROW LEVEL SECURITY;

-- Permit form rules policies (admin only for configuration)
CREATE POLICY "Admins can manage permit form rules"
  ON permit_form_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can view permit form rules"
  ON permit_form_rules FOR SELECT
  USING (
    has_role(auth.uid(), 'estimator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'project_coordinator'::app_role)
  );

-- Seed NJ permit form rules
INSERT INTO permit_form_rules (state, municipality, scope_tags, required_form_codes, notes) VALUES
  ('NJ', NULL, ARRAY['structural', 'addition', 'interior_remodel'], ARRAY['ZONING_LOCAL', 'UCC-F100', 'UCC-F110'], 'Structural work, additions, and interior remodels'),
  ('NJ', NULL, ARRAY['electrical'], ARRAY['ZONING_LOCAL', 'UCC-F100', 'UCC-F120'], 'Electrical work'),
  ('NJ', NULL, ARRAY['plumbing'], ARRAY['ZONING_LOCAL', 'UCC-F100', 'UCC-F130'], 'Plumbing work'),
  ('NJ', NULL, ARRAY['mechanical', 'hvac'], ARRAY['ZONING_LOCAL', 'UCC-F100', 'UCC-F145'], 'Mechanical and HVAC work'),
  ('NJ', NULL, ARRAY['fire_protection'], ARRAY['ZONING_LOCAL', 'UCC-F100', 'UCC-F140'], 'Fire protection systems'),
  ('NJ', NULL, ARRAY['roofing', 'siding', 'windows'], ARRAY['ZONING_LOCAL', 'UCC-F100', 'UCC-F110'], 'Roofing, siding, and window work');

-- Create storage bucket for permit documents
INSERT INTO storage.buckets (id, name, public) VALUES ('permit-documents', 'permit-documents', false);

-- Storage policies for permit documents
CREATE POLICY "Authenticated users can view permit documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'permit-documents' AND
    (has_role(auth.uid(), 'estimator'::app_role) OR 
     has_role(auth.uid(), 'admin'::app_role) OR
     has_role(auth.uid(), 'project_coordinator'::app_role))
  );

CREATE POLICY "Estimators and admins can upload permit documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'permit-documents' AND
    (has_role(auth.uid(), 'estimator'::app_role) OR 
     has_role(auth.uid(), 'admin'::app_role) OR
     has_role(auth.uid(), 'project_coordinator'::app_role))
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_permits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_permits_timestamp
  BEFORE UPDATE ON permits
  FOR EACH ROW
  EXECUTE FUNCTION update_permits_updated_at();

CREATE TRIGGER update_permit_required_forms_timestamp
  BEFORE UPDATE ON permit_required_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_permits_updated_at();

CREATE TRIGGER update_permit_form_rules_timestamp
  BEFORE UPDATE ON permit_form_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_permits_updated_at();