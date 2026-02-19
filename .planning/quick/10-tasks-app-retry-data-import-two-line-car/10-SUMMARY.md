---
phase: quick-10
plan: 01
status: complete
started: 2026-02-19T14:41:57Z
completed: 2026-02-19T15:35:00Z
duration_minutes: 53
---

# Quick Task 10: Tasks App — Data Import, Card UI, Cleanup, Auto-Archive

## Summary

Four targeted improvements to the Tasks app: imported 30 tasks + 82 subtasks from the focus-sprint JSON file, redesigned collapsed card layout with two-line titles and repositioned effort badge, removed the one-time import infrastructure, and added 2-day auto-archiving for completed tasks in the board view.

## Changes Made

### Task 1: Data Import (Runtime)
- Created temporary Prisma script to bypass Firebase auth and import directly
- Started Cloud SQL proxy, ran import against dev database
- Result: 1 workspace, 6 projects, 15 sections, 30 tasks, 82 subtasks, 17 tags created
- Cleaned up temporary scripts and stopped proxy after import

### Task 2: Two-Line Card Titles + Effort Badge Repositioning
- **File:** `src/components/tasks/task-card.tsx`
- Replaced `truncate` with `line-clamp-2` on title span (allows 2-line wrapping)
- Removed effort badge from metadata row (was inline with deadline/tags)
- Added effort badge as `absolute bottom-0 right-0` inside the content button
- Content button gets conditional `pb-5` padding when effort exists to prevent overlap

### Task 3: Remove Import Infrastructure
- **Deleted:** `src/app/apps/tasks/(authenticated)/import-button.tsx`
- **Deleted:** `src/actions/tasks/import.ts`
- **Modified:** `src/app/apps/tasks/(authenticated)/page.tsx` — removed ImportButton import and usage

### Task 4: 2-Day Auto-Archive for Completed Tasks
- **File:** `src/components/tasks/board-view.tsx`
- Added `archiveCutoff` date calculation (start of yesterday)
- Filtered completed tasks to only show those with `updatedAt >= archiveCutoff`
- Added "+N archived" indicator in the Completed column header when older tasks are hidden
- Column visibility condition changed to show when there are visible OR archived completed tasks
- All completed tasks remain accessible via the `/completed` page (unaffected)

## Verification

- `npm run lint` — passes (pre-existing warnings only, no new issues)
- `npm run build` — compiles successfully
- `npm test` — 211/211 tests pass
- No references to `ImportButton` or `importTasksAction` remain in codebase
