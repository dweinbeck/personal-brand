---
phase: 45-ui-components-routing
plan: 02
subsystem: ui
tags: [react, next.js, routing, tasks, sidebar, billing, auth]

# Dependency graph
requires:
  - phase: 45-01
    provides: 18 Tasks UI components, type definitions, auth cookie helper, sidebar component
  - phase: 44-server-side-code-migration
    provides: Server actions, services, billing adapter
provides:
  - Tasks layout with sidebar, billing provider, auth guard at /apps/tasks
  - 12 route files under src/app/apps/tasks/ covering all Tasks sub-pages
  - Project view with list/board toggle at /apps/tasks/[projectId]
  - Today, Completed, Search, Tags, Tags/[tagId] views
affects: [45-03, 46, 47, 48]

# Tech tracking
tech-stack:
  added: []
  patterns: [Tasks route group under /apps/tasks/, full-height sidebar layout separate from personal-brand Navbar/Footer]

key-files:
  created:
    - src/app/apps/tasks/layout.tsx
    - src/app/apps/tasks/page.tsx
    - src/app/apps/tasks/[projectId]/page.tsx
    - src/app/apps/tasks/[projectId]/project-view.tsx
    - src/app/apps/tasks/today/page.tsx
    - src/app/apps/tasks/completed/page.tsx
    - src/app/apps/tasks/completed/completed-view.tsx
    - src/app/apps/tasks/search/page.tsx
    - src/app/apps/tasks/search/search-input.tsx
    - src/app/apps/tasks/tags/page.tsx
    - src/app/apps/tasks/tags/tag-list.tsx
    - src/app/apps/tasks/tags/[tagId]/page.tsx
  modified: []

key-decisions:
  - "BILLING_URL fallback changed from external URL to /billing (internal route since Tasks is now in-app)"
  - "Tasks layout uses flex h-screen sidebar layout, NOT personal-brand Navbar/Footer"
  - "External redirect page.tsx replaced with proper Tasks landing page"

patterns-established:
  - "Tasks route group: all Tasks pages live under src/app/apps/tasks/ with /apps/tasks/ URL prefix"
  - "Tasks layout: AuthGuard wraps unauthenticated, BillingProvider wraps billing, Sidebar on left, content on right"

requirements-completed: [RT-01, RT-02, SB-01, SB-02, SB-03]

# Metrics
duration: 12min
completed: 2026-02-19
---

# Phase 45 Plan 02: Route Pages Summary

**12 Tasks route files under /apps/tasks/ with sidebar layout, auth guard, billing provider, and all sub-pages (project, today, completed, search, tags)**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-19T01:29:22Z
- **Completed:** 2026-02-19T01:42:03Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Created Tasks layout with sidebar, BillingProvider, AuthGuard integration replacing the external redirect
- Created all 10 sub-route pages with adapted import paths and /apps/tasks/ URL prefix
- All internal navigation links use /apps/tasks/ prefix (completed-view, search-input, tag-list)
- Zero todoist-specific imports remaining in route files
- Build and lint pass cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Tasks layout with sidebar, billing, and auth integration** - `4c4228f` (feat)
2. **Task 2: Create all sub-route pages** - `b21a327` (feat)

## Files Created/Modified
- `src/app/apps/tasks/layout.tsx` - Tasks layout with sidebar, billing, auth guard
- `src/app/apps/tasks/page.tsx` - Tasks landing page (replaced external redirect)
- `src/app/apps/tasks/[projectId]/page.tsx` - Project detail page (server component)
- `src/app/apps/tasks/[projectId]/project-view.tsx` - Project view with list/board toggle (client)
- `src/app/apps/tasks/today/page.tsx` - Today view showing tasks due today
- `src/app/apps/tasks/completed/page.tsx` - Completed tasks page
- `src/app/apps/tasks/completed/completed-view.tsx` - Completed view with project filter
- `src/app/apps/tasks/search/page.tsx` - Search page
- `src/app/apps/tasks/search/search-input.tsx` - Search input with /apps/tasks/search routing
- `src/app/apps/tasks/tags/page.tsx` - Tags management page
- `src/app/apps/tasks/tags/tag-list.tsx` - Tag list with create/delete, links to /apps/tasks/tags/[tagId]
- `src/app/apps/tasks/tags/[tagId]/page.tsx` - Tag detail page with filtered tasks

## Decisions Made
- BILLING_URL fallback changed from `"https://dan-weinbeck.com/billing"` to `"/billing"` since Tasks is now inside the personal-brand app (no cross-origin needed)
- Tasks layout uses its own `flex h-screen` sidebar layout, separate from personal-brand's Navbar/Footer -- this is correct since the Tasks app has sidebar-based navigation
- External redirect page.tsx replaced entirely with a proper Tasks landing page showing workspace welcome or empty state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Biome import ordering and formatting in layout.tsx**
- **Found during:** Task 1 (Layout creation)
- **Issue:** Biome required type imports sorted before value imports, and inline formatting of single-line JSX attribute
- **Fix:** Ran `biome check --fix` to auto-fix import ordering and formatting
- **Files modified:** src/app/apps/tasks/layout.tsx
- **Verification:** `npm run lint` exits 0 with only warnings
- **Committed in:** 4c4228f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor formatting fix, no scope creep.

## Issues Encountered
- Turbopack build encountered transient ENOENT race condition on `_buildManifest.js.tmp` -- resolved by cleaning `.next/` directory and rebuilding. This is a known Next.js 16.1.6 Turbopack issue, not related to the code changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 12 route files created and building cleanly
- Ready for Plan 03 (Landing Page / remaining integration work)
- Sidebar navigation, auth, billing all wired up through layout
- All routes accessible under /apps/tasks/* prefix

## Self-Check: PASSED

- All 12 created files verified present on disk
- Both task commits (4c4228f, b21a327) verified in git log

---
*Phase: 45-ui-components-routing*
*Completed: 2026-02-19*
