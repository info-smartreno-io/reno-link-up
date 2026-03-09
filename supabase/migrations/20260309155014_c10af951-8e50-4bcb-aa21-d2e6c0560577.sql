
-- 1. Workflow Events table (full project lifecycle audit trail)
CREATE TABLE public.workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  event_data JSONB DEFAULT '{}',
  triggered_by UUID,
  automated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_events_project ON public.workflow_events(project_id);
CREATE INDEX idx_workflow_events_type ON public.workflow_events(event_type);
CREATE INDEX idx_workflow_events_created ON public.workflow_events(created_at DESC);

ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workflow events"
  ON public.workflow_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Estimators can view workflow events"
  ON public.workflow_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'estimator'));

-- 2. System Audit Log (cross-table action tracking)
CREATE TABLE public.system_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_role TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  changes JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_user ON public.system_audit_log(user_id);
CREATE INDEX idx_audit_log_table ON public.system_audit_log(table_name);
CREATE INDEX idx_audit_log_created ON public.system_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON public.system_audit_log(action);

ALTER TABLE public.system_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit log"
  ON public.system_audit_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. User Permissions table (granular permissions on top of roles)
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  granted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission, resource_type, resource_id)
);

CREATE INDEX idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_role ON public.user_permissions(role);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage permissions"
  ON public.user_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own permissions"
  ON public.user_permissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. Security definer function to check granular permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT, _resource_type TEXT DEFAULT NULL, _resource_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission = _permission
      AND (expires_at IS NULL OR expires_at > now())
      AND (_resource_type IS NULL OR resource_type = _resource_type)
      AND (_resource_id IS NULL OR resource_id = _resource_id)
  )
$$;

-- 5. Workflow automation trigger on contractor_projects status changes
CREATE OR REPLACE FUNCTION public.log_workflow_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.workflow_events (project_id, event_type, from_status, to_status, triggered_by, automated, event_data)
    VALUES (
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE WHEN auth.uid() IS NULL THEN true ELSE false END,
      jsonb_build_object('client_name', NEW.client_name, 'contractor_id', NEW.contractor_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_workflow_event_on_project_status
  AFTER UPDATE ON public.contractor_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_workflow_event();

-- 6. Workflow automation trigger on leads status changes
CREATE OR REPLACE FUNCTION public.log_lead_workflow_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.workflow_events (project_id, event_type, from_status, to_status, triggered_by, automated, event_data)
    VALUES (
      NEW.id,
      'lead_status_change',
      OLD.status,
      NEW.status,
      auth.uid(),
      false,
      jsonb_build_object('name', NEW.name, 'project_type', NEW.project_type, 'location', NEW.location)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_workflow_event_on_lead_status
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_workflow_event();
