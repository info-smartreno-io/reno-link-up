-- Create municipality fee schedules table
CREATE TABLE IF NOT EXISTS public.municipality_fee_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL,
  municipality text NOT NULL,
  permit_type text NOT NULL,
  base_fee numeric(10,2) NOT NULL DEFAULT 0,
  per_sqft_fee numeric(10,4),
  per_valuation_fee numeric(10,6),
  minimum_fee numeric(10,2),
  maximum_fee numeric(10,2),
  flat_fee_applies boolean DEFAULT false,
  notes text,
  effective_date date DEFAULT CURRENT_DATE,
  expires_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(state, municipality, permit_type, effective_date)
);

-- Add permit fee tracking columns to permits table
ALTER TABLE public.permits 
  ADD COLUMN IF NOT EXISTS calculated_fee numeric(10,2),
  ADD COLUMN IF NOT EXISTS actual_fee numeric(10,2),
  ADD COLUMN IF NOT EXISTS fee_paid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fee_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id),
  ADD COLUMN IF NOT EXISTS fee_breakdown jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text;

-- Create function to calculate permit fee
CREATE OR REPLACE FUNCTION public.calculate_permit_fee(
  p_state text,
  p_municipality text,
  p_permit_type text,
  p_square_footage integer DEFAULT NULL,
  p_project_value numeric DEFAULT NULL
)
RETURNS numeric AS $$
DECLARE
  v_fee_schedule record;
  v_calculated_fee numeric := 0;
  v_sqft_fee numeric := 0;
  v_value_fee numeric := 0;
BEGIN
  -- Get the active fee schedule
  SELECT * INTO v_fee_schedule
  FROM public.municipality_fee_schedules
  WHERE state = p_state
    AND municipality = p_municipality
    AND permit_type = p_permit_type
    AND effective_date <= CURRENT_DATE
    AND (expires_date IS NULL OR expires_date >= CURRENT_DATE)
  ORDER BY effective_date DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Return default fee if no schedule found
    RETURN 150.00;
  END IF;
  
  -- Calculate base fee
  v_calculated_fee := v_fee_schedule.base_fee;
  
  -- Add per square foot fee if applicable
  IF v_fee_schedule.per_sqft_fee IS NOT NULL AND p_square_footage IS NOT NULL THEN
    v_sqft_fee := v_fee_schedule.per_sqft_fee * p_square_footage;
    v_calculated_fee := v_calculated_fee + v_sqft_fee;
  END IF;
  
  -- Add per valuation fee if applicable
  IF v_fee_schedule.per_valuation_fee IS NOT NULL AND p_project_value IS NOT NULL THEN
    v_value_fee := v_fee_schedule.per_valuation_fee * p_project_value;
    v_calculated_fee := v_calculated_fee + v_value_fee;
  END IF;
  
  -- Apply minimum fee
  IF v_fee_schedule.minimum_fee IS NOT NULL AND v_calculated_fee < v_fee_schedule.minimum_fee THEN
    v_calculated_fee := v_fee_schedule.minimum_fee;
  END IF;
  
  -- Apply maximum fee
  IF v_fee_schedule.maximum_fee IS NOT NULL AND v_calculated_fee > v_fee_schedule.maximum_fee THEN
    v_calculated_fee := v_fee_schedule.maximum_fee;
  END IF;
  
  RETURN ROUND(v_calculated_fee, 2);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Insert some default fee schedules for common NJ municipalities
INSERT INTO public.municipality_fee_schedules 
  (state, municipality, permit_type, base_fee, per_sqft_fee, minimum_fee, maximum_fee, notes)
VALUES
  ('NJ', 'Paramus', 'building', 100.00, 0.15, 150.00, 5000.00, 'Residential building permit'),
  ('NJ', 'Paramus', 'electrical', 75.00, NULL, 75.00, 500.00, 'Electrical permit'),
  ('NJ', 'Paramus', 'plumbing', 75.00, NULL, 75.00, 500.00, 'Plumbing permit'),
  ('NJ', 'Jersey City', 'building', 125.00, 0.18, 200.00, 7500.00, 'Residential building permit'),
  ('NJ', 'Jersey City', 'electrical', 85.00, NULL, 85.00, 600.00, 'Electrical permit'),
  ('NJ', 'Jersey City', 'plumbing', 85.00, NULL, 85.00, 600.00, 'Plumbing permit'),
  ('NJ', 'Hoboken', 'building', 150.00, 0.20, 250.00, 8000.00, 'Residential building permit'),
  ('NJ', 'Hoboken', 'electrical', 100.00, NULL, 100.00, 700.00, 'Electrical permit'),
  ('NJ', 'Hoboken', 'plumbing', 100.00, NULL, 100.00, 700.00, 'Plumbing permit'),
  ('NJ', 'Morristown', 'building', 110.00, 0.16, 175.00, 6000.00, 'Residential building permit'),
  ('NJ', 'Morristown', 'electrical', 80.00, NULL, 80.00, 550.00, 'Electrical permit'),
  ('NJ', 'Morristown', 'plumbing', 80.00, NULL, 80.00, 550.00, 'Plumbing permit')
ON CONFLICT (state, municipality, permit_type, effective_date) DO NOTHING;

-- Enable RLS on municipality_fee_schedules
ALTER TABLE public.municipality_fee_schedules ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage fee schedules
CREATE POLICY "Admins can manage municipality fee schedules"
  ON public.municipality_fee_schedules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to view fee schedules
CREATE POLICY "Authenticated users can view fee schedules"
  ON public.municipality_fee_schedules
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create trigger to update municipality_fee_schedules timestamp
CREATE TRIGGER update_municipality_fee_schedules_updated_at
  BEFORE UPDATE ON public.municipality_fee_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_municipality_fees_lookup 
  ON public.municipality_fee_schedules(state, municipality, permit_type, effective_date);

COMMENT ON TABLE public.municipality_fee_schedules IS 'Fee schedules for building permits by municipality';
COMMENT ON FUNCTION public.calculate_permit_fee IS 'Calculate permit fee based on municipality fee schedule';