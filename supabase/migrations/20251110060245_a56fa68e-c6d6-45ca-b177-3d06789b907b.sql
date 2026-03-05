-- Create contractor_pricing_items table for custom pricing
CREATE TABLE public.contractor_pricing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  material_cost NUMERIC NOT NULL DEFAULT 0,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contractor_pricing_items ENABLE ROW LEVEL SECURITY;

-- Contractors can view their own items
CREATE POLICY "Contractors can view their own pricing items"
  ON public.contractor_pricing_items
  FOR SELECT
  USING (auth.uid() = contractor_id);

-- Contractors can insert their own items
CREATE POLICY "Contractors can insert their own pricing items"
  ON public.contractor_pricing_items
  FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

-- Contractors can update their own items
CREATE POLICY "Contractors can update their own pricing items"
  ON public.contractor_pricing_items
  FOR UPDATE
  USING (auth.uid() = contractor_id);

-- Contractors can delete their own items
CREATE POLICY "Contractors can delete their own pricing items"
  ON public.contractor_pricing_items
  FOR DELETE
  USING (auth.uid() = contractor_id);

-- Admins can view all items
CREATE POLICY "Admins can view all contractor pricing items"
  ON public.contractor_pricing_items
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_contractor_pricing_items_updated_at
  BEFORE UPDATE ON public.contractor_pricing_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_updated_at();