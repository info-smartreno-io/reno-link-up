-- Create vendor_applications table
CREATE TABLE public.vendor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Company information
  company_name TEXT NOT NULL,
  
  -- Contact information
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Business details
  product_categories TEXT NOT NULL,
  service_areas TEXT,
  message TEXT,
  
  -- Application status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Admin notes
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can submit vendor applications"
  ON public.vendor_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view all vendor applications"
  ON public.vendor_applications
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update vendor applications"
  ON public.vendor_applications
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete vendor applications"
  ON public.vendor_applications
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_vendor_applications_updated_at
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_application_updated_at();

-- Add index for faster queries
CREATE INDEX idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX idx_vendor_applications_created_at ON public.vendor_applications(created_at DESC);
CREATE INDEX idx_vendor_applications_email ON public.vendor_applications(email);