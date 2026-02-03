---
phase: 05-seo-polish-and-stubs
plan: 02
subsystem: seo
tags: [sitemap, robots, lighthouse, performance, accessibility]

# Dependency graph
requires:
  - phase: 05-seo-polish-and-stubs-01
    provides: "SEO metadata on all pages"
  - phase: 02.1-building-blocks
    provides: "Tutorial slugs for sitemap"
provides:
  - "Dynamic sitemap.xml with all static and tutorial routes"
  - "robots.txt allowing full crawling with sitemap reference"
  - "Lighthouse 90+ scores across all four categories"
affects: [06-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Next.js sitemap/robots convention files", "fetchpriority=high for LCP image"]

key-files:
  created: [src/app/sitemap.ts, src/app/robots.ts]
  modified: [src/components/home/HeroSection.tsx, src/components/home/FeaturedProjects.tsx, src/components/home/ProjectCard.tsx]

key-decisions:
  - "Added priority prop to headshot Image to fix LCP (fetchpriority=high)"
  - "Added underline to inline text links for WCAG link-in-text-block compliance"

patterns-established:
  - "Next.js convention file pattern: export default function returning MetadataRoute type"

# Metrics
duration: 5min
completed: 2026-02-03
---

# Phase 5 Plan 2: Sitemap, Robots & Lighthouse Audit Summary

**Dynamic sitemap.xml and robots.txt convention files with Lighthouse audit achieving 95/100/100/100 scores**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-03T13:09:04Z
- **Completed:** 2026-02-03T13:14:00Z
- **Tasks:** 2
- **Files created:** 2
- **Files modified:** 3

## Accomplishments
- sitemap.ts generates dynamic XML with 6 static routes plus all tutorial slugs
- robots.ts allows all crawlers and references sitemap URL
- Lighthouse scores: Performance 95, Accessibility 100, Best Practices 100, SEO 100
- Fixed LCP by adding priority prop to headshot Image (reduced from 6s to ~2s)
- Fixed accessibility link-in-text-block by adding underline to inline text links

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sitemap.ts and robots.ts convention files** - `10ea30b` (feat)
2. **Task 2: Lighthouse audit and fix issues below 90** - `fdcf23f` (perf)

## Files Created/Modified
- `src/app/sitemap.ts` - Dynamic sitemap with static routes and tutorial slugs
- `src/app/robots.ts` - Robots config allowing all crawlers with sitemap reference
- `src/components/home/HeroSection.tsx` - Added priority prop to headshot Image for LCP
- `src/components/home/FeaturedProjects.tsx` - Added underline to inline GitHub link
- `src/components/home/ProjectCard.tsx` - Added underline to GitHub and Live Demo links

## Lighthouse Scores

| Category | Score |
|----------|-------|
| Performance | 95 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

## Decisions Made
- Added `priority` prop to headshot Image component (sets fetchpriority="high") to fix LCP -- the image was the largest contentful paint element at 6s without priority hint
- Added `underline` class to inline text links (GitHub, project links) to satisfy WCAG link-in-text-block rule requiring links to be distinguishable by more than color alone

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] LCP image missing fetchpriority**
- **Found during:** Task 2 (Lighthouse audit)
- **Issue:** Headshot image was the LCP element at 6.0s without fetchpriority="high"
- **Fix:** Added `priority` prop to Image component in HeroSection.tsx
- **Files modified:** src/components/home/HeroSection.tsx
- **Commit:** fdcf23f

**2. [Rule 2 - Missing Critical] Inline links missing underline for accessibility**
- **Found during:** Task 2 (Lighthouse audit)
- **Issue:** Links in text blocks relied only on color to be distinguishable (WCAG violation)
- **Fix:** Added `underline` class to inline text links in FeaturedProjects and ProjectCard
- **Files modified:** src/components/home/FeaturedProjects.tsx, src/components/home/ProjectCard.tsx
- **Commit:** fdcf23f

## Issues Encountered
- Port 3000 conflict during Lighthouse re-run required killing stale process
- First Lighthouse run scored Performance at 70 due to LCP; fixed and re-run scored 95

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All SEO deliverables complete: metadata, structured data, sitemap, robots, Lighthouse verified
- Phase 05 is fully complete (both plans done)
- Ready for Phase 06 (deploy)
- Remaining pre-production items: OG image placeholder replacement, Firebase env vars

---
*Phase: 05-seo-polish-and-stubs*
*Completed: 2026-02-03*
