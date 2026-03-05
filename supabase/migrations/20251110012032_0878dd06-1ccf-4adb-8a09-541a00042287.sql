-- Add new staff roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'estimator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_success_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'call_center_rep';

-- Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;