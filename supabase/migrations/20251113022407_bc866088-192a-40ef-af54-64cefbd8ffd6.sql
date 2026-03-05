-- Create table for contractor email template settings
CREATE TABLE IF NOT EXISTS public.contractor_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  company_name TEXT NOT NULL DEFAULT 'SmartReno',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#667eea',
  secondary_color TEXT DEFAULT '#764ba2',
  welcome_message TEXT DEFAULT 'Welcome to the team!',
  custom_footer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contractor_id)
);

-- Enable RLS
ALTER TABLE public.contractor_email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Contractors can view their own email templates"
ON public.contractor_email_templates
FOR SELECT
TO authenticated
USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Contractors can insert their own email templates"
ON public.contractor_email_templates
FOR INSERT
TO authenticated
WITH CHECK (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Contractors can update their own email templates"
ON public.contractor_email_templates
FOR UPDATE
TO authenticated
USING (contractor_id = auth.uid() OR has_role(auth.uid(), 'admin'));