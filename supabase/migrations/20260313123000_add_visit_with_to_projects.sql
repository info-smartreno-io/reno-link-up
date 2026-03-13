-- Track who the homeowner is scheduling their visit with
-- (e.g. construction agent, client success, PM, design pro)

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS visit_with TEXT;

