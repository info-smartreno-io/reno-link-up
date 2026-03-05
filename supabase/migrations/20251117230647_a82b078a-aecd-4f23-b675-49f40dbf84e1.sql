-- Create daily_logs table for comprehensive construction logging
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_type TEXT NOT NULL CHECK (log_type IN ('work', 'safety', 'weather', 'equipment', 'material', 'delivery', 'visitor', 'note')),
  
  -- Common fields
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Work Log fields
  work_description TEXT,
  hours_worked NUMERIC(5,2),
  workers_count INTEGER,
  work_cost NUMERIC(10,2),
  
  -- Safety Log fields
  safety_type TEXT, -- 'meeting', 'violation', 'warning', 'incident'
  safety_description TEXT,
  safety_action_taken TEXT,
  
  -- Weather fields
  weather_condition TEXT, -- 'sunny', 'rainy', 'cloudy', 'snowy', etc.
  temperature NUMERIC(5,2),
  weather_delay_hours NUMERIC(5,2),
  weather_notes TEXT,
  
  -- Equipment fields
  equipment_name TEXT,
  equipment_hours NUMERIC(5,2),
  equipment_hourly_rate NUMERIC(10,2),
  equipment_operator TEXT,
  
  -- Material fields
  material_name TEXT,
  material_quantity NUMERIC(10,2),
  material_unit TEXT,
  material_unit_cost NUMERIC(10,2),
  material_supplier TEXT,
  
  -- Delivery fields
  delivery_item TEXT,
  delivery_quantity TEXT,
  delivery_supplier TEXT,
  delivery_received_by TEXT,
  delivery_time TIMESTAMP WITH TIME ZONE,
  
  -- Visitor fields
  visitor_name TEXT,
  visitor_company TEXT,
  visitor_purpose TEXT,
  visitor_arrival_time TIMESTAMP WITH TIME ZONE,
  visitor_departure_time TIMESTAMP WITH TIME ZONE,
  
  -- General notes
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view logs for their contractor's projects
CREATE POLICY "Users can view daily logs for their projects"
ON public.daily_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    JOIN public.contractor_users cu ON cu.contractor_id = cp.contractor_id
    WHERE cp.id = daily_logs.project_id
    AND cu.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Users can create logs for their contractor's projects
CREATE POLICY "Users can create daily logs for their projects"
ON public.daily_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contractor_projects cp
    JOIN public.contractor_users cu ON cu.contractor_id = cp.contractor_id
    WHERE cp.id = daily_logs.project_id
    AND cu.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Users can update their own logs
CREATE POLICY "Users can update their own daily logs"
ON public.daily_logs
FOR UPDATE
USING (created_by = auth.uid() OR EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
));

-- Policy: Users can delete their own logs
CREATE POLICY "Users can delete their own daily logs"
ON public.daily_logs
FOR DELETE
USING (created_by = auth.uid() OR EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_logs_updated_at
BEFORE UPDATE ON public.daily_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_daily_logs_project_id ON public.daily_logs(project_id);
CREATE INDEX idx_daily_logs_log_date ON public.daily_logs(log_date);
CREATE INDEX idx_daily_logs_log_type ON public.daily_logs(log_type);
CREATE INDEX idx_daily_logs_created_by ON public.daily_logs(created_by);