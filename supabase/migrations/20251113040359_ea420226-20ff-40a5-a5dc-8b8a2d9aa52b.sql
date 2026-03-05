-- Create table to track lead stage transitions
CREATE TABLE IF NOT EXISTS public.lead_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_lead_stage_history_lead_id ON public.lead_stage_history(lead_id);
CREATE INDEX idx_lead_stage_history_changed_at ON public.lead_stage_history(changed_at);

-- Enable RLS
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Estimators and admins can view stage history"
  ON public.lead_stage_history
  FOR SELECT
  USING (
    has_role(auth.uid(), 'estimator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Estimators and admins can insert stage history"
  ON public.lead_stage_history
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'estimator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create function to automatically log stage changes
CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_stage_history (
      lead_id,
      from_status,
      to_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on leads table
CREATE TRIGGER trigger_log_lead_stage_change
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_stage_change();

-- Create table for stage timeout configurations
CREATE TABLE IF NOT EXISTS public.lead_stage_timeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_status TEXT NOT NULL UNIQUE,
  timeout_hours INTEGER NOT NULL,
  warning_hours INTEGER NOT NULL,
  notification_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_stage_timeouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage stage timeouts"
  ON public.lead_stage_timeouts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can view stage timeouts"
  ON public.lead_stage_timeouts
  FOR SELECT
  USING (
    has_role(auth.uid(), 'estimator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Insert default timeout configurations (in hours)
INSERT INTO public.lead_stage_timeouts (stage_status, timeout_hours, warning_hours) VALUES
  ('new_lead', 2, 1),              -- 2 hours max, warn after 1 hour
  ('call_24h', 24, 20),             -- 24 hours max, warn after 20 hours
  ('walkthrough', 48, 36),          -- 48 hours max, warn after 36 hours
  ('scope_sent', 72, 60),           -- 72 hours max, warn after 60 hours
  ('scope_adjustment', 48, 36),     -- 48 hours max, warn after 36 hours
  ('architectural_design', 168, 144), -- 1 week max, warn after 6 days
  ('bid_room', 120, 96),            -- 5 days max, warn after 4 days
  ('smart_bid_3', 72, 60),          -- 3 days max, warn after 2.5 days
  ('bid_accepted', 24, 20)          -- 24 hours max, warn after 20 hours
ON CONFLICT (stage_status) DO NOTHING;

-- Add updated_at trigger
CREATE TRIGGER update_lead_stage_timeouts_updated_at
  BEFORE UPDATE ON public.lead_stage_timeouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();