# Milestone v1.3: Assistant Backend Integration

**Status:** In progress
**Phases:** 13-16
**Total Plans:** TBD

## Overview

Replace the internal Gemini-powered assistant backend with an external FastAPI RAG service deployed on Cloud Run. The Next.js API route becomes a thin proxy that translates FastAPI JSON responses into UIMessageStream format, preserving the existing `useChat` hook and `DefaultChatTransport` with zero frontend transport changes. New citation and confidence UI surfaces the RAG backend's value. Then delete ~27-30 files of old server code and clean up orphaned dependencies.

## Phases

- [x] **Phase 13: Proxy Integration** - Rewrite API route to proxy FastAPI, end-to-end chat working
- [ ] **Phase 14: Citation and Confidence UI** - Render RAG citations and confidence in chat messages
- [ ] **Phase 15: Dead Code Removal** - Delete old assistant backend, admin panel, and data files
- [ ] **Phase 16: Dependency and Environment Cleanup** - Remove orphaned packages and env vars

## Phase Details

### Phase 13: Proxy Integration

**Goal**: Visitors can chat with the assistant and receive answers powered by the FastAPI RAG backend
**Depends on**: Phase 12 (v1.2 shipped)
**Requirements**: ASST-01, ASST-02
**Success Criteria** (what must be TRUE):
  1. User sends a message in the assistant chat and receives an answer from the FastAPI RAG backend
  2. The chat loading indicator shows while waiting for the FastAPI response and disappears when the answer renders
  3. If the FastAPI service is unavailable or returns an error, the user sees a clear error message (not a frozen chat)
  4. The assistant page works identically in local development and production (env var driven)
**Plans**: 2 plans

Plans:
- [x] 13-01-PLAN.md -- Create Zod schemas and FastAPI client wrapper
- [x] 13-02-PLAN.md -- Rewrite route handler as FastAPI proxy + verify end-to-end

**Research flags:** RESOLVED. FastAPI schema verified against actual `chatbot-assistant/app/schemas/chat.py`. UIMessageChunk field names verified against `node_modules/ai/dist/index.d.ts`. See `13-RESEARCH.md` for full resolution.

---

### Phase 14: Citation and Confidence UI

**Goal**: Visitors can see where the assistant's answers come from and how confident it is
**Depends on**: Phase 13
**Requirements**: ASST-04
**Success Criteria** (what must be TRUE):
  1. Each assistant response displays a collapsible "Sources (N)" section showing the citations used
  2. Each citation shows the file path and links to the exact lines on GitHub via permalink URL
  3. Each assistant response displays a confidence badge (high/medium/low) with appropriate color coding
  4. Suggested prompts reflect RAG capabilities (e.g., "How does the chatbot backend work?" instead of generic prompts)
  5. Privacy disclosure wording is updated to reflect that conversations go to an external service
**Plans**: 2 plans

Plans:
- [ ] 14-01-PLAN.md -- Backend stream changes: source-url chunks + messageMetadata + citation utility
- [ ] 14-02-PLAN.md -- Frontend UI: CitationList, ConfidenceBadge, ChatMessage/ChatInterface wiring, SuggestedPrompts + PrivacyDisclosure text

---

### Phase 15: Dead Code Removal

**Goal**: Old assistant backend code is fully removed with no build or runtime regressions
**Depends on**: Phase 14
**Requirements**: ASST-03
**Success Criteria** (what must be TRUE):
  1. The site builds and deploys with zero `Module not found` errors after all deletions
  2. `src/lib/assistant/` contains only the new FastAPI client and Zod schemas (old files removed)
  3. Admin pages under `/control-center/assistant/` are removed (no broken admin routes)
  4. `projects.json` and `accomplishments.json` remain intact (Projects and Accomplishments pages render correctly)
  5. `HumanHandoff` component still works (handoff.ts moved to `src/lib/utils/`)
**Plans**: TBD

Plans:
- [ ] 15-01: TBD

**Pitfall warnings:** Delete admin pages/components in the same commit as their backend dependencies (Pitfall 3). Do NOT delete `projects.json` or `accomplishments.json` (Pitfall 6). Move `handoff.ts` before bulk deletion (Pitfall 11).

---

### Phase 16: Dependency and Environment Cleanup

**Goal**: No orphaned packages, secrets, or environment variables remain from the old assistant
**Depends on**: Phase 15
**Requirements**: ASST-05
**Success Criteria** (what must be TRUE):
  1. `@ai-sdk/google` is uninstalled from `package.json` and the build still passes
  2. `CHATBOT_API_URL` is documented in `.env.local.example` and configured in `cloudbuild.yaml`
  3. `GOOGLE_GENERATIVE_AI_API_KEY` is removed from Cloud Run environment config and `.env.local`
  4. Docker image builds and deploys to Cloud Run with the updated environment
**Plans**: TBD

Plans:
- [ ] 16-01: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 13. Proxy Integration | 2/2 | Complete | 2026-02-08 |
| 14. Citation and Confidence UI | 0/TBD | Not started | - |
| 15. Dead Code Removal | 0/TBD | Not started | - |
| 16. Dependency and Environment Cleanup | 0/TBD | Not started | - |
