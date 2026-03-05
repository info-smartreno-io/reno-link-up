-- Create catalog_items table for line item selection
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_number TEXT,
  description TEXT,
  category TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  default_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  preferred_vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  reorder_point INTEGER DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create po_receipts table for tracking deliveries
CREATE TABLE IF NOT EXISTS public.po_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID NOT NULL,
  items_received JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  discrepancies TEXT,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for catalog_items
CREATE POLICY "Contractors can view catalog items"
  ON public.catalog_items FOR SELECT
  USING (
    has_role(auth.uid(), 'contractor'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can insert catalog items"
  ON public.catalog_items FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    (has_role(auth.uid(), 'contractor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Contractors can update catalog items"
  ON public.catalog_items FOR UPDATE
  USING (
    has_role(auth.uid(), 'contractor'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can delete catalog items"
  ON public.catalog_items FOR DELETE
  USING (
    has_role(auth.uid(), 'contractor'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for po_receipts
CREATE POLICY "Contractors can view po receipts"
  ON public.po_receipts FOR SELECT
  USING (
    has_role(auth.uid(), 'contractor'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can insert po receipts"
  ON public.po_receipts FOR INSERT
  WITH CHECK (
    auth.uid() = received_by AND
    (has_role(auth.uid(), 'contractor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Contractors can update po receipts"
  ON public.po_receipts FOR UPDATE
  USING (
    has_role(auth.uid(), 'contractor'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create indexes
CREATE INDEX idx_catalog_items_category ON public.catalog_items(category);
CREATE INDEX idx_catalog_items_vendor ON public.catalog_items(preferred_vendor_id);
CREATE INDEX idx_po_receipts_po_id ON public.po_receipts(po_id);

-- Create trigger for catalog_items updated_at
CREATE TRIGGER update_catalog_items_updated_at
  BEFORE UPDATE ON public.catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for po_receipts updated_at
CREATE TRIGGER update_po_receipts_updated_at
  BEFORE UPDATE ON public.po_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();