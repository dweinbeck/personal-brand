---
phase: 32-effort-scoring
plan: 02
subsystem: ui, utility
tags: [react, effort-scoring, fibonacci, rollup, vitest]

# Dependency graph
requires:
  - phase: 32-01-effort-scoring
    provides: "effort Int? field on Task model, Zod validation, server actions, form selectors, task card badge"
provides:
  - "computeEffortSum() pure function for aggregating effort across task sets"
  - "EFFORT_VALUES shared constant and EffortValue type in src/lib/effort.ts"
  - "Effort sum display on section headers, project header, and board view columns"
  - "9 unit tests covering all edge cases for effort rollup computation"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared constant extraction: EFFORT_VALUES defined once in src/lib/effort.ts, imported everywhere"
    - "Effort rollup: pure function filters OPEN + non-null, sums effort; caller filters subtasks"
    - "Amber effort indicator pattern: text-amber for all effort sum displays"

key-files:
  created:
    - "src/lib/effort.ts"
    - "src/__tests__/effort-rollup.test.ts"
  modified:
    - "src/components/tasks/section-header.tsx"
    - "src/app/tasks/[projectId]/project-view.tsx"
    - "src/components/tasks/board-view.tsx"
    - "src/components/tasks/task-form.tsx"
    - "src/components/tasks/quick-add-modal.tsx"

key-decisions:
  - "computeEffortSum is a pure function that takes {effort, status}[] — caller responsible for excluding subtasks"
  - "Effort sums hidden when 0 (no visual noise for unscored projects)"

patterns-established:
  - "Shared effort utility: all effort-related constants and functions live in src/lib/effort.ts"
  - "Effort rollup display: amber text, parenthesized in headers, 'N effort' label on project level"

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 32 Plan 02: Effort Rollup Summary

**Pure computeEffortSum() utility with rollup sums on section headers, project header, and board columns, plus 9 unit tests covering all edge cases**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T03:36:54Z
- **Completed:** 2026-02-12T03:39:42Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created `src/lib/effort.ts` with shared EFFORT_VALUES constant, EffortValue type, and computeEffortSum() pure function
- Wired effort sum displays into section headers (amber, parenthesized next to task count), project header ("N effort"), unsectioned tasks group, and board view column headers
- Replaced inline EFFORT_VALUES in task-form.tsx and quick-add-modal.tsx with shared import
- Added 9 unit tests covering open-only filtering, null exclusion, empty array, all-completed, all-unscored, mixed scenarios, full value set, and single task

## Task Commits

Each task was committed atomically:

1. **Task 1: Create effort utility and wire rollup sums into section headers and project view** - `ebcb6f0` (feat)
2. **Task 2: Write unit tests for effort rollup computation** - `6d7f632` (test)

## Files Created/Modified
- `src/lib/effort.ts` - Shared EFFORT_VALUES constant, EffortValue type, computeEffortSum() pure function
- `src/__tests__/effort-rollup.test.ts` - 9 unit tests for computeEffortSum and EFFORT_VALUES validation
- `src/components/tasks/section-header.tsx` - Added effortSum prop and amber effort display next to task count
- `src/app/tasks/[projectId]/project-view.tsx` - Added project-level and per-section effort sums, unsectioned effort indicator
- `src/components/tasks/board-view.tsx` - Added per-column effort sum in column headers
- `src/components/tasks/task-form.tsx` - Replaced inline EFFORT_VALUES with import from @/lib/effort
- `src/components/tasks/quick-add-modal.tsx` - Replaced inline EFFORT_VALUES with import from @/lib/effort

## Decisions Made
- computeEffortSum is a pure function taking minimal interface ({effort, status}[]) — caller responsible for filtering subtasks to avoid double-counting
- Effort sums hidden when 0 to avoid visual noise on unscored projects/sections

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed JSX ternary structure in project-view.tsx**
- **Found during:** Task 1 (effort sum display next to project name)
- **Issue:** Effort sum span was placed as sibling to button inside ternary branch, causing parse error (ternary only allows single JSX expression per branch)
- **Fix:** Wrapped the non-editing branch in a React fragment (`<>...</>`)
- **Files modified:** src/app/tasks/[projectId]/project-view.tsx
- **Verification:** Lint and type check pass
- **Committed in:** ebcb6f0 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial JSX structure fix. No scope creep.

## Issues Encountered
- `npm run build` fails during static page generation due to database connectivity (pre-existing issue from Plan 01, unrelated to our changes). Used `npx tsc --noEmit` for type checking instead, which passed cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 32 (Effort Scoring) is fully complete: field, forms, badge, rollup sums, and tests
- Ready for Phase 33 (Multi-User + Auth)
- All 27 tests pass, TypeScript clean, lint clean

## Self-Check: PASSED

- src/lib/effort.ts: FOUND
- src/__tests__/effort-rollup.test.ts: FOUND
- src/components/tasks/section-header.tsx: FOUND
- src/app/tasks/[projectId]/project-view.tsx: FOUND
- src/components/tasks/board-view.tsx: FOUND
- src/components/tasks/task-form.tsx: FOUND
- src/components/tasks/quick-add-modal.tsx: FOUND
- Commit ebcb6f0 (Task 1): FOUND
- Commit 6d7f632 (Task 2): FOUND
- TypeScript: PASSED (zero errors)
- Lint: PASSED (zero errors)
- Tests: PASSED (27/27)

---
*Phase: 32-effort-scoring*
*Completed: 2026-02-11*
