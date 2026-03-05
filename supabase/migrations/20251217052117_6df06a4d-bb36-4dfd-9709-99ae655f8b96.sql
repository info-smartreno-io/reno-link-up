-- ============================================
-- PHASE 1: CORE FINANCIAL AUTOMATION TRIGGERS
-- First create the payments table, then automation infrastructure
-- ============================================

-- 1. Create payments table if not exists
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  invoice_id UUID REFERENCES public.invoices(id),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  payment_type TEXT NOT NULL DEFAULT 'invoice_payment',
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'finance'::app_role));

CREATE POLICY "Users can create their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Finance can update payments"
  ON public.payments FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'finance'::app_role));

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_project ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON public.payments(stripe_session_id);

-- 2. Create automation_events table for logging all automation actions
CREATE TABLE IF NOT EXISTS public.automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  action_taken TEXT NOT NULL,
  action_result JSONB DEFAULT '{}',
  triggered_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;

-- Admin and finance can view automation events
CREATE POLICY "Admins can view automation events"
  ON public.automation_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'finance'::app_role));

-- Index for querying by source
CREATE INDEX IF NOT EXISTS idx_automation_events_source ON public.automation_events(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_automation_events_type ON public.automation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_automation_events_created ON public.automation_events(created_at DESC);

-- 3. Create function to handle contract signed automation
CREATE OR REPLACE FUNCTION public.on_contract_signed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project RECORD;
  v_deposit_amount NUMERIC;
  request_id BIGINT;
  supabase_url TEXT := 'https://pscsnsgvfjcbldomnstb.supabase.co';
  supabase_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY3Nuc2d2ZmpjYmxkb21uc3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ0NTksImV4cCI6MjA3ODI0MDQ1OX0.ibB94sOxJPLLILJOilNboWCZeDavokqfn73wd5EzJ3E';
BEGIN
  -- Only trigger when signature_status changes to 'signed'
  IF NEW.signature_status = 'signed' AND (OLD.signature_status IS NULL OR OLD.signature_status != 'signed') THEN
    
    -- Get project details
    SELECT * INTO v_project FROM public.projects WHERE id = NEW.project_id;
    
    -- Calculate deposit (typically 10% or first milestone)
    v_deposit_amount := COALESCE(NEW.contract_value * 0.10, 0);
    
    -- Update project status
    UPDATE public.projects
    SET 
      contract_signed_at = NEW.signed_at,
      status = 'contract_signed'
    WHERE id = NEW.project_id;
    
    -- Log the automation event
    INSERT INTO public.automation_events (event_type, source_table, source_id, action_taken, action_result, triggered_by)
    VALUES (
      'contract_signed',
      'contracts',
      NEW.id,
      'generate_deposit_invoice',
      jsonb_build_object(
        'contract_id', NEW.id,
        'project_id', NEW.project_id,
        'contract_value', NEW.contract_value,
        'deposit_amount', v_deposit_amount
      ),
      NEW.signed_by
    );
    
    -- Call edge function to handle invoice generation and notifications
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/finance-automation-trigger',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_anon_key
      ),
      body := jsonb_build_object(
        'event_type', 'contract_signed',
        'contract_id', NEW.id,
        'project_id', NEW.project_id,
        'contract_value', NEW.contract_value,
        'deposit_amount', v_deposit_amount,
        'signed_by', NEW.signed_by
      )
    ) INTO request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for contract signed
DROP TRIGGER IF EXISTS trigger_on_contract_signed ON public.contracts;
CREATE TRIGGER trigger_on_contract_signed
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.on_contract_signed();

-- 4. Create function to handle deposit collected automation
CREATE OR REPLACE FUNCTION public.on_deposit_collected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project RECORD;
  v_contract RECORD;
  v_is_deposit BOOLEAN := FALSE;
  request_id BIGINT;
  supabase_url TEXT := 'https://pscsnsgvfjcbldomnstb.supabase.co';
  supabase_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY3Nuc2d2ZmpjYmxkb21uc3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ0NTksImV4cCI6MjA3ODI0MDQ1OX0.ibB94sOxJPLLILJOilNboWCZeDavokqfn73wd5EzJ3E';
BEGIN
  -- Only trigger when payment status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Check if this is a deposit payment
    v_is_deposit := NEW.payment_type = 'deposit' OR NEW.payment_type = 'estimate_fee';
    
    IF v_is_deposit AND NEW.project_id IS NOT NULL THEN
      -- Get project details
      SELECT * INTO v_project FROM public.projects WHERE id = NEW.project_id;
      
      -- Get contract if exists
      SELECT * INTO v_contract FROM public.contracts WHERE project_id = NEW.project_id LIMIT 1;
      
      -- Update project status
      UPDATE public.projects
      SET 
        deposit_received_at = NEW.completed_at,
        status = 'pre_construction'
      WHERE id = NEW.project_id;
      
      -- Log the automation event
      INSERT INTO public.automation_events (event_type, source_table, source_id, action_taken, action_result)
      VALUES (
        'deposit_collected',
        'payments',
        NEW.id,
        'assign_pc_create_gates',
        jsonb_build_object(
          'payment_id', NEW.id,
          'project_id', NEW.project_id,
          'amount', NEW.amount,
          'payment_type', NEW.payment_type
        )
      );
      
      -- Call edge function to assign PC and create build gates
      SELECT net.http_post(
        url := supabase_url || '/functions/v1/finance-automation-trigger',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || supabase_anon_key
        ),
        body := jsonb_build_object(
          'event_type', 'deposit_collected',
          'payment_id', NEW.id,
          'project_id', NEW.project_id,
          'amount', NEW.amount
        )
      ) INTO request_id;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for deposit collected
DROP TRIGGER IF EXISTS trigger_on_deposit_collected ON public.payments;
CREATE TRIGGER trigger_on_deposit_collected
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_deposit_collected();

-- Also trigger on insert for new completed payments
DROP TRIGGER IF EXISTS trigger_on_deposit_collected_insert ON public.payments;
CREATE TRIGGER trigger_on_deposit_collected_insert
  AFTER INSERT ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.on_deposit_collected();

-- 5. Create function to handle lead sold automation
CREATE OR REPLACE FUNCTION public.on_lead_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id BIGINT;
  supabase_url TEXT := 'https://pscsnsgvfjcbldomnstb.supabase.co';
  supabase_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY3Nuc2d2ZmpjYmxkb21uc3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ0NTksImV4cCI6MjA3ODI0MDQ1OX0.ibB94sOxJPLLILJOilNboWCZeDavokqfn73wd5EzJ3E';
BEGIN
  -- Only trigger when sale_outcome changes to 'sold'
  IF NEW.sale_outcome = 'sold' AND (OLD.sale_outcome IS NULL OR OLD.sale_outcome != 'sold') THEN
    
    -- Lock estimator editing
    NEW.estimator_readonly := TRUE;
    NEW.sold_at := COALESCE(NEW.sold_at, NOW());
    
    -- Log the automation event
    INSERT INTO public.automation_events (event_type, source_table, source_id, action_taken, action_result, triggered_by)
    VALUES (
      'lead_sold',
      'leads',
      NEW.id,
      'lock_estimator_generate_contract',
      jsonb_build_object(
        'lead_id', NEW.id,
        'lead_name', NEW.name,
        'estimator_id', NEW.user_id,
        'project_type', NEW.project_type
      ),
      NEW.user_id
    );
    
    -- Call edge function to generate contract draft and notify
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/finance-automation-trigger',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_anon_key
      ),
      body := jsonb_build_object(
        'event_type', 'lead_sold',
        'lead_id', NEW.id,
        'lead_name', NEW.name,
        'estimator_id', NEW.user_id,
        'project_type', NEW.project_type,
        'estimated_budget', NEW.estimated_budget
      )
    ) INTO request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for lead sold (BEFORE UPDATE to modify the row)
DROP TRIGGER IF EXISTS trigger_on_lead_sold ON public.leads;
CREATE TRIGGER trigger_on_lead_sold
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.on_lead_sold();