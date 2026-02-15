---
phase: 36-tools-page-and-nav-restructure
plan: 01
subsystem: ui
tags: [next.js, react, tools, navigation, redirect]

# Dependency graph
requires: []
provides:
  - "/tools page with 5 tool cards (New Phase Planner, FRD Interviewer, FRD Generator, Research Assistant, Digital Envelopes)"
  - "ToolListing interface and getTools() data source"
  - "/custom-gpts redirect to /tools"
  - "Slimmed /apps page with only Brand Scraper and Tasks"
affects: [36-02, nav-restructure, sitemap]

# Tech tracking
tech-stack:
  added: []
  patterns: [tool-listing-data-pattern, server-side-redirect]

key-files:
  created:
    - src/data/tools.ts
    - src/app/tools/page.tsx
  modified:
    - src/data/apps.ts
    - src/app/custom-gpts/page.tsx

key-decisions:
  - "Reused Card + CardButtonLabel + gold-light tag badge pattern from AppCard for tool cards"
  - "External GPT links use Card's built-in external detection (href.startsWith('http')) for target='_blank'"
  - "Button text: 'Open Tool' for external GPT links, 'Enter App' for internal routes"

patterns-established:
  - "ToolListing data pattern: slug, title, tag, subtitle, description, href, external boolean"
  - "Server-side redirect for deprecated routes using next/navigation redirect()"

# Metrics
duration: 10min
completed: 2026-02-15
---

# Phase 36 Plan 01: Tools Page & Data Source Summary

**Tools page with 5 tool cards, /apps slimmed to 2 apps, and /custom-gpts redirect to /tools**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-15T22:07:26Z
- **Completed:** 2026-02-15T22:18:16Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created /tools page with 5 tool cards in a responsive 2-column grid matching the existing AppCard design pattern
- Removed Research Assistant and Digital Envelopes from /apps, leaving only Brand Scraper and Tasks
- Replaced /custom-gpts page with a server-side redirect to /tools (307 redirect)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tools data source and /tools index page** - `6974ca9` (feat)
2. **Task 2: Remove moved items from /apps and redirect /custom-gpts** - `3ccfc36` (feat)

## Files Created/Modified
- `src/data/tools.ts` - ToolListing interface and getTools() returning 5 tool entries
- `src/app/tools/page.tsx` - Tools index page with card grid, metadata, gold-light tag badges
- `src/data/apps.ts` - Removed envelopes and research-assistant entries (2 apps remain)
- `src/app/custom-gpts/page.tsx` - Replaced with server-side redirect to /tools

## Decisions Made
- Reused Card + CardButtonLabel + gold-light tag badge pattern from AppCard for consistency across tools and apps pages
- External GPT links handled via Card component's built-in external URL detection (no additional props needed)
- Button labels: "Open Tool" for external GPT links, "Enter App" for internal routes (Research Assistant, Digital Envelopes)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing lint error in .planning/config.json**
- **Found during:** Task 1 (lint verification)
- **Issue:** config.json missing trailing newline, causing Biome formatter error
- **Fix:** Added trailing newline to .planning/config.json
- **Files modified:** .planning/config.json
- **Verification:** npm run lint passes cleanly
- **Committed in:** 6974ca9 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor formatting fix to unblock lint gate. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /tools page is live and ready for navigation integration in Plan 02
- /apps page is slimmed down with only 2 app cards
- /custom-gpts redirects cleanly to /tools
- Ready for Plan 02: Nav restructure (header/footer link updates, sitemap changes)

## Self-Check: PASSED

- All 4 files verified present on disk
- Both commit hashes (6974ca9, 3ccfc36) verified in git log
- /tools returns HTTP 200
- /apps returns HTTP 200
- /custom-gpts returns HTTP 307 redirect to /tools

---
*Phase: 36-tools-page-and-nav-restructure*
*Completed: 2026-02-15*
