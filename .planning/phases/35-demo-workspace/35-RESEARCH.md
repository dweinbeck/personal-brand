# Phase 35: Demo Workspace - Research

**Researched:** 2026-02-12
**Domain:** Client-side demo mode for a Next.js task management app (todoist repo)
**Confidence:** HIGH

## Summary

Phase 35 requires building a pre-populated demo workspace that unauthenticated visitors can explore to see the full feature set of the todoist app. The demo must run entirely client-side with zero database writes or API calls, display a persistent "DEMO" banner with sign-up CTA, and disable all mutation UI elements (create, edit, delete) with clear feedback.

The todoist app is a Next.js 16 + React 19 + Tailwind CSS 4 application with PostgreSQL/Prisma on the backend. The current architecture uses server components for data fetching (layout.tsx fetches workspaces/tags/billing, page.tsx fetches project data) and client components for interactivity (task cards, forms, sidebar). All mutations go through server actions in `src/actions/` which verify Firebase Auth tokens and check billing status before writing to Postgres. The existing data model includes Workspaces > Projects > Sections > Tasks (with subtasks, tags, effort scores, deadlines).

The key architectural challenge is that the existing `/tasks` route tree is deeply coupled to authenticated server-side data fetching: `layout.tsx` calls `getUserIdFromCookie()` and redirects unauthenticated users. The demo must bypass this entirely with a parallel route structure (`/demo`) that renders the same UI components but with hardcoded client-side data and all mutations disabled.

**Primary recommendation:** Create a `/demo` route with a client-side `DemoProvider` context that supplies static seed data matching the existing type shapes (`ProjectWithSections`, `SidebarWorkspace`, tags), wrap existing presentation components in a `useDemoMode()` guard that disables mutations, and add a persistent banner component.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16 | App Router, routing, SSR/CSR | Already in use in todoist |
| React | 19 | UI framework, Context API for demo state | Already in use |
| Tailwind CSS | 4 | Styling, banner/badge design | Already in use |
| TypeScript | (project version) | Type safety for demo data | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | (project version) | Unit testing demo data and mode logic | Test demo seed data shapes, mode guards |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Context for demo state | Zustand or localStorage | Context is simpler, no external deps, data is static anyway |
| Separate `/demo` route | Query param `?mode=demo` on `/tasks` | Separate route is cleaner -- avoids contaminating auth flow in layout.tsx |
| Client component demo page | Server component with static data | Client-side is required (DEMO-03: zero API calls) |

**Installation:**
```bash
# No new dependencies needed. All tools already in the todoist project.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── demo/                    # New: demo route (parallel to /tasks)
│       ├── layout.tsx           # Client-side layout with DemoProvider, no auth
│       ├── page.tsx             # Demo landing, redirects to first project
│       └── [projectId]/
│           └── page.tsx         # Demo project view
├── components/
│   ├── demo/                    # New: demo-specific components
│   │   ├── DemoBanner.tsx       # Persistent banner with CTA
│   │   └── DemoProvider.tsx     # Context provider with seed data + demo mode flag
│   └── tasks/                   # Existing: reused in demo mode
│       ├── sidebar.tsx          # Needs demo-mode awareness (disable mutations)
│       ├── task-card.tsx        # Needs demo-mode awareness (disable mutations)
│       ├── board-view.tsx       # Reusable as-is (display only)
│       ├── section-header.tsx   # Needs demo-mode awareness (disable rename/delete)
│       └── ...
├── data/
│   └── demo-seed.ts             # New: static seed data (30-60 tasks, 3-5 projects)
└── lib/
    └── demo.ts                  # New: useDemoMode hook, type definitions
```

### Pattern 1: DemoProvider Context
**What:** A React context that wraps the entire demo route tree, providing static seed data and a `isDemoMode: true` flag that child components can read.
**When to use:** At the `/demo` layout level to supply all data that would normally come from server-side fetching.
**Example:**
```typescript
// src/components/demo/DemoProvider.tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ProjectWithSections, SidebarWorkspace } from "@/types";
import { DEMO_WORKSPACES, DEMO_PROJECTS, DEMO_TAGS } from "@/data/demo-seed";

interface DemoContextValue {
  isDemoMode: true;
  workspaces: SidebarWorkspace[];
  projects: Map<string, ProjectWithSections>;
  allTags: { id: string; name: string; color: string | null }[];
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const value: DemoContextValue = {
    isDemoMode: true,
    workspaces: DEMO_WORKSPACES,
    projects: DEMO_PROJECTS,
    allTags: DEMO_TAGS,
  };

  return <DemoContext value={value}>{children}</DemoContext>;
}

export function useDemoContext(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoContext must be used within DemoProvider");
  return ctx;
}
```

### Pattern 2: Demo Mode Guard for Mutation Components
**What:** A hook/pattern that existing components use to detect demo mode and disable mutations.
**When to use:** In every component that has create/edit/delete functionality.
**Example:**
```typescript
// src/lib/demo.ts
"use client";

import { createContext, useContext } from "react";

const DemoModeContext = createContext<boolean>(false);
export const DemoModeProvider = DemoModeContext.Provider;
export function useDemoMode(): boolean {
  return useContext(DemoModeContext);
}
```

Components then check:
```typescript
// Inside TaskCard, Sidebar, SectionHeader, etc.
const isDemo = useDemoMode();

// Disable mutation buttons
<button disabled={isDemo} title={isDemo ? "Sign up to edit tasks" : "Edit task"}>
```

### Pattern 3: Static Seed Data as TypeScript Module
**What:** A single TypeScript file exporting hardcoded demo data that exactly matches the Prisma-generated types (with relations).
**When to use:** Imported by DemoProvider, also testable independently.
**Example:**
```typescript
// src/data/demo-seed.ts
import type { ProjectWithSections, SidebarWorkspace, TaskWithRelations } from "@/types";

// Use deterministic IDs for URL routing (e.g., "demo-proj-1")
export const DEMO_TAGS = [
  { id: "demo-tag-1", name: "Frontend", color: "#3b82f6" },
  { id: "demo-tag-2", name: "Backend", color: "#10b981" },
  // ...
];

export const DEMO_WORKSPACES: SidebarWorkspace[] = [
  {
    id: "demo-ws-1",
    name: "Product Launch",
    projects: [
      { id: "demo-proj-1", name: "Website Redesign", openTaskCount: 12 },
      // ...
    ],
  },
  // ...
];

// Full project data with sections, tasks, subtasks, tags, effort scores
export const DEMO_PROJECTS: Map<string, ProjectWithSections> = new Map([
  ["demo-proj-1", { /* ... */ }],
]);
```

### Pattern 4: Parallel Route for Demo (Not Shared Layout)
**What:** The demo lives at `/demo` with its own layout.tsx, completely separate from `/tasks`.
**When to use:** Always. The `/tasks` layout requires authentication and server-side data fetching. The demo layout provides client-side data via DemoProvider.
**Why not intercepting routes or shared layout:** The `/tasks/layout.tsx` calls `getUserIdFromCookie()` and returns `<AuthGuard>` for unauthenticated users. Trying to conditionally bypass this in the same layout would create fragile, hard-to-maintain branching in server component code. A separate `/demo` route is clean and isolated.

### Anti-Patterns to Avoid
- **Sharing layout.tsx with `/tasks`:** The tasks layout does server-side auth + DB queries. Demo needs none of that. Do not try to make one layout serve both purposes.
- **Using `useRouter` to redirect demo to `/tasks`:** This would hit the auth wall. Demo must stay within `/demo` routes.
- **Modifying existing components with `if (isDemo) return` everywhere:** Instead, use the context-based guard pattern. Mutation handlers should check `isDemoMode` at the point of action, not restructure the entire component tree.
- **Storing demo data in localStorage:** Violates DEMO-03 (client-side only, no persistence that might confuse users). In-memory React state is correct.
- **Making demo data mutable:** The requirements say "pre-populated" and mutations should be "disabled or show feedback." Do NOT implement client-side CRUD on demo data -- this adds complexity for zero value and confuses users about persistence.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Demo data shapes | Manual JSON matching Prisma types | TypeScript module with type annotations against existing `ProjectWithSections`, `TaskWithRelations`, `SidebarWorkspace` types | Compiler catches shape mismatches |
| Demo mode detection | Prop drilling `isDemo` through every component | React Context (`useDemoMode()` hook) | Single source of truth, no prop pollution |
| Banner component | Custom floating div with manual z-index | Sticky banner at top of layout with Tailwind classes (`sticky top-0 z-50`) | Consistent with existing banner patterns (FreeWeekBanner, ReadOnlyBanner) |
| Demo routing | Conditional auth bypass in tasks layout | Separate `/demo` route tree | Clean separation, no risk of auth regression |
| Realistic demo content | Generic "Task 1, Task 2" placeholder text | Domain-specific realistic tasks (see seed data section below) | Demo must showcase the app's value; generic data does not sell |

**Key insight:** The hardest part of this phase is NOT the code -- it is crafting realistic, diverse demo data that showcases effort scores, subtasks, tags, sections, deadlines, and multiple project structures. The implementation is straightforward context + route + component guards.

## Common Pitfalls

### Pitfall 1: Demo Data Types Don't Match Prisma Types
**What goes wrong:** The seed data is hand-crafted JSON that looks correct but is missing fields that Prisma auto-generates (like `createdAt`, `updatedAt`, `order`). Components that access `task.createdAt` or `section.order` crash with undefined errors in demo mode.
**Why it happens:** The `TaskWithRelations` type includes ALL Prisma model fields (including auto-generated ones). Hand-crafted demo data often omits these.
**How to avoid:** Type-annotate ALL demo data with the exact Prisma-derived types (`TaskWithRelations`, `ProjectWithSections`, etc.). The TypeScript compiler will flag missing fields. Include realistic `createdAt`/`updatedAt` Date objects and `order` float values.
**Warning signs:** TypeScript errors mentioning "Property 'X' is missing in type" when assigning demo data to typed variables.

### Pitfall 2: Server Components in Demo Route Try to Access Server-Only Modules
**What goes wrong:** If the demo route pages are server components, they might accidentally import from `@/lib/auth` or `@/services/` which import `server-only` or Prisma. This causes build errors because demo pages should have zero server dependencies.
**Why it happens:** Copy-pasting from existing `/tasks` pages which are server components.
**How to avoid:** Make ALL demo route components client components (`"use client"` at top). The demo layout, pages, and all child components must be client-only. No imports from `@/lib/auth`, `@/services/`, `@/actions/`, or `@/lib/db`.
**Warning signs:** Build errors mentioning "server-only" module imported in client component.

### Pitfall 3: Mutation Handlers Crash When `user` Is Null in Demo Mode
**What goes wrong:** Existing components like `TaskCard`, `Sidebar`, `SubtaskList` call `const { user } = useAuth()` and then `await user!.getIdToken()` in mutation handlers. In demo mode, `user` is `null` (not authenticated). If a mutation button is not properly disabled, clicking it crashes with a null dereference.
**Why it happens:** The non-null assertion `user!` assumes authentication. Demo mode breaks this assumption.
**How to avoid:** Two layers of protection: (1) disable mutation buttons in demo mode via `useDemoMode()`, (2) add early return in mutation handlers if `isDemo` is true, showing a toast/alert instead. Never rely solely on button `disabled` state -- keyboard users and screen readers can still trigger actions.
**Warning signs:** Runtime error "Cannot read properties of null (reading 'getIdToken')" in demo mode.

### Pitfall 4: Demo Banner Obscures Content or Is Not Persistent Enough
**What goes wrong:** A fixed/sticky banner at the top pushes content down or overlaps the sidebar. Or the banner scrolls out of view, and users forget they are in demo mode.
**Why it happens:** The existing layout uses `flex h-screen` with sidebar and main content. Adding a banner above this requires adjusting the height calculation.
**How to avoid:** Place the banner INSIDE the demo layout but ABOVE the flex container. Use `sticky top-0 z-50` so it remains visible during scroll. Give it enough visual weight (distinct background color, clear "DEMO" text) but keep it compact (single line, ~40px height). Adjust the main content area height to account for the banner.
**Warning signs:** Content partially hidden behind the banner, or banner invisible after scrolling.

### Pitfall 5: Demo Project URLs Don't Work (404)
**What goes wrong:** The sidebar links to `/demo/[projectId]` but the dynamic route handler does not exist or uses the wrong data source. Clicking a project in the sidebar results in a 404.
**Why it happens:** The demo route mirrors the `/tasks/[projectId]` pattern but uses demo IDs like `demo-proj-1`. If the `[projectId]/page.tsx` tries to fetch from the database instead of the demo seed data, it returns 404.
**How to avoid:** The demo `[projectId]/page.tsx` must be a client component that reads from `useDemoContext()` to get the project data by ID. It should show a "not found" state (not crash) if the ID is not in the seed data.
**Warning signs:** 404 errors when navigating between demo projects.

### Pitfall 6: Demo Does Not Showcase Enough Feature Diversity
**What goes wrong:** The demo data is too uniform -- all tasks have effort scores, or none do. All tasks are in sections, or none are. This fails to showcase the breadth of features (DEMO-02).
**Why it happens:** Rushing seed data creation, using repetitive patterns.
**How to avoid:** Design seed data intentionally to cover: tasks WITH and WITHOUT effort scores, tasks WITH and WITHOUT deadlines (including some overdue), tasks WITH and WITHOUT subtasks (including some partially completed), tasks in sections AND unsectioned, tasks with multiple tags AND no tags, OPEN and COMPLETED tasks, multiple project structures (list-heavy vs. board-ready with sections). Create a checklist of features to showcase and verify each appears in the seed data.
**Warning signs:** A feature mentioned in DEMO-02 (effort, subtasks, tags, sections) is not visible in any demo project.

## Code Examples

### Demo Layout (Client-Side Only)
```typescript
// src/app/demo/layout.tsx
"use client";

import { DemoProvider } from "@/components/demo/DemoProvider";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { DemoSidebar } from "@/components/demo/DemoSidebar";
import { DemoModeProvider } from "@/lib/demo";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoModeProvider value={true}>
      <DemoProvider>
        <div className="flex flex-col h-screen">
          <DemoBanner />
          <div className="flex flex-1 overflow-hidden">
            <DemoSidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </DemoProvider>
    </DemoModeProvider>
  );
}
```

### Demo Banner Component
```typescript
// src/components/demo/DemoBanner.tsx
"use client";

import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-50 bg-primary text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold bg-white/20 px-2 py-0.5 rounded text-xs uppercase tracking-wider">
          Demo
        </span>
        <span>
          You are viewing a demo workspace. Data is temporary and will not be saved.
        </span>
      </div>
      <Link
        href="/tasks"
        className="px-4 py-1.5 bg-gold text-primary font-medium rounded-[var(--radius-button)] hover:bg-gold-hover transition-colors text-xs"
      >
        Sign Up Free
      </Link>
    </div>
  );
}
```

### Disabling Mutations in TaskCard
```typescript
// Pattern for existing components to detect demo mode
// Add to TaskCard, SectionHeader, SubtaskList, AddTaskButton, AddSectionButton, QuickAddModal

import { useDemoMode } from "@/lib/demo";

// Inside the component:
const isDemo = useDemoMode();

// For toggle/delete buttons:
<button
  type="button"
  onClick={isDemo ? undefined : handleToggle}
  disabled={isDemo}
  title={isDemo ? "Sign up to manage tasks" : "Toggle task status"}
  className={cn(
    // ... existing classes,
    isDemo && "opacity-50 cursor-not-allowed"
  )}
>

// For edit/delete action buttons (hide entirely in demo, or show disabled):
{!isDemo && (
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
    {/* edit and delete buttons */}
  </div>
)}
```

### Demo Seed Data Structure (Excerpt)
```typescript
// src/data/demo-seed.ts
// This file should be ~200-300 lines with realistic, diverse data

const now = new Date();
const yesterday = new Date(now.getTime() - 86400000);
const nextWeek = new Date(now.getTime() + 7 * 86400000);
const lastWeek = new Date(now.getTime() - 7 * 86400000);

// Example of one task with full relations
const exampleTask: TaskWithRelations = {
  id: "demo-task-1",
  userId: "demo-user",
  projectId: "demo-proj-1",
  sectionId: "demo-section-1",
  parentTaskId: null,
  name: "Design homepage hero section",
  description: "Create the hero section with animated gradient background and clear CTA",
  deadlineAt: nextWeek,
  status: "OPEN",
  effort: 5,
  order: 1,
  createdAt: lastWeek,
  updatedAt: yesterday,
  section: { id: "demo-section-1", name: "Design", projectId: "demo-proj-1", order: 1, createdAt: lastWeek, updatedAt: lastWeek },
  subtasks: [
    { id: "demo-subtask-1", userId: "demo-user", projectId: "demo-proj-1", sectionId: null, parentTaskId: "demo-task-1", name: "Wireframe layout", description: null, deadlineAt: null, status: "COMPLETED", effort: null, order: 1, createdAt: lastWeek, updatedAt: yesterday },
    { id: "demo-subtask-2", userId: "demo-user", projectId: "demo-proj-1", sectionId: null, parentTaskId: "demo-task-1", name: "Choose color palette", description: null, deadlineAt: null, status: "OPEN", effort: null, order: 2, createdAt: lastWeek, updatedAt: lastWeek },
  ],
  tags: [
    { tag: { id: "demo-tag-1", name: "Design", color: "#8b5cf6", userId: "demo-user" } },
    { tag: { id: "demo-tag-3", name: "High Priority", color: "#ef4444", userId: "demo-user" } },
  ],
};
```

### Demo Sidebar (Wrapping Existing Sidebar Logic)
```typescript
// The DemoSidebar is a simplified version of Sidebar that:
// 1. Uses demo seed data instead of server-fetched data
// 2. Links to /demo/[projectId] instead of /tasks/[projectId]
// 3. Does NOT render add/delete workspace/project buttons
// 4. Does NOT render QuickAddModal

// Two approaches:
// A) Create a new DemoSidebar component (recommended: cleaner, no conditional logic)
// B) Modify existing Sidebar to accept a mode prop (more reuse, but adds complexity)

// Approach A is recommended because the sidebar has significant mutation logic
// that would need to be conditionally disabled throughout.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side demo with fake userId in DB | Client-side demo with React Context | Industry standard as of ~2023 | Zero DB contamination, zero server cost |
| Demo behind auth wall (create account first) | Unauthenticated demo before signup | SaaS best practice | Lower friction, higher conversion |
| Full CRUD demo (mutations work on fake data) | Read-only demo (mutations disabled) | Depends on product strategy | Simpler implementation, clearer "sign up to use" message |

**Note:** The decision to make the demo read-only (mutations disabled) vs. interactive (mutations work on local state) is a product decision. The requirements (DEMO-05) say "disabled or show feedback" -- this research recommends disabled with feedback ("Sign up to manage tasks") as the simpler and clearer approach.

## Demo Seed Data Design Guide

The seed data is the most important deliverable in this phase. It must showcase every feature while feeling realistic and coherent.

### Recommended Project Structure (3-5 projects across 1-2 workspaces)

**Workspace 1: "Product Launch"**
- **Project: Website Redesign** (12-15 tasks, 3 sections: Design, Development, QA)
  - Showcases: sections, board view readiness, effort scores across sections, overdue deadlines, subtasks
- **Project: Marketing Campaign** (8-10 tasks, 2 sections: Content, Distribution)
  - Showcases: tags (Content, Social, Email), mixed effort levels, some completed tasks
- **Project: Launch Checklist** (5-8 tasks, unsectioned)
  - Showcases: flat task list without sections, deadlines, high effort tasks

**Workspace 2: "Personal"** (optional, adds variety)
- **Project: Learning Goals** (8-10 tasks, 2 sections: Reading, Courses)
  - Showcases: different domain context, low-effort tasks, subtasks as chapters/modules

### Feature Coverage Checklist
- [ ] Tasks with effort scores (1, 2, 3, 5, 8, 13) -- at least one of each
- [ ] Tasks without effort scores (null) -- to show the unscored state
- [ ] Tasks with deadlines (future dates)
- [ ] Tasks with overdue deadlines (past dates, still OPEN)
- [ ] Tasks with no deadlines
- [ ] Tasks with subtasks (some completed, some open)
- [ ] Tasks without subtasks
- [ ] Tasks with tags (1-3 tags per task)
- [ ] Tasks without tags
- [ ] COMPLETED tasks (to show strikethrough + checkmark UI)
- [ ] Tasks in sections (to show section headers + effort rollups)
- [ ] Unsectioned tasks (to show the "No Section" area)
- [ ] Tasks with descriptions (to show expandable detail)
- [ ] Tasks without descriptions
- [ ] Multiple projects in a workspace (to show sidebar navigation)
- [ ] Tags in sidebar (to show Filters & Tags page)
- [ ] Effort rollup visible at section and project level

### Tag Palette (6-8 tags with distinct colors)
| Tag Name | Color | Hex |
|----------|-------|-----|
| Frontend | Blue | #3b82f6 |
| Backend | Green | #10b981 |
| Design | Purple | #8b5cf6 |
| High Priority | Red | #ef4444 |
| Bug Fix | Orange | #f97316 |
| Documentation | Gray | #6b7280 |
| Research | Teal | #14b8a6 |
| Testing | Yellow | #eab308 |

## Implementation Strategy

### Approach: Demo-Specific Components (Not Shared with /tasks)

After thorough analysis of the existing codebase, the recommended approach is to create demo-specific wrappers for the key layout components (sidebar, project view) rather than modifying existing components:

**Why:**
1. The existing `Sidebar` component has ~375 lines of mutation-heavy code (create workspace, add project, delete, quick-add modal). Injecting `isDemo` checks throughout would touch 10+ locations and increase complexity.
2. The existing `TaskCard` component has 3 mutation handlers (`handleToggle`, `handleDelete`, `setEditing`). These are more localized and easier to guard with a context check.
3. The existing layout.tsx is a server component that calls `getUserIdFromCookie()` -- cannot be shared with demo.

**Recommended split:**
- **New components (demo-specific):** `DemoLayout`, `DemoSidebar`, `DemoBanner`, `DemoProvider`, `DemoProjectView`, `DemoProjectPage`
- **Modified components (add demo guard):** `TaskCard` (guard toggle/edit/delete), `SubtaskList` (guard toggle/add/delete), `SectionHeader` (guard rename/delete), `BoardView` (uses TaskCard, gets demo guard transitively)
- **Unmodified components (display-only):** `Badge`, `HelpTip`, `Button`, `Input`, `Modal`, all UI primitives

The demo-specific sidebar can be much simpler (~100 lines) since it only renders navigation links and workspace/project names with no mutation UI. The demo project view receives data from context instead of server props.

### Entry Point

The homepage (`/`) currently redirects to `/tasks`. For demo access, there are two options:
1. Add a "Try Demo" button on the AuthGuard sign-in screen (when user is not authenticated)
2. Make `/demo` directly accessible via URL

Both should be implemented. The AuthGuard component already renders a sign-in screen for unauthenticated users -- add a "Try Demo" link below the sign-in button that navigates to `/demo`.

## Open Questions

1. **Should the demo include the Today and Completed views?**
   - What we know: The requirements mention "demo workspace with 30-60 tasks across 3-5 projects." Today/Completed are derived views that filter tasks by deadline/status.
   - What's unclear: Whether the demo sidebar should link to these pages or only to project views.
   - Recommendation: Include demo Today and Completed views as they showcase additional features with minimal extra work (filter the same seed data). The sidebar nav items (Today, Completed, Search, Filters & Tags) should link to demo equivalents.

2. **Should the demo be accessible from the personal-brand Apps Hub?**
   - What we know: Phase 34 added the todoist entry to the Apps Hub at `/apps`. The demo is a pre-payment onboarding tool.
   - What's unclear: Whether the Apps Hub should link to the demo or only to the auth-gated app.
   - Recommendation: The todoist app's own landing page (AuthGuard screen) should have the demo link. The Apps Hub entry links to the todoist app as-is. This keeps the demo scoped to the todoist repo.

3. **Exact task count and content?**
   - What we know: Requirements say "30-60 realistic tasks across 3-5 projects."
   - What's unclear: The exact number, names, and content of tasks.
   - Recommendation: Target ~40 tasks across 4 projects in 2 workspaces. This is enough to feel populated without being overwhelming to browse. The planner should specify exact content in the plan.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `/Users/dweinbeck/Documents/todoist/src/` -- all component files, types, actions, services, schemas, layout
- Existing pitfalls research at `.planning/research/PITFALLS-tasks-app.md` -- Pitfall 5 (demo contamination) and Pitfall 11 (demo UX) directly apply
- Phase requirements in `.planning/REQUIREMENTS.md` (DEMO-01 through DEMO-05)
- Phase details in `.planning/ROADMAP.md` (Phase 35 section)

### Secondary (MEDIUM confidence)
- React Context pattern for providing static data to component trees -- standard React 19 pattern, no external source needed
- Next.js App Router parallel route pattern -- standard Next.js routing, verified against current project structure

### Tertiary (LOW confidence)
- None. All findings are based on direct codebase analysis.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything already in the project
- Architecture: HIGH -- based on thorough analysis of every component that needs modification
- Demo data design: HIGH -- based on analysis of all existing types and feature coverage requirements
- Pitfalls: HIGH -- informed by prior pitfalls research (Pitfall 5, 11) and direct analysis of mutation patterns in components

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (stable -- no fast-moving dependencies)
