
-- Bid packet activity log for full audit trail
CREATE TABLE public.bid_packet_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_packet_id UUID NOT NULL REFERENCES public.bid_packets(id) ON DELETE CASCADE,
  bid_submission_id UUID REFERENCES public.bid_submissions(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  actor_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bid_packet_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all bid packet activity"
ON public.bid_packet_activity_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert activity"
ON public.bid_packet_activity_log FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

CREATE INDEX idx_bid_packet_activity_packet ON public.bid_packet_activity_log(bid_packet_id, created_at DESC);

-- Add source_event column to bid_submission_history
ALTER TABLE public.bid_submission_history
  ADD COLUMN IF NOT EXISTS source_event TEXT DEFAULT 'submitted';

-- Replace single is_read with role-based read tracking on clarifications
ALTER TABLE public.bid_packet_clarifications
  ADD COLUMN IF NOT EXISTS read_by_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_by_estimator BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_by_contractor BOOLEAN NOT NULL DEFAULT false;
