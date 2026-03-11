-- Phase 6: auth/profile/role hardening

CREATE OR REPLACE FUNCTION public.handle_new_user_profile_and_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, phone, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    'homeowner',
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email     = EXCLUDED.email,
        phone     = EXCLUDED.phone,
        role      = COALESCE(public.users.role, EXCLUDED.role);

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = NEW.id
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'homeowner'::app_role);
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_profile_and_role ON auth.users;

CREATE TRIGGER on_auth_user_created_profile_and_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile_and_role();

-- 3. Clean orphaned role rows before FK enforcement
DELETE FROM public.user_roles ur
WHERE NOT EXISTS (
  SELECT 1
  FROM public.users u
  WHERE u.id = ur.user_id
);

-- 4. Recreate FK from user_roles.user_id -> users.id
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

DELETE FROM public.user_roles ur
USING public.user_roles ur2
WHERE ur.user_id = ur2.user_id
  AND ur.role = ur2.role
  AND ur.ctid > ur2.ctid;

-- 6. Add unique constraint on (user_id, role) if neither constraint nor relation already exists
DO $$
BEGIN
  -- If the constraint already exists on the table, do nothing
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_roles_user_id_role_key'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    RETURN;
  END IF;

  -- If an index/relation with the same name already exists, do nothing
  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relname = 'user_roles_user_id_role_key'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
END $$;

