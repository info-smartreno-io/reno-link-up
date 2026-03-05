-- Add lead_id column to contractor_projects if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contractor_projects' 
    AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE public.contractor_projects ADD COLUMN lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;
    CREATE INDEX idx_contractor_projects_lead_id ON public.contractor_projects(lead_id);
  END IF;
END $$;