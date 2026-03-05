-- Enable realtime for warranty_claims table
ALTER TABLE public.warranty_claims REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.warranty_claims;

-- Enable realtime for warranty_claim_events table as well
ALTER TABLE public.warranty_claim_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.warranty_claim_events;