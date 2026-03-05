-- Drop the problematic view
DROP VIEW IF EXISTS blueprint_families;

-- Recreate the view without SECURITY DEFINER (use default SECURITY INVOKER)
CREATE VIEW blueprint_families 
WITH (security_invoker = true)
AS
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