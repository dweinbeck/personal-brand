---
phase: 03-projects
plan: 01
subsystem: ui, api
tags: [github-api, isr, react, server-components, responsive-grid]

# Dependency graph
requires:
  - phase: 02-home-page
    provides: ProjectCard component and Project type
provides:
  - fetchGitHubProjects() with ISR caching
  - Project type with homepage field
  - Full /projects page with responsive grid and empty state
affects: [03-02 (FeaturedProjects will use fetchGitHubProjects)]

# Tech tracking
tech-stack:
  added: []
  patterns: [ISR fetch with next.revalidate, async server component data fetching]

key-files:
  created: [src/lib/github.ts]
  modified: [src/types/project.ts, src/components/home/ProjectCard.tsx, src/app/projects/page.tsx, src/components/home/FeaturedProjects.tsx]

key-decisions:
  - "ProjectCard restructured from single <a> to <div> with separate GitHub + Live Demo links"
  - "GitHub API fetches non-fork repos sorted by push date, capped at 100"

patterns-established:
  - "ISR data fetching: use { next: { revalidate: 3600 } } on fetch for hourly cache"
  - "External API layer: src/lib/{service}.ts exports typed async functions"

# Metrics
duration: 2min
completed: 2026-02-02
---

# Phase 3 Plan 1: GitHub Data Layer and Projects Page Summary

**GitHub API data layer with ISR caching, ProjectCard homepage links, and responsive /projects page with empty state**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-03T00:53:26Z
- **Completed:** 2026-02-03T00:55:11Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- GitHub data layer fetching repos with 1-hour ISR revalidation
- Project type extended with homepage field for live demo links
- ProjectCard restructured with separate GitHub and optional Live Demo links
- Full /projects page with responsive 1/2/3-column grid and graceful empty state

## Task Commits

Each task was committed atomically:

1. **Task 1: GitHub data layer and type update** - `ef7dcad` (feat)
2. **Task 2: ProjectCard homepage link and Projects page** - `9f26911` (feat)

## Files Created/Modified
- `src/lib/github.ts` - GitHub API fetch with ISR caching, fork filtering, data normalization
- `src/types/project.ts` - Added homepage: string | null to Project interface
- `src/components/home/ProjectCard.tsx` - Restructured with GitHub + Live Demo links
- `src/app/projects/page.tsx` - Full projects page with async data fetching and empty state
- `src/components/home/FeaturedProjects.tsx` - Added homepage: null to hardcoded projects (type compat)

## Decisions Made
- ProjectCard changed from wrapping `<a>` to `<div>` with two separate link elements to avoid invalid nested anchor HTML
- GitHub API fetches up to 100 repos sorted by push date, filters forks, normalizes null fields

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added homepage: null to FeaturedProjects hardcoded data**
- **Found during:** Task 1 (Project type update)
- **Issue:** Adding required homepage field to Project interface broke FeaturedProjects.tsx hardcoded data
- **Fix:** Added homepage: null to all 6 hardcoded project objects
- **Files modified:** src/components/home/FeaturedProjects.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** ef7dcad (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary type compatibility fix. No scope creep.

## Issues Encountered
- Biome formatter preferred plain spaces over `{" "}` JSX expressions for whitespace in ProjectCard links -- auto-fixed with `biome check --write`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- fetchGitHubProjects() ready for use in FeaturedProjects (plan 03-02)
- /projects page fully functional with live GitHub data
- No blockers

---
*Phase: 03-projects*
*Completed: 2026-02-02*
