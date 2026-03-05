-- Update RLS policies to allow contractors to update smartplan items
CREATE POLICY "Contractors can update shared smartplan items"
  ON public.smartplan_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM smartplans 
      WHERE smartplans.id = smartplan_items.smartplan_id 
      AND smartplans.is_shared_with_contractor = true
      AND smartplans.project_id IN (
        SELECT id FROM contractor_projects WHERE contractor_id = auth.uid()
      )
    )
  );

-- Enable realtime for smartplan_items
ALTER TABLE public.smartplan_items REPLICA IDENTITY FULL;

-- Note: supabase_realtime publication is automatically configured in Lovable Cloud