
ALTER TABLE public.design_professional_profiles
ADD COLUMN IF NOT EXISTS offers_surveying boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS surveying_services text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS surveying_equipment text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS design_software text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cad_software text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rendering_software text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS project_management_software text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS other_software text;

ALTER TABLE public.design_packages
ADD COLUMN IF NOT EXISTS permit_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS renderings_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_override_rfp boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_override_reason text,
ADD COLUMN IF NOT EXISTS revision_notes text;
