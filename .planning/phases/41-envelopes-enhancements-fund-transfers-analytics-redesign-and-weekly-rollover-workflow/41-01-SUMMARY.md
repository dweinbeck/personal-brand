---
phase: 41-envelopes-enhancements-fund-transfers-analytics-redesign-and-weekly-rollover-workflow
plan: 01
subsystem: api
tags: [zod, firestore, transfers, envelopes, rest-api]

# Dependency graph
requires:
  - phase: 40.1-testing-feedback-fixes
    provides: Envelope system with allocations and billing
provides:
  - Transfer Zod schema and TypeScript types
  - transfersCol(), createTransfer(), listTransfersForWeek() Firestore operations
  - POST and GET /api/envelopes/transfers endpoints
  - Firestore compound index for envelope_transfers
  - Transfer-aware remaining calculation in computeEnvelopeStatus and listEnvelopesWithRemaining
affects: [41-02, 41-03, 41-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [runTransaction for atomic transfer writes with pre-computed validation]

key-files:
  created:
    - src/app/api/envelopes/transfers/route.ts
  modified:
    - src/lib/envelopes/types.ts
    - src/lib/envelopes/firestore.ts
    - firestore.indexes.json

key-decisions:
  - "Compute source remaining outside transaction, use runTransaction only for ownership check + write"
  - "Return validation errors (insufficient balance, self-transfer, not found) as 400 not 500"

patterns-established:
  - "Transfer validation: pre-compute remaining (spending + allocations + existing transfers), then atomic write"

# Metrics
duration: 6min
completed: 2026-02-17
---

# Phase 41 Plan 01: Fund Transfer Backend Summary

**Zod-validated fund transfer API with Firestore transactions, remaining-aware balance checks, and compound index**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-17T13:47:48Z
- **Completed:** 2026-02-17T13:54:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Transfer types, Zod schema, and EnvelopeTransfer document type added to types.ts
- createTransfer() uses runTransaction for atomic ownership verification and write, with pre-computed remaining validation
- listTransfersForWeek() returns transfers filtered by user and week range
- computeEnvelopeStatus() and listEnvelopesWithRemaining() now factor transfer amounts into remaining calculations
- POST/GET API endpoints with full auth, billing checks, and Zod validation
- Firestore compound index for envelope_transfers collection

## Task Commits

Each task was committed atomically:

1. **Task 1: Add transfer types, Zod schema, and Firestore operations** - `4433cbe` (feat)
2. **Task 2: Create transfers API route and Firestore index** - `1a2e014` (feat)

## Files Created/Modified
- `src/lib/envelopes/types.ts` - Added transferSchema, TransferInput, EnvelopeTransfer types
- `src/lib/envelopes/firestore.ts` - Added transfersCol(), createTransfer(), listTransfersForWeek(); updated computeEnvelopeStatus() and listEnvelopesWithRemaining() for transfers
- `src/app/api/envelopes/transfers/route.ts` - POST and GET endpoints with auth, billing, validation
- `firestore.indexes.json` - Added compound index for envelope_transfers (userId + weekStart)

## Decisions Made
- Compute source remaining outside Firestore transaction (queries not supported inside transactions), then use runTransaction only for envelope ownership check and atomic write
- Return domain validation errors (insufficient balance, self-transfer, envelope not found) as HTTP 400 with descriptive messages rather than generic 500

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Transfer backend complete, ready for Plan 02 (UI components for fund transfers)
- Firestore index must be deployed before production use (`firebase deploy --only firestore:indexes`)
- All quality gates pass: build, lint, 202 tests

## Self-Check: PASSED

All files verified present, all commit hashes found in git log.

---
*Phase: 41-envelopes-enhancements-fund-transfers-analytics-redesign-and-weekly-rollover-workflow*
*Completed: 2026-02-17*
