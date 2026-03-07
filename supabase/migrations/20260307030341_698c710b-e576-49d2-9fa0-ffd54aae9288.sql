
-- Create project activity log for cross-portal activity feeds
CREATE TABLE IF NOT EXISTS public.project_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by UUID,
  role TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin can see all
CREATE POLICY "Admins can view all activity" ON public.project_activity_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert
CREATE POLICY "Admins can insert activity" ON public.project_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert their own
CREATE POLICY "Users can insert own activity" ON public.project_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (performed_by = auth.uid());

-- Homeowners can see activity for their projects
CREATE POLICY "Homeowners can view own project activity" ON public.project_activity_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.homeowner_projects hp
      JOIN public.contractor_projects cp ON cp.id = hp.project_id
      WHERE cp.id = project_activity_log.project_id
        AND hp.homeowner_id = auth.uid()
    )
  );

-- Contractors can see activity for their projects
CREATE POLICY "Contractors can view own project activity" ON public.project_activity_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_projects cp
      WHERE cp.id = project_activity_log.project_id
        AND cp.contractor_id = auth.uid()
    )
  );

-- RLS policy for notifications table: users can read their own
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update own notifications (mark read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Admin/system can insert notifications for anyone
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create trigger function to log project activity and create notifications on key events
CREATE OR REPLACE FUNCTION public.log_project_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_homeowner_id UUID;
  v_contractor_id UUID;
  v_description TEXT;
  v_homeowner_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Log activity
    v_description := 'Project status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status;
    
    INSERT INTO public.project_activity_log (project_id, activity_type, description, performed_by, role, metadata)
    VALUES (NEW.id, 'status_change', v_description, auth.uid(), 'system', jsonb_build_object('from', OLD.status, 'to', NEW.status));

    -- Get homeowner
    SELECT hp.homeowner_id INTO v_homeowner_id
    FROM public.homeowner_projects hp WHERE hp.project_id = NEW.id LIMIT 1;

    -- Determine homeowner-friendly label
    v_homeowner_label := CASE NEW.status
      WHEN 'intake' THEN 'Project Submitted'
      WHEN 'payment_confirmed' THEN 'Project Submitted'
      WHEN 'walkthrough_scheduled' THEN 'Site Visit Scheduled'
      WHEN 'walkthrough_complete' THEN 'Preparing Your Estimate'
      WHEN 'estimating' THEN 'Preparing Your Estimate'
      WHEN 'estimate_ready' THEN 'Gathering Proposals'
      WHEN 'rfp_out' THEN 'Gathering Proposals'
      WHEN 'contractor_selected' THEN 'Contractor Selected'
      WHEN 'in_progress' THEN 'Construction In Progress'
      WHEN 'complete' THEN 'Completed'
      WHEN 'completed' THEN 'Completed'
      ELSE initcap(replace(NEW.status, '_', ' '))
    END;

    -- Notify homeowner
    IF v_homeowner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        v_homeowner_id,
        'Project Update',
        'Your project status is now: ' || v_homeowner_label,
        'milestone',
        '/homeowner/projects/' || NEW.id || '/overview'
      );
    END IF;

    -- Notify contractor
    IF NEW.contractor_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.contractor_id,
        'Project Status Update',
        'Project "' || COALESCE(NEW.client_name, 'Project') || '" status changed to ' || NEW.status,
        'milestone',
        '/contractor/projects/' || NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_project_status_change ON public.contractor_projects;
CREATE TRIGGER trg_project_status_change
  AFTER UPDATE ON public.contractor_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_status_change();

-- Create trigger for daily log uploads to notify homeowner
CREATE OR REPLACE FUNCTION public.notify_daily_log_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_homeowner_id UUID;
BEGIN
  IF NEW.is_client_visible = true THEN
    SELECT hp.homeowner_id INTO v_homeowner_id
    FROM public.homeowner_projects hp WHERE hp.project_id = NEW.project_id LIMIT 1;

    IF v_homeowner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        v_homeowner_id,
        'New Progress Update',
        COALESCE(LEFT(NEW.work_completed, 80), 'New daily log posted'),
        'daily_log',
        '/homeowner/projects/' || NEW.project_id || '/daily-logs'
      );

      INSERT INTO public.project_activity_log (project_id, activity_type, description, performed_by, role)
      VALUES (NEW.project_id, 'daily_log', 'Daily log posted: ' || COALESCE(LEFT(NEW.work_completed, 100), 'Update'), NEW.created_by, 'contractor');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_daily_log_notify ON public.project_daily_logs;
CREATE TRIGGER trg_daily_log_notify
  AFTER INSERT ON public.project_daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_daily_log_upload();

-- Create trigger for bid submissions to notify admin
CREATE OR REPLACE FUNCTION public.notify_bid_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin RECORD;
  v_opp_title TEXT;
BEGIN
  SELECT title INTO v_opp_title FROM public.bid_opportunities WHERE id = NEW.bid_opportunity_id;
  
  -- Notify all admins
  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_admin.user_id,
      'New Bid Submitted',
      'A bid of $' || NEW.bid_amount || ' was submitted for "' || COALESCE(v_opp_title, 'opportunity') || '"',
      'proposal',
      '/admin/bids'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bid_submitted ON public.bid_submissions;
CREATE TRIGGER trg_bid_submitted
  AFTER INSERT ON public.bid_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_bid_submitted();

-- Create trigger for message sent to update unread
CREATE OR REPLACE FUNCTION public.notify_message_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_project RECORD;
  v_homeowner_id UUID;
BEGIN
  -- Get project info
  SELECT * INTO v_project FROM public.contractor_projects WHERE id = NEW.project_id;
  
  -- Notify homeowner if sender is not homeowner
  SELECT hp.homeowner_id INTO v_homeowner_id
  FROM public.homeowner_projects hp WHERE hp.project_id = NEW.project_id LIMIT 1;

  IF v_homeowner_id IS NOT NULL AND v_homeowner_id != NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_homeowner_id,
      'New Message',
      LEFT(NEW.message, 80),
      'message',
      '/homeowner/projects/' || NEW.project_id || '/messages'
    );
  END IF;

  -- Notify contractor if sender is not contractor
  IF v_project.contractor_id IS NOT NULL AND v_project.contractor_id != NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_project.contractor_id,
      'New Message',
      LEFT(NEW.message, 80),
      'message',
      '/contractor/projects/' || NEW.project_id || '/messages'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_sent ON public.project_messages;
CREATE TRIGGER trg_message_sent
  AFTER INSERT ON public.project_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_sent();
