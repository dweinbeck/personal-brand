---
phase: 36-tools-page-and-nav-restructure
plan: 02
subsystem: ui
tags: [next.js, react, navigation, navbar, control-center]

# Dependency graph
requires:
  - phase: 36-tools-page-and-nav-restructure
    plan: 01
    provides: "/tools page that the new Tools navbar link points to"
provides:
  - "Navbar link order: Home, Apps, Tools, Building Blocks, Contact, [Control Center], Ask My Assistant"
  - "Brand scraper removed from Control Center nav and page"
  - "Ask My Assistant link visible to all users"
affects: [37-assistant-popup, sitemap, footer]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/components/layout/NavLinks.tsx
    - src/components/admin/ControlCenterNav.tsx
  deleted:
    - src/app/control-center/brand-scraper/page.tsx

key-decisions:
  - "Ask My Assistant link added for all users (not just admin), pointing to /assistant until Phase 37 converts it to popup trigger"
  - "About, Custom GPTs, and Assistant links removed from baseLinks; replaced by new hierarchy"

patterns-established: []

# Metrics
duration: 8min
completed: 2026-02-15
---

# Phase 36 Plan 02: Nav Restructure Summary

**Navbar reordered to Home/Apps/Tools/Building Blocks/Contact with Ask My Assistant for all users, brand scraper removed from Control Center**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-15T22:23:51Z
- **Completed:** 2026-02-15T22:31:53Z
- **Tasks:** 2
- **Files modified:** 3 (1 deleted)

## Accomplishments
- Reordered navbar links to match NAV-03 hierarchy: Home, Apps, Tools, Building Blocks, Contact
- Added "Ask My Assistant" link for all users (appended after admin-conditional Control Center link)
- Removed brand scraper link from Control Center nav and deleted the /control-center/brand-scraper page (NAV-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Reorder navbar links and add Tools** - `e6e26ab` (feat)
2. **Task 2: Remove brand scraper from Control Center** - `fdcbe9a` (feat)

## Files Created/Modified
- `src/components/layout/NavLinks.tsx` - Updated baseLinks order (5 items), added Ask My Assistant for all users
- `src/components/admin/ControlCenterNav.tsx` - Removed Brands entry from navLinks (3 items remain)
- `src/app/control-center/brand-scraper/page.tsx` - Deleted (brand scraper accessible only via /apps)

## Decisions Made
- "Ask My Assistant" link is added for all users (not admin-only), pointing to /assistant. Phase 37 will convert this to a popup trigger.
- Removed About, Custom GPTs, and Assistant from baseLinks entirely -- they are replaced by the new link hierarchy per NAV-03 requirements.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 36 is fully complete (both plans)
- Navbar displays correct link order for all user types
- Brand scraper is consolidated to /apps/brand-scraper only
- Ready for Phase 37: Assistant popup conversion (Ask My Assistant link will become popup trigger)

## Self-Check: PASSED

- All modified files verified present on disk
- brand-scraper/page.tsx confirmed deleted
- Both commit hashes (e6e26ab, fdcbe9a) verified in git log
- NavLinks.tsx has 8 href references (5 base + Control Center + Ask My Assistant + /assistant)
- ControlCenterNav.tsx has exactly 3 nav links (Dashboard, Content Editor, Billing)
- npm run build passes, npm run lint passes, npm test passes (156/156)

---
*Phase: 36-tools-page-and-nav-restructure*
*Completed: 2026-02-15*
