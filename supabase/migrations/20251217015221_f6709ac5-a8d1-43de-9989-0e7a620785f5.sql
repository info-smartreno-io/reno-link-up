-- Inside Sales Portal Database Tables

-- 1. contractor_clients - Stores contractor client information for inside sales
CREATE TABLE public.contractor_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  primary_phone text,
  twilio_forward_number text UNIQUE,
  service_area text[] DEFAULT '{}',
  business_hours_json jsonb DEFAULT '{}',
  qualification_rules_json jsonb DEFAULT '{}',
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. inside_sales_agents - Maps users to inside sales agent role
CREATE TABLE public.inside_sales_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  agent_role text DEFAULT 'agent' CHECK (agent_role IN ('agent', 'manager')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. agent_client_assignments - Links agents to contractor clients
CREATE TABLE public.agent_client_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.inside_sales_agents(id) ON DELETE CASCADE NOT NULL,
  contractor_client_id uuid REFERENCES public.contractor_clients(id) ON DELETE CASCADE NOT NULL,
  priority text DEFAULT 'primary' CHECK (priority IN ('primary', 'backup')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (agent_id, contractor_client_id)
);

-- 4. call_logs - Records all calls handled by inside sales
CREATE TABLE public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_client_id uuid REFERENCES public.contractor_clients(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  agent_id uuid,
  twilio_call_sid text,
  from_number text NOT NULL,
  to_number text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  recording_url text,
  transcript_text text,
  call_summary text,
  disposition text NOT NULL CHECK (disposition IN (
    'qualified_booked', 'qualified_follow_up', 'not_a_fit',
    'existing_customer', 'vendor_other', 'missed', 'voicemail', 'completed'
  )),
  disposition_reason text,
  call_status text DEFAULT 'in_progress' CHECK (call_status IN (
    'in_progress', 'completed', 'missed', 'voicemail'
  )),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 5. inside_sales_appointments - Tracks appointments booked by inside sales
CREATE TABLE public.inside_sales_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid,
  contractor_client_id uuid REFERENCES public.contractor_clients(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  appointment_type text NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. lead_notes - Notes attached to leads by agents
CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid,
  note_text text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 7. scripts - Call scripts for contractors
CREATE TABLE public.scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_client_id uuid REFERENCES public.contractor_clients(id) ON DELETE CASCADE,
  call_type text NOT NULL CHECK (call_type IN ('new_lead', 'existing', 'vendor', 'other')),
  script_name text NOT NULL,
  script_json jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.contractor_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inside_sales_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inside_sales_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_clients
CREATE POLICY "Admins can manage contractor_clients"
  ON public.contractor_clients FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Inside sales agents can view assigned contractor_clients"
  ON public.contractor_clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inside_sales_agents isa
      JOIN public.agent_client_assignments aca ON aca.agent_id = isa.id
      WHERE isa.user_id = auth.uid() 
      AND aca.contractor_client_id = contractor_clients.id
      AND isa.is_active = true
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'inside_sales'::app_role)
  );

-- RLS Policies for inside_sales_agents
CREATE POLICY "Admins can manage inside_sales_agents"
  ON public.inside_sales_agents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view their own record"
  ON public.inside_sales_agents FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for agent_client_assignments
CREATE POLICY "Admins can manage agent_client_assignments"
  ON public.agent_client_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view their assignments"
  ON public.agent_client_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inside_sales_agents
      WHERE id = agent_client_assignments.agent_id AND user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for call_logs
CREATE POLICY "Admins can manage call_logs"
  ON public.call_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Inside sales can insert call_logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'inside_sales'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Inside sales can view call_logs"
  ON public.call_logs FOR SELECT
  USING (
    has_role(auth.uid(), 'inside_sales'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Inside sales can update call_logs"
  ON public.call_logs FOR UPDATE
  USING (
    has_role(auth.uid(), 'inside_sales'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for inside_sales_appointments
CREATE POLICY "Admins can manage inside_sales_appointments"
  ON public.inside_sales_appointments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Inside sales can insert appointments"
  ON public.inside_sales_appointments FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'inside_sales'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Inside sales can view appointments"
  ON public.inside_sales_appointments FOR SELECT
  USING (
    has_role(auth.uid(), 'inside_sales'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Inside sales can update appointments"
  ON public.inside_sales_appointments FOR UPDATE
  USING (
    has_role(auth.uid(), 'inside_sales'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for lead_notes
CREATE POLICY "Admins can manage lead_notes"
  ON public.lead_notes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Inside sales can insert lead_notes"
  ON public.lead_notes FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'inside_sales'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'estimator'::app_role)
  );

CREATE POLICY "Inside sales can view lead_notes"
  ON public.lead_notes FOR SELECT
  USING (
    has_role(auth.uid(), 'inside_sales'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'estimator'::app_role)
  );

-- RLS Policies for scripts
CREATE POLICY "Admins can manage scripts"
  ON public.scripts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Inside sales can view active scripts"
  ON public.scripts FOR SELECT
  USING (
    is_active = true 
    AND (
      has_role(auth.uid(), 'inside_sales'::app_role) 
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Create indexes for performance
CREATE INDEX idx_call_logs_lead_id ON public.call_logs(lead_id);
CREATE INDEX idx_call_logs_agent_id ON public.call_logs(agent_id);
CREATE INDEX idx_call_logs_created_at ON public.call_logs(created_at);
CREATE INDEX idx_call_logs_contractor_client_id ON public.call_logs(contractor_client_id);
CREATE INDEX idx_inside_sales_appointments_lead_id ON public.inside_sales_appointments(lead_id);
CREATE INDEX idx_inside_sales_appointments_scheduled_at ON public.inside_sales_appointments(scheduled_at);
CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX idx_scripts_contractor_client_id ON public.scripts(contractor_client_id);

-- Trigger for updated_at timestamps
CREATE TRIGGER update_contractor_clients_updated_at
  BEFORE UPDATE ON public.contractor_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inside_sales_appointments_updated_at
  BEFORE UPDATE ON public.inside_sales_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();