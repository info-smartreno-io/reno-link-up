-- Create material_lead_times table
CREATE TABLE IF NOT EXISTS public.material_lead_times (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_name TEXT NOT NULL,
  average_days INTEGER NOT NULL,
  vendor TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  risk_factor NUMERIC(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risk_scores table
CREATE TABLE IF NOT EXISTS public.risk_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  risk_score NUMERIC(5,2) NOT NULL,
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('green', 'yellow', 'red')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_lead_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;

-- Policies for material_lead_times
CREATE POLICY "Allow authenticated users to view material lead times"
  ON public.material_lead_times FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage material lead times"
  ON public.material_lead_times FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Policies for risk_scores
CREATE POLICY "Allow authenticated users to view risk scores"
  ON public.risk_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins and PMs to insert risk scores"
  ON public.risk_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR 
    public.has_role(auth.uid(), 'project_manager'::app_role)
  );

-- Create indexes
CREATE INDEX idx_material_lead_times_material ON public.material_lead_times(material_name);
CREATE INDEX idx_risk_scores_project ON public.risk_scores(project_id);
CREATE INDEX idx_risk_scores_created ON public.risk_scores(created_at DESC);

-- Update trigger for risk_scores
CREATE TRIGGER update_risk_scores_updated_at
  BEFORE UPDATE ON public.risk_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();