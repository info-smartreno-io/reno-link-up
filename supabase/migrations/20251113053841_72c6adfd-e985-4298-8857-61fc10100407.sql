-- Create contractors table (company-level)
CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  legal_name TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  license_number TEXT,
  logo_url TEXT,
  trade_focus TEXT,
  service_areas TEXT[],
  is_active BOOLEAN DEFAULT true
);

-- Create contractor_users table (people inside that company)
CREATE TABLE IF NOT EXISTS public.contractor_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT CHECK (role IN (
    'contractor_admin',
    'inside_sales',
    'estimator',
    'project_coordinator',
    'project_manager',
    'accounting',
    'field_super',
    'viewer'
  )) NOT NULL,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  invitation_accepted_at TIMESTAMPTZ,
  UNIQUE(contractor_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contractor_users_contractor_id 
  ON public.contractor_users(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_users_user_id 
  ON public.contractor_users(user_id);

-- Enable RLS
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractors table
CREATE POLICY "Users can view their contractor company"
  ON public.contractors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_users cu
      WHERE cu.contractor_id = contractors.id
        AND cu.user_id = auth.uid()
        AND cu.is_active = true
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractor admins can update their company"
  ON public.contractors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_users cu
      WHERE cu.contractor_id = contractors.id
        AND cu.user_id = auth.uid()
        AND cu.role = 'contractor_admin'
        AND cu.is_active = true
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can insert contractors"
  ON public.contractors FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for contractor_users table
CREATE POLICY "Users can view team members from their contractor"
  ON public.contractor_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_users cu
      WHERE cu.contractor_id = contractor_users.contractor_id
        AND cu.user_id = auth.uid()
        AND cu.is_active = true
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractor admins can manage team members"
  ON public.contractor_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_users cu
      WHERE cu.contractor_id = contractor_users.contractor_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'contractor_admin'
        AND cu.is_active = true
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contractor_users cu
      WHERE cu.contractor_id = contractor_users.contractor_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'contractor_admin'
        AND cu.is_active = true
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_contractor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_updated_at();

CREATE TRIGGER update_contractor_users_updated_at
  BEFORE UPDATE ON public.contractor_users
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_updated_at();