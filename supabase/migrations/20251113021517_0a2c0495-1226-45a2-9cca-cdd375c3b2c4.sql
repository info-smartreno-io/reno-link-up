-- First, check if values exist and add the missing construction company roles
DO $$
BEGIN
  -- Add roles only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'project_manager' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'project_manager';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'project_coordinator' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'project_coordinator';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'foreman' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'foreman';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'inside_sales' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'inside_sales';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'purchaser_manager' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'purchaser_manager';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'office_manager' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'office_manager';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'warehouse' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'warehouse';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'outside_sales' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'outside_sales';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'business_operations' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'business_operations';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vp_of_sales' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'vp_of_sales';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'general_manager' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'general_manager';
  END IF;
END
$$;

-- Add role column to team_members table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'team_members' 
    AND column_name = 'assigned_role'
  ) THEN
    ALTER TABLE public.team_members ADD COLUMN assigned_role public.app_role;
  END IF;
END
$$;

-- Create a function to automatically create user_role when team member role is assigned
CREATE OR REPLACE FUNCTION public.sync_team_member_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If a role is assigned and user_id exists, create/update user_roles entry
  IF NEW.assigned_role IS NOT NULL AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, created_by)
    VALUES (NEW.user_id, NEW.assigned_role, auth.uid())
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  -- If role is removed, delete from user_roles
  IF OLD.assigned_role IS NOT NULL AND NEW.assigned_role IS NULL AND NEW.user_id IS NOT NULL THEN
    DELETE FROM public.user_roles 
    WHERE user_id = NEW.user_id AND role = OLD.assigned_role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for team member role sync
DROP TRIGGER IF EXISTS sync_team_member_role_trigger ON public.team_members;
CREATE TRIGGER sync_team_member_role_trigger
AFTER INSERT OR UPDATE OF assigned_role, user_id ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_team_member_role();