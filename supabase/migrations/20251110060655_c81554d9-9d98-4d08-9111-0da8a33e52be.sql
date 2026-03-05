-- Create pricing templates table
CREATE TABLE public.pricing_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template items junction table
CREATE TABLE public.template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.pricing_templates(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('standard', 'custom')),
  pricing_guide_id UUID REFERENCES public.pricing_guide(id) ON DELETE CASCADE,
  custom_item_id UUID REFERENCES public.contractor_pricing_items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_item_reference CHECK (
    (item_type = 'standard' AND pricing_guide_id IS NOT NULL AND custom_item_id IS NULL) OR
    (item_type = 'custom' AND custom_item_id IS NOT NULL AND pricing_guide_id IS NULL)
  )
);

-- Enable RLS
ALTER TABLE public.pricing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pricing_templates
CREATE POLICY "Contractors can view their own templates"
  ON public.pricing_templates
  FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can insert their own templates"
  ON public.pricing_templates
  FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update their own templates"
  ON public.pricing_templates
  FOR UPDATE
  USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can delete their own templates"
  ON public.pricing_templates
  FOR DELETE
  USING (auth.uid() = contractor_id);

-- RLS Policies for template_items
CREATE POLICY "Contractors can view items in their templates"
  ON public.template_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pricing_templates
      WHERE id = template_items.template_id
      AND contractor_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can insert items in their templates"
  ON public.template_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pricing_templates
      WHERE id = template_items.template_id
      AND contractor_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can update items in their templates"
  ON public.template_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pricing_templates
      WHERE id = template_items.template_id
      AND contractor_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can delete items in their templates"
  ON public.template_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pricing_templates
      WHERE id = template_items.template_id
      AND contractor_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_pricing_templates_contractor ON public.pricing_templates(contractor_id);
CREATE INDEX idx_template_items_template ON public.template_items(template_id);
CREATE INDEX idx_template_items_pricing_guide ON public.template_items(pricing_guide_id);
CREATE INDEX idx_template_items_custom ON public.template_items(custom_item_id);