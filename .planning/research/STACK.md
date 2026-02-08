# Technology Stack: FastAPI RAG Backend Integration

**Project:** dan-weinbeck.com -- Assistant Backend Migration
**Researched:** 2026-02-08
**Overall confidence:** HIGH

## Executive Summary

The core architectural decision is **how the browser connects to the FastAPI backend**: either directly via CORS or through a Next.js API route proxy. After researching both approaches, the recommendation is a **thin Next.js API route proxy** that translates between FastAPI's JSON response format and the Vercel AI SDK's UIMessageStream protocol. This avoids CORS configuration entirely, keeps the FastAPI backend private (no public internet exposure), and preserves the existing `useChat` hook with zero frontend transport changes.

**Zero new npm dependencies are needed.** The existing `ai@6.0.71` SDK has all the primitives required to build the translation layer.

---

## Architecture Decision: Proxy vs. Direct CORS

### Option A: Direct CORS (Browser to FastAPI)

The browser calls the FastAPI Cloud Run service directly. Requires:
- FastAPI `CORSMiddleware` configured with the frontend's origin
- FastAPI Cloud Run service set to `--allow-unauthenticated` (public internet)
- Custom `ChatTransport` implementation in the frontend to handle FastAPI's JSON response format
- `NEXT_PUBLIC_CHATBOT_URL` environment variable exposed to the browser

**Pros:**
- One fewer network hop (lower latency per request)
- No proxy code to maintain

**Cons:**
- FastAPI must be publicly accessible -- cannot use Cloud Run IAM
- CORS preflight (OPTIONS) adds latency on first request per session
- Requires a custom `ChatTransport` class that returns `ReadableStream<UIMessageChunk>` from a non-streaming JSON response
- Backend URL leaked to browser (minor, but unnecessary exposure)
- Cloud Run IAM authentication is incompatible with CORS preflight requests (Google issue tracker #361387319 -- unresolved as of 2026-02-08). The OPTIONS request is rejected with 403 before reaching the app.

### Option B: Next.js API Route Proxy (Recommended)

The browser calls `/api/assistant/chat` (same origin, no CORS). The Next.js route handler calls the FastAPI service, translates the response, and returns a UIMessageStream.

**Pros:**
- Zero CORS issues (same-origin request from browser)
- FastAPI can stay private or use Cloud Run IAM service-to-service auth
- No custom ChatTransport needed -- `DefaultChatTransport` continues to work unchanged
- Frontend code changes are minimal (only remove old Gemini-specific logic from route handler)
- Backend URL stays server-side only (not exposed to browser)
- Can add server-side rate limiting, logging, safety checks in the proxy

**Cons:**
- Extra network hop (Next.js Cloud Run to FastAPI Cloud Run)
- Both services are in `us-central1` on Cloud Run, so inter-service latency is ~1-5ms (negligible vs. LLM response time of 1-3 seconds)

### Recommendation: Option B (Proxy)

**Use the Next.js API route proxy because:**

1. **No CORS at all.** CORS between authenticated Cloud Run services is a known pain point with no native GCP solution. Avoiding it entirely is the simplest path.
2. **FastAPI stays internal.** The chatbot service can require IAM authentication, reducing attack surface. Only the Next.js service account needs `roles/run.invoker`.
3. **Existing frontend works unchanged.** The `DefaultChatTransport({ api: "/api/assistant/chat" })` and `useChat` hook need zero modifications. Only the route handler implementation changes.
4. **Inter-service latency is negligible.** Both services run in `us-central1`. The ~1-5ms overhead is invisible compared to LLM inference time.
5. **Preserves server-side concerns.** Rate limiting, logging, and future safety checks remain in the Next.js layer without duplicating them in FastAPI.

**Confidence:** HIGH -- based on verified Cloud Run networking behavior, GCP IAM/CORS limitation (issue tracker #361387319), and confirmed Vercel AI SDK architecture.

---

## Recommended Stack Changes

### What Changes

| Area | Before | After | Why |
|------|--------|-------|-----|
| API route handler | `src/app/api/assistant/chat/route.ts` calls Gemini via `streamText()` | Same file calls FastAPI via `fetch()`, translates JSON to UIMessageStream | FastAPI is the new backend |
| Response format | Streaming UIMessageStream from `streamText().toUIMessageStreamResponse()` | Non-streaming: fetch JSON from FastAPI, write to `createUIMessageStream` | FastAPI returns JSON, not streaming |
| Gemini config | `@ai-sdk/google` provider + `gemini.ts` config | Removed (Gemini now runs inside FastAPI) | LLM moved to backend |
| Safety pipeline | `src/lib/assistant/safety.ts` runs before Gemini call | Removed or simplified (FastAPI handles its own safety) | Backend owns safety logic |
| Knowledge base | `src/data/` JSON/MD files loaded into system prompt | Removed (FastAPI uses Postgres FTS retrieval) | RAG replaces curated knowledge |
| Environment vars | `GOOGLE_GENERATIVE_AI_API_KEY` | `CHATBOT_API_URL` (server-side only) | New backend endpoint |

### What Stays the Same

| Component | Why Unchanged |
|-----------|---------------|
| `ChatInterface.tsx` | Uses `useChat` with `DefaultChatTransport({ api: "/api/assistant/chat" })` -- same API path |
| `ChatMessage.tsx` | Renders `content` string -- format unchanged |
| `ChatInput.tsx` | Sends `{ text: string }` via `sendMessage` -- unchanged |
| `TypingIndicator.tsx` | Triggered by `status === "streaming" \|\| status === "submitted"` -- unchanged |
| `FeedbackButtons.tsx` | Calls `/api/assistant/feedback` -- independent of chat backend |
| `SuggestedPrompts.tsx` | Static UI -- no backend dependency |
| `ExitRamps.tsx` | Static UI -- no backend dependency |
| `HumanHandoff.tsx` | Uses `plainMessages` computed from current messages -- unchanged |
| `MarkdownRenderer.tsx` | Parses markdown string -- format unchanged |
| `useChat` hook | Returns `{ messages, sendMessage, status, error, id }` -- unchanged |

### What Gets Removed

| Component | Why Removed |
|-----------|-------------|
| `src/lib/assistant/gemini.ts` | Gemini model config -- LLM now in FastAPI |
| `src/lib/assistant/knowledge.ts` | Curated knowledge loader -- replaced by RAG |
| `src/lib/assistant/prompts.ts` | System prompt builder -- FastAPI manages prompts |
| `src/lib/assistant/safety.ts` | Safety pipeline -- FastAPI handles safety |
| `src/lib/assistant/refusals.ts` | Static refusal messages -- FastAPI handles |
| `src/lib/assistant/filters.ts` | Input filters -- FastAPI handles |
| `src/data/` directory | Knowledge base JSON/MD files -- replaced by Postgres |
| `@ai-sdk/google` package | Google Gemini provider -- no longer used directly |

### What Gets Added (New)

| Component | Purpose |
|-----------|---------|
| `src/lib/assistant/fastapi-client.ts` | Typed fetch wrapper for FastAPI `/chat` endpoint |
| `src/lib/schemas/fastapi.ts` | Zod schemas for FastAPI request/response validation |
| Citation rendering in `ChatMessage.tsx` | Display source citations from FastAPI response |

---

## Core Integration: Route Handler Translation Layer

The new `/api/assistant/chat/route.ts` does three things:

1. **Receive** the Vercel AI SDK UIMessage format (parts-based messages)
2. **Translate** to FastAPI format (`{ messages: [{role, content}], conversation_id? }`)
3. **Call** FastAPI and translate the JSON response back to a UIMessageStream

### Schema Mapping

**Vercel AI SDK sends (UIMessage format):**
```typescript
{
  messages: [
    {
      id: "msg_123",
      role: "user",
      parts: [{ type: "text", text: "Tell me about Dan's experience" }]
    }
  ],
  id: "chat_456"  // conversation ID
}
```

**FastAPI expects:**
```typescript
{
  messages: [
    { role: "user", content: "Tell me about Dan's experience" }
  ],
  conversation_id: "chat_456"  // optional
}
```

**FastAPI returns:**
```typescript
{
  response: "Dan has extensive experience in...",
  citations: [
    { source: "resume.md", content: "relevant excerpt", line_range: [10, 15] }
  ],
  confidence: 0.92,
  conversation_id: "chat_456"
}
```

**Next.js proxy translates to UIMessageStream:**
```typescript
createUIMessageStream({
  execute: ({ writer }) => {
    // Write the response text
    writer.write({ type: "text-start", id: "resp-1" });
    writer.write({ type: "text-delta", id: "resp-1", delta: response });
    writer.write({ type: "text-end", id: "resp-1" });
    // Optionally: write citations as custom data or append to text
  },
});
```

### Key Technical Detail: Non-Streaming to Streaming Translation

The FastAPI `/chat` endpoint returns a single JSON response (not streaming). The Vercel AI SDK `useChat` hook expects a `ReadableStream<UIMessageChunk>`. The translation happens in `createUIMessageStream`:

- The proxy `await`s the full FastAPI JSON response
- Then writes it as a single text-delta chunk to the UIMessageStream
- The frontend receives it as if it were a very fast stream (one chunk)

This works because `createUIMessageStream` does not require the source to be streaming -- it creates a stream from whatever the `execute` callback writes. The `useChat` hook processes it identically to a multi-chunk stream.

**Confidence:** HIGH -- verified from `createUIMessageStream` API documentation at ai-sdk.dev, which accepts an `execute` callback with a `writer` that supports `write({ type: "text-delta", delta, id })`.

---

## Environment Variables

### New Variables

| Variable | Scope | Value | Purpose |
|----------|-------|-------|---------|
| `CHATBOT_API_URL` | Server-side only (NOT `NEXT_PUBLIC_`) | `https://chatbot-assistant-HASH-uc.a.run.app` | FastAPI service URL |

### Removed Variables

| Variable | Why Removed |
|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key -- LLM now runs in FastAPI with its own credentials |

### Unchanged Variables

All Firebase, Next.js, and GitHub variables remain unchanged.

### Cloud Build Update

The `cloudbuild.yaml` deployment step needs:
- Add `CHATBOT_API_URL` to `--set-env-vars`
- Remove `GOOGLE_GENERATIVE_AI_API_KEY` from `--update-secrets` (or keep if used elsewhere)

---

## Dependencies: What to Install / Remove

### Install: Nothing

No new npm packages are needed. The existing stack provides everything:

| Capability Needed | Already Have | Package |
|-------------------|-------------|---------|
| HTTP fetch to FastAPI | Native `fetch()` in Node.js 20 | Built-in |
| UIMessageStream creation | `createUIMessageStream` | `ai@6.0.71` |
| UIMessageStream response | `createUIMessageStreamResponse` | `ai@6.0.71` |
| Request validation | Zod schemas | `zod@^4.3.6` |
| Response validation | Zod schemas | `zod@^4.3.6` |
| Markdown rendering | Existing `MarkdownRenderer` | Custom component |
| Citation rendering | Extend `ChatMessage` | Custom component |

### Remove (After Migration)

| Package | Why Remove | When |
|---------|-----------|------|
| `@ai-sdk/google` | `^3.0.21` -- Google Gemini provider no longer called from frontend | After migration is validated and stable |

**Important:** Do not remove `@ai-sdk/google` until the migration is fully tested. Keep it during development so you can A/B test or fall back to the old implementation.

### Keep

| Package | Why Keep |
|---------|---------|
| `ai` (`6.0.71`) | `useChat`, `createUIMessageStream`, `createUIMessageStreamResponse`, `DefaultChatTransport` |
| `@ai-sdk/react` (`3.0.73`) | `useChat` hook for React |

---

## CORS Configuration (If Direct Connection Were Chosen)

**This section documents the CORS approach for reference, even though the proxy approach is recommended.**

If the frontend were to call FastAPI directly, the FastAPI backend would need:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dan-weinbeck.com", "http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
```

And the Cloud Run FastAPI service would need `--allow-unauthenticated` because:
- Browser CORS preflight sends an OPTIONS request without credentials
- Cloud Run IAM rejects unauthenticated OPTIONS requests with 403
- This is a known GCP limitation (issue tracker #361387319, unresolved)

**By using the proxy approach, none of this is needed.** The FastAPI service can stay authenticated (IAM-protected), and the Next.js service account gets `roles/run.invoker`.

---

## Service-to-Service Authentication (Proxy Approach)

When the Next.js API route calls FastAPI on Cloud Run:

### Option A: Public FastAPI Service (Simpler)

Set FastAPI Cloud Run to `--allow-unauthenticated`. The Next.js route handler calls it with a plain `fetch()`. Since the URL is server-side only (not exposed to browser), the security risk is limited to URL discovery.

### Option B: IAM-Authenticated FastAPI Service (Recommended)

1. FastAPI Cloud Run requires authentication (default, no `--allow-unauthenticated`)
2. Grant the Next.js service account `roles/run.invoker` on the FastAPI service:
   ```bash
   gcloud run services add-iam-policy-binding chatbot-assistant \
     --member="serviceAccount:cloudrun-site@PROJECT.iam.gserviceaccount.com" \
     --role="roles/run.invoker" \
     --region=us-central1
   ```
3. Fetch an ID token in the route handler:
   ```typescript
   // In route handler (server-side only)
   const metadataUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${CHATBOT_API_URL}`;
   const tokenRes = await fetch(metadataUrl, {
     headers: { "Metadata-Flavor": "Google" },
   });
   const idToken = await tokenRes.text();

   const response = await fetch(`${CHATBOT_API_URL}/chat`, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${idToken}`,
     },
     body: JSON.stringify(fastApiPayload),
   });
   ```

**Recommendation:** Start with Option A (public) for development speed. Move to Option B (IAM) before production or as a fast-follow. The code change is small (add 5 lines for token fetch).

**Confidence:** HIGH -- service-to-service auth via metadata server is the standard GCP pattern, documented at cloud.google.com/run/docs/authenticating/service-to-service.

---

## Citation Rendering Strategy

The FastAPI response includes `citations: [{ source, content, line_range }]`. These need to be displayed in the chat UI.

### Approach: Append Citations to Message Text

The simplest approach is to format citations as markdown and append them to the response text before writing to the UIMessageStream:

```typescript
let messageText = fastapiResponse.response;

if (fastapiResponse.citations?.length > 0) {
  messageText += "\n\n---\n**Sources:**\n";
  for (const cite of fastapiResponse.citations) {
    messageText += `- ${cite.source}\n`;
  }
}

writer.write({ type: "text-delta", id: "resp-1", delta: messageText });
```

This works because:
- `ChatMessage.tsx` already renders markdown via `MarkdownRenderer`
- No new component or data channel needed
- Citations appear inline with the response

### Alternative: Structured Citation Data

If richer citation rendering is needed later (collapsible quotes, hover previews), the UIMessageStream protocol supports custom data types (`data-*` prefix) that could carry structured citation objects. But this requires frontend changes to parse and render them. Defer this to a future enhancement.

**Recommendation:** Start with markdown-appended citations. Upgrade to structured data later if needed.

**Confidence:** MEDIUM -- the markdown approach is straightforward and tested via existing `MarkdownRenderer`. The custom data approach is verified to exist in the protocol but untested in this codebase.

---

## Zod Schemas for FastAPI Contract

Define TypeScript types and runtime validation for the FastAPI API contract using Zod v4 (already in the project at `^4.3.6`):

```typescript
// src/lib/schemas/fastapi.ts
import { z } from "zod";

export const fastApiCitationSchema = z.object({
  source: z.string(),
  content: z.string(),
  line_range: z.tuple([z.number(), z.number()]).optional(),
});

export const fastApiRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  conversation_id: z.string().optional(),
});

export const fastApiResponseSchema = z.object({
  response: z.string(),
  citations: z.array(fastApiCitationSchema).optional().default([]),
  confidence: z.number().min(0).max(1).optional(),
  conversation_id: z.string().optional(),
});

export type FastApiRequest = z.infer<typeof fastApiRequestSchema>;
export type FastApiResponse = z.infer<typeof fastApiResponseSchema>;
export type FastApiCitation = z.infer<typeof fastApiCitationSchema>;
```

**Why validate the FastAPI response with Zod:**
- Catches schema drift between frontend and backend at runtime
- Provides TypeScript types inferred from the schema (single source of truth)
- Fails fast with clear errors if FastAPI changes its response format
- Already the project's pattern for API validation (see `src/lib/schemas/assistant.ts`)

**Confidence:** HIGH -- Zod v4 is installed and the schema pattern matches existing codebase.

---

## What NOT to Add

| Library / Approach | Why Tempting | Why Not |
|--------------------|-------------|---------|
| `axios` | HTTP client for FastAPI calls | Native `fetch()` is sufficient for a single POST call. Axios adds 30KB for no benefit. |
| `py-ai-datastream` | Python Vercel AI SDK protocol implementation | Only needed if FastAPI streams responses. FastAPI returns JSON; the proxy handles translation. |
| `fastapi-ai-sdk` | FastAPI helper for Vercel AI SDK | Same as above -- unnecessary if using proxy approach with JSON responses. |
| Custom `ChatTransport` | Direct browser-to-FastAPI connection | Proxy approach avoids this entirely. `DefaultChatTransport` works unchanged. |
| `@ai-sdk/openai` or other provider | Replace `@ai-sdk/google` | No AI SDK provider is needed. The LLM runs inside FastAPI, not in Next.js. |
| WebSocket transport | Real-time streaming from FastAPI | Overengineered. The FastAPI response is fast enough as JSON. Add streaming later if latency becomes an issue. |
| `next-cors` | CORS middleware for Next.js | Not needed -- browser calls same origin. No CORS involved with proxy approach. |
| Identity-Aware Proxy (IAP) | CORS + auth for Cloud Run | Heavyweight GCP solution. Only needed for direct browser-to-backend calls. Proxy avoids the problem entirely. |
| API Gateway (GCP) | Routing and auth | Adds operational complexity for a two-service setup. Direct service-to-service is simpler. |

---

## Migration Path Summary

| Phase | What Changes | Risk |
|-------|-------------|------|
| 1. Add FastAPI client + schemas | New files only, no existing code touched | None |
| 2. Replace route handler internals | `route.ts` calls FastAPI instead of Gemini | Medium -- must test response format |
| 3. Add citation rendering | Extend `ChatMessage` or `MarkdownRenderer` | Low |
| 4. Remove old assistant code | Delete `src/lib/assistant/` files, `src/data/`, `@ai-sdk/google` | Low -- only after validating new path |
| 5. Update env vars + Cloud Build | Config changes | Low |

---

## Sources

- [Vercel AI SDK Transport Documentation](https://ai-sdk.dev/docs/ai-sdk-ui/transport) -- HIGH confidence (official docs)
- [Vercel AI SDK createUIMessageStream API](https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream) -- HIGH confidence (official docs)
- [Vercel AI SDK Stream Protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) -- HIGH confidence (official docs)
- [GCP Cloud Run Service-to-Service Auth](https://docs.cloud.google.com/run/docs/authenticating/service-to-service) -- HIGH confidence (official docs)
- [GCP Cloud Run CORS + IAM Limitation](https://issuetracker.google.com/issues/361387319) -- HIGH confidence (official issue tracker, unresolved)
- [FastAPI CORS Middleware](https://fastapi.tiangolo.com/tutorial/cors/) -- HIGH confidence (official docs)
- [Vercel AI SDK GitHub Discussion: FastAPI Integration](https://github.com/vercel/ai/discussions/2840) -- MEDIUM confidence (community)
- [py-ai-datastream (Python Vercel AI SDK Protocol)](https://github.com/elementary-data/py-ai-datastream) -- MEDIUM confidence (evaluated, not recommended)
- [fastapi-ai-sdk](https://github.com/doganarif/fastapi-ai-sdk) -- MEDIUM confidence (evaluated, not recommended)
