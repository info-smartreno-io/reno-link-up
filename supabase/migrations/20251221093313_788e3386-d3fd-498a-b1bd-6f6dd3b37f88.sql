-- =====================================================
-- PHASE 4: Agent Orchestrator Database Triggers
-- Creates triggers to invoke the agent orchestrator
-- when lead/project status changes occur
-- =====================================================

-- Create a reusable function to invoke the agent orchestrator via HTTP
CREATE OR REPLACE FUNCTION invoke_agent_orchestrator(
  p_trigger_event TEXT,
  p_trigger_source TEXT,
  p_trigger_source_id UUID,
  p_trigger_data JSONB,
  p_triggered_by UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://pscsnsgvfjcbldomnstb.supabase.co';
  supabase_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY3Nuc2d2ZmpjYmxkb21uc3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQ0NTksImV4cCI6MjA3ODI0MDQ1OX0.ibB94sOxJPLLILJOilNboWCZeDavokqfn73wd5EzJ3E';
  request_id BIGINT;
BEGIN
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/run-agent-orchestrator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || supabase_anon_key
    ),
    body := jsonb_build_object(
      'trigger_event', p_trigger_event,
      'trigger_source', p_trigger_source,
      'trigger_source_id', p_trigger_source_id,
      'trigger_data', p_trigger_data,
      'triggered_by', p_triggered_by
    )
  ) INTO request_id;
  
  RAISE LOG 'Agent orchestrator invoked: event=%, source=%, source_id=%, request_id=%',
    p_trigger_event, p_trigger_source, p_trigger_source_id, request_id;
END;
$$;

-- =====================================================
-- Trigger for new leads (lead.created)
-- =====================================================
CREATE OR REPLACE FUNCTION on_lead_created_trigger_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_zip TEXT;
BEGIN
  -- Extract zip code from location if available
  lead_zip := TRIM(SPLIT_PART(COALESCE(NEW.location, ''), ' ', -1));
  
  -- Invoke the agent orchestrator
  PERFORM invoke_agent_orchestrator(
    'lead.created',
    'leads',
    NEW.id,
    jsonb_build_object(
      'status', NEW.status,
      'project_type', NEW.project_type,
      'zip_code', lead_zip,
      'name', NEW.name,
      'email', NEW.email,
      'phone', NEW.phone,
      'location', NEW.location,
      'estimated_budget', NEW.estimated_budget
    ),
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_agent_on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION on_lead_created_trigger_agent();

-- =====================================================
-- Trigger for lead status changes (lead.status_change)
-- =====================================================
CREATE OR REPLACE FUNCTION on_lead_status_change_trigger_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_zip TEXT;
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Extract zip code from location if available
    lead_zip := TRIM(SPLIT_PART(COALESCE(NEW.location, ''), ' ', -1));
    
    -- Invoke the agent orchestrator
    PERFORM invoke_agent_orchestrator(
      'lead.status_change',
      'leads',
      NEW.id,
      jsonb_build_object(
        'from_status', OLD.status,
        'to_status', NEW.status,
        'project_type', NEW.project_type,
        'zip_code', lead_zip,
        'name', NEW.name,
        'email', NEW.email,
        'phone', NEW.phone,
        'location', NEW.location,
        'estimator_id', NEW.estimator_id
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_agent_on_lead_status_change
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION on_lead_status_change_trigger_agent();

-- =====================================================
-- Trigger for project status changes (project.status_change)
-- =====================================================
CREATE OR REPLACE FUNCTION on_project_status_change_trigger_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Invoke the agent orchestrator
    PERFORM invoke_agent_orchestrator(
      'project.status_change',
      'projects',
      NEW.id,
      jsonb_build_object(
        'from_status', OLD.status,
        'to_status', NEW.status,
        'project_type', NEW.project_type,
        'name', NEW.name,
        'user_id', NEW.user_id,
        'coordinator_id', NEW.coordinator_id,
        'project_manager_id', NEW.project_manager_id
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_agent_on_project_status_change
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION on_project_status_change_trigger_agent();