-- Create material_selections table
CREATE TABLE IF NOT EXISTS public.material_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.contractor_projects(id),
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  homeowner_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL,
  item_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  deadline DATE,
  notes TEXT,
  selected_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_selections ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view all material selections"
  ON public.material_selections
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert material selections"
  ON public.material_selections
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update material selections"
  ON public.material_selections
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete material selections"
  ON public.material_selections
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Estimators can view and update
CREATE POLICY "Estimators can view material selections"
  ON public.material_selections
  FOR SELECT
  USING (has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Estimators can update material selections"
  ON public.material_selections
  FOR UPDATE
  USING (has_role(auth.uid(), 'estimator'::app_role));

-- Homeowners can view their own selections
CREATE POLICY "Homeowners can view their selections"
  ON public.material_selections
  FOR SELECT
  USING (auth.uid() = homeowner_id);

CREATE POLICY "Homeowners can insert their selections"
  ON public.material_selections
  FOR INSERT
  WITH CHECK (auth.uid() = selected_by);

-- Create index for better performance
CREATE INDEX idx_material_selections_project_id ON public.material_selections(project_id);
CREATE INDEX idx_material_selections_homeowner_id ON public.material_selections(homeowner_id);
CREATE INDEX idx_material_selections_status ON public.material_selections(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_material_selections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_material_selections_updated_at
  BEFORE UPDATE ON public.material_selections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_material_selections_updated_at();