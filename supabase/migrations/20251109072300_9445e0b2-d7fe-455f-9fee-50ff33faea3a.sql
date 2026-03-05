-- Fix function search path security warning (drop with CASCADE)
DROP FUNCTION IF EXISTS public.validate_newsletter_email() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_newsletter_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Basic email validation
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Convert email to lowercase
  NEW.email := LOWER(TRIM(NEW.email));
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER validate_newsletter_email_trigger
  BEFORE INSERT OR UPDATE ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_newsletter_email();