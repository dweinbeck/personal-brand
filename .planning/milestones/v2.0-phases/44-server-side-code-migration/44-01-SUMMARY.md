---
phase: 44-server-side-code-migration
plan: 01
subsystem: database
tags: [zod, prisma, postgresql, validation, service-layer, tasks]

# Dependency graph
requires:
  - phase: 43-prisma-database-foundation
    provides: "Prisma client singleton at @/lib/prisma, generated PrismaClient, database connectivity"
provides:
  - "Zod validation schemas for workspace, project, section, task, tag entities"
  - "Prisma service layer with full CRUD + query functions for all 5 Tasks entities"
  - "Type exports (CreateWorkspaceInput, UpdateTaskInput, etc.) for server actions"
affects: [44-02, 44-03, 45-ui-routing, 46-landing-page]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Service layer pattern: userId-scoped Prisma queries with ownership verification", "Schema-first validation: Zod schemas define input types consumed by services"]

key-files:
  created:
    - src/lib/schemas/tasks/workspace.ts
    - src/lib/schemas/tasks/project.ts
    - src/lib/schemas/tasks/section.ts
    - src/lib/schemas/tasks/task.ts
    - src/lib/schemas/tasks/tag.ts
    - src/services/tasks/workspace.service.ts
    - src/services/tasks/project.service.ts
    - src/services/tasks/section.service.ts
    - src/services/tasks/task.service.ts
    - src/services/tasks/tag.service.ts
  modified: []

key-decisions:
  - "Exact copy of Zod schemas from todoist -- no modifications to validation rules"
  - "Service import paths updated: @/lib/db -> @/lib/prisma, @/lib/schemas/ -> @/lib/schemas/tasks/"
  - "No 'use server' directive on service files -- they are plain modules imported by server actions"

patterns-established:
  - "Tasks schemas live in src/lib/schemas/tasks/ (nested under tasks/ to avoid collisions with other schemas)"
  - "Tasks services live in src/services/tasks/ with .service.ts suffix"
  - "All service functions take userId as first parameter for ownership scoping"

requirements-completed: [MIG-03]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 44 Plan 01: Schemas & Service Layer Summary

**Zod validation schemas and Prisma service layer for 5 Tasks entities (workspace, project, section, task, tag) with 24 CRUD/query functions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T00:52:31Z
- **Completed:** 2026-02-19T00:54:56Z
- **Tasks:** 2
- **Files created:** 10

## Accomplishments
- 5 Zod validation schemas copied from todoist app with identical validation rules
- 5 Prisma service files copied with corrected import paths (@/lib/prisma, @/lib/schemas/tasks/)
- 24 total service functions: getWorkspaces, getWorkspace, createWorkspace, updateWorkspace, deleteWorkspace, getAllProjects, getProject, createProject, updateProject, updateProjectViewMode, deleteProject, createSection, updateSection, deleteSection, reorderSection, createTask, updateTask, deleteTask, toggleTaskStatus, assignTaskToSection, reorderTask, getTasksForToday, getCompletedTasks, searchTasks, getTags, createTag, updateTag, deleteTag, getTasksByTag
- TypeScript compilation passes with zero errors in new files

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy Zod validation schemas for all 5 Tasks entities** - `06dddee` (feat)
2. **Task 2: Copy and adapt service layer for all 5 Tasks entities** - `9f23080` (feat)

## Files Created/Modified
- `src/lib/schemas/tasks/workspace.ts` - Workspace create/update Zod schemas + type exports
- `src/lib/schemas/tasks/project.ts` - Project create/update/viewMode Zod schemas + type exports
- `src/lib/schemas/tasks/section.ts` - Section create/update/reorder Zod schemas + type exports
- `src/lib/schemas/tasks/task.ts` - Task create/update/reorder Zod schemas with effort enum (1,2,3,5,8,13) + type exports
- `src/lib/schemas/tasks/tag.ts` - Tag create/update Zod schemas + type exports
- `src/services/tasks/workspace.service.ts` - Workspace CRUD (5 functions) via Prisma
- `src/services/tasks/project.service.ts` - Project CRUD + view mode (6 functions) via Prisma
- `src/services/tasks/section.service.ts` - Section CRUD + reorder (4 functions) with project ownership verification
- `src/services/tasks/task.service.ts` - Task CRUD + queries (9 functions) including today, completed, search
- `src/services/tasks/tag.service.ts` - Tag CRUD + task-by-tag query (5 functions) via Prisma

## Decisions Made
- Exact copy of Zod schemas with zero modifications to validation rules -- ensures parity with standalone Tasks app
- Import path changes limited to two patterns: `@/lib/db` -> `@/lib/prisma` and `@/lib/schemas/` -> `@/lib/schemas/tasks/`
- Service files are plain modules (no "use server" directive) -- server actions will import these in Plan 03

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schemas and services ready for server actions (Plan 03) to import
- All type exports available: CreateWorkspaceInput, UpdateTaskInput, CreateTagInput, etc.
- Prisma queries unchanged from todoist source, verified compatible with shared PostgreSQL database

## Self-Check: PASSED

- All 10 files verified present on disk
- Commit `06dddee` verified in git log
- Commit `9f23080` verified in git log

---
*Phase: 44-server-side-code-migration*
*Completed: 2026-02-19*
