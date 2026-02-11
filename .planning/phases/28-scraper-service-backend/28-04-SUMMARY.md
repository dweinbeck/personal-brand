---
phase: 28-scraper-service-backend
plan: 04
subsystem: api
tags: [fastify, gcs, signed-url, zip, assets-manifest, progress-events]

# Dependency graph
requires:
  - phase: 28-02
    provides: "Progress events persisted in pipeline_meta.events JSONB"
  - phase: 28-03
    provides: "Individual asset GCS uploads, assetsManifest JSONB column, createOnDemandZip helper"
provides:
  - "Enriched GET /jobs/:id response with events array and assets manifest with signed URLs"
  - "POST /jobs/:id/assets/zip endpoint for on-demand zip creation with caching"
  - "ZIP_CREATION_FAILED error code"
affects: ["29 (frontend consumes enriched job response)", "30 (integration tests against full API)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-asset signed URL generation via Promise.all for parallel performance"
    - "Zip caching: return fresh signed URL for existing zip without recreating"
    - "Snake_case API response fields mapped from camelCase DB columns"

key-files:
  created:
    - "src/api/routes/zip.ts"
  modified:
    - "src/api/routes/jobs.ts"
    - "src/api/server.ts"
    - "src/shared/errors.ts"

key-decisions:
  - "Assets manifest response uses snake_case field names (API convention) mapped from camelCase DB columns"
  - "Individual signed URL failures in manifest are non-fatal (asset returned without signed_url)"
  - "Zip caching: if gcsAssetsZipUri exists, return fresh signed URL; if GCS object deleted, fall through to recreate"
  - "409 Conflict for zip requests on non-terminal jobs or jobs with no assets"

patterns-established:
  - "AssetsManifestResponseSchema: snake_case API response with optional signed_url per asset"
  - "Zip endpoint: POST for creation (side-effect), cached boolean in response for transparency"
  - "ProgressEventSchema: typed event enum matching DB ProgressEvent type"

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 28 Plan 04: Enriched Job Response and On-Demand Zip Summary

**Enriched GET /jobs/:id with progress events and per-asset signed URLs, plus POST /jobs/:id/assets/zip for on-demand zip creation with caching**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-11T04:03:11Z
- **Completed:** 2026-02-11T04:07:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- GET /jobs/:id now returns `pipeline_meta.events` array with all pipeline progress events
- GET /jobs/:id now returns `assets_manifest` with per-asset metadata and signed URLs (generated in parallel via Promise.all)
- POST /jobs/:id/assets/zip creates zips on-demand from individual GCS assets, caches zip URI in DB, returns signed download URL
- Existing zip requests return fresh signed URL without recreating (cached: true)
- `brand_json_url` and `assets_zip_url` preserved in response (no regression)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend GET /jobs/:id with events and assets manifest with signed URLs** - `19b9da7` (feat)
2. **Task 2: Create POST /jobs/:id/assets/zip endpoint and register it** - `9b23210` (feat)

## Files Created/Modified
- `src/api/routes/jobs.ts` - Added ProgressEventSchema, AssetManifestEntrySchema, AssetsManifestResponseSchema; enriched response with events and manifest with signed URLs
- `src/api/routes/zip.ts` - New POST /jobs/:id/assets/zip endpoint with zip creation, caching, and signed URL generation
- `src/api/server.ts` - Registered zipRoutes
- `src/shared/errors.ts` - Added ZIP_CREATION_FAILED error code
- `src/worker/handler.ts` - Lint auto-fix (let -> const for unused reassignment)
- `src/pipeline/package/downloader.ts` - Lint auto-fix (line length formatting)

## Decisions Made
- Assets manifest API response uses snake_case (original_url, content_type, size_bytes, gcs_object_path) mapped from camelCase DB columns (originalUrl, contentType, sizeBytes, gcsObjectPath)
- Individual asset signed URL failures are non-fatal -- the asset entry is returned without a signed_url field rather than failing the entire request
- Zip caching strategy: if gcsAssetsZipUri exists in DB, attempt to generate fresh signed URL; if the GCS object was deleted (signed URL generation fails), fall through to recreate the zip
- 409 Conflict returned for zip requests on jobs that are not succeeded/partial, or jobs with no assets in manifest

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing lint errors in handler.ts and downloader.ts**
- **Found during:** Task 2 (lint verification gate)
- **Issue:** Pre-existing formatting issues and a let-vs-const lint error blocked the lint gate
- **Fix:** Ran `biome check --write` on affected files
- **Files modified:** src/worker/handler.ts, src/pipeline/package/downloader.ts
- **Verification:** `npm run lint` passes cleanly
- **Committed in:** 9b23210 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Lint fix was necessary to pass quality gates. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 28 success criteria are now met:
  - PROG-01/PROG-02: Progress events emitted and persisted (Plans 01+02)
  - ASST-01/ASST-02: Individual asset uploads with manifest (Plans 01+03)
  - SAPI-02: DB schema extended (Plan 01)
  - ASST-04: On-demand zip endpoint (Plan 04)
  - SAPI-01/PROG-03: Enriched GET /jobs/:id (Plan 04)
  - SAPI-03: brand_json_url still works (Plan 04)
- Phase 29 can now consume the full enriched API response
- Phase 30 can run integration tests against all endpoints

---
*Phase: 28-scraper-service-backend*
*Completed: 2026-02-11*
