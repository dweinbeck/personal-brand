---
phase: 02-capture-api-storage-foundation
plan: 03
subsystem: api, storage
tags: [multipart, formdata, cloud-storage, screenshot, iphone-shortcuts]

# Dependency graph
requires:
  - phase: 02-01
    provides: verifyApiKey auth middleware, uploadScreenshot storage utility, saveCapture Firestore persistence, screenshotCaptureSchema
provides:
  - POST /api/gsd/capture/screenshot endpoint for iPhone Share Sheet screenshot ingest
  - 10MB body size limit in next.config.ts for multipart uploads
affects: [03-routing-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [multipart-formdata-handling, case-insensitive-field-lookup, file-validation-pipeline]

key-files:
  created:
    - src/app/api/gsd/capture/screenshot/route.ts
    - src/lib/gsd/__tests__/screenshot-route.test.ts
  modified:
    - next.config.ts

key-decisions:
  - "Case-insensitive form field lookup (screenshot/Screenshot) for iPhone Shortcuts compatibility"
  - "HEIC and WebP accepted as valid image types alongside PNG/JPEG"
  - "Context validation failure is non-blocking -- screenshot is the important payload"

patterns-established:
  - "multipart-upload: FormData parsing with file type/size validation before Cloud Storage upload"
  - "case-insensitive-fields: check both lowercase and capitalized form field names for Shortcuts"

requirements-completed: [CAP-SCREEN, CAP-ASYNC]

# Metrics
duration: 4min
completed: 2026-02-20
---

# Phase 2 Plan 3: Screenshot Capture Endpoint Summary

**Screenshot capture POST endpoint with multipart FormData handling, file validation (PNG/JPEG/HEIC/WebP, 10MB max), Cloud Storage upload, and 10MB body size limit in next.config.ts**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-20T17:06:19Z
- **Completed:** 2026-02-20T17:09:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added experimental.serverActions.bodySizeLimit: "10mb" to next.config.ts for multipart screenshot uploads
- Screenshot capture endpoint at POST /api/gsd/capture/screenshot with full validation pipeline
- 9 unit tests covering auth, file validation (size, type, presence), storage failure, and Firestore failure paths
- Case-insensitive form field lookup for iPhone Shortcuts compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Add body size limit to next.config.ts** - `8689b2d` (chore)
2. **Task 2: Create screenshot capture route handler with tests** - `f1f9a78` (feat)

## Files Created/Modified
- `next.config.ts` - Added experimental.serverActions.bodySizeLimit: "10mb"
- `src/app/api/gsd/capture/screenshot/route.ts` - Screenshot capture POST endpoint with multipart FormData handling
- `src/lib/gsd/__tests__/screenshot-route.test.ts` - 9 unit tests for screenshot route

## Decisions Made
- Case-insensitive form field lookup (`screenshot` and `Screenshot`) for iPhone Shortcuts compatibility
- HEIC and WebP accepted as valid image types alongside PNG/JPEG (iPhone natively sends HEIC)
- Context validation failure is non-blocking -- the screenshot is the primary payload
- File buffered to Buffer via `file.arrayBuffer()` -- acceptable for <10MB files

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Endpoint uses existing GSD_API_KEY and FIREBASE_STORAGE_BUCKET env vars from Plan 01.

## Next Phase Readiness
- Both capture endpoints complete (dictation in 02-02, screenshot in 02-03)
- Phase 2 fully complete -- ready for Phase 3 (LLM routing pipeline)
- All shared foundation modules, capture endpoints, and storage utilities in place

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 02-capture-api-storage-foundation*
*Completed: 2026-02-20*
