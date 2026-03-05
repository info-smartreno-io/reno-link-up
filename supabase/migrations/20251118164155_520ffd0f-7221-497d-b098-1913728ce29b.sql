-- Fix lead_history_with_users view to use SECURITY INVOKER
-- This prevents the view from bypassing RLS policies

DROP VIEW IF EXISTS public.lead_history_with_users;

CREATE VIEW public.lead_history_with_users
WITH (security_invoker = true)
AS
SELECT 
  lsh.id,
  lsh.lead_id,
  lsh.from_status,
  lsh.to_status,
  lsh.changed_by,
  lsh.changed_at,
  lsh.notes,
  lsh.created_at,
  lsh.reason,
  p.full_name as changed_by_name,
  l.name as lead_name
FROM public.lead_stage_history lsh
LEFT JOIN public.profiles p ON p.id = lsh.changed_by
LEFT JOIN public.leads l ON l.id = lsh.lead_id
ORDER BY lsh.changed_at DESC;