-- Add project_manager role to app_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' 
    AND t.typname = 'app_role' 
    AND e.enumlabel = 'project_manager'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'project_manager';
  END IF;
END $$;