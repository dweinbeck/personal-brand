---
phase: 05-seo-polish-and-stubs
plan: 01
subsystem: seo
tags: [metadata, opengraph, json-ld, schema-dts, structured-data, twitter-card]

# Dependency graph
requires:
  - phase: 01-scaffold
    provides: "Root layout, page routes"
  - phase: 02-home-page
    provides: "Home page components"
  - phase: 04-contact
    provides: "Contact page"
provides:
  - "SEO metadata on all pages with title template pattern"
  - "JSON-LD Person structured data on home page"
  - "OpenGraph and Twitter card defaults in root layout"
  - "Polished coming-soon stubs for Writing and Assistant"
affects: [06-deploy]

# Tech tracking
tech-stack:
  added: [schema-dts]
  patterns: ["Next.js metadata export per page", "Title template pattern via root layout", "JSON-LD via script tag with XSS sanitization"]

key-files:
  created: [src/app/opengraph-image.png]
  modified: [src/app/layout.tsx, src/app/page.tsx, src/app/projects/page.tsx, src/app/contact/page.tsx, src/app/writing/page.tsx, src/app/assistant/page.tsx, src/app/building-blocks/page.tsx, src/app/building-blocks/[slug]/page.tsx]

key-decisions:
  - "Biome-ignore inline comment for dangerouslySetInnerHTML on JSON-LD script (standard Next.js pattern)"
  - "Child pages omit openGraph to inherit from root layout (avoids shallow merge pitfall)"
  - "Placeholder 1x1 OG image -- replace with proper 1200x630 before production"

patterns-established:
  - "Metadata export pattern: each page exports title (template adds suffix) and description"
  - "Coming-soon stub pattern: dashed-border box with dark mode classes"

# Metrics
duration: 3min
completed: 2026-02-03
---

# Phase 5 Plan 1: SEO, Metadata & Stubs Summary

**SEO metadata with title template on all 7 routes, JSON-LD Person schema on home page, polished coming-soon stubs for Writing and Assistant**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-03T13:03:28Z
- **Completed:** 2026-02-03T13:06:50Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Root layout has metadataBase, title template ("%s | Dan Weinbeck"), OG defaults, twitter card, robots config
- All 7 page routes export unique title and description metadata
- Home page has JSON-LD Person structured data with schema.org markup
- Writing and Assistant pages have polished coming-soon UI with dark mode support
- Building blocks title duplication fixed (no more "Dan Weinbeck | Dan Weinbeck")

## Task Commits

Each task was committed atomically:

1. **Task 1: Install schema-dts and update root layout metadata** - `8622266` (feat)
2. **Task 2: Add per-page metadata exports, JSON-LD, and polish stubs** - `e0a7aac` (feat)

## Files Created/Modified
- `src/app/layout.tsx` - Title template, metadataBase, OG defaults, twitter card, robots
- `src/app/page.tsx` - Home metadata export, JSON-LD Person structured data
- `src/app/projects/page.tsx` - Projects metadata export
- `src/app/contact/page.tsx` - Contact metadata export
- `src/app/writing/page.tsx` - Writing metadata + polished coming-soon stub
- `src/app/assistant/page.tsx` - Assistant metadata + polished coming-soon stub
- `src/app/building-blocks/page.tsx` - Fixed title duplication
- `src/app/building-blocks/[slug]/page.tsx` - Fixed title duplication, added OG metadata
- `src/app/opengraph-image.png` - Placeholder OG image (replace before production)

## Decisions Made
- Used biome-ignore inline comment for dangerouslySetInnerHTML on JSON-LD script tag (standard Next.js pattern, no alternative for structured data)
- Child pages omit openGraph config to inherit from root layout, avoiding Next.js shallow merge pitfall
- Created 1x1 placeholder OG image so Next.js auto-detects it via opengraph-image convention; needs replacement with proper 1200x630 image before production

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Biome noDangerouslySetInnerHtml rule flagged JSON-LD script tag; resolved with biome-ignore inline comment using `//` syntax (JSX `{/* */}` comment syntax not recognized by Biome for suppression)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All pages have SEO metadata ready for search engine indexing
- OG image placeholder needs replacement with proper branded 1200x630 image before production launch
- Ready for Phase 05 Plan 02 (if exists) or Phase 06 deploy

---
*Phase: 05-seo-polish-and-stubs*
*Completed: 2026-02-03*
