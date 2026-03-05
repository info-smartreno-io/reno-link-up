-- Create contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE NOT NULL,
  contract_value DECIMAL(12,2) NOT NULL,
  financing_type TEXT DEFAULT 'cash' CHECK (financing_type IN ('cash', 'lender', 'hybrid')),
  lender_name TEXT,
  signature_status TEXT DEFAULT 'draft' CHECK (signature_status IN ('draft', 'sent', 'signed', 'amended')),
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES public.profiles(id),
  document_url TEXT,
  payment_schedule_template TEXT DEFAULT 'standard',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment_schedules table
CREATE TABLE public.payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_order INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  amount DECIMAL(12,2),
  trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('contract_signed', 'pm_milestone', 'closeout', 'manual')),
  trigger_milestone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid')),
  invoice_id UUID REFERENCES public.invoices(id),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create financing_cases table
CREATE TABLE public.financing_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  homeowner_name TEXT,
  homeowner_email TEXT,
  homeowner_phone TEXT,
  lender TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'declined', 'funded')),
  loan_amount DECIMAL(12,2),
  approved_amount DECIMAL(12,2),
  interest_rate DECIMAL(5,2),
  term_months INTEGER,
  notes TEXT,
  next_action TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add billing columns to change_orders if not exists
ALTER TABLE public.change_orders 
ADD COLUMN IF NOT EXISTS billed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS billed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billed_invoice_id UUID REFERENCES public.invoices(id),
ADD COLUMN IF NOT EXISTS collected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ;

-- Add closeout columns to projects if not exists
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS final_invoice_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS final_invoice_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS final_payment_collected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS final_payment_collected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS warranty_issued BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS warranty_issued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS finance_readonly BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_cases ENABLE ROW LEVEL SECURITY;

-- RLS policies for contracts
CREATE POLICY "Authenticated users can view contracts" ON public.contracts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Finance and admin can manage contracts" ON public.contracts
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'finance'::app_role)
  );

-- RLS policies for payment_schedules
CREATE POLICY "Authenticated users can view payment schedules" ON public.payment_schedules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Finance and admin can manage payment schedules" ON public.payment_schedules
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'finance'::app_role)
  );

-- RLS policies for financing_cases
CREATE POLICY "Authenticated users can view financing cases" ON public.financing_cases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Finance and admin can manage financing cases" ON public.financing_cases
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'finance'::app_role)
  );

-- Create indexes for performance
CREATE INDEX idx_contracts_project_id ON public.contracts(project_id);
CREATE INDEX idx_contracts_signature_status ON public.contracts(signature_status);
CREATE INDEX idx_payment_schedules_contract_id ON public.payment_schedules(contract_id);
CREATE INDEX idx_payment_schedules_status ON public.payment_schedules(status);
CREATE INDEX idx_financing_cases_project_id ON public.financing_cases(project_id);
CREATE INDEX idx_financing_cases_status ON public.financing_cases(status);

-- Update triggers for updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financing_cases_updated_at
  BEFORE UPDATE ON public.financing_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate contract numbers
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  year_prefix TEXT;
  sequence_num INT;
  contract_num TEXT;
BEGIN
  year_prefix := 'C-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-';
  
  SELECT COALESCE(MAX(SUBSTRING(contract_number FROM 9)::INT), 0) + 1
  INTO sequence_num
  FROM public.contracts
  WHERE contract_number LIKE year_prefix || '%';
  
  contract_num := year_prefix || LPAD(sequence_num::TEXT, 6, '0');
  RETURN contract_num;
END;
$$;