-- Add 'finance' to app_role enum (separate transaction)
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'finance';