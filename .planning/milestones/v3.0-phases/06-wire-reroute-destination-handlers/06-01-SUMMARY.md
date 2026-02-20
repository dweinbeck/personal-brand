---
phase: 06-wire-reroute-destination-handlers
plan: 01
subsystem: api
tags: [next.js, api-routes, github, tasks, discord, vitest]

# Dependency graph
requires:
  - phase: 03-llm-router-destination-handlers
    provides: routeToGitHub, routeToTask destination handlers and RoutingOutput schema
  - phase: 04-builder-inbox-admin-ui
    provides: reroute endpoint skeleton with Firestore-only status update
provides:
  - Working reroute endpoint that executes real destination handlers (GitHub Issues, Tasks)
  - Error handling with capture status marking and Discord alerts
  - 9 unit tests covering all reroute endpoint branches
affects: [builder-inbox, control-center]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dynamic import pattern for destination handlers in reroute (same as router.ts)"
    - "RoutingOutput construction from existing routingResult or raw capture data"

key-files:
  created:
    - src/lib/gsd/__tests__/reroute-route.test.ts
  modified:
    - src/app/api/admin/builder-inbox/[id]/reroute/route.ts

key-decisions:
  - "Cast capture to Record<string, unknown> to access routingResult field not in TypeScript interface"
  - "Construct minimal RoutingOutput with confidence 1.0 for captures without prior LLM classification"

patterns-established:
  - "Admin reroute reuses existing routingResult when available, overriding only the category"
  - "Fire-and-forget Discord alerts on both success and failure paths in reroute"

requirements-completed: [INBOX-REROUTE]

# Metrics
duration: 4min
completed: 2026-02-20
---

# Phase 06 Plan 01: Wire Reroute Destination Handlers Summary

**Reroute endpoint now executes real destination handlers (GitHub Issues, Tasks) with error handling and Discord alerts, replacing Firestore-only status stubs**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-20T19:03:40Z
- **Completed:** 2026-02-20T19:07:53Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Reroute endpoint now calls `routeToGitHub` / `routeToTask` to create real GitHub issues and tasks
- Returns real `destinationRef` (issue URL or task ID) instead of `manual:` prefix
- Error handling marks captures as failed and sends Discord alerts on handler failure
- 9 comprehensive unit tests covering all branches (destinations, errors, fallbacks, auth)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire destination handlers and error handling into reroute endpoint** - `f5d11a7` (feat)
2. **Task 2: Add unit tests for the reroute endpoint** - `be139a8` (test)

## Files Created/Modified
- `src/app/api/admin/builder-inbox/[id]/reroute/route.ts` - Reroute POST handler with real destination handler execution, error handling, and Discord alerts
- `src/lib/gsd/__tests__/reroute-route.test.ts` - 9 unit tests covering GitHub/Tasks/Inbox routing, 404, 500, auth, validation, and fallback paths

## Decisions Made
- Used `as unknown as Record<string, unknown>` cast to access `routingResult` from Firestore document since the TypeScript interface for `getCapture` does not include it
- When capture lacks `routingResult` (never classified by LLM), construct a minimal `RoutingOutput` with `confidence: 1.0` and `priority: "medium"` from raw transcript/context

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript cast error for capture-to-Record conversion**
- **Found during:** Task 1 (Wire destination handlers)
- **Issue:** Direct cast from `CaptureInput & { status: string }` to `Record<string, unknown>` failed TypeScript's overlap check
- **Fix:** Used double cast through `unknown` (`capture as unknown as Record<string, unknown>`)
- **Files modified:** src/app/api/admin/builder-inbox/[id]/reroute/route.ts
- **Verification:** `npm run build` passes without type errors
- **Committed in:** f5d11a7 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type casting adjustment. No scope creep.

## Issues Encountered
None beyond the type cast fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Reroute endpoint is fully functional end-to-end
- All quality gates pass: lint, build, 236 tests (including 9 new)
- Ready for phase 6 plan 2 if applicable

## Self-Check: PASSED

- FOUND: src/app/api/admin/builder-inbox/[id]/reroute/route.ts
- FOUND: src/lib/gsd/__tests__/reroute-route.test.ts
- FOUND: .planning/phases/06-wire-reroute-destination-handlers/06-01-SUMMARY.md
- FOUND: f5d11a7 (Task 1 commit)
- FOUND: be139a8 (Task 2 commit)

---
*Phase: 06-wire-reroute-destination-handlers*
*Completed: 2026-02-20*
