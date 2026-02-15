---
phase: 38-home-page-enhancements
plan: 02
subsystem: ui
tags: [reading-time, tools, home-page, tutorial-cards, word-count]

# Dependency graph
requires:
  - phase: 36-tools-page-and-nav-restructure
    provides: "getTools() data source and tool card pattern"
provides:
  - "Reading time display on all TutorialCard instances"
  - "ToolsShowcase home page section with tool cards"
affects: [home-page, building-blocks, tutorials]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Word count reading time calculation (200 wpm, Math.ceil)"
    - "ToolsShowcase mirrors AppsGrid/BuildingBlocksCta section pattern"

key-files:
  created:
    - src/components/home/ToolsShowcase.tsx
  modified:
    - src/lib/tutorials.ts
    - src/components/building-blocks/TutorialCard.tsx
    - src/app/page.tsx

key-decisions:
  - "Reading time uses 200 wpm average with Math.ceil rounding"
  - "ToolsShowcase placed between AppsGrid and BuildingBlocksCta in render order"

patterns-established:
  - "Reading time calculation: strip metadata export, count words, divide by 200"

# Metrics
duration: 20min
completed: 2026-02-15
---

# Phase 38 Plan 02: Reading Time and Dev Tools Showcase Summary

**Reading time on tutorial cards (word-count-based) and new Explore Development Tools section on home page with tool cards and View All link**

## Performance

- **Duration:** 20 min
- **Started:** 2026-02-15T23:15:14Z
- **Completed:** 2026-02-15T23:35:24Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added reading time calculation to TutorialMeta based on MDX content word count (200 wpm average)
- Reading time displayed on TutorialCard below description and above tags, visible on both home page and /building-blocks
- Created ToolsShowcase component showing all 5 tools (New Phase Planner, FRD Interviewer, FRD Generator, Research Assistant, Digital Envelopes) with gold topic badges
- ToolsShowcase renders between AppsGrid and BuildingBlocksCta on the home page with "View all tools" button linking to /tools

## Task Commits

Each task was committed atomically:

1. **Task 1: Add reading time calculation to tutorials and display on cards** - `e001516` (feat)
2. **Task 2: Create Dev Tools showcase section on home page** - `7967c27` (feat)

## Files Created/Modified
- `src/lib/tutorials.ts` - Added readingTime to TutorialMeta interface, calculated from MDX word count
- `src/components/building-blocks/TutorialCard.tsx` - Display reading time below description, above tags
- `src/components/home/ToolsShowcase.tsx` - New server component with tool cards and View All button
- `src/app/page.tsx` - Import and render ToolsShowcase between AppsGrid and BuildingBlocksCta

## Decisions Made
- Reading time uses 200 words per minute average with Math.ceil rounding (industry standard for technical content)
- ToolsShowcase placed between AppsGrid and BuildingBlocksCta to create a natural progression: Apps > Tools > Learning
- Tool card JSX matches the /tools page pattern exactly for visual consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Turbopack build cache corruption caused intermittent ENOENT errors during `npm run build`. Resolved by clearing `.next` directory and rebuilding. This is a known Next.js 16 Turbopack issue, unrelated to code changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Home page enhancements complete (38-01 hero redesign + 38-02 reading time and tools)
- Ready for Phase 39 (Bug Fixes) or Phase 40 (Polish)

## Self-Check: PASSED

- FOUND: src/lib/tutorials.ts (readingTime field + calculation)
- FOUND: src/components/building-blocks/TutorialCard.tsx (readingTime display)
- FOUND: src/components/home/ToolsShowcase.tsx (getTools import, tool cards)
- FOUND: src/app/page.tsx (ToolsShowcase import + render)
- FOUND: commit e001516 (Task 1)
- FOUND: commit 7967c27 (Task 2)

---
*Phase: 38-home-page-enhancements*
*Completed: 2026-02-15*
