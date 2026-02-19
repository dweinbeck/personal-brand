---
phase: 47-feature-parity-and-demo-mode
plan: 03
subsystem: ui
tags: [demo-mode, seed-data, route-groups, read-only, nextjs-app-router]

# Dependency graph
requires:
  - phase: 47-01
    provides: Board view, drag-drop, task count badges
  - phase: 47-02
    provides: Smart views (today/completed/search/tags), help tips
provides:
  - Demo mode at /apps/tasks/demo with in-memory seed data
  - DemoProvider context for demo-specific data access
  - DemoBanner with DEMO badge and Sign Up Free CTA
  - DemoSidebar with workspace/project navigation
  - Read-only project views with list/board toggle
  - Route group restructure separating auth from demo
affects: [47-04, landing-page, decommission]

# Tech tracking
tech-stack:
  added: []
  patterns: [Next.js (authenticated) route group for auth bypass, in-memory seed data pattern, read-only demo views]

key-files:
  created:
    - src/data/demo-seed.ts
    - src/components/tasks/demo/DemoProvider.tsx
    - src/components/tasks/demo/DemoBanner.tsx
    - src/components/tasks/demo/DemoSidebar.tsx
    - src/app/apps/tasks/demo/layout.tsx
    - src/app/apps/tasks/demo/page.tsx
    - src/app/apps/tasks/demo/[projectId]/page.tsx
    - src/app/apps/tasks/demo/[projectId]/demo-project-view.tsx
    - src/app/apps/tasks/layout.tsx
  modified:
    - src/app/apps/tasks/(authenticated)/layout.tsx (moved from root)

key-decisions:
  - "Route group (authenticated) separates auth-required routes from public demo route"
  - "Demo uses purely client-side rendering with no server actions or database access"
  - "Minimal root layout.tsx passes children through without auth check"

patterns-established:
  - "Route group pattern: (authenticated) for auth-gated routes, sibling dirs for public routes"
  - "Demo seed data: static in-memory data matching Prisma types for zero-DB demo"

requirements-completed: [DM-01, DM-02, DM-03, DM-04]

# Metrics
duration: 9min
completed: 2026-02-19
---

# Phase 47 Plan 03: Demo Mode Summary

**Complete demo mode at /apps/tasks/demo with ~40 in-memory seed tasks, read-only views, DemoBanner CTA, and (authenticated) route group bypass**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-19T02:49:27Z
- **Completed:** 2026-02-19T02:58:28Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Created demo seed data with 40 tasks across 4 projects (Website Redesign, Marketing Campaign, Launch Checklist, Learning Goals), 2 workspaces, 8 tags, including subtasks, effort scores, deadlines, and completed status
- Restructured tasks routes into (authenticated) route group so demo at /apps/tasks/demo bypasses AuthGuard entirely
- Built complete demo route with DemoModeProvider, DemoProvider context, DemoBanner sticky banner, DemoSidebar navigation, and read-only DemoProjectView with list/board toggle

## Task Commits

Each task was committed atomically:

1. **Task 1: Create demo seed data and demo components** - `22f7baa` (feat)
2. **Task 2: Create demo route structure with layout and project views** - `48b10a6` (feat)

## Files Created/Modified
- `src/data/demo-seed.ts` - 653-line seed data with ~40 tasks, 4 projects, 2 workspaces, 8 tags
- `src/components/tasks/demo/DemoProvider.tsx` - Context provider wrapping demo routes with seed data
- `src/components/tasks/demo/DemoBanner.tsx` - Sticky demo banner with DEMO badge and Sign Up Free CTA
- `src/components/tasks/demo/DemoSidebar.tsx` - Read-only sidebar for demo navigation
- `src/app/apps/tasks/layout.tsx` - Minimal root layout (no auth, just passes children)
- `src/app/apps/tasks/(authenticated)/layout.tsx` - Moved existing auth layout into route group
- `src/app/apps/tasks/demo/layout.tsx` - Demo layout with DemoModeProvider + DemoProvider + banner + sidebar
- `src/app/apps/tasks/demo/page.tsx` - Redirects to first demo project
- `src/app/apps/tasks/demo/[projectId]/page.tsx` - Demo project page using DemoProvider context
- `src/app/apps/tasks/demo/[projectId]/demo-project-view.tsx` - Read-only project view with list/board toggle

## Decisions Made
- Used Next.js (authenticated) route group to separate auth-gated routes from public demo -- avoids layout nesting issues where parent AuthGuard would block unauthenticated demo access
- Demo components are purely client-side with zero server actions or database imports -- all data comes from in-memory seed
- Minimal root layout.tsx renders only {children} with no auth wrapper, allowing both (authenticated) and demo child layouts to handle their own concerns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Demo mode fully functional at /apps/tasks/demo
- All authenticated routes continue to work at same URLs via (authenticated) route group
- Ready for Plan 47-04 (decommission todoist standalone or final integration work)

## Self-Check: PASSED

All 10 created files verified present. Both task commits (22f7baa, 48b10a6) verified in git log.

---
*Phase: 47-feature-parity-and-demo-mode*
*Completed: 2026-02-19*
