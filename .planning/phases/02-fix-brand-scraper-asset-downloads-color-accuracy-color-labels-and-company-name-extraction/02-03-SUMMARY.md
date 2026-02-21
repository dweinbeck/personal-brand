---
phase: 02-fix-brand-scraper-asset-downloads-color-accuracy-color-labels-and-company-name-extraction
plan: 03
subsystem: ui
tags: [brand-scraper, zod, react, display-name, hostname-formatting]

# Dependency graph
requires: []
provides:
  - Extended identity schema with optional company_name and site_name fields
  - getBrandDisplayName utility with fallback chain (company_name > site_name > formatted hostname)
  - Brand cards and profile cards show company names instead of raw hostnames
affects: [brand-scraper-backend, brand-scraper-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [display-name-fallback-chain]

key-files:
  created:
    - src/lib/brand-scraper/display-name.ts
  modified:
    - src/lib/brand-scraper/types.ts
    - src/components/tools/brand-scraper/BrandCard.tsx
    - src/components/tools/brand-scraper/BrandCardHeader.tsx
    - src/components/tools/brand-scraper/BrandProfileCard.tsx

key-decisions:
  - "Short hostname parts (<=3 chars like 3m, ibm) are not title-cased to avoid incorrect capitalization from URL-derived lowercase"
  - "Non-standard TLDs like transparent.partners keep all domain parts as they form the brand identity"
  - "Removed unused getHostname helper from BrandProfileCard after displayName replaced all hostname usage"

patterns-established:
  - "Display name fallback chain: company_name > site_name > formatted hostname"

requirements-completed: [COMPANY-NAME]

# Metrics
duration: 9min
completed: 2026-02-21
---

# Phase 02 Plan 03: Company Name Display Summary

**Brand cards show company names via fallback chain (company_name > site_name > title-cased hostname) with extended identity schema ready for scraper data**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-21T20:16:14Z
- **Completed:** 2026-02-21T20:25:38Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extended brandTaxonomySchema identity with optional company_name and site_name fields
- Created getBrandDisplayName utility with intelligent hostname formatting (strips TLDs, title-cases, handles edge cases)
- Updated BrandCard, BrandCardHeader, and BrandProfileCard to show display names instead of raw hostnames
- Cleaned up unused getHostname helper from BrandProfileCard

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend taxonomy schema and create display name utility** - `301f16d` (feat)
2. **Task 2: Update BrandCard, BrandCardHeader, and BrandProfileCard to show company name** - `9b197d8` (feat)

## Files Created/Modified
- `src/lib/brand-scraper/display-name.ts` - New utility: getBrandDisplayName with fallback chain and hostname formatting
- `src/lib/brand-scraper/types.ts` - Added company_name and site_name optional fields to identity schema
- `src/components/tools/brand-scraper/BrandCard.tsx` - Computes and passes displayName to header
- `src/components/tools/brand-scraper/BrandCardHeader.tsx` - Accepts displayName prop, falls back to hostname
- `src/components/tools/brand-scraper/BrandProfileCard.tsx` - Uses displayName for title, logo alt text, and fallback letter

## Decisions Made
- Short hostname parts (<=3 chars like "3m", "ibm") are not title-cased to avoid incorrect capitalization from URL-derived lowercase
- Non-standard TLDs like "transparent.partners" keep all domain parts since they form the brand identity
- Removed unused getHostname helper from BrandProfileCard as displayName replaced all hostname usage

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused hostname variable and getHostname function**
- **Found during:** Task 2 (Update components)
- **Issue:** After replacing hostname display with displayName, the hostname variable and getHostname helper became unused, causing a lint error
- **Fix:** Removed both the unused variable and the helper function
- **Files modified:** src/components/tools/brand-scraper/BrandProfileCard.tsx
- **Verification:** Lint passes with no errors in modified files
- **Committed in:** 9b197d8 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug/cleanup)
**Impact on plan:** Minor cleanup, no scope creep. The unused code was a natural consequence of replacing hostname with displayName.

## Issues Encountered
- Transient Next.js Turbopack build ENOENT error on temp files (resolved by cleaning .next cache directory)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema is ready to accept company_name data from the scraper when the backend is updated
- Even without backend changes, the cleaned hostname formatting provides an immediate UX improvement
- All existing brands without company_name data continue to render correctly with improved formatting

## Self-Check: PASSED

- All 5 files verified present on disk
- Commit 301f16d verified in git log
- Commit 9b197d8 verified in git log

---
*Phase: 02-fix-brand-scraper-asset-downloads-color-accuracy-color-labels-and-company-name-extraction*
*Completed: 2026-02-21*
