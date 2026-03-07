
-- Create cost_codes table for contractor pricing library
CREATE TABLE public.cost_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('SF', 'LF', 'EA', 'HR', 'DAY', 'ALLOW')),
  labor_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  material_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contractor_portfolio_images table
CREATE TABLE public.contractor_portfolio_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  project_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to contractor_onboarding
ALTER TABLE public.contractor_onboarding
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS years_in_business INTEGER,
  ADD COLUMN IF NOT EXISTS crew_size INTEGER,
  ADD COLUMN IF NOT EXISTS trades TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS w9_url TEXT,
  ADD COLUMN IF NOT EXISTS license_expiry DATE,
  ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'in_progress';

-- Create storage bucket for contractor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-documents', 'contractor-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for cost_codes
ALTER TABLE public.cost_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage their own cost codes"
  ON public.cost_codes
  FOR ALL
  TO authenticated
  USING (
    contractor_id IN (
      SELECT cu.contractor_id FROM public.contractor_users cu WHERE cu.user_id = auth.uid() AND cu.is_active = true
    )
  )
  WITH CHECK (
    contractor_id IN (
      SELECT cu.contractor_id FROM public.contractor_users cu WHERE cu.user_id = auth.uid() AND cu.is_active = true
    )
  );

-- RLS for contractor_portfolio_images
ALTER TABLE public.contractor_portfolio_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage their own portfolio images"
  ON public.contractor_portfolio_images
  FOR ALL
  TO authenticated
  USING (
    contractor_id IN (
      SELECT cu.contractor_id FROM public.contractor_users cu WHERE cu.user_id = auth.uid() AND cu.is_active = true
    )
  )
  WITH CHECK (
    contractor_id IN (
      SELECT cu.contractor_id FROM public.contractor_users cu WHERE cu.user_id = auth.uid() AND cu.is_active = true
    )
  );

-- Public read access for portfolio images
CREATE POLICY "Anyone can view portfolio images"
  ON public.contractor_portfolio_images
  FOR SELECT
  TO anon
  USING (true);

-- Storage policies for contractor-documents bucket
CREATE POLICY "Authenticated users can upload contractor documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contractor-documents');

CREATE POLICY "Authenticated users can view contractor documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'contractor-documents');

CREATE POLICY "Users can update their own contractor documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'contractor-documents');
