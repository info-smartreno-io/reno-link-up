-- Add contractor role to app_role enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typcategory = 'E' AND 'contractor' = ANY(enum_range(NULL::app_role)::text[])) THEN
        ALTER TYPE app_role ADD VALUE 'contractor';
    END IF;
END $$;

-- Create contractor_projects table
CREATE TABLE IF NOT EXISTS public.contractor_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  project_type TEXT NOT NULL,
  estimated_value NUMERIC,
  square_footage INTEGER,
  deadline DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contractor_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_projects
CREATE POLICY "Contractors can view their own projects"
  ON public.contractor_projects
  FOR SELECT
  USING (
    auth.uid() = contractor_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can insert their own projects"
  ON public.contractor_projects
  FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update their own projects"
  ON public.contractor_projects
  FOR UPDATE
  USING (
    auth.uid() = contractor_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create contractor_bids table
CREATE TABLE IF NOT EXISTS public.contractor_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  bid_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contractor_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_bids
CREATE POLICY "Contractors can view their own bids"
  ON public.contractor_bids
  FOR SELECT
  USING (
    auth.uid() = contractor_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can insert their own bids"
  ON public.contractor_bids
  FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update their own bids"
  ON public.contractor_bids
  FOR UPDATE
  USING (
    auth.uid() = contractor_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create contractor_messages table
CREATE TABLE IF NOT EXISTS public.contractor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contractor_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_messages
CREATE POLICY "Contractors can view their own messages"
  ON public.contractor_messages
  FOR SELECT
  USING (
    auth.uid() = contractor_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can insert their own messages"
  ON public.contractor_messages
  FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update their own messages"
  ON public.contractor_messages
  FOR UPDATE
  USING (
    auth.uid() = contractor_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create contractor_schedule table
CREATE TABLE IF NOT EXISTS public.contractor_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contractor_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_schedule
CREATE POLICY "Contractors can view their own schedule"
  ON public.contractor_schedule
  FOR SELECT
  USING (
    auth.uid() = contractor_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Contractors can manage their own schedule"
  ON public.contractor_schedule
  FOR ALL
  USING (auth.uid() = contractor_id)
  WITH CHECK (auth.uid() = contractor_id);