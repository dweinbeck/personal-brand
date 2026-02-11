---
phase: 27-apps-first-home-schema-alignment
plan: 01
subsystem: ui
tags: [next.js, redirects, navigation, sitemap, cleanup]

# Dependency graph
requires: []
provides:
  - Permanent 301 redirects for /projects and /projects/:slug to /
  - Cleaned NavLinks without Projects entry (7 items)
  - Sitemap without /projects URLs or fetchAllProjects import
  - Updated 404 page with current navigation links
  - Deleted all project route and component files
affects: [27-02, 27-03, 29]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js redirects() for legacy route handling"

key-files:
  created: []
  modified:
    - next.config.ts
    - src/components/layout/NavLinks.tsx
    - src/app/sitemap.ts
    - src/app/not-found.tsx
  deleted:
    - src/app/projects/page.tsx
    - src/app/projects/[slug]/page.tsx
    - src/components/projects/ProjectsFilter.tsx
    - src/components/projects/DetailedProjectCard.tsx
    - src/components/projects/ReadmeRenderer.tsx

key-decisions:
  - "Sitemap changes committed by parallel 27-02 session as build blocker fix"

patterns-established:
  - "Legacy route redirects: add to redirects() in next.config.ts with permanent: true"

# Metrics
duration: 22min
completed: 2026-02-10
---

# Phase 27 Plan 01: Remove Projects Section Summary

**Permanent 301 redirects for /projects paths, NavLinks cleanup (7 items), sitemap purge, and 404 page update with all project route/component files deleted**

## Performance

- **Duration:** 22 min
- **Started:** 2026-02-11T03:31:47Z
- **Completed:** 2026-02-11T03:54:21Z
- **Tasks:** 2
- **Files modified:** 9 (4 modified, 5 deleted)

## Accomplishments
- Added permanent redirect rules for /projects and /projects/:slug to / in next.config.ts
- Removed Projects entry from NavLinks (now 7 items: Home, About, Building Blocks, Custom GPTs, Apps, Assistant, Contact)
- Cleaned sitemap.ts: removed fetchAllProjects import, projects variable, projectUrls mapping, /projects static URL
- Updated not-found.tsx navigation: replaced Projects/Writing with Apps (now Home, Building Blocks, Apps, Contact)
- Deleted 5 project files and 2 directories (src/app/projects/, src/components/projects/)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add /projects redirects and delete project route files** - `04525e7` (feat)
2. **Task 2: Update NavLinks, sitemap, and not-found page** - `a7c9be9` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `next.config.ts` - Added redirect rules for /projects and /projects/:slug
- `src/components/layout/NavLinks.tsx` - Removed Projects from baseLinks array
- `src/app/sitemap.ts` - Removed all project-related code (import, variable, mapping, URLs)
- `src/app/not-found.tsx` - Updated navigationLinks: Home, Building Blocks, Apps, Contact
- `src/app/projects/page.tsx` - DELETED
- `src/app/projects/[slug]/page.tsx` - DELETED
- `src/components/projects/ProjectsFilter.tsx` - DELETED
- `src/components/projects/DetailedProjectCard.tsx` - DELETED
- `src/components/projects/ReadmeRenderer.tsx` - DELETED

## Decisions Made
- Sitemap cleanup was also applied by the parallel 27-02 session (as a build blocker fix); both sessions converged on identical changes, no conflict.
- Kept src/lib/github.ts and src/types/project.ts intact since they are still used by FeaturedProjects on the home page.

## Deviations from Plan

None - plan executed exactly as written. The sitemap changes were independently applied by the parallel 27-02 session as well, but both arrived at the same result.

## Issues Encountered
- Parallel plan execution (27-02, 27-03) caused competing build processes sharing the same .next directory, leading to ENOENT and lock errors. Resolved by waiting for competing builds to complete before running verification builds.
- The parallel 27-02 session also committed sitemap.ts changes (removing project references) as part of its own build fix, so sitemap.ts was not in my Task 2 commit (already committed by 27-02).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All /projects routes redirect to / via HTTP 301
- No broken internal links from Projects removal
- NavLinks, sitemap, and 404 page reflect current site structure
- Ready for 27-02 (home page components) and 27-03 (schema alignment)

---
*Phase: 27-apps-first-home-schema-alignment*
*Completed: 2026-02-10*
