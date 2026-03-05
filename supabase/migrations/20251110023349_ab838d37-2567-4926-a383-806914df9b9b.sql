-- Create pricing database table
CREATE TABLE public.pricing_guide (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  item_name text NOT NULL,
  unit text NOT NULL,
  material_cost numeric NOT NULL DEFAULT 0,
  labor_cost numeric NOT NULL DEFAULT 0,
  region text NOT NULL DEFAULT 'north-jersey',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(item_name, region)
);

-- Enable RLS
ALTER TABLE public.pricing_guide ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Read-only for estimators, admins can manage
CREATE POLICY "Anyone can view pricing guide"
  ON public.pricing_guide
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert pricing"
  ON public.pricing_guide
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update pricing"
  ON public.pricing_guide
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete pricing"
  ON public.pricing_guide
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_pricing_guide_updated_at
  BEFORE UPDATE ON public.pricing_guide
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

-- Create index for faster queries
CREATE INDEX idx_pricing_guide_category ON public.pricing_guide(category);
CREATE INDEX idx_pricing_guide_region ON public.pricing_guide(region);

-- Insert common North Jersey pricing data
INSERT INTO public.pricing_guide (category, item_name, unit, material_cost, labor_cost, region, notes) VALUES
-- Kitchen
('kitchen', 'Custom Kitchen Cabinets - Stock Grade', 'linear foot', 150, 75, 'north-jersey', 'Basic stock cabinets with standard finishes'),
('kitchen', 'Custom Kitchen Cabinets - Semi-Custom', 'linear foot', 300, 100, 'north-jersey', 'Semi-custom cabinets with more finish options'),
('kitchen', 'Custom Kitchen Cabinets - Full Custom', 'linear foot', 500, 150, 'north-jersey', 'High-end custom cabinets with premium materials'),
('kitchen', 'Granite Countertops - Mid-Grade', 'square foot', 65, 25, 'north-jersey', 'Standard granite with professional installation'),
('kitchen', 'Quartz Countertops - Mid-Grade', 'square foot', 85, 30, 'north-jersey', 'Engineered quartz countertops'),
('kitchen', 'Marble Countertops - Premium', 'square foot', 120, 40, 'north-jersey', 'Premium marble with sealing'),
('kitchen', 'Subway Tile Backsplash', 'square foot', 12, 18, 'north-jersey', '3x6 subway tile with grout'),
('kitchen', 'Stainless Steel Appliance Package - Mid-Range', 'set', 3500, 500, 'north-jersey', 'Refrigerator, range, dishwasher, microwave'),
('kitchen', 'Kitchen Island Installation', 'each', 800, 600, 'north-jersey', 'Standard island base with countertop'),
('kitchen', 'Undermount Sink Installation', 'each', 300, 200, 'north-jersey', 'Includes sink and faucet'),
('kitchen', 'Kitchen Faucet - Mid-Range', 'each', 250, 150, 'north-jersey', 'Quality pull-down faucet'),
('kitchen', 'Garbage Disposal Installation', 'each', 150, 125, 'north-jersey', 'Standard 3/4 HP disposal'),

-- Bathroom
('bathroom', 'Bathroom Vanity - 48 inch', 'each', 600, 400, 'north-jersey', 'Includes cabinet, countertop, and sink'),
('bathroom', 'Vanity Top - Quartz 48 inch', 'each', 500, 200, 'north-jersey', 'Engineered quartz vanity top'),
('bathroom', 'Toilet - Mid-Range', 'each', 350, 250, 'north-jersey', 'Standard two-piece toilet'),
('bathroom', 'Toilet - Dual Flush', 'each', 500, 300, 'north-jersey', 'Water-efficient dual flush'),
('bathroom', 'Bathtub - Standard Alcove', 'each', 600, 800, 'north-jersey', 'Acrylic alcove tub with surround'),
('bathroom', 'Walk-in Shower Installation', 'each', 1800, 2200, 'north-jersey', 'Tile shower with glass door'),
('bathroom', 'Shower Tile - Ceramic', 'square foot', 8, 15, 'north-jersey', 'Standard ceramic wall tile'),
('bathroom', 'Shower Tile - Porcelain', 'square foot', 12, 18, 'north-jersey', 'Premium porcelain tile'),
('bathroom', 'Shower Door - Semi-Frameless', 'each', 600, 400, 'north-jersey', 'Semi-frameless glass door'),
('bathroom', 'Bathroom Faucet - Chrome', 'each', 150, 125, 'north-jersey', 'Standard chrome finish faucet'),
('bathroom', 'Exhaust Fan with Light', 'each', 120, 180, 'north-jersey', 'Bathroom ventilation fan'),

-- Flooring
('flooring', 'Luxury Vinyl Plank', 'square foot', 4, 3, 'north-jersey', 'Waterproof LVP flooring'),
('flooring', 'Hardwood Flooring - Oak', 'square foot', 8, 5, 'north-jersey', 'Solid oak hardwood'),
('flooring', 'Hardwood Flooring - Engineered', 'square foot', 6, 4, 'north-jersey', 'Engineered hardwood'),
('flooring', 'Porcelain Tile - 12x24', 'square foot', 6, 8, 'north-jersey', 'Large format porcelain tile'),
('flooring', 'Ceramic Tile - Standard', 'square foot', 4, 6, 'north-jersey', 'Standard ceramic floor tile'),
('flooring', 'Carpet - Mid-Grade', 'square foot', 3, 2, 'north-jersey', 'Residential grade carpet with pad'),

-- Electrical
('electrical', 'Recessed LED Light Installation', 'each', 35, 125, 'north-jersey', 'LED can light with trim'),
('electrical', 'Outlet Installation/Replacement', 'each', 5, 75, 'north-jersey', 'Standard outlet replacement'),
('electrical', 'GFCI Outlet Installation', 'each', 15, 90, 'north-jersey', 'Required in wet areas'),
('electrical', 'Light Fixture Installation', 'each', 0, 125, 'north-jersey', 'Labor only - fixture by owner'),
('electrical', 'Ceiling Fan Installation', 'each', 0, 200, 'north-jersey', 'Labor only - fan by owner'),
('electrical', 'Electrical Panel Upgrade - 200A', 'each', 1500, 1500, 'north-jersey', 'Panel upgrade with permits'),

-- Plumbing
('plumbing', 'Water Line Installation', 'linear foot', 8, 35, 'north-jersey', 'PEX water line'),
('plumbing', 'Drain Line Installation', 'linear foot', 12, 40, 'north-jersey', 'PVC drain line'),
('plumbing', 'Fixture Supply Line', 'each', 15, 50, 'north-jersey', 'Braided supply line'),
('plumbing', 'Shut-off Valve Installation', 'each', 25, 75, 'north-jersey', 'Angle stop valve'),

-- General Labor
('labor', 'Demolition - Kitchen', 'each', 0, 1200, 'north-jersey', 'Complete kitchen demo and disposal'),
('labor', 'Demolition - Bathroom', 'each', 0, 800, 'north-jersey', 'Complete bathroom demo and disposal'),
('labor', 'Drywall Repair', 'square foot', 1, 4, 'north-jersey', 'Patch and finish drywall'),
('labor', 'Painting - Interior', 'square foot', 0.50, 1.50, 'north-jersey', 'Two coats premium paint'),
('labor', 'Trim/Molding Installation', 'linear foot', 3, 5, 'north-jersey', 'Crown or base molding'),

-- Permits and Fees
('permits', 'Kitchen Renovation Permit', 'each', 500, 0, 'north-jersey', 'Typical permit cost'),
('permits', 'Bathroom Renovation Permit', 'each', 350, 0, 'north-jersey', 'Typical permit cost'),
('permits', 'Electrical Permit', 'each', 200, 0, 'north-jersey', 'Electrical work permit'),
('permits', 'Plumbing Permit', 'each', 200, 0, 'north-jersey', 'Plumbing work permit'),
('permits', 'Building Permit - Addition', 'each', 1500, 0, 'north-jersey', 'New construction permit'),

-- Miscellaneous
('misc', 'Dumpster Rental - 20 yard', 'week', 450, 0, 'north-jersey', 'Construction waste disposal'),
('misc', 'Final Cleanup', 'each', 0, 400, 'north-jersey', 'Post-construction cleaning'),
('misc', 'Project Management', 'day', 0, 350, 'north-jersey', 'Daily project management rate'),
('misc', 'General Contractor Overhead', 'percent', 15, 0, 'north-jersey', 'Percentage of total project cost');