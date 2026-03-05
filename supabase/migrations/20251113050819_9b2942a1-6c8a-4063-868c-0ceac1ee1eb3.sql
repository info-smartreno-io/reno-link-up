-- Create team invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL,
  invitation_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by_name text,
  company_name text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_contractor ON public.team_invitations(contractor_id);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Contractors can create and view their own invitations
CREATE POLICY "Contractors can insert their own invitations"
  ON public.team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can view their own invitations"
  ON public.team_invitations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = contractor_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Contractors can update their own invitations"
  ON public.team_invitations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = contractor_id OR has_role(auth.uid(), 'admin'));

-- Anyone can view invitations by token (for acceptance page)
CREATE POLICY "Anyone can view invitation by valid token"
  ON public.team_invitations
  FOR SELECT
  TO anon
  USING (status = 'pending' AND expires_at > now());

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.team_invitations
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < now();
END;
$$;