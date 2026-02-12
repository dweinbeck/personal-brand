---
phase: 35-demo-workspace
plan: 01
subsystem: ui
tags: [react, next.js, demo, client-side, seed-data]

# Dependency graph
requires: []
provides:
  - "Demo seed data (~40 tasks, 4 projects, 2 workspaces, 8 tags)"
  - "DemoProvider context with useDemoContext hook"
  - "DemoModeProvider and useDemoMode hook"
  - "/demo route with sidebar navigation and project views"
  - "DemoProjectView with list/board toggle (read-only)"
affects: [35-demo-workspace]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Demo route tree: all client-side, zero server imports"
    - "DemoProvider pattern: React context wrapping seed data for demo routes"
    - "Read-only component variants (DemoTaskCard, DemoSectionHeader, DemoBoardView) instead of disabling existing mutation components"

key-files:
  created:
    - src/data/demo-seed.ts
    - src/lib/demo.ts
    - src/components/demo/DemoProvider.tsx
    - src/components/demo/DemoSidebar.tsx
    - src/app/demo/layout.tsx
    - src/app/demo/page.tsx
    - src/app/demo/[projectId]/page.tsx
    - src/app/demo/[projectId]/demo-project-view.tsx
  modified: []

key-decisions:
  - "Read-only demo components (DemoTaskCard, DemoSectionHeader, DemoBoardView) instead of importing existing TaskCard/SectionHeader with disabled mutations"
  - "Deterministic demo-prefixed IDs for URL routing stability"
  - "Relative dates computed from Date.now() so demo data always looks current"

patterns-established:
  - "DemoProvider pattern: context wrapping static seed data for demo routes"
  - "Demo route isolation: /demo/ tree is fully client-side with zero server dependencies"

# Metrics
duration: 4min
completed: 2026-02-12
---

# Phase 35 Plan 01: Demo Workspace Foundation Summary

**Static seed data with ~40 tasks across 4 projects in 2 workspaces, client-side demo routes with DemoProvider, sidebar navigation, and read-only project views with list/board toggle**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T15:48:22Z
- **Completed:** 2026-02-12T15:52:53Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Static demo seed data with ~40 tasks covering all feature variants: effort 1-13 + null, deadlines + overdue + null, subtasks with mixed statuses, tags, sections, completed tasks, and descriptions
- DemoProvider context and DemoModeProvider hook for demo route detection
- Read-only DemoSidebar with workspace/project navigation and task count badges
- DemoProjectView with list/board view toggle, effort rollups at section and project level
- Zero server-side imports in entire demo route tree (verified by grep)
- All existing tests pass (27/27), build succeeds, lint clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Create demo seed data and demo mode hook** - `456f781` (feat)
2. **Task 2: Create demo route structure, DemoProvider, DemoSidebar, and DemoProjectView** - `00c7dcb` (feat)

## Files Created/Modified
- `src/data/demo-seed.ts` - Static seed data: ~40 tasks, 4 projects, 2 workspaces, 8 tags with helper functions
- `src/lib/demo.ts` - useDemoMode hook and DemoModeProvider context
- `src/components/demo/DemoProvider.tsx` - Context provider wrapping demo routes with seed data
- `src/components/demo/DemoSidebar.tsx` - Read-only sidebar for demo with workspace/project navigation
- `src/app/demo/layout.tsx` - Client-side demo layout with DemoProvider and DemoSidebar
- `src/app/demo/page.tsx` - Redirect to first demo project
- `src/app/demo/[projectId]/page.tsx` - Demo project page reading from DemoContext
- `src/app/demo/[projectId]/demo-project-view.tsx` - Read-only project view with list/board toggle, effort rollups

## Decisions Made
- **Read-only demo components instead of reusing existing mutation components:** Created DemoTaskCard, DemoSectionHeader, and DemoBoardView as simplified read-only variants rather than importing TaskCard/SectionHeader (which depend on AuthContext and server actions). This avoids runtime crashes and keeps demo routes fully isolated.
- **Deterministic demo-prefixed IDs:** All demo entity IDs use `demo-` prefix (e.g., `demo-proj-1`, `demo-task-1`) for URL routing stability and clear differentiation from real data.
- **Relative dates from Date.now():** Demo deadlines and timestamps are computed relative to current time so the demo always looks current (overdue items stay overdue, future items stay future).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used read-only demo components instead of importing existing TaskCard/SectionHeader**
- **Found during:** Task 2 (DemoProjectView implementation)
- **Issue:** The plan suggested importing TaskCard and SectionHeader from `@/components/tasks/`, but these components import `useAuth` from `@/context/AuthContext` and server actions from `@/actions/`, which would crash in the demo route (no auth context provided) and violate the zero-server-imports requirement.
- **Fix:** Created local read-only variants (DemoTaskCard, DemoSectionHeader, DemoBoardView) that replicate the visual structure without any mutation UI or auth dependencies.
- **Files modified:** `src/app/demo/[projectId]/demo-project-view.tsx`
- **Verification:** Build passes, zero server imports confirmed by grep, visual structure matches original components.
- **Committed in:** `00c7dcb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential for correctness -- importing auth-dependent components would crash in the unauthenticated demo context. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Demo workspace foundation complete with all routes and seed data
- Ready for Plan 02: DemoBanner, mutation guards, CTA overlay, and link from homepage
- DemoModeProvider is in place for Plan 02 to use `useDemoMode()` in existing components

---
*Phase: 35-demo-workspace*
*Completed: 2026-02-12*
