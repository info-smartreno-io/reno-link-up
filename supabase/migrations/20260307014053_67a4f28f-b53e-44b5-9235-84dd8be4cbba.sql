
CREATE TABLE admin_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_internal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage notes" ON admin_internal_notes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));
