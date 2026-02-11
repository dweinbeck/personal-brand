---
phase: 28-scraper-service-backend
plan: 03
subsystem: api
tags: [gcs, assets, buffer, manifest, download, upload]

# Dependency graph
requires:
  - phase: 28-01
    provides: "Foundation types (AssetManifestEntry, AssetsManifest), DB columns (gcsAssetsPrefix, assetsManifest), uploadAsset GCS helper"
provides:
  - "downloadAssetToBuffer function for in-memory asset download with validation"
  - "Individual asset GCS upload flow in handler (no zip)"
  - "Assets manifest built and persisted to DB"
  - "asset_saved/asset_failed progress events emitted"
affects: ["28-04 (on-demand zip endpoint reads manifest)", "29 (frontend asset display uses manifest)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Buffer-based asset download (no temp dir, no disk I/O)"
    - "Individual GCS object upload per asset at jobs/{jobId}/assets/{category}/{filename}"
    - "AssetsManifest JSONB column with per-asset metadata"

key-files:
  created: []
  modified:
    - "src/pipeline/package/downloader.ts"
    - "src/worker/handler.ts"

key-decisions:
  - "Assets downloaded to buffer (not disk) then uploaded individually to GCS"
  - "No automatic zip creation on job completion (zip is on-demand via Plan 04)"
  - "Manifest persisted to DB only when at least one asset uploaded successfully"
  - "Plan 02 event emitter changes included in handler commit (parallel wave merge)"

patterns-established:
  - "downloadAssetToBuffer: returns AssetBufferResult with buffer/category/filename for GCS upload"
  - "Asset upload loop: download -> validate -> upload -> manifest entry -> event"
  - "assetsPrefix convention: jobs/{jobId}/assets/"

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 28 Plan 03: Individual Asset Uploads Summary

**Buffer-based asset download with per-asset GCS upload, manifest persistence, and progress events**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T03:57:20Z
- **Completed:** 2026-02-11T04:00:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- New `downloadAssetToBuffer` function downloads assets to in-memory buffer with full validation pipeline (content-type, size limit, magic bytes, extension correction)
- Handler GCS section replaced: each asset uploaded individually to `jobs/{jobId}/assets/{category}/{filename}` via `uploadAsset`
- Assets manifest (AssetManifestEntry[]) built during upload loop and persisted to `assetsManifest` DB column
- Progress events `asset_saved`/`asset_failed` emitted for each asset via `onEvent`
- Old temp-dir + archiver zip flow completely removed from handler

## Task Commits

Each task was committed atomically:

1. **Task 1: Add downloadAssetToBuffer function to downloader** - `7ddc00d` (feat)
2. **Task 2: Refactor handler GCS section to upload assets individually and build manifest** - `4abcff7` (feat)

## Files Created/Modified
- `src/pipeline/package/downloader.ts` - Added `AssetBufferResult` type, `downloadAssetToBuffer` function, `downloadDataUrlToBuffer` helper
- `src/worker/handler.ts` - Replaced zip flow with individual asset uploads, removed `createInMemoryZip`/temp-dir imports, added manifest persistence

## Decisions Made
- Assets downloaded to buffer instead of temp directory (eliminates disk I/O and cleanup)
- Manifest only persisted when at least one asset uploads successfully (avoids empty manifests)
- `assetsZipSignedUrl` kept as null in webhook payload for backward compatibility
- Plan 02 event emitter changes (already on disk from parallel execution) included in Task 2 commit

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Plan 02 (parallel wave) had already modified handler.ts on disk (unstaged). Stashed then restored those changes to commit Task 1 cleanly, then included Plan 02 changes in Task 2 commit. No conflicts.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Individual assets are now stored in GCS with manifest in DB
- Plan 04 (on-demand zip endpoint) can read manifest to create zips
- Frontend (Phase 29) can read manifest for individual asset previews
- `brand_json_url` still works via signed URL (no regression)

---
*Phase: 28-scraper-service-backend*
*Completed: 2026-02-11*
