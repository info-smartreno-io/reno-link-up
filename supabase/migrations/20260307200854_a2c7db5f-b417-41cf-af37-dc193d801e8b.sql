
ALTER TABLE public.design_professional_profiles
  ADD COLUMN IF NOT EXISTS has_showroom boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS showroom_address text,
  ADD COLUMN IF NOT EXISTS showroom_description text,
  ADD COLUMN IF NOT EXISTS is_licensed_architecture_firm boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_stamp_plans boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS firm_insurance_type text,
  ADD COLUMN IF NOT EXISTS firm_liability_coverage text,
  ADD COLUMN IF NOT EXISTS recent_estimate_url text,
  ADD COLUMN IF NOT EXISTS contract_template_url text,
  ADD COLUMN IF NOT EXISTS initial_consultation_fee_note text;
