---
phase: 39-bug-fixes
plan: 02
subsystem: api, database
tags: [firestore, composite-index, error-handling, fastapi, research-assistant, ai-assistant]

# Dependency graph
requires:
  - phase: 39-01
    provides: "Brand scraper bug fixes and getIdToken callback pattern"
provides:
  - "Firestore composite indexes for research_conversations and scrape_history"
  - "Actionable error messages for AI assistant and research assistant failures"
  - "Graceful Firestore index error handling in conversations endpoint"
affects: [chatbot-assistant, brand-scraper-api]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Extract structured error details from external API response bodies"
    - "Detect Firestore FAILED_PRECONDITION index errors and return 503 with user-friendly message"

key-files:
  created: []
  modified:
    - firestore.indexes.json
    - src/app/api/assistant/chat/route.ts
    - src/lib/assistant/fastapi-client.ts
    - src/app/api/tools/research-assistant/conversations/route.ts
    - src/components/admin/brand-scraper/BrandScraperPage.tsx
    - src/lib/brand-scraper/hooks.ts

key-decisions:
  - "Map FastAPI 500 errors to knowledge-base re-sync message to surface BUG-03 root cause"
  - "Return 503 for Firestore index errors to signal temporary unavailability"
  - "Extract error detail/error/message fields from FastAPI JSON response body"

patterns-established:
  - "Firestore composite index pattern: define indexes in firestore.indexes.json for compound queries"
  - "External API error extraction: try parsing JSON body before falling back to status code message"

# Metrics
duration: 12min
completed: 2026-02-15
---

# Phase 39 Plan 02: External Service Error Handling Summary

**Firestore composite indexes for research conversations and scrape history, plus actionable error messages for AI assistant and research assistant failures**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-15T23:41:54Z
- **Completed:** 2026-02-15T23:54:04Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Added 2 missing Firestore composite indexes: research_conversations (userId+status+updatedAt) and scrape_history (uid+createdAt)
- Improved FastAPI client to extract specific error details from response body instead of generic status codes
- Added 500 error mapping to knowledge-base re-sync message in AI assistant chat route
- Added try/catch with Firestore index error detection in research assistant conversations endpoint

## Task Commits

Each task was committed atomically:

1. **Task 1: Add missing Firestore composite indexes** - `cc55f25` (fix)
2. **Task 2: Improve error handling with actionable messages** - `ae44479` (fix)

## Files Created/Modified
- `firestore.indexes.json` - Added composite indexes for research_conversations and scrape_history collections
- `src/lib/assistant/fastapi-client.ts` - Extract error details from FastAPI response body (detail/error/message fields)
- `src/app/api/assistant/chat/route.ts` - Map 500 errors to knowledge-base re-sync message, pass through error.message for other codes
- `src/app/api/tools/research-assistant/conversations/route.ts` - Try/catch with Firestore FAILED_PRECONDITION detection, returns 503 with helpful message
- `src/components/admin/brand-scraper/BrandScraperPage.tsx` - Fixed type mismatch: pass getIdToken callback instead of static token
- `src/lib/brand-scraper/hooks.ts` - Fixed non-null assertion lint warning with optional chaining
- `src/components/tools/brand-scraper/BrandCard.tsx` - Updated to accept getIdToken callback prop
- `src/components/tools/brand-scraper/BrandCardDownloads.tsx` - Fetch fresh token via getIdToken before downloads
- `src/components/tools/brand-scraper/UserBrandScraperPage.tsx` - Replaced token state with getIdToken callback pattern

## Decisions Made
- Map FastAPI 500 errors to "knowledge base needs to be re-synced" message to surface BUG-03 root cause to users
- Return 503 (not 500) for Firestore index errors to signal temporary unavailability
- Extract error detail from FastAPI response body by checking `detail`, `error`, and `message` fields in order

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed BrandScraperPage type mismatch with useJobStatus hook**
- **Found during:** Task 2 (build verification)
- **Issue:** BrandScraperPage passed `token: string | null` to useJobStatus which expects `getIdToken: (() => Promise<string>) | null`
- **Fix:** Replaced token state with useMemo-wrapped getIdToken callback from user.getIdToken()
- **Files modified:** src/components/admin/brand-scraper/BrandScraperPage.tsx
- **Verification:** npm run build passes with zero TypeScript errors
- **Committed in:** ae44479 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed non-null assertion lint error in useJobStatus hook**
- **Found during:** Task 2 (lint verification)
- **Issue:** `getIdToken!()` uses forbidden non-null assertion; Biome flags as error
- **Fix:** Changed to optional chaining `getIdToken?.()`
- **Files modified:** src/lib/brand-scraper/hooks.ts
- **Verification:** npm run lint passes with zero errors
- **Committed in:** ae44479 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for build/lint to pass. No scope creep.

## Issues Encountered
- Next.js Turbopack build had intermittent ChunkLoadError failures with missing SSR chunk files. Resolved by cleaning .next cache directory and rebuilding. TypeScript compilation passed consistently; the issue was in static page generation phase.
- Firebase Admin SDK credential warnings during build (placeholder FIREBASE_PRIVATE_KEY) -- expected in dev environment, not a code issue.

## External Follow-ups Required

These items require action outside this codebase:

| Bug | Action | Details |
|-----|--------|---------|
| BUG-03 | EXTERNAL | chatbot-assistant repo needs knowledge base re-sync (run indexing pipeline) |
| BUG-04 | EXTERNAL | Verify OPENAI_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY are set in Cloud Run environment |
| BUG-05 | DEPLOY | Run `firebase deploy --only firestore:indexes` to create the new composite indexes |

## User Setup Required

None for this codebase. External service follow-ups documented in table above.

## Next Phase Readiness
- All error handling improvements are deployed in code
- Firestore indexes ready for deployment via `firebase deploy --only firestore:indexes`
- Phase 39 (Bug Fixes) is complete once external follow-ups are addressed

## Self-Check: PASSED

- All 6 key files verified to exist on disk
- Commit cc55f25 (Task 1) verified in git log
- Commit ae44479 (Task 2) verified in git log
- firestore.indexes.json contains 5 indexes (verified)
- Lint passes (zero errors)
- Build TypeScript compilation passes (zero errors)

---
*Phase: 39-bug-fixes*
*Completed: 2026-02-15*
