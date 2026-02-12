---
phase: 34-weekly-credit-gating
plan: 03
subsystem: testing
tags: [vitest, billing, credits, weekly-gating, apps-hub]

# Dependency graph
requires:
  - phase: 34-weekly-credit-gating
    plan: 01
    provides: checkTasksAccess function and tasks_app tool pricing seed
provides:
  - Tasks app listing on /apps page
  - Unit tests for tasks_app pricing (100 credits, active)
  - Unit tests for checkTasksAccess decision tree (6 paths)
affects: [todoist-repo-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [Firestore mock pattern for testing billing access functions]

key-files:
  created:
    - src/lib/billing/__tests__/tasks-access.test.ts
  modified:
    - src/data/apps.ts
    - src/lib/billing/__tests__/credits.test.ts

key-decisions:
  - "Tasks app is external link (not hosted on personal-brand), so no sitemap entry needed"
  - "Firestore mock pattern: mock collection/doc/transaction at module level, reset in beforeEach"

patterns-established:
  - "Mocking checkTasksAccess/checkEnvelopeAccess: vi.mock firebase + firestore, dynamic import after mocks"

# Metrics
duration: 4min
completed: 2026-02-12
---

# Phase 34 Plan 03: Apps Hub Entry and Billing Unit Tests Summary

**Tasks app added to /apps page with full billing access test coverage (6 decision paths) and pricing verification**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T14:35:41Z
- **Completed:** 2026-02-12T14:39:53Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added Task Manager entry to getApps() with slug "tasks", tag "Productivity", and TASKS_APP_URL env var
- Created comprehensive unit tests for checkTasksAccess covering all 6 decision paths
- Added tasks_app-specific pricing test verifying 100 credits, active, zero cost

## Task Commits

Each task was committed atomically:

1. **Task 1: Apps hub entry** - `0a81c16` (feat)
2. **Task 2: Billing unit tests** - `f854c60` (test)

## Files Created/Modified
- `src/data/apps.ts` - Added tasks app listing with slug "tasks", title "Task Manager"
- `src/lib/billing/__tests__/credits.test.ts` - Added tasks_app pricing test (100 credits, active, zero cost)
- `src/lib/billing/__tests__/tasks-access.test.ts` - 6 test cases covering free week, already paid, successful charge, 402 insufficient credits, tool config error, and idempotency key format

## Decisions Made
- Tasks app is an external link (not hosted on personal-brand), so no sitemap.ts modification needed -- the existing /apps page sitemap entry covers discoverability
- Used vi.mock with dynamic import pattern for Firestore mocking to test checkTasksAccess without real Firebase connection

## Deviations from Plan

None - plan executed exactly as written. The credits.test.ts active keys update was already done in 34-01, so only the new tasks_app-specific pricing test was added.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Tasks app visible on /apps page and ready for users
- All billing logic verified with automated tests (33 tests total, all passing)
- Phase 34 complete: billing API (34-01), integration docs (34-02), apps hub + tests (34-03)

## Self-Check: PASSED

All files and commits verified.

---
*Phase: 34-weekly-credit-gating*
*Completed: 2026-02-12*
