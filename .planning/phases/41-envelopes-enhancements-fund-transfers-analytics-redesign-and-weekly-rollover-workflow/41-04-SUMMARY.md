---
phase: 41-envelopes-enhancements-fund-transfers-analytics-redesign-and-weekly-rollover-workflow
plan: 04
subsystem: api
tags: [rollover, envelopes, firestore, budget-carry-forward, date-fns]

# Dependency graph
requires:
  - phase: 41-envelopes-enhancements-fund-transfers-analytics-redesign-and-weekly-rollover-workflow
    plan: 01
    provides: Envelope system with transfer-aware remaining calculations
  - phase: 41-envelopes-enhancements-fund-transfers-analytics-redesign-and-weekly-rollover-workflow
    plan: 03
    provides: Analytics page with budget utilization and spending trend charts
provides:
  - computeRolloverSurplus() pure function for accumulated surplus across prior weeks
  - EnvelopeWithStatus extended with rolloverSurplusCents field
  - Rollover surplus display on EnvelopeCard and EnvelopeDetailPage
  - Rollover-aware effective budget calculation in listEnvelopesWithRemaining
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [on-the-fly rollover computation from historical transactions without Firestore storage]

key-files:
  created: []
  modified:
    - src/lib/envelopes/firestore.ts
    - src/lib/envelopes/types.ts
    - src/components/envelopes/EnvelopeCard.tsx
    - src/components/envelopes/EnvelopeDetailPage.tsx

key-decisions:
  - "Compute rollover surplus on-the-fly from historical transactions, no separate Firestore document needed"
  - "Rollover surplus added to effective budget (not weeklyBudgetCents) to keep base budget immutable"
  - "Only fetch all historical transactions when at least one envelope has rollover enabled"

patterns-established:
  - "Rollover computation: iterate completed weeks from envelope creation, sum unspent budget per week"
  - "Conditional historical fetch: check for rollover envelopes before querying all transactions"

# Metrics
duration: 3min
completed: 2026-02-17
---

# Phase 41 Plan 04: Weekly Rollover Workflow Summary

**On-the-fly rollover surplus computation from historical transactions with sage-green surplus display on envelope cards and detail pages**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T14:14:59Z
- **Completed:** 2026-02-17T14:18:12Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Pure `computeRolloverSurplus()` function that iterates completed weeks from envelope creation, accumulating unspent budget per week
- `listEnvelopesWithRemaining()` conditionally fetches all historical transactions (only when rollover envelopes exist) and includes surplus in effective budget
- EnvelopeCard shows "+$X.XX rollover" in sage green below budget line when surplus > 0
- EnvelopeDetailPage shows "+$X.XX rollover from prior weeks" in header flex row when surplus > 0
- Non-rollover envelopes and zero-surplus envelopes show no rollover indicator

## Task Commits

Each task was committed atomically:

1. **Task 1: Add rollover computation and integrate into listEnvelopesWithRemaining** - `5e80dca` (feat)
2. **Task 2: Display rollover surplus on EnvelopeCard and EnvelopeDetailPage** - `1f2af46` (feat)

## Files Created/Modified
- `src/lib/envelopes/types.ts` - Extended EnvelopeWithStatus with rolloverSurplusCents field
- `src/lib/envelopes/firestore.ts` - Added computeRolloverSurplus() and integrated rollover into listEnvelopesWithRemaining()
- `src/components/envelopes/EnvelopeCard.tsx` - Added rollover surplus display line below budget
- `src/components/envelopes/EnvelopeDetailPage.tsx` - Added rollover surplus display in budget summary header

## Decisions Made
- Compute rollover surplus on-the-fly from historical transactions rather than storing in a separate Firestore document -- avoids schema complexity and keeps rollover always consistent with actual spending
- Add rollover surplus to effective budget (weeklyBudgetCents + rolloverSurplusCents) when computing remaining, while keeping the base weeklyBudgetCents immutable on the Firestore document
- Only fetch all historical transactions when at least one envelope has rollover: true -- avoids unnecessary queries for users without rollover envelopes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 41 complete: all 4 plans executed (fund transfers backend + UI, analytics redesign, weekly rollover)
- All quality gates pass: lint clean, build succeeds, 202 tests pass

## Self-Check: PASSED

All files verified present, all commit hashes found in git log.

---
*Phase: 41-envelopes-enhancements-fund-transfers-analytics-redesign-and-weekly-rollover-workflow*
*Completed: 2026-02-17*
