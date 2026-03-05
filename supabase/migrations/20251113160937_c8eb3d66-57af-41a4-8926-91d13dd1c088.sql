-- Add document_file_path column to permit_required_forms
ALTER TABLE permit_required_forms ADD COLUMN IF NOT EXISTS document_file_path text;