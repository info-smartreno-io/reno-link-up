-- Create smartplans table
CREATE TABLE public.smartplans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('three_three_three', 'eisenhower', 'blank')),
  notes TEXT,
  is_shared_with_contractor BOOLEAN NOT NULL DEFAULT false,
  notify_project_manager BOOLEAN NOT NULL DEFAULT false,
  notify_coordinator BOOLEAN NOT NULL DEFAULT false,
  notify_estimator BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create smartplan_items table
CREATE TABLE public.smartplan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  smartplan_id UUID NOT NULL REFERENCES public.smartplans(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  content TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  assigned_to_user_id UUID,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smartplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartplan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for smartplans
CREATE POLICY "Admins can view all smartplans"
  ON public.smartplans FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can view all smartplans"
  ON public.smartplans FOR SELECT
  USING (has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins can insert smartplans"
  ON public.smartplans FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can insert smartplans"
  ON public.smartplans FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins can update smartplans"
  ON public.smartplans FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can update smartplans"
  ON public.smartplans FOR UPDATE
  USING (has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins can delete smartplans"
  ON public.smartplans FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can view shared smartplans for their projects"
  ON public.smartplans FOR SELECT
  USING (
    is_shared_with_contractor = true 
    AND project_id IN (
      SELECT id FROM contractor_projects WHERE contractor_id = auth.uid()
    )
  );

-- RLS Policies for smartplan_items
CREATE POLICY "Admins can view all smartplan items"
  ON public.smartplan_items FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can view all smartplan items"
  ON public.smartplan_items FOR SELECT
  USING (has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins can insert smartplan items"
  ON public.smartplan_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can insert smartplan items"
  ON public.smartplan_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins can update smartplan items"
  ON public.smartplan_items FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can update smartplan items"
  ON public.smartplan_items FOR UPDATE
  USING (has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Admins can delete smartplan items"
  ON public.smartplan_items FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can view shared smartplan items"
  ON public.smartplan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM smartplans 
      WHERE smartplans.id = smartplan_items.smartplan_id 
      AND smartplans.is_shared_with_contractor = true
      AND smartplans.project_id IN (
        SELECT id FROM contractor_projects WHERE contractor_id = auth.uid()
      )
    )
  );

-- Create indexes
CREATE INDEX idx_smartplans_project_id ON public.smartplans(project_id);
CREATE INDEX idx_smartplans_owner_id ON public.smartplans(owner_id);
CREATE INDEX idx_smartplan_items_smartplan_id ON public.smartplan_items(smartplan_id);
CREATE INDEX idx_smartplan_items_assigned_to ON public.smartplan_items(assigned_to_user_id);

-- Create update trigger function
CREATE OR REPLACE FUNCTION public.update_smartplan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_smartplans_updated_at
  BEFORE UPDATE ON public.smartplans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_smartplan_updated_at();

CREATE TRIGGER update_smartplan_items_updated_at
  BEFORE UPDATE ON public.smartplan_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_smartplan_updated_at();