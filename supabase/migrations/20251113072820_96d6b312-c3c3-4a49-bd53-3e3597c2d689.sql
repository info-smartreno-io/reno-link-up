-- Fix contractor_users RLS infinite recursion
-- Create SECURITY DEFINER helper functions to check contractor membership without recursive RLS

-- Function to check if a user is an active member of a specific contractor
CREATE OR REPLACE FUNCTION public.is_contractor_member(_user_id uuid, _contractor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contractor_users
    WHERE user_id = _user_id
      AND contractor_id = _contractor_id
      AND is_active = true
  )
$$;

-- Function to check if a user is a contractor admin for a specific contractor
CREATE OR REPLACE FUNCTION public.is_contractor_admin(_user_id uuid, _contractor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contractor_users
    WHERE user_id = _user_id
      AND contractor_id = _contractor_id
      AND role = 'contractor_admin'
      AND is_active = true
  )
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view team members from their contractor" ON public.contractor_users;
DROP POLICY IF EXISTS "Contractor admins can manage team members" ON public.contractor_users;

-- Recreate policies using the helper functions (avoiding recursion)
CREATE POLICY "Users can view team members from their contractor"
  ON public.contractor_users 
  FOR SELECT
  USING (
    public.is_contractor_member(auth.uid(), contractor_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractor admins can manage team members"
  ON public.contractor_users 
  FOR ALL
  USING (
    public.is_contractor_admin(auth.uid(), contractor_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    public.is_contractor_admin(auth.uid(), contractor_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );