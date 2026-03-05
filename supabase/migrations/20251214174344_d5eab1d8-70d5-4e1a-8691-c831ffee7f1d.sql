-- Add RLS policies for contractors to view and update their warranty claims
CREATE POLICY "Contractors can view their warranty claims"
ON public.warranty_claims
FOR SELECT
USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can update their warranty claims"
ON public.warranty_claims
FOR UPDATE
USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));