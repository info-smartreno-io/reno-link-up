-- Create lead_activities table to track all activity types
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'call', 'email', 'note', 'walkthrough_scheduled', 'status_change', 'proposal_sent', 'estimator_assigned', etc.
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add last activity columns to leads table for quick display
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_activity_type TEXT,
ADD COLUMN IF NOT EXISTS last_activity_by UUID;

-- Create index for efficient querying
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_performed_at ON public.lead_activities(performed_at DESC);
CREATE INDEX idx_leads_last_activity_at ON public.leads(last_activity_at DESC);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_activities
CREATE POLICY "Users can view lead activities" 
ON public.lead_activities 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert lead activities" 
ON public.lead_activities 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to update leads.last_activity_* when activity is inserted
CREATE OR REPLACE FUNCTION public.update_lead_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.leads
  SET 
    last_activity_at = NEW.performed_at,
    last_activity_type = NEW.activity_type,
    last_activity_by = NEW.performed_by
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update last activity on leads
CREATE TRIGGER trigger_update_lead_last_activity
AFTER INSERT ON public.lead_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_lead_last_activity();