# Domain Pitfalls: Replacing Internal API Backend with External FastAPI Service

**Domain:** Next.js internal API route swap to cross-origin FastAPI Cloud Run service
**Researched:** 2026-02-08
**Overall confidence:** HIGH (based on codebase analysis + verified AI SDK documentation)

---

## Critical Pitfalls

Mistakes that cause the assistant to break entirely or require architectural rework.

### Pitfall 1: Vercel AI SDK `useChat` Cannot Consume Plain JSON Responses

**What goes wrong:** The FastAPI backend returns `{response, citations, confidence, conversation_id}` as a plain JSON object. The current `ChatInterface.tsx` uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport`, which expects the **UI Message Stream Protocol** -- a Server-Sent Events stream with specific event types (`start`, `text-start`, `text-delta`, `text-end`, `finish`) and the header `x-vercel-ai-ui-message-stream: v1`. Sending plain JSON back will cause `useChat` to silently fail: no messages will appear in the UI, no error will be thrown, and the chat will appear frozen.

**Why it happens:** Developers assume `useChat` is a generic HTTP client that can parse any response format. It is not. It is tightly coupled to the AI SDK stream protocol. The `DefaultChatTransport` specifically processes SSE data frames and reconstructs `parts`-based messages from them.

**Consequences:**
- Chat appears to submit (spinner shows) but no response ever renders
- No error is thrown -- `useChat` silently drops non-conforming responses
- The `status` may stay stuck on `"submitted"` indefinitely

**Prevention -- three options, ordered by recommendation:**

1. **RECOMMENDED: Write a custom `ChatTransport`** that replaces `DefaultChatTransport`. This transport fetches from the FastAPI URL, receives the JSON response, and converts it into a synthetic `ReadableStream` that conforms to the UI Message Stream Protocol before returning it to `useChat`. This preserves the entire `useChat` state machine (status, messages, error handling). The `ChatTransport` interface requires implementing a `sendMessages` method that returns a UI message stream.

2. **Alternative: Add an SSE proxy route** in Next.js (`/api/assistant/chat`) that forwards to FastAPI, receives JSON, then re-emits as a proper `createUIMessageStream`. This adds latency (double-hop) but requires zero frontend changes.

3. **Alternative: Drop `useChat` entirely** and manage chat state manually with `useState` + `fetch`. This throws away `useChat`'s built-in message management, status tracking, and error handling, but gives full control over the response format.

**Detection:** If after wiring up the FastAPI URL the chat submits but never renders a response, this is the cause. Check the Network tab -- if the response is `200 OK` with JSON body but nothing renders, the transport layer is rejecting the format.

**Phase:** Must be resolved in the FIRST phase, before any other work. This is the core integration decision.

**Confidence:** HIGH -- verified via [AI SDK Stream Protocol docs](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) and [FastAPI integration issues](https://github.com/vercel/ai/issues/7496).

---

### Pitfall 2: CORS Preflight Fails on Cloud Run with IAM Authentication

**What goes wrong:** If the FastAPI Cloud Run service has "Require authentication" enabled in Cloud Run settings (IAM-level), **all browser CORS preflight OPTIONS requests will return 403 Forbidden**. This is not a bug in your CORS code -- Cloud Run's IAM layer rejects the OPTIONS request before it ever reaches your FastAPI app, because browsers cannot attach `Authorization` headers to preflight requests (per the CORS spec).

**Why it happens:** Cloud Run's IAM authentication runs at the infrastructure level, before the request reaches the application container. Preflight OPTIONS requests are sent by the browser without credentials. There is no way to add credentials to a preflight request -- the CORS spec prohibits it.

**Consequences:**
- Every cross-origin request from the Next.js frontend will fail
- Browser console shows `Access to fetch has been blocked by CORS policy`
- The FastAPI CORS middleware never executes because the request never reaches it

**Prevention:**
- **Set the FastAPI Cloud Run service to "Allow unauthenticated invocations"** and handle authentication at the application level (API key in header, JWT validation in FastAPI middleware, etc.)
- OR use a **Next.js proxy route** that calls FastAPI server-to-server (no browser CORS involved), but this adds latency and defeats the purpose of direct integration
- Do NOT use Cloud Run IAM authentication if the service receives direct browser requests

**Detection:** If all chat requests fail with CORS errors and the FastAPI service has `--no-allow-unauthenticated` in its deploy config, this is the cause. Check with: `gcloud run services describe [SERVICE] --format='value(spec.template.metadata.annotations)'`

**Phase:** Must be resolved during FastAPI service configuration, before any frontend integration work begins.

**Confidence:** HIGH -- this is a [documented Cloud Run limitation](https://issuetracker.google.com/issues/361387319) that Google has acknowledged as an open issue.

---

### Pitfall 3: Removing Backend Code Breaks the Admin Panel at Build Time

**What goes wrong:** The admin panel pages (`/control-center/assistant/` and `/control-center/assistant/facts/`) are **server components** that import directly from `@/lib/assistant/analytics`, `@/lib/assistant/facts-store`, and `@/lib/assistant/prompt-versions` at build time. These modules import `db` from `@/lib/firebase`. If you delete the `src/lib/assistant/` directory (or even individual files like `analytics.ts`, `facts-store.ts`, `prompt-versions.ts`), the build will fail with unresolved import errors.

**Specific import chain that breaks:**

```
src/app/control-center/assistant/page.tsx
  -> imports getAnalytics from @/lib/assistant/analytics
  -> imports AssistantAnalytics from @/components/admin/AssistantAnalytics
     -> imports type AnalyticsData from @/lib/assistant/analytics

src/app/control-center/assistant/facts/page.tsx
  -> imports getFacts from @/lib/assistant/facts-store
  -> imports getPromptVersions from @/lib/assistant/prompt-versions
  -> imports FactsEditor (which imports type Fact, FactCategory from @/lib/assistant/facts-store)
  -> imports PromptVersions (which imports type PromptVersion from @/lib/assistant/prompt-versions)
  -> imports ReindexButton (which calls /api/assistant/reindex)
```

**Why it happens:** Developers focus on removing the chat route and assistant logic but forget that the admin panel pages are tightly coupled to the same backend modules. The admin pages are server components that call Firestore directly at render time -- they are not just API consumers.

**Consequences:**
- `npm run build` fails with `Module not found` errors
- The entire site fails to deploy, not just the assistant
- CI/CD pipeline (Cloud Build) breaks

**Prevention:**
- **Map ALL imports BEFORE deleting any files.** The complete dependency graph is documented above.
- Delete admin pages AND their supporting admin components at the same time as the backend code, OR replace them with new admin pages that talk to the FastAPI backend
- Run `npm run build` after every deletion batch
- The full list of admin components to delete together: `AssistantAnalytics.tsx`, `TopQuestions.tsx`, `UnansweredQuestions.tsx`, `FactsEditor.tsx`, `PromptVersions.tsx`, `ReindexButton.tsx`

**Detection:** `npm run build` failure with `Module not found: Can't resolve '@/lib/assistant/...'`

**Phase:** Must be addressed in the same phase as backend code removal. Cannot delete selectively.

**Confidence:** HIGH -- verified by direct codebase analysis. Every import path is documented above.

---

### Pitfall 4: Client Components Still Fetch Deleted API Routes (Silent Runtime Failures)

**What goes wrong:** Six client components make `fetch()` calls to `/api/assistant/*` routes that will no longer exist after backend removal. Unlike build-time import errors, these fail silently at runtime -- no build error, no TypeScript error, just broken functionality for users.

**Components and their dead routes:**

| Component | Route | What Breaks |
|-----------|-------|-------------|
| `ChatInterface.tsx` | `/api/assistant/chat` | Chat completely broken (but addressed by transport rewrite) |
| `FeedbackButtons.tsx` | `/api/assistant/feedback` | Thumbs up/down silently fail (fire-and-forget catch) |
| `LeadCaptureFlow.tsx` | `/api/assistant/feedback` | Lead capture form submits but data is lost |
| `FactsEditor.tsx` | `/api/assistant/facts` | Admin can't add/delete facts |
| `ReindexButton.tsx` | `/api/assistant/reindex` | Cache clear button does nothing |
| `PromptVersions.tsx` | `/api/assistant/prompt-versions` | Prompt rollback silently fails |

**Why it happens:** TypeScript and the build process cannot detect dead `fetch()` URLs -- these are runtime string literals, not static imports. The `FeedbackButtons` and `LeadCaptureFlow` components are especially dangerous because they use `try/catch` with empty catch blocks, meaning failures produce zero visible errors.

**Consequences:**
- User feedback data is permanently lost (no error shown to user, data goes nowhere)
- Lead capture data (name, email, timeline, problem) is permanently lost
- Admin panel appears functional but all mutations silently fail
- No monitoring alerts because errors are swallowed client-side

**Prevention:**
- **Create a checklist of ALL client-side fetch calls** before removing routes (the table above IS that checklist)
- For each deleted route, either: (a) redirect the fetch to a FastAPI equivalent, (b) create a thin Next.js proxy route, or (c) remove the component
- **Decision required:** Does the FastAPI backend provide feedback/analytics endpoints? If not, these features are simply gone and the components should be removed or stubbed

**Detection:** Test every interactive feature after migration. Click every button. Submit every form. Check Network tab for 404s.

**Phase:** Must be addressed in the same phase as route deletion. Create a test plan that exercises every client-side fetch.

**Confidence:** HIGH -- verified by direct codebase grep results.

---

## Moderate Pitfalls

Mistakes that cause delays, broken features, or technical debt.

### Pitfall 5: New Response Schema Fields (Citations, Confidence) Not Rendered

**What goes wrong:** The FastAPI backend returns `{response, citations, confidence, conversation_id}` but the current `ChatMessage` component only renders a single `content` string via `MarkdownRenderer`. If you wire up the `response` field to `content` and ignore `citations` and `confidence`, you ship a functionally correct but feature-incomplete integration -- the RAG backend's value proposition (source attribution, confidence scoring) is invisible to users.

**Why it happens:** The natural first instinct is "make it work" by mapping `response` to `content`. This technically works but wastes the FastAPI backend's most valuable outputs.

**Consequences:**
- Users cannot verify claims (no citation links)
- No confidence indicator means users cannot gauge response reliability
- You build the hardest part (integration) but skip the easiest part (rendering new fields)

**Prevention:**
- Plan the `ChatMessage` component redesign ALONGSIDE the transport rewrite, not as a separate phase
- Design the citation and confidence UI before starting implementation
- Decide: do citations render inline (markdown links) or as a separate section below the response?
- The custom `ChatTransport` should expose these fields through the message metadata or as custom parts

**Detection:** After integration works, manually check if citations and confidence are visible. If not, this was missed.

**Phase:** Should be addressed in the same phase as the transport rewrite, or immediately after.

**Confidence:** HIGH -- this follows from the FastAPI response schema vs. current component props.

---

### Pitfall 6: `src/data/` Files Shared Between Assistant and Non-Assistant Code

**What goes wrong:** The `src/data/` directory contains 9 files. Developers may assume these are all "assistant knowledge base files" and delete them during cleanup. But TWO files are imported by non-assistant code:

| File | Non-Assistant Consumer | What Breaks |
|------|----------------------|-------------|
| `src/data/projects.json` | `src/lib/github.ts` (project pages) | Projects page renders empty, project detail pages 404 |
| `src/data/accomplishments.json` | `src/lib/accomplishments.ts` (accomplishments page) | Accomplishments page renders empty |

The remaining 7 files (`canon.json`, `faq.json`, `contact.json`, `writing.json`, `services.md`, `safety-rules.json`, `approved-responses.json`) are consumed only by assistant code and CAN be safely deleted.

**Why it happens:** All 9 files live in the same directory with no naming convention distinguishing "assistant-only" from "shared" data. A developer doing cleanup sees `src/data/` listed as "assistant knowledge base" and deletes the whole directory.

**Consequences:**
- Projects page breaks (core site feature)
- Accomplishments page breaks (core site feature)
- Build may succeed (JSON imports are valid) but pages render empty

**Prevention:**
- **Do NOT delete `src/data/projects.json` or `src/data/accomplishments.json`**
- Safe to delete: `canon.json`, `faq.json`, `contact.json`, `writing.json`, `services.md`, `safety-rules.json`, `approved-responses.json`
- Consider moving shared data files to `src/data/site/` to prevent future confusion

**Detection:** After cleanup, navigate to the Projects page and Accomplishments page. If they render empty with no errors, data files were incorrectly deleted.

**Phase:** Must be addressed during file cleanup/deletion phase. Use the safe-delete list above.

**Confidence:** HIGH -- verified by codebase grep.

---

### Pitfall 7: Orphaned Dependencies Bloat the Bundle

**What goes wrong:** After removing all assistant backend code, three npm packages become potentially unused:
- `@ai-sdk/google` -- only used by `src/lib/assistant/gemini.ts` (WILL be orphaned)
- `ai` -- used by the chat route (server-side `streamText`, `createUIMessageStream`) and `ChatInterface.tsx` (`DefaultChatTransport`)
- `@ai-sdk/react` -- only used by `ChatInterface.tsx` (`useChat`)

**Important distinction:** If you write a custom `ChatTransport` (Pitfall 1, option 1), you still need `@ai-sdk/react` (for `useChat`) and `ai` (for the `ChatTransport` type). Only `@ai-sdk/google` becomes fully orphaned.

If you drop `useChat` entirely (Pitfall 1, option 3), ALL THREE packages become orphaned.

**Why it happens:** Developers focus on deleting source files but forget to clean up `package.json`. The packages don't cause build failures -- they just add dead weight.

**Consequences:**
- Larger Docker image (matters for Cloud Run cold start)
- Potential client bundle bloat
- Misleading `package.json` suggests AI SDK provider is still in use

**Prevention:**
- After all code changes, manually review which `ai`/`@ai-sdk` packages are still imported
- Remove `@ai-sdk/google` from dependencies regardless of transport approach
- Run `npm run build` after removing packages to verify nothing breaks

**Detection:** `grep -r "@ai-sdk/google" src/` returns no results after cleanup.

**Phase:** Final cleanup phase, after all code changes are complete.

**Confidence:** HIGH -- verified by grep of all AI SDK imports.

---

### Pitfall 8: `GOOGLE_GENERATIVE_AI_API_KEY` Becomes an Orphaned Secret

**What goes wrong:** The environment variable `GOOGLE_GENERATIVE_AI_API_KEY` is currently set in Cloud Run and `.env.local`. After migration, the Next.js app no longer calls Gemini directly -- the FastAPI backend handles LLM calls. But the env var remains configured, creating:
- An active API key that nobody monitors for abuse
- Potential for unexpected charges
- Confusion about what the Next.js app actually needs

**Why it happens:** Environment variables are "set and forget." Nobody reviews them during a code migration.

**Prevention:**
- Remove `GOOGLE_GENERATIVE_AI_API_KEY` from Cloud Run environment config after verifying the new integration works
- Remove from `.env.local` and update `.env.local.example`
- Add the new env var (e.g., `NEXT_PUBLIC_ASSISTANT_API_URL` or `ASSISTANT_API_URL`) to `.env.local.example` with documentation
- Consider revoking the old Google AI API key entirely if it is not used elsewhere

**Detection:** After migration, check `gcloud run services describe [SERVICE]` for lingering env vars.

**Phase:** Final deployment phase, after confirming the new integration works in production.

**Confidence:** HIGH -- the env var is documented in `.env.local.example`.

---

### Pitfall 9: CORS Misconfiguration at the Application Level

**What goes wrong:** Even after solving Pitfall 2 (IAM auth blocking preflight), the FastAPI CORS middleware itself can be misconfigured in subtle ways that cause intermittent or hard-to-debug failures:

1. **Wildcard origin (`*`) with credentials:** If FastAPI sets `Access-Control-Allow-Origin: *` AND the frontend sends `credentials: "include"`, the browser rejects the response. The CORS spec prohibits wildcard origins with credentials.
2. **Missing allowed headers:** If the frontend sends custom headers (e.g., `X-Conversation-Id`), they must be listed in `Access-Control-Allow-Headers`. Omission causes preflight to fail.
3. **Missing `Content-Type` in allowed headers:** If the request sends `Content-Type: application/json`, this triggers a preflight. If `Content-Type` is not in `Access-Control-Allow-Headers`, the request fails.
4. **Caching preflight responses too long:** `Access-Control-Max-Age` set too high means CORS config changes don't take effect until the cache expires. During development, this causes "I fixed it but it's still broken" confusion.

**Prevention:**
- FastAPI CORS middleware should set `allow_origins` to the specific Next.js Cloud Run URL (not `*`)
- Include `Content-Type` and any custom headers in `allow_headers`
- Set `Access-Control-Max-Age` to a short value (300 seconds) during development
- Test CORS with `curl -X OPTIONS -H "Origin: https://your-nextjs-url.run.app" -H "Access-Control-Request-Method: POST" https://your-fastapi-url.run.app/chat -v`

**Phase:** During FastAPI service configuration phase.

**Confidence:** HIGH -- standard CORS specification behavior.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 10: `conversation_id` Format Mismatch

**What goes wrong:** The current `useChat` hook generates a client-side `id` (UUID format) used as `conversationId` throughout the frontend (`ChatMessage`, `FeedbackButtons`, `LeadCaptureFlow`). The FastAPI backend returns its own `conversation_id` in the response. If the frontend and backend use different conversation IDs, features that reference conversations (feedback, lead capture, handoff email) will have inconsistent identifiers.

**Prevention:**
- Decide: does the frontend send its `id` to FastAPI, or does FastAPI assign the `conversation_id` and the frontend adopts it?
- If FastAPI assigns: update the custom transport to extract `conversation_id` from the first response and use it for subsequent requests
- If frontend assigns: send the `useChat` `id` as a parameter to FastAPI

**Phase:** Part of the transport rewrite design.

**Confidence:** MEDIUM -- depends on the FastAPI API contract, which is not fully specified here.

---

### Pitfall 11: `HumanHandoff` Component Broken by Bulk Deletion

**What goes wrong:** The `HumanHandoff` component imports `buildMailtoLink` from `@/lib/assistant/handoff`. This module is pure logic (string manipulation to build a `mailto:` URL) with **zero backend dependencies** -- no Firebase, no API calls. If `src/lib/assistant/` is bulk-deleted, this useful, self-contained utility is lost and the build breaks unnecessarily.

**Prevention:**
- Move `handoff.ts` to `src/lib/` or `src/lib/utils/` before deleting `src/lib/assistant/`
- OR preserve `handoff.ts` in place and only delete assistant files that have backend dependencies
- Update the import in `HumanHandoff.tsx` to match the new path

**Detection:** Build failure with `Module not found: Can't resolve '@/lib/assistant/handoff'`

**Phase:** During file cleanup. Simple file move.

**Confidence:** HIGH -- verified by reading the module source. It has zero backend dependencies.

---

### Pitfall 12: `NEXT_PUBLIC_*` Exposure of FastAPI URL

**What goes wrong:** If the FastAPI Cloud Run URL is stored as `NEXT_PUBLIC_ASSISTANT_API_URL`, it is embedded in the client JavaScript bundle and visible to anyone who opens browser DevTools. This is fine if the FastAPI service is designed to be public, but problematic if you intended any obscurity around the backend URL.

**Prevention:**
- If using a custom transport that calls FastAPI directly from the browser: accept that the URL is public, and ensure FastAPI has proper rate limiting, input validation, and abuse prevention
- If using a Next.js proxy route: store the URL as a server-only env var (no `NEXT_PUBLIC_` prefix) so the browser never sees it
- This is a conscious design decision, not a bug -- just make it intentionally

**Phase:** During environment variable setup.

**Confidence:** HIGH -- standard Next.js behavior for `NEXT_PUBLIC_` variables.

---

### Pitfall 13: `chatRequestSchema` in `src/lib/schemas/assistant.ts` Becomes Dead Code

**What goes wrong:** The Zod schema `chatRequestSchema` was used by the old `/api/assistant/chat` route for request validation. After removing that route, this schema file has no consumers. It is not harmful but creates dead code.

**Prevention:**
- Delete `src/lib/schemas/assistant.ts` when removing the chat route
- Or repurpose it if the custom transport needs client-side validation of the FastAPI response

**Phase:** During file cleanup.

**Confidence:** HIGH -- single consumer verified by grep.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Transport/integration rewrite | Pitfall 1 (AI SDK stream format) | Design custom ChatTransport or proxy first |
| FastAPI service configuration | Pitfall 2 (CORS + IAM), Pitfall 9 (CORS app-level) | Set service to allow unauthenticated, add app-level auth, test with curl |
| Backend code removal | Pitfall 3 (admin build break) | Map all imports before deleting; delete admin pages simultaneously |
| Backend code removal | Pitfall 4 (dead fetch URLs) | Checklist of all 6 client-side fetch calls |
| Backend code removal | Pitfall 6 (shared data files) | Do NOT delete projects.json or accomplishments.json |
| Backend code removal | Pitfall 11 (handoff.ts) | Move to src/lib/ before bulk delete |
| UI update | Pitfall 5 (citations/confidence) | Design new ChatMessage layout alongside transport |
| Environment cleanup | Pitfall 8 (orphaned API key) | Remove GOOGLE_GENERATIVE_AI_API_KEY from Cloud Run |
| Dependency cleanup | Pitfall 7 (orphaned packages) | Remove @ai-sdk/google after all code changes |

---

## Decision Matrix: Integration Architecture

The biggest upfront decision is how the frontend talks to FastAPI. This decision cascades into every other pitfall.

| Approach | Pitfalls Avoided | Pitfalls Introduced | Recommended? |
|----------|------------------|---------------------|-------------|
| **Custom ChatTransport** (browser calls FastAPI directly) | Avoids double-hop latency | Must handle CORS (P2, P9), exposes URL (P12), must convert JSON to stream format (P1) | YES -- cleanest long-term |
| **Next.js proxy route** (browser calls Next.js, Next.js calls FastAPI) | Avoids CORS entirely (P2, P9), hides FastAPI URL (P12) | Adds latency, keeps some backend code, partially defeats purpose of external backend | Only if CORS is insurmountable |
| **Drop useChat entirely** (manual fetch + useState) | Full control over response format (P1), no stream format conversion | Loses useChat state management, must reimplement status tracking, error handling, message array management | Only as last resort |

**Recommendation:** Custom `ChatTransport` with unauthenticated Cloud Run service + application-level API key auth on FastAPI.

---

## Complete File Deletion Reference

Files that are safe to delete (assistant-only, no non-assistant consumers):

**API routes (5 files):**
- `src/app/api/assistant/chat/route.ts`
- `src/app/api/assistant/feedback/route.ts`
- `src/app/api/assistant/facts/route.ts`
- `src/app/api/assistant/prompt-versions/route.ts`
- `src/app/api/assistant/reindex/route.ts`

**Library modules (12 files -- but see warnings):**
- `src/lib/assistant/gemini.ts` -- safe
- `src/lib/assistant/knowledge.ts` -- safe
- `src/lib/assistant/rate-limit.ts` -- safe
- `src/lib/assistant/safety.ts` -- safe
- `src/lib/assistant/filters.ts` -- safe
- `src/lib/assistant/refusals.ts` -- safe
- `src/lib/assistant/logging.ts` -- safe
- `src/lib/assistant/analytics.ts` -- safe (but delete admin pages first)
- `src/lib/assistant/facts-store.ts` -- safe (but delete admin pages first)
- `src/lib/assistant/prompt-versions.ts` -- safe (but delete admin pages first)
- `src/lib/assistant/lead-capture.ts` -- safe
- `src/lib/assistant/prompts.ts` -- safe
- `src/lib/assistant/handoff.ts` -- MOVE to src/lib/, do NOT delete (see Pitfall 11)

**Admin pages (2 files):**
- `src/app/control-center/assistant/page.tsx`
- `src/app/control-center/assistant/facts/page.tsx`

**Admin components (5 files):**
- `src/components/admin/AssistantAnalytics.tsx`
- `src/components/admin/TopQuestions.tsx`
- `src/components/admin/UnansweredQuestions.tsx`
- `src/components/admin/FactsEditor.tsx`
- `src/components/admin/ReindexButton.tsx`
- `src/components/admin/PromptVersions.tsx`

**Schema (1 file):**
- `src/lib/schemas/assistant.ts`

**Data files (7 of 9 -- see Pitfall 6):**
- `src/data/canon.json` -- safe to delete
- `src/data/faq.json` -- safe to delete
- `src/data/contact.json` -- safe to delete
- `src/data/writing.json` -- safe to delete
- `src/data/services.md` -- safe to delete
- `src/data/safety-rules.json` -- safe to delete
- `src/data/approved-responses.json` -- safe to delete
- `src/data/projects.json` -- DO NOT DELETE (used by project pages)
- `src/data/accomplishments.json` -- DO NOT DELETE (used by accomplishments page)

---

## Sources

- [AI SDK UI: Stream Protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) -- HIGH confidence
- [AI SDK UI: Transport](https://ai-sdk.dev/docs/ai-sdk-ui/transport) -- HIGH confidence
- [AI SDK UI: useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) -- HIGH confidence
- [FastAPI + AI SDK v5 streaming issue](https://github.com/vercel/ai/issues/7496) -- HIGH confidence
- [FastAPI + AI SDK JSON data streaming discussion](https://github.com/vercel/ai/discussions/2840) -- MEDIUM confidence
- [Cloud Run CORS with authentication issue](https://issuetracker.google.com/issues/361387319) -- HIGH confidence
- [Cloud Run CORS discussion](https://discuss.google.dev/t/cloud-run-cors-policy/101265) -- MEDIUM confidence
- Codebase analysis (direct file reads of all 30+ relevant source files) -- HIGH confidence
