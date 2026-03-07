

# Homeowner Portal — Implementation Plan

This is a large spec (10 pages). I'll break it into **2 sub-phases** to keep things manageable. This plan covers **Sub-Phase A**: the core portal structure and most important pages.

## What Already Exists
- `HomeownerPortal.tsx` (1047 lines) — monolithic tab-based portal with overview, projects, messages, files, warranty. Works but doesn't match the spec's route-based design.
- `homeowner_projects` table — links `homeowner_id` to `contractor_projects`
- `HomeownerFiles.tsx`, `AccountSettings.tsx` — existing pages in `src/pages/homeowner/`
- `ContractorLayout.tsx` — pattern to follow for layout wrapper
- Routes already exist at `/homeowner/portal`, `/homeowner/files`, `/homeowner/account-settings`

## Sub-Phase A (This Build)

Build the new route-based portal with layout, dashboard, project overview, proposals, timeline, and messages. These are the highest-value pages per the spec.

### 1. HomeownerLayout Component
**File**: `src/components/homeowner/HomeownerLayout.tsx`

Follow the `ContractorLayout` pattern:
- `SidebarProvider` wrapper
- Simplified sidebar: Dashboard, My Projects, Messages, Files, Notifications, Profile
- Top bar with notification bell and profile avatar
- Mobile-responsive with `SidebarTrigger`
- Cleaner/calmer styling than contractor portal

### 2. Homeowner Sidebar
**File**: `src/components/homeowner/HomeownerSidebar.tsx`

Simple sidebar with 6 items. No complex grouping. Premium feel.

### 3. Dashboard Page
**File**: `src/pages/homeowner/HomeownerDashboard.tsx`  
**Route**: `/homeowner/dashboard`

- Active Project Card (premium trust block): project title, address, type, status, next step, assigned contractor
- Status Progress Bar with homeowner-friendly labels (Project Submitted → Site Visit → Estimate → Bidding → Contractor Selected → Construction → Final Walkthrough → Completed)
- Recent Updates Feed (last 5 activities from daily_logs, messages, timeline_tasks)
- Quick Action buttons

Data source: `homeowner_projects` → `contractor_projects`, `daily_logs`, `timeline_tasks`

### 4. My Projects Page
**File**: `src/pages/homeowner/HomeownerProjects.tsx`  
**Route**: `/homeowner/projects`

Card-based list of all homeowner projects with status, phase, last updated. Click opens project detail.

### 5. Project Overview (Most Important Screen)
**File**: `src/pages/homeowner/HomeownerProjectOverview.tsx`  
**Route**: `/homeowner/projects/:projectId/overview`

- Top Summary Card: title, address, type, phase, next step, contractor
- "What Happens Next" card with plain-language explanation
- Timeline Snapshot (mini milestone progress)
- Recent Project Updates
- Key Contacts (contractor + SmartReno support)

### 6. Project Detail Layout with Tabs
**File**: `src/pages/homeowner/HomeownerProjectDetail.tsx`  
**Route**: `/homeowner/projects/:projectId`

Tab navigation: Overview | Proposals | Timeline | Messages | Files | Daily Logs  
Renders child routes or tab content.

### 7. Proposals / Contractor Selection
**File**: `src/pages/homeowner/HomeownerProposals.tsx`  
**Route**: `/homeowner/projects/:projectId/proposals`

- Fetch shortlisted bids from `bid_submissions` where status = 'shortlisted' and linked to project
- Proposal cards: contractor name, total, duration, notes
- Compare view (simplified version of admin compare)
- Select Contractor action → updates project status, notifies admin/contractor

### 8. Timeline Page
**File**: `src/pages/homeowner/HomeownerProjectTimeline.tsx`  
**Route**: `/homeowner/projects/:projectId/timeline`

- Read-only milestone view from `timeline_tasks` filtered by project
- Homeowner-friendly labels, status badges (upcoming/in progress/completed/delayed)
- Simple vertical timeline layout, not a Gantt chart

### 9. Messages Page
**File**: `src/pages/homeowner/HomeownerProjectMessages.tsx`  
**Route**: `/homeowner/projects/:projectId/messages`

Reuse existing `ProjectMessaging` component, filtered to homeowner ↔ contractor and homeowner ↔ SmartReno threads only.

### 10. Routing Changes
Update `App.tsx`:
- `/homeowner/dashboard` → `HomeownerDashboard` (wrapped in `HomeownerLayout`)
- `/homeowner/projects` → `HomeownerProjects`
- `/homeowner/projects/:projectId` → `HomeownerProjectDetail`
- `/homeowner/projects/:projectId/overview` → `HomeownerProjectOverview`
- `/homeowner/projects/:projectId/proposals` → `HomeownerProposals`
- `/homeowner/projects/:projectId/timeline` → `HomeownerProjectTimeline`
- `/homeowner/projects/:projectId/messages` → `HomeownerProjectMessages`

All wrapped in `ProtectedRoute` + `HomeownerLayout`.

### 11. Hooks
- `useHomeownerProjects()` — fetch projects via `homeowner_projects` join
- `useHomeownerProjectDetail(projectId)` — single project with milestones, contractor info
- `useHomeownerProposals(projectId)` — fetch shortlisted bids

### No Database Changes Required
All needed tables exist: `homeowner_projects`, `contractor_projects`, `bid_submissions`, `daily_logs`, `timeline_tasks`, `blueprint_files`.

## Sub-Phase B (Next)
- Files page (rebuild with categories)
- Daily Logs page (visual progress photos)
- Notifications center
- Profile page (rebuild)
- Status label mapping (internal → homeowner-friendly)

## Design Notes
- Use large cards with generous spacing
- Muted color palette, no harsh contractor-style UI
- Progress bars use soft gradients
- "What Happens Next" card is the signature trust element
- Mobile-first message and timeline views

