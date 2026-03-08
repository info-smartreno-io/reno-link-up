-- Fix: Allow invited contractors to update read_by_contractor on clarification messages
-- (they need to mark admin/estimator messages as read, not just their own messages)
DROP POLICY IF EXISTS "Admins can update clarifications" ON public.bid_packet_clarifications;

CREATE POLICY "Users can update clarifications they access"
ON public.bid_packet_clarifications
FOR UPDATE
USING (
  (sender_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (EXISTS (
    SELECT 1 FROM bid_packet_contractor_invites
    WHERE bid_packet_contractor_invites.bid_packet_id = bid_packet_clarifications.bid_packet_id
      AND bid_packet_contractor_invites.contractor_id = auth.uid()
  ))
)
WITH CHECK (
  (sender_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (EXISTS (
    SELECT 1 FROM bid_packet_contractor_invites
    WHERE bid_packet_contractor_invites.bid_packet_id = bid_packet_clarifications.bid_packet_id
      AND bid_packet_contractor_invites.contractor_id = auth.uid()
  ))
);