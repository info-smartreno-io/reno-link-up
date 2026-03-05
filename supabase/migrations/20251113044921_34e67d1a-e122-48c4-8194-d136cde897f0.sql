-- Add trigger to notify on PM stage changes
CREATE OR REPLACE FUNCTION public.notify_pm_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pm_email text;
  pm_name text;
  request_id bigint;
  supabase_url text := 'https://pscsnsgvfjcbldomnstb.supabase.co';
  supabase_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY3Nuc2d2ZmpjYmxkb21uc3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ0NTksImV4cCI6MjA3ODI0MDQ1OX0.ibB94sOxJPLLILJOilNboWCZeDavokqfn73wd5EzJ3E';
BEGIN
  -- Only send notification if status has changed and is a PM stage
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND (NEW.status LIKE 'pm_%' OR OLD.status LIKE 'pm_%') THEN
    
    -- Get project manager details if assigned
    IF NEW.project_manager_id IS NOT NULL THEN
      SELECT au.email, p.full_name
      INTO pm_email, pm_name
      FROM auth.users au
      LEFT JOIN public.profiles p ON p.id = au.id
      WHERE au.id = NEW.project_manager_id;
    END IF;
    
    -- Call edge function to send notification
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/send-pm-stage-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_anon_key
      ),
      body := jsonb_build_object(
        'projectId', NEW.id,
        'newStage', NEW.status,
        'oldStage', OLD.status,
        'homeownerName', NEW.homeowner_name,
        'projectType', NEW.project_type,
        'address', NEW.address,
        'projectManagerEmail', pm_email,
        'projectManagerName', pm_name
      )
    ) INTO request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on projects table
DROP TRIGGER IF EXISTS on_pm_stage_change ON public.projects;
CREATE TRIGGER on_pm_stage_change
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pm_stage_change();