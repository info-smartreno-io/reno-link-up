-- Enable realtime for leads table
ALTER TABLE public.leads REPLICA IDENTITY FULL;

-- Enable realtime for lead_activities table
ALTER TABLE public.lead_activities REPLICA IDENTITY FULL;

-- Enable realtime for lead_stage_history table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_stage_history') THEN
    EXECUTE 'ALTER TABLE public.lead_stage_history REPLICA IDENTITY FULL';
  END IF;
END $$;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activities;

-- Create function to log lead lifecycle events automatically
CREATE OR REPLACE FUNCTION public.log_lead_lifecycle_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, description, performed_by, metadata)
    VALUES (
      NEW.id, 
      'status_change',
      'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || COALESCE(NEW.status, 'none'),
      auth.uid(),
      jsonb_build_object('from_status', OLD.status, 'to_status', NEW.status)
    );
  END IF;
  
  -- Log estimator assignments
  IF TG_OP = 'UPDATE' AND OLD.estimator_id IS DISTINCT FROM NEW.estimator_id AND NEW.estimator_id IS NOT NULL THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, description, performed_by, metadata)
    VALUES (
      NEW.id, 
      'estimator_assigned',
      'Estimator assigned to lead',
      auth.uid(),
      jsonb_build_object('estimator_id', NEW.estimator_id)
    );
  END IF;
  
  -- Log walkthrough scheduling
  IF TG_OP = 'UPDATE' AND OLD.walkthrough_scheduled_at IS DISTINCT FROM NEW.walkthrough_scheduled_at AND NEW.walkthrough_scheduled_at IS NOT NULL THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, description, performed_by, metadata)
    VALUES (
      NEW.id, 
      'walkthrough_scheduled',
      'Walkthrough scheduled for ' || to_char(NEW.walkthrough_scheduled_at, 'Mon DD, YYYY at HH:MI AM'),
      auth.uid(),
      jsonb_build_object('scheduled_at', NEW.walkthrough_scheduled_at)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for lead lifecycle events
DROP TRIGGER IF EXISTS trigger_lead_lifecycle_events ON public.leads;
CREATE TRIGGER trigger_lead_lifecycle_events
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_lifecycle_event();