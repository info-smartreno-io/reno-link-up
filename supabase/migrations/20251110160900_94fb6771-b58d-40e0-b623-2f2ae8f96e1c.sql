-- Add admin review fields to architect_proposals table
ALTER TABLE architect_proposals
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- Update status enum to include 'revision_requested'
-- Note: We can't alter enum values directly, so we'll rely on text type already in place
-- The status field is already text type, so we can use any values