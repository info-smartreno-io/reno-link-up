-- Create warranty claim messages table
CREATE TABLE public.warranty_claim_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.warranty_claims(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message attachments table
CREATE TABLE public.warranty_message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.warranty_claim_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warranty_claim_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for warranty_claim_messages
-- Homeowners can view messages for their claims
CREATE POLICY "Homeowners can view their claim messages"
  ON public.warranty_claim_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.warranty_claims wc
      WHERE wc.id = claim_id AND wc.homeowner_id = auth.uid()
    )
  );

-- Staff can view all claim messages
CREATE POLICY "Staff can view all claim messages"
  ON public.warranty_claim_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'contractor', 'project_coordinator')
    )
  );

-- Homeowners can insert messages for their claims
CREATE POLICY "Homeowners can send messages for their claims"
  ON public.warranty_claim_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.warranty_claims wc
      WHERE wc.id = claim_id AND wc.homeowner_id = auth.uid()
    )
  );

-- Staff can insert messages for any claim
CREATE POLICY "Staff can send messages for any claim"
  ON public.warranty_claim_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'contractor', 'project_coordinator')
    )
  );

-- Anyone who can see a message can update read_at
CREATE POLICY "Users can mark messages as read"
  ON public.warranty_claim_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.warranty_claims wc
      WHERE wc.id = claim_id AND wc.homeowner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'contractor', 'project_coordinator')
    )
  );

-- RLS Policies for warranty_message_attachments
CREATE POLICY "Users can view attachments for accessible messages"
  ON public.warranty_message_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.warranty_claim_messages m
      JOIN public.warranty_claims wc ON wc.id = m.claim_id
      WHERE m.id = message_id AND (
        wc.homeowner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'contractor', 'project_coordinator')
        )
      )
    )
  );

CREATE POLICY "Users can insert attachments for their messages"
  ON public.warranty_message_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.warranty_claim_messages m
      WHERE m.id = message_id AND m.sender_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_warranty_claim_messages_claim_id ON public.warranty_claim_messages(claim_id);
CREATE INDEX idx_warranty_claim_messages_sender_id ON public.warranty_claim_messages(sender_id);
CREATE INDEX idx_warranty_message_attachments_message_id ON public.warranty_message_attachments(message_id);

-- Enable realtime
ALTER TABLE public.warranty_claim_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.warranty_claim_messages;

-- Create trigger for updated_at
CREATE TRIGGER update_warranty_claim_messages_updated_at
  BEFORE UPDATE ON public.warranty_claim_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();