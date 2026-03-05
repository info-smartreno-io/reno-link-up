-- Enable RLS on image_slots and image_assets tables
ALTER TABLE image_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_assets ENABLE ROW LEVEL SECURITY;

-- Allow admins to view and manage all image slots
CREATE POLICY "Admins can view all image slots"
  ON image_slots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update image slots"
  ON image_slots
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow admins to view and manage all image assets
CREATE POLICY "Admins can view all image assets"
  ON image_assets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert image assets"
  ON image_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update image assets"
  ON image_assets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow public to view approved images (for the public website)
CREATE POLICY "Public can view active slot images"
  ON image_slots
  FOR SELECT
  TO anon, authenticated
  USING (active_image_id IS NOT NULL);

CREATE POLICY "Public can view approved image assets"
  ON image_assets
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');