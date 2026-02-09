---
phase: quick
plan: 002
subsystem: ui
tags: [react-markdown, github, url-rewriting, readme]

# Dependency graph
requires:
  - phase: 04-projects
    provides: ReadmeRenderer component and project detail page
provides:
  - Relative URL rewriting for README markdown content to GitHub blob/raw URLs
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "react-markdown component overrides for URL rewriting"

key-files:
  created: []
  modified:
    - src/components/projects/ReadmeRenderer.tsx
    - src/app/projects/[slug]/page.tsx

key-decisions:
  - "Used native <img> with biome-ignore for react-markdown overrides (Next Image requires static dimensions)"
  - "Default branch hardcoded to master (verified from git log)"

patterns-established:
  - "ReadmeRenderer repoSlug prop: pass owner/repo to enable GitHub URL resolution"

# Metrics
duration: 2min
completed: 2026-02-08
---

# Quick Task 002: Fix Broken Documentation Links on Project Pages Summary

**react-markdown component overrides rewrite relative links to GitHub blob URLs and images to raw.githubusercontent URLs**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-09T00:32:06Z
- **Completed:** 2026-02-09T00:34:34Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Relative `href` values in README markdown now resolve to `https://github.com/{owner}/{repo}/blob/master/{path}`
- Relative `src` values on images now resolve to `https://raw.githubusercontent.com/{owner}/{repo}/master/{path}`
- External links open in new tabs with `noopener noreferrer`; anchor links pass through unchanged
- Project detail page passes `project.repo` as `repoSlug` prop to ReadmeRenderer

## Task Commits

Each task was committed atomically:

1. **Task 1: Add relative URL rewriting to ReadmeRenderer** - `8377843` (feat)

## Files Created/Modified
- `src/components/projects/ReadmeRenderer.tsx` - Added repoSlug prop, custom `a`/`img` component overrides with URL rewriting logic
- `src/app/projects/[slug]/page.tsx` - Passes `project.repo` to ReadmeRenderer as repoSlug

## Decisions Made
- Used native `<img>` element with biome-ignore suppression in react-markdown component overrides because Next.js `<Image>` requires static width/height dimensions, which are unknown for arbitrary README images
- Hardcoded default branch to `master` since this project and typical repos use master (verified from git log)
- Narrowed `src` type from `string | Blob` to `string` via typeof check to satisfy TypeScript strict mode

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error for img src prop**
- **Found during:** Task 1 (build verification)
- **Issue:** react-markdown's `img` component types `src` as `string | Blob`, but `isAbsoluteUrl()` expects `string`
- **Fix:** Added `typeof src === "string"` narrowing before URL check
- **Files modified:** src/components/projects/ReadmeRenderer.tsx
- **Verification:** `npm run build` passes cleanly
- **Committed in:** 8377843 (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type narrowing necessary for TypeScript compilation. No scope creep.

## Issues Encountered
- Biome lint flagged native `<img>` elements (noImgElement rule) -- suppressed with biome-ignore comments since react-markdown component overrides cannot use Next.js Image (requires static dimensions)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All relative links in rendered READMEs now correctly point to GitHub
- No blockers

---
*Quick task: 002*
*Completed: 2026-02-08*
