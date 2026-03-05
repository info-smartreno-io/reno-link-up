
-- Enable Row Level Security on estimate_requests table
-- This table has policies defined but RLS was not enabled, creating a security vulnerability
ALTER TABLE public.estimate_requests ENABLE ROW LEVEL SECURITY;
