-- Add homeowner sharing to project_schedules
ALTER TABLE public.project_schedules
ADD COLUMN shared_with_homeowners UUID[] DEFAULT '{}';

-- Add RLS policy for homeowners to view shared schedules
CREATE POLICY "Homeowners can view schedules shared with them"
  ON public.project_schedules FOR SELECT
  USING (auth.uid() = ANY(shared_with_homeowners));

-- Add RLS policies for homeowners to view related data
CREATE POLICY "Homeowners can view tasks from shared schedules"
  ON public.schedule_tasks FOR SELECT
  USING (
    schedule_id IN (
      SELECT id FROM public.project_schedules 
      WHERE auth.uid() = ANY(shared_with_homeowners)
    )
  );

CREATE POLICY "Homeowners can view phases from shared schedules"
  ON public.schedule_phases FOR SELECT
  USING (
    schedule_id IN (
      SELECT id FROM public.project_schedules 
      WHERE auth.uid() = ANY(shared_with_homeowners)
    )
  );

CREATE POLICY "Homeowners can view resources from shared schedules"
  ON public.schedule_resources FOR SELECT
  USING (true);

CREATE POLICY "Homeowners can view assignments from shared schedules"
  ON public.schedule_assignments FOR SELECT
  USING (
    task_id IN (
      SELECT st.id FROM public.schedule_tasks st
      JOIN public.project_schedules ps ON st.schedule_id = ps.id
      WHERE auth.uid() = ANY(ps.shared_with_homeowners)
    )
  );

-- Enable realtime for schedule updates
ALTER TABLE public.project_schedules REPLICA IDENTITY FULL;
ALTER TABLE public.schedule_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.schedule_phases REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_phases;