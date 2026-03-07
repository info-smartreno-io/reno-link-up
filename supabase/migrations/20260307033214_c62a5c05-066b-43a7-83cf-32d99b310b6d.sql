-- Fix: Remove overly permissive anon SELECT on subcontractor_bids
DROP POLICY IF EXISTS "Public can read submitted bids" ON public.subcontractor_bids;

-- Fix: Tighten the anon INSERT policy to only allow inserts with valid project_id
DROP POLICY IF EXISTS "Public can submit subcontractor bids" ON public.subcontractor_bids;
DROP POLICY IF EXISTS "Public can insert sub bids via invite link" ON public.subcontractor_bids;

-- Re-create anon insert with basic validation (project must exist)
CREATE POLICY "Anon can submit sub bids for valid projects"
  ON public.subcontractor_bids FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contractor_projects cp WHERE cp.id = project_id
    )
  );

-- Add subcontractor update policy for accepting/declining awards
CREATE POLICY "Subs can update own bid status"
  ON public.subcontractor_bids FOR UPDATE TO authenticated
  USING (subcontractor_id = auth.uid())
  WITH CHECK (subcontractor_id = auth.uid());

-- Add homeowner read-only timeline policy (already exists, but ensure it's correct)
-- Already have: "Homeowners can view their project timelines"

-- Add subcontractor read policy for timeline_tasks (trade-only view)
CREATE POLICY "Subs can view timeline tasks for awarded trades"
  ON public.timeline_tasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subcontractor_bids sb
      WHERE sb.project_id = timeline_tasks.project_id
        AND sb.subcontractor_id = auth.uid()
        AND sb.status IN ('awarded', 'confirmed', 'completed')
        AND (sb.trade = timeline_tasks.assigned_trade OR timeline_tasks.assigned_trade IS NULL)
    )
  );

-- Add file visibility: contractor can view blueprint_files for their projects
CREATE POLICY "Contractors can view files for their projects"
  ON public.blueprint_files FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_projects cp
      WHERE cp.id = blueprint_files.project_id
        AND cp.contractor_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Add file visibility: homeowners can view files for their projects
CREATE POLICY "Homeowners can view files for their projects"
  ON public.blueprint_files FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.homeowner_projects hp
      WHERE hp.project_id = blueprint_files.project_id
        AND hp.homeowner_id = auth.uid()
    )
  );

-- Add contractor insert policy for blueprint_files
CREATE POLICY "Contractors can upload files for their projects"
  ON public.blueprint_files FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.contractor_projects cp
      WHERE cp.id = blueprint_files.project_id
        AND cp.contractor_id = auth.uid()
    )
  );