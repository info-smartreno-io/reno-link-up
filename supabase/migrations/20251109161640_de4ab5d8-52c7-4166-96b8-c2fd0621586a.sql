-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to send welcome email via edge function
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only send email for new active subscriptions
  IF NEW.status = 'active' THEN
    SELECT net.http_post(
      url := 'https://pscsnsgvfjcbldomnstb.supabase.co/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY3Nuc2d2ZmpjYmxkb21uc3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ0NTksImV4cCI6MjA3ODI0MDQ1OX0.ibB94sOxJPLLILJOilNboWCZeDavokqfn73wd5EzJ3E'
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'source', COALESCE(NEW.source, 'blog')
      )
    ) INTO request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on newsletter_subscribers
DROP TRIGGER IF EXISTS on_newsletter_subscribe ON public.newsletter_subscribers;
CREATE TRIGGER on_newsletter_subscribe
  AFTER INSERT ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();