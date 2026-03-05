-- Fix invoices table - ensure strict separation using correct column names
-- Drop existing policies that may be too permissive
DROP POLICY IF EXISTS "Professionals can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Homeowners can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Contractors can view invoices they created" ON public.invoices;

-- Users (contractors) can only view invoices they created
CREATE POLICY "Users can view invoices they created" 
ON public.invoices 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Homeowners can only view invoices addressed to them
CREATE POLICY "Homeowners can view their invoices" 
ON public.invoices 
FOR SELECT 
USING (
  homeowner_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can insert invoices they own
DROP POLICY IF EXISTS "Contractors can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create invoices" ON public.invoices;
CREATE POLICY "Users can create invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can update their own invoices
DROP POLICY IF EXISTS "Contractors can update their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their invoices" ON public.invoices;
CREATE POLICY "Users can update their invoices" 
ON public.invoices 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can delete their own invoices
DROP POLICY IF EXISTS "Users can delete their invoices" ON public.invoices;
CREATE POLICY "Users can delete their invoices" 
ON public.invoices 
FOR DELETE 
USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);