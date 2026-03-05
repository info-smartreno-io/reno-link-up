-- Create QuickBooks tokens table
CREATE TABLE IF NOT EXISTS public.quickbooks_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  realm_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quickbooks_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view QuickBooks tokens"
  ON public.quickbooks_tokens
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert QuickBooks tokens"
  ON public.quickbooks_tokens
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update QuickBooks tokens"
  ON public.quickbooks_tokens
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete QuickBooks tokens"
  ON public.quickbooks_tokens
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create QuickBooks sync history table
CREATE TABLE IF NOT EXISTS public.quickbooks_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quickbooks_sync_history ENABLE ROW LEVEL SECURITY;

-- Create policies for sync history
CREATE POLICY "Admins can view sync history"
  ON public.quickbooks_sync_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert sync history"
  ON public.quickbooks_sync_history
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_quickbooks_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quickbooks_tokens_updated_at
  BEFORE UPDATE ON public.quickbooks_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quickbooks_tokens_updated_at();