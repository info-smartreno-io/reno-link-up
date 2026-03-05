-- Create trigger function for permit status change notifications
CREATE OR REPLACE FUNCTION public.notify_permit_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  supabase_url text := 'https://pscsnsgvfjcbldomnstb.supabase.co';
  supabase_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY3Nuc2d2ZmpjYmxkb21uc3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ0NTksImV4cCI6MjA3ODI0MDQ1OX0.ibB94sOxJPLLILJOilNboWCZeDavokqfn73wd5EzJ3E';
BEGIN
  -- Only send notification if status has changed to an important status
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status IN ('submitted', 'approved', 'revisions_required', 'zoning_pending') THEN
    
    -- Call edge function to send notification
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/send-permit-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_anon_key
      ),
      body := jsonb_build_object(
        'permitId', NEW.id,
        'newStatus', NEW.status,
        'oldStatus', OLD.status
      )
    ) INTO request_id;
    
    RAISE LOG 'Permit notification triggered: permit_id=%, old_status=%, new_status=%, request_id=%', 
      NEW.id, OLD.status, NEW.status, request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on permits table
DROP TRIGGER IF EXISTS on_permit_status_change ON permits;
CREATE TRIGGER on_permit_status_change
  AFTER UPDATE ON permits
  FOR EACH ROW
  EXECUTE FUNCTION notify_permit_status_change();

-- Add notification tracking columns to permits table
ALTER TABLE permits ADD COLUMN IF NOT EXISTS last_notification_sent_at timestamptz;
ALTER TABLE permits ADD COLUMN IF NOT EXISTS notification_count integer DEFAULT 0;

-- Create permit_milestones table for tracking key dates
CREATE TABLE IF NOT EXISTS permit_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL REFERENCES permits(id) ON DELETE CASCADE,
  milestone_type text NOT NULL,
  milestone_date date NOT NULL,
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS permit_milestones_permit_id_idx ON permit_milestones(permit_id);
CREATE INDEX IF NOT EXISTS permit_milestones_date_idx ON permit_milestones(milestone_date);

-- Enable RLS on permit_milestones
ALTER TABLE permit_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for permit_milestones
CREATE POLICY "Admins can view all permit milestones"
  ON permit_milestones FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can view permit milestones"
  ON permit_milestones FOR SELECT
  USING (has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Contractors can view their permit milestones"
  ON permit_milestones FOR SELECT
  USING (
    has_role(auth.uid(), 'contractor'::app_role) 
    AND permit_id IN (
      SELECT p.id FROM permits p
      JOIN contractor_projects cp ON cp.id = p.project_id::text::uuid
      WHERE cp.contractor_id = auth.uid()
    )
  );

CREATE POLICY "Project coordinators can view permit milestones"
  ON permit_milestones FOR SELECT
  USING (has_role(auth.uid(), 'project_coordinator'::app_role));

CREATE POLICY "Admins can manage permit milestones"
  ON permit_milestones FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment
COMMENT ON TABLE permit_milestones IS 'Tracks key permit-related milestones and sends calendar reminders';
COMMENT ON TRIGGER on_permit_status_change ON permits IS 'Automatically notifies homeowners when permit status changes';
