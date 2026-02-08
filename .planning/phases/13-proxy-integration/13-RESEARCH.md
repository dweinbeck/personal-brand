# Phase 13: Proxy Integration - Research

**Researched:** 2026-02-08
**Domain:** Next.js API route proxy to FastAPI RAG backend; Vercel AI SDK stream translation
**Confidence:** HIGH

## Summary

Phase 13 rewrites the existing `/api/assistant/chat` route handler to proxy requests to the external FastAPI RAG backend (`chatbot-assistant` on Cloud Run) instead of calling Gemini directly. The browser continues to POST to the same-origin `/api/assistant/chat` endpoint. The route handler extracts the user's question from the AI SDK UIMessage format, forwards it to FastAPI as `{ question: string }`, receives a JSON response `{ answer, citations, confidence }`, and translates it back into a UIMessageStream that `useChat` can consume. **Zero frontend changes are needed** -- `ChatInterface.tsx`, `DefaultChatTransport`, and `useChat` all remain untouched.

The critical research tasks identified by SUMMARY.md have been resolved:
1. **FastAPI schema discrepancy resolved.** The actual contract is `ChatRequest({ question: string })` and `ChatResponse({ answer: string, citations: [{ source, relevance }], confidence: "low"|"medium"|"high" })`. The STACK/ARCHITECTURE researchers were wrong about `response`, `messages`, `content`, `line_range`, and numeric confidence. The FEATURES researcher was correct.
2. **UIMessageChunk field names verified.** The `text-delta` chunk type uses `{ type: "text-delta", delta: string, id: string }`. This is already confirmed working in the current `route.ts` safety refusal path (line 91-93).
3. **`createUIMessageStream` usage verified.** The current codebase already uses exactly this pattern for safety refusals. The proxy handler follows the identical pattern.

**Primary recommendation:** Rewrite the route handler internals only. Keep the same file path, same HTTP interface. Extract question from UIMessage parts, POST `{ question }` to FastAPI, write the response as UIMessageStream chunks. This is the minimum viable change for end-to-end chat.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | `6.0.71` (installed) | `createUIMessageStream`, `createUIMessageStreamResponse`, `UIMessageChunk` types | Already used in existing route.ts; provides the stream translation layer |
| `zod` | `^4.3.6` (installed) | Runtime validation of FastAPI response | Already the project's validation pattern; catches schema drift between services |
| Native `fetch()` | Node.js 20 built-in | Server-to-server HTTP call to FastAPI | No HTTP client library needed for a single POST call |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@ai-sdk/react` | `3.0.73` (installed) | `useChat` hook | Already used in ChatInterface.tsx; unchanged |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Proxy route | Direct CORS (custom `ChatTransport`) | Requires making FastAPI publicly accessible; Cloud Run IAM incompatible with browser CORS preflight (GCP issue #361387319); requires building/debugging a custom ChatTransport class |
| Proxy route | Drop `useChat` entirely, use raw `fetch()` | Loses built-in message state management, status tracking, error handling, abort support |
| Native `fetch()` | `axios` | Adds 30KB for no benefit on a single POST call |

**Installation:**
```bash
# Nothing to install. Zero new dependencies.
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/api/assistant/chat/
│   └── route.ts              # REWRITE internals (same file, new implementation)
├── lib/assistant/
│   └── fastapi-client.ts     # NEW: typed fetch wrapper for FastAPI
├── lib/schemas/
│   └── fastapi.ts            # NEW: Zod schemas for FastAPI request/response
└── components/assistant/
    └── ChatInterface.tsx      # UNCHANGED
```

### Pattern 1: Thin Proxy Route with Stream Translation

**What:** The Next.js API route receives UIMessage-format requests from `useChat`, extracts the question text, calls FastAPI, and translates the JSON response into a UIMessageStream.

**When to use:** Always -- this is the core integration pattern for Phase 13.

**Example:**
```typescript
// Source: Verified against ai@6.0.71 type declarations + existing route.ts line 88-97
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

// Inside the POST handler, after receiving FastAPI JSON response:
const stream = createUIMessageStream({
  execute: ({ writer }) => {
    writer.write({
      type: "text-delta",
      delta: fastapiResponse.answer,
      id: "resp-1",
    });
  },
});
return createUIMessageStreamResponse({ stream });
```

**Confidence:** HIGH -- this exact pattern is already used in the current `route.ts` at line 88-97 for safety refusals, with the same SDK version.

### Pattern 2: Zod Validation of External Service Response

**What:** Validate the FastAPI JSON response with a Zod schema before processing. If validation fails, return a user-friendly error message.

**When to use:** Every response from FastAPI must be validated.

**Example:**
```typescript
// Source: Existing pattern in src/lib/schemas/assistant.ts
import { z } from "zod";

export const fastApiResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(z.object({
    source: z.string(),
    relevance: z.string(),
  })),
  confidence: z.enum(["low", "medium", "high"]),
});
```

### Pattern 3: Environment-Driven Backend URL

**What:** Use a server-side-only `CHATBOT_API_URL` env var (NOT `NEXT_PUBLIC_`).

**When to use:** Always. The URL stays server-side because the proxy handles the call.

**Example:**
```typescript
const CHATBOT_API_URL = process.env.CHATBOT_API_URL;
if (!CHATBOT_API_URL) {
  // Return error response -- missing config
}
const res = await fetch(`${CHATBOT_API_URL}/chat`, { ... });
```

### Anti-Patterns to Avoid

- **Exposing FastAPI URL to browser:** Do NOT use `NEXT_PUBLIC_CHATBOT_API_URL`. The proxy keeps the backend URL private.
- **Building a custom ChatTransport:** Unnecessary with the proxy approach. `DefaultChatTransport` continues to work unchanged.
- **Trying to stream from FastAPI:** FastAPI returns a single JSON response, not SSE. Accept it as JSON, write it as one `text-delta` chunk. The user sees the full response appear at once (identical to a very fast stream).
- **Keeping old imports:** Do not leave dead imports to `gemini.ts`, `safety.ts`, `prompts.ts`, etc. in the rewritten route.
- **Sending full conversation history to FastAPI:** The FastAPI `/chat` endpoint accepts `{ question: string }`, NOT a messages array. Extract only the last user message's text.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stream translation | Custom SSE encoder | `createUIMessageStream` + `createUIMessageStreamResponse` | Already in the codebase, handles SSE framing, `[DONE]` sentinel, error formatting |
| Response validation | Manual JSON shape checking | `zod` schema with `.safeParse()` | Type inference, clear error messages, already the project pattern |
| HTTP client | `axios`, `got`, `node-fetch` | Native `fetch()` | Built into Node.js 20, zero dependencies, sufficient for one POST call |
| Request timeout | Manual `setTimeout` + reject | `AbortSignal.timeout(ms)` | Built-in API, cleaner than manual abort controller management |

**Key insight:** The existing `route.ts` already demonstrates the exact `createUIMessageStream` pattern needed for the proxy. The only change is the data source: FastAPI JSON instead of `streamText()`.

## Common Pitfalls

### Pitfall 1: UIMessage Parts Extraction

**What goes wrong:** The `useChat` hook sends messages in UIMessage format with a `parts` array (`[{ type: "text", text: "..." }]`), not a simple `content` string. If the proxy tries to access `message.content`, it gets `undefined`.

**Why it happens:** The AI SDK v5 changed from `content: string` to `parts: Part[]` for messages.

**How to avoid:** Extract text from parts, exactly as the current route.ts does at lines 69-74:
```typescript
const text = msg.parts
  ?.filter((p) => p.type === "text" && p.text)
  .map((p) => p.text)
  .join("");
```

**Warning signs:** FastAPI returns 422 validation error because `question` is empty string.

### Pitfall 2: FastAPI Returns 422 for Invalid Input

**What goes wrong:** FastAPI's Pydantic validation rejects requests where `question` is empty (`min_length=1`) or longer than 1000 characters (`max_length=1000`). The 422 response body is `{ detail: [{ loc, msg, type }] }`, not a simple error string.

**Why it happens:** Pydantic validation errors have a specific JSON structure that differs from the expected `ChatResponse` schema.

**How to avoid:** Handle 422 responses separately in the proxy. Either validate the question length before calling FastAPI, or parse the 422 response and return a user-friendly error.

**Warning signs:** Chat shows "Something went wrong" for very short or very long messages.

### Pitfall 3: Missing `CHATBOT_API_URL` Environment Variable

**What goes wrong:** The route handler calls `process.env.CHATBOT_API_URL` which is `undefined` in development if not set in `.env.local`. The `fetch()` call fails with an unhelpful error.

**Why it happens:** New env var not documented or added to local dev setup.

**How to avoid:** Check for the env var at the top of the handler and return a clear 503 error. Add it to `.env.local.example` with documentation.

**Warning signs:** Fetch error with `TypeError: Failed to parse URL from undefined/chat`.

### Pitfall 4: No Timeout on FastAPI Call

**What goes wrong:** FastAPI cold start + LLM inference can take 10-15 seconds. Without a timeout, the user stares at a loading indicator indefinitely if the service is down or very slow.

**Why it happens:** Native `fetch()` has no default timeout.

**How to avoid:** Use `AbortSignal.timeout(15000)` (15 seconds) on the fetch call:
```typescript
const res = await fetch(url, {
  signal: AbortSignal.timeout(15_000),
  ...
});
```

**Warning signs:** Chat loading indicator spins forever when FastAPI is unresponsive.

### Pitfall 5: Forgetting Citations in Stream Translation

**What goes wrong:** The proxy writes only `fastapiResponse.answer` to the UIMessageStream but ignores `citations` and `confidence`. The chat works but has no source attribution.

**Why it happens:** Getting the basic text response working feels like "done." Citations are deferred and forgotten.

**How to avoid:** For Phase 13 (minimum viable), append citations as markdown to the response text before writing to the stream. This ensures citations are visible even without a dedicated UI component (which comes in a later phase):
```typescript
let text = response.answer;
if (response.citations.length > 0) {
  text += "\n\n---\n**Sources:**\n";
  for (const cite of response.citations) {
    text += `- ${cite.source}\n`;
  }
}
```

**Warning signs:** Chat answers appear but no source information is visible.

## Code Examples

### Example 1: The Actual FastAPI Request/Response Contract

Verified from `/Users/dweinbeck/Documents/chatbot-assistant/app/schemas/chat.py` (HIGH confidence):

```python
# REQUEST: POST /chat
class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)

# RESPONSE: 200 OK
class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]
    confidence: str = Field(description="low, medium, or high")

class Citation(BaseModel):
    source: str   # "owner/repo/path@sha:start_line-end_line"
    relevance: str  # "How this chunk relates to the answer"
```

Example response JSON (from test_chat_router.py):
```json
{
  "answer": "The hello function returns 'world'.",
  "citations": [
    {
      "source": "testowner/testrepo/src/main.py@abc1234567890123456789012345678901234567:1-10",
      "relevance": "defines hello function"
    }
  ],
  "confidence": "high"
}
```

### Example 2: UIMessageChunk Text-Delta Type

Verified from `node_modules/ai/dist/index.d.ts` line 1802-1805 (HIGH confidence):

```typescript
// The text-delta variant of UIMessageChunk
{
  type: 'text-delta';
  delta: string;         // The text content
  id: string;            // Part identifier
  providerMetadata?: ProviderMetadata;  // Optional
}
```

**Critical note:** The field is `delta` (not `textDelta`, not `text`). This resolves the LOW-confidence item from ARCHITECTURE.md.

### Example 3: Existing createUIMessageStream Usage in Current Codebase

From `/Users/dweinbeck/Documents/personal-brand/src/app/api/assistant/chat/route.ts` lines 88-97 (HIGH confidence -- already working in production):

```typescript
const stream = createUIMessageStream({
  execute: ({ writer }) => {
    writer.write({
      type: "text-delta",
      delta: safetyResult.refusalMessage!,
      id: "safety-refusal",
    });
  },
});
return createUIMessageStreamResponse({ stream });
```

### Example 4: Proxy Route Handler Skeleton

Based on all verified patterns above:

```typescript
// src/app/api/assistant/chat/route.ts
export const dynamic = "force-dynamic";

import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { fastApiResponseSchema } from "@/lib/schemas/fastapi";

const CHATBOT_API_URL = process.env.CHATBOT_API_URL;

export async function POST(request: Request) {
  if (!CHATBOT_API_URL) {
    return new Response(
      JSON.stringify({ error: "Assistant service not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // 1. Parse the AI SDK request body
  let body: { messages?: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }> };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. Extract the last user message text from UIMessage parts
  const lastUserMsg = body.messages?.findLast((m) => m.role === "user");
  const question = lastUserMsg?.parts
    ?.filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("") ?? "";

  if (!question) {
    return new Response(
      JSON.stringify({ error: "No question provided" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // 3. Call FastAPI
  let fastapiRes: Response;
  try {
    fastapiRes = await fetch(`${CHATBOT_API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
    return new Response(
      JSON.stringify({
        error: isTimeout
          ? "The assistant is taking too long. Please try again."
          : "Unable to reach the assistant. Please try again.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // 4. Handle non-200 responses from FastAPI
  if (!fastapiRes.ok) {
    const status = fastapiRes.status;
    const errorMsg = status === 429
      ? "Too many messages. Please wait a moment."
      : "Something went wrong. Please try again.";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: status >= 500 ? 502 : status, headers: { "Content-Type": "application/json" } },
    );
  }

  // 5. Parse and validate FastAPI response
  const raw = await fastapiRes.json();
  const parsed = fastApiResponseSchema.safeParse(raw);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid response from assistant." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const data = parsed.data;

  // 6. Build response text (with citations as markdown for now)
  let text = data.answer;
  if (data.citations.length > 0) {
    text += "\n\n---\n**Sources:**\n";
    for (const cite of data.citations) {
      text += `- ${cite.source}\n`;
    }
  }

  // 7. Return as UIMessageStream
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({
        type: "text-delta",
        delta: text,
        id: "fastapi-response",
      });
    },
  });
  return createUIMessageStreamResponse({ stream });
}
```

### Example 5: Zod Schema for FastAPI Contract

```typescript
// src/lib/schemas/fastapi.ts
import { z } from "zod";

export const fastApiCitationSchema = z.object({
  source: z.string(),
  relevance: z.string(),
});

export const fastApiResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(fastApiCitationSchema),
  confidence: z.enum(["low", "medium", "high"]),
});

export type FastApiResponse = z.infer<typeof fastApiResponseSchema>;
export type FastApiCitation = z.infer<typeof fastApiCitationSchema>;
```

### Example 6: FastAPI Client Wrapper

```typescript
// src/lib/assistant/fastapi-client.ts
import { fastApiResponseSchema, type FastApiResponse } from "@/lib/schemas/fastapi";

const CHATBOT_API_URL = process.env.CHATBOT_API_URL;

export class FastApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public isTimeout: boolean = false,
  ) {
    super(message);
    this.name = "FastApiError";
  }
}

export async function askFastApi(question: string): Promise<FastApiResponse> {
  if (!CHATBOT_API_URL) {
    throw new FastApiError("CHATBOT_API_URL not configured", 503);
  }

  let res: Response;
  try {
    res = await fetch(`${CHATBOT_API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
    throw new FastApiError(
      isTimeout ? "Request timed out" : "Network error",
      503,
      isTimeout,
    );
  }

  if (!res.ok) {
    throw new FastApiError(`FastAPI returned ${res.status}`, res.status);
  }

  const raw = await res.json();
  const parsed = fastApiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new FastApiError("Invalid response shape from FastAPI", 502);
  }

  return parsed.data;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AI SDK `streamText()` + `toUIMessageStreamResponse()` | `createUIMessageStream` + manual writer for non-streaming sources | AI SDK v5 (late 2025) | Enables proxying non-streaming backends through the AI SDK stream protocol |
| `message.content` string | `message.parts` array with typed parts | AI SDK v5 (late 2025) | Must extract text from parts, not read `content` directly |
| `GOOGLE_GENERATIVE_AI_API_KEY` for direct Gemini calls | External FastAPI service handles LLM | This migration | Gemini key no longer needed in Next.js |

**Deprecated/outdated:**
- The ARCHITECTURE.md research recommended a **custom `ChatTransport`** with direct CORS. This is superseded by the SUMMARY.md proxy recommendation, which was adopted in STATE.md as the final decision. Do NOT build a custom ChatTransport.
- The ARCHITECTURE.md used `textDelta` as the field name for the text-delta chunk type. The actual field name is `delta` (verified from type declarations). The existing `route.ts` already uses `delta` correctly.
- The STACK/ARCHITECTURE researchers reported the FastAPI request format as `{ messages: [{role, content}], conversation_id }`. The actual format is `{ question: string }`. This is the most critical discrepancy resolved by this research.

## Resolved Discrepancies

These were flagged in SUMMARY.md as requiring resolution. All are now resolved.

### 1. FastAPI Request Format

| Source | Claimed Format | Actual Format |
|--------|---------------|---------------|
| ARCHITECTURE.md | `{ messages: [{role, content}], conversation_id }` | **`{ question: string }`** |
| STACK.md | `{ messages: [{role, content}], conversation_id? }` | **`{ question: string }`** |
| FEATURES.md | `{ question: string }` | **Correct** |
| Actual `chat.py` | `ChatRequest(question: str)` | **Ground truth** |

**Impact on implementation:** The proxy extracts only the last user message's text and sends it as a single `question` string. It does NOT send a messages array or conversation_id. This is simpler than the prior research assumed.

### 2. FastAPI Response Format

| Source | Claimed Fields | Actual Fields |
|--------|---------------|---------------|
| ARCHITECTURE.md | `response`, `content`, `line_range`, numeric `confidence` | **Wrong** |
| STACK.md | `response`, `content`, `line_range`, numeric `confidence` | **Wrong** |
| FEATURES.md | `answer`, `relevance`, string `confidence` | **Correct** |
| Actual `chat.py` | `answer: str, citations: [{source, relevance}], confidence: "low"\|"medium"\|"high"` | **Ground truth** |

**Impact on implementation:** The Zod schema uses `answer` (not `response`), `relevance` (not `content`), no `line_range` field, and `z.enum(["low", "medium", "high"])` (not `z.number()`).

### 3. UIMessageChunk text-delta Field Name

| Source | Claimed Field | Actual Field |
|--------|--------------|--------------|
| ARCHITECTURE.md | `textDelta` (LOW confidence) | **`delta`** |
| Current `route.ts` line 92 | `delta` (already working) | **Confirmed** |
| `node_modules/ai/dist/index.d.ts` line 1803 | `delta: string` | **Ground truth** |

**Impact on implementation:** Use `{ type: "text-delta", delta: text, id: "..." }`. This is already proven working in the current codebase.

### 4. No `conversation_id` in FastAPI API

The FastAPI `ChatRequest` schema has only `question: string`. There is no `conversation_id` field. The backend does not track multi-turn conversation state at the API level. Each question is independent.

**Impact on implementation:** The proxy does not need to track or forward a conversation ID. This simplifies the implementation significantly.

## Open Questions

### 1. CORS on FastAPI for Non-Proxy Consumers

**What we know:** Phase 13 uses a proxy, so CORS is not needed for the website. But the FastAPI `main.py` currently has no CORSMiddleware configured.

**What's unclear:** Will any future consumer (mobile app, CLI tool) need direct CORS access?

**Recommendation:** Not a Phase 13 concern. If CORS is needed later, add it to the FastAPI service. The proxy approach works regardless.

### 2. Service-to-Service IAM Authentication

**What we know:** The proxy can optionally add an IAM ID token when calling FastAPI, allowing FastAPI to stay private (no `--allow-unauthenticated`). This requires ~5 lines of code to fetch from the GCP metadata server.

**What's unclear:** Is FastAPI currently deployed with IAM authentication required, or is it public?

**Recommendation:** Start with no IAM auth (simple fetch). Add IAM auth as a fast-follow or in Phase 14 (env cleanup). The code change is small:
```typescript
// Only needed if FastAPI requires IAM auth
const metadataUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${CHATBOT_API_URL}`;
const tokenRes = await fetch(metadataUrl, { headers: { "Metadata-Flavor": "Google" } });
const idToken = await tokenRes.text();
// Then add Authorization: Bearer ${idToken} to the FastAPI fetch
```

### 3. Conversation Logging Disposition

**What we know:** The current route.ts calls `logConversation()` which writes to Firestore. This populates the admin analytics dashboard. After rewriting the route, this logging is lost.

**What's unclear:** Is the admin analytics dashboard being kept, or is it being removed in a later phase?

**Recommendation:** Phase 13 scope is "end-to-end chat working." Conversation logging is out of scope. The FastAPI backend has its own observability via structlog. Address admin dashboard and logging in the cleanup phase.

### 4. Citation Rendering Strategy (Markdown vs Structured)

**What we know:** For Phase 13, appending citations as markdown to the response text is the simplest approach and works with the existing `MarkdownRenderer`.

**What's unclear:** Will a later phase add structured citation UI (collapsible, clickable GitHub links)?

**Recommendation:** Phase 13 uses markdown-appended citations. This ensures citations are visible from day one. A later phase can add `CitationList` and `ConfidenceBadge` components with richer rendering.

## Sources

### Primary (HIGH confidence)
- `/Users/dweinbeck/Documents/chatbot-assistant/app/schemas/chat.py` -- FastAPI request/response contract (ground truth)
- `/Users/dweinbeck/Documents/chatbot-assistant/app/routers/chat.py` -- Chat endpoint implementation + orchestration flow
- `/Users/dweinbeck/Documents/chatbot-assistant/tests/test_chat_router.py` -- Test cases showing actual request/response examples
- `/Users/dweinbeck/Documents/chatbot-assistant/app/main.py` -- FastAPI app setup (no CORS middleware)
- `/Users/dweinbeck/Documents/chatbot-assistant/app/config.py` -- Settings (port 8080, no CORS/auth config)
- `/Users/dweinbeck/Documents/chatbot-assistant/app/services/retrieval.py` -- Citation source format (`owner/repo/path@sha:start-end`)
- `/Users/dweinbeck/Documents/personal-brand/node_modules/ai/dist/index.d.ts` lines 1797-1913 -- `UIMessageChunk` type definition
- `/Users/dweinbeck/Documents/personal-brand/node_modules/ai/dist/index.d.ts` lines 3789-3817 -- `createUIMessageStream` and `createUIMessageStreamResponse` signatures
- `/Users/dweinbeck/Documents/personal-brand/src/app/api/assistant/chat/route.ts` -- Current route handler (the file being rewritten)
- `/Users/dweinbeck/Documents/personal-brand/src/components/assistant/ChatInterface.tsx` -- Frontend chat component (unchanged by this phase)
- `/Users/dweinbeck/Documents/personal-brand/src/lib/schemas/assistant.ts` -- Existing Zod schema pattern

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md` -- Milestone-level research with proxy recommendation
- `.planning/research/STACK.md` -- Technology stack analysis (FastAPI schema assumptions were incorrect)
- `.planning/research/ARCHITECTURE-fastapi-integration.md` -- Architecture patterns (proxy vs CORS analysis correct; schema assumptions were incorrect)
- `.planning/research/PITFALLS.md` -- Comprehensive pitfall catalog
- `.planning/research/FEATURES.md` -- Feature landscape (FastAPI schema was correct here)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all verified in installed packages
- Architecture: HIGH -- proxy pattern confirmed by SUMMARY.md decision; UIMessageChunk types verified from actual type declarations; existing codebase already demonstrates the exact `createUIMessageStream` pattern needed
- Pitfalls: HIGH -- all pitfalls verified against actual FastAPI schemas and AI SDK types
- FastAPI contract: HIGH -- resolved from actual Python source code, verified against test cases

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (stable -- both `ai@6.0.71` and FastAPI schemas are pinned)
