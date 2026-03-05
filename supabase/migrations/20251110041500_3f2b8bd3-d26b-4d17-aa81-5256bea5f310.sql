-- Fix search_path for the function by recreating it with CASCADE
DROP FUNCTION IF EXISTS public.update_team_status_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION public.update_team_status_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_team_member_status_updated_at
BEFORE UPDATE ON public.team_member_status
FOR EACH ROW
EXECUTE FUNCTION public.update_team_status_timestamp();