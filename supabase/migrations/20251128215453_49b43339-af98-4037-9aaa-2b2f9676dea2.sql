-- Add new team roles to app_role enum (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'project_manager' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'project_manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'field_worker' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'field_worker';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'estimator_team' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'estimator_team';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'office_admin' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'office_admin';
  END IF;
END $$;

-- Create contractor_team_invitations table if not exists
CREATE TABLE IF NOT EXISTS public.contractor_team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_token TEXT NOT NULL UNIQUE,
  role app_role NOT NULL,
  invited_email TEXT,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create contractor_team_members table if not exists
CREATE TABLE IF NOT EXISTS public.contractor_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  permissions JSONB DEFAULT '{"view_projects": true, "update_progress": false, "manage_schedule": false, "client_communication": false}'::jsonb,
  invitation_id UUID REFERENCES public.contractor_team_invitations(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contractor_id, user_id)
);

-- Enable RLS
ALTER TABLE public.contractor_team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Contractors can view their own invitations" ON public.contractor_team_invitations;
DROP POLICY IF EXISTS "Contractors can create invitations" ON public.contractor_team_invitations;
DROP POLICY IF EXISTS "Contractors can update their own invitations" ON public.contractor_team_invitations;
DROP POLICY IF EXISTS "Contractors can delete their own invitations" ON public.contractor_team_invitations;
DROP POLICY IF EXISTS "Contractors can view their team members" ON public.contractor_team_members;
DROP POLICY IF EXISTS "Contractors can add team members" ON public.contractor_team_members;
DROP POLICY IF EXISTS "Contractors can update their team members" ON public.contractor_team_members;
DROP POLICY IF EXISTS "Contractors can delete their team members" ON public.contractor_team_members;

-- RLS Policies for contractor_team_invitations
CREATE POLICY "Contractors can view their own invitations"
  ON public.contractor_team_invitations FOR SELECT
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can create invitations"
  ON public.contractor_team_invitations FOR INSERT
  WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Contractors can update their own invitations"
  ON public.contractor_team_invitations FOR UPDATE
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can delete their own invitations"
  ON public.contractor_team_invitations FOR DELETE
  USING (contractor_id = auth.uid());

-- RLS Policies for contractor_team_members
CREATE POLICY "Contractors can view their team members"
  ON public.contractor_team_members FOR SELECT
  USING (contractor_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Contractors can add team members"
  ON public.contractor_team_members FOR INSERT
  WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Contractors can update their team members"
  ON public.contractor_team_members FOR UPDATE
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can delete their team members"
  ON public.contractor_team_members FOR DELETE
  USING (contractor_id = auth.uid());

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_team_invitations_contractor ON public.contractor_team_invitations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.contractor_team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_members_contractor ON public.contractor_team_members(contractor_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.contractor_team_members(user_id);

-- Trigger to sync team member roles with user_roles table
CREATE OR REPLACE FUNCTION public.sync_team_member_to_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    -- Add role to user_roles
    INSERT INTO public.user_roles (user_id, role, created_by)
    VALUES (NEW.user_id, NEW.role, NEW.contractor_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_active = true AND OLD.is_active = false THEN
      -- Re-add role when reactivated
      INSERT INTO public.user_roles (user_id, role, created_by)
      VALUES (NEW.user_id, NEW.role, NEW.contractor_id)
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF NEW.is_active = false AND OLD.is_active = true THEN
      -- Remove role when deactivated
      DELETE FROM public.user_roles
      WHERE user_id = NEW.user_id AND role = NEW.role;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove role when member is deleted
    DELETE FROM public.user_roles
    WHERE user_id = OLD.user_id AND role = OLD.role;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_team_member_role_trigger ON public.contractor_team_members;
CREATE TRIGGER sync_team_member_role_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.contractor_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_team_member_to_user_role();

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_contractor_team_invitations_updated_at ON public.contractor_team_invitations;
CREATE TRIGGER update_contractor_team_invitations_updated_at
  BEFORE UPDATE ON public.contractor_team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contractor_team_members_updated_at ON public.contractor_team_members;
CREATE TRIGGER update_contractor_team_members_updated_at
  BEFORE UPDATE ON public.contractor_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();