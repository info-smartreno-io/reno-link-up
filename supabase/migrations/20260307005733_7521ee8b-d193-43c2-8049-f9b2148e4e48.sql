-- Phase 2: RFP Scope Items and Bid Line Items tables

CREATE TABLE public.rfp_scope_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_opportunity_id uuid REFERENCES public.bid_opportunities(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  unit text NOT NULL DEFAULT 'EA',
  quantity numeric NOT NULL DEFAULT 1,
  estimated_unit_price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rfp_scope_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read scope items"
  ON public.rfp_scope_items FOR SELECT TO authenticated USING (true);

CREATE TABLE public.bid_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_submission_id uuid REFERENCES public.bid_submissions(id) ON DELETE CASCADE NOT NULL,
  cost_code_id uuid REFERENCES public.cost_codes(id) ON DELETE SET NULL,
  description text NOT NULL,
  unit text NOT NULL DEFAULT 'EA',
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  is_alternate boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bid_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bidders manage own line items"
  ON public.bid_line_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bid_submissions 
    WHERE id = bid_line_items.bid_submission_id 
    AND bidder_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bid_submissions 
    WHERE id = bid_line_items.bid_submission_id 
    AND bidder_id = auth.uid()
  ));

CREATE POLICY "Admins can read all line items"
  ON public.bid_line_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));