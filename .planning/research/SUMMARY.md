# Project Research Summary

**Project:** dan-weinbeck.com v1.3 -- Assistant Backend Integration (FastAPI RAG)
**Domain:** Frontend integration with external RAG chatbot backend
**Researched:** 2026-02-08
**Confidence:** HIGH (with one MEDIUM area)

## Executive Summary

The v1.3 milestone replaces the site's internal AI assistant backend (Gemini 2.0 Flash via Vercel AI SDK, curated JSON knowledge base, safety pipeline) with an external FastAPI RAG service deployed on GCP Cloud Run. The FastAPI backend handles retrieval, LLM orchestration, safety, and returns structured JSON responses with answer text, source citations, and confidence scores. From the Next.js frontend's perspective, this is overwhelmingly a **deletion milestone**: ~27-30 files removed, 2 files modified, and only 2-3 new files created.

**The central architectural decision is proxy vs. direct CORS.** The STACK researcher recommends a **Next.js API route proxy** (browser calls same-origin `/api/assistant/chat`, which calls FastAPI server-to-server and translates JSON to UIMessageStream). The ARCHITECTURE researcher designed for **direct CORS with a custom `ChatTransport`** (browser calls FastAPI directly). **This summary recommends the proxy approach.** The rationale: (1) Cloud Run IAM authentication is incompatible with browser CORS preflight -- a documented, unresolved GCP limitation (issue #361387319), meaning direct CORS requires making FastAPI fully public; (2) the proxy requires zero frontend transport changes -- `DefaultChatTransport` and `useChat` work unchanged; (3) inter-service latency between two `us-central1` Cloud Run services is 1-5ms, negligible against 1-3s LLM inference time; (4) zero new npm dependencies are needed. The proxy approach eliminates the entire CORS problem class and the need to build/debug a custom `ChatTransport`, which the ARCHITECTURE researcher flagged as having LOW confidence on exact `UIMessageChunk` field names.

Key risks are: (1) removing backend code will break the admin panel at build time unless admin pages/components are deleted in the same commit; (2) two shared data files (`projects.json`, `accomplishments.json`) must NOT be deleted during `src/data/` cleanup; (3) `FeedbackButtons` and `LeadCaptureFlow` make fire-and-forget fetch calls that silently fail if routes are removed -- these need explicit decisions; (4) the exact FastAPI response schema has discrepancies across research files that must be resolved against the actual backend code before implementation.

## Key Findings

### Recommended Stack

See full details: [STACK.md](.planning/research/STACK.md)

**Zero new npm dependencies.** The existing `ai@6.0.71` SDK provides `createUIMessageStream` and `createUIMessageStreamResponse` for building the proxy translation layer. Native `fetch()` in Node.js 20 handles the server-to-server call to FastAPI. `zod@^4.3.6` (already installed) provides runtime validation of the FastAPI response.

**Core technologies:**
- **`createUIMessageStream` / `createUIMessageStreamResponse`** (from `ai@6.0.71`) -- translates FastAPI JSON into UIMessageStream protocol so `useChat` works unchanged
- **Native `fetch()`** -- calls FastAPI from the Next.js route handler; no HTTP client library needed
- **Zod v4** -- runtime validation of FastAPI response schema; catches drift between services
- **`CHATBOT_API_URL`** (server-side only, NOT `NEXT_PUBLIC_`) -- FastAPI endpoint; stays private because proxy handles the call

**Remove after migration validated:**
- `@ai-sdk/google` -- Gemini provider no longer called from Next.js
- `GOOGLE_GENERATIVE_AI_API_KEY` -- orphaned secret; revoke or remove from Cloud Run config

### Expected Features

See full details: [FEATURES.md](.planning/research/FEATURES.md)

**Must have (table stakes):**
- **Citation rendering** -- collapsible "Sources (N)" section below each answer with parsed file paths, relevance text, and GitHub permalink URLs
- **Confidence indicator** -- color-coded pill (high/medium/low) near the citation trigger
- **Loading state** -- existing `TypingIndicator` wired to new fetch lifecycle (shows during proxy round-trip)
- **Error handling** -- graceful states for network failure, timeout (15s AbortController), 4xx/5xx from FastAPI, invalid response shape
- **Type safety** -- Zod schemas for FastAPI request/response contract (`src/lib/schemas/fastapi.ts`)

**Should have (low-effort differentiators):**
- **Clickable GitHub permalinks** -- parse citation `source` string into `https://github.com/{owner}/{repo}/blob/{sha}/{path}#L{start}-L{end}` links
- **Updated suggested prompts** -- reflect RAG capabilities ("How does the chatbot backend work?" instead of generic prompts)
- **Citation count in collapsed state** -- "Cited N sources" visible even when collapsed (inherent in citation component design)

**Defer (v2+):**
- Streaming responses from FastAPI (backend rewrite for marginal UX gain)
- Multi-turn conversation context (backend `/chat` accepts single `question`, not conversation array)
- Low-confidence clarification messaging (needs backend API contract extension)
- RAG-specific admin analytics (admin tooling deferred; backend has its own observability via structlog)

### Architecture Approach

See full details: [ARCHITECTURE-fastapi-integration.md](.planning/research/ARCHITECTURE-fastapi-integration.md)

The new architecture uses the Next.js API route (`/api/assistant/chat`) as a thin translation proxy. The browser POSTs to the same-origin route (no CORS). The route handler: (1) extracts text from UIMessage `parts`; (2) calls FastAPI with `{messages: [{role, content}], conversation_id?}`; (3) receives JSON `{response, citations, confidence, conversation_id}`; (4) writes the response as a UIMessageStream via `createUIMessageStream`; (5) appends formatted citations as markdown to the response text (simplest approach; structured citation data can be added later).

**Major components:**
1. **Proxy route handler** (`src/app/api/assistant/chat/route.ts`) -- rewritten internals; same path, new implementation; translates between Vercel AI SDK UIMessage format and FastAPI JSON
2. **FastAPI client** (`src/lib/assistant/fastapi-client.ts`) -- typed `fetch` wrapper with Zod validation of FastAPI response
3. **Zod schemas** (`src/lib/schemas/fastapi.ts`) -- request/response contract validation; single source of truth for TypeScript types
4. **CitationList component** (new, ~80-100 lines) -- collapsible source display with GitHub permalink construction
5. **ConfidenceBadge component** (new, ~30-40 lines) -- color-coded confidence pill

**What stays unchanged:** `ChatInterface.tsx`, `ChatInput.tsx`, `ChatMessage.tsx` (minor modification for citations), `TypingIndicator.tsx`, `FeedbackButtons.tsx`, `SuggestedPrompts.tsx`, `ExitRamps.tsx`, `HumanHandoff.tsx`, `MarkdownRenderer.tsx`, `useChat` hook with `DefaultChatTransport`.

**What gets removed:** ~27-30 files including all assistant backend logic (`gemini.ts`, `safety.ts`, `filters.ts`, `refusals.ts`, `knowledge.ts`, `prompts.ts`, `rate-limit.ts`), 7 of 9 data files, admin routes (`facts`, `prompt-versions`, `reindex`), admin components (`FactsEditor`, `PromptVersions`, `ReindexButton`), and admin pages.

### Critical Pitfalls

See full details: [PITFALLS.md](.planning/research/PITFALLS.md)

1. **`useChat` cannot consume plain JSON responses** -- if the route handler does not translate to UIMessageStream, the chat silently freezes with no error. Prevention: use `createUIMessageStream` in the proxy to emit proper `text-delta` chunks. This is the core integration point; get it right first.

2. **Removing backend code breaks admin panel at build time** -- admin pages import from `@/lib/assistant/analytics`, `@/lib/assistant/facts-store`, and `@/lib/assistant/prompt-versions`. Deleting these files without simultaneously deleting the admin pages causes `Module not found` build failures that block the entire site deploy. Prevention: delete admin pages/components in the same commit as their backend dependencies.

3. **Two shared data files must survive `src/data/` cleanup** -- `projects.json` (used by project pages) and `accomplishments.json` (used by accomplishments page) are NOT assistant-only. Deleting them breaks core site features silently (pages render empty, no build error). Prevention: explicit safe-delete list; only delete 7 of 9 files.

4. **Client-side fetch calls to deleted routes fail silently** -- `FeedbackButtons` and `LeadCaptureFlow` use try/catch with empty catch blocks. After route deletion, user feedback data is permanently lost with zero visible error. Prevention: keep `/api/assistant/feedback` route (it uses Firestore directly, no assistant backend dependency). Decision needed on `LeadCaptureFlow`.

5. **`handoff.ts` is a pure utility with zero backend dependencies** -- bulk-deleting `src/lib/assistant/` will break `HumanHandoff` unnecessarily. Prevention: move `handoff.ts` to `src/lib/utils/` before cleanup.

## Implications for Roadmap

Based on combined research, the milestone should be structured in 5 phases. The ordering follows the principle: validate the core integration first, layer UI features on top, then clean up dead code last (so a working fallback exists throughout development).

### Phase 1: Proxy Route Handler + FastAPI Client

**Rationale:** This is the highest-risk, highest-value work. If the proxy translation does not work, nothing else matters. Do it first so failures surface immediately. This phase has zero frontend changes -- only server-side code.

**Delivers:**
- Rewritten `src/app/api/assistant/chat/route.ts` that calls FastAPI and returns UIMessageStream
- `src/lib/assistant/fastapi-client.ts` with typed fetch wrapper
- `src/lib/schemas/fastapi.ts` with Zod request/response schemas
- `CHATBOT_API_URL` environment variable configured
- End-to-end chat working with FastAPI backend (basic text responses, no citation UI yet)

**Addresses:** TS-3 (loading state), TS-4 (error handling), TS-5 (type safety)
**Avoids:** Pitfall 1 (stream format mismatch), Pitfall 2 (CORS -- eliminated entirely by proxy)

### Phase 2: Citation and Confidence UI

**Rationale:** With the core integration proven, layer on the RAG-specific UI. Citations and confidence are the whole value proposition of switching to a RAG backend -- shipping without them wastes the integration effort. Low risk because it builds on a working chat flow.

**Delivers:**
- `CitationList` component with collapsible sources, GitHub permalink URLs, relevance text
- `ConfidenceBadge` component with color-coded pills (high/medium/low)
- `ChatMessage.tsx` modified to render citations and confidence below assistant messages
- Metadata row layout: `[ConfidenceBadge] [Sources (N)] [FeedbackButtons]`

**Addresses:** TS-1 (citation rendering), TS-2 (confidence indicator), D-1 (GitHub permalinks), D-4 (citation count)
**Avoids:** Pitfall 5 (not rendering new schema fields)

### Phase 3: UX Polish and Suggested Prompts

**Rationale:** Quick wins that improve the user experience without touching core integration code. Can be done in parallel with Phase 4 cleanup if time is tight.

**Delivers:**
- Updated `SuggestedPrompts` to reflect RAG capabilities
- Updated `PrivacyDisclosure` wording (conversations now go to external service)
- Any edge case handling discovered during Phase 1-2 testing

**Addresses:** D-2 (smart empty state with RAG context)

### Phase 4: Dead Code Removal and Admin Cleanup

**Rationale:** Delete old server code only after the new integration is proven and validated. Git history preserves everything for rollback. This phase is high file count but low risk -- it is all deletion, verified by `npm run build` passing.

**Delivers:**
- Remove assistant backend: `gemini.ts`, `safety.ts`, `filters.ts`, `refusals.ts`, `knowledge.ts`, `prompts.ts`, `rate-limit.ts`, `facts-store.ts`, `prompt-versions.ts`
- Remove 7 data files (keep `projects.json` and `accomplishments.json`)
- Remove admin routes: `facts`, `prompt-versions`, `reindex`
- Remove admin pages and components: `FactsEditor`, `PromptVersions`, `ReindexButton`, `AssistantAnalytics`, `TopQuestions`, `UnansweredQuestions`, facts page, analytics page
- Move `handoff.ts` to `src/lib/utils/` and update import in `HumanHandoff.tsx`
- Remove `src/lib/schemas/assistant.ts`

**Avoids:** Pitfall 3 (admin build break -- delete together), Pitfall 6 (shared data files -- skip 2), Pitfall 11 (handoff.ts -- move first)

### Phase 5: Dependency and Environment Cleanup

**Rationale:** Final cleanup after all code changes. Reduces Docker image size and removes orphaned secrets.

**Delivers:**
- Uninstall `@ai-sdk/google` from `package.json`
- Remove `GOOGLE_GENERATIVE_AI_API_KEY` from Cloud Run config and `.env.local`
- Add `CHATBOT_API_URL` to `.env.local.example` with documentation
- Update `cloudbuild.yaml` env vars (add `CHATBOT_API_URL`, remove Gemini key)
- Optional: configure Cloud Run IAM service-to-service auth (FastAPI stays private, Next.js SA gets `roles/run.invoker`)

**Avoids:** Pitfall 7 (orphaned dependencies), Pitfall 8 (orphaned API key)

### Phase Ordering Rationale

- **Phase 1 first:** Core integration. If the proxy translation layer does not work, nothing else can proceed. Surfaces the hardest technical risk immediately.
- **Phase 2 before 3:** Citations/confidence are table stakes for a RAG assistant. They should be shipped immediately after the core integration, not deferred to polish.
- **Phase 3 can parallel Phase 4:** Suggested prompts and privacy disclosure are independent of code deletion.
- **Phase 4 before 5:** Code must be deleted before dependencies can be safely removed (removing `@ai-sdk/google` before deleting the code that imports it would break the build).
- **Phase 5 last:** Environment/dependency cleanup is safest after all code changes are complete and validated.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 1:** The exact `UIMessageChunk` field names need verification against `node_modules/ai/dist/` type declarations. The ARCHITECTURE researcher flagged this as LOW confidence. During Phase 1 planning, inspect the actual TypeScript types or write a minimal test. Additionally, the FastAPI response schema has discrepancies between research files (see Gaps section) -- resolve against actual backend code.

**Phases with standard patterns (skip `/gsd:research-phase`):**
- **Phase 2:** Citation UI is well-documented (Perplexity, ChatGPT patterns). Component design is straightforward.
- **Phase 3:** Content updates only. No research needed.
- **Phase 4:** File deletion guided by the complete dependency map in PITFALLS.md. Follow the safe-delete checklist.
- **Phase 5:** Standard GCP Cloud Run configuration and `npm uninstall`.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies; all capabilities verified in existing `ai@6.0.71` package. Proxy approach eliminates CORS unknowns entirely. |
| Features | HIGH | Feature list derived from direct inspection of both codebases. Citation/confidence UI patterns well-documented across Perplexity, ChatGPT, and AI UX pattern libraries. |
| Architecture | HIGH (proxy), MEDIUM (UIMessageChunk) | Proxy pattern is straightforward (fetch + createUIMessageStream). But exact UIMessageChunk field names are not fully documented publicly -- must verify at implementation time. |
| Pitfalls | HIGH | All pitfalls identified through direct codebase analysis. Every import chain, fetch call, and data file dependency was traced. |

**Overall confidence:** HIGH

### Gaps to Address

1. **FastAPI response schema discrepancy.** The FEATURES researcher (who inspected `chatbot-assistant/app/schemas/chat.py` directly) reports: `{answer, citations: [{source, relevance}], confidence: "low"|"medium"|"high"}` with `question` as the request field. The STACK/ARCHITECTURE researchers report: `{response, citations: [{source, content, line_range}], confidence: 0.92}` with `messages` array as the request format. These are fundamentally different field names and types. **Resolution:** During Phase 1 planning, inspect the actual FastAPI schemas in the `chatbot-assistant` repo to determine the true contract. The Zod schemas must match the real API, not the research assumptions.

2. **`UIMessageChunk` exact type shape.** The ARCHITECTURE researcher flagged this as LOW confidence. The discriminated union field names (`type: "text-delta"`, `textDelta` vs `delta`) must be verified from `node_modules/ai/dist/` or by examining `DefaultChatTransport.processResponseStream()`. **Resolution:** First task in Phase 1 implementation should be a type inspection/test.

3. **Feedback route disposition.** The `/api/assistant/feedback` route and `FeedbackButtons` component should survive the migration (they write to Firestore independently of the chat backend). But the `logConversation()` call in the current chat route (which populates the analytics Firestore collections) will be lost. **Decision needed:** Is conversation logging important enough to replicate in the proxy, or is backend-side observability (structlog) sufficient?

4. **`LeadCaptureFlow` component.** This component imports `detectHiringIntent` from `lead-capture.ts` and posts to `/api/assistant/feedback`. If `lead-capture.ts` is deleted and the feedback route behavior changes, lead capture data may be lost. **Decision needed:** Is lead capture still a feature? If yes, preserve `lead-capture.ts` and ensure the feedback route handles lead data. If no, remove the component.

5. **Service-to-service authentication.** The STACK researcher recommends starting with public FastAPI (simpler) and adding IAM auth later. If IAM auth is desired from day one, the proxy route handler needs ~5 lines of code to fetch an ID token from the GCP metadata server. **Decision point:** Phase 1 planning should decide public vs. IAM-authenticated FastAPI.

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK createUIMessageStream API](https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream) -- proxy translation layer
- [Vercel AI SDK Transport Documentation](https://ai-sdk.dev/docs/ai-sdk-ui/transport) -- transport architecture
- [Vercel AI SDK Stream Protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) -- UIMessage Stream Protocol format
- [Vercel AI SDK useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) -- hook API and status values
- [AI SDK ChatTransport Interface Source](https://github.com/vercel/ai/blob/main/packages/ai/src/ui/chat-transport.ts) -- interface definition
- [GCP Cloud Run Service-to-Service Auth](https://docs.google.com/run/docs/authenticating/service-to-service) -- IAM auth pattern
- [GCP Cloud Run CORS + IAM Limitation](https://issuetracker.google.com/issues/361387319) -- unresolved, confirms proxy is the right call
- [FastAPI CORS Middleware](https://fastapi.tiangolo.com/tutorial/cors/) -- CORS configuration reference
- [GitHub Permalink Format](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-a-permanent-link-to-a-code-snippet) -- citation URL construction
- Direct codebase analysis of 30+ files across `src/lib/assistant/`, `src/app/api/assistant/`, `src/components/assistant/`, `src/data/`, `src/app/control-center/assistant/`
- Direct inspection of `chatbot-assistant` repo schemas (`app/schemas/chat.py`, `app/routers/chat.py`)

### Secondary (MEDIUM confidence)
- [Vercel AI SDK GitHub Discussion: FastAPI Integration](https://github.com/vercel/ai/discussions/2840) -- community patterns
- [FastAPI + AI SDK v5 Integration Issues](https://github.com/vercel/ai/issues/7496) -- known challenges
- [ShapeofAI Citation Patterns](https://www.shapeof.ai/patterns/citations) -- UI patterns
- [Agentic Design Confidence Visualization](https://agentic-design.ai/patterns/ui-ux-patterns/confidence-visualization-patterns) -- badge patterns
- [py-ai-datastream](https://github.com/elementary-data/py-ai-datastream) -- evaluated, not recommended
- [fastapi-ai-sdk](https://github.com/doganarif/fastapi-ai-sdk) -- evaluated, not recommended

---
*Research completed: 2026-02-08*
*Ready for roadmap: yes*
