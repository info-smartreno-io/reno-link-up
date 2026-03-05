-- Create table to store bid comparison reports shared with homeowners
CREATE TABLE public.bid_comparison_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_opportunity_id uuid NOT NULL REFERENCES public.bid_opportunities(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.contractor_projects(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  report_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  homeowner_viewed_at timestamp with time zone,
  homeowner_notes text,
  homeowner_selection uuid REFERENCES public.bid_submissions(id) ON DELETE SET NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bid_comparison_reports ENABLE ROW LEVEL SECURITY;

-- Estimators can create and view reports they created
CREATE POLICY "Estimators can create reports"
  ON public.bid_comparison_reports
  FOR INSERT
  WITH CHECK (auth.uid() = created_by AND (
    has_role(auth.uid(), 'estimator'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  ));

CREATE POLICY "Estimators can view their reports"
  ON public.bid_comparison_reports
  FOR SELECT
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can update their reports"
  ON public.bid_comparison_reports
  FOR UPDATE
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Homeowners can view reports for their projects
CREATE POLICY "Homeowners can view their project reports"
  ON public.bid_comparison_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.homeowner_projects hp
      WHERE hp.project_id = bid_comparison_reports.project_id
        AND hp.homeowner_id = auth.uid()
    )
  );

-- Homeowners can update reports for their projects (add notes, selection)
CREATE POLICY "Homeowners can update their project reports"
  ON public.bid_comparison_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.homeowner_projects hp
      WHERE hp.project_id = bid_comparison_reports.project_id
        AND hp.homeowner_id = auth.uid()
    )
  );

-- Add index for faster queries
CREATE INDEX idx_bid_comparison_reports_opportunity ON public.bid_comparison_reports(bid_opportunity_id);
CREATE INDEX idx_bid_comparison_reports_project ON public.bid_comparison_reports(project_id);
CREATE INDEX idx_bid_comparison_reports_homeowner_selection ON public.bid_comparison_reports(homeowner_selection);