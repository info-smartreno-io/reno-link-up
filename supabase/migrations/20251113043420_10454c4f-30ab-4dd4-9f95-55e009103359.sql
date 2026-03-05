-- Create win-back campaigns table
CREATE TABLE IF NOT EXISTS public.winback_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_status TEXT NOT NULL CHECK (target_status IN ('lost', 'on_hold')),
  trigger_after_days INTEGER NOT NULL DEFAULT 30,
  email_subject TEXT NOT NULL,
  email_template TEXT NOT NULL,
  offer_details TEXT,
  discount_percentage INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create win-back campaign sends tracking table
CREATE TABLE IF NOT EXISTS public.winback_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.winback_campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  response_type TEXT CHECK (response_type IN ('interested', 'not_interested', 'no_response')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, lead_id)
);

-- Enable RLS
ALTER TABLE public.winback_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winback_campaign_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Estimators and admins can view campaigns"
  ON public.winback_campaigns
  FOR SELECT
  USING (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators and admins can create campaigns"
  ON public.winback_campaigns
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators and admins can update campaigns"
  ON public.winback_campaigns
  FOR UPDATE
  USING (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete campaigns"
  ON public.winback_campaigns
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for campaign sends
CREATE POLICY "Estimators and admins can view campaign sends"
  ON public.winback_campaign_sends
  FOR SELECT
  USING (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create campaign sends"
  ON public.winback_campaign_sends
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Estimators and admins can update campaign sends"
  ON public.winback_campaign_sends
  FOR UPDATE
  USING (has_role(auth.uid(), 'estimator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_winback_campaigns_status ON public.winback_campaigns(target_status) WHERE is_active = true;
CREATE INDEX idx_winback_campaign_sends_lead ON public.winback_campaign_sends(lead_id);
CREATE INDEX idx_winback_campaign_sends_campaign ON public.winback_campaign_sends(campaign_id);

-- Trigger for updated_at
CREATE TRIGGER update_winback_campaigns_updated_at
  BEFORE UPDATE ON public.winback_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get eligible leads for win-back campaigns
CREATE OR REPLACE FUNCTION public.get_eligible_winback_leads(campaign_id_param UUID)
RETURNS TABLE (
  lead_id UUID,
  lead_name TEXT,
  email TEXT,
  phone TEXT,
  project_type TEXT,
  lost_date TIMESTAMP WITH TIME ZONE,
  lost_reason TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_record RECORD;
BEGIN
  -- Get campaign details
  SELECT * INTO campaign_record
  FROM public.winback_campaigns
  WHERE id = campaign_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;
  
  -- Return eligible leads
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.email,
    l.phone,
    l.project_type,
    lsh.changed_at,
    lsh.reason
  FROM public.leads l
  INNER JOIN public.lead_stage_history lsh ON lsh.lead_id = l.id
  WHERE l.status = campaign_record.target_status
    AND lsh.to_status = campaign_record.target_status
    AND lsh.changed_at <= NOW() - (campaign_record.trigger_after_days || ' days')::INTERVAL
    AND NOT EXISTS (
      -- Exclude leads that already received this campaign
      SELECT 1 FROM public.winback_campaign_sends wcs
      WHERE wcs.campaign_id = campaign_id_param
        AND wcs.lead_id = l.id
    )
  ORDER BY lsh.changed_at ASC;
END;
$$;