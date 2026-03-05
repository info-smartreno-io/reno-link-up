-- Create enum for team member status
CREATE TYPE public.team_status AS ENUM ('available', 'in_walkthrough', 'on_call', 'away', 'offline');

-- Create team_member_status table
CREATE TABLE public.team_member_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status team_status NOT NULL DEFAULT 'available',
  current_activity TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_member_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone authenticated can view team status"
ON public.team_member_status
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own status"
ON public.team_member_status
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own status"
ON public.team_member_status
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can update any status
CREATE POLICY "Admins can update any status"
ON public.team_member_status
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_team_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp updates
CREATE TRIGGER update_team_member_status_updated_at
BEFORE UPDATE ON public.team_member_status
FOR EACH ROW
EXECUTE FUNCTION public.update_team_status_timestamp();

-- Create function to automatically set status based on walkthroughs
CREATE OR REPLACE FUNCTION public.sync_walkthrough_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When walkthrough starts (status = 'in_progress'), set user to 'in_walkthrough'
  IF NEW.status = 'in_progress' THEN
    INSERT INTO public.team_member_status (user_id, status, current_activity)
    VALUES (NEW.user_id, 'in_walkthrough', NEW.project_name)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      status = 'in_walkthrough',
      current_activity = NEW.project_name,
      updated_at = now();
  
  -- When walkthrough completes, set user back to 'available'
  ELSIF (NEW.status = 'completed' OR NEW.status = 'cancelled') AND OLD.status = 'in_progress' THEN
    UPDATE public.team_member_status
    SET status = 'available', current_activity = NULL
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for walkthrough status sync
CREATE TRIGGER sync_walkthrough_to_team_status
AFTER INSERT OR UPDATE ON public.walkthroughs
FOR EACH ROW
EXECUTE FUNCTION public.sync_walkthrough_status();

-- Enable realtime for team_member_status
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_member_status;