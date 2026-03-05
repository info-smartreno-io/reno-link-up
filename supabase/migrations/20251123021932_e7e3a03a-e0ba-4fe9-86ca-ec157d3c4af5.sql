-- Add user_id column to estimate_requests table to link estimates with user accounts
ALTER TABLE estimate_requests
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;