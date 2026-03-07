
-- Allow anonymous inserts for public sub-bid form
CREATE POLICY "Public can submit subcontractor bids"
ON public.subcontractor_bids FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous reads for confirmation after submission
CREATE POLICY "Public can read submitted bids"
ON public.subcontractor_bids FOR SELECT
TO anon
USING (true);
