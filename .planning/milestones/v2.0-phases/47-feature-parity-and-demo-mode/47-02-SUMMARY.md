---
phase: 47-feature-parity-and-demo-mode
plan: 02
subsystem: ui
tags: [react, tooltips, help-tips, smart-views, prisma, tasks]

# Dependency graph
requires:
  - phase: 45-ui-components-routing
    provides: "Tasks UI components, sidebar, routing structure"
  - phase: 44-server-actions-auth
    provides: "Task service functions, server actions"
provides:
  - "Verified smart views (Today, Completed, Search) with complete service chains"
  - "Help tips feature with catalog, tooltip hook, and HelpTip component"
  - "5 help tip placements across sidebar, project-view, section-header, search, tags"
affects: [47-03, 47-04, demo-mode]

# Tech tracking
tech-stack:
  added: []
  patterns: [portal-based-tooltips, viewport-aware-positioning, centralized-tip-catalog]

key-files:
  created:
    - src/data/help-tips.ts
    - src/lib/hooks/use-tooltip-position.ts
    - src/components/tasks/ui/help-tip.tsx
  modified:
    - src/components/tasks/sidebar.tsx
    - src/app/apps/tasks/[projectId]/project-view.tsx
    - src/components/tasks/section-header.tsx
    - src/app/apps/tasks/search/search-input.tsx
    - src/app/apps/tasks/tags/tag-list.tsx

key-decisions:
  - "HelpTip uses createPortal to document.body to avoid overflow clipping in sidebar/cards"
  - "Used <output> element instead of role=status div for Biome a11y compliance"
  - "Help tips placed only in client components to avoid hook usage in server components"

patterns-established:
  - "Help tip pattern: centralized catalog + reusable HelpTip component with tipId prop"
  - "Viewport-aware tooltip: useTooltipPosition hook calculates position to stay within viewport bounds"

requirements-completed: [FP-06, FP-07, FP-08, FP-09, FP-10]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 47 Plan 02: Smart Views & Help Tips Summary

**Verified all smart view code chains (Today/Completed/Search/Quick-add) and built help tips feature with 8-entry catalog, viewport-aware tooltip hook, and 5 UI placements**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T02:40:59Z
- **Completed:** 2026-02-19T02:46:38Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Verified Today view filters tasks by today's deadline with correct Prisma relations
- Verified Completed view shows completed tasks with project filter dropdown
- Verified Search performs case-insensitive name/description search
- Verified Quick-add modal creates tasks from sidebar with all fields
- Created help tips catalog with 8 typed entries (quick-add, board-view, sections, search, tags, effort, today-view, subtasks)
- Created useTooltipPosition hook for viewport-aware tooltip placement
- Created HelpTip component with hover/click toggle, portal rendering, and Escape/click-outside dismissal
- Placed HelpTip in 5 locations: sidebar, project-view, section-header, search-input, tag-list

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify smart views and Quick-add modal** - No commit (verification only, no changes needed)
2. **Task 2: Create help tips feature** - `b1c8665` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/data/help-tips.ts` - Centralized catalog of 8 help tip entries with typed IDs
- `src/lib/hooks/use-tooltip-position.ts` - Custom hook for viewport-aware tooltip positioning
- `src/components/tasks/ui/help-tip.tsx` - HelpTip component with hover/click toggle and portal rendering
- `src/components/tasks/sidebar.tsx` - Added HelpTip next to "Add Task" button
- `src/app/apps/tasks/[projectId]/project-view.tsx` - Added HelpTip next to list/board toggle
- `src/components/tasks/section-header.tsx` - Added HelpTip next to section name
- `src/app/apps/tasks/search/search-input.tsx` - Added HelpTip next to search label
- `src/app/apps/tasks/tags/tag-list.tsx` - Added HelpTip next to "Manage tags" label

## Decisions Made
- Used `<output>` element instead of `<div role="status">` for Biome a11y lint compliance (semantic elements preferred)
- Help tips placed only in client components (HelpTip uses hooks, cannot be in server components)
- Used createPortal to document.body to avoid tooltip clipping by overflow-hidden containers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Biome a11y error for role="status" element**
- **Found during:** Task 2 (Create help tips feature)
- **Issue:** Biome lint/a11y/useSemanticElements flagged `<div role="status">` as error
- **Fix:** Changed to `<output>` element which has implicit status role
- **Files modified:** src/components/tasks/ui/help-tip.tsx
- **Verification:** `npm run lint` passes with 0 errors
- **Committed in:** b1c8665 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor lint compliance fix. No scope creep.

## Issues Encountered
None - all smart views verified correct, help tips feature created cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All smart views and Quick-add modal verified working
- Help tips feature complete and placed in 5 locations
- Ready for remaining Phase 47 plans (demo mode, decommission prep)

## Self-Check: PASSED

- All 3 created files exist on disk
- Commit b1c8665 exists in git log
- HelpTip imported in 5 components (sidebar, project-view, section-header, search-input, tag-list)

---
*Phase: 47-feature-parity-and-demo-mode*
*Completed: 2026-02-19*
