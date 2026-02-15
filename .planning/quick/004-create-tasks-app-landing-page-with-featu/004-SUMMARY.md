---
phase: quick-004
plan: 01
subsystem: ui
tags: [react, next.js, firebase-auth, landing-page, tailwind]

# Dependency graph
requires:
  - phase: none
    provides: existing AuthGuard pattern and Button/Card UI components
provides:
  - Auth-aware TasksLandingPage component with feature highlights for unauthenticated visitors
  - Thin server wrapper page.tsx for /apps/tasks route
affects: [tasks-app, landing-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [auth-aware landing page with useAuth hook replacing AuthGuard wrapper]

key-files:
  created:
    - src/components/apps/TasksLandingPage.tsx
  modified:
    - src/app/apps/tasks/page.tsx

key-decisions:
  - "Used inline auth (useAuth + signInWithPopup) instead of AuthGuard wrapper for full layout control"
  - "Used NEXT_PUBLIC_TASKS_APP_URL env var with hardcoded fallback for client component compatibility"

patterns-established:
  - "Auth-aware landing page: useAuth() hook with loading/unauth/auth branches instead of AuthGuard wrapper"

# Metrics
duration: 5min
completed: 2026-02-15
---

# Quick Task 004: Tasks App Landing Page Summary

**Auth-aware landing page with 4 feature cards, Try Demo CTA, and sign-in button replacing generic AuthGuard prompt**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-15T20:19:14Z
- **Completed:** 2026-02-15T20:24:58Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Unauthenticated visitors now see a feature highlights grid (Effort Scoring, Projects & Sections, Board & List Views, Weekly Credits) instead of "Sign in to access this page"
- "Try Demo" button links to external demo workspace at tasks.dan-weinbeck.com/demo
- "Sign in for Full Access" button triggers Google sign-in popup directly
- Authenticated users see the same Launch App experience as before
- Page.tsx reduced from 44 lines to 12 lines (thin server wrapper)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TasksLandingPage component** - `a42245c` (feat)
2. **Task 2: Update page.tsx to use TasksLandingPage** - `477b93c` (refactor)

## Files Created/Modified
- `src/components/apps/TasksLandingPage.tsx` - Auth-aware client component with feature grid, demo CTA, sign-in button (unauthenticated) and Launch App link (authenticated)
- `src/app/apps/tasks/page.tsx` - Thin server wrapper importing TasksLandingPage, metadata only

## Decisions Made
- Used `useAuth()` directly instead of wrapping with `AuthGuard` to allow full control over the unauthenticated layout
- Used `NEXT_PUBLIC_TASKS_APP_URL` env var (client-accessible) with hardcoded fallback to `https://tasks.dan-weinbeck.com`
- Used inline SVG icons (sun/gauge for effort, folder for projects, list for board views, calendar for credits) with `text-gold` color to match site accent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Landing page is live and ready for deployment
- Same pattern can be applied to other app pages that currently use bare AuthGuard

## Self-Check: PASSED

- All files exist (TasksLandingPage.tsx: 168 lines, page.tsx: 12 lines)
- All commits verified (a42245c, 477b93c)
- TasksLandingPage exported and imported correctly
- AuthGuard removed from page.tsx
- Lint and build pass with zero errors

---
*Quick Task: 004*
*Completed: 2026-02-15*
