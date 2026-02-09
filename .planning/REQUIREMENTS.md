# Requirements: v1.3 Assistant Backend Integration

**Defined:** 2026-02-08
**Core Value:** Visitors can understand who Dan is and see proof of his work within 60 seconds

## Assistant Integration

- [x] **ASST-01**: Assistant chat uses external FastAPI RAG service (chatbot-assistant on Cloud Run) instead of internal Gemini backend
- [x] **ASST-02**: Next.js API route proxies to FastAPI server-to-server (no CORS, no browser-to-backend direct connection)
- [x] **ASST-03**: Remove old assistant server code (API route internals, safety pipeline, knowledge base, rate limiting, logging, admin routes/pages/components)
- [x] **ASST-04**: Chat UI renders citations from RAG responses with collapsible source list, GitHub permalink URLs, and confidence badge
- [x] **ASST-05**: Clean up dead code and unused dependencies from old assistant (remove @ai-sdk/google, orphaned env vars, 7 assistant-only data files)

## Future Requirements (Deferred)

### Assistant Enhancements

- **ASST-D1**: Streaming responses from FastAPI (backend rewrite for marginal UX gain)
- **ASST-D2**: Multi-turn conversation context (backend accepts single question, not conversation array)
- **ASST-D3**: Low-confidence clarification messaging (needs backend API contract extension)
- **ASST-D4**: RAG-specific admin analytics (admin tooling deferred; backend has its own observability)
- **ASST-D5**: Cloud Run IAM service-to-service authentication (start with public FastAPI, add IAM later)

### Writing

- **WRIT-01**: Writing page displays real articles (replaces lorem ipsum)
- **WRIT-02**: Individual article pages render MDX content with code highlighting

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom ChatTransport (direct CORS) | Proxy approach eliminates CORS problem entirely; Cloud Run IAM incompatible with browser preflight |
| Streaming from FastAPI | Backend returns JSON; 1-5s wait acceptable for personal site |
| Conversation persistence/history | Ephemeral conversations appropriate for personal site |
| Code preview in citation expansion | GitHub permalink is sufficient; don't recreate GitHub's syntax highlighting |
| Inline numbered citations (Perplexity-style) | Code file references don't work well inline; collapsible section is cleaner |
| Per-citation feedback | Over-granular; per-message FeedbackButtons sufficient |
| Admin analytics rebuild | Control center deferred to future milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ASST-01 | Phase 13 | Complete |
| ASST-02 | Phase 13 | Complete |
| ASST-04 | Phase 14 | Complete |
| ASST-03 | Phase 15 | Complete |
| ASST-05 | Phase 16 | Complete |
