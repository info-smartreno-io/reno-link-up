-- Create expense_categories table for custom categories
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Package',
  color TEXT DEFAULT 'gray',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Core details
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL DEFAULT 'Other',
  vendor TEXT,
  payment_method TEXT DEFAULT 'cash',
  
  -- Receipt
  receipt_file_path TEXT,
  receipt_file_name TEXT,
  receipt_thumbnail_url TEXT,
  
  -- Workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Reimbursement
  is_reimbursable BOOLEAN DEFAULT false,
  reimbursed_at TIMESTAMP WITH TIME ZONE,
  reimbursement_reference TEXT,
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  is_billable BOOLEAN DEFAULT false,
  tax_deductible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_expenses_contractor_id ON public.expenses(contractor_id);
CREATE INDEX idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_category_name ON public.expenses(category_name);
CREATE INDEX idx_expense_categories_contractor_id ON public.expense_categories(contractor_id);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses for their contractor"
ON public.expenses FOR SELECT
USING (
  contractor_id = auth.uid() 
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.contractor_users 
    WHERE user_id = auth.uid() 
    AND contractor_id = expenses.contractor_id 
    AND is_active = true
  )
);

CREATE POLICY "Users can create expenses"
ON public.expenses FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own expenses or as admin"
ON public.expenses FOR UPDATE
USING (
  created_by = auth.uid()
  OR contractor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.contractor_users 
    WHERE user_id = auth.uid() 
    AND contractor_id = expenses.contractor_id 
    AND role IN ('contractor_admin', 'owner')
    AND is_active = true
  )
);

CREATE POLICY "Users can delete their own expenses"
ON public.expenses FOR DELETE
USING (created_by = auth.uid() OR contractor_id = auth.uid());

-- RLS Policies for expense_categories
CREATE POLICY "Users can view expense categories"
ON public.expense_categories FOR SELECT
USING (
  is_default = true 
  OR contractor_id = auth.uid()
  OR contractor_id IS NULL
);

CREATE POLICY "Contractors can manage their categories"
ON public.expense_categories FOR ALL
USING (contractor_id = auth.uid() OR contractor_id IS NULL);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_expenses_updated_at();

CREATE TRIGGER update_expense_categories_updated_at
BEFORE UPDATE ON public.expense_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_expenses_updated_at();

-- Insert default expense categories
INSERT INTO public.expense_categories (name, icon, color, is_default, sort_order) VALUES
('Materials', 'Package', 'blue', true, 1),
('Labor', 'HardHat', 'orange', true, 2),
('Equipment', 'Wrench', 'purple', true, 3),
('Travel', 'Car', 'green', true, 4),
('Fuel', 'Fuel', 'yellow', true, 5),
('Meals', 'UtensilsCrossed', 'red', true, 6),
('Office Supplies', 'Paperclip', 'gray', true, 7),
('Subcontractor', 'Users', 'indigo', true, 8),
('Permits & Fees', 'FileText', 'teal', true, 9),
('Insurance', 'Shield', 'pink', true, 10),
('Utilities', 'Zap', 'cyan', true, 11),
('Other', 'MoreHorizontal', 'slate', true, 12);

-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-receipts',
  'expense-receipts',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for expense-receipts bucket
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'expense-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'expense-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their receipts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'expense-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'expense-receipts' AND auth.uid() IS NOT NULL);