
-- Add visibility flags to design_package_sections
ALTER TABLE public.design_package_sections
  ADD COLUMN IF NOT EXISTS internal_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contractor_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS homeowner_visible boolean NOT NULL DEFAULT false;

-- Add visibility flags to design_package_files
ALTER TABLE public.design_package_files
  ADD COLUMN IF NOT EXISTS internal_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contractor_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS homeowner_visible boolean NOT NULL DEFAULT false;

-- Add design_package_id to bid_packets
ALTER TABLE public.bid_packets
  ADD COLUMN IF NOT EXISTS design_package_id uuid REFERENCES public.design_packages(id),
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id),
  ADD COLUMN IF NOT EXISTS project_overview text,
  ADD COLUMN IF NOT EXISTS design_selections_notes text,
  ADD COLUMN IF NOT EXISTS permit_technical_notes text,
  ADD COLUMN IF NOT EXISTS site_logistics text,
  ADD COLUMN IF NOT EXISTS assumptions text,
  ADD COLUMN IF NOT EXISTS generated_from_design_package boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS generated_by uuid;
