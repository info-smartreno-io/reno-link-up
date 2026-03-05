-- Create table for bid opportunity messages
CREATE TABLE public.bid_opportunity_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_opportunity_id uuid NOT NULL REFERENCES public.bid_opportunities(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_by jsonb DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.bid_opportunity_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can send messages to opportunities they can view
CREATE POLICY "Users can send messages to viewable opportunities"
ON public.bid_opportunity_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    -- Estimators/admins can message any opportunity they created
    (EXISTS (
      SELECT 1 FROM public.bid_opportunities
      WHERE id = bid_opportunity_messages.bid_opportunity_id
      AND created_by = auth.uid()
    ))
    OR
    -- Professionals can message opportunities they can view
    (EXISTS (
      SELECT 1 FROM public.bid_opportunities bo
      WHERE bo.id = bid_opportunity_messages.bid_opportunity_id
      AND bo.status = 'open'
      AND (
        (bo.open_to_architects = true AND has_role(auth.uid(), 'architect'::app_role))
        OR (bo.open_to_contractors = true AND has_role(auth.uid(), 'contractor'::app_role))
        OR (bo.open_to_interior_designers = true AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'interior_designer'::app_role
        ))
      )
    ))
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Policy: Users can view messages for opportunities they can access
CREATE POLICY "Users can view messages for accessible opportunities"
ON public.bid_opportunity_messages
FOR SELECT
USING (
  -- Estimators/admins can view messages for their opportunities
  (EXISTS (
    SELECT 1 FROM public.bid_opportunities
    WHERE id = bid_opportunity_messages.bid_opportunity_id
    AND created_by = auth.uid()
  ))
  OR
  -- Professionals can view messages for opportunities they can access
  (EXISTS (
    SELECT 1 FROM public.bid_opportunities bo
    WHERE bo.id = bid_opportunity_messages.bid_opportunity_id
    AND bo.status = 'open'
    AND (
      (bo.open_to_architects = true AND has_role(auth.uid(), 'architect'::app_role))
      OR (bo.open_to_contractors = true AND has_role(auth.uid(), 'contractor'::app_role))
      OR (bo.open_to_interior_designers = true AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'interior_designer'::app_role
      ))
    )
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Users can update read status
CREATE POLICY "Users can update message read status"
ON public.bid_opportunity_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bid_opportunities
    WHERE id = bid_opportunity_messages.bid_opportunity_id
    AND (
      created_by = auth.uid()
      OR status = 'open'
    )
  )
);

-- Policy: Senders can delete their own messages
CREATE POLICY "Senders can delete their own messages"
ON public.bid_opportunity_messages
FOR DELETE
USING (auth.uid() = sender_id OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER TABLE public.bid_opportunity_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bid_opportunity_messages;

-- Create index for performance
CREATE INDEX idx_bid_messages_opportunity ON public.bid_opportunity_messages(bid_opportunity_id, created_at);
CREATE INDEX idx_bid_messages_sender ON public.bid_opportunity_messages(sender_id);