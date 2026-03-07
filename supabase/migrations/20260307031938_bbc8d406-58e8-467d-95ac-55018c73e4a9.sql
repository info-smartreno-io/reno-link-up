
-- 1. Trigger: Subcontractor bid award → notify sub + log activity
CREATE OR REPLACE FUNCTION public.notify_subcontractor_award()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contractor_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'awarded' THEN
    -- Get contractor from project
    SELECT contractor_id INTO v_contractor_id
    FROM public.contractor_projects WHERE id = NEW.project_id LIMIT 1;

    -- Log activity
    INSERT INTO public.project_activity_log (project_id, activity_type, description, performed_by, role, metadata)
    VALUES (
      NEW.project_id, 'subcontractor_awarded',
      'Subcontractor ' || NEW.company_name || ' awarded for ' || NEW.trade,
      v_contractor_id, 'contractor',
      jsonb_build_object('trade', NEW.trade, 'company', NEW.company_name, 'bid_amount', NEW.bid_amount)
    );

    -- Notify sub if they have a user id
    IF NEW.subcontractor_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.subcontractor_id,
        'Trade Awarded: ' || NEW.trade,
        'You have been awarded the ' || NEW.trade || ' trade. Meeting date: ' || COALESCE(NEW.meeting_date::text, 'TBD'),
        'milestone',
        '/contractor/subcontractor?tab=projects'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subcontractor_award ON public.subcontractor_bids;
CREATE TRIGGER trg_subcontractor_award
  AFTER UPDATE ON public.subcontractor_bids
  FOR EACH ROW EXECUTE FUNCTION public.notify_subcontractor_award();

-- 2. Trigger: Timeline task changes → log activity + notify homeowner
CREATE OR REPLACE FUNCTION public.notify_timeline_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_homeowner_id UUID;
  v_description TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.start_date IS DISTINCT FROM NEW.start_date OR
    OLD.duration_days IS DISTINCT FROM NEW.duration_days
  ) THEN
    v_description := 'Timeline updated: ' || NEW.phase_name;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_description := v_description || ' status → ' || NEW.status;
    END IF;

    INSERT INTO public.project_activity_log (project_id, activity_type, description, performed_by, role, metadata)
    VALUES (NEW.project_id, 'timeline_update', v_description, auth.uid(), 'contractor',
      jsonb_build_object('phase', NEW.phase_name, 'status', NEW.status));

    -- Notify homeowner for significant changes
    SELECT hp.homeowner_id INTO v_homeowner_id
    FROM public.homeowner_projects hp WHERE hp.project_id = NEW.project_id LIMIT 1;

    IF v_homeowner_id IS NOT NULL AND (OLD.status IS DISTINCT FROM NEW.status) THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        v_homeowner_id,
        'Timeline Update',
        NEW.phase_name || ' is now ' || REPLACE(NEW.status, '_', ' '),
        'milestone',
        '/homeowner/projects/' || NEW.project_id || '/timeline'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_timeline_change ON public.timeline_tasks;
CREATE TRIGGER trg_timeline_change
  AFTER UPDATE ON public.timeline_tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_timeline_change();

-- 3. RLS for subcontractor_bids (allow contractors to manage their project bids, subs to see own)
ALTER TABLE public.subcontractor_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to subcontractor_bids"
  ON public.subcontractor_bids FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can manage bids on their projects"
  ON public.subcontractor_bids FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = subcontractor_bids.project_id AND cp.contractor_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = subcontractor_bids.project_id AND cp.contractor_id = auth.uid()
  ));

CREATE POLICY "Subs can view own bids"
  ON public.subcontractor_bids FOR SELECT TO authenticated
  USING (subcontractor_id = auth.uid());

CREATE POLICY "Public can insert sub bids via invite link"
  ON public.subcontractor_bids FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 4. RLS for timeline_tasks
ALTER TABLE public.timeline_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to timeline_tasks"
  ON public.timeline_tasks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can manage their project timelines"
  ON public.timeline_tasks FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = timeline_tasks.project_id AND cp.contractor_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = timeline_tasks.project_id AND cp.contractor_id = auth.uid()
  ));

CREATE POLICY "Homeowners can view their project timelines"
  ON public.timeline_tasks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.homeowner_projects hp
    WHERE hp.project_id = timeline_tasks.project_id AND hp.homeowner_id = auth.uid()
  ));

-- 5. RLS for project_daily_logs
ALTER TABLE public.project_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to daily_logs"
  ON public.project_daily_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can manage logs on their projects"
  ON public.project_daily_logs FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_daily_logs.project_id AND cp.contractor_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_daily_logs.project_id AND cp.contractor_id = auth.uid()
  ));

CREATE POLICY "Homeowners can view visible logs on their projects"
  ON public.project_daily_logs FOR SELECT TO authenticated
  USING (
    is_client_visible = true AND
    EXISTS (
      SELECT 1 FROM public.homeowner_projects hp
      WHERE hp.project_id = project_daily_logs.project_id AND hp.homeowner_id = auth.uid()
    )
  );

-- 6. Allow contractors to insert activity log entries for their projects
CREATE POLICY "Contractors can insert activity for their projects"
  ON public.project_activity_log FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_activity_log.project_id AND cp.contractor_id = auth.uid()
  ));

-- 7. Allow homeowners to insert activity for their projects
CREATE POLICY "Homeowners can insert activity for their projects"
  ON public.project_activity_log FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.homeowner_projects hp
    WHERE hp.project_id = project_activity_log.project_id AND hp.homeowner_id = auth.uid()
  ));
