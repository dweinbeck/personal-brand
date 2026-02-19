---
phase: 46-landing-page-kpi-dashboard
plan: 02
subsystem: api
tags: [prisma, postgresql, tasks, kpi, server-component, data-fetching]

# Dependency graph
requires:
  - phase: 46-landing-page-kpi-dashboard
    plan: 01
    provides: "TasksKpiCard server component with placeholder data props"
  - phase: 44-server-code-actions
    provides: "Prisma client, task.service.ts with existing query functions"
provides:
  - "Four KPI data-fetching functions: getCompletedYesterdayCount, getTotalTaskCount, getMitTask, getNextTasks"
  - "Landing page wired to live PostgreSQL data for authenticated users"
affects: [47-feature-parity-enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "KPI query functions using prisma.task.count and prisma.task.findFirst/findMany with tag joins"
    - "Promise.all parallel data fetching in server component page"

key-files:
  created: []
  modified:
    - src/services/tasks/task.service.ts
    - src/app/apps/tasks/page.tsx

key-decisions:
  - "KPI functions query only top-level tasks (parentTaskId === null) to avoid counting subtasks"
  - "Promise.all used to fetch all KPI data + workspaces in parallel for performance"
  - "Unauthenticated users see title/subtitle only; KPI card conditionally rendered when kpiData exists"

patterns-established:
  - "Tag-based task queries: find tag by name first, then query tasks with tags.some filter"
  - "Date-range count pattern: calculate start-of-day boundaries for yesterday/today"

requirements-completed: [LP-04, LP-07]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 46 Plan 02: Data Fetching & KPI Wiring Summary

**Four KPI query functions (completed yesterday, total open, MIT task, Next tasks) with live PostgreSQL data wired into tasks landing page via Promise.all**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T02:08:29Z
- **Completed:** 2026-02-19T02:11:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added four KPI data-fetching functions to task.service.ts: getCompletedYesterdayCount, getTotalTaskCount, getMitTask, getNextTasks
- Replaced placeholder KPI data on landing page with live PostgreSQL queries via Promise.all
- Authenticated users see real completed yesterday count, total open tasks, MIT-tagged task, and up to 2 Next-tagged tasks
- Unauthenticated users see title and subtitle only (layout AuthGuard handles sign-in prompt)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add KPI query functions to task.service.ts** - `0dab5bb` (feat)
2. **Task 2: Wire live KPI data into the landing page** - `f11277e` (feat)

## Files Created/Modified
- `src/services/tasks/task.service.ts` - Added getCompletedYesterdayCount, getTotalTaskCount, getMitTask, getNextTasks functions
- `src/app/apps/tasks/page.tsx` - Replaced placeholder data with live database queries, added Promise.all parallel fetching

## Decisions Made
- KPI functions query only top-level tasks (parentTaskId === null) to avoid inflating counts with subtasks
- Promise.all fetches all KPI data and workspaces in a single parallel batch for optimal performance
- Unauthenticated users see title/subtitle only; KPI card renders conditionally when kpiData is non-null (no redirect needed since layout AuthGuard handles sign-in)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 46 complete: landing page shows live KPI dashboard with real data from PostgreSQL
- Ready for Phase 47 (Feature Parity & Enhancements) or Phase 48 (Decommission)

## Self-Check: PASSED

- FOUND: src/services/tasks/task.service.ts
- FOUND: src/app/apps/tasks/page.tsx
- FOUND: 0dab5bb (Task 1 commit)
- FOUND: f11277e (Task 2 commit)

---
*Phase: 46-landing-page-kpi-dashboard*
*Completed: 2026-02-19*
