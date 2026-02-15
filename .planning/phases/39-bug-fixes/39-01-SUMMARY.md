---
phase: 39-bug-fixes
plan: 01
subsystem: ui, auth
tags: [firebase-auth, getIdToken, swr, brand-scraper, url-validation]

# Dependency graph
requires:
  - phase: none
    provides: N/A
provides:
  - URL validity check on Scrape button disabled state
  - Fresh auth token pattern for all brand scraper API calls (polling and downloads)
affects: [brand-scraper]

# Tech tracking
tech-stack:
  added: []
  patterns: [getIdToken callback pattern for SWR-based polling hooks]

key-files:
  created: []
  modified:
    - src/components/tools/brand-scraper/UserBrandScraperPage.tsx
    - src/lib/brand-scraper/hooks.ts
    - src/components/tools/brand-scraper/BrandCard.tsx
    - src/components/tools/brand-scraper/BrandCardDownloads.tsx
    - src/components/admin/brand-scraper/BrandScraperPage.tsx

key-decisions:
  - "Used getIdToken callback pattern instead of static token state to ensure fresh auth on every API request"
  - "URL validation uses URL constructor with protocol check for http/https"

patterns-established:
  - "getIdToken callback: Pass () => Promise<string> to hooks/components instead of static token strings for long-lived authenticated sessions"

# Metrics
duration: 12min
completed: 2026-02-15
---

# Phase 39 Plan 01: Brand Scraper Bug Fixes Summary

**URL validity check on Scrape button and fresh Firebase ID token auth for job polling and asset downloads**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-15T23:41:47Z
- **Completed:** 2026-02-15T23:53:27Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Scrape button now disabled until a valid http/https URL is entered (BUG-01)
- All brand scraper API calls (job polling, asset downloads) use fresh auth tokens via getIdToken callback, eliminating "invalid or expired token" errors (BUG-02)
- Removed stale token state from UserBrandScraperPage and admin BrandScraperPage
- Updated useJobStatus hook signature from static token to getIdToken callback

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Scrape button disabled state to include URL validity check** - `eb9d4d6` (fix)
2. **Task 2: Replace static token with getIdToken callback for fresh auth on every request** - `ae44479` (fix)

## Files Created/Modified
- `src/components/tools/brand-scraper/UserBrandScraperPage.tsx` - Added isValidUrl derived state, getIdToken callback, removed token state
- `src/lib/brand-scraper/hooks.ts` - Changed useJobStatus to accept getIdToken callback instead of static token
- `src/components/tools/brand-scraper/BrandCard.tsx` - Changed token prop to getIdToken
- `src/components/tools/brand-scraper/BrandCardDownloads.tsx` - Changed token prop to getIdToken, fetch fresh token before download
- `src/components/admin/brand-scraper/BrandScraperPage.tsx` - Removed token state, added getIdToken via useMemo

## Decisions Made
- Used `getIdToken` callback pattern instead of static token state -- ensures every API request gets a fresh Firebase ID token, preventing expiry during long polling sessions
- URL validation uses `new URL()` constructor with explicit protocol check for `http:` and `https:` -- provides robust validation without regex

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Next.js build fails intermittently with `ENOENT: _buildManifest.js.tmp` error (Turbopack race condition) -- pre-existing environment issue, not caused by code changes
- TypeScript check shows pre-existing errors in research-assistant test files -- unrelated to brand-scraper changes
- Admin BrandScraperPage.tsx was already partially updated (token state already removed) when read -- linter/auto-formatter had applied consistent changes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Brand scraper URL validation and auth token refresh bugs fixed
- Ready for 39-02 plan execution

## Self-Check: PASSED

- All 5 modified files exist on disk
- Commit eb9d4d6 (Task 1) confirmed in git log
- Commit ae44479 (Task 2) confirmed in git log
- Lint passes (249 files, 0 errors)
- No brand-scraper TypeScript errors (pre-existing errors only in unrelated research-assistant tests)

---
*Phase: 39-bug-fixes*
*Completed: 2026-02-15*
