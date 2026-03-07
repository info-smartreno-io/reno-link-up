

# Phase 2: Opportunities + RFP + Bid Builder — Implementation Plan

## What Exists Already
- **`bid_opportunities`** table with title, location, project_type, estimated_budget, bid_deadline, requirements, attachments, square_footage
- **`bid_submissions`** table with bid_amount, proposal_text, estimated_timeline, attachments, status, bidder_id
- **`bid_opportunity_messages`** table for messaging
- **`cost_codes`** table (created in Phase 1) with contractor's pricing library
- **`ContractorBidRoom.tsx`** — existing opportunities + submissions view (basic card layout, no bid builder)
- **`ContractorBids.tsx`** — existing bids list page
- **`ContractorBidSubmissionDialog.tsx`** — simple bid submission dialog (amount, timeline, proposal text, file upload, AI draft)
- Routes already wired: `/contractor/opportunities` → `ContractorBids`, `/contractor/rfp/:rfpId` → `ContractorBidRoom`

## Database Migration

Create `rfp_scope_items` table:
```sql
CREATE TABLE rfp_scope_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_opportunity_id uuid REFERENCES bid_opportunities(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  unit text NOT NULL DEFAULT 'EA',
  quantity numeric NOT NULL DEFAULT 1,
  estimated_unit_price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE rfp_scope_items ENABLE ROW LEVEL SECURITY;
-- Authenticated users can read scope items for open opportunities
CREATE POLICY "Authenticated can read scope items" ON rfp_scope_items FOR SELECT TO authenticated USING (true);
```

Create `bid_line_items` table (contractor's itemized bid linked to cost codes):
```sql
CREATE TABLE bid_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_submission_id uuid REFERENCES bid_submissions(id) ON DELETE CASCADE NOT NULL,
  cost_code_id uuid REFERENCES cost_codes(id) ON DELETE SET NULL,
  description text NOT NULL,
  unit text NOT NULL DEFAULT 'EA',
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  is_alternate boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bid_line_items ENABLE ROW LEVEL SECURITY;
-- Bidders can manage their own line items
CREATE POLICY "Bidders manage own line items" ON bid_line_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM bid_submissions WHERE id = bid_line_items.bid_submission_id AND bidder_id = auth.uid()));
```

## Pages to Build/Rebuild

### 1. `/contractor/opportunities` — Rebuild as Opportunities Page
Replace `ContractorBids` with a new `ContractorOpportunities.tsx`:
- Matched project cards with filters (trade, location, budget range)
- Each card: project type, location, budget, deadline, urgency badge
- Actions: "View Packet" (navigates to `/contractor/rfp/{id}`), "Decline"
- Fetches from `bid_opportunities` where `status = 'open'` and `open_to_contractors = true`

### 2. `/contractor/rfp/{rfpId}` — Full RFP Packet Page
Replace `ContractorBidRoom` with a new `ContractorRFPDetail.tsx`:
- **Tabs**: Overview | Scope of Work | Documents | Messages | Bid Builder
- **Overview tab**: Address, scope summary, estimated budget, deadline
- **Scope of Work tab**: Line items from `rfp_scope_items` table
- **Documents tab**: Attachments from `bid_opportunities.attachments`
- **Messages tab**: Reuse existing `BidMessagingDialog` inline
- **Bid Builder tab** (the core new feature):
  - Auto-populates line items from contractor's `cost_codes`
  - Editable table: Cost Code, Description, Unit, Qty, Unit Price, Total
  - Add line item, add alternate, add exclusions (text area)
  - Summary footer with total
  - "Save Draft" creates/updates `bid_submissions` with status `draft` + inserts `bid_line_items`
  - "Submit Bid" sets status to `submitted`

### 3. `/contractor/bids` — My Bids Page
Rebuild `ContractorBids.tsx` to show all bid submissions with:
- Status badges (draft, submitted, shortlisted, not_selected, awarded)
- Link to RFP detail for each
- Filter by status

## Routing Changes
- `/contractor/opportunities` → new `ContractorOpportunities`
- `/contractor/rfp/:rfpId` → new `ContractorRFPDetail`
- `/contractor/bids` → rebuilt `ContractorMyBids`

## Key Components to Create
1. `ContractorOpportunities.tsx` — opportunities list with cards
2. `ContractorRFPDetail.tsx` — tabbed RFP packet view
3. `BidBuilderTable.tsx` — editable bid line items table with cost code auto-populate
4. `ContractorMyBids.tsx` — bids list with status filters

## Hooks
- `useOpportunities()` — fetch open bid opportunities
- `useBidBuilder(rfpId)` — manage bid line items, save draft, submit
- `useContractorBids()` — fetch contractor's bid submissions

