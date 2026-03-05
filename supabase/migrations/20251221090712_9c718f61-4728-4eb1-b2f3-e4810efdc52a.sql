-- Create function to auto-assign estimator on new lead
CREATE OR REPLACE FUNCTION public.auto_assign_estimator_on_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  supabase_key TEXT;
BEGIN
  -- Get Supabase URL and key from environment
  supabase_url := current_setting('app.supabase_url', true);
  supabase_key := current_setting('app.supabase_anon_key', true);
  
  -- Use pg_net to call the edge function asynchronously
  IF supabase_url IS NOT NULL AND supabase_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/assign-estimator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_key
      ),
      body := jsonb_build_object('leadId', NEW.id)::text
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block the insert
  RAISE WARNING 'Auto-assign estimator failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new lead inserts (only when status is new_lead or similar)
DROP TRIGGER IF EXISTS trigger_auto_assign_estimator_lead ON public.leads;
CREATE TRIGGER trigger_auto_assign_estimator_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW
  WHEN (NEW.estimator_id IS NULL)
  EXECUTE FUNCTION public.auto_assign_estimator_on_new_lead();

-- Also trigger when lead status changes to new_lead and no estimator assigned
DROP TRIGGER IF EXISTS trigger_auto_assign_on_lead_status_change ON public.leads;
CREATE TRIGGER trigger_auto_assign_on_lead_status_change
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  WHEN (
    NEW.status IN ('new_lead', 'intake', 'lead_intake')
    AND NEW.estimator_id IS NULL
    AND (OLD.estimator_id IS NULL)
  )
  EXECUTE FUNCTION public.auto_assign_estimator_on_new_lead();