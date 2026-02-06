---
phase: 11-github-api-integration
plan: 03
subsystem: ui
tags: [next.js, server-components, sitemap, seo]

# Dependency graph
requires:
  - phase: 11-01
    provides: fetchAllProjects, EnrichedProject type, projects.json config
provides:
  - Unified data source for homepage featured projects
  - Clickable project cards linking to detail pages
  - SEO-optimized sitemap with project detail URLs
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Async server components fetching shared data"
    - "Featured filtering with slice limit"

key-files:
  created: []
  modified:
    - src/components/home/FeaturedProjects.tsx
    - src/components/home/ProjectCard.tsx
    - src/app/sitemap.ts

key-decisions:
  - "Project cards link to /projects/[slug] detail pages (depends on 11-02)"
  - "Limit homepage to 6 featured projects max"
  - "Sitemap uses pushedAt from GitHub API for lastModified"

patterns-established:
  - "Featured projects filter: allProjects.filter(p => p.featured).slice(0, 6)"
  - "Dynamic sitemap generation from API data"

# Metrics
duration: 2min
completed: 2026-02-06
---

# Phase 11 Plan 03: Homepage Featured Projects Summary

**Unified homepage featured projects with GitHub API data source, matching projects page data**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-06T18:31:56Z
- **Completed:** 2026-02-06T18:34:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- FeaturedProjects component now fetches from fetchAllProjects() (same source as projects page)
- ProjectCard accepts EnrichedProject type and links to /projects/[slug]
- Removed 55 lines of duplicate hardcoded project data
- Sitemap includes all project detail page URLs with GitHub API dates

## Task Commits

Each task was committed atomically:

1. **Task 1: Update FeaturedProjects to use live GitHub data** - `e5641ee` (feat)
2. **Task 2: Update sitemap for new project detail routes** - `e196103` (feat)

## Files Created/Modified

- `src/components/home/FeaturedProjects.tsx` - Async server component fetching from GitHub API
- `src/components/home/ProjectCard.tsx` - Updated to use EnrichedProject, wrapped in Link
- `src/app/sitemap.ts` - Added project detail pages with pushedAt dates

## Decisions Made

- **Project cards link to detail pages:** Cards now navigate to /projects/[slug] even though 11-02 creates the actual pages (wave 2 parallelization)
- **Max 6 featured projects:** Limit ensures homepage stays focused and performant
- **Sitemap uses pushedAt:** GitHub's pushed_at field provides accurate lastModified dates for SEO

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- GitHub API returns 404 for some repos (personal-brand, chicago-bus-text-multiplier) - these are private repos or repos that don't exist yet. This is handled gracefully by falling back to curated-only data with visibility: "private".

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Homepage featured projects ready with unified data source
- Project cards link to /projects/[slug] (requires 11-02 for pages to exist)
- Sitemap ready for search engine discovery of project detail pages
- No blockers for phase completion

---
*Phase: 11-github-api-integration*
*Completed: 2026-02-06*
