-- Create KPI goals table for tracking sales targets
CREATE TABLE IF NOT EXISTS public.kpi_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
  year INTEGER NOT NULL,
  month INTEGER CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
  quarter INTEGER CHECK (quarter IS NULL OR (quarter >= 1 AND quarter <= 4)),
  goals JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(period, year, month, quarter)
);

-- Enable RLS
ALTER TABLE public.kpi_goals ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage goals
CREATE POLICY "Admins can view kpi_goals"
  ON public.kpi_goals
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create kpi_goals"
  ON public.kpi_goals
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update kpi_goals"
  ON public.kpi_goals
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete kpi_goals"
  ON public.kpi_goals
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_kpi_goals_updated_at
  BEFORE UPDATE ON public.kpi_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

-- Create index for faster queries
CREATE INDEX idx_kpi_goals_period_lookup ON public.kpi_goals(period, year, month, quarter);