# Architecture Patterns: FastAPI Backend Integration

**Domain:** Frontend-to-FastAPI backend integration (replacing internal assistant backend)
**Researched:** 2026-02-08
**Overall confidence:** HIGH (based on direct codebase analysis + verified AI SDK v5 transport documentation)

## Executive Summary

The current assistant architecture is a monolith: the Next.js API route (`/api/assistant/chat`) owns the full pipeline from rate limiting through safety filtering, knowledge base assembly, LLM invocation (Gemini 2.0 Flash via Vercel AI SDK), to Firestore logging. The new architecture moves LLM orchestration, retrieval, and knowledge management to an external FastAPI service, leaving the Next.js frontend as a thin client that communicates directly with FastAPI via CORS.

The critical architectural decision is **how `useChat` talks to the FastAPI backend**. The Vercel AI SDK v5 `DefaultChatTransport` expects the backend to respond with SSE-formatted UI Message Stream Protocol events. The FastAPI `/chat` endpoint returns a single JSON response `{response, citations, confidence, conversation_id}` -- not an SSE stream. This mismatch requires a **custom `ChatTransport` implementation** that sends the request to FastAPI, receives the JSON response, and wraps it into a `ReadableStream<UIMessageChunk>` that `useChat` can consume. This is the linchpin of the integration.

---

## Current Architecture (Before)

```
Browser
  |
  v
ChatInterface (useChat + DefaultChatTransport)
  |
  | POST /api/assistant/chat
  | Body: { messages: [{id, role, parts}], id }
  | Response: SSE (UI Message Stream Protocol)
  v
Next.js API Route (route.ts)
  |-- Rate limiting (in-memory Map)
  |-- Request validation (Zod schema)
  |-- Message format conversion (parts -> content string)
  |-- Safety pipeline (sanitize -> detect -> refuse)
  |-- System prompt assembly (knowledge base files)
  |-- streamText() -> Gemini 2.0 Flash
  |-- Firestore logging (fire-and-forget)
  |
  v
SSE stream back to browser via toUIMessageStreamResponse()
```

### Current Component Inventory

**API Routes (server):**
| File | Purpose | Stays/Removed |
|------|---------|---------------|
| `src/app/api/assistant/chat/route.ts` | Chat orchestration | **REMOVE** |
| `src/app/api/assistant/feedback/route.ts` | Feedback logging to Firestore | **KEEP** (still needed for FeedbackButtons) |
| `src/app/api/assistant/facts/route.ts` | Admin facts CRUD | **REMOVE** (knowledge now in backend DB) |
| `src/app/api/assistant/prompt-versions/route.ts` | Prompt version rollback | **REMOVE** (prompt management moves to backend) |
| `src/app/api/assistant/reindex/route.ts` | Clear knowledge cache | **REMOVE** (no local cache anymore) |

**Backend Services (server):**
| File | Purpose | Stays/Removed |
|------|---------|---------------|
| `src/lib/assistant/gemini.ts` | Gemini model config | **REMOVE** |
| `src/lib/assistant/safety.ts` | Safety pipeline orchestrator | **REMOVE** |
| `src/lib/assistant/filters.ts` | Input sanitization + blocked content detection | **REMOVE** |
| `src/lib/assistant/refusals.ts` | Pre-approved refusal messages | **REMOVE** |
| `src/lib/assistant/knowledge.ts` | Knowledge base file loader + cache | **REMOVE** |
| `src/lib/assistant/prompts.ts` | System prompt builder | **REMOVE** |
| `src/lib/assistant/rate-limit.ts` | In-memory rate limiter | **REMOVE** |
| `src/lib/assistant/logging.ts` | Firestore conversation + feedback logging | **KEEP** (feedback route still uses `logFeedback`) |
| `src/lib/assistant/analytics.ts` | Analytics aggregation from Firestore | **DECISION NEEDED** (see Admin section) |
| `src/lib/assistant/facts-store.ts` | Firestore facts CRUD | **REMOVE** |
| `src/lib/assistant/prompt-versions.ts` | Firestore prompt versioning | **REMOVE** |
| `src/lib/assistant/lead-capture.ts` | Hiring intent detection + Firestore lead storage | **KEEP** (client-side pattern matching still useful) |
| `src/lib/assistant/handoff.ts` | mailto link builder | **KEEP** (pure utility, no backend dependency) |
| `src/lib/schemas/assistant.ts` | Zod schema for chat request | **REMOVE** (no longer validating on our server) |

**Data Files (server):**
| File | Purpose | Stays/Removed |
|------|---------|---------------|
| `src/data/faq.json` | FAQ knowledge | **REMOVE** (now in backend Postgres) |
| `src/data/canon.json` | Canonical facts | **REMOVE** |
| `src/data/projects.json` | Project descriptions | **REMOVE** |
| `src/data/contact.json` | Contact info | **REMOVE** |
| `src/data/writing.json` | Writing catalog | **REMOVE** |
| `src/data/services.md` | Services description | **REMOVE** |
| `src/data/accomplishments.json` | Accomplishments | **REMOVE** |
| `src/data/safety-rules.json` | Safety regex patterns | **REMOVE** (safety handled by backend) |
| `src/data/approved-responses.json` | Refusal message templates | **REMOVE** |

**UI Components (client):**
| File | Purpose | Stays/Modified/Removed |
|------|---------|------------------------|
| `ChatInterface.tsx` | Main chat container, useChat hook | **MODIFY** (new transport, citations state) |
| `ChatInput.tsx` | Text input + send button | **KEEP AS-IS** |
| `ChatMessage.tsx` | Message bubble rendering | **MODIFY** (add citations display) |
| `ChatHeader.tsx` | Chat header bar | **KEEP AS-IS** |
| `MarkdownRenderer.tsx` | Markdown to React elements | **KEEP AS-IS** |
| `FeedbackButtons.tsx` | Thumbs up/down feedback | **KEEP AS-IS** (still posts to `/api/assistant/feedback`) |
| `TypingIndicator.tsx` | Loading animation | **KEEP AS-IS** |
| `SuggestedPrompts.tsx` | Initial prompt suggestions | **KEEP AS-IS** |
| `ExitRamps.tsx` | Navigation links out of chat | **KEEP AS-IS** |
| `HumanHandoff.tsx` | "Talk to Dan directly" mailto | **KEEP AS-IS** |
| `PrivacyDisclosure.tsx` | Privacy notice | **KEEP AS-IS** |
| `LeadCaptureFlow.tsx` | Lead capture form | **KEEP AS-IS** |

**Admin Pages:**
| File | Purpose | Stays/Modified/Removed |
|------|---------|------------------------|
| `control-center/assistant/page.tsx` | Analytics dashboard | **DECISION NEEDED** |
| `control-center/assistant/facts/page.tsx` | Facts editor + prompt versions | **REMOVE** (managed by backend) |

**Admin Components:**
| File | Purpose | Stays/Modified/Removed |
|------|---------|------------------------|
| `AssistantAnalytics.tsx` | Analytics display | **DECISION NEEDED** |
| `TopQuestions.tsx` | Top questions list | **DECISION NEEDED** |
| `UnansweredQuestions.tsx` | Safety-blocked list | **DECISION NEEDED** |
| `FactsEditor.tsx` | Facts CRUD UI | **REMOVE** |
| `PromptVersions.tsx` | Prompt version UI | **REMOVE** |
| `ReindexButton.tsx` | Cache clear button | **REMOVE** |

---

## New Architecture (After)

```
Browser
  |
  v
ChatInterface (useChat + FastAPIChatTransport)
  |
  | POST https://chatbot-assistant-XXXXX.run.app/chat
  | Body: { messages: [{role, content}], conversation_id? }
  | Response: JSON { response, citations, confidence, conversation_id }
  | (Direct CORS connection, no proxy)
  v
FastAPI Backend (separate Cloud Run instance)
  |-- Input validation
  |-- Safety filtering
  |-- RAG retrieval (Postgres FTS + pg_trgm)
  |-- System prompt assembly
  |-- Gemini 2.5 Flash-Lite generation
  |-- Citation extraction
  |-- Conversation tracking
  v
JSON response back to browser
```

### Key Integration Points

1. **Custom ChatTransport** -- The bridge between `useChat` and FastAPI
2. **CORS configuration** -- FastAPI must allow the frontend origin
3. **Schema mapping** -- FastAPI JSON response to UIMessage parts
4. **Citations rendering** -- New UI element in ChatMessage
5. **Feedback persistence** -- FeedbackButtons still hits Next.js `/api/assistant/feedback`

---

## Critical: Custom ChatTransport Implementation

### Why DefaultChatTransport Will Not Work

`DefaultChatTransport` extends `HttpChatTransport`, which:
1. Sends a POST with body `{ id, messages, trigger, messageId, ...body }` where `messages` are UIMessage objects with `parts` arrays
2. Expects the response to be an SSE stream in the UI Message Stream Protocol format
3. Parses the response through `parseJsonEventStream()` expecting `UIMessageChunk` objects

The FastAPI backend:
1. Expects `{ messages: [{role, content}], conversation_id? }` -- simpler format, no `parts`
2. Returns a single JSON response `{ response, citations, confidence, conversation_id }` -- not SSE
3. Has no awareness of the Vercel AI SDK stream protocol

**These are incompatible.** A custom transport is required.

### Custom Transport Design

The `ChatTransport` interface requires implementing two methods:

```typescript
interface ChatTransport<UI_MESSAGE extends UIMessage> {
  sendMessages(options: {
    trigger: 'submit-message' | 'regenerate-message';
    chatId: string;
    messageId: string | undefined;
    messages: UI_MESSAGE[];
    abortSignal: AbortSignal | undefined;
  }): Promise<ReadableStream<UIMessageChunk>>;

  reconnectToStream(options: {
    chatId: string;
  }): Promise<ReadableStream<UIMessageChunk> | null>;
}
```

Source: [ChatTransport interface definition](https://github.com/vercel/ai/blob/main/packages/ai/src/ui/chat-transport.ts) (HIGH confidence)

The custom transport (`FastAPIChatTransport`) must:

1. **Transform the request:** Convert UIMessage `parts` to `{role, content}` pairs
2. **POST to FastAPI:** Send `{messages, conversation_id}` to the FastAPI URL
3. **Transform the response:** Convert the JSON response into a `ReadableStream<UIMessageChunk>` by emitting synthetic chunks that `useChat` can process
4. **Surface citations:** Via a side-channel callback

### Schema Mapping: FastAPI Response to UIMessage

**FastAPI request format:**
```json
{
  "messages": [
    {"role": "user", "content": "Tell me about Dan's projects"},
    {"role": "assistant", "content": "Dan has worked on..."},
    {"role": "user", "content": "What about AI specifically?"}
  ],
  "conversation_id": "conv_abc123"
}
```

**FastAPI response format:**
```json
{
  "response": "Dan has worked on several AI projects...",
  "citations": [
    {
      "source": "projects.json",
      "content": "AI-powered personal assistant...",
      "line_range": [10, 15]
    }
  ],
  "confidence": 0.92,
  "conversation_id": "conv_abc123"
}
```

**Must produce UIMessageChunks that result in:**
```typescript
// UIMessage after processing
{
  id: "msg_xxx",
  role: "assistant",
  parts: [
    { type: "text", text: "Dan has worked on several AI projects..." }
  ]
}
```

### UIMessageChunk Format (LOW Confidence)

The exact `UIMessageChunk` type names and field shapes must be verified at implementation time against the actual TypeScript types exported from the `ai` package. The chunk type is a discriminated union, and based on stream protocol documentation, the relevant types include:

- `text-delta` -- incremental text content
- `message-start` -- beginning of a new message
- `finish-message` -- message completion

However, the exact TypeScript field names (e.g., `textDelta` vs `delta` vs `text`) are **not fully documented publicly** and must be verified by inspecting `node_modules/ai/dist/` type declarations during implementation.

**Verification strategy:** At implementation time, write a small test that imports `UIMessageChunk` from `ai` and inspects its type definition. Alternatively, look at how `DefaultChatTransport.processResponseStream()` constructs chunks.

### Citations Data Flow

**Recommended approach: Side-channel callback**

The custom transport accepts an `onCitations` callback. When the FastAPI response arrives, the transport calls `onCitations(messageId, citations)` before emitting the UIMessageChunks. ChatInterface stores citations in component state, keyed by message ID.

```typescript
// In ChatInterface:
const [citationsByMessage, setCitationsByMessage] = useState<
  Record<string, Citation[]>
>({});

const transport = useMemo(() => new FastAPIChatTransport({
  api: process.env.NEXT_PUBLIC_CHATBOT_API_URL!,
  onCitations: (messageId, citations) => {
    setCitationsByMessage(prev => ({ ...prev, [messageId]: citations }));
  },
}), []);
```

**Why this approach over data parts:**
- Simpler: no dependency on AI SDK data parts format (which is documented as being for "dynamic content, loading states, interactive components" -- citations are static per-response)
- Easier to test: mock the callback, verify it receives correct data
- Decoupled: if we ever drop `useChat`, the citation state management is independent
- The data parts API is less documented and has had reported issues with custom backends

**Alternative considered: AI SDK data parts.**
Emit `data-part-start` / `data-part-available` chunks in the stream to embed citations in the message itself. This keeps data collocated but requires deeper knowledge of an internal API. Defer to a future iteration if needed.

---

## Data Flow Comparison

### Old Data Flow (Chat Request)
```
1. User types message in ChatInput
2. ChatInterface calls sendMessage({ text })
3. useChat via DefaultChatTransport POSTs to /api/assistant/chat
4. route.ts: rate limit check (in-memory)
5. route.ts: Zod validation
6. route.ts: parts -> content conversion
7. route.ts: safety pipeline (sanitize, detect, refuse OR continue)
8. route.ts: buildSystemPrompt() loads src/data/*.json files
9. route.ts: streamText() calls Gemini 2.0 Flash
10. route.ts: toUIMessageStreamResponse() streams SSE back
11. useChat processes SSE stream, updates messages array
12. ChatMessage renders via MarkdownRenderer
13. route.ts onFinish: logConversation() writes to Firestore
```

### New Data Flow (Chat Request)
```
1. User types message in ChatInput
2. ChatInterface calls sendMessage({ text })
3. useChat via FastAPIChatTransport:
   a. Converts UIMessage parts to {role, content} pairs
   b. POSTs to https://chatbot-assistant-XXXXX.run.app/chat
   c. Body: { messages: [{role, content}], conversation_id }
4. FastAPI backend:
   a. Validates input
   b. Safety filtering
   c. RAG retrieval (Postgres FTS)
   d. Gemini 2.5 Flash-Lite generation
   e. Citation extraction
   f. Returns JSON: { response, citations, confidence, conversation_id }
5. FastAPIChatTransport:
   a. Calls onCitations(messageId, citations)
   b. Wraps response text in ReadableStream<UIMessageChunk>
   c. Emits chunk(s) that useChat can process
6. useChat processes the stream, updates messages array
7. ChatMessage renders response via MarkdownRenderer
8. CitationList renders below the message (new component)
```

### Feedback Flow (UNCHANGED)
```
1. User clicks thumbs up/down on FeedbackButtons
2. FeedbackButtons POSTs to /api/assistant/feedback
3. feedback/route.ts validates and calls logFeedback()
4. logFeedback() writes to Firestore
```

Feedback flow is completely unchanged. The `/api/assistant/feedback` route and its Firestore backing remain intact.

---

## Component Boundaries

### Frontend (Next.js on Cloud Run)
| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `ChatInterface` | Chat state management, transport setup, citations state | FastAPIChatTransport, child components |
| `FastAPIChatTransport` | Request/response transformation, CORS fetch | FastAPI backend (direct) |
| `ChatMessage` | Message rendering + citations display | CitationList (new child) |
| `CitationList` (NEW) | Renders source citations below a message | None (pure display) |
| `FeedbackButtons` | Feedback submission | Next.js `/api/assistant/feedback` |
| `/api/assistant/feedback` | Feedback validation + Firestore write | Firestore |

### Backend (FastAPI on Cloud Run)
| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `POST /chat` | Chat orchestration | Postgres, Gemini, internal modules |
| `POST /webhooks/github` | Repo indexing trigger | Cloud Tasks, Postgres |
| `GET /health` | Liveness/readiness | None |
| Postgres | Knowledge store, FTS retrieval | FastAPI |
| Cloud Tasks | Async indexing jobs | FastAPI, GitHub API |

---

## CORS Configuration

The FastAPI backend must configure CORS to allow the frontend origin:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dan-weinbeck.com",
        "https://www.dan-weinbeck.com",
        "http://localhost:3000",  # Local dev
    ],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    allow_credentials=False,
)
```

**No authentication tokens** are needed for the public `/chat` endpoint (rate limiting is handled by the FastAPI backend). The frontend domain origin is the only access control.

**CORS preflight caching:** FastAPI should set `Access-Control-Max-Age` header (e.g., 3600 seconds) so browsers cache the preflight response and avoid the OPTIONS request on subsequent messages within the same session.

---

## Environment Configuration

### New Environment Variables (Frontend)

```bash
# .env.local (development)
NEXT_PUBLIC_CHATBOT_API_URL=http://localhost:8000

# Cloud Run (production)
NEXT_PUBLIC_CHATBOT_API_URL=https://chatbot-assistant-XXXXX.run.app
```

The URL must be `NEXT_PUBLIC_` prefixed because the custom transport runs in the browser (client-side fetch to FastAPI). This is the only new env var needed.

### Removed Environment Variables (Frontend)

The following are no longer needed if they were only used for the assistant:
- `GOOGLE_GENERATIVE_AI_API_KEY` (Gemini called from backend now)

Firebase credentials remain (still needed for feedback logging via `/api/assistant/feedback`).

---

## Admin Dashboard Decision

The admin dashboard (`/control-center/assistant/`) currently reads from Firestore collections that are populated by the Next.js chat route's `logConversation()` calls. With the backend handling conversations, these Firestore collections will no longer be populated (the chat route is being deleted).

**Options:**

1. **Remove entirely** -- Simplest. Analytics move to the FastAPI backend's own tooling or monitoring.
2. **Rebuild against FastAPI** -- The admin dashboard fetches analytics from a new FastAPI admin endpoint. Requires adding admin endpoints to the FastAPI service.
3. **Keep for feedback only** -- The feedback Firestore collection is still populated (FeedbackButtons still works). Strip the dashboard to only show feedback data.

**Recommendation:** Remove the analytics dashboard, facts editor, and prompt versions UI in this milestone. Feedback data in Firestore remains queryable via the Firebase console. If analytics are needed later, build them as part of the FastAPI backend with its own admin API. This avoids building a half-working dashboard during the integration.

---

## Architectural Sketch: FastAPIChatTransport

This is the central new file. The pattern is a transport adapter that bridges two incompatible data formats.

```typescript
// src/lib/assistant/fastapi-transport.ts

import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";

export type Citation = {
  source: string;
  content: string;
  line_range: [number, number];
};

type FastAPIResponse = {
  response: string;
  citations: Citation[];
  confidence: number;
  conversation_id: string;
};

type FastAPIChatTransportOptions = {
  api: string;
  onCitations?: (messageId: string, citations: Citation[]) => void;
  onConfidence?: (messageId: string, confidence: number) => void;
};

export class FastAPIChatTransport implements ChatTransport<UIMessage> {
  private api: string;
  private onCitations?: (messageId: string, citations: Citation[]) => void;
  private onConfidence?: (messageId: string, confidence: number) => void;
  private conversationId: string | undefined;

  constructor(options: FastAPIChatTransportOptions) {
    this.api = options.api;
    this.onCitations = options.onCitations;
    this.onConfidence = options.onConfidence;
  }

  async sendMessages(options: {
    trigger: "submit-message" | "regenerate-message";
    chatId: string;
    messageId: string | undefined;
    messages: UIMessage[];
    abortSignal: AbortSignal | undefined;
  }): Promise<ReadableStream<UIMessageChunk>> {
    // 1. Transform UIMessages to FastAPI format
    const messages = options.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("") ?? "",
    }));

    // 2. POST to FastAPI
    const res = await fetch(`${this.api}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        conversation_id: this.conversationId,
      }),
      signal: options.abortSignal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`FastAPI error (${res.status}): ${text}`);
    }

    const data: FastAPIResponse = await res.json();
    this.conversationId = data.conversation_id;

    // 3. Surface citations via callback
    const messageId = options.messageId ?? `msg-${Date.now()}`;
    if (data.citations?.length && this.onCitations) {
      this.onCitations(messageId, data.citations);
    }
    if (this.onConfidence) {
      this.onConfidence(messageId, data.confidence);
    }

    // 4. Wrap response in ReadableStream<UIMessageChunk>
    //
    // NOTE: The exact UIMessageChunk discriminant field names
    // (e.g., "text-delta" with textDelta vs delta) MUST be verified
    // against the actual TypeScript types at implementation time.
    // This sketch shows the architectural pattern.
    return new ReadableStream<UIMessageChunk>({
      start(controller) {
        controller.enqueue({
          type: "text-delta",
          textDelta: data.response,
        } as UIMessageChunk);
        controller.close();
      },
    });
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // Non-streaming backend -- no reconnection possible
    return null;
  }
}
```

**IMPORTANT CAVEAT (LOW confidence):** The `UIMessageChunk` type is a discriminated union imported from `ai`. The field names shown above (`type: "text-delta"`, `textDelta`) are based on stream protocol documentation and may not match the exact TypeScript interface. During implementation, verify by:
1. Checking `node_modules/ai/dist/index.d.ts` for the `UIMessageChunk` type definition
2. Looking at how `DefaultChatTransport.processResponseStream()` constructs/consumes chunks
3. Writing a minimal test that creates and enqueues a chunk to confirm the shape compiles

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Next.js Proxy to FastAPI
**What:** Route chat requests through a Next.js API route that proxies to FastAPI.
**Why bad:** Adds latency (extra hop), complexity (two servers in the request path), and defeats the purpose of separating concerns. The proxy becomes a maintenance burden with no value since the FastAPI endpoint is public.
**Instead:** Direct browser-to-FastAPI via CORS. The milestone context explicitly states "Direct CORS connection (no proxy)."

### Anti-Pattern 2: Forcing DefaultChatTransport to Work
**What:** Trying to make FastAPI respond with UI Message Stream Protocol SSE format to stay compatible with DefaultChatTransport.
**Why bad:** Forces the FastAPI backend to understand Vercel AI SDK internals. Couples the backend to a specific frontend framework's wire protocol. Makes the backend harder to use with other clients (mobile apps, CLI tools, etc.).
**Instead:** Write a custom transport that adapts the FastAPI response format on the client side.

### Anti-Pattern 3: Abandoning useChat Entirely
**What:** Replacing useChat with raw `fetch()` calls and manual state management.
**Why bad:** Loses message state management, loading states (`submitted` / `streaming` / `ready` / `error`), error handling, and abort support that useChat provides. Rewriting all of that is unnecessary work and a source of bugs.
**Instead:** Keep useChat with a custom transport. The hook still manages messages, status, and error state correctly. Only the transport layer changes.

### Anti-Pattern 4: Keeping Dead Server Code
**What:** Leaving the old `src/lib/assistant/` files and `/api/assistant/chat` route in the codebase "just in case."
**Why bad:** Dead code confuses future developers, increases bundle size, and creates false import paths. The files reference Gemini SDK, safety rules, and knowledge base files that no longer exist.
**Instead:** Delete completely. Git history preserves everything if rollback is ever needed.

### Anti-Pattern 5: Duplicating Safety/Rate Limiting
**What:** Keeping the client-side safety pipeline or rate limiting in the Next.js layer in addition to the FastAPI backend.
**Why bad:** Dual enforcement is confusing, hard to keep in sync, and the rules may diverge. The backend is the authoritative enforcement point.
**Instead:** Remove all safety and rate-limiting code from the Next.js side. Trust the backend.

---

## Patterns to Follow

### Pattern 1: Transport Adapter
**What:** A single class (`FastAPIChatTransport`) encapsulates all request/response transformation logic between the AI SDK and FastAPI.
**When:** Always -- this is the core integration pattern.
**Why:** Clean separation of concerns. ChatInterface does not know about FastAPI's response format. FastAPI does not know about UIMessageChunks. The transport is the only place where both formats exist.

### Pattern 2: Side-Channel Callbacks for Metadata
**What:** Transport exposes `onCitations` and `onConfidence` callbacks for data that does not fit the UIMessage `parts` model.
**When:** For any per-response metadata (citations, confidence, source references).
**Why:** Avoids fighting the AI SDK's message format. Citations and confidence are metadata about the response, not part of the conversational text.

### Pattern 3: Clean Deletion with Descriptive Commits
**What:** Delete old files in a dedicated commit separate from new code additions.
**When:** After the new transport is working and verified.
**Why:** Makes it easy to find deleted code via `git log --diff-filter=D` and keeps the "add" and "remove" changes reviewable independently.

### Pattern 4: Environment-Driven Backend URL
**What:** Use `NEXT_PUBLIC_CHATBOT_API_URL` to configure the FastAPI endpoint, not hardcoded URLs.
**When:** Always.
**Why:** Different environments (local dev, staging, production) point to different FastAPI instances. The same build artifact works everywhere.

---

## Suggested Build Order

The integration should proceed in this order, with each step being independently testable:

### Step 1: Create the Custom Transport (Core -- highest risk, do first)
- Create `src/lib/assistant/fastapi-transport.ts`
- Define TypeScript types for FastAPI request/response (`Citation`, `FastAPIResponse`)
- Implement `FastAPIChatTransport` class
- Verify `UIMessageChunk` type shape against actual AI SDK exports
- Unit test with mocked fetch (verify request transformation, response wrapping)
- **Validates:** The transport compiles and the request/response schema mapping works
- **Risk:** UIMessageChunk shape may not match documentation -- this is where type verification happens

### Step 2: Wire Transport into ChatInterface
- Replace `DefaultChatTransport` with `FastAPIChatTransport` in `ChatInterface.tsx`
- Add `NEXT_PUBLIC_CHATBOT_API_URL` env var to `.env.local`
- Add `citationsByMessage` state to ChatInterface
- Pass citations data down to ChatMessage
- Test against running FastAPI backend (or mock server)
- **Validates:** useChat works end-to-end with the new transport, messages display correctly

### Step 3: Add Citations UI
- Create `CitationList` component (or `CitationBadge`)
- Modify `ChatMessage` to accept and render optional citations array
- Style citations to match the existing design system (navy/gold palette)
- Handle edge cases: no citations, single citation, many citations
- **Validates:** Citations display correctly below assistant messages

### Step 4: Error Handling and Edge Cases
- Handle FastAPI network errors (timeout, DNS failure)
- Handle FastAPI application errors (500, 422 validation, 429 rate limit)
- Handle CORS errors with clear error messages
- Handle empty response / malformed JSON
- Handle conversation_id lifecycle (first message creates, subsequent messages reuse)
- **Validates:** Graceful degradation under failure conditions

### Step 5: Delete Old Server Code
- Remove `src/app/api/assistant/chat/route.ts`
- Remove backend services: `gemini.ts`, `safety.ts`, `filters.ts`, `refusals.ts`, `knowledge.ts`, `prompts.ts`, `rate-limit.ts`
- Remove `src/lib/schemas/assistant.ts`
- Remove `src/data/` knowledge base files (all 9 files)
- Remove admin routes: `facts/route.ts`, `prompt-versions/route.ts`, `reindex/route.ts`
- Remove admin components: `FactsEditor.tsx`, `PromptVersions.tsx`, `ReindexButton.tsx`
- Remove admin page: `control-center/assistant/facts/page.tsx`
- Keep: `logging.ts` (used by feedback route), `handoff.ts` (used by HumanHandoff component), `lead-capture.ts` (client-side utility)
- **Validates:** `npm run build` passes with no broken imports, all tests pass

### Step 6: Clean Up Admin Dashboard
- Remove or simplify `control-center/assistant/page.tsx`
- Remove `AssistantAnalytics.tsx`, `TopQuestions.tsx`, `UnansweredQuestions.tsx`
- Remove `analytics.ts` if dashboard is fully removed
- **Validates:** Admin area still works for remaining (non-assistant) features

### Step 7: Remove Unused Dependencies
- Uninstall `@ai-sdk/google` (no longer calling Gemini from frontend)
- Verify `ai` and `@ai-sdk/react` are still needed (they are -- useChat)
- **Validates:** `npm run build` passes, bundle size reduced

### Build Order Rationale
Steps 1-2 are the highest-risk work (new integration pattern). Do them first so failures surface early. Steps 3-4 are UI polish and hardening that build on a working foundation. Step 5-7 are cleanup that reduces the codebase -- lowest risk, done last so there is always a working fallback during development.

---

## Scalability Considerations

| Concern | Current (internal) | New (FastAPI) |
|---------|-------------------|---------------|
| Rate limiting | In-memory Map (resets on deploy) | FastAPI backend handles it (persistent) |
| Knowledge freshness | Manual file edits + reindex button | GitHub webhook auto-indexing |
| Cold start latency | Next.js cold start only | Two cold starts possible (Next.js + FastAPI) |
| CORS preflight | N/A (same origin) | OPTIONS request on every new origin/path combo |
| Error correlation | Single service logs | Must correlate frontend + backend logs via conversation_id |
| Conversation state | No server-side state | `conversation_id` tracked by FastAPI |

### Cold Start Mitigation
Both Cloud Run instances should have minimum instances set to 1 in production to avoid double cold-start latency on the first chat message.

---

## Dependency Changes

### New Dependencies
None. The custom transport uses native `fetch()` and `ReadableStream`, both available in all modern browsers. No new npm packages needed.

### Removable Dependencies
| Package | Currently Used For | Still Needed? |
|---------|-------------------|---------------|
| `@ai-sdk/google` | Gemini model provider | **REMOVE** (LLM calls move to backend) |
| `ai` (Vercel AI SDK) | `useChat`, `streamText`, `createUIMessageStream` | **KEEP** (still using `useChat`, `UIMessage` types, `ChatTransport` interface) |
| `@ai-sdk/react` | `useChat` hook | **KEEP** |

---

## File Impact Summary

| Category | Keep | Modify | Remove | New |
|----------|------|--------|--------|-----|
| API Routes | 1 (feedback) | 0 | 4 (chat, facts, prompt-versions, reindex) | 0 |
| Backend Services | 3 (logging, handoff, lead-capture) | 0 | 10 (gemini, safety, filters, refusals, knowledge, prompts, rate-limit, facts-store, prompt-versions, schemas) | 0 |
| Data Files | 0 | 0 | 9 (all knowledge base files) | 0 |
| UI Components | 9 | 2 (ChatInterface, ChatMessage) | 0 | 1 (CitationList) |
| Admin Components | 0 | 0 | 3-6 (FactsEditor, PromptVersions, ReindexButton + optionally Analytics, TopQuestions, UnansweredQuestions) | 0 |
| Admin Pages | 0 | 0 | 1-2 (facts page + optionally analytics page) | 0 |
| Lib/Transport | 0 | 0 | 0 | 1 (fastapi-transport.ts) |
| **Totals** | **13** | **2** | **27-30** | **2** |

This is overwhelmingly a deletion milestone. Only 2 files are newly created and 2 are modified. The bulk of the work is removing 27-30 files of server-side code that moves to the FastAPI backend.

---

## Sources

- [AI SDK v5 Transport Documentation](https://ai-sdk.dev/docs/ai-sdk-ui/transport) -- Transport architecture overview (HIGH confidence)
- [AI SDK ChatTransport Interface Source](https://github.com/vercel/ai/blob/main/packages/ai/src/ui/chat-transport.ts) -- Interface definition with `sendMessages` and `reconnectToStream` signatures (HIGH confidence)
- [AI SDK DefaultChatTransport Source](https://github.com/vercel/ai/blob/main/packages/ai/src/ui/default-chat-transport.ts) -- Default implementation showing `processResponseStream` and `parseJsonEventStream` (HIGH confidence)
- [AI SDK HttpChatTransport](https://raw.githubusercontent.com/vercel/ai/main/packages/ai/src/ui/http-chat-transport.ts) -- Parent class showing `sendMessages` implementation, request body format `{id, messages, trigger, messageId}`, and `prepareSendMessagesRequest` hook (HIGH confidence)
- [AI SDK Stream Protocol Documentation](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) -- UI Message Stream Protocol SSE format, `x-vercel-ai-ui-message-stream: v1` header requirement (HIGH confidence)
- [AI SDK useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) -- Hook API, status values, transport option (HIGH confidence)
- [FastAPI + AI SDK v5 Integration Issues](https://github.com/vercel/ai/issues/7496) -- Known challenges with non-Node.js backends (MEDIUM confidence)
- [Pydantic AI VercelAIAdapter](https://ai.pydantic.dev/ui/vercel-ai/) -- Python-side SSE adapter reference (MEDIUM confidence)
- Direct codebase analysis of all files in `src/lib/assistant/`, `src/app/api/assistant/`, `src/components/assistant/`, `src/data/`, `src/app/control-center/assistant/` (HIGH confidence)

### Confidence Notes
- **UIMessageChunk exact field names:** LOW confidence. The chunk type union is not fully documented publicly. Field names must be verified from the actual TypeScript types at implementation time.
- **ChatTransport interface shape:** HIGH confidence. Verified from GitHub source.
- **DefaultChatTransport request body format:** HIGH confidence. Verified from HttpChatTransport source.
- **Component keep/remove decisions:** HIGH confidence. Based on direct dependency analysis of every import in every file.
- **Everything else:** HIGH confidence, based on direct source code reading and official documentation.
