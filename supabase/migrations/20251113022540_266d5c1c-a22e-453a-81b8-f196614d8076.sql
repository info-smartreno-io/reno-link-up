-- Create update timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add versioning support to contractor_email_templates
ALTER TABLE contractor_email_templates 
ADD COLUMN IF NOT EXISTS template_name TEXT NOT NULL DEFAULT 'Default Template',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create unique index to ensure only one active template per contractor
CREATE UNIQUE INDEX IF NOT EXISTS contractor_active_template_idx ON contractor_email_templates (contractor_id) WHERE is_active = true;

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_contractor_email_templates_updated_at ON contractor_email_templates;
CREATE TRIGGER update_contractor_email_templates_updated_at
  BEFORE UPDATE ON contractor_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();