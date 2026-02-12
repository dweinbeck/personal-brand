---
phase: 31-help-tips
plan: 01
subsystem: ui
tags: [react, tooltip, accessibility, aria, tailwind]

# Dependency graph
requires: []
provides:
  - HelpTip client component with accessible gold tooltip icons
  - Centralized help-tips catalog (8 typed entries)
  - useTooltipPosition viewport-aware placement hook
  - 6 HelpTip placements across sidebar, project view, sections, search, tags
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [centralized-string-catalog, toggletip-interaction, viewport-aware-positioning]

key-files:
  created:
    - src/data/help-tips.ts
    - src/lib/hooks/use-tooltip-position.ts
    - src/components/ui/help-tip.tsx
    - src/data/__tests__/help-tips.test.ts
  modified:
    - src/components/tasks/sidebar.tsx
    - src/app/tasks/[projectId]/project-view.tsx
    - src/components/tasks/section-header.tsx
    - src/app/tasks/search/search-input.tsx
    - src/app/tasks/tags/tag-list.tsx

key-decisions:
  - "Toggletip interaction model: click pins tooltip, hover opens with delay, Escape/outside-click dismisses"
  - "Centralized catalog pattern: all tip text in src/data/help-tips.ts, no strings in component files"
  - "HelpTip placed inside client components (not server page.tsx) to maintain client boundary"

patterns-established:
  - "Centralized string catalog: define typed IDs + Record in src/data/, import where needed"
  - "Custom hook in src/lib/hooks/: reusable client-side logic extracted from components"
  - "Toggletip pattern: click-to-pin + hover-with-delay + focus/blur + Escape + outside-click"

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 31 Plan 01: Help Tips Summary

**Gold "?" tooltip icons with accessible toggletip interaction, centralized tip catalog, and viewport-aware positioning across 6 UI locations**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T03:29:49Z
- **Completed:** 2026-02-12T03:33:55Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Built HelpTip component with full interaction model: click-to-pin, hover with 300ms delay, focus/blur, Escape dismiss, outside-click dismiss
- Created centralized help-tips catalog with 8 typed tip entries (HelpTipId union type + Record)
- Implemented viewport-aware positioning hook (flips to bottom when near top edge)
- Wired HelpTip into 6 locations: sidebar workspaces, sidebar quick-add, board/list toggle, section headers, search page, tags page
- Full ARIA support: role="tooltip", aria-describedby, keyboard navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create help-tip catalog, positioning hook, HelpTip component, and unit test** - `41cbb92` (feat)
2. **Task 2: Wire HelpTip into sidebar, project view, section header, search, and tags** - `7b1bb88` (feat)

## Files Created/Modified
- `src/data/help-tips.ts` - Centralized tip catalog with 8 typed tip entries
- `src/lib/hooks/use-tooltip-position.ts` - Viewport-aware placement hook (top/bottom flip)
- `src/components/ui/help-tip.tsx` - HelpTip client component with gold icon and accessible tooltip
- `src/data/__tests__/help-tips.test.ts` - Unit tests validating catalog completeness
- `src/components/tasks/sidebar.tsx` - Added HelpTip for workspaces heading and quick-add button
- `src/app/tasks/[projectId]/project-view.tsx` - Added HelpTip for board/list view toggle
- `src/components/tasks/section-header.tsx` - Added HelpTip for task sections
- `src/app/tasks/search/search-input.tsx` - Added HelpTip for search tasks
- `src/app/tasks/tags/tag-list.tsx` - Added HelpTip for filters/tags

## Decisions Made
- Used toggletip interaction model (click pins, hover opens with delay) for best mobile + desktop experience
- Centralized all tip text in src/data/help-tips.ts to keep component files clean and enable future i18n
- Placed HelpTip inside client components rather than server page.tsx to respect client boundary requirements

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing build failure in todoist repo: Prisma cannot connect to database during static page generation (`npm run build` fails on DB-dependent pages). This is unrelated to help-tips changes. TypeScript compilation (`tsc --noEmit`) passes cleanly. Lint and tests pass cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Help tips fully functional across 6 UI locations
- Centralized catalog pattern established for easy addition of new tips
- Ready for Phase 32 and beyond

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (41cbb92, 7b1bb88) verified in git log.

---
*Phase: 31-help-tips*
*Completed: 2026-02-11*
