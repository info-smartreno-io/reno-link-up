-- Enhanced Subcontractor Management System
-- Phase 1: Database Schema Changes

-- 1.1 Enhance sub_bid_packages table with scope fields
ALTER TABLE sub_bid_packages ADD COLUMN IF NOT EXISTS scope_description text;
ALTER TABLE sub_bid_packages ADD COLUMN IF NOT EXISTS scope_documents jsonb DEFAULT '[]';
ALTER TABLE sub_bid_packages ADD COLUMN IF NOT EXISTS scope_photos jsonb DEFAULT '[]';
ALTER TABLE sub_bid_packages ADD COLUMN IF NOT EXISTS blueprints jsonb DEFAULT '[]';
ALTER TABLE sub_bid_packages ADD COLUMN IF NOT EXISTS invited_subcontractors jsonb DEFAULT '[]';
ALTER TABLE sub_bid_packages ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE sub_bid_packages ADD COLUMN IF NOT EXISTS project_address text;
ALTER TABLE sub_bid_packages ADD COLUMN IF NOT EXISTS notes_for_subs text;

-- 1.2 Create sub_bid_invitations table
CREATE TABLE IF NOT EXISTS sub_bid_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid REFERENCES sub_bid_packages(id) ON DELETE CASCADE NOT NULL,
  subcontractor_id uuid NOT NULL,
  invited_at timestamp with time zone DEFAULT now(),
  viewed_at timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'bid_submitted', 'declined')),
  invitation_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamp with time zone DEFAULT now()
);

-- 1.3 Enhance sub_bid_responses table
ALTER TABLE sub_bid_responses ADD COLUMN IF NOT EXISTS is_awarded boolean DEFAULT false;
ALTER TABLE sub_bid_responses ADD COLUMN IF NOT EXISTS awarded_at timestamp with time zone;
ALTER TABLE sub_bid_responses ADD COLUMN IF NOT EXISTS award_notification_sent_at timestamp with time zone;
ALTER TABLE sub_bid_responses ADD COLUMN IF NOT EXISTS scheduled_start_date date;
ALTER TABLE sub_bid_responses ADD COLUMN IF NOT EXISTS scheduled_end_date date;
ALTER TABLE sub_bid_responses ADD COLUMN IF NOT EXISTS date_confirmed_at timestamp with time zone;
ALTER TABLE sub_bid_responses ADD COLUMN IF NOT EXISTS date_confirmed_by uuid;

-- 1.4 Create subcontractor_messages table
CREATE TABLE IF NOT EXISTS subcontractor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  bid_package_id uuid REFERENCES sub_bid_packages(id) ON DELETE SET NULL,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('subcontractor', 'coordinator', 'pm', 'admin')),
  message text NOT NULL,
  attachments jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  read_by jsonb DEFAULT '[]'
);

-- 1.5 Create subcontractor_notifications table
CREATE TABLE IF NOT EXISTS subcontractor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('bid_request', 'award', 'date_confirmed', 'message', 'date_proposed')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  related_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE sub_bid_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sub_bid_invitations
CREATE POLICY "Subcontractors can view their invitations"
ON sub_bid_invitations FOR SELECT
USING (subcontractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'project_coordinator'::app_role));

CREATE POLICY "Coordinators can insert invitations"
ON sub_bid_invitations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'project_coordinator'::app_role) OR has_role(auth.uid(), 'estimator'::app_role));

CREATE POLICY "Subcontractors can update their invitations"
ON sub_bid_invitations FOR UPDATE
USING (subcontractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'project_coordinator'::app_role));

-- RLS Policies for subcontractor_messages
CREATE POLICY "Users can view project messages"
ON subcontractor_messages FOR SELECT
USING (
  sender_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'project_coordinator'::app_role) OR
  has_role(auth.uid(), 'project_manager'::app_role) OR
  EXISTS (
    SELECT 1 FROM sub_bid_invitations sbi 
    WHERE sbi.package_id = subcontractor_messages.bid_package_id 
    AND sbi.subcontractor_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages"
ON subcontractor_messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update message read status"
ON subcontractor_messages FOR UPDATE
USING (
  sender_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'project_coordinator'::app_role) OR
  has_role(auth.uid(), 'project_manager'::app_role)
);

-- RLS Policies for subcontractor_notifications
CREATE POLICY "Subcontractors can view their notifications"
ON subcontractor_notifications FOR SELECT
USING (subcontractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications"
ON subcontractor_notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'project_coordinator'::app_role) OR has_role(auth.uid(), 'project_manager'::app_role));

CREATE POLICY "Subcontractors can update their notifications"
ON subcontractor_notifications FOR UPDATE
USING (subcontractor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE subcontractor_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE subcontractor_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE sub_bid_invitations;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sub_bid_invitations_subcontractor ON sub_bid_invitations(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_sub_bid_invitations_package ON sub_bid_invitations(package_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_messages_project ON subcontractor_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_messages_package ON subcontractor_messages(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_notifications_sub ON subcontractor_notifications(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_notifications_unread ON subcontractor_notifications(subcontractor_id, is_read) WHERE is_read = false;