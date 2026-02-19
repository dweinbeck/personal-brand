---
phase: 45-ui-components-routing
verified: 2026-02-18T19:45:00Z
status: human_needed
score: 9/10 must-haves verified
re_verification: false
human_verification:
  - test: "Layout Integration Check"
    expected: "Navbar and Footer from personal-brand root layout should be visible when viewing /apps/tasks"
    why_human: "Success Criterion 1 says 'inside the personal-brand layout (shared navbar, footer)' but implementation uses h-screen sidebar layout that may hide footer. Plan 02 explicitly documents this as correct architecture. Need visual verification and stakeholder decision on whether navbar/footer should be visible or if sidebar-only layout is acceptable."
---

# Phase 45: UI Components & Routing Verification Report

**Phase Goal:** Users can navigate to /apps/tasks and interact with the full Tasks UI (sidebar, views, forms) inside the personal-brand app shell

**Verified:** 2026-02-18T19:45:00Z

**Status:** human_needed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Based on ROADMAP.md Success Criteria and PLAN must_haves:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visiting /apps/tasks renders the Tasks application inside the personal-brand layout (shared navbar, footer) | ? UNCERTAIN | Tasks layout uses `h-screen` which creates full-viewport sidebar layout. Root layout has Navbar/Footer but Tasks layout may cover footer. Flagged for human verification. |
| 2 | All Tasks sub-pages work at their new paths: /apps/tasks/[projectId], /apps/tasks/today, /apps/tasks/completed, /apps/tasks/search, /apps/tasks/tags/[tagId] | ✓ VERIFIED | Build output shows all routes exist as dynamic SSR routes. Route files verified: [projectId]/page.tsx (941 bytes), today/page.tsx (1395 bytes), completed/page.tsx (1091 bytes), search/page.tsx (1723 bytes), tags/page.tsx (798 bytes), tags/[tagId]/page.tsx (1861 bytes). All use correct import paths (@/services/tasks/*, @/lib/tasks/*, @/components/tasks/*). |
| 3 | The Tasks sidebar (workspaces, projects, smart views, tags) appears in the /apps/tasks layout without a redundant "Tasks" heading | ✓ VERIFIED | Sidebar component (12,846 bytes) rendered in layout.tsx line 59. Grep for "Tasks" heading in sidebar.tsx returns zero matches. Sidebar starts directly with navigation items. |
| 4 | All sidebar navigation links use /apps/tasks/... paths | ✓ VERIFIED | navItems array lines 26-29 in sidebar.tsx: all use `/apps/tasks/today`, `/apps/tasks/completed`, `/apps/tasks/search`, `/apps/tasks/tags`. Zero matches for bare `/tasks/` paths without /apps prefix. |
| 5 | The /apps hub card for Tasks links to /apps/tasks instead of the external tasks.dan-weinbeck.com URL | ✓ VERIFIED | src/data/apps.ts line 32: `href: "/apps/tasks"`. Zero matches for `tasks.dan-weinbeck.com` or `NEXT_PUBLIC_TASKS_APP_URL` in apps.ts. No `sameTab` property on Tasks entry. |
| 6 | All Tasks UI components exist in src/components/tasks/ and compile without errors | ✓ VERIFIED | Build passes with all 18+ component files present. task-card.tsx (8002 bytes), sidebar.tsx (12,846 bytes), task-form.tsx, subtask-list.tsx, board-view.tsx, section-header.tsx, add-task-button.tsx, add-section-button.tsx, quick-add-modal.tsx, plus 5 UI primitives (button, input, modal, badge, confirm-dialog) and 4 auth/billing components all verified. |
| 7 | Tasks-specific UI primitives (Button, Input, Modal, Badge, ConfirmDialog) are namespaced under src/components/tasks/ui/ and do NOT overwrite personal-brand's existing src/components/ui/ files | ✓ VERIFIED | All Tasks UI primitives in src/components/tasks/ui/. Personal-brand's src/components/ui/Button.tsx, Card.tsx, Modal.tsx unchanged (not in modified files list). Zero imports from @/components/ui/ in Tasks components. |
| 8 | Tasks types (TaskWithRelations, ProjectWithSections, SidebarWorkspace, etc.) are importable from @/lib/tasks/types | ✓ VERIFIED | src/lib/tasks/types.ts exists (666 bytes, 39 lines). Exports TaskWithRelations (lines 9-13), ProjectWithSections (lines 15-20), WorkspaceWithProjects, SidebarProject, SidebarWorkspace (lines 34-38). Used in layout.tsx line 9, task-card.tsx line 9, completed-view.tsx line 5. |
| 9 | cn utility function exists at @/lib/utils for Tailwind class merging | ✓ VERIFIED | src/lib/utils.ts exists (118 bytes, 5 lines). Exports cn function using clsx. Imported in sidebar.tsx line 18, multiple UI components. |
| 10 | getUserIdFromCookie function exists in @/lib/tasks/auth for server-side cookie authentication | ✓ VERIFIED | layout.tsx line 7 imports getUserIdFromCookie, line 18 calls it for auth check. Function added to existing auth.ts file alongside verifyUser. |

**Score:** 9/10 truths verified (1 flagged for human verification)

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| src/components/tasks/task-card.tsx | TaskCard component (min 20 lines) | ✓ VERIFIED | 8002 bytes, imports from @/actions/tasks/task (line 4), @/lib/tasks/types (line 9) |
| src/components/tasks/sidebar.tsx | Sidebar component with /apps/tasks paths (min 50 lines) | ✓ VERIFIED | 12,846 bytes, all navItems use /apps/tasks/* prefix (lines 26-29), no Tasks heading |
| src/lib/tasks/types.ts | TaskWithRelations, ProjectWithSections, SidebarWorkspace types | ✓ VERIFIED | 666 bytes, exports all 5 required types including TaskWithRelations, ProjectWithSections, SidebarWorkspace |
| src/lib/utils.ts | cn utility for class merging | ✓ VERIFIED | 118 bytes, exports cn function using clsx |

#### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| src/app/apps/tasks/layout.tsx | Tasks layout with sidebar, billing, auth (min 30 lines) | ✓ VERIFIED | 2334 bytes, 75 lines. Imports Sidebar (line 6), getUserIdFromCookie (line 7), renders Sidebar (line 59), BillingProvider (line 52), AuthGuard (line 21) |
| src/app/apps/tasks/page.tsx | Tasks landing page (min 10 lines) | ✓ VERIFIED | 1540 bytes, 56 lines. Server component with workspace data fetching |
| src/app/apps/tasks/[projectId]/page.tsx | Project detail page (min 10 lines) | ✓ VERIFIED | 941 bytes, 31 lines. Calls getProject service, renders ProjectView |
| src/app/apps/tasks/today/page.tsx | Today view page (min 10 lines) | ✓ VERIFIED | 1395 bytes, 47 lines. Filters tasks by deadline |
| src/app/apps/tasks/completed/page.tsx | Completed view page (min 10 lines) | ✓ VERIFIED | 1091 bytes, 37 lines. Shows completed tasks with project filter |
| src/app/apps/tasks/search/page.tsx | Search page (min 10 lines) | ✓ VERIFIED | 1723 bytes, 61 lines. Search interface with query results |
| src/app/apps/tasks/tags/page.tsx | Tags management page (min 10 lines) | ✓ VERIFIED | 798 bytes, 25 lines. Tag list with create/delete |
| src/app/apps/tasks/tags/[tagId]/page.tsx | Tag detail page (min 10 lines) | ✓ VERIFIED | 1861 bytes, 64 lines. Tasks filtered by specific tag |

#### Plan 03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| src/data/apps.ts | Apps listing with internal Tasks route | ✓ VERIFIED | Line 32: `href: "/apps/tasks"`. No external URL, no sameTab property |

### Key Link Verification

#### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| src/components/tasks/task-card.tsx | @/actions/tasks/task | server action imports | ✓ WIRED | Line 4: `import { deleteTaskAction, toggleTaskAction } from "@/actions/tasks/task"` |
| src/components/tasks/sidebar.tsx | @/actions/tasks/workspace | server action imports | ✓ WIRED | Lines 9, 13: imports from @/actions/tasks/project and @/actions/tasks/workspace |
| src/components/tasks/task-card.tsx | @/lib/tasks/types | type imports | ✓ WIRED | Line 9: `import type { TaskWithRelations } from "@/lib/tasks/types"` |

#### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| src/app/apps/tasks/layout.tsx | @/components/tasks/sidebar | import Sidebar component | ✓ WIRED | Line 6: import, line 59: `<Sidebar workspaces={sidebarWorkspaces} allTags={allTags} />` |
| src/app/apps/tasks/layout.tsx | @/lib/tasks/auth | getUserIdFromCookie for server-side auth | ✓ WIRED | Line 7: import, line 18: `const userId = await getUserIdFromCookie()` |
| src/app/apps/tasks/[projectId]/page.tsx | @/services/tasks/project.service | getProject service call | ✓ WIRED | Line 3: import, line 17: `getProject(userId, projectId)` call |
| src/app/apps/tasks/completed/completed-view.tsx | /apps/tasks/completed | router.push with correct path prefix | ✓ WIRED | Line 28: `router.push(\`/apps/tasks/completed?${params.toString()}\`)` |

#### Plan 03 Key Links

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| src/data/apps.ts | /apps/tasks | href property in Tasks listing | ✓ WIRED | Line 32: `href: "/apps/tasks"` in Tasks object |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MIG-04 | 45-01 | Tasks UI components render correctly in the personal-brand app shell | ✓ SATISFIED | All 18+ components exist, compile without errors, use adapted imports. Build passes. Task-card, sidebar, forms all present with substantive implementations. |
| RT-01 | 45-02 | Tasks app is accessible at /apps/tasks (not a separate subdomain) | ✓ SATISFIED | Build output shows `/apps/tasks` route as dynamic SSR. layout.tsx and page.tsx exist. Apps hub links to /apps/tasks. |
| RT-02 | 45-02 | All Tasks sub-pages work at /apps/tasks/[projectId], /apps/tasks/today, /apps/tasks/completed, /apps/tasks/search, /apps/tasks/tags/[tagId] | ✓ SATISFIED | Build output shows all sub-routes: `├ ƒ /apps/tasks/[projectId]`, `├ ƒ /apps/tasks/today`, `├ ƒ /apps/tasks/completed`, `├ ƒ /apps/tasks/search`, `├ ƒ /apps/tasks/tags`, `├ ƒ /apps/tasks/tags/[tagId]`. All route files verified present and substantive. |
| RT-03 | 45-03 | Apps hub listing for Tasks uses internal /apps/tasks route instead of external URL | ✓ SATISFIED | src/data/apps.ts line 32: `href: "/apps/tasks"`. No external URL reference. No NEXT_PUBLIC_TASKS_APP_URL usage. |
| SB-01 | 45-02 | Tasks sidebar (workspaces, projects, smart views, tags) integrated into layout | ✓ SATISFIED | layout.tsx imports Sidebar (line 6), fetches workspaces and tags data (lines 27-37), renders `<Sidebar workspaces={sidebarWorkspaces} allTags={allTags} />` (line 59). |
| SB-02 | 45-01 | Sidebar does NOT include the "Tasks" heading — only content below it | ✓ SATISFIED | Grep for "Tasks" heading in sidebar.tsx returns zero matches. navItems array starts directly with navigation items (Today, Completed, Search, Filters & Tags). |
| SB-03 | 45-01, 45-02 | Sidebar navigation links use /apps/tasks/... paths instead of /tasks/... | ✓ SATISFIED | navItems array in sidebar.tsx lines 26-29: all entries use `/apps/tasks/today`, `/apps/tasks/completed`, `/apps/tasks/search`, `/apps/tasks/tags`. Zero bare `/tasks/` paths found. |

**Orphaned requirements:** None — all requirements in ROADMAP.md Phase 45 are claimed by plans.

### Anti-Patterns Found

None found. Checked for:
- TODO/FIXME/PLACEHOLDER comments: Only legitimate input placeholder text (e.g., "Task name", "Search tasks...")
- Empty implementations: Zero `return null`/`{}`/`[]` in route pages
- Console.log only implementations: Not found
- Stub wiring: All server actions imported and used with real implementations

All route files have substantive implementations calling services, rendering components, and handling state.

### Human Verification Required

#### 1. Layout Integration with Navbar/Footer

**Test:** Navigate to /apps/tasks in a browser and verify whether the personal-brand Navbar and Footer are visible.

**Expected (based on Success Criterion 1):** The Tasks application should render "inside the personal-brand layout (shared navbar, footer)" — meaning both should be visible.

**Actual Implementation:** The Tasks layout uses `flex h-screen bg-background` (line 58 of layout.tsx), which creates a full-viewport-height sidebar layout. The root layout (src/app/layout.tsx) wraps all pages with `<Navbar />` and `<Footer />`, but the Tasks `h-screen` container may push the Footer below the viewport.

**Why human:** This is an architectural decision documented in Plan 02 as "correct" — the plan states "Tasks layout uses flex h-screen sidebar layout, NOT personal-brand Navbar/Footer" and "Tasks layout uses its own sidebar layout, separate from personal-brand's Navbar/Footer -- this is correct since the Tasks app has sidebar-based navigation."

However, the ROADMAP Success Criterion 1 says the Tasks app should render "inside the personal-brand layout (shared navbar, footer)". This could mean:
1. Literally inside with both navbar and footer visible (what the criterion says)
2. Within the same Next.js application (how it was implemented)

**Decision needed:** Is the current sidebar-only full-screen layout acceptable, or should the Tasks app render within the Navbar/Footer boundaries? If the latter, the layout needs to be refactored to not use `h-screen` and to work within the root layout's content area.

**Impact:** If Navbar/Footer should be visible, this is a blocking gap requiring layout refactor. If sidebar-only is acceptable, then Success Criterion 1 needs clarification and this phase is complete.

---

## Gaps Summary

**No gaps found in automated verification.** All 9 automated success criteria passed verification:
- All UI components exist and compile
- All routes exist and are accessible
- Sidebar integrated with correct paths and no redundant heading
- Apps hub links to internal route
- All imports use correct personal-brand module paths
- All wiring verified (components import and use server actions, services, types)
- Build passes

**One item flagged for human verification:** Layout integration with personal-brand Navbar/Footer. This is not a gap in implementation quality — all code is substantive and wired — but a potential gap between the stated success criterion and the implemented architecture. The implementation is internally consistent and high-quality; the question is whether the architectural decision to use a full-screen sidebar layout (separate from Navbar/Footer) aligns with stakeholder expectations.

---

_Verified: 2026-02-18T19:45:00Z_

_Verifier: Claude (gsd-verifier)_
