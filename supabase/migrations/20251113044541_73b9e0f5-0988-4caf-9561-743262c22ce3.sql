-- Create homeowner_meetings table
CREATE TABLE IF NOT EXISTS public.homeowner_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  meeting_type TEXT NOT NULL,
  attendees TEXT[] DEFAULT '{}',
  notes TEXT,
  action_items TEXT[] DEFAULT '{}',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_materials table
CREATE TABLE IF NOT EXISTS public.project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'ea',
  vendor TEXT,
  order_date DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  status TEXT NOT NULL DEFAULT 'pending_selection',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_permits table
CREATE TABLE IF NOT EXISTS public.project_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  permit_type TEXT NOT NULL,
  description TEXT,
  application_date DATE,
  submission_date DATE,
  approval_date DATE,
  expiration_date DATE,
  permit_number TEXT DEFAULT '',
  municipality TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  inspector_name TEXT,
  inspector_contact TEXT,
  fees NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_schedule_locks table
CREATE TABLE IF NOT EXISTS public.project_schedule_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  estimated_duration_weeks INTEGER NOT NULL,
  prerequisites JSONB DEFAULT '{}',
  notes TEXT,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  locked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.homeowner_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_schedule_locks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homeowner_meetings
CREATE POLICY "Contractors and coordinators can view meetings"
ON public.homeowner_meetings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = homeowner_meetings.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

CREATE POLICY "Contractors and coordinators can insert meetings"
ON public.homeowner_meetings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = homeowner_meetings.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

CREATE POLICY "Contractors and coordinators can update meetings"
ON public.homeowner_meetings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = homeowner_meetings.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

-- RLS Policies for project_materials (same pattern)
CREATE POLICY "Contractors and coordinators can view materials"
ON public.project_materials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_materials.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

CREATE POLICY "Contractors and coordinators can insert materials"
ON public.project_materials FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_materials.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

CREATE POLICY "Contractors and coordinators can update materials"
ON public.project_materials FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_materials.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

CREATE POLICY "Contractors and coordinators can delete materials"
ON public.project_materials FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_materials.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

-- RLS Policies for project_permits (same pattern)
CREATE POLICY "Contractors and coordinators can view permits"
ON public.project_permits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_permits.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

CREATE POLICY "Contractors and coordinators can insert permits"
ON public.project_permits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_permits.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

CREATE POLICY "Contractors and coordinators can update permits"
ON public.project_permits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_permits.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

-- RLS Policies for project_schedule_locks (same pattern)
CREATE POLICY "Contractors and coordinators can view schedule locks"
ON public.project_schedule_locks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_schedule_locks.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

CREATE POLICY "Contractors and coordinators can insert schedule locks"
ON public.project_schedule_locks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_schedule_locks.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

CREATE POLICY "Contractors and coordinators can update schedule locks"
ON public.project_schedule_locks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    WHERE cp.id = project_schedule_locks.project_id
    AND (
      cp.contractor_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'project_coordinator'::app_role)
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_homeowner_meetings_project ON public.homeowner_meetings(project_id);
CREATE INDEX idx_project_materials_project ON public.project_materials(project_id);
CREATE INDEX idx_project_permits_project ON public.project_permits(project_id);
CREATE INDEX idx_project_schedule_locks_project ON public.project_schedule_locks(project_id);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_homeowner_meetings_updated_at BEFORE UPDATE ON public.homeowner_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_materials_updated_at BEFORE UPDATE ON public.project_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_permits_updated_at BEFORE UPDATE ON public.project_permits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_schedule_locks_updated_at BEFORE UPDATE ON public.project_schedule_locks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();