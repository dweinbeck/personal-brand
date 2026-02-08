---
phase: 14-citation-confidence-ui
plan: 01
subsystem: api
tags: [ai-sdk, uimessagestream, source-url, github-permalink, citations, confidence]

# Dependency graph
requires:
  - phase: 13-proxy-integration
    provides: FastAPI proxy route with markdown citations
provides:
  - citation-utils.ts with buildGitHubPermalink() and extractFilePath()
  - Route handler writing structured source-url chunks and messageMetadata
affects: [14-02 (frontend citation/confidence UI components)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UIMessageStream structured chunks: start (with metadata) -> text -> source-url -> finish"
    - "Citation source parsing: owner/repo/path@sha:lines format"

key-files:
  created:
    - src/lib/citation-utils.ts
  modified:
    - src/app/api/assistant/chat/route.ts

key-decisions:
  - "sourceId set to raw citation source string for downstream traceability"
  - "title set to extractFilePath() for human-readable display in UI"
  - "start chunk emits messageMetadata with confidence before text chunks"

patterns-established:
  - "Source-url chunk pattern: write after text-end, before finish"
  - "GitHub permalink construction from owner/repo/path@sha:lines format"

# Metrics
duration: 2min
completed: 2026-02-08
---

# Phase 14 Plan 01: Structured Citation Chunks Summary

**Replaced markdown citation appending with AI SDK source-url chunks and messageMetadata confidence in the UIMessageStream**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-08T22:26:29Z
- **Completed:** 2026-02-08T22:28:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created citation utility module with GitHub permalink builder and file path extractor
- Replaced markdown citation block with structured source-url chunks in route handler
- Added messageMetadata with confidence level on start chunk for frontend consumption

## Task Commits

Each task was committed atomically:

1. **Task 1: Create citation utility module** - `f13b014` (feat)
2. **Task 2: Update route handler to write structured chunks** - `b787c43` (feat)

## Files Created/Modified
- `src/lib/citation-utils.ts` - buildGitHubPermalink() and extractFilePath() for parsing citation sources
- `src/app/api/assistant/chat/route.ts` - Structured UIMessageStream with source-url chunks and confidence metadata

## Decisions Made
- Used raw citation source string as sourceId for downstream traceability
- Set source-url title to extractFilePath() output for human-readable display
- Emit start chunk with messageMetadata before text chunks (AI SDK protocol order)
- finishReason set to "stop" on finish chunk for explicit completion signaling

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Structured source-url chunks and messageMetadata ready for frontend consumption in Plan 02
- Frontend needs to parse message.parts for type "source-url" and message metadata for confidence
- No blockers

---
*Phase: 14-citation-confidence-ui*
*Completed: 2026-02-08*
