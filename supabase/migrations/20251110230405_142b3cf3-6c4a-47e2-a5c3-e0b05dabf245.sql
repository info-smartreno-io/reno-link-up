-- Create interior designer applications table
CREATE TABLE public.interior_designer_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  portfolio_url TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  years_experience INTEGER NOT NULL,
  specializations TEXT[] NOT NULL,
  service_areas TEXT[] NOT NULL,
  certifications TEXT[] DEFAULT '{}',
  design_software TEXT[] DEFAULT '{}',
  project_types TEXT[] NOT NULL,
  professional_references JSONB DEFAULT '[]',
  why_join TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interior_designer_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application
CREATE POLICY "Anyone can submit interior designer application"
ON public.interior_designer_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all applications
CREATE POLICY "Admins can view all interior designer applications"
ON public.interior_designer_applications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update applications
CREATE POLICY "Admins can update interior designer applications"
ON public.interior_designer_applications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_interior_designer_applications_updated_at
BEFORE UPDATE ON public.interior_designer_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_application_updated_at();