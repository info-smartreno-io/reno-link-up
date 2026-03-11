-- Fix: contractors.user_id was referencing public.users(id), but auth users live in auth.users.
-- This causes "insert or update on table contractors violates foreign key constraint contractors_user_id_fkey"
-- when the user exists in auth.users but not in public.users.
-- Solution: drop the FK to public.users and re-add it to auth.users(id).

-- Only run if contractors has a user_id column (e.g. from Dashboard or older schema).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contractors' AND column_name = 'user_id'
  ) THEN
    -- Drop the existing FK (references public.users)
    ALTER TABLE public.contractors DROP CONSTRAINT IF EXISTS contractors_user_id_fkey;
    -- Allow NULL so ON DELETE SET NULL is valid (don't delete contractor when user is removed)
    ALTER TABLE public.contractors ALTER COLUMN user_id DROP NOT NULL;
    -- Re-add FK to auth.users so inserts succeed when the user exists in Supabase Auth
    ALTER TABLE public.contractors
      ADD CONSTRAINT contractors_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;
