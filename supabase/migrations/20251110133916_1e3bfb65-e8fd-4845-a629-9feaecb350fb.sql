-- Create homeowner_projects junction table to link homeowners to their projects
CREATE TABLE public.homeowner_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure a homeowner can only be linked to a project once
  UNIQUE(homeowner_id, project_id)
);

-- Enable Row Level Security
ALTER TABLE public.homeowner_projects ENABLE ROW LEVEL SECURITY;

-- Create index for better query performance
CREATE INDEX idx_homeowner_projects_homeowner_id ON public.homeowner_projects(homeowner_id);
CREATE INDEX idx_homeowner_projects_project_id ON public.homeowner_projects(project_id);

-- RLS Policy: Homeowners can view their own project links
CREATE POLICY "Homeowners can view their own projects" 
ON public.homeowner_projects 
FOR SELECT 
USING (auth.uid() = homeowner_id);

-- RLS Policy: Admins can view all project links
CREATE POLICY "Admins can view all homeowner projects" 
ON public.homeowner_projects 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policy: Homeowners can insert their own project links
CREATE POLICY "Homeowners can create their own project links" 
ON public.homeowner_projects 
FOR INSERT 
WITH CHECK (auth.uid() = homeowner_id);

-- RLS Policy: Admins can insert project links
CREATE POLICY "Admins can create homeowner project links" 
ON public.homeowner_projects 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policy: Homeowners can update their own project links
CREATE POLICY "Homeowners can update their own projects" 
ON public.homeowner_projects 
FOR UPDATE 
USING (auth.uid() = homeowner_id);

-- RLS Policy: Admins can update any project links
CREATE POLICY "Admins can update homeowner projects" 
ON public.homeowner_projects 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policy: Homeowners can delete their own project links
CREATE POLICY "Homeowners can delete their own projects" 
ON public.homeowner_projects 
FOR DELETE 
USING (auth.uid() = homeowner_id);

-- RLS Policy: Admins can delete any project links
CREATE POLICY "Admins can delete homeowner projects" 
ON public.homeowner_projects 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_homeowner_projects_updated_at
BEFORE UPDATE ON public.homeowner_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_application_updated_at();