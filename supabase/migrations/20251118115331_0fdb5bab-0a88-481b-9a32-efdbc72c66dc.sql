-- Make sensitive buckets private
UPDATE storage.buckets
SET public = false
WHERE id IN ('applications', 'message-attachments', 'blueprints', 'architect-proposals');