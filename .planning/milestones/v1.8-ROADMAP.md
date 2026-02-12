# Roadmap: dan-weinbeck.com

## Milestones

- v1.0 MVP (Phases 1-6) -- shipped 2026-02-03
- v1.1 Page Buildout & Polish (Phases 7-10.1) -- shipped 2026-02-05
- v1.2 Content & Data Integration (Phases 11-12) -- shipped 2026-02-07
- v1.3 Assistant Backend Integration (Phases 13-16) -- shipped 2026-02-08
- v1.4 Control Center (Phases 17-21) -- shipped 2026-02-09
- v1.5 Billing & Credits System (Phases 22-25) -- shipped 2026-02-10
- v1.6 Apps Hub Page (Phase 26) -- shipped 2026-02-10
- v1.7 Apps-first Home + Brand Scraper Overhaul (Phases 27-30) -- shipped 2026-02-11
- **v1.8 Tasks App** (Phases 31-35) -- shipped 2026-02-12

## Phases

### v1.8 Tasks App (Complete)

**Milestone Goal:** Integrate the standalone todoist app into the personal-brand Apps ecosystem with weekly credit gating, and add effort scoring, demo workspace, and help tips to the todoist app itself.

**Repos:** Two-repo milestone
- `todoist` at `/Users/dweinbeck/Documents/todoist` -- standalone Next.js app with PostgreSQL/Prisma
- `personal-brand` at `/Users/dweinbeck/Documents/personal-brand` -- main site with Firebase/Firestore billing

- [x] **Phase 31: Help Tips** - Reusable accessible tooltip component with centralized content catalog ✓ 2026-02-11
- [x] **Phase 32: Effort Scoring** - Optional effort scores on tasks with section and project rollup totals ✓ 2026-02-11
- [x] **Phase 33: Multi-User + Auth** - Firebase Auth integration and userId scoping across all data models ✓ 2026-02-12
- [x] **Phase 34: Weekly Credit Gating** - Billing API, server-enforced read-only mode, apps hub entry, and billing tests ✓ 2026-02-12
- [x] **Phase 35: Demo Workspace** - Pre-populated read-only demo showcasing the full feature set ✓ 2026-02-12

## Phase Details

### Phase 31: Help Tips
**Goal**: Users can discover contextual help for unfamiliar UI elements via accessible gold tooltip icons
**Depends on**: Nothing (zero dependencies, todoist repo only)
**Repo**: todoist
**Requirements**: TIPS-01, TIPS-02, TIPS-03, TIPS-04
**Success Criteria** (what must be TRUE):
  1. User sees a gold "?" icon next to key UI elements; hovering or focusing reveals a tooltip with help text
  2. User can navigate to and trigger help tips using keyboard only (Tab to focus, Escape to dismiss)
  3. Screen reader announces tooltip content via ARIA tooltip role when tip is triggered
  4. Help tips on mobile respond to tap (toggle open/close) and stay within the viewport
  5. All help tip text lives in a single catalog file (not scattered across components)
**Plans:** 1 plan

Plans:
- [x] 31-01-PLAN.md -- HelpTip component, tip catalog, positioning hook, and wiring into 6 UI locations ✓

### Phase 32: Effort Scoring
**Goal**: Users can estimate task complexity with effort scores and see aggregate effort across sections and projects
**Depends on**: Nothing (parallel with Phase 31; help tips wired after both complete)
**Repo**: todoist
**Requirements**: EFFORT-01, EFFORT-02, EFFORT-03, EFFORT-04, EFFORT-05, TEST-02
**Success Criteria** (what must be TRUE):
  1. User can assign an effort score (1, 2, 3, 5, 8, or 13) to any task during creation or editing
  2. User sees an effort badge on scored tasks and no badge (not "0") on unscored tasks
  3. User sees the sum of effort scores for incomplete tasks displayed on each section header
  4. User sees the sum of effort scores for incomplete tasks displayed on each project header
  5. Unit tests verify effort rollup computation handles null values, section sums, and project sums correctly
**Plans:** 2 plans

Plans:
- [x] 32-01-PLAN.md -- Schema change, effort picker UI, and task display ✓
- [x] 32-02-PLAN.md -- Section and project rollup totals with unit tests ✓

### Phase 33: Multi-User + Auth
**Goal**: Users can securely sign in and have their data fully isolated from other users
**Depends on**: Phases 31 + 32 (effort field must exist before userId migration; help tips wired into effort UI)
**Repo**: todoist
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can sign in to the todoist app via Google Sign-In (Firebase Auth, same project as personal-brand)
  2. User sees only their own workspaces, projects, sections, tasks, subtasks, and tags after signing in
  3. Server derives userId exclusively from verified Firebase token -- no client-provided userId is accepted
  4. All Prisma queries include userId filter -- creating data as User A and querying as User B returns nothing
**Plans:** 3 plans

Plans:
- [x] 33-01-PLAN.md -- Firebase Auth setup, AuthContext with cookie sync, and sign-in UI ✓
- [x] 33-02-PLAN.md -- Schema migration (userId columns on Workspace/Task/Tag, backfill, indexes) ✓
- [x] 33-03-PLAN.md -- Query audit and userId enforcement across all services, actions, and pages ✓

### Phase 34: Weekly Credit Gating
**Goal**: Tasks app access is gated by weekly credits with graceful degradation to read-only mode
**Depends on**: Phase 33 (billing requires authenticated userId)
**Repos**: personal-brand + todoist
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07, BILL-08, APPS-01, APPS-02, APPS-03, TEST-01
**Success Criteria** (what must be TRUE):
  1. User's first week of tasks access is free from their first access timestamp
  2. After the free week, user is charged 100 credits/week and retains read-write access while credits remain
  3. When credits are insufficient, user sees all data but cannot create, edit, or delete anything -- a ReadOnlyBanner with "Buy Credits" CTA is shown
  4. Server returns 402 on all mutation endpoints when user is in read-only mode (client-side bypass is impossible)
  5. Tasks app appears on the /apps page with correct metadata and links to the deployed todoist URL
**Plans:** 3 plans

Plans:
- [x] 34-01-PLAN.md -- checkTasksAccess function, billing API route, and tasks_app tool pricing entry ✓
- [x] 34-02-PLAN.md -- Billing guards on all 17 todoist mutation actions, ReadOnlyBanner, FreeWeekBanner, and BillingProvider ✓
- [x] 34-03-PLAN.md -- Apps hub entry and billing unit tests (access logic + tool pricing) ✓

### Phase 35: Demo Workspace
**Goal**: Visitors can explore a realistic pre-populated workspace before signing up, showcasing the full feature set
**Depends on**: Phase 32 (demo tasks need effort scores), Phase 34 (demo is pre-payment onboarding)
**Repo**: todoist
**Requirements**: DEMO-01, DEMO-02, DEMO-03, DEMO-04, DEMO-05
**Success Criteria** (what must be TRUE):
  1. Unauthenticated visitor can view a demo workspace with 30-60 realistic tasks across 3-5 projects showcasing effort scores, subtasks, tags, and multiple structures
  2. Demo workspace runs entirely client-side with zero database writes or API calls
  3. A persistent "DEMO" banner is visible at all times explaining that data is temporary, with a CTA to sign up
  4. All mutation UI elements (create, edit, delete buttons) are disabled or show feedback in demo mode -- no silent failures
**Plans:** 2 plans

Plans:
- [x] 35-01-PLAN.md -- Demo seed data (~40 tasks), /demo route structure, DemoProvider context, DemoSidebar, and DemoProjectView ✓
- [x] 35-02-PLAN.md -- DemoBanner with sign-up CTA, mutation lockout in TaskCard/SubtaskList/SectionHeader, "Try Demo" link on AuthGuard ✓

## Progress

**Execution Order:**
- Wave 1: 31 + 32 (parallel -- both todoist-only, independent)
- Wave 2: 33 (sequential -- riskiest phase, needs focus)
- Wave 3: 34 (sequential -- cross-repo billing)
- Wave 4: 35 (sequential -- depends on all prior)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 31. Help Tips | v1.8 | 1/1 | ✓ Complete | 2026-02-11 |
| 32. Effort Scoring | v1.8 | 2/2 | ✓ Complete | 2026-02-11 |
| 33. Multi-User + Auth | v1.8 | 3/3 | ✓ Complete | 2026-02-12 |
| 34. Weekly Credit Gating | v1.8 | 3/3 | ✓ Complete | 2026-02-12 |
| 35. Demo Workspace | v1.8 | 2/2 | ✓ Complete | 2026-02-12 |
