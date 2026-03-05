-- Create project_events table for tracking contact logs, status changes, and activity
CREATE TABLE public.project_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'contact', 'status_change', 'note', 'milestone', 'document'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Contractors can view their project events"
  ON public.project_events FOR SELECT
  USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can insert their project events"
  ON public.project_events FOR INSERT
  WITH CHECK (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can update their project events"
  ON public.project_events FOR UPDATE
  USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can delete their project events"
  ON public.project_events FOR DELETE
  USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Create the v_contractor_projects view for the project management page
CREATE OR REPLACE VIEW public.v_contractor_projects AS
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

-- Add sample project events for demo data
INSERT INTO public.project_events (project_id, contractor_id, event_type, title, description, created_at)
SELECT 
  cp.id,
  cp.contractor_id,
  'contact',
  'Initial client consultation',
  'Discussed project scope and timeline',
  cp.created_at + INTERVAL '1 day'
FROM public.contractor_projects cp
WHERE cp.contractor_id = 'a910846b-1eec-4eca-959a-1997f224cb44';

INSERT INTO public.project_events (project_id, contractor_id, event_type, title, description, created_at)
SELECT 
  cp.id,
  cp.contractor_id,
  'contact',
  'Follow-up call',
  'Confirmed material selections',
  cp.created_at + INTERVAL '5 days'
FROM public.contractor_projects cp
WHERE cp.contractor_id = 'a910846b-1eec-4eca-959a-1997f224cb44'
AND cp.status IN ('in_progress', 'planning');

-- Add sample bid opportunities
INSERT INTO public.bid_opportunities (title, description, project_type, location, estimated_budget, bid_deadline, created_by, open_to_contractors, status)
VALUES
  ('Kitchen Renovation - Summit', 'Complete kitchen remodel including cabinets, countertops, and appliances', 'kitchen_remodel', 'Summit, NJ 07901', 85000, NOW() + INTERVAL '14 days', 'a910846b-1eec-4eca-959a-1997f224cb44', true, 'open'),
  ('Basement Finishing', 'Finish 1200 sqft basement with bathroom and wet bar', 'basement', 'Westfield, NJ 07090', 65000, NOW() + INTERVAL '10 days', 'a910846b-1eec-4eca-959a-1997f224cb44', true, 'open'),
  ('Master Bath Upgrade', 'Luxury master bathroom renovation with walk-in shower', 'bathroom_remodel', 'Chatham, NJ 07928', 45000, NOW() + INTERVAL '7 days', 'a910846b-1eec-4eca-959a-1997f224cb44', true, 'open'),
  ('Home Addition - 2nd Floor', 'Add 600 sqft second floor addition with 2 bedrooms', 'addition', 'Madison, NJ 07940', 150000, NOW() + INTERVAL '21 days', 'a910846b-1eec-4eca-959a-1997f224cb44', true, 'open'),
  ('Deck Replacement', 'Replace existing 400 sqft deck with composite decking', 'outdoor', 'Millburn, NJ 07041', 28000, NOW() + INTERVAL '5 days', 'a910846b-1eec-4eca-959a-1997f224cb44', true, 'open');