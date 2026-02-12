---
phase: 33-multi-user-auth
plan: 02
subsystem: database
tags: [prisma, postgresql, schema-migration, expand-contract, firebase-auth]

# Dependency graph
requires:
  - phase: 33-01
    provides: "Firebase Auth context, getUserIdFromCookie() server helper"
provides:
  - "Required userId column on Workspace, Task, and Tag models"
  - "Per-user tag uniqueness via @@unique([userId, name])"
  - "Indexes on userId for query scoping (userId, userId+status, userId+deadlineAt)"
  - "Backfill script at scripts/backfill-userid.ts for reference"
  - "Auth-guarded create actions (workspace, task, tag)"
affects: [33-03-query-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Expand-and-contract migration: add nullable, backfill, make required"
    - "userId threaded through action -> service -> Prisma create chain"

key-files:
  created:
    - "/Users/dweinbeck/Documents/todoist/scripts/backfill-userid.ts"
  modified:
    - "/Users/dweinbeck/Documents/todoist/prisma/schema.prisma"
    - "/Users/dweinbeck/Documents/todoist/src/services/workspace.service.ts"
    - "/Users/dweinbeck/Documents/todoist/src/services/task.service.ts"
    - "/Users/dweinbeck/Documents/todoist/src/services/tag.service.ts"
    - "/Users/dweinbeck/Documents/todoist/src/actions/workspace.ts"
    - "/Users/dweinbeck/Documents/todoist/src/actions/task.ts"
    - "/Users/dweinbeck/Documents/todoist/src/actions/tag.ts"
    - "/Users/dweinbeck/Documents/todoist/tsconfig.json"

key-decisions:
  - "Exclude scripts/ from tsconfig to avoid type errors from backfill script after schema contraction"
  - "Wire userId into create actions and services as part of schema contraction (blocking build fix)"

patterns-established:
  - "Create actions verify auth via getUserIdFromCookie() before proceeding"
  - "Service functions accept userId as explicit parameter (not fetched inside service)"

# Metrics
duration: 4min
completed: 2026-02-12
---

# Phase 33 Plan 02: Schema Contraction Summary

**Expand-and-contract migration: userId added as required column on Workspace, Task, Tag with per-user tag uniqueness and auth-guarded create operations**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T13:49:10Z
- **Completed:** 2026-02-12T13:53:35Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Schema contracted: userId is now a required String on Workspace, Task, and Tag models
- Tag uniqueness changed from global `@unique(name)` to per-user `@@unique([userId, name])`
- All create operations (workspace, task, tag) now require auth and pass userId through the full chain
- Backfill script ran successfully (0 rows to update -- clean database)

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand schema (nullable userId) and create backfill script** - `feff2b4` (feat)
2. **Task 2: Run backfill and contract schema** - `caf1c79` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - userId String (required) on Workspace, Task, Tag; @@unique([userId, name]) on Tag
- `scripts/backfill-userid.ts` - One-time backfill script (assigns Firebase UID to existing rows)
- `src/services/workspace.service.ts` - createWorkspace accepts userId parameter
- `src/services/task.service.ts` - createTask accepts userId parameter
- `src/services/tag.service.ts` - createTag accepts userId parameter
- `src/actions/workspace.ts` - Auth check + userId passed to createWorkspace
- `src/actions/task.ts` - Auth check + userId passed to createTask
- `src/actions/tag.ts` - Auth check + userId passed to createTag
- `tsconfig.json` - Exclude scripts/ directory from type checking

## Decisions Made

- **Exclude scripts/ from tsconfig:** Backfill script uses `where: { userId: null }` which is invalid after contraction. Scripts are one-time utilities, not application code.
- **Wire auth into create actions now (not Plan 03):** Build fails without userId in create calls. This is a necessary prerequisite, not scope creep.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Wired userId through create actions and services**
- **Found during:** Task 2 (schema contraction)
- **Issue:** After making userId required, `npm run build` failed because `createWorkspace`, `createTask`, and `createTag` did not provide userId in their Prisma create calls
- **Fix:** Added userId parameter to service functions, added `getUserIdFromCookie()` auth check in server actions, passed userId through to Prisma
- **Files modified:** 6 service/action files + tsconfig.json
- **Verification:** Build passes, tests pass (27/27), lint clean
- **Committed in:** caf1c79 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary for build to pass. Overlaps slightly with Plan 03 (query audit) scope but only covers create operations -- read queries still need userId scoping in Plan 03.

## Issues Encountered

- Backfill updated 0 rows because database had no existing data. This is expected for a fresh development database.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema is fully contracted with required userId on all 3 models
- Create operations are auth-guarded and userId-aware
- Ready for Plan 03: query audit to add userId filtering to all read/update/delete queries
- Read queries (findMany, findFirst, etc.) still return all users' data -- Plan 03 will scope these

## Self-Check: PASSED

All 9 key files verified present. Both task commits (feff2b4, caf1c79) verified in git log.

---
*Phase: 33-multi-user-auth*
*Completed: 2026-02-12*
