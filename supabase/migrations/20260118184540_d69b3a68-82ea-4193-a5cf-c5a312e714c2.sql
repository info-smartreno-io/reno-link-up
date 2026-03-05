-- Create contractor waitlist table for priority list signups
CREATE TABLE public.contractor_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.contractor_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public can sign up for waitlist)
CREATE POLICY "Anyone can join waitlist" ON public.contractor_waitlist
  FOR INSERT WITH CHECK (true);

-- Add index on email for faster lookups
CREATE INDEX idx_contractor_waitlist_email ON public.contractor_waitlist(email);