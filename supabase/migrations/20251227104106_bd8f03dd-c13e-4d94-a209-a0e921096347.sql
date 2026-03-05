-- Create homeowner portal access table for secure project access
CREATE TABLE public.homeowner_portal_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_email TEXT NOT NULL,
  homeowner_name TEXT,
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year')
);

-- Create indexes for fast lookups
CREATE INDEX idx_homeowner_portal_access_token ON public.homeowner_portal_access(access_token) WHERE is_active = true;
CREATE INDEX idx_homeowner_portal_access_email ON public.homeowner_portal_access(homeowner_email);
CREATE INDEX idx_homeowner_portal_access_project ON public.homeowner_portal_access(project_id);

-- Enable RLS
ALTER TABLE public.homeowner_portal_access ENABLE ROW LEVEL SECURITY;

-- RLS policies - admins can manage all, homeowners can read their own via token
CREATE POLICY "Admins can manage portal access"
  ON public.homeowner_portal_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND role IN ('admin', 'project_coordinator')
    )
  );

CREATE POLICY "Portal access lookup by token"
  ON public.homeowner_portal_access
  FOR SELECT
  USING (is_active = true AND expires_at > now());

-- Add comment
COMMENT ON TABLE public.homeowner_portal_access IS 'Manages secure access tokens for homeowner customer portal';