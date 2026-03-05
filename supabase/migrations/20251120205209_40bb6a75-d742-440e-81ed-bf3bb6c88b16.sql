-- Site Health Copilot Tables

-- Chat sessions for tracking conversations
CREATE TABLE IF NOT EXISTS public.ai_copilot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.ai_copilot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.ai_copilot_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  context_used JSONB, -- stores what reports/data were referenced
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_copilot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_copilot_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (user can only see their own sessions)
CREATE POLICY "Users can view their own copilot sessions"
  ON public.ai_copilot_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own copilot sessions"
  ON public.ai_copilot_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own copilot sessions"
  ON public.ai_copilot_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own copilot sessions"
  ON public.ai_copilot_sessions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view messages in their sessions"
  ON public.ai_copilot_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_copilot_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their sessions"
  ON public.ai_copilot_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_copilot_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_copilot_sessions_user_id ON public.ai_copilot_sessions(user_id);
CREATE INDEX idx_copilot_sessions_updated ON public.ai_copilot_sessions(updated_at DESC);
CREATE INDEX idx_copilot_messages_session ON public.ai_copilot_messages(session_id);
CREATE INDEX idx_copilot_messages_created ON public.ai_copilot_messages(created_at);