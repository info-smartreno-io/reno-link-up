-- Add terms acceptance fields to public.users for homeowner onboarding
-- Nullable for backward compatibility with existing users

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS terms_version TEXT;

