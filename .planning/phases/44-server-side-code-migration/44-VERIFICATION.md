---
phase: 44-server-side-code-migration
verified: 2026-02-19T02:15:00Z
status: passed
score: 7/7 must-haves verified
---

# Phase 44: Server-Side Code Migration Verification Report

**Phase Goal:** All Tasks server actions, service logic, and validation schemas execute correctly from the personal-brand codebase with shared Firebase Auth

**Verified:** 2026-02-19T02:15:00Z

**Status:** passed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Zod validation schemas reject invalid input with the same error messages as the standalone app | ✓ VERIFIED | 5 schema files with identical Zod validation logic copied from todoist (workspace, project, section, task, tag). Schemas include effort enum (1,2,3,5,8,13), min/max length validations, required field checks |
| 2 | Service layer functions can query and mutate the PostgreSQL database via Prisma | ✓ VERIFIED | 5 service files with 24 total functions all import from @/lib/prisma and execute Prisma queries. Queries include userId scoping, include relations, orderBy clauses |
| 3 | Schema type exports (CreateWorkspaceInput, etc.) are available for import by services and actions | ✓ VERIFIED | All schema files export type definitions via `z.infer<typeof schema>`. Services and actions successfully import these types |
| 4 | Firebase Auth token verification in Tasks actions uses the same Firebase Admin SDK instance as existing personal-brand actions | ✓ VERIFIED | src/lib/tasks/auth.ts imports `auth` from @/lib/firebase (shared singleton). No duplicate Firebase Admin initialization. All server actions import verifyUser from @/lib/tasks/auth |
| 5 | Tasks billing calls the personal-brand billing API directly via function import, not HTTP | ✓ VERIFIED | src/lib/tasks/billing.ts imports checkTasksAccess from @/lib/billing/tasks. Zero fetch() calls. No BILLING_API_URL references (except in comment explaining replacement) |
| 6 | All revalidatePath calls use the /apps/tasks prefix instead of /tasks | ✓ VERIFIED | 17 revalidatePath calls across 5 action files — all use "/apps/tasks" prefix. One dynamic path: `/apps/tasks/${projectId}` in updateProjectViewModeAction. Zero occurrences of revalidatePath("/tasks") |
| 7 | Tasks server actions (workspace, project, section, task, tag CRUD) can be imported and called from the personal-brand app | ✓ VERIFIED | 18 server actions across 5 files with "use server" directive. All follow pattern: auth → billing guard → schema validation → service call → revalidatePath. Actions import from @/lib/tasks/auth, @/lib/tasks/billing, @/lib/schemas/tasks/*, @/services/tasks/* |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/schemas/tasks/workspace.ts` | Workspace validation schemas | ✓ VERIFIED | 14 lines. Exports: createWorkspaceSchema, updateWorkspaceSchema, CreateWorkspaceInput, UpdateWorkspaceInput. Substantive: name validation with min(1)/max(100) |
| `src/lib/schemas/tasks/project.ts` | Project validation schemas | ✓ VERIFIED | Exports: createProjectSchema, updateProjectSchema, updateProjectViewModeSchema. Substantive: includes viewMode enum validation |
| `src/lib/schemas/tasks/section.ts` | Section validation schemas | ✓ VERIFIED | Exports: createSectionSchema, updateSectionSchema, reorderSectionSchema. Substantive: includes order number validation |
| `src/lib/schemas/tasks/task.ts` | Task validation schemas | ✓ VERIFIED | 52 lines. Exports: createTaskSchema, updateTaskSchema, reorderTaskSchema. Substantive: effort enum (1,2,3,5,8,13), deadlineAt coercion, nested task support |
| `src/lib/schemas/tasks/tag.ts` | Tag validation schemas | ✓ VERIFIED | Exports: createTagSchema, updateTagSchema. Substantive: name/color validation |
| `src/services/tasks/workspace.service.ts` | Workspace CRUD via Prisma | ✓ VERIFIED | 72 lines. Exports: getWorkspaces, getWorkspace, createWorkspace, updateWorkspace, deleteWorkspace. All 5 functions use prisma.workspace with userId scoping |
| `src/services/tasks/project.service.ts` | Project CRUD via Prisma | ✓ VERIFIED | Exports: getAllProjects, getProject, createProject, updateProject, updateProjectViewMode, deleteProject. All 6 functions use prisma.project |
| `src/services/tasks/section.service.ts` | Section CRUD via Prisma | ✓ VERIFIED | Exports: createSection, updateSection, deleteSection, reorderSection. All 4 functions use prisma.section with project ownership verification |
| `src/services/tasks/task.service.ts` | Task CRUD + queries via Prisma | ✓ VERIFIED | 180 lines. Exports: createTask, updateTask, deleteTask, toggleTaskStatus, assignTaskToSection, reorderTask, getTasksForToday, getCompletedTasks, searchTasks. All 9 functions use prisma.task with userId scoping, complex includes (subtasks, tags, section, project) |
| `src/services/tasks/tag.service.ts` | Tag CRUD + task-by-tag query via Prisma | ✓ VERIFIED | Exports: getTags, createTag, updateTag, deleteTag, getTasksByTag. All 5 functions use prisma.tag |
| `src/lib/tasks/auth.ts` | Tasks-specific verifyUser function using shared Firebase Admin | ✓ VERIFIED | 23 lines. Exports: verifyUser(idToken). Imports auth from @/lib/firebase. Substantive: verifyIdToken call with error handling |
| `src/lib/tasks/billing.ts` | Tasks billing adapter using direct function imports | ✓ VERIFIED | 60 lines. Exports: checkBillingAccess, billingGuard, BillingStatus. Imports checkTasksAccess from @/lib/billing/tasks. Substantive: decodes idToken, calls checkTasksAccess(uid, email), graceful degradation |
| `src/actions/tasks/workspace.ts` | Workspace CRUD server actions | ✓ VERIFIED | 73 lines. Exports: createWorkspaceAction, updateWorkspaceAction, deleteWorkspaceAction. All 3 use revalidatePath("/apps/tasks"). Wired to @/lib/tasks/auth, @/lib/tasks/billing, @/lib/schemas/tasks/workspace, @/services/tasks/workspace.service |
| `src/actions/tasks/project.ts` | Project CRUD server actions | ✓ VERIFIED | Exports: createProjectAction, updateProjectAction, updateProjectViewModeAction, deleteProjectAction. revalidatePath uses /apps/tasks prefix (3 occurrences) and dynamic `/apps/tasks/${projectId}` (1 occurrence) |
| `src/actions/tasks/section.ts` | Section CRUD server actions | ✓ VERIFIED | Exports: createSectionAction, updateSectionAction, deleteSectionAction. All 3 use revalidatePath("/apps/tasks") |
| `src/actions/tasks/task.ts` | Task CRUD server actions | ✓ VERIFIED | 118 lines. Exports: createTaskAction, updateTaskAction, deleteTaskAction, toggleTaskAction, assignTaskToSectionAction. All 5 use revalidatePath("/apps/tasks") |
| `src/actions/tasks/tag.ts` | Tag CRUD server actions | ✓ VERIFIED | Exports: createTagAction, updateTagAction, deleteTagAction. All 3 use revalidatePath("/apps/tasks") |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| src/services/tasks/workspace.service.ts | src/lib/prisma.ts | import { prisma } | ✓ WIRED | Line 1: `import { prisma } from "@/lib/prisma";` Found in all 5 service files |
| src/services/tasks/workspace.service.ts | src/lib/schemas/tasks/workspace.ts | type imports | ✓ WIRED | Lines 2-5: `import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "@/lib/schemas/tasks/workspace";` Pattern repeated in all services |
| src/lib/tasks/auth.ts | src/lib/firebase.ts | import { auth } | ✓ WIRED | Line 3: `import { auth } from "@/lib/firebase";` Used in verifyIdToken call on line 17 |
| src/lib/tasks/billing.ts | src/lib/billing/tasks.ts | import { checkTasksAccess } | ✓ WIRED | Line 3: `import { checkTasksAccess } from "@/lib/billing/tasks";` Called on line 32 with uid/email |
| src/actions/tasks/workspace.ts | src/lib/tasks/auth.ts | import { verifyUser } | ✓ WIRED | Line 8: `import { verifyUser } from "@/lib/tasks/auth";` Called in all 3 actions |
| src/actions/tasks/workspace.ts | src/lib/tasks/billing.ts | import { billingGuard, checkBillingAccess } | ✓ WIRED | Line 9: `import { billingGuard, checkBillingAccess } from "@/lib/tasks/billing";` Both functions called in all actions |
| src/actions/tasks/workspace.ts | src/lib/schemas/tasks/workspace.ts | import schemas | ✓ WIRED | Lines 4-7: Imports createWorkspaceSchema, updateWorkspaceSchema. Used in safeParse calls |
| src/actions/tasks/workspace.ts | src/services/tasks/workspace.service.ts | import service functions | ✓ WIRED | Lines 10-14: Imports createWorkspace, updateWorkspace, deleteWorkspace as aliased functions. Called after validation |

**All key links verified:** Shared Firebase Admin SDK integration (no duplicate init), direct billing function calls (no HTTP), correct import path structure (tasks/ prefix for schemas/services), revalidatePath uses /apps/tasks prefix

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MIG-02 | 44-03 | Tasks server actions (workspace, project, section, task, tag CRUD) work from the personal-brand codebase | ✓ SATISFIED | 18 server actions across 5 files. All have "use server" directive, follow auth→billing→validation→service pattern, importable from src/actions/tasks/ |
| MIG-03 | 44-01 | Tasks service layer and Zod validation schemas are integrated into the personal-brand repo | ✓ SATISFIED | 5 Zod schema files in src/lib/schemas/tasks/, 5 service files in src/services/tasks/ with 24 total functions. All schemas export type definitions, all services use prisma from @/lib/prisma |
| MIG-05 | 44-02 | Tasks auth uses the shared personal-brand Firebase Auth (same project, same token verification) | ✓ SATISFIED | src/lib/tasks/auth.ts imports auth from @/lib/firebase (shared Firebase Admin SDK singleton). No duplicate Firebase initialization. verifyIdToken uses same auth instance as existing personal-brand code |
| MIG-06 | 44-02 | Tasks billing integration calls the personal-brand billing API directly (no external HTTP call needed) | ✓ SATISFIED | src/lib/tasks/billing.ts imports checkTasksAccess from @/lib/billing/tasks, calls it directly with uid/email. Zero fetch() calls. BILLING_API_URL not referenced (except in comment) |
| RT-04 | 44-03 | Server actions `revalidatePath` calls use the new /apps/tasks path prefix | ✓ SATISFIED | 17 revalidatePath calls verified. All use "/apps/tasks" prefix. One dynamic path: `/apps/tasks/${projectId}`. Zero occurrences of old "/tasks" path |

**Requirements satisfied:** 5/5 (100%)

**No orphaned requirements** — all requirement IDs mapped to Phase 44 in REQUIREMENTS.md are claimed by plans and verified in implementation

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | - |

**Anti-pattern scan results:**
- Zero TODO/FIXME/PLACEHOLDER comments in new files
- Zero BILLING_API_URL usage (only comment reference explaining replacement)
- Zero old @/lib/auth import paths (all use @/lib/tasks/auth)
- Zero old @/lib/billing import paths (all use @/lib/tasks/billing)
- Zero revalidatePath("/tasks") without /apps prefix
- Zero console.log-only implementations
- Zero empty return statements
- Zero placeholder data

**Quality gates:** All passed
- `npm run lint` — clean (Biome import sorting auto-fixed in commit c210ab0)
- `npm run build` — TypeScript compilation success
- `npm test` — 213 tests pass

### Human Verification Required

None — all verification completed programmatically. Server actions, schemas, and services are server-only code that can be verified via static analysis. UI integration will be verified in Phase 45.

---

**Phase 44 COMPLETE:** All server-side Tasks code (schemas, services, auth/billing adapters, server actions) migrated from standalone todoist app and integrated with personal-brand codebase. Shared Firebase Auth, direct billing function calls, /apps/tasks path prefix, zero anti-patterns, all quality gates passed.

---

_Verified: 2026-02-19T02:15:00Z_

_Verifier: Claude (gsd-verifier)_
