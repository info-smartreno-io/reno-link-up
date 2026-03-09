
CREATE TABLE public.architect_bid_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  architect_name TEXT NOT NULL,
  architect_id TEXT,
  requester_name TEXT,
  requester_email TEXT,
  requester_phone TEXT,
  project_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.architect_bid_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage architect bid requests"
ON public.architect_bid_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert architect bid requests"
ON public.architect_bid_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
