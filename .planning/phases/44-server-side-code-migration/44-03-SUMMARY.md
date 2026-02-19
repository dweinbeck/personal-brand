---
phase: 44-server-side-code-migration
plan: 03
subsystem: server-actions
tags: [next-actions, use-server, firebase-auth, billing, zod, prisma, tasks, crud]

# Dependency graph
requires:
  - phase: 44-01
    provides: "Zod schemas and Prisma service layer for all 5 Tasks entities"
  - phase: 44-02
    provides: "Tasks auth adapter (verifyUser) and billing adapter (checkBillingAccess, billingGuard)"
provides:
  - "18 server actions across 5 files: workspace (3), project (4), section (3), task (5), tag (3)"
  - "Complete CRUD server action layer for Tasks app integration"
affects: [45-ui-routing, 46-landing-page]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Server actions use 'use server' directive with auth+billing+validation+service pattern", "revalidatePath('/apps/tasks') for cache invalidation under /apps/ prefix"]

key-files:
  created:
    - src/actions/tasks/workspace.ts
    - src/actions/tasks/project.ts
    - src/actions/tasks/section.ts
    - src/actions/tasks/task.ts
    - src/actions/tasks/tag.ts
  modified:
    - src/lib/tasks/billing.ts

key-decisions:
  - "All server actions copied verbatim from todoist with only import paths and revalidatePath prefix changed"
  - "revalidatePath uses /apps/tasks prefix to match personal-brand routing structure"
  - "Phase 43 test endpoint removed as planned -- no longer needed with real server actions"

patterns-established:
  - "Tasks server actions live in src/actions/tasks/ with one file per entity"
  - "Every action follows: verifyUser -> checkBillingAccess -> billingGuard -> schema.safeParse -> service call -> revalidatePath"
  - "Import order enforced by Biome: schemas before auth/billing imports"

requirements-completed: [MIG-02, RT-04]

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 44 Plan 03: Server Actions Migration Summary

**18 Tasks CRUD server actions (workspace, project, section, task, tag) with auth, billing, validation, and /apps/tasks cache revalidation -- plus Phase 43 test endpoint cleanup**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T00:57:01Z
- **Completed:** 2026-02-19T01:01:52Z
- **Tasks:** 3
- **Files created:** 5
- **Files deleted:** 2
- **Files modified:** 1

## Accomplishments
- 5 server action files created with 18 total actions across all Tasks entities
- All import paths updated to personal-brand module structure (@/lib/tasks/auth, @/lib/tasks/billing, @/lib/schemas/tasks/*, @/services/tasks/*)
- All revalidatePath calls use /apps/tasks prefix (17 occurrences verified)
- Phase 43 temporary test endpoint (tasks-test.ts and api/tasks-test/route.ts) removed with zero dangling references
- Full quality gates pass: lint clean, build succeeds, 213 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy and adapt all 5 server action files** - `9c97955` (feat)
2. **Task 2: Remove Phase 43 temporary test endpoint** - `7beb84b` (chore)
3. **Task 3: Run full quality gates (lint fix)** - `c210ab0` (style)

## Files Created/Modified
- `src/actions/tasks/workspace.ts` - Workspace CRUD: createWorkspaceAction, updateWorkspaceAction, deleteWorkspaceAction
- `src/actions/tasks/project.ts` - Project CRUD: createProjectAction, updateProjectAction, updateProjectViewModeAction, deleteProjectAction
- `src/actions/tasks/section.ts` - Section CRUD: createSectionAction, updateSectionAction, deleteSectionAction
- `src/actions/tasks/task.ts` - Task CRUD: createTaskAction, updateTaskAction, deleteTaskAction, toggleTaskAction, assignTaskToSectionAction
- `src/actions/tasks/tag.ts` - Tag CRUD: createTagAction, updateTagAction, deleteTagAction
- `src/lib/tasks/billing.ts` - Import sort fix (Biome organizeImports)
- `src/lib/actions/tasks-test.ts` - DELETED (Phase 43 temp test action)
- `src/app/api/tasks-test/route.ts` - DELETED (Phase 43 temp test endpoint)

## Decisions Made
- Copied server action logic verbatim from todoist -- only import paths and revalidatePath prefix changed, no function body modifications
- revalidatePath uses /apps/tasks to match personal-brand app routing (tasks lives under /apps/tasks, not /tasks)
- Removed Phase 43 test endpoint as planned in 43-03 decision

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Biome import sorting in all 5 action files and billing adapter**
- **Found during:** Task 3 (quality gates)
- **Issue:** Biome organizeImports requires alphabetical import ordering; schemas imports (@/lib/schemas/) must precede auth/billing imports (@/lib/tasks/)
- **Fix:** Reordered imports in all 5 action files and billing.ts to satisfy Biome sort rules
- **Files modified:** src/actions/tasks/workspace.ts, project.ts, section.ts, task.ts, tag.ts, src/lib/tasks/billing.ts
- **Verification:** npm run lint passes with zero errors
- **Committed in:** c210ab0

---

**Total deviations:** 1 auto-fixed (1 blocking -- lint failure)
**Impact on plan:** Style-only fix. No logic changes. Required for lint gate to pass.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete server action layer ready for Phase 45 UI components to import and call
- All 18 actions follow identical pattern: auth -> billing -> validation -> service -> revalidate
- Phase 44 (Server-Side Code Migration) is fully complete: schemas (Plan 01), services (Plan 01), auth/billing adapters (Plan 02), server actions (Plan 03)

## Self-Check: PASSED

- All 5 server action files verified present on disk
- Both Phase 43 test endpoint files confirmed deleted
- Commit `9c97955` verified in git log
- Commit `7beb84b` verified in git log
- Commit `c210ab0` verified in git log

---
*Phase: 44-server-side-code-migration*
*Completed: 2026-02-19*
