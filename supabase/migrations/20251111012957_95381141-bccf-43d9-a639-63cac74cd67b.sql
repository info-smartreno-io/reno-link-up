-- Create change_orders table
CREATE TABLE IF NOT EXISTS public.change_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.contractor_projects(id),
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  change_order_number TEXT NOT NULL,
  description TEXT NOT NULL,
  original_amount NUMERIC NOT NULL DEFAULT 0,
  change_amount NUMERIC NOT NULL DEFAULT 0,
  new_total_amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  line_items JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  internal_notes TEXT
);

-- Enable RLS
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view all change orders"
  ON public.change_orders
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert change orders"
  ON public.change_orders
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update change orders"
  ON public.change_orders
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete change orders"
  ON public.change_orders
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Estimators can view and create
CREATE POLICY "Estimators can view change orders"
  ON public.change_orders
  FOR SELECT
  USING (has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Estimators can insert change orders"
  ON public.change_orders
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Estimators can update change orders"
  ON public.change_orders
  FOR UPDATE
  USING (has_role(auth.uid(), 'estimator'::app_role));

-- Contractors can view their project change orders
CREATE POLICY "Contractors can view their change orders"
  ON public.change_orders
  FOR SELECT
  USING (
    has_role(auth.uid(), 'contractor'::app_role) AND
    project_id IN (
      SELECT id FROM public.contractor_projects WHERE contractor_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX idx_change_orders_project_id ON public.change_orders(project_id);
CREATE INDEX idx_change_orders_status ON public.change_orders(status);
CREATE INDEX idx_change_orders_created_at ON public.change_orders(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_change_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_change_orders_updated_at
  BEFORE UPDATE ON public.change_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_change_orders_updated_at();