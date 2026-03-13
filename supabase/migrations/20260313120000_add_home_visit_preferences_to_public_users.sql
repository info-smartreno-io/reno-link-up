-- Add JSON field to store homeowner site logistics & visit preferences
-- (working hours, storage, bathroom policy, dumpster/parking, pets, etc.)

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS home_visit_preferences JSONB DEFAULT '{}'::jsonb;

