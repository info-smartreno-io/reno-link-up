-- Create table for walkthrough photo metadata
CREATE TABLE public.walkthrough_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  walkthrough_id uuid NOT NULL REFERENCES public.walkthroughs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  category text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.walkthrough_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their walkthrough photos"
  ON public.walkthrough_photos
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can insert their walkthrough photos"
  ON public.walkthrough_photos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their walkthrough photos"
  ON public.walkthrough_photos
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete their walkthrough photos"
  ON public.walkthrough_photos
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create updated_at trigger
CREATE TRIGGER update_walkthrough_photos_updated_at
  BEFORE UPDATE ON public.walkthrough_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

-- Create index for faster queries
CREATE INDEX idx_walkthrough_photos_walkthrough_id ON public.walkthrough_photos(walkthrough_id);
CREATE INDEX idx_walkthrough_photos_category ON public.walkthrough_photos(category);