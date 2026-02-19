# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Visitors can understand who Dan is and see proof of his work within 60 seconds
**Current focus:** Phase 48.1 — Tasks App Testing Feedback (Effort Scoring, Drag-and-Drop, UI Polish, Data Import)

## Current Position

Phase: 48.1 of 48.1 (Tasks App Testing Feedback)
Plan: 4 of 5 in current phase
Status: Executing Phase 48.1 -- Plan 04 complete
Last activity: 2026-02-19 — Completed 48.1-04 (Drag-and-Drop Between Sections)

## Performance Metrics

**Cumulative:**
- Total milestones shipped: 9 (v1.0 through v1.8)
- Total phases completed: 48
- Total plans completed: 129
- Timeline: Jan 18 -> Feb 18, 2026 (32 days)

**v1.8 Velocity:**
- Plans completed: 11
- Average duration: 4 min
- Total execution time: 46 min

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
- [v2.0]: Polyglot persistence (Firestore + PostgreSQL) — Tasks keeps Prisma/PostgreSQL, everything else stays Firestore
- [v2.0]: v1.9 phases 36-40 deferred to v2.1+ — Tasks integration takes priority
- [v2.0]: 6-phase structure: Foundation -> Server Code -> UI/Routing -> Landing Page -> Feature Parity -> Decommission
- [43-01]: Import PrismaClient from @/generated/prisma/client (Prisma 6 pattern, matches todoist app)
- [43-01]: Prisma singleton pattern: import { prisma } from '@/lib/prisma' for all server-side DB access
- [43-02]: Shared Cloud SQL instance chatbot-assistant and secret tasks-database-url between personal-brand and todoist
- [43-02]: DATABASE_URL validation: fail in production context, warn in local dev
- [43-03]: Temporary test endpoint /api/tasks-test with no auth (will be removed in Phase 44)
- [43-03]: All database queries strictly read-only to preserve existing data (DB-04)
- [44-02]: Tasks auth adapter delegates to shared Firebase Admin SDK singleton (no duplicate init)
- [44-02]: Tasks billing adapter calls checkTasksAccess() via direct import (no HTTP, no BILLING_API_URL)
- [44-02]: Graceful degradation: billing defaults to readwrite on auth/billing errors (matches todoist)
- [44-03]: Server actions copied verbatim from todoist; only import paths and revalidatePath prefix changed
- [44-03]: revalidatePath uses /apps/tasks prefix to match personal-brand routing structure
- [44-03]: Phase 43 test endpoint removed as planned
- [45-01]: Tasks UI primitives namespaced under src/components/tasks/ui/ to avoid conflicts with personal-brand UI
- [45-01]: AuthContext upgraded to onIdTokenChanged with __session cookie for SSR auth
- [45-01]: Biome noNonNullAssertion, noSvgWithoutTitle, noAutofocus downgraded to warn (todoist patterns)
- [45-02]: BILLING_URL fallback changed to /billing (internal route, no cross-origin)
- [45-02]: Tasks layout uses flex h-screen sidebar layout, NOT personal-brand Navbar/Footer
- [45-02]: External redirect page.tsx replaced with proper Tasks landing page
- [45-03]: Removed clientEnv import from apps.ts (no other listing used it after Tasks href change)
- [45-03]: Integrated apps use internal routes (/apps/slug) not external URLs in apps hub listings
- [46-01]: TasksKpiCard is a server component (not 'use client') receiving data via props from the page
- [46-01]: Inner task mini-cards use simple divs with bg-[#f5f0e8] instead of shared Card component
- [46-01]: Next tasks column shows exactly 2 slots with placeholder for missing tasks
- [46-02]: KPI functions query only top-level tasks (parentTaskId === null) to avoid counting subtasks
- [46-02]: Promise.all used to fetch all KPI data + workspaces in parallel for performance
- [46-02]: Unauthenticated users see title/subtitle only; KPI card conditionally rendered when kpiData exists
- [47-01]: Removed unnecessary unsafe cast for viewMode - Project type already includes viewMode from Prisma schema
- [47-02]: HelpTip uses createPortal to document.body to avoid overflow clipping in sidebar/cards
- [47-02]: Used <output> element instead of role=status div for Biome a11y compliance
- [47-02]: Help tips placed only in client components (hooks require client context)
- [47-03]: Route group (authenticated) separates auth-required routes from public demo route
- [47-03]: Demo uses purely client-side rendering with no server actions or database access
- [47-03]: Minimal root layout.tsx passes children through without auth check
- [47-04]: No code changes needed -- all 14 requirements verified passing via automated code inspection and human manual testing
- [48-02]: Tasks App row removed from CLAUDE.md Service Map with explanatory note added
- [48-02]: Service count updated from 4 to 3 in CONFIGURATION-RESILIENCE.md (6 URL configs instead of 12)
- [48.1-02]: Lazy useState initializer to avoid SSR/hydration mismatch with localStorage
- [48.1-02]: localStorage key 'tasks-free-trial-dismissed' for dismissal persistence
- [48.1-03]: Effort schema changed from Fibonacci-only union to z.number().int().positive()
- [48.1-03]: EFFORT_QUICK_PICKS constant for UI buttons, EFFORT_VALUES kept as backward-compatible alias
- [48.1-03]: Parent task effort is a manual budget (not auto-summed from subtasks)
- [48.1-04]: Native HTML5 Drag and Drop API for task section reordering (no external library)
- [48.1-04]: Semantic HTML (section, ul, li) for drag-and-drop containers and items

### Roadmap Evolution

- v1.9 marked as deferred (phases 36-40 never started; 40.1, 41, 41.1, 42 completed as standalone work)
- v2.0 Tasks App Integration roadmap created with phases 43-48
- Phase 48.1 inserted after Phase 48: Tasks App Testing Feedback — Effort Scoring, Drag-and-Drop, UI Polish & Data Import (URGENT)

### Pending Todos

None.

### Blockers/Concerns

- ~~Cloud SQL instance connection: personal-brand Cloud Run needs `--add-cloudsql-instances` for chatbot-assistant instance~~ RESOLVED in 43-02: Added to cloudbuild.yaml
- ~~Prisma + Next.js 16 compatibility: verify Prisma client generation works with current Next.js build~~ RESOLVED in 43-01: Prisma 6.19.2 generates and builds cleanly with Next.js 16

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 48.1-04-PLAN.md
Resume file: None

## Next Step

Continue Phase 48.1 with Plan 05 (last plan in phase).
