-- Add professional roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'homeowner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contractor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'architect';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'interior_designer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';