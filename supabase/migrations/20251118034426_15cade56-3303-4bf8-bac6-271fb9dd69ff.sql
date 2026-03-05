-- Create image_slots table
CREATE TABLE IF NOT EXISTS public.image_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key TEXT NOT NULL UNIQUE,
  page_path TEXT NOT NULL,
  label TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  active_image_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create image_assets table
CREATE TABLE IF NOT EXISTS public.image_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.image_slots(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('ai', 'manual')),
  storage_path TEXT NOT NULL,
  prompt TEXT,
  style_tags TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key for active_image_id (after image_assets exists)
ALTER TABLE public.image_slots
ADD CONSTRAINT fk_active_image
FOREIGN KEY (active_image_id) REFERENCES public.image_assets(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.image_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read for active images, admin write
CREATE POLICY "Anyone can read image slots"
ON public.image_slots FOR SELECT
USING (true);

CREATE POLICY "Anyone can read approved image assets"
ON public.image_assets FOR SELECT
USING (status = 'approved' OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert image assets"
ON public.image_assets FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update image assets"
ON public.image_assets FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update image slots"
ON public.image_slots FOR UPDATE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_image_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER image_slots_updated_at
BEFORE UPDATE ON public.image_slots
FOR EACH ROW
EXECUTE FUNCTION update_image_slots_updated_at();

-- Seed core image slots
INSERT INTO public.image_slots (slot_key, page_path, label, aspect_ratio) VALUES
('home_hero', '/', 'Home Page Hero', '16:9'),
('interior_hero', '/interior-renovations', 'Interior Renovations Hero', '16:9'),
('additions_hero', '/home-additions', 'Home Additions Hero', '16:9'),
('basement_hero', '/basements', 'Basements Hero', '16:9'),
('kitchen_hero', '/kitchen-renovations', 'Kitchen Renovations Hero', '16:9'),
('bathroom_hero', '/bathroom-renovations', 'Bathroom Renovations Hero', '16:9'),
('bergen_hero', '/bergen-county', 'Bergen County Hero', '16:9'),
('passaic_hero', '/passaic-county', 'Passaic County Hero', '16:9'),
('essex_hero', '/essex-county', 'Essex County Hero', '16:9'),
('financing_hero', '/financing', 'Financing Page Hero', '16:9'),
('warranty_hero', '/warranty', 'Warranty Page Hero', '16:9')
ON CONFLICT (slot_key) DO NOTHING;

-- Create storage bucket for site images
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can read site images"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-images');

CREATE POLICY "Authenticated users can upload site images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-images');

CREATE POLICY "Authenticated users can update site images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-images');