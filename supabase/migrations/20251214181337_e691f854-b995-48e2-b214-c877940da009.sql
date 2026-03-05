-- Fix security definer view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.v_contractor_projects;

CREATE VIEW public.v_contractor_projects
WITH (security_invoker = on) AS
SELECT 
  cp.id,
  cp.project_name AS name,
  cp.location AS address,
  COALESCE(cp.status, 'new') AS workflow_status,
  cp.estimated_value AS budget_estimate,
  cp.contractor_id,
  'primary' AS contractor_role,
  (
    SELECT pe.created_at 
    FROM public.project_events pe 
    WHERE pe.project_id = cp.id AND pe.event_type = 'contact'
    ORDER BY pe.created_at DESC 
    LIMIT 1
  ) AS last_contact_at,
  (
    SELECT 1
    FROM public.project_milestones pm 
    WHERE pm.project_id = cp.id AND pm.completed = false
    ORDER BY pm.milestone_date ASC 
    LIMIT 1
  ) AS next_action_id,
  (
    SELECT pm.milestone_name 
    FROM public.project_milestones pm 
    WHERE pm.project_id = cp.id AND pm.completed = false
    ORDER BY pm.milestone_date ASC 
    LIMIT 1
  ) AS next_step_title,
  (
    SELECT pm.milestone_date::text 
    FROM public.project_milestones pm 
    WHERE pm.project_id = cp.id AND pm.completed = false
    ORDER BY pm.milestone_date ASC 
    LIMIT 1
  ) AS next_step_due_at,
  (
    SELECT 
      CASE 
        WHEN pm.milestone_date < CURRENT_DATE THEN 'overdue'
        WHEN pm.milestone_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'due_soon'
        ELSE 'on_track'
      END
    FROM public.project_milestones pm 
    WHERE pm.project_id = cp.id AND pm.completed = false
    ORDER BY pm.milestone_date ASC 
    LIMIT 1
  ) AS next_step_status,
  cp.created_at,
  cp.updated_at
FROM public.contractor_projects cp;

-- Grant access to the view
GRANT SELECT ON public.v_contractor_projects TO authenticated;