---
phase: 33-multi-user-auth
plan: 03
subsystem: auth
tags: [firebase-auth, prisma, nextjs, server-actions, userId-scoping]

# Dependency graph
requires:
  - phase: 33-01
    provides: "Firebase Auth context, verifyUser() and getUserIdFromCookie() helpers"
  - phase: 33-02
    provides: "Required userId column on Workspace/Task/Tag, auth-guarded create operations"
provides:
  - "Complete userId enforcement on all 28 service functions"
  - "Token-verified server actions (15 actions across 5 files)"
  - "Cookie-authenticated Server Component pages (8 pages)"
  - "Client-side ID token passing from 9 components to actions"
  - "Data isolation: no query can return or modify another user's data"
affects: [33-04-session-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service functions accept userId as first parameter, never fetch auth internally"
    - "Server actions verify Firebase ID token via verifyUser(idToken) and return {error: 'Unauthorized'} on failure"
    - "Server Component pages use getUserIdFromCookie() and redirect('/') when unauthenticated"
    - "Client components use useAuth() hook and user.getIdToken() before every action call"
    - "Project/Section ownership verified through workspace chain (not direct userId)"

key-files:
  created: []
  modified:
    - "/Users/dweinbeck/Documents/todoist/src/services/workspace.service.ts"
    - "/Users/dweinbeck/Documents/todoist/src/services/project.service.ts"
    - "/Users/dweinbeck/Documents/todoist/src/services/section.service.ts"
    - "/Users/dweinbeck/Documents/todoist/src/services/task.service.ts"
    - "/Users/dweinbeck/Documents/todoist/src/services/tag.service.ts"
    - "/Users/dweinbeck/Documents/todoist/src/actions/workspace.ts"
    - "/Users/dweinbeck/Documents/todoist/src/actions/project.ts"
    - "/Users/dweinbeck/Documents/todoist/src/actions/section.ts"
    - "/Users/dweinbeck/Documents/todoist/src/actions/task.ts"
    - "/Users/dweinbeck/Documents/todoist/src/actions/tag.ts"
    - "/Users/dweinbeck/Documents/todoist/src/app/tasks/layout.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/app/tasks/page.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/app/tasks/[projectId]/page.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/app/tasks/today/page.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/app/tasks/completed/page.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/app/tasks/search/page.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/app/tasks/tags/page.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/app/tasks/tags/[tagId]/page.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/components/tasks/sidebar.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/components/tasks/task-card.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/components/tasks/task-form.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/components/tasks/quick-add-modal.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/components/tasks/section-header.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/components/tasks/add-section-button.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/app/tasks/[projectId]/project-view.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/app/tasks/tags/tag-list.tsx"
    - "/Users/dweinbeck/Documents/todoist/src/components/tasks/subtask-list.tsx"

key-decisions:
  - "Server actions accept idToken as first parameter (not getUserIdFromCookie) for explicit client-to-server token flow"
  - "getProject strips workspace from returned object to avoid leaking internal ownership structure"
  - "Section/Project ownership verified through workspace chain rather than direct userId column"

patterns-established:
  - "All service functions: userId as first parameter, Prisma where clause includes userId"
  - "All server actions: verifyUser(idToken) at top, return {error: 'Unauthorized'} if null"
  - "All Server Component pages: getUserIdFromCookie() + redirect('/') guard"
  - "All client components: useAuth() + user.getIdToken() before every action call"
  - "Layout-level auth: tasks/layout.tsx renders AuthGuard when no cookie, else normal layout"

# Metrics
duration: 6min
completed: 2026-02-12
---

# Phase 33 Plan 03: Query Audit Summary

**Complete userId enforcement across all 28 service functions, 15 server actions, 8 pages, and 9 client components with Firebase token verification**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-12T13:56:04Z
- **Completed:** 2026-02-12T14:02:41Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments

- All 28 service functions across 5 files accept userId as first parameter with Prisma queries filtered by userId
- All 15 server actions verify Firebase ID token via verifyUser() before proceeding
- All 8 Server Component pages read userId from cookie and redirect if unauthenticated
- All 9 client components (including subtask-list) pass fresh ID token to action calls
- Project and Section verify ownership through parent workspace chain
- Build, lint, and tests (27/27) all pass cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Add userId to all service functions** - `9f24199` (feat)
2. **Task 2: Update all actions, pages, and client components for auth** - `e63ef7d` (feat)

## Files Created/Modified

- `src/services/workspace.service.ts` - userId filtering on all 5 workspace CRUD functions
- `src/services/project.service.ts` - Ownership via workspace chain on all 5 project functions
- `src/services/section.service.ts` - Ownership verification helpers + 4 section functions
- `src/services/task.service.ts` - userId on all 9 task CRUD/query functions
- `src/services/tag.service.ts` - userId on all 5 tag CRUD functions + tag ownership check
- `src/actions/workspace.ts` - verifyUser(idToken) on create/update/delete
- `src/actions/project.ts` - verifyUser(idToken) on create/update/delete
- `src/actions/section.ts` - verifyUser(idToken) on create/update/delete
- `src/actions/task.ts` - verifyUser(idToken) on create/update/delete/toggle/assignToSection
- `src/actions/tag.ts` - verifyUser(idToken) on create/update/delete
- `src/app/tasks/layout.tsx` - Cookie auth + AuthGuard fallback
- `src/app/tasks/page.tsx` - Cookie auth + redirect
- `src/app/tasks/[projectId]/page.tsx` - Cookie auth + userId-scoped getProject
- `src/app/tasks/today/page.tsx` - Cookie auth + userId-scoped getTasksForToday
- `src/app/tasks/completed/page.tsx` - Cookie auth + userId-scoped getCompletedTasks
- `src/app/tasks/search/page.tsx` - Cookie auth + userId-scoped searchTasks
- `src/app/tasks/tags/page.tsx` - Cookie auth + userId-scoped getTags
- `src/app/tasks/tags/[tagId]/page.tsx` - Cookie auth + userId-scoped getTasksByTag
- `src/components/tasks/sidebar.tsx` - useAuth + getIdToken for workspace/project actions
- `src/components/tasks/task-card.tsx` - useAuth + getIdToken for toggle/delete
- `src/components/tasks/task-form.tsx` - useAuth + getIdToken for create/update
- `src/components/tasks/quick-add-modal.tsx` - useAuth + getIdToken for create
- `src/components/tasks/section-header.tsx` - useAuth + getIdToken for update/delete
- `src/components/tasks/add-section-button.tsx` - useAuth + getIdToken for create
- `src/app/tasks/[projectId]/project-view.tsx` - useAuth + getIdToken for project rename
- `src/app/tasks/tags/tag-list.tsx` - useAuth + getIdToken for create/delete tag
- `src/components/tasks/subtask-list.tsx` - useAuth + getIdToken for subtask create/toggle/delete

## Decisions Made

- **Server actions use idToken parameter (not getUserIdFromCookie):** Actions receive the token from the client, verify it server-side via verifyUser(). This ensures the verified token goes through Firebase Admin SDK, and userId is never derived from client-controlled input.
- **getProject strips workspace from return:** After checking ownership via workspace.userId, the workspace object is removed from the response to avoid exposing internal structure to callers.
- **Section/Project ownership via workspace chain:** Projects and sections don't have direct userId columns. Ownership is verified by traversing project -> workspace -> userId, which avoids schema duplication.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added auth to subtask-list.tsx**
- **Found during:** Task 2 (client component updates)
- **Issue:** subtask-list.tsx calls createTaskAction, deleteTaskAction, and toggleTaskAction directly but was not listed in the plan's client component list
- **Fix:** Added useAuth import, getIdToken calls before each action invocation
- **Files modified:** src/components/tasks/subtask-list.tsx
- **Verification:** Build passes, all action calls now include token
- **Committed in:** e63ef7d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix -- without it, subtask operations would fail at runtime since actions now require idToken as first parameter.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AUTH-02 satisfied: Every query filters by userId (complete data isolation)
- AUTH-03 satisfied: All Prisma queries include userId filter
- AUTH-04 satisfied: Server derives userId from verified Firebase token
- Phase 33 (Multi-User + Auth) is complete -- all 3 plans executed
- Ready for Phase 34 (billing integration) or deployment

## Self-Check: PASSED

All 28 key files verified as modified. Both task commits (9f24199, e63ef7d) verified in git log.

---
*Phase: 33-multi-user-auth*
*Completed: 2026-02-12*
