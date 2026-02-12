---
phase: 35-demo-workspace
plan: 02
subsystem: ui
tags: [react, next.js, demo, client-side, mutation-guard]

# Dependency graph
requires:
  - phase: 35-01
    provides: "DemoModeProvider, useDemoMode hook, demo route structure"
provides:
  - "DemoBanner with DEMO badge, explanatory text, and Sign Up Free CTA"
  - "Mutation guards on TaskCard, SubtaskList, SectionHeader using useDemoMode()"
  - "Try Demo entry point on AuthGuard sign-in screen"
affects: [35-demo-workspace]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useDemoMode() guard pattern: early return or conditional rendering to disable mutations in demo context"
    - "DemoBanner sticky overlay: persistent CTA banner above page content"

key-files:
  created:
    - src/components/demo/DemoBanner.tsx
  modified:
    - src/app/demo/layout.tsx
    - src/components/tasks/task-card.tsx
    - src/components/tasks/subtask-list.tsx
    - src/components/tasks/section-header.tsx
    - src/components/auth/AuthGuard.tsx

key-decisions:
  - "useDemoMode() defaults to false so guards are no-ops outside /demo -- zero impact on regular /tasks usage"
  - "Hide edit/delete buttons entirely in demo (not just disable) for cleaner read-only experience"
  - "SectionHeader renders span instead of button in demo mode to prevent any click-to-edit behavior"

patterns-established:
  - "Demo mutation guard: import useDemoMode(), check isDemo, hide or neuter mutation controls"

# Metrics
duration: 3min
completed: 2026-02-12
---

# Phase 35 Plan 02: Demo Banner, Mutation Guards, and Try Demo Link Summary

**Persistent DEMO banner with Sign Up CTA, useDemoMode() guards on all task/subtask/section mutations, and "try the demo" entry point on AuthGuard sign-in screen**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T15:55:29Z
- **Completed:** 2026-02-12T15:58:47Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Sticky DemoBanner at top of all demo pages with DEMO badge, explanatory text, and "Sign Up Free" CTA linking to /tasks
- TaskCard toggle button inert in demo mode (no crash, no server call), edit/delete buttons hidden entirely
- SubtaskList toggle inert in demo, delete and add buttons hidden
- SectionHeader name rendered as non-clickable span in demo, delete button hidden
- AuthGuard shows "or try the demo" link for unauthenticated visitors linking to /demo
- All guards use useDemoMode() which defaults to false -- zero behavioral change for regular /tasks users
- Build, lint, type-check, and all 27 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DemoBanner and wire into demo layout** - `8f91fc3` (feat)
2. **Task 2: Guard mutations in TaskCard, SubtaskList, SectionHeader + add Try Demo link** - `4d3c7d2` (feat)

## Files Created/Modified
- `src/components/demo/DemoBanner.tsx` - Sticky banner with DEMO badge, explanatory text, and Sign Up Free CTA
- `src/app/demo/layout.tsx` - Updated to render DemoBanner above sidebar/main flex container
- `src/components/tasks/task-card.tsx` - useDemoMode guard: toggle inert, edit/delete hidden in demo
- `src/components/tasks/subtask-list.tsx` - useDemoMode guard: toggle inert, delete/add hidden in demo
- `src/components/tasks/section-header.tsx` - useDemoMode guard: name as span (not button), delete hidden in demo
- `src/components/auth/AuthGuard.tsx` - "or try the demo" link for unauthenticated users

## Decisions Made
- **useDemoMode() defaults to false:** Guards are no-ops outside /demo route tree, ensuring zero impact on regular /tasks usage for authenticated users.
- **Hide vs disable mutation buttons:** Chose to hide edit/delete/add buttons entirely rather than rendering disabled versions, for a cleaner read-only demo experience.
- **Span vs disabled button for section names:** Rendered a `<span>` instead of a `<button>` in demo mode so section names are truly non-interactive (no hover state, no cursor change).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Demo workspace is complete: seed data, routes, read-only views, DemoBanner, mutation guards, and discovery link
- Phase 35 fully complete -- all demo workspace features implemented
- Ready for deployment to Cloud Run

## Self-Check: PASSED

All 7 files verified present. Both commits (8f91fc3, 4d3c7d2) verified in git log.

---
*Phase: 35-demo-workspace*
*Completed: 2026-02-12*
