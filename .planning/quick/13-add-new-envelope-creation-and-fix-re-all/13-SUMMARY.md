---
phase: quick-13
plan: 01
subsystem: ui
tags: [react, envelopes, controlled-input, ux]

# Dependency graph
requires: []
provides:
  - "Always-visible CreateEnvelopeCard outside edit mode"
  - "Raw string state pattern for DonorAllocationRow amount input"
affects: [envelopes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useRef for tracking last emitted value in controlled inputs to avoid stale sync"

key-files:
  created: []
  modified:
    - src/components/envelopes/EnvelopesHomePage.tsx
    - src/components/envelopes/DonorAllocationRow.tsx

key-decisions:
  - "Used useRef instead of reading localValue in useEffect to satisfy exhaustive-deps lint rule"
  - "Rendered create flow outside EnvelopeCardGrid (below it) for cleaner layout in non-edit mode"

patterns-established:
  - "useRef tracking pattern: track lastEmittedCents via ref to distinguish user typing from external prop changes"

requirements-completed: [QUICK-13]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Quick Task 13: Add New Envelope Creation and Fix Allocation Input Summary

**Always-visible CreateEnvelopeCard on main view + raw string state for DonorAllocationRow to prevent cursor jumping**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-21T21:34:42Z
- **Completed:** 2026-02-21T21:38:16Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- CreateEnvelopeCard now visible on main envelopes page without entering edit mode
- DonorAllocationRow amount input accepts natural typing without cursor jumps or forced formatting
- Both edit-mode and non-edit-mode create flows work independently

## Task Commits

Each task was committed atomically:

1. **Task 1: Show CreateEnvelopeCard and inline create form outside edit mode** - `e16aafb` (feat)
2. **Task 2: Fix DonorAllocationRow amount input to use raw string state** - `b13784d` (fix)

## Files Created/Modified
- `src/components/envelopes/EnvelopesHomePage.tsx` - Added non-edit-mode create flow section after EnvelopeCardGrid; reset isCreating when entering edit mode
- `src/components/envelopes/DonorAllocationRow.tsx` - Replaced .toFixed(2) displayValue with local string state + useRef for external sync

## Decisions Made
- Used `useRef` to track `lastEmittedCents` instead of reading `localValue` inside `useEffect` -- avoids exhaustive-deps lint violation while correctly distinguishing user typing from external prop changes
- Placed the non-edit-mode create section outside and below the `EnvelopeCardGrid` (not inside it) to keep the grid layout clean for envelope cards only

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Lint violation with useEffect dependency**
- **Found during:** Task 2 (DonorAllocationRow fix)
- **Issue:** Initial implementation read `localValue` inside `useEffect` without listing it as a dependency, triggering Biome's `useExhaustiveDependencies` error
- **Fix:** Replaced `localValue` comparison with a `useRef(lastEmittedCents)` pattern that tracks the last value emitted by the input, avoiding the need to read `localValue` inside the effect
- **Files modified:** src/components/envelopes/DonorAllocationRow.tsx
- **Verification:** `npx biome check` passes with zero errors
- **Committed in:** b13784d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for lint compliance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Envelope creation and allocation inputs ready for manual testing
- No blockers

## Self-Check: PASSED

- FOUND: src/components/envelopes/EnvelopesHomePage.tsx
- FOUND: src/components/envelopes/DonorAllocationRow.tsx
- FOUND: 13-SUMMARY.md
- FOUND: e16aafb (Task 1 commit)
- FOUND: b13784d (Task 2 commit)

---
*Quick task: 13*
*Completed: 2026-02-21*
