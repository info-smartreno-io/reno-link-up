-- Add Google Calendar event ID to walkthroughs table
ALTER TABLE public.walkthroughs 
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_walkthroughs_google_event 
ON public.walkthroughs(google_calendar_event_id);

-- Enable realtime for walkthroughs table
ALTER TABLE public.walkthroughs REPLICA IDENTITY FULL;