---
phase: 34-weekly-credit-gating
plan: 02
subsystem: payments
tags: [billing, credits, weekly-gating, server-actions, context-provider]

# Dependency graph
requires:
  - phase: 34-weekly-credit-gating
    plan: 01
    provides: GET /api/billing/tasks/access endpoint for cross-service billing check
  - phase: 33-multi-user-auth
    provides: verifyUser auth guard and idToken parameter on all server actions
provides:
  - checkBillingAccess() server-only helper for cross-service billing check
  - billingGuard() function returning 402 error for readonly mode
  - BillingProvider context with useBilling() hook
  - ReadOnlyBanner and FreeWeekBanner UI components
  - Billing guards on all 17 mutation server actions
affects: [34-03, todoist-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns: [cross-service billing guard on server actions, billing context provider pattern]

key-files:
  created:
    - todoist:src/lib/billing.ts
    - todoist:src/components/billing/BillingProvider.tsx
    - todoist:src/components/billing/ReadOnlyBanner.tsx
    - todoist:src/components/billing/FreeWeekBanner.tsx
  modified:
    - todoist:src/actions/task.ts
    - todoist:src/actions/project.ts
    - todoist:src/actions/section.ts
    - todoist:src/actions/workspace.ts
    - todoist:src/actions/tag.ts
    - todoist:src/app/tasks/layout.tsx

key-decisions:
  - "Billing check gracefully degrades to readwrite on fetch error or missing BILLING_API_URL"
  - "Billing status fetched in parallel with workspace/tag data in layout Promise.all"
  - "BillingProvider wraps entire layout so any client component can access billing status"

patterns-established:
  - "Cross-service billing guard: checkBillingAccess + billingGuard pattern between auth and business logic"
  - "Billing context provider: server fetches status, passes to client via BillingProvider"

# Metrics
duration: 4min
completed: 2026-02-12
---

# Phase 34 Plan 02: Billing Guards and UI Components Summary

**Cross-service billing guards on all 17 todoist mutation actions with ReadOnlyBanner/FreeWeekBanner and BillingProvider context**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T14:35:59Z
- **Completed:** 2026-02-12T14:40:17Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Created checkBillingAccess() and billingGuard() server-only helpers with graceful degradation
- Added billing guards to all 17 mutation server actions (5 task, 3 project, 3 section, 3 workspace, 3 tag)
- Built BillingProvider context with useBilling() hook for client-side billing awareness
- Created ReadOnlyBanner (amber, links to buy credits) and FreeWeekBanner (emerald, trial messaging)
- Updated tasks layout to fetch billing status in parallel and render banners conditionally

## Task Commits

Each task was committed atomically:

1. **Task 1: Billing helper, context provider, and banner components** - `31d0d22` (feat)
2. **Task 2: Wire billing guards into all 17 mutation actions and update layout** - `16ec6e9` (feat)

## Files Created/Modified
- `src/lib/billing.ts` - checkBillingAccess() and billingGuard() server-only functions
- `src/components/billing/BillingProvider.tsx` - Client context provider with useBilling() hook
- `src/components/billing/ReadOnlyBanner.tsx` - Amber banner with Buy Credits external link
- `src/components/billing/FreeWeekBanner.tsx` - Emerald banner with free trial messaging
- `src/actions/task.ts` - Added billing guard to 5 mutation actions
- `src/actions/project.ts` - Added billing guard to 3 mutation actions
- `src/actions/section.ts` - Added billing guard to 3 mutation actions
- `src/actions/workspace.ts` - Added billing guard to 3 mutation actions
- `src/actions/tag.ts` - Added billing guard to 3 mutation actions
- `src/app/tasks/layout.tsx` - Billing fetch, BillingProvider wrapping, conditional banners

## Decisions Made
- Billing check gracefully degrades to readwrite on fetch error or missing BILLING_API_URL (prevents billing service outage from breaking the app)
- Billing status fetched in parallel with workspace/tag data using Promise.all (no added latency)
- BillingProvider wraps entire layout so any nested client component can access billing status via useBilling()

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error for billing fallback in layout**
- **Found during:** Task 2 (build verification)
- **Issue:** Promise.resolve fallback `{ mode: "readwrite", weekStart: "" }` lacked `reason` property, causing TS error when accessing `billing.reason`
- **Fix:** Added explicit `reason: undefined as "free_week" | "unpaid" | undefined` to the fallback object
- **Files modified:** src/app/tasks/layout.tsx
- **Verification:** Build passes cleanly
- **Committed in:** 16ec6e9 (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Necessary type fix for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
Environment variables needed in todoist deployment:
- `BILLING_API_URL` - Set to `https://dan-weinbeck.com` (or `http://localhost:3000` in dev)
- `BILLING_URL` - Set to `https://dan-weinbeck.com/billing` (or `http://localhost:3000/billing` in dev)

Both default gracefully if not set (readwrite mode, fallback URL).

## Next Phase Readiness
- All 17 mutation actions are billing-gated and return 402 when readonly
- Billing UI components ready for user-facing display
- Plan 03 can proceed with end-to-end testing and deployment configuration
- Environment variables need to be set in Cloud Run for production

## Self-Check: PASSED

All files and commits verified.

---
*Phase: 34-weekly-credit-gating*
*Completed: 2026-02-12*
