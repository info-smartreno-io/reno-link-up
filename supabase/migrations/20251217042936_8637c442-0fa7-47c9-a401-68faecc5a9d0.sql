-- Create project_closeout_items table for closeout checklist
CREATE TABLE public.project_closeout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('final_walk', 'punch_list', 'documentation', 'warranty', 'review', 'testimonial', 'follow_up')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create project_meetings table for field meetings/PM touchpoints
CREATE TABLE public.project_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('pre_start', 'weekly_pm', 'coordination', 'final_walk', 'client_meeting', 'vendor_meeting')),
  meeting_title TEXT NOT NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add PM-specific columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS last_pm_activity_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS next_action TEXT,
ADD COLUMN IF NOT EXISTS subs_status TEXT DEFAULT 'not_started' CHECK (subs_status IN ('not_started', 'pending', 'locked')),
ADD COLUMN IF NOT EXISTS materials_status TEXT DEFAULT 'not_ordered' CHECK (materials_status IN ('not_ordered', 'partial', 'ordered', 'delivered'));

-- Enable RLS on new tables
ALTER TABLE public.project_closeout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_closeout_items
CREATE POLICY "PMs can view closeout items for their projects"
ON public.project_closeout_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_closeout_items.project_id
    AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "PMs can insert closeout items for their projects"
ON public.project_closeout_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_closeout_items.project_id
    AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "PMs can update closeout items for their projects"
ON public.project_closeout_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_closeout_items.project_id
    AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- RLS policies for project_meetings
CREATE POLICY "PMs can view meetings for their projects"
ON public.project_meetings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_meetings.project_id
    AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "PMs can insert meetings for their projects"
ON public.project_meetings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_meetings.project_id
    AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "PMs can update meetings for their projects"
ON public.project_meetings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_meetings.project_id
    AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "PMs can delete meetings for their projects"
ON public.project_meetings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_meetings.project_id
    AND (p.project_manager_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Create indexes for performance
CREATE INDEX idx_project_closeout_items_project_id ON public.project_closeout_items(project_id);
CREATE INDEX idx_project_closeout_items_status ON public.project_closeout_items(status);
CREATE INDEX idx_project_meetings_project_id ON public.project_meetings(project_id);
CREATE INDEX idx_project_meetings_scheduled_date ON public.project_meetings(scheduled_date);
CREATE INDEX idx_projects_risk_level ON public.projects(risk_level);
CREATE INDEX idx_projects_last_pm_activity ON public.projects(last_pm_activity_at);