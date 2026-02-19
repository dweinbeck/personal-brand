# Requirements: dan-weinbeck.com — v2.0 Tasks App Integration

**Defined:** 2026-02-18
**Core Value:** Visitors can understand who Dan is and see proof of his work within 60 seconds

## v2.0 Requirements

Requirements for integrating the standalone Tasks app into the personal-brand Next.js app. Each maps to roadmap phases.

### Code Migration

- [ ] **MIG-01**: Tasks Prisma schema (6 models: Workspace, Project, Section, Task, Tag, TaskTag) is available in the personal-brand repo
- [ ] **MIG-02**: Tasks server actions (workspace, project, section, task, tag CRUD) work from the personal-brand codebase
- [ ] **MIG-03**: Tasks service layer and Zod validation schemas are integrated into the personal-brand repo
- [ ] **MIG-04**: Tasks UI components (TaskCard, TaskForm, SubtaskList, QuickAddModal, sidebar, board/list views) render correctly in the personal-brand app shell
- [ ] **MIG-05**: Tasks auth uses the shared personal-brand Firebase Auth (same project, same token verification)
- [ ] **MIG-06**: Tasks billing integration calls the personal-brand billing API directly (no external HTTP call needed)

### Database

- [ ] **DB-01**: Prisma client connects to the existing Cloud SQL PostgreSQL database from the personal-brand Cloud Run service
- [ ] **DB-02**: Cloud Run service has `--add-cloudsql-instances` configured for the chatbot-assistant Cloud SQL instance
- [ ] **DB-03**: `DATABASE_URL` environment variable is configured in Cloud Run with the Cloud SQL connector connection string
- [ ] **DB-04**: Existing PostgreSQL data (workspaces, projects, tasks) is preserved — no data migration or schema change required

### Routing

- [ ] **RT-01**: Tasks app is accessible at `/apps/tasks` (not a separate subdomain)
- [ ] **RT-02**: All Tasks sub-pages work at `/apps/tasks/[projectId]`, `/apps/tasks/today`, `/apps/tasks/completed`, `/apps/tasks/search`, `/apps/tasks/tags/[tagId]`
- [ ] **RT-03**: Apps hub listing for Tasks uses internal `/apps/tasks` route instead of external URL
- [ ] **RT-04**: Server actions `revalidatePath` calls use the new `/apps/tasks` path prefix

### Landing Page

- [ ] **LP-01**: Tasks landing page at `/apps/tasks` displays "Welcome to Tasks" in Playfair Display blue heading (matching other app title style)
- [ ] **LP-02**: Landing page shows the existing subtitle text below the title
- [ ] **LP-03**: Landing page has a "Your Tasks at a Glance" KPI card with white background and blue text
- [ ] **LP-04**: KPI card column 1 shows "Tasks completed yesterday: [count]" and "Current Total Tasks: [count]"
- [ ] **LP-05**: KPI card column 2 shows a single card (envelope-sized, light tan background) with the task tagged as "MIT" (Most Important Task)
- [ ] **LP-06**: KPI card column 3 shows two cards (light tan background) with the next two "Next"-tagged tasks
- [ ] **LP-07**: KPI card data is fetched from the PostgreSQL database for authenticated users; unauthenticated users see sign-in prompt

### Sidebar

- [ ] **SB-01**: Tasks sidebar (workspaces, projects, smart views, tags) is integrated into the personal-brand app layout at `/apps/tasks`
- [ ] **SB-02**: Sidebar does NOT include the "Tasks" heading — only the content below it
- [ ] **SB-03**: Sidebar navigation links use `/apps/tasks/...` paths instead of `/tasks/...`

### Feature Parity

- [ ] **FP-01**: Project detail view works with both list and board view modes
- [ ] **FP-02**: Task CRUD (create, edit, delete, toggle status) works from all views
- [ ] **FP-03**: Subtask support works (create, toggle, delete subtasks)
- [ ] **FP-04**: Tag management works (create, assign, filter by tag)
- [ ] **FP-05**: Effort scoring displays and updates correctly on tasks
- [ ] **FP-06**: Today view filters tasks by deadline
- [ ] **FP-07**: Completed view shows completed tasks
- [ ] **FP-08**: Search functionality works across tasks
- [ ] **FP-09**: Quick-add modal creates tasks from any page
- [ ] **FP-10**: Help tips display correctly

### Demo Mode

- [ ] **DM-01**: Demo mode is accessible at `/apps/tasks/demo` with in-memory data (no database required)
- [ ] **DM-02**: Demo banner displays with sign-up CTA
- [ ] **DM-03**: Demo includes ~40 realistic sample tasks with all features (subtasks, tags, effort scores)
- [ ] **DM-04**: Demo mode prevents actual database writes (mutation lockout)

### Decommission

- [ ] **DC-01**: Separate Tasks Cloud Run service is deleted after migration verification
- [ ] **DC-02**: `tasks-deploy-dev` Cloud Build trigger is deleted
- [ ] **DC-03**: Tasks subdomain DNS record is removed or redirected
- [ ] **DC-04**: `NEXT_PUBLIC_TASKS_APP_URL` environment variable is removed from personal-brand
- [ ] **DC-05**: Apps hub no longer references external Tasks URL

## Deferred (v2.1+)

### Tasks Enhancements

- **ENH-01**: Drag-and-drop task reordering in board view
- **ENH-02**: Credit balance display in Tasks app header
- **ENH-03**: Billing history for Tasks app charges
- **ENH-04**: Effort badges in board view cards with column totals
- **ENH-05**: Demo workspace data preservation after sign-up
- **ENH-06**: Guided demo tour

### Site Polish (from v1.9)

- **POL-01**: Tools page & nav restructure (rename Custom GPTs to Tools, reorder navbar)
- **POL-02**: Chatbot popup widget (replace /assistant with persistent popup)
- **POL-03**: Home page enhancements (hero layout, tech tags, reading time, dev tools section)
- **POL-04**: Contact page polish (remove extra sections, unify button styles)

### Content

- **CONT-01**: Real article content with MDX authoring pipeline
- **CONT-02**: Writing page displays real articles (replaces lorem ipsum)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rewriting Tasks from PostgreSQL to Firestore | PostgreSQL is the right database for relational task data (joins, self-referencing FKs, float ordering) |
| Real-time WebSocket updates for tasks | Single-user app; page revalidation is sufficient |
| Drag-and-drop task reordering | v2.1+ enhancement; current float-based ordering works |
| New Tasks features beyond current functionality | v2.0 is a migration milestone, not a feature milestone |
| Changes to the PostgreSQL schema | Existing schema is preserved as-is |
| Migrating other external services (chatbot, brand-scraper) | Out of scope for this milestone |
| v1.9 bug fixes (brand scraper, AI assistant, research assistant) | Deferred; not blocking Tasks integration |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIG-01 | Phase 43 | Pending |
| MIG-02 | Phase 44 | Pending |
| MIG-03 | Phase 44 | Pending |
| MIG-04 | Phase 45 | Pending |
| MIG-05 | Phase 44 | Pending |
| MIG-06 | Phase 44 | Pending |
| DB-01 | Phase 43 | Pending |
| DB-02 | Phase 43 | Pending |
| DB-03 | Phase 43 | Pending |
| DB-04 | Phase 43 | Pending |
| RT-01 | Phase 45 | Pending |
| RT-02 | Phase 45 | Pending |
| RT-03 | Phase 45 | Pending |
| RT-04 | Phase 44 | Pending |
| LP-01 | Phase 46 | Pending |
| LP-02 | Phase 46 | Pending |
| LP-03 | Phase 46 | Pending |
| LP-04 | Phase 46 | Pending |
| LP-05 | Phase 46 | Pending |
| LP-06 | Phase 46 | Pending |
| LP-07 | Phase 46 | Pending |
| SB-01 | Phase 45 | Pending |
| SB-02 | Phase 45 | Pending |
| SB-03 | Phase 45 | Pending |
| FP-01 | Phase 47 | Pending |
| FP-02 | Phase 47 | Pending |
| FP-03 | Phase 47 | Pending |
| FP-04 | Phase 47 | Pending |
| FP-05 | Phase 47 | Pending |
| FP-06 | Phase 47 | Pending |
| FP-07 | Phase 47 | Pending |
| FP-08 | Phase 47 | Pending |
| FP-09 | Phase 47 | Pending |
| FP-10 | Phase 47 | Pending |
| DM-01 | Phase 47 | Pending |
| DM-02 | Phase 47 | Pending |
| DM-03 | Phase 47 | Pending |
| DM-04 | Phase 47 | Pending |
| DC-01 | Phase 48 | Pending |
| DC-02 | Phase 48 | Pending |
| DC-03 | Phase 48 | Pending |
| DC-04 | Phase 48 | Pending |
| DC-05 | Phase 48 | Pending |

**Coverage:**
- v2.0 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after roadmap creation*
