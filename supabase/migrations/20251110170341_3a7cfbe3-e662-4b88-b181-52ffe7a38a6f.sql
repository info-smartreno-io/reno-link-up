-- Create function to notify bidder of status changes
CREATE OR REPLACE FUNCTION public.notify_bid_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bidder_email text;
  bidder_name text;
  opportunity_title text;
  request_id bigint;
  supabase_url text := 'https://pscsnsgvfjcbldomnstb.supabase.co';
  supabase_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY3Nuc2d2ZmpjYmxkb21uc3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ0NTksImV4cCI6MjA3ODI0MDQ1OX0.ibB94sOxJPLLILJOilNboWCZeDavokqfn73wd5EzJ3E';
BEGIN
  -- Only send notification if status has changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get bidder email and name
    SELECT p.full_name, au.email
    INTO bidder_name, bidder_email
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE au.id = NEW.bidder_id;
    
    -- Get opportunity title
    SELECT title
    INTO opportunity_title
    FROM public.bid_opportunities
    WHERE id = NEW.bid_opportunity_id;
    
    -- Call edge function to send email
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/send-bid-status-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_anon_key
      ),
      body := jsonb_build_object(
        'bidSubmissionId', NEW.id,
        'newStatus', NEW.status,
        'oldStatus', OLD.status,
        'bidderEmail', bidder_email,
        'bidderName', COALESCE(bidder_name, 'Professional'),
        'opportunityTitle', opportunity_title,
        'bidAmount', NEW.bid_amount
      )
    ) INTO request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bid_submissions table
DROP TRIGGER IF EXISTS trigger_bid_status_notification ON public.bid_submissions;
CREATE TRIGGER trigger_bid_status_notification
AFTER UPDATE ON public.bid_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_bid_status_change();