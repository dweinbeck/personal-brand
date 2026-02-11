---
phase: 27-apps-first-home-schema-alignment
plan: 02
subsystem: ui
tags: [react, next.js, home-page, apps-grid, responsive-grid, tailwind]

# Dependency graph
requires:
  - phase: 27-apps-first-home-schema-alignment (plan 01)
    provides: Project route deletion and redirect setup
provides:
  - AppsGrid component rendering published apps in responsive 3-col grid
  - BuildingBlocksCta component for tutorial discovery CTA
  - Updated home page layout (Hero -> Apps -> Building Blocks)
  - Reduced hero tag spacing
affects: [phase-29, phase-30, any future home page changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Home page apps grid with inline card rendering (not reusing AppCard from /apps)"
    - "mt-auto pt-5 pattern for pinning buttons to bottom of flex cards"

key-files:
  created:
    - src/components/home/AppsGrid.tsx
    - src/components/home/BuildingBlocksCta.tsx
  modified:
    - src/app/page.tsx
    - src/components/home/HeroSection.tsx
    - src/app/sitemap.ts

key-decisions:
  - "Inline card rendering in AppsGrid instead of reusing AppCard from /apps — different button styling (primary + full-width vs secondary + small)"
  - "Removed stale project references from sitemap.ts (blocking build after 27-01 deleted project routes)"

patterns-established:
  - "Home page layout: HeroSection -> AppsGrid -> BuildingBlocksCta"
  - "App cards with variant=primary full-width buttons pinned to bottom via mt-auto"

# Metrics
duration: 20min
completed: 2026-02-11
---

# Phase 27 Plan 02: Home Page Rebuild Summary

**Responsive apps grid with primary "Enter App" buttons, Building Blocks CTA section, reduced hero spacing, and old project sections removed**

## Performance

- **Duration:** 20 min
- **Started:** 2026-02-11T03:32:39Z
- **Completed:** 2026-02-11T03:53:02Z
- **Tasks:** 2
- **Files modified:** 7 (2 created, 3 modified, 2 deleted)

## Accomplishments
- Created AppsGrid component with responsive 3-col grid and blue+gold full-width "Enter App" buttons pinned to card bottoms
- Created BuildingBlocksCta component with CTA title/subtitle above tutorial cards grid
- Updated home page to render HeroSection -> AppsGrid -> BuildingBlocksCta
- Reduced hero tag spacing by ~50% (px-4 py-1.5 gap-2 -> px-3 py-0.5 gap-1.5)
- Deleted FeaturedProjects.tsx and ProjectCard.tsx
- Fixed sitemap.ts to remove stale project references that blocked build

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AppsGrid and BuildingBlocksCta components** - `e54ce11` (feat)
2. **Task 2: Update Home page and reduce hero tag spacing** - `bff39ba` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/components/home/AppsGrid.tsx` - Responsive apps grid with inline card rendering and primary buttons (CREATED)
- `src/components/home/BuildingBlocksCta.tsx` - CTA section with tutorial cards grid (CREATED)
- `src/app/page.tsx` - Updated imports and JSX to use new components
- `src/components/home/HeroSection.tsx` - Reduced tag padding and gap spacing
- `src/app/sitemap.ts` - Removed stale fetchAllProjects import and project URLs
- `src/components/home/FeaturedProjects.tsx` - DELETED
- `src/components/home/ProjectCard.tsx` - DELETED

## Decisions Made
- Rendered app cards inline in AppsGrid rather than reusing AppCard from /apps page, because the home page cards need variant="primary" full-width buttons (blue fill + gold border) while the /apps page uses variant="secondary" smaller buttons
- Removed project references from sitemap.ts as a blocking fix -- plan 27-01 deleted project routes but left sitemap referencing fetchAllProjects, causing build failure

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed stale project references from sitemap.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** sitemap.ts imported fetchAllProjects from @/lib/github and generated /projects URLs, but plan 27-01 already deleted the /projects routes, causing build to fail with type error
- **Fix:** Removed fetchAllProjects import, projects variable, projectUrls generation, /projects static URL entry, and ...projectUrls spread from sitemap return
- **Files modified:** src/app/sitemap.ts
- **Verification:** Build passes with zero errors
- **Committed in:** bff39ba (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for build to pass after parallel plan 27-01 deleted project routes. No scope creep.

## Issues Encountered
- Turbopack build runner had persistent ENOENT race conditions on _buildManifest.js.tmp files, preventing builds from completing. Resolved by using `--webpack` flag instead of Turbopack. This is an environmental issue, not a code problem.
- Parallel agent activity caused file reverts during execution (working directory was reset to HEAD), requiring re-application of edits. This was handled by re-applying all changes and verifying state before committing.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Home page fully rebuilt with apps grid and building blocks CTA
- Ready for phase 27-03 (schema alignment) and phase 29 (combined integration)
- No blockers

---
*Phase: 27-apps-first-home-schema-alignment*
*Completed: 2026-02-11*
