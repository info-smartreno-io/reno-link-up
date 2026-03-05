-- Add version tracking columns to blueprint_files
ALTER TABLE public.blueprint_files
ADD COLUMN version integer NOT NULL DEFAULT 1,
ADD COLUMN parent_blueprint_id uuid REFERENCES blueprint_files(id) ON DELETE SET NULL,
ADD COLUMN is_latest boolean NOT NULL DEFAULT true,
ADD COLUMN version_notes text;

-- Create index for version queries
CREATE INDEX idx_blueprint_files_parent_id ON blueprint_files(parent_blueprint_id);
CREATE INDEX idx_blueprint_files_is_latest ON blueprint_files(is_latest);

-- Function to mark previous versions as not latest when new version is uploaded
CREATE OR REPLACE FUNCTION public.update_blueprint_versions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is a new version (has a parent), mark all previous versions as not latest
  IF NEW.parent_blueprint_id IS NOT NULL THEN
    UPDATE blueprint_files
    SET is_latest = false
    WHERE id = NEW.parent_blueprint_id 
       OR parent_blueprint_id = NEW.parent_blueprint_id
       AND is_latest = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update version flags
CREATE TRIGGER trigger_update_blueprint_versions
BEFORE INSERT ON blueprint_files
FOR EACH ROW
EXECUTE FUNCTION update_blueprint_versions();

-- Add a view to easily get blueprint families (all versions grouped)
CREATE OR REPLACE VIEW blueprint_families AS
SELECT 
  COALESCE(bf.parent_blueprint_id, bf.id) as family_id,
  bf.id,
  bf.project_id,
  bf.file_name,
  bf.file_path,
  bf.file_size,
  bf.file_type,
  bf.version,
  bf.is_latest,
  bf.version_notes,
  bf.description,
  bf.uploaded_by,
  bf.created_at,
  bf.updated_at,
  (
    SELECT COUNT(*) 
    FROM blueprint_files bf2 
    WHERE bf2.parent_blueprint_id = COALESCE(bf.parent_blueprint_id, bf.id)
       OR bf2.id = COALESCE(bf.parent_blueprint_id, bf.id)
  ) as total_versions
FROM blueprint_files bf;

-- Grant select on the view
GRANT SELECT ON blueprint_families TO authenticated;