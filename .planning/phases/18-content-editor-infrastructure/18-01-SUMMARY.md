---
phase: 18-content-editor-infrastructure
plan: 01
subsystem: api
tags: [zod, firebase-auth, server-actions, mdx, content-management]

# Dependency graph
requires:
  - phase: 17-control-center-navigation
    provides: Control Center shell with /control-center/content route
provides:
  - Zod validation schemas for tutorial content (slug, metadata, body)
  - Shared verifyAdminToken function for Server Action auth
  - saveTutorial Server Action with 5-layer security pipeline
affects: [19-content-editor-form, 20-brand-scraper]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action with environment gating (dev-only)"
    - "Token-based admin auth for Server Actions (verifyAdminToken)"
    - "MDX file writing with JSON.stringify for safe serialization"
    - "Path traversal prevention via path.resolve + startsWith check"

key-files:
  created:
    - src/lib/schemas/content.ts
    - src/lib/actions/content.ts
  modified:
    - src/lib/auth/admin.ts

key-decisions:
  - "verifyAdminToken added alongside verifyAdmin (not refactored into) to avoid breaking existing API routes"
  - "JSON.stringify used for all MDX metadata values to handle special characters safely"
  - "Environment gate is first check (fail fast before any auth/IO work)"

patterns-established:
  - "Server Action security pipeline: env gate -> auth -> validation -> path safety -> collision -> write"
  - "Standalone token verifier for Server Actions that lack Request objects"

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 18 Plan 01: Content Editor Infrastructure Summary

**Zod validation schemas, shared admin token verifier, and saveTutorial Server Action with 5-layer security pipeline for MDX file writing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T03:59:50Z
- **Completed:** 2026-02-09T04:03:52Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Zod schemas for tutorial slug (format-validated), metadata (title, description, date, tags), and full save payload
- Shared `verifyAdminToken` function that Server Actions can call without a Request object
- `saveTutorial` Server Action with environment gating, Firebase auth, Zod validation, path traversal prevention, slug collision detection, and MDX file writing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tutorial content Zod schemas** - `6d5d6e4` (feat)
2. **Task 2: Extract verifyAdminToken from admin.ts** - `715c4f1` (feat)
3. **Task 3: Create saveTutorial Server Action** - `be98876` (feat)

## Files Created/Modified
- `src/lib/schemas/content.ts` - Zod schemas: tutorialSlugSchema, tutorialMetaSchema, saveTutorialSchema, SaveTutorialData type
- `src/lib/auth/admin.ts` - Added verifyAdminToken(idToken) -> Promise<boolean> for Server Action auth
- `src/lib/actions/content.ts` - saveTutorial Server Action with full validation pipeline and MDX file writing

## Decisions Made
- `verifyAdminToken` added as a standalone function alongside `verifyAdmin` rather than refactoring `verifyAdmin` to use it internally -- avoids any risk to existing API route auth
- Used `JSON.stringify()` for all metadata values in the MDX template to handle quotes, backslashes, and special characters safely
- Environment gate (`NODE_ENV !== "development"`) placed as the very first check to fail fast before any async auth work

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Build lock file conflict during Task 2 verification (stale `.next/lock` from prior build) -- cleared and rebuilt successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Content schema, auth, and save action are ready for the Content Editor form UI (Phase 19)
- The `saveTutorial` action accepts `(idToken, data)` and returns `SaveResult` -- the form component will need to pass the Firebase ID token from the client-side auth context
- All five security layers are in place and verified by build/lint

---
*Phase: 18-content-editor-infrastructure*
*Completed: 2026-02-09*
