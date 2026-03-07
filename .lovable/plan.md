

# SmartReno Contractor Portal Overhaul — Implementation Plan

This is a large-scale rebuild of the contractor portal. The existing website, homepage, homeowner forms, and marketing pages remain untouched. The work focuses entirely on the `/contractor/*` routes and supporting database tables.

Given the scope (15+ pages, 5+ new DB tables, complex workflows), this will be implemented in **5 phases**, each deliverable independently.

---

## What Already Exists

The project already has significant infrastructure:
- **Database tables**: `contractors`, `contractor_onboarding`, `contractor_pricing_items`, `contractor_projects`, `subcontractors`, `daily_logs`, `bid_opportunities`, `bid_submissions`, `bid_opportunity_messages`
- **Pages**: ~55 files in `src/pages/contractor/` — most are the old portal design and will be replaced
- **Layout**: `ContractorLayout`, `ConsolidatedContractorSidebar`, `BottomNav`
- **Auth**: `ContractorAuth` with role-based login

Key gaps (tables that need to be created):
- `cost_codes` — contractor pricing library (CSV/Excel upload)
- `rfp_scope_items` — line-item scope breakdown for RFPs
- `subcontractor_bids` — trade-level bids from subs
- `timeline_tasks` — Gantt chart phases
- `contractor_portfolio_images` — project gallery

---

## Phase 1: Onboarding Flow + Simplified Dashboard

**Database migrations:**
1. Create `cost_codes` table (contractor_id, code, description, unit, labor_rate, material_rate, total_unit_price)
2. Create `contractor_portfolio_images` table (contractor_id, image_url, caption, project_type)
3. Add columns to `contractor_onboarding`: `company_address`, `years_in_business`, `crew_size`, `trades` (text[]), `w9_url`, `license_expiry`, `insurance_expiry`, `onboarding_status` (pending_review/approved/rejected)
4. Create storage bucket `contractor-documents` for license, insurance, W9, portfolio uploads

**Pages to build/rebuild:**
- `/contractor/onboarding` — 6-step wizard (Company Info → Trades → Uploads → Cost Codes → Portfolio → Submit)
  - Step 4 includes CSV/Excel parser for cost codes using `FileReader` + manual parsing
  - Step 6 sets status to `pending_review`
- `/contractor/dashboard` — Rebuild with new layout:
  - Top: "Today's Opportunities" cards
  - KPI row: Matched Opportunities, Active Bids, Awarded Projects, Messages
  - My Projects list
  - Right panel: Notifications

**Sidebar rebuild:**
- Simplify `ConsolidatedContractorSidebar` to: Dashboard, Opportunities, Bids, Projects, Messages, Profile, Settings

---

## Phase 2: Opportunities + RFP + Bid Builder

**Database migrations:**
1. Create `rfp_scope_items` (bid_opportunity_id, description, unit, quantity, estimated_unit_price)
2. Add `match_criteria` jsonb to `bid_opportunities` for trade/area/size matching

**Pages:**
- `/contractor/opportunities` — Matched project cards with Preview/Submit Bid/Decline actions, filtered by trade + service area + project size
- `/contractor/rfp/{rfpId}` — Full bid packet view with tabs: Overview, Scope of Work, Measurements, Documents, Messaging, RFI
- **Bid Builder** (component within RFP page):
  - Auto-populates from contractor's `cost_codes`
  - Editable quantity, price override, add line items, alternates, exclusions
  - Save Draft / Submit Bid
- `/contractor/bids` — List of all bids with status badges (draft, submitted, shortlisted, not_selected, awarded)

---

## Phase 3: Project Workspace

**Database migrations:**
1. Create `timeline_tasks` (project_id, phase_name, start_date, duration_days, sort_order, assigned_trade, status)
2. Create `subcontractor_bids` (project_id, subcontractor_id, trade, company_name, contact_name, phone, email, bid_amount, duration, notes, proposal_url, exclusions_url, status, meeting_date, start_date)

**Pages:**
- `/contractor/projects` — List of awarded projects
- `/contractor/projects/{projectId}/overview` — Project summary
- `/contractor/projects/{projectId}/documents` — Upload/view plans, renderings, selections
- `/contractor/projects/{projectId}/messages` — Messaging (homeowner ↔ contractor, contractor ↔ sub)
- `/contractor/projects/{projectId}/daily-logs` — Log entry form (notes, photos, issues, trade, date)
- `/contractor/projects/{projectId}/timeline` — Gantt chart using timeline_tasks, editable by contractor, read-only for others

---

## Phase 4: Subcontractor System

**Pages:**
- `/contractor/projects/{projectId}/subcontractors` — Invite trades, view bids table, Award/Reject/Message actions
- `/sub-bid/{projectId}/{trade}` — Public subcontractor bid form (company, contact, phone, email, bid amount, duration, notes, file uploads)
- Award flow: set meeting date, start date, duration → notification to sub → Accept/Request Change/Decline

**Permissions enforcement:**
- Subs can only: submit trade bid, upload daily logs, message contractor
- Subs cannot: message homeowner, view other trades, view financials

---

## Phase 5: Notifications + Polish

- In-app notification system using existing `notifications` infrastructure
- Trigger events: new RFP, RFI response, bid deadline, sub accepted award, timeline change
- Email notifications via existing Resend integration
- Design polish: fast, simple, job-focused feel

---

## Technical Approach

- **Routing**: All new pages use `ContractorLayout` wrapper and `ProtectedRoute` with `requiredRole="contractor"`
- **Existing pages**: Old contractor pages (SalesPipeline, Collections, ContractorPortalHub, etc.) will be kept in the codebase but removed from the sidebar nav. Routes remain functional for backward compatibility.
- **State management**: React Query for all data fetching, consistent with existing patterns
- **File uploads**: Supabase Storage with `contractor-documents` bucket
- **CSV parsing**: Client-side parsing with validation, no external library needed

---

## Recommended Starting Order

Start with **Phase 1** (Onboarding + Dashboard) since it's the entry point for all contractors and establishes the new portal foundation.

