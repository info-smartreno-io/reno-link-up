

# Phase 4: Subcontractor System — Implementation Plan

## What Already Exists
- **`subcontractor_bids` table** — created in Phase 3 with trade, company_name, contact_name, phone, email, bid_amount, duration, notes, proposal_url, exclusions_url, status, meeting_date, start_date
- **`ProjectSubcontractors.tsx`** — basic invite/table/award/reject UI already working inside project workspace
- **`useProjectSubcontractorBids.ts`** — CRUD hook for subcontractor_bids
- **`SubcontractorPortal.tsx`** — existing portal at `/contractor/subcontractor-portal` with bid invitations, award notifications, messaging, calendar (421 lines, uses older `sub_bid_packages` + `sub_bid_responses` tables)
- **Existing sub-bid infrastructure**: `SubBidSubmissionDialog`, `SubBidOpportunityCard`, `SubAwardNotification`, `SubDateConfirmationDialog`, `SubMessagesPanel`, `InviteSubcontractorsDialog`, `SubBiddingHub`

## What Needs to Be Built

### 1. Public Sub-Bid Form (`/sub-bid/:projectId/:trade`)
A **public page** (no auth required) where subcontractors submit trade bids via a shareable link.
- Fields: company name, contact name, phone, email, bid amount, duration, notes
- File uploads: proposal, exclusions (to `contractor-documents` bucket)
- Inserts into `subcontractor_bids` table with status `submitted`
- Confirmation screen after submission

### 2. Enhance `ProjectSubcontractors.tsx`
- Add **"Copy Invite Link"** button that generates `/sub-bid/{projectId}/{trade}` URL
- Add **Award Trade dialog** with meeting_date, start_date, duration fields
- Add **View Proposal** button linking to `proposal_url`
- Show invite links per trade in a summary section

### 3. Update Routing
- Add public route `/sub-bid/:projectId/:trade` → new `SubBidPublicForm.tsx` (no `ProtectedRoute` wrapper)

## Files to Create
1. `src/pages/SubBidPublicForm.tsx` — public bid submission form

## Files to Modify
1. `src/components/contractor/workspace/ProjectSubcontractors.tsx` — add invite link generation, award dialog with dates, view proposal
2. `src/App.tsx` — add `/sub-bid/:projectId/:trade` route

## Database Changes
- None required. `subcontractor_bids` table already has all needed columns.
- Need RLS policy update: allow anonymous/public inserts into `subcontractor_bids` for the public form (or use anon key with an insert-only policy).

## Migration
```sql
-- Allow anonymous inserts for public sub-bid form
CREATE POLICY "Public can submit subcontractor bids"
ON subcontractor_bids FOR INSERT
TO anon
WITH CHECK (true);

-- Allow public to read their own submission by id (for confirmation)
CREATE POLICY "Public can read own submitted bids"
ON subcontractor_bids FOR SELECT
TO anon
USING (true);
```

## Permissions Note
Per the handoff spec, subcontractors can: submit trade bid, upload daily logs, message contractor. They cannot: message homeowner, view other trades, view financials. The existing `SubcontractorPortal.tsx` handles the authenticated sub experience. The new public form is purely for bid submission.

