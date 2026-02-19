---
phase: 44-server-side-code-migration
plan: 02
subsystem: auth, payments
tags: [firebase-admin, billing, server-actions, adapter-pattern]

# Dependency graph
requires:
  - phase: 43-prisma-database-foundation
    provides: Database connectivity and Prisma client for Tasks
provides:
  - Tasks-specific verifyUser(idToken) function using shared Firebase Admin
  - Tasks billing adapter (checkBillingAccess, billingGuard) with direct function imports
affects: [44-03-server-actions-migration]

# Tech tracking
tech-stack:
  added: []
  patterns: [adapter-pattern-for-todoist-migration, server-only-imports]

key-files:
  created:
    - src/lib/tasks/auth.ts
    - src/lib/tasks/billing.ts
  modified: []

key-decisions:
  - "Tasks auth adapter delegates to shared Firebase Admin SDK singleton rather than initializing its own"
  - "Tasks billing adapter calls checkTasksAccess() via direct import, eliminating HTTP calls to BILLING_API_URL"
  - "Graceful degradation: billing defaults to readwrite on auth/billing errors (matches todoist behavior)"

patterns-established:
  - "Adapter pattern: src/lib/tasks/ modules wrap existing personal-brand modules with todoist-compatible API surface"
  - "server-only import: all Tasks server modules include import 'server-only' to prevent client-side usage"

requirements-completed: [MIG-05, MIG-06]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 44 Plan 02: Auth & Billing Adapters Summary

**Tasks auth and billing adapter modules using shared Firebase Admin SDK and direct billing function imports -- no duplicate init, no HTTP calls**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T00:52:38Z
- **Completed:** 2026-02-19T00:54:47Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created Tasks auth adapter (`verifyUser`) that reuses the shared Firebase Admin SDK singleton
- Created Tasks billing adapter (`checkBillingAccess`, `billingGuard`) that calls `checkTasksAccess()` directly via import
- Eliminated need for `BILLING_API_URL` environment variable and HTTP calls for Tasks billing
- Maintained identical API surface to todoist versions for drop-in compatibility with server actions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Tasks auth adapter using shared Firebase Admin** - `1c41b8b` (feat)
2. **Task 2: Create Tasks billing adapter with direct function imports** - `3c79af6` (feat)

## Files Created/Modified
- `src/lib/tasks/auth.ts` - Tasks-specific verifyUser(idToken) that delegates to shared Firebase Admin auth instance
- `src/lib/tasks/billing.ts` - checkBillingAccess(idToken) and billingGuard(billing) using direct function imports

## Decisions Made
- Used shared `auth` export from `@/lib/firebase` rather than any direct `firebase-admin` imports -- ensures single Firebase Admin SDK initialization
- Billing adapter decodes idToken internally to get uid/email, then calls `checkTasksAccess(uid, email)` directly -- eliminates the HTTP round-trip the todoist version used
- Kept graceful degradation behavior: if Firebase Auth or billing check fails, default to `readwrite` mode (same as todoist)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth and billing adapters are ready for Tasks server actions (Plan 03) to import
- `verifyUser(idToken)` provides the exact signature all 5 todoist server action files expect
- `checkBillingAccess(idToken)` and `billingGuard(billing)` provide the exact billing API surface all server actions expect
- No new environment variables required

## Self-Check: PASSED

- FOUND: src/lib/tasks/auth.ts
- FOUND: src/lib/tasks/billing.ts
- FOUND: 44-02-SUMMARY.md
- FOUND: commit 1c41b8b
- FOUND: commit 3c79af6

---
*Phase: 44-server-side-code-migration*
*Completed: 2026-02-19*
