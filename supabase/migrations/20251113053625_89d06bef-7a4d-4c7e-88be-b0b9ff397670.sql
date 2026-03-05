-- Create mentions table
CREATE TABLE IF NOT EXISTS public.chat_message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(message_id, mentioned_user_id)
);

-- Enable RLS on mentions
ALTER TABLE public.chat_message_mentions ENABLE ROW LEVEL SECURITY;

-- Mentions policies
CREATE POLICY "Users can view their own mentions"
  ON public.chat_message_mentions FOR SELECT
  TO authenticated
  USING (mentioned_user_id = auth.uid());

CREATE POLICY "Authenticated users can create mentions"
  ON public.chat_message_mentions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own mentions"
  ON public.chat_message_mentions FOR UPDATE
  TO authenticated
  USING (mentioned_user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_mentions_user_id ON public.chat_message_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_message_id ON public.chat_message_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_unread ON public.chat_message_mentions(mentioned_user_id, read_at) WHERE read_at IS NULL;

-- Enable realtime for mentions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_mentions;