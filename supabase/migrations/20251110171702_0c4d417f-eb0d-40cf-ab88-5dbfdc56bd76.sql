-- Create table for bid message attachments
CREATE TABLE public.bid_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.bid_opportunity_messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bid_message_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments from messages they can access
CREATE POLICY "Users can view attachments from accessible messages"
ON public.bid_message_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bid_opportunity_messages bom
    WHERE bom.id = bid_message_attachments.message_id
    AND (
      -- Estimators/admins can view attachments for their opportunities
      (EXISTS (
        SELECT 1 FROM public.bid_opportunities
        WHERE id = bom.bid_opportunity_id
        AND created_by = auth.uid()
      ))
      OR
      -- Professionals can view attachments for opportunities they can access
      (EXISTS (
        SELECT 1 FROM public.bid_opportunities bo
        WHERE bo.id = bom.bid_opportunity_id
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
  )
);

-- Policy: Users can insert attachments to their messages
CREATE POLICY "Users can insert attachments to their messages"
ON public.bid_message_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bid_opportunity_messages
    WHERE id = bid_message_attachments.message_id
    AND sender_id = auth.uid()
  )
);

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their own bid message attachments"
ON public.bid_message_attachments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.bid_opportunity_messages
    WHERE id = bid_message_attachments.message_id
    AND sender_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create storage bucket for bid message attachments (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bid-message-attachments', 'bid-message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for bid message attachments
CREATE POLICY "Users can upload bid message attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'bid-message-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view bid message attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'bid-message-attachments');

CREATE POLICY "Users can delete their bid message attachments from storage"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'bid-message-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create index for performance
CREATE INDEX idx_bid_message_attachments_message ON public.bid_message_attachments(message_id);