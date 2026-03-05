-- Create bid opportunities table
CREATE TABLE IF NOT EXISTS public.bid_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  project_type text NOT NULL,
  location text NOT NULL,
  estimated_budget numeric,
  square_footage integer,
  deadline date,
  bid_deadline timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Professional types this bid is open to
  open_to_architects boolean NOT NULL DEFAULT false,
  open_to_contractors boolean NOT NULL DEFAULT false,
  open_to_interior_designers boolean NOT NULL DEFAULT false,
  -- Requirements and details
  requirements jsonb DEFAULT '[]'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT bid_opportunities_status_check CHECK (status IN ('open', 'closed', 'awarded'))
);

-- Create bid submissions table
CREATE TABLE IF NOT EXISTS public.bid_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_opportunity_id uuid NOT NULL REFERENCES bid_opportunities(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL,
  bidder_type text NOT NULL,
  bid_amount numeric NOT NULL,
  estimated_timeline text,
  proposal_text text,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bid_submissions_bidder_type_check CHECK (bidder_type IN ('architect', 'contractor', 'interior_designer')),
  CONSTRAINT bid_submissions_status_check CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
  -- One submission per bidder per opportunity
  CONSTRAINT bid_submissions_unique_bidder UNIQUE (bid_opportunity_id, bidder_id)
);

-- Enable RLS
ALTER TABLE public.bid_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_submissions ENABLE ROW LEVEL SECURITY;

-- Bid Opportunities Policies
CREATE POLICY "Estimators and admins can create bid opportunities"
ON public.bid_opportunities
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'estimator'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Estimators and admins can update bid opportunities"
ON public.bid_opportunities
FOR UPDATE
USING (
  has_role(auth.uid(), 'estimator'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Professionals can view relevant bid opportunities"
ON public.bid_opportunities
FOR SELECT
USING (
  status = 'open' AND (
    (open_to_architects = true AND has_role(auth.uid(), 'architect'::app_role)) OR
    (open_to_contractors = true AND has_role(auth.uid(), 'contractor'::app_role)) OR
    (open_to_interior_designers = true AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role::text = 'interior_designer'
    )) OR
    has_role(auth.uid(), 'estimator'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Bid Submissions Policies
CREATE POLICY "Professionals can submit bids"
ON public.bid_submissions
FOR INSERT
WITH CHECK (
  auth.uid() = bidder_id AND
  (
    (bidder_type = 'architect' AND has_role(auth.uid(), 'architect'::app_role)) OR
    (bidder_type = 'contractor' AND has_role(auth.uid(), 'contractor'::app_role)) OR
    (bidder_type = 'interior_designer' AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role::text = 'interior_designer'
    ))
  )
);

CREATE POLICY "Bidders can view their own submissions"
ON public.bid_submissions
FOR SELECT
USING (
  auth.uid() = bidder_id OR
  has_role(auth.uid(), 'estimator'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Bidders can update their own submissions"
ON public.bid_submissions
FOR UPDATE
USING (
  auth.uid() = bidder_id AND status IN ('submitted', 'under_review')
);

CREATE POLICY "Admins and estimators can update bid submissions"
ON public.bid_submissions
FOR UPDATE
USING (
  has_role(auth.uid(), 'estimator'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create indexes for performance
CREATE INDEX idx_bid_opportunities_status ON bid_opportunities(status);
CREATE INDEX idx_bid_opportunities_project_id ON bid_opportunities(project_id);
CREATE INDEX idx_bid_opportunities_bid_deadline ON bid_opportunities(bid_deadline);
CREATE INDEX idx_bid_submissions_opportunity_id ON bid_submissions(bid_opportunity_id);
CREATE INDEX idx_bid_submissions_bidder_id ON bid_submissions(bidder_id);
CREATE INDEX idx_bid_submissions_status ON bid_submissions(status);

-- Add interior_designer role to app_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'estimator', 'contractor', 'architect');
  END IF;
  
  -- Try to add interior_designer if it doesn't exist
  BEGIN
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'interior_designer';
  EXCEPTION WHEN others THEN
    -- Ignore if already exists
    NULL;
  END;
END $$;

-- Enable realtime for bid opportunities
ALTER PUBLICATION supabase_realtime ADD TABLE bid_opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE bid_submissions;