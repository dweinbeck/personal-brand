---
phase: 13-proxy-integration
plan: 02
subsystem: api
tags: [proxy, route-handler, uimessagestream, fastapi, ai-sdk]

# Dependency graph
requires:
  - phase: 13-proxy-integration
    plan: 01
    provides: "askFastApi client + FastApiError + Zod schemas"
provides:
  - "Proxy route handler forwarding questions to FastAPI RAG backend"
  - "UIMessageStream response compatible with useChat hook"
affects: [14-citation-ui, 15-dead-code-removal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "text-start → text-delta → text-end lifecycle for createUIMessageStream"
    - "FastApiError to HTTP status mapping in catch block"
    - "Citation appending as markdown (temporary until Phase 14)"

key-files:
  created: []
  modified:
    - src/app/api/assistant/chat/route.ts

key-decisions:
  - "Removed all old Gemini/safety/logging/rate-limit imports (dead code for Phase 15)"
  - "Citations appended as markdown Sources section (structured UI in Phase 14)"
  - "UIMessageStream requires text-start/text-end lifecycle events (discovered during verification)"

patterns-established:
  - "text-start → text-delta → text-end for manual createUIMessageStream usage"

# Metrics
duration: 8min
completed: 2026-02-08
---

# Phase 13 Plan 02: Route Handler Proxy Rewrite Summary

**Rewrite API route to proxy FastAPI RAG backend, replacing direct Gemini calls; verified end-to-end chat working**

## Performance

- **Duration:** 8 min (including human verification and stream fix)
- **Started:** 2026-02-08T21:20:00Z
- **Completed:** 2026-02-08T21:38:00Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 1

## Accomplishments
- Rewrote `src/app/api/assistant/chat/route.ts` as a thin FastAPI proxy
- Removed all old imports: streamText, headers, assistantModel, MODEL_CONFIG, buildSystemPrompt, checkAssistantRateLimit, logConversation, runSafetyPipeline
- Request validation via chatRequestSchema unchanged
- Question extracted from UIMessage parts array, forwarded as `{ question }` to FastAPI
- Response streamed back via createUIMessageStream with proper text-start/text-delta/text-end lifecycle
- Citations appended as markdown "Sources:" section
- FastApiError mapped to user-friendly HTTP error responses
- End-to-end chat verified working in browser

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite route handler as FastAPI proxy** - `d6c9326` (feat)
2. **Fix: Add text-start/text-end stream lifecycle** - `92760f9` (fix)
3. **Task 2: Verify end-to-end chat works** - Human verified ✓

## Files Created/Modified
- `src/app/api/assistant/chat/route.ts` - Complete rewrite: Gemini direct call → FastAPI proxy via askFastApi()

## Decisions Made
- Removed getClientIp() function — rate limiting now handled by FastAPI backend
- Citations rendered as markdown for Phase 13; structured citation UI deferred to Phase 14
- UIMessageStream requires text-start before text-delta and text-end after (AI SDK v5 protocol requirement)

## Deviations from Plan

1. **Stream lifecycle fix** — Plan specified only `text-delta` chunk (matching old safety refusal pattern). AI SDK v5 `processUIMessageStream` requires `text-start` → `text-delta` → `text-end` lifecycle. Without it, `useChat` throws `UIMessageStreamError` client-side. Fixed with additional `text-start` and `text-end` writes. Committed separately as `92760f9`.

## Issues Encountered

- **UIMessageStreamError on client**: The old safety refusal code pattern (bare `text-delta` without `text-start`/`text-end`) worked previously because safety refusals were rarely triggered. The AI SDK v5 stream processor actually requires the full lifecycle. This is a latent bug in the existing codebase that was exposed by the proxy rewrite making all responses go through `createUIMessageStream`.

## User Setup Required

- `CHATBOT_API_URL` must be set in `.env.local` for local development
- FastAPI RAG backend must be deployed and accessible at the configured URL

## Next Phase Readiness
- Route handler proxies all questions to FastAPI and returns UIMessageStream responses
- Frontend unchanged — ChatInterface.tsx, useChat, DefaultChatTransport all work as-is
- Phase 14 (Citation UI) can read citations from FastAPI response to build structured components
- Phase 15 (Dead Code Removal) can safely delete old assistant modules (gemini.ts, safety.ts, prompts.ts, rate-limit.ts, logging.ts)

---
*Phase: 13-proxy-integration*
*Completed: 2026-02-08*
