-- Create contractor_applications table for approval workflow
CREATE TABLE IF NOT EXISTS public.contractor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  license_number TEXT,
  years_experience INTEGER,
  service_areas TEXT[],
  specialties TEXT[],
  insurance_verified BOOLEAN DEFAULT false,
  license_verified BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.contractor_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view their own contractor applications"
  ON public.contractor_applications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own applications (but only once)
CREATE POLICY "Users can create their own contractor application"
  ON public.contractor_applications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM public.contractor_applications
      WHERE user_id = auth.uid()
    )
  );

-- Admins can view all applications
CREATE POLICY "Admins can view all contractor applications"
  ON public.contractor_applications
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update applications
CREATE POLICY "Admins can update contractor applications"
  ON public.contractor_applications
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Strengthen user_roles RLS - only admins can assign roles
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

CREATE POLICY "Only admins can assign roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_contractor_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contractor_applications_updated_at
  BEFORE UPDATE ON public.contractor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contractor_applications_updated_at();