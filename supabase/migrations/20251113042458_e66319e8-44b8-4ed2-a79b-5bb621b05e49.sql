-- Add notes and reason fields to lead_stage_history if they don't exist
ALTER TABLE public.lead_stage_history 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Update the log_lead_stage_change function to support notes
CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_stage_history (
      lead_id,
      from_status,
      to_status,
      changed_by,
      notes,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      NEW.status_change_notes,
      NEW.status_change_reason
    );
    
    -- Clear the temporary fields after logging
    NEW.status_change_notes := NULL;
    NEW.status_change_reason := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add temporary fields to leads table for passing notes/reason to trigger
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS status_change_notes TEXT,
ADD COLUMN IF NOT EXISTS status_change_reason TEXT;

-- Create view for lead history with user names
CREATE OR REPLACE VIEW public.lead_history_with_users AS
SELECT 
  lsh.*,
  p.full_name as changed_by_name,
  l.name as lead_name
FROM public.lead_stage_history lsh
LEFT JOIN public.profiles p ON p.id = lsh.changed_by
LEFT JOIN public.leads l ON l.id = lsh.lead_id
ORDER BY lsh.changed_at DESC;