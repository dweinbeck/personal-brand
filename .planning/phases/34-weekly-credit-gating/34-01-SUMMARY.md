---
phase: 34-weekly-credit-gating
plan: 01
subsystem: payments
tags: [firebase, firestore, billing, credits, weekly-gating]

# Dependency graph
requires:
  - phase: 33-multi-user-auth
    provides: verifyUser auth guard for API routes
provides:
  - checkTasksAccess() function for weekly credit gating
  - GET /api/billing/tasks/access endpoint for cross-service billing check
  - tasks_app tool pricing seed entry at 100 credits
affects: [34-02, 34-03, todoist-repo-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [cross-service billing API mirroring envelope pattern]

key-files:
  created:
    - src/lib/billing/tasks.ts
    - src/app/api/billing/tasks/access/route.ts
  modified:
    - src/lib/billing/tools.ts
    - src/lib/billing/__tests__/credits.test.ts

key-decisions:
  - "Mirror checkEnvelopeAccess pattern exactly for tasks billing (same free-week, paid-week, debit flow)"
  - "Inline types in tasks.ts rather than separate types file (simplicity for single-function module)"

patterns-established:
  - "Cross-service billing check: GET endpoint returns {mode, reason, weekStart} for authenticated user"

# Metrics
duration: 6min
completed: 2026-02-12
---

# Phase 34 Plan 01: Billing API for Tasks App Summary

**checkTasksAccess() with weekly credit gating and GET /api/billing/tasks/access cross-service endpoint**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-12T14:27:01Z
- **Completed:** 2026-02-12T14:33:13Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `checkTasksAccess()` mirroring `checkEnvelopeAccess()` with tasks_billing collection and tasks_app tool key
- Added GET /api/billing/tasks/access endpoint for cross-service billing check (Bearer token auth)
- Added `tasks_app` to TOOL_PRICING_SEED at 100 credits, active

## Task Commits

Each task was committed atomically:

1. **Task 1: checkTasksAccess function and types** - `f45277d` (feat)
2. **Task 2: Billing access API route** - `cd8cf0b` (feat)

## Files Created/Modified
- `src/lib/billing/tasks.ts` - TasksBilling/TasksAccessResult types and checkTasksAccess() function
- `src/app/api/billing/tasks/access/route.ts` - GET endpoint for cross-service billing check
- `src/lib/billing/tools.ts` - Added tasks_app entry to TOOL_PRICING_SEED
- `src/lib/billing/__tests__/credits.test.ts` - Updated active tools set to include tasks_app

## Decisions Made
- Mirrored `checkEnvelopeAccess()` pattern exactly -- same free-week, paid-week, debit flow, same error handling
- Inlined types in tasks.ts (TasksBilling, TasksAccessResult) rather than creating a separate types file for simplicity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated credits test to include tasks_app in active tools set**
- **Found during:** Task 2 (verification step)
- **Issue:** Existing test `placeholder tools are inactive` had hardcoded active keys (brand_scraper, dave_ramsey) and expected all other tools to be inactive. New tasks_app entry (active: true) caused test failure.
- **Fix:** Added `tasks_app` to the activeKeys set in both the "active tools are marked active" and "placeholder tools are inactive" tests
- **Files modified:** src/lib/billing/__tests__/credits.test.ts
- **Verification:** All 26 tests pass
- **Committed in:** cd8cf0b (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Necessary test update for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Billing API endpoint ready for todoist repo to call server-to-server
- Plan 02 can build the todoist-side integration that calls GET /api/billing/tasks/access
- tasks_app pricing needs to be seeded in production Firestore (happens automatically via seedToolPricing on first access)

## Self-Check: PASSED

All files and commits verified.

---
*Phase: 34-weekly-credit-gating*
*Completed: 2026-02-12*
