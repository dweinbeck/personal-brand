# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Visitors can understand who Dan is and see proof of his work within 60 seconds
**Current focus:** v2.0 — Tasks App Integration (Phase 47)

## Current Position

Phase: 47 of 48 (Feature Parity & Demo Mode)
Plan: 2 of 4 in current phase
Status: Plan 47-02 Complete
Last activity: 2026-02-19 — Plan 47-02 complete (Smart Views & Help Tips)

## Performance Metrics

**Cumulative:**
- Total milestones shipped: 9 (v1.0 through v1.8)
- Total phases completed: 42 (including v1.9 partial)
- Total plans completed: 120
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

### Roadmap Evolution

- v1.9 marked as deferred (phases 36-40 never started; 40.1, 41, 41.1, 42 completed as standalone work)
- v2.0 Tasks App Integration roadmap created with phases 43-48

### Pending Todos

None.

### Blockers/Concerns

- ~~Cloud SQL instance connection: personal-brand Cloud Run needs `--add-cloudsql-instances` for chatbot-assistant instance~~ RESOLVED in 43-02: Added to cloudbuild.yaml
- ~~Prisma + Next.js 16 compatibility: verify Prisma client generation works with current Next.js build~~ RESOLVED in 43-01: Prisma 6.19.2 generates and builds cleanly with Next.js 16

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 47-02-PLAN.md (Smart Views & Help Tips)
Resume file: None

## Next Step

Continue Phase 47: Plan 47-03 next.
