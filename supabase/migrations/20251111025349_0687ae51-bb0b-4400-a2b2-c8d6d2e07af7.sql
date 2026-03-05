-- Create invoice_payments table for tracking payment history
CREATE TABLE public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_payments
CREATE POLICY "Admins can view all invoice payments"
  ON public.invoice_payments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert invoice payments"
  ON public.invoice_payments FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update invoice payments"
  ON public.invoice_payments FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete invoice payments"
  ON public.invoice_payments FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can view their invoice payments"
  ON public.invoice_payments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_payments.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Professionals can insert their invoice payments"
  ON public.invoice_payments FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_payments.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Professionals can update their invoice payments"
  ON public.invoice_payments FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_payments.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Homeowners can view their invoice payments"
  ON public.invoice_payments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_payments.invoice_id 
    AND invoices.homeowner_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_invoice_payments_updated_at
  BEFORE UPDATE ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_updated_at();

-- Create function to update invoice amount_paid and status
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paid NUMERIC(10,2);
  invoice_total NUMERIC(10,2);
  new_status TEXT;
BEGIN
  -- Calculate total payments for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM invoice_payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Get invoice total
  SELECT total_amount INTO invoice_total
  FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Determine new status
  IF total_paid >= invoice_total THEN
    new_status := 'paid';
  ELSIF total_paid > 0 THEN
    new_status := 'partially_paid';
  ELSIF NEW.invoice_id IS NOT NULL THEN
    -- Keep current status if no payments
    SELECT status INTO new_status
    FROM invoices
    WHERE id = NEW.invoice_id;
  END IF;

  -- Update invoice
  UPDATE invoices
  SET 
    amount_paid = total_paid,
    status = new_status,
    paid_at = CASE 
      WHEN total_paid >= invoice_total THEN NOW()
      ELSE NULL
    END
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for payment tracking
CREATE TRIGGER update_invoice_on_payment_insert
  AFTER INSERT ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

CREATE TRIGGER update_invoice_on_payment_update
  AFTER UPDATE ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

CREATE TRIGGER update_invoice_on_payment_delete
  AFTER DELETE ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

-- Create index for faster lookups
CREATE INDEX idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_payment_date ON public.invoice_payments(payment_date);