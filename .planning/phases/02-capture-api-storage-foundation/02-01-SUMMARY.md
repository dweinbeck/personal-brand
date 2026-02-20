---
phase: 02-capture-api-storage-foundation
plan: 01
subsystem: api, auth, storage
tags: [zod, firestore, cloud-storage, api-key, crypto]

# Dependency graph
requires: []
provides:
  - API key auth middleware with constant-time comparison (verifyApiKey)
  - Zod validation schemas for capture requests (dictation + screenshot)
  - Firestore capture persistence (saveCapture, updateCaptureStatus)
  - Cloud Storage upload utility (uploadScreenshot)
  - Four new optional env vars (GSD_API_KEY, FIREBASE_STORAGE_BUCKET, GITHUB_PAT, DISCORD_WEBHOOK_URL)
affects: [02-02, 02-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [api-key-auth-with-timing-safe-equal, conditional-storage-init, gsd-captures-collection]

key-files:
  created:
    - src/lib/auth/api-key.ts
    - src/lib/gsd/schemas.ts
    - src/lib/gsd/capture.ts
    - src/lib/gsd/storage.ts
  modified:
    - src/lib/env.ts
    - src/lib/firebase.ts

key-decisions:
  - "Used SHA-256 hash normalization before timingSafeEqual to avoid length-mismatch throws"
  - "API key read from process.env at point of use (not via serverEnv()) matching firebase.ts pattern"
  - "Cloud Storage conditionally initialized -- returns undefined when FIREBASE_STORAGE_BUCKET unset"

patterns-established:
  - "api-key-auth: verifyApiKey discriminated union pattern matching admin.ts and user.ts"
  - "gsd-module: requireDb/capturesCol pattern from brand-scraper/history.ts"
  - "conditional-storage: storage export undefined when bucket env var missing"

requirements-completed: [CAP-AUTH, CAP-ENV, CAP-SCHEMA, CAP-STORAGE]

# Metrics
duration: 3min
completed: 2026-02-20
---

# Phase 2 Plan 1: Shared Foundation Summary

**API key auth with SHA-256 timing-safe comparison, Zod capture schemas, Firestore persistence for gsd_captures, and conditional Cloud Storage upload utility**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-20T17:00:27Z
- **Completed:** 2026-02-20T17:03:50Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- API key auth middleware with constant-time SHA-256 comparison preventing timing attacks
- Zod validation schemas for dictation and screenshot capture requests with status/destination enums
- Firestore capture persistence following established requireDb/collection pattern
- Cloud Storage upload utility returning gs:// paths with content-type-aware extensions
- Four new optional env vars registered in schema, serverEnv(), and validateServerEnv()

## Task Commits

Each task was committed atomically:

1. **Task 1: API key auth middleware and env var registration** - `08229aa` (feat)
2. **Task 2: Firestore capture persistence, Cloud Storage upload, and Zod schemas** - `a78e402` (feat)

## Files Created/Modified
- `src/lib/auth/api-key.ts` - API key auth with verifyApiKey and apiKeyUnauthorizedResponse
- `src/lib/gsd/schemas.ts` - Zod schemas for dictation/screenshot requests, status, destination enums
- `src/lib/gsd/capture.ts` - Firestore persistence: saveCapture, updateCaptureStatus for gsd_captures
- `src/lib/gsd/storage.ts` - Cloud Storage upload: uploadScreenshot returning gs:// path
- `src/lib/env.ts` - Four new optional env vars in schema and both parse call sites
- `src/lib/firebase.ts` - Conditional Cloud Storage bucket export via getStorage

## Decisions Made
- Used SHA-256 hash normalization before timingSafeEqual to avoid length-mismatch throws (plan specified this approach)
- API key read from process.env at point of use (not via serverEnv()) to match firebase.ts pattern for module-scope usage
- Cloud Storage conditionally initialized -- returns undefined when FIREBASE_STORAGE_BUCKET is unset, consistent with db/auth pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. All four new env vars are optional.

## Next Phase Readiness
- All shared foundation modules ready for Plans 02-02 (dictation capture endpoint) and 02-03 (screenshot capture endpoint)
- Both endpoints can import verifyApiKey, schemas, saveCapture, updateCaptureStatus, and uploadScreenshot
- No blockers or concerns

---
*Phase: 02-capture-api-storage-foundation*
*Completed: 2026-02-20*
