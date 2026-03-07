
-- Create bid_packet_contractor_invites table
CREATE TABLE IF NOT EXISTS public.bid_packet_contractor_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_packet_id UUID NOT NULL REFERENCES public.bid_packets(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'invited',
  viewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bid_packet_id, contractor_id)
);

-- Add bid_deadline to bid_packets if not exists
ALTER TABLE public.bid_packets ADD COLUMN IF NOT EXISTS bid_deadline TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.bid_packet_contractor_invites ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_full_access_invites" ON public.bid_packet_contractor_invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Contractors can view their own invites
CREATE POLICY "contractor_view_own_invites" ON public.bid_packet_contractor_invites
  FOR SELECT TO authenticated
  USING (contractor_id = auth.uid());

-- Contractors can update their own invites (status, viewed_at)
CREATE POLICY "contractor_update_own_invites" ON public.bid_packet_contractor_invites
  FOR UPDATE TO authenticated
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

-- Add RLS policy for contractors to view bid_packets they're invited to
CREATE POLICY "contractor_view_invited_packets" ON public.bid_packets
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.bid_packet_contractor_invites
      WHERE bid_packet_id = id AND contractor_id = auth.uid()
    )
  );

-- Add RLS on bid_submissions for contractor isolation
CREATE POLICY "contractor_own_submissions" ON public.bid_submissions
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    bidder_id = auth.uid()
  );

-- Enable realtime for invites
ALTER PUBLICATION supabase_realtime ADD TABLE public.bid_packet_contractor_invites;
