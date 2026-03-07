

# Phase 5: SmartReno Admin Dashboard — Implementation Plan

This is an enormous spec covering 14+ pages. I propose breaking it into **3 implementation sub-phases** to keep each deliverable reviewable. This plan covers **Sub-Phase A** (the highest-priority pages for launch).

## Sub-Phase A: Core Admin Portal (This Implementation)

Build the operational foundation: Dashboard Home, Intake Review, Contractor Management, RFP Management, Bid Review, and Live Projects. These 6 pages let SmartReno operate the full project lifecycle.

### What Already Exists
- `AdminDashboard.tsx` (795 lines) — currently focused on newsletter subscribers, vendor stats, proposal stats. Needs full rebuild.
- `AdminContractorNetwork.tsx` — basic contractor list. Needs rebuild with approval workflow.
- Sidebar config in `adminSidebar.ts` — needs restructuring for new nav.
- Database tables: `projects`, `leads`, `homeowner_leads`, `bid_opportunities`, `bid_submissions`, `bid_line_items`, `contractor_projects`, `contractors`, `contractor_profiles`, `daily_logs`, `timeline_tasks`, `subcontractor_bids`, `vendors`
- No `admin_internal_notes` table exists yet.

### Database Migration

```sql
-- Internal notes for admin annotations on any record
CREATE TABLE admin_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'project', 'contractor', 'lead', 'rfp', 'bid'
  entity_id uuid NOT NULL,
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_internal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage notes" ON admin_internal_notes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));
```

### Sidebar Restructure

Update `adminSidebar.ts` to add a new top-level group "Operations" with the spec's primary nav:
- Dashboard, Intake, Estimating, Contractors, Designers, Vendors, RFPs, Bids, Projects, Messages, Files, Daily Logs, Timeline, Notifications, Settings

### Pages to Build/Rebuild

#### 1. Admin Dashboard Home (`/admin/dashboard`) — REBUILD
Replace the current newsletter-focused dashboard with:
- **KPI Cards**: New Intakes, Estimates In Progress, Contractors Pending, Open RFPs, Bids Due Soon, Active Projects, Needing Attention, Unread Messages (queries across relevant tables)
- **Action Queue**: Priority list pulling from `leads` (status=new), `contractors` (pending_review), `bid_opportunities` (low response), `bid_submissions` (awaiting shortlist), `projects` (flagged)
- **Today's Activity Feed**: Recent inserts across key tables (last 24h)
- **Operational Snapshot**: Stage counts from `projects` grouped by status
- **Alerts Panel**: Hardcoded alert rules (e.g., no daily log in 3+ days, bid deadline < 48h)

Component: `src/pages/admin/AdminDashboardHome.tsx`

#### 2. Intake Review (`/admin/intake`) — NEW
- Table: homeowner name, project type, city, date, budget, completeness, status
- Fetches from `leads` or `homeowner_leads` 
- Detail slide-out panel: homeowner info, address, description, photos, budget, notes
- Status management: new → needs_info → approved_for_scope → ready_for_rfp → archived
- Actions: open, request info, approve, archive

Component: `src/pages/admin/AdminIntakeReview.tsx`

#### 3. Contractor Management (`/admin/contractors`) — REBUILD
- Table: company, contact, trades, service area, status, insurance, license, cost codes, last active
- Fetches from `contractors` + `contractor_profiles`
- Detail panel: company info, uploads, expiration dates, cost code status, portfolio, notes
- Statuses: pending_review, needs_info, approved, suspended, rejected
- Actions: approve, request info, suspend, reject, message

Component: `src/pages/admin/AdminContractorManagement.tsx`

#### 4. RFP Management (`/admin/rfps`) — NEW
- Table: project, city, type, date sent, due date, contractors invited, bids received, status
- Fetches from `bid_opportunities`
- Detail view: project summary, scope package (rfp_scope_items), invited contractors, bid count, deadline countdown
- Statuses: draft, sent, in_progress, bids_received, shortlist_ready, closed
- Actions: create, edit, resend, extend deadline, close

Component: `src/pages/admin/AdminRFPManagement.tsx`

#### 5. Bid Review & Shortlist (`/admin/bids`) — NEW
- Table: project, contractor, total, duration, alternates, exclusions, status, submitted
- Fetches from `bid_submissions` + `bid_line_items`
- **Compare View**: Side-by-side comparison of up to 3 bids (total, scope alignment, alternates, exclusions, duration)
- Actions: open, compare, shortlist, reject, request clarification
- Shortlist goal: select up to 3 bids for homeowner

Component: `src/pages/admin/AdminBidReview.tsx`

#### 6. Live Projects Command Center (`/admin/live-projects`) — NEW
- Table: project, homeowner, contractor, city, phase, health, timeline status, last log
- Fetches from `contractor_projects` where status is active/awarded
- Health status: on_track, watch, delayed, needs_intervention (computed from timeline_tasks + daily_logs)
- Actions: open workspace, view timeline, view messages, view logs, flag
- Project detail: overview, contractor, active subs, current phase, flagged issues

Component: `src/pages/admin/AdminLiveProjects.tsx`

### Routing Changes
Update `App.tsx`:
- `/admin/dashboard` → `AdminDashboardHome`
- `/admin/intake` → `AdminIntakeReview`
- `/admin/contractors` → `AdminContractorManagement`
- `/admin/rfps` → `AdminRFPManagement`
- `/admin/bids` → `AdminBidReview`
- `/admin/live-projects` → `AdminLiveProjects`

### Hooks to Create
- `useAdminKPIs()` — aggregate counts across tables
- `useAdminIntake()` — fetch/filter leads
- `useAdminContractors()` — fetch/filter/update contractors
- `useAdminRFPs()` — fetch/manage bid_opportunities
- `useAdminBids()` — fetch/compare bid_submissions
- `useAdminLiveProjects()` — fetch active projects with health computation

### Sub-Phase B (Next)
- Estimating Hub (field mode, bid packets, cost codes)
- Designers/Architects management
- Vendor monitoring
- File Storage Center

### Sub-Phase C (After B)
- Messages Oversight
- Daily Logs Oversight  
- Timeline Oversight
- Notifications Center
- Admin Project Detail (tabbed workspace)
- Settings

### Technical Notes
- All pages use `AdminLayout` wrapper with updated sidebar
- Tables use existing shadcn Table components with search/filter inputs
- Detail views use slide-out `Sheet` or inline panels (not full page navigations) for speed
- All queries use React Query for caching
- Admin access validated via `is_admin()` RPC

