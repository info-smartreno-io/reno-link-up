-- Update RLS policy for leads table to allow contractor estimators to view all leads
DROP POLICY IF EXISTS "Estimators can view their assigned leads" ON public.leads;

CREATE POLICY "Estimators can view their assigned leads" 
ON public.leads 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM contractor_users 
    WHERE contractor_users.user_id = auth.uid() 
    AND contractor_users.is_active = true
    AND contractor_users.role IN ('estimator', 'contractor_admin', 'inside_sales')
  )
);

-- Update UPDATE policy
DROP POLICY IF EXISTS "Estimators can update their assigned leads" ON public.leads;

CREATE POLICY "Estimators can update their assigned leads" 
ON public.leads 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM contractor_users 
    WHERE contractor_users.user_id = auth.uid() 
    AND contractor_users.is_active = true
    AND contractor_users.role IN ('estimator', 'contractor_admin', 'inside_sales')
  )
);

-- Update INSERT policy
DROP POLICY IF EXISTS "Estimators can create leads" ON public.leads;

CREATE POLICY "Estimators can create leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM contractor_users 
    WHERE contractor_users.user_id = auth.uid() 
    AND contractor_users.is_active = true
    AND contractor_users.role IN ('estimator', 'contractor_admin', 'inside_sales')
  )
);

-- Update DELETE policy  
DROP POLICY IF EXISTS "Estimators can delete their assigned leads" ON public.leads;

CREATE POLICY "Estimators can delete their assigned leads" 
ON public.leads 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM contractor_users 
    WHERE contractor_users.user_id = auth.uid() 
    AND contractor_users.is_active = true
    AND contractor_users.role = 'contractor_admin'
  )
);