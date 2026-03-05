-- Grant insert privilege on estimate_requests to anon so public form can work with RLS policy
GRANT INSERT ON public.estimate_requests TO anon;