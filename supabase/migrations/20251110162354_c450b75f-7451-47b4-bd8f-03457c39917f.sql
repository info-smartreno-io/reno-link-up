-- Update RLS policy to allow architects to view project messages
DROP POLICY IF EXISTS "Users can view messages for their projects" ON project_messages;

CREATE POLICY "Users can view messages for their projects"
ON project_messages
FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM contractor_projects
    WHERE contractor_projects.id = project_messages.project_id
    AND contractor_projects.contractor_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM homeowner_projects
    WHERE homeowner_projects.project_id = project_messages.project_id
    AND homeowner_projects.homeowner_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM architect_projects
    WHERE architect_projects.id = project_messages.project_id
    AND architect_projects.architect_id = auth.uid()
  ))
  OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update insert policy for architects
DROP POLICY IF EXISTS "Users can send messages to their projects" ON project_messages;

CREATE POLICY "Users can send messages to their projects"
ON project_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    (EXISTS (
      SELECT 1 FROM contractor_projects
      WHERE contractor_projects.id = project_messages.project_id
      AND contractor_projects.contractor_id = auth.uid()
    ))
    OR
    (EXISTS (
      SELECT 1 FROM homeowner_projects
      WHERE homeowner_projects.project_id = project_messages.project_id
      AND homeowner_projects.homeowner_id = auth.uid()
    ))
    OR
    (EXISTS (
      SELECT 1 FROM architect_projects
      WHERE architect_projects.id = project_messages.project_id
      AND architect_projects.architect_id = auth.uid()
    ))
    OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Enable realtime for project_messages
ALTER PUBLICATION supabase_realtime ADD TABLE project_messages;