-- Add columns to track SMS approval requests
ALTER TABLE public.material_selections
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS approval_request_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_request_sent_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_link TEXT;