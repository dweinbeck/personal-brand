---
phase: 48-decommission
plan: 02
subsystem: infra
tags: [env-vars, decommission, cleanup, documentation]

# Dependency graph
requires:
  - phase: 48-01
    provides: "Firebase hosting redirect and .env.local cleanup for Tasks external service"
provides:
  - "Clean codebase with zero references to NEXT_PUBLIC_TASKS_APP_URL"
  - "TasksLandingPage using internal /apps/tasks routes exclusively"
  - "Updated documentation reflecting integrated Tasks architecture"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Internal routing for integrated apps (no external URL env vars)"

key-files:
  created: []
  modified:
    - src/lib/env.ts
    - src/lib/__tests__/env.test.ts
    - scripts/validate-env.ts
    - src/components/apps/TasksLandingPage.tsx
    - docs/SERVICE-REGISTRY.md
    - docs/CONFIGURATION-RESILIENCE.md
    - CLAUDE.md

key-decisions:
  - "Tasks App row removed from CLAUDE.md Service Map with explanatory note added"
  - "Service count updated from 4 to 3 in CONFIGURATION-RESILIENCE.md (6 URL configs instead of 12)"

patterns-established:
  - "Integrated apps use internal Next.js routes, not external URLs via env vars"

requirements-completed: [DC-04, DC-05]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 48 Plan 02: Tasks External URL Cleanup Summary

**Removed all NEXT_PUBLIC_TASKS_APP_URL references and external tasks.dan-weinbeck.com URLs from env schema, components, and documentation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T04:32:18Z
- **Completed:** 2026-02-19T04:36:08Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Removed NEXT_PUBLIC_TASKS_APP_URL from Zod client env schema, validation script, and 2 related tests
- Updated TasksLandingPage to use internal /apps/tasks and /apps/tasks/demo routes instead of external URLs
- Updated SERVICE-REGISTRY.md architecture diagram, CONFIGURATION-RESILIENCE.md service count, and CLAUDE.md Service Map

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove NEXT_PUBLIC_TASKS_APP_URL from env schema, validation, and tests** - `cf49c91` (chore)
2. **Task 2: Update TasksLandingPage to use internal routes** - `e08cce4` (refactor)
3. **Task 3: Update documentation to remove Tasks external service references** - `0cc1423` (docs)

## Files Created/Modified
- `src/lib/env.ts` - Removed NEXT_PUBLIC_TASKS_APP_URL from clientEnvSchema and clientEnv() parse input
- `src/lib/__tests__/env.test.ts` - Removed 2 tests for NEXT_PUBLIC_TASKS_APP_URL (accepts optional, rejects invalid)
- `scripts/validate-env.ts` - Removed NEXT_PUBLIC_TASKS_APP_URL from clientInput object
- `src/components/apps/TasksLandingPage.tsx` - Removed clientEnv import, TASKS_URL constant; uses /apps/tasks routes
- `docs/SERVICE-REGISTRY.md` - Removed Tasks URL row; updated architecture diagram to show Tasks as internal
- `docs/CONFIGURATION-RESILIENCE.md` - Updated from 4 services/12 configs to 3 services/6 configs; removed Tasks column
- `CLAUDE.md` - Removed Tasks App row from Service Map; added note about internal integration

## Decisions Made
- Added an explanatory note in CLAUDE.md Service Map that Tasks is integrated internally at /apps/tasks rather than just deleting the row silently
- Updated CONFIGURATION-RESILIENCE.md service counts to accurately reflect the reduced URL configuration surface

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 48 (Decommission) is complete -- all external Tasks references removed
- The standalone todoist app can be retired; personal-brand is fully self-contained for Tasks
- All quality gates pass (build, tests 211/211, lint warnings are pre-existing in unmodified files)

---
*Phase: 48-decommission*
*Completed: 2026-02-19*
