---
phase: 45-ui-components-routing
plan: 03
subsystem: ui
tags: [routing, apps-hub, tasks, internal-navigation]

# Dependency graph
requires:
  - phase: 45-01
    provides: Tasks UI components and type definitions
provides:
  - Apps hub Tasks card linking to internal /apps/tasks route
affects: [46, 47, 48]

# Tech tracking
tech-stack:
  added: []
  patterns: [Internal routing for integrated apps instead of external URLs]

key-files:
  created: []
  modified:
    - src/data/apps.ts

key-decisions:
  - "Removed clientEnv import entirely since no other app listing used it"
  - "Removed sameTab property since internal Next.js Link handles navigation natively"

patterns-established:
  - "Integrated apps use internal routes (/apps/slug) not external URLs in apps hub listings"

requirements-completed: [RT-03]

# Metrics
duration: 6min
completed: 2026-02-19
---

# Phase 45 Plan 03: Apps Hub Listing Update Summary

**Apps hub Tasks card changed from external tasks.dan-weinbeck.com URL to internal /apps/tasks route**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-19T01:29:26Z
- **Completed:** 2026-02-19T01:35:49Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Changed Tasks app listing href from dynamic `clientEnv().NEXT_PUBLIC_TASKS_APP_URL` to static `"/apps/tasks"`
- Removed `sameTab: true` property (unnecessary for internal navigation)
- Removed unused `clientEnv` import from apps.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Update apps hub listing for Tasks** - `c4f749a` (feat)

## Files Created/Modified
- `src/data/apps.ts` - Tasks listing now uses internal "/apps/tasks" route instead of external URL

## Decisions Made
- Removed `clientEnv` import entirely: no other app listing in the file uses it, so it became dead code after the Tasks href change
- Removed `sameTab` property: only needed for external links that should stay in the same tab; internal Next.js routes navigate natively via `<Link>`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Turbopack build has a pre-existing race condition (`ENOENT: _buildManifest.js.tmp`) unrelated to this change. TypeScript type-check (`tsc --noEmit`) confirms zero type errors in modified files. The 5 pre-existing TS errors are in unrelated research-assistant test files.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Apps hub now links to internal /apps/tasks route
- Combined with 45-01 (UI components) and 45-02 (route pages), Phase 45 is complete
- Ready for Phase 46 (Landing Page) which builds the /apps/tasks public-facing page

## Self-Check: PASSED

- Modified file src/data/apps.ts verified present on disk
- Task commit c4f749a verified in git log

---
*Phase: 45-ui-components-routing*
*Completed: 2026-02-19*
