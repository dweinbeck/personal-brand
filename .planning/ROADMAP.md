# Roadmap: dan-weinbeck.com

## Milestones

- ✅ **v1.0 MVP** — Phases 1-6 (shipped 2026-02-03)
- ✅ **v1.1 Page Buildout & Polish** — Phases 7-10.1 (shipped 2026-02-05)
- ✅ **v1.2 Content & Data Integration** — Phases 11-12 (shipped 2026-02-07)
- ✅ **v1.3 Assistant Backend Integration** — Phases 13-16 (shipped 2026-02-08)
- ✅ **v1.4 Control Center** — Phases 17-21 (shipped 2026-02-09)
- ✅ **v1.5 Billing & Credits System** — Phases 22-25 (shipped 2026-02-10)
- ✅ **v1.6 Apps Hub Page** — Phase 26 (shipped 2026-02-10)
- ✅ **v1.7 Apps-first Home + Brand Scraper Overhaul** — Phases 27-30 (shipped 2026-02-11)
- ✅ **v1.8 Tasks App** — Phases 31-35 (shipped 2026-02-12)
- ⏸️ **v1.9 Site Restructure & Polish** — Phases 36-42 (deferred — items moved to v2.1+)
- 🚧 **v2.0 Tasks App Integration** — Phases 43-48 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-6) — SHIPPED 2026-02-03</summary>

- [x] Phase 1: Scaffold & Navigation (2/2 plans)
- [x] Phase 2: Home Page (2/2 plans)
- [x] Phase 2.1: Building Blocks (2/2 plans)
- [x] Phase 3: Projects (2/2 plans)
- [x] Phase 4: Contact (2/2 plans)
- [x] Phase 5: SEO, Polish & Stubs (2/2 plans)
- [x] Phase 6: Infrastructure & Deploy (2/2 plans)

</details>

<details>
<summary>✅ v1.1 Page Buildout & Polish (Phases 7-10.1) — SHIPPED 2026-02-05</summary>

- [x] Phase 7-10: Page Redesigns (4 plans)
- [x] Phase 10.1: About Page (2/2 plans)

</details>

<details>
<summary>✅ v1.2 Content & Data Integration (Phases 11-12) — SHIPPED 2026-02-07</summary>

- [x] Phase 11: GitHub API Integration (3/3 plans)
- [x] Phase 12: About Page Logos (1/1 plan)

</details>

<details>
<summary>✅ v1.3 Assistant Backend Integration (Phases 13-16) — SHIPPED 2026-02-08</summary>

- [x] Phase 13: Proxy Integration (2/2 plans)
- [x] Phase 14: Citation & Confidence UI (2/2 plans)
- [x] Phase 15: Dead Code Removal (2/2 plans)
- [x] Phase 16: Dependency & Environment Cleanup (1/1 plan)

</details>

<details>
<summary>✅ v1.4 Control Center (Phases 17-21) — SHIPPED 2026-02-09</summary>

- [x] Phase 17: Control Center Navigation (1/1 plan)
- [x] Phase 18: Content Editor Infrastructure (2/2 plans)
- [x] Phase 19: Content Editor UI (1/1 plan)
- [x] Phase 19.1: Custom GPTs Page (1/1 plan)
- [x] Phase 20: Brand Scraper API Proxy (1/1 plan)
- [x] Phase 21: Brand Scraper UI (2/2 plans)

</details>

<details>
<summary>✅ v1.5 Billing & Credits System (Phases 22-25) — SHIPPED 2026-02-10</summary>

- [x] Phase 22: Code Validation & Commit (1/1 plan)
- [x] Phase 23: Infrastructure Configuration (2/2 plans)
- [x] Phase 24: Deploy & Smoke Test (2/2 plans)
- [x] Phase 25: Go Live (1/1 plan)

</details>

<details>
<summary>✅ v1.6 Apps Hub Page (Phase 26) — SHIPPED 2026-02-10</summary>

- [x] Phase 26: Apps Hub Page (1/1 plan)

</details>

<details>
<summary>✅ v1.7 Apps-first Home + Brand Scraper Overhaul (Phases 27-30) — SHIPPED 2026-02-11</summary>

- [x] Phase 27: Apps-first Home & Schema Alignment (3/3 plans)
- [x] Phase 28: Scraper Service Backend (4/4 plans)
- [x] Phase 29: Brand Card & Progress UI (3/3 plans)
- [x] Phase 30: Assets Page & User History (3/3 plans)

</details>

<details>
<summary>✅ v1.8 Tasks App (Phases 31-35) — SHIPPED 2026-02-12</summary>

- [x] Phase 31: Help Tips (1/1 plan) — completed 2026-02-11
- [x] Phase 32: Effort Scoring (2/2 plans) — completed 2026-02-11
- [x] Phase 33: Multi-User + Auth (3/3 plans) — completed 2026-02-12
- [x] Phase 34: Weekly Credit Gating (3/3 plans) — completed 2026-02-12
- [x] Phase 35: Demo Workspace (2/2 plans) — completed 2026-02-12

</details>

<details>
<summary>⏸️ v1.9 Site Restructure & Polish (Phases 36-42) — DEFERRED (items moved to v2.1+)</summary>

Note: v1.9 phases 36-40 were never started. Phase 40.1, 41, 41.1, and 42 were executed as standalone enhancements outside the v1.9 milestone scope. Remaining v1.9 items (Tools page, chatbot popup, home page enhancements, bug fixes, polish) deferred to v2.1+.

- [ ] Phase 36: Tools Page & Nav Restructure (0/2 plans) — deferred
- [ ] Phase 37: Chatbot Popup Widget (0/2 plans) — deferred
- [ ] Phase 38: Home Page Enhancements (0/2 plans) — deferred
- [ ] Phase 39: Bug Fixes (0/2 plans) — deferred
- [ ] Phase 40: Polish (0/1 plan) — deferred
- [x] Phase 40.1: Testing Feedback Fixes (4/4 plans) — completed 2026-02-16
- [x] Phase 41: Envelopes Enhancements (4/4 plans) — completed
- [x] Phase 41.1: Testing Feedback Round 2 (4/4 plans) — completed
- [x] Phase 42: Envelopes Home Redesign, Income Entries & Analytics Enhancement (4/4 plans) — completed

</details>

### v2.0 Tasks App Integration (In Progress)

**Milestone Goal:** Merge the standalone Tasks app (todoist) into the personal-brand Next.js app for unified deployment, native /apps/tasks routing, and direct billing integration — eliminating a separate Cloud Run service while preserving all existing functionality and data.

- [x] **Phase 43: Prisma & Database Foundation** — Add Prisma to personal-brand, connect to Cloud SQL PostgreSQL, verify schema with existing data (completed 2026-02-19)
- [x] **Phase 44: Server-Side Code Migration** — Migrate server actions, services, Zod schemas, auth integration, and billing wiring (completed 2026-02-19)
- [x] **Phase 45: UI Components & Routing** — Migrate UI components, set up /apps/tasks routes, integrate sidebar (completed 2026-02-19)
- [x] **Phase 46: Landing Page & KPI Dashboard** — Build custom landing page with "Your Tasks at a Glance" card (completed 2026-02-19)
- [ ] **Phase 47: Feature Parity & Demo Mode** — Verify all existing features work end-to-end, demo mode functional
- [ ] **Phase 48: Decommission** — Remove old Tasks service, update apps hub, clean up infrastructure

## Phase Details

### Phase 43: Prisma & Database Foundation
**Goal**: The personal-brand app can read and write to the existing Cloud SQL PostgreSQL database that holds all Tasks data
**Depends on**: Phase 42 (last completed phase)
**Requirements**: MIG-01, DB-01, DB-02, DB-03, DB-04
**Success Criteria** (what must be TRUE):
  1. Running `npx prisma db pull` against the Cloud SQL instance produces a schema matching the 6 Tasks models (Workspace, Project, Section, Task, Tag, TaskTag)
  2. A test server action in the personal-brand app can query the PostgreSQL database and return existing workspace data
  3. The Cloud Run deployment configuration includes the `--add-cloudsql-instances` flag for the chatbot-assistant Cloud SQL instance
  4. Existing PostgreSQL data (workspaces, projects, tasks created in the standalone app) is accessible and unchanged after Prisma integration
**Plans**: 3 plans

Plans:
- [ ] 43-01-PLAN.md — Install Prisma, copy Tasks schema, generate Prisma client, create singleton module
- [ ] 43-02-PLAN.md — Update Dockerfile for Prisma generation, update cloudbuild.yaml with Cloud SQL instance and DATABASE_URL secret
- [ ] 43-03-PLAN.md — Create test server action and API route to verify database read connectivity and data integrity

### Phase 44: Server-Side Code Migration
**Goal**: All Tasks server actions, service logic, and validation schemas execute correctly from the personal-brand codebase with shared Firebase Auth
**Depends on**: Phase 43 (Prisma client available)
**Requirements**: MIG-02, MIG-03, MIG-05, MIG-06, RT-04
**Success Criteria** (what must be TRUE):
  1. Tasks server actions (workspace, project, section, task, tag CRUD) can be imported and called from the personal-brand app
  2. Zod validation schemas reject invalid input with the same error messages as the standalone app
  3. Firebase Auth token verification in Tasks actions uses the same verifyUser() pattern as existing personal-brand actions (no separate auth system)
  4. Tasks billing calls the personal-brand billing API directly via function import (no HTTP call to an external service)
  5. All revalidatePath calls use the `/apps/tasks` prefix instead of `/tasks`
**Plans**: 3 plans

Plans:
- [ ] 44-01-PLAN.md — Copy Zod schemas and Prisma service layer (5 schemas + 5 services)
- [ ] 44-02-PLAN.md — Create auth and billing adapter modules using shared Firebase Admin and direct billing imports
- [ ] 44-03-PLAN.md — Copy and adapt server actions with updated imports and /apps/tasks path prefix, remove Phase 43 test endpoint

### Phase 45: UI Components & Routing
**Goal**: Users can navigate to /apps/tasks and interact with the full Tasks UI (sidebar, views, forms) inside the personal-brand app shell
**Depends on**: Phase 44 (server actions available for UI to call)
**Requirements**: MIG-04, RT-01, RT-02, RT-03, SB-01, SB-02, SB-03
**Success Criteria** (what must be TRUE):
  1. Visiting /apps/tasks renders the Tasks application inside the personal-brand layout (shared navbar, footer)
  2. All Tasks sub-pages work at their new paths: /apps/tasks/[projectId], /apps/tasks/today, /apps/tasks/completed, /apps/tasks/search, /apps/tasks/tags/[tagId]
  3. The Tasks sidebar (workspaces, projects, smart views, tags) appears in the /apps/tasks layout without a redundant "Tasks" heading
  4. All sidebar navigation links use /apps/tasks/... paths
  5. The /apps hub card for Tasks links to /apps/tasks instead of the external tasks.dan-weinbeck.com URL
**Plans**: 3 plans

Plans:
- [ ] 45-01-PLAN.md — Copy all UI components, Tasks-specific UI primitives, types, and utility libs with adapted imports
- [ ] 45-02-PLAN.md — Create /apps/tasks route group with layout (sidebar, billing, auth) and all sub-page routes
- [ ] 45-03-PLAN.md — Update apps hub listing to use internal /apps/tasks route

### Phase 46: Landing Page & KPI Dashboard
**Goal**: Authenticated users see a personalized "Your Tasks at a Glance" dashboard when they visit /apps/tasks, with key metrics and their most important tasks surfaced immediately
**Depends on**: Phase 45 (routing and components in place)
**Requirements**: LP-01, LP-02, LP-03, LP-04, LP-05, LP-06, LP-07
**Success Criteria** (what must be TRUE):
  1. The /apps/tasks landing page displays "Welcome to Tasks" in Playfair Display blue heading with the subtitle below, matching other app title styles
  2. The "Your Tasks at a Glance" KPI card shows three columns: stats (completed yesterday, total tasks), MIT-tagged task (tan card), and Next-tagged tasks (two tan cards)
  3. KPI data is fetched live from PostgreSQL for authenticated users
  4. Unauthenticated users see a sign-in prompt instead of KPI data
**Plans**: 2 plans

Plans:
- [ ] 46-01-PLAN.md — Build landing page layout with title, subtitle, and KPI card skeleton
- [ ] 46-02-PLAN.md — Implement KPI data fetching (completed count, total count, MIT task, Next tasks) and unauthenticated state

### Phase 47: Feature Parity & Demo Mode
**Goal**: Every feature that worked in the standalone Tasks app works identically at /apps/tasks, and visitors can try a fully functional demo without signing in
**Depends on**: Phase 46 (landing page complete, all UI in place)
**Requirements**: FP-01, FP-02, FP-03, FP-04, FP-05, FP-06, FP-07, FP-08, FP-09, FP-10, DM-01, DM-02, DM-03, DM-04
**Success Criteria** (what must be TRUE):
  1. Project detail view renders correctly in both list and board view modes with task CRUD (create, edit, delete, toggle) working from all views
  2. Subtask support works (create, toggle, delete) and tags can be created, assigned, and filtered
  3. Effort scoring displays on tasks and updates correctly; Today view filters by deadline; Completed view shows completed tasks
  4. Search returns matching tasks; Quick-add modal creates tasks from any page; Help tips display correctly
  5. Demo mode at /apps/tasks/demo loads ~40 realistic sample tasks with all features (subtasks, tags, effort scores) using in-memory data only
  6. Demo mode shows a banner with sign-up CTA and prevents any actual database writes
**Plans**: 4 plans

Plans:
- [ ] 47-01-PLAN.md — Verify project detail views (list + board), task CRUD, subtask support, tag management
- [ ] 47-02-PLAN.md — Verify effort scoring, Today view, Completed view, Search, Quick-add modal, Help tips
- [ ] 47-03-PLAN.md — Migrate demo mode components and data to /apps/tasks/demo route
- [ ] 47-04-PLAN.md — End-to-end verification of all features, fix any integration issues found during testing

### Phase 48: Decommission
**Goal**: The standalone Tasks Cloud Run service is fully removed and all traffic routes through the personal-brand app at /apps/tasks
**Depends on**: Phase 47 (all features verified working)
**Requirements**: DC-01, DC-02, DC-03, DC-04, DC-05
**Success Criteria** (what must be TRUE):
  1. The separate Tasks Cloud Run service is deleted from GCP
  2. The `tasks-deploy-dev` Cloud Build trigger is deleted
  3. The tasks subdomain DNS record is removed or redirects to /apps/tasks
  4. The `NEXT_PUBLIC_TASKS_APP_URL` environment variable is removed from the personal-brand service
  5. The /apps hub page links to /apps/tasks with no reference to the external tasks.dan-weinbeck.com URL
**Plans**: 2 plans

Plans:
- [ ] 48-01-PLAN.md — Delete Tasks Cloud Run service, Cloud Build trigger, and tasks subdomain DNS record
- [ ] 48-02-PLAN.md — Remove NEXT_PUBLIC_TASKS_APP_URL env var, verify apps hub listing, final smoke test

## Progress

**Execution Order:**
Phases execute in numeric order: 43 -> 44 -> 45 -> 46 -> 47 -> 48

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 | v1.0 | 14/14 | Complete | 2026-02-03 |
| 7-10.1 | v1.1 | 6/6 | Complete | 2026-02-05 |
| 11-12 | v1.2 | 4/4 | Complete | 2026-02-07 |
| 13-16 | v1.3 | 7/7 | Complete | 2026-02-08 |
| 17-21 | v1.4 | 8/8 | Complete | 2026-02-09 |
| 22-25 | v1.5 | 6/6 | Complete | 2026-02-10 |
| 26 | v1.6 | 1/1 | Complete | 2026-02-10 |
| 27-30 | v1.7 | 13/13 | Complete | 2026-02-11 |
| 31-35 | v1.8 | 11/11 | Complete | 2026-02-12 |
| 36-42 | v1.9 | 16/25 | Deferred | - |
| 43. Prisma & Database Foundation | v2.0 | Complete    | 2026-02-19 | - |
| 44. Server-Side Code Migration | v2.0 | Complete    | 2026-02-19 | - |
| 45. UI Components & Routing | v2.0 | Complete    | 2026-02-19 | - |
| 46. Landing Page & KPI Dashboard | v2.0 | Complete    | 2026-02-19 | - |
| 47. Feature Parity & Demo Mode | v2.0 | 0/4 | Not started | - |
| 48. Decommission | v2.0 | 0/2 | Not started | - |

**Total: 9 milestones shipped, 42 phases through v1.9 | v2.0: 6 phases, 17 plans, not started**

---
*For milestone details, see `.planning/milestones/v[X.Y]-ROADMAP.md`*
*For current requirements, see `.planning/REQUIREMENTS.md`*
