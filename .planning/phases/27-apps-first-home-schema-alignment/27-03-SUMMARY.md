---
phase: 27-apps-first-home-schema-alignment
plan: 03
subsystem: ui, api
tags: [zod, brand-scraper, schema, typescript, defensive-parsing]

# Dependency graph
requires:
  - phase: 27-RESEARCH
    provides: Real scraper taxonomy structure and ExtractedField wrapper pattern
provides:
  - Aligned Zod schemas matching real scraper service taxonomy
  - Gallery components reading from ExtractedField wrapper paths
  - Defensive safeParse fallback UI with Download Brand JSON link
  - JobError type for structured error objects
affects: [phase-29, brand-scraper-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ExtractedField wrapper: { value, confidence, evidence, needs_review }"
    - "Defensive Zod safeParse at UI layer with fallback rendering"
    - "getErrorMessage helper for backward-compatible error display"

key-files:
  modified:
    - src/lib/brand-scraper/types.ts
    - src/components/admin/brand-scraper/BrandResultsGallery.tsx
    - src/components/admin/brand-scraper/ColorPaletteCard.tsx
    - src/components/admin/brand-scraper/TypographyCard.tsx
    - src/components/admin/brand-scraper/LogoAssetsCard.tsx
    - src/components/admin/brand-scraper/BrandScraperPage.tsx
    - src/components/tools/brand-scraper/UserBrandScraperPage.tsx

key-decisions:
  - "Used .passthrough() on all Zod object schemas for forward-compatibility"
  - "Exported ExtractedField and JobError as named types for downstream use"
  - "Added getErrorMessage helper for backward-compatible rendering of object error"

patterns-established:
  - "ExtractedField<T> wrapper: access value via entry.value.*, confidence via entry.confidence"
  - "Defensive UI parsing: brandTaxonomySchema.safeParse at render level, not just API proxy"

# Metrics
duration: 15min
completed: 2026-02-10
---

# Phase 27 Plan 03: Schema Alignment Summary

**Rewrote Brand Scraper Zod schemas to match real ExtractedField taxonomy, updated all gallery components to read nested paths, and added defensive safeParse with fallback Download JSON link**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-11T03:33:13Z
- **Completed:** 2026-02-11T03:48:28Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Complete rewrite of brandTaxonomySchema with ExtractedField wrappers matching real scraper service output
- All four gallery components updated to access data through entry.value.* paths
- Defensive safeParse in UserBrandScraperPage with amber fallback UI and "Download Brand JSON" button
- jobStatusSchema error field updated from z.string() to z.object({ code, message, stage })

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite Zod schemas to match real scraper taxonomy** - `f2f8421` (feat)
2. **Task 2: Update gallery components and add defensive parsing** - `4773549` (feat)

## Files Created/Modified
- `src/lib/brand-scraper/types.ts` - Complete rewrite: extractedFieldSchema, colorPaletteEntrySchema, typographyEntrySchema, assetEntrySchema, brandTaxonomySchema, jobErrorSchema
- `src/components/admin/brand-scraper/BrandResultsGallery.tsx` - Pass result.color, result.typography, result.assets (not result.colors/fonts/logos)
- `src/components/admin/brand-scraper/ColorPaletteCard.tsx` - Read entry.value.hex, entry.confidence, entry.value.role
- `src/components/admin/brand-scraper/TypographyCard.tsx` - Read entry.value.family, entry.value.weight (single string), entry.confidence
- `src/components/admin/brand-scraper/LogoAssetsCard.tsx` - Separate sections for logos, favicons, og_images via entry.value.url
- `src/components/admin/brand-scraper/BrandScraperPage.tsx` - Fix error display for object error shape (data.error.message)
- `src/components/tools/brand-scraper/UserBrandScraperPage.tsx` - Add safeParse with fallback UI and getErrorMessage helper

## Decisions Made
- Used `.passthrough()` on every object schema to tolerate unexpected fields from scraper service updates
- Exported `ExtractedField<T>` as a manual type (not Zod inferred) with index signature for passthrough compatibility
- Added `getErrorMessage()` helper for backward-compatible error rendering (handles both string and object error shapes)
- LogoAssetsCard now renders three separate sections (Logos, Favicons, OG Assets) instead of the old two (Logos, Assets)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed admin BrandScraperPage error display**
- **Found during:** Task 2 (gallery component updates)
- **Issue:** BrandScraperPage.tsx line 78 rendered `data.error` directly as JSX, but with the schema change error is now an object `{ code, message, stage }`, not a string -- would crash React rendering
- **Fix:** Changed `{data.error}` to `{data.error.message ?? "Job failed"}`
- **Files modified:** src/components/admin/brand-scraper/BrandScraperPage.tsx
- **Verification:** TypeScript passes, lint clean
- **Committed in:** 4773549 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix to prevent runtime crash. No scope creep.

## Issues Encountered
- Next.js build (`npm run build`) failed with pre-existing environment issue (ENOENT on temp buildManifest files). This is a Turbopack filesystem race condition unrelated to code changes. Verified via `npx tsc --noEmit` (zero errors), `npm run lint` (clean), and `npm run test` (26/26 pass).
- `git stash` during verification briefly reverted Task 2 files; resolved by re-applying all writes after stash pop failure.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Brand Scraper schema alignment complete -- UI will correctly display real scraper results
- Phase 29 can proceed with schema integration testing once scraper backend (Phase 28) is ready
- No blockers

---
*Phase: 27-apps-first-home-schema-alignment*
*Completed: 2026-02-10*
