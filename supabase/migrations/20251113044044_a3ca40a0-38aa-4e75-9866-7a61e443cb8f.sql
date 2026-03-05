-- Add project_coordinator role to app_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' 
    AND t.typname = 'app_role' 
    AND e.enumlabel = 'project_coordinator'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'project_coordinator';
  END IF;
END $$;

-- Update RLS policies on contractor_projects to allow project coordinators
DROP POLICY IF EXISTS "Project coordinators can view all contractor projects" ON public.contractor_projects;
CREATE POLICY "Project coordinators can view all contractor projects"
ON public.contractor_projects
FOR SELECT
USING (
  auth.uid() = contractor_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'project_coordinator'::app_role)
);

DROP POLICY IF EXISTS "Project coordinators can update contractor projects" ON public.contractor_projects;
CREATE POLICY "Project coordinators can update contractor projects"
ON public.contractor_projects
FOR UPDATE
USING (
  auth.uid() = contractor_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'project_coordinator'::app_role)
)
WITH CHECK (
  auth.uid() = contractor_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'project_coordinator'::app_role)
);

-- Allow project coordinators to insert contractor projects
DROP POLICY IF EXISTS "Project coordinators can create contractor projects" ON public.contractor_projects;
CREATE POLICY "Project coordinators can create contractor projects"
ON public.contractor_projects
FOR INSERT
WITH CHECK (
  auth.uid() = contractor_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'project_coordinator'::app_role)
);

-- Update contractor sidebar to allow project coordinators
CREATE OR REPLACE FUNCTION public.is_contractor_or_coordinator(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = is_contractor_or_coordinator.user_id
      AND role IN ('contractor'::app_role, 'project_coordinator'::app_role, 'admin'::app_role)
  )
$$;