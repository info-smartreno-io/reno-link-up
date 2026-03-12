-- Drop unique constraint on public.users.email that conflicts with auth.users-triggered inserts
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_email_key;

