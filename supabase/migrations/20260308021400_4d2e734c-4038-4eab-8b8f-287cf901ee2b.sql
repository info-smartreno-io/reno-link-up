
-- Clarification messages table
CREATE TABLE public.bid_packet_clarifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_packet_id UUID NOT NULL REFERENCES public.bid_packets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role TEXT NOT NULL DEFAULT 'contractor',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bid_packet_clarifications ENABLE ROW LEVEL SECURITY;

-- Contractors can read/insert clarifications for packets they're invited to
CREATE POLICY "Contractors can view own packet clarifications"
ON public.bid_packet_clarifications FOR SELECT TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.bid_packet_contractor_invites
    WHERE bid_packet_id = bid_packet_clarifications.bid_packet_id
    AND contractor_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Contractors can insert clarifications for invited packets"
ON public.bid_packet_clarifications FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.bid_packet_contractor_invites
      WHERE bid_packet_id = bid_packet_clarifications.bid_packet_id
      AND contractor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Admins can update (mark as read)
CREATE POLICY "Admins can update clarifications"
ON public.bid_packet_clarifications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR sender_id = auth.uid());

-- Bid submission history table for revision tracking
CREATE TABLE public.bid_submission_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_submission_id UUID NOT NULL REFERENCES public.bid_submissions(id) ON DELETE CASCADE,
  bid_amount NUMERIC,
  estimated_timeline TEXT,
  proposal_text TEXT,
  attachments JSONB,
  status TEXT NOT NULL,
  revision_notes TEXT,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.bid_submission_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submission history"
ON public.bid_submission_history FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.bid_submissions bs
    WHERE bs.id = bid_submission_history.bid_submission_id
    AND bs.bidder_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated users can insert submission history"
ON public.bid_submission_history FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Add revision columns to bid_submissions
ALTER TABLE public.bid_submissions
  ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revision_request_notes TEXT,
  ADD COLUMN IF NOT EXISTS revision_count INTEGER NOT NULL DEFAULT 0;

-- Enable realtime for clarifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.bid_packet_clarifications;
