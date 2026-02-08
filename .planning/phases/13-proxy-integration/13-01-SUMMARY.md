---
phase: 13-proxy-integration
plan: 01
subsystem: api
tags: [zod, fetch, fastapi, error-handling, typescript]

# Dependency graph
requires:
  - phase: 13-proxy-integration
    provides: "Verified FastAPI contract from 13-RESEARCH.md (answer/citations/confidence schema)"
provides:
  - "Zod schemas for FastAPI ChatRequest/ChatResponse contract"
  - "Typed fetch wrapper (askFastApi) for FastAPI /chat endpoint"
  - "FastApiError class with HTTP status and timeout flag"
affects: [13-02 route handler, 14-streaming, 15-frontend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod safeParse for external API response validation"
    - "Typed error class (FastApiError) with status code for HTTP mapping"
    - "AbortSignal.timeout for fetch timeout control"

key-files:
  created:
    - src/lib/schemas/fastapi.ts
    - src/lib/assistant/fastapi-client.ts
  modified: []

key-decisions:
  - "Used safeParse (not parse) for graceful validation failure handling"
  - "Module-level CHATBOT_API_URL read matches existing env var patterns in project"
  - "503 for network/timeout/missing-config, 502 for invalid response shape"

patterns-established:
  - "External API schema validation: Zod schema in schemas/ dir, client in feature dir"
  - "FastApiError carries status + isTimeout for downstream HTTP response mapping"

# Metrics
duration: 2min
completed: 2026-02-08
---

# Phase 13 Plan 01: FastAPI Integration Layer Summary

**Zod schemas for FastAPI chat contract (answer/citations/confidence) and typed fetch client with timeout, validation, and error classification**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-08T20:58:39Z
- **Completed:** 2026-02-08T21:00:55Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Zod schemas matching verified FastAPI contract: answer (string), citations (source/relevance), confidence (low/medium/high enum)
- Typed askFastApi() client: POST {question} to /chat, 15s timeout, Zod validation of response
- FastApiError class with HTTP status code and isTimeout flag for route handler error mapping

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Zod schemas for FastAPI contract** - `3cbe4fb` (feat)
2. **Task 2: Create FastAPI client wrapper** - `c06c95a` (feat)

## Files Created/Modified
- `src/lib/schemas/fastapi.ts` - Zod schemas (fastApiCitationSchema, fastApiResponseSchema) and inferred types (FastApiResponse, FastApiCitation)
- `src/lib/assistant/fastapi-client.ts` - askFastApi() typed fetch wrapper and FastApiError class with status/isTimeout

## Decisions Made
- Used `safeParse()` instead of `parse()` for graceful error handling without try/catch
- Module-level `CHATBOT_API_URL` read (consistent with existing env var patterns in the project)
- Status code mapping: 503 for network/timeout/missing-config errors, 502 for invalid response shape from FastAPI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The `CHATBOT_API_URL` env var is needed at runtime but is an existing concern for deployment (documented in Phase 13 research).

## Next Phase Readiness
- Both files ready for import by Plan 02 (route handler)
- `askFastApi` returns typed `FastApiResponse` that the route handler can transform into streaming response
- `FastApiError.status` enables direct HTTP status code mapping in the route handler
- Zero new dependencies added - all built on existing zod + native fetch

---
*Phase: 13-proxy-integration*
*Completed: 2026-02-08*
