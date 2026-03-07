

# Phase 3: Project Workspace — Implementation Plan

## What Already Exists
- **`contractor_projects`** table: id, project_name, client_name, location, project_type, description, status, estimated_value, deadline, contractor_id
- **`contractor_project_documents`** table: file_name, file_path, file_size, file_type, document_type, project_id, uploaded_by
- **`daily_logs`** table: comprehensive logging with log_type, weather, materials, safety, workers — references `contractor_projects`
- **`subcontractors`** table: company_name, contact_name, trade, phone, email, contractor_id, status, user_id
- **No `timeline_tasks` or `subcontractor_bids` tables exist yet**
- **No sub-routes** under `/contractor/projects/:projectId/*` exist

## Database Migrations

### 1. Create `timeline_tasks` table
```sql
CREATE TABLE timeline_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES contractor_projects(id) ON DELETE CASCADE NOT NULL,
  phase_name text NOT NULL,
  start_date date,
  duration_days integer NOT NULL DEFAULT 7,
  sort_order integer NOT NULL DEFAULT 0,
  assigned_trade text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
RLS: contractor members can CRUD on their own projects.

### 2. Create `subcontractor_bids` table
```sql
CREATE TABLE subcontractor_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES contractor_projects(id) ON DELETE CASCADE NOT NULL,
  subcontractor_id uuid REFERENCES subcontractors(id) ON DELETE SET NULL,
  trade text NOT NULL,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  phone text,
  email text,
  bid_amount numeric NOT NULL DEFAULT 0,
  duration text,
  notes text,
  proposal_url text,
  exclusions_url text,
  status text NOT NULL DEFAULT 'pending',
  meeting_date date,
  start_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
RLS: contractor members can manage bids for their projects; subcontractors can insert/view their own.

## Pages to Build

### 1. Project Workspace Layout (`ContractorProjectWorkspace.tsx`)
Parent layout with **6 tabs**: Overview, Documents, Messages, Subcontractors, Daily Logs, Timeline.
Route: `/contractor/projects/:projectId` with nested tab routing.

### 2. Overview Tab (`ProjectOverview.tsx`)
Project summary: name, address, client, status badge, budget, deadline, description.

### 3. Documents Tab (`ProjectDocuments.tsx`)
Uses existing `contractor_project_documents` table. Upload/download files with drag-and-drop via `react-dropzone`. Categorize by type (plans, renderings, selections, contracts).

### 4. Messages Tab (`ProjectMessages.tsx`)
Reuse existing `ProjectMessaging` component, scoped to the project. Conversations: homeowner ↔ contractor, contractor ↔ sub.

### 5. Subcontractors Tab (`ProjectSubcontractors.tsx`)
- Invite trades (select from predefined list, generates link `/sub-bid/:projectId/:trade`)
- View bids table: Company, Bid Amount, Duration, Status
- Actions: View Proposal, Award Trade, Reject

### 6. Daily Logs Tab (`ProjectDailyLogs.tsx`)
Uses existing `daily_logs` table. Form to add new log entries (notes, trade, date, photos). List of past entries.

### 7. Timeline/Gantt Tab (`ProjectTimeline.tsx`)
Uses new `timeline_tasks` table. Horizontal bar chart rendered with plain CSS/div bars. Contractor can edit start date/duration. Read-only for others.

### 8. Projects List (`ContractorProjectsList.tsx`)
Replace existing `ContractorProjects.tsx` with a cleaner awarded-projects list. Each row links to workspace.

## Routing Changes
```
/contractor/projects → ContractorProjectsList
/contractor/projects/:projectId → ContractorProjectWorkspace (default to overview tab)
/contractor/projects/:projectId/overview
/contractor/projects/:projectId/documents
/contractor/projects/:projectId/messages
/contractor/projects/:projectId/subcontractors
/contractor/projects/:projectId/daily-logs
/contractor/projects/:projectId/timeline
```

## Hooks to Create
- `useProjectWorkspace(projectId)` — fetch single project details
- `useProjectTimeline(projectId)` — CRUD timeline_tasks
- `useProjectSubcontractorBids(projectId)` — fetch/manage subcontractor bids
- `useProjectDailyLogs(projectId)` — fetch/add daily logs
- `useProjectDocuments(projectId)` — fetch/upload documents

## Technical Notes
- Tab navigation uses `useNavigate` + `useParams` for clean URLs
- Gantt chart built with CSS grid/flexbox bars (no external library) — each task is a colored bar positioned by start_date offset and width by duration_days
- File uploads go to existing `contractor-documents` storage bucket
- All pages wrapped in `ContractorLayout` with `ProtectedRoute`

