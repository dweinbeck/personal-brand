# Feature Landscape

**Domain:** RAG chatbot frontend integration (v1.3 assistant backend swap)
**Researched:** 2026-02-08
**Overall confidence:** HIGH (well-documented UI patterns from Perplexity, ChatGPT, Vercel AI SDK; direct inspection of both codebases)

---

## Current State Summary

The personal-brand site has a fully functional AI assistant built on curated knowledge (JSON/MD files in `src/data/`) with Gemini 2.0 Flash via Vercel AI SDK streaming. The existing chat UI includes: `ChatInterface`, `ChatMessage`, `ChatInput`, `ChatHeader`, `TypingIndicator`, `SuggestedPrompts`, `FeedbackButtons`, `ExitRamps`, `HumanHandoff`, `PrivacyDisclosure`, and a custom `MarkdownRenderer`.

The **new backend** (chatbot-assistant, FastAPI on Cloud Run) returns a structured JSON response:

```json
{
  "answer": "string (the LLM-generated answer text)",
  "citations": [
    {
      "source": "owner/repo/path@sha:start_line-end_line",
      "relevance": "How this chunk relates to the answer"
    }
  ],
  "confidence": "low | medium | high"
}
```

The v1.3 milestone replaces the internal Gemini streaming with direct CORS calls to this FastAPI backend. This is a **non-streaming** JSON API (not SSE/WebSocket), which fundamentally changes how the frontend handles responses.

---

## Existing Component Inventory & Disposition

Before listing new features, here is what happens to each existing component:

| Component | Current Role | v1.3 Disposition | Notes |
|-----------|-------------|-------------------|-------|
| `ChatInterface` | Orchestrates chat, uses `useChat` + AI SDK streaming | **MODIFY heavily** | Replace `useChat`/streaming with `fetch` + JSON response. New state management for request/response cycle |
| `ChatMessage` | Renders user/assistant bubbles with markdown | **MODIFY** | Add citation rendering and confidence indicator below assistant messages |
| `ChatInput` | Textarea with send button, Enter/Shift+Enter | **KEEP as-is** | No changes needed; input contract stays the same |
| `ChatHeader` | Static header with avatar and description | **KEEP as-is** | No changes needed |
| `TypingIndicator` | Animated dots during streaming | **KEEP, rename conceptually** | Still needed during fetch wait; shows while request is in-flight |
| `SuggestedPrompts` | Quick-start buttons | **KEEP as-is** | Works regardless of backend |
| `FeedbackButtons` | Thumbs up/down per message | **KEEP as-is** | Already posts to separate `/api/assistant/feedback` endpoint (Firestore) |
| `ExitRamps` | Quick links (Email, LinkedIn, GitHub, Contact) | **KEEP as-is** | No backend dependency |
| `HumanHandoff` | "Talk to Dan directly" mailto with conversation | **KEEP as-is** | No backend dependency |
| `PrivacyDisclosure` | Privacy notice footer | **MODIFY slightly** | Update wording since conversations now go to external service |
| `MarkdownRenderer` | Custom markdown parser (bold, links, code, lists, headings) | **MODIFY** | May need to handle citation markers in text or render alongside citations |
| `LeadCaptureFlow` | Lead capture (imported but not visibly used in ChatInterface) | **EVALUATE** | Check if used; if not, remove dead code |

### Code to Remove

| Code | Reason |
|------|--------|
| `src/app/api/assistant/chat/route.ts` | Replaced by direct FastAPI calls |
| `src/lib/assistant/gemini.ts` | No longer calling Gemini from Next.js |
| `src/lib/assistant/prompts.ts` | System prompt now lives in FastAPI backend |
| `src/lib/assistant/safety.ts` | Safety/guardrails now handled by FastAPI backend |
| `src/lib/assistant/rate-limit.ts` | Rate limiting now handled by FastAPI backend |
| `src/lib/assistant/logging.ts` | Logging now handled by FastAPI backend |
| `src/lib/schemas/assistant.ts` | Chat schema replaced by new request/response types |
| `src/data/` knowledge base files | Knowledge base now lives in Postgres via GitHub webhook ingestion |
| Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/google`) | No longer streaming from Next.js; may be removable if no other features use them |

### Admin Components to Evaluate

| Component | Current Role | v1.3 Impact |
|-----------|-------------|-------------|
| `AssistantAnalytics` | Firestore analytics dashboard | **KEEP for now** -- still reads from Firestore |
| `TopQuestions` | Most asked questions | **KEEP for now** |
| `UnansweredQuestions` | Questions without good answers | **KEEP for now** |
| `FactsEditor` | Edit knowledge base facts | **REMOVE** -- knowledge base is now in Postgres, managed via GitHub webhooks |
| `PromptVersions` | Prompt versioning UI | **REMOVE** -- system prompt now in FastAPI codebase |
| `ReindexButton` | Trigger knowledge reindex | **REMOVE** -- reindexing happens via GitHub webhooks |

---

## Table Stakes

Features users expect from any RAG-backed chat interface. Missing any of these makes the product feel broken.

### TS-1: Citation Rendering

| Aspect | Detail |
|--------|--------|
| **Feature** | Display source citations below the answer text |
| **Why Expected** | The entire point of RAG is grounding answers in real sources. Showing citations builds trust and demonstrates the system works. Every major RAG product (Perplexity, ChatGPT with browsing, Copilot) renders citations |
| **Complexity** | Medium |
| **Dependencies** | `ChatMessage` modification, new `CitationList` component |

**Recommended pattern: Collapsible source section below each answer.**

The backend returns 0-N citations, each with a `source` string (`owner/repo/path@sha:start-end`) and a `relevance` description. The recommended rendering:

1. Below the answer text, show a collapsible "Sources (N)" trigger in a muted style
2. When expanded, show each citation as a compact card with:
   - **File path** parsed from the source string (e.g., `app/routers/chat.py`)
   - **Repo name** parsed from source (e.g., `chatbot-assistant`)
   - **Line range** (e.g., `L31-L50`)
   - **Relevance text** from the citation object
   - **GitHub permalink** constructed from the source parts: `https://github.com/{owner}/{repo}/blob/{sha}/{path}#L{start}-L{end}`
3. Collapsed by default to keep the chat clean -- users who want to verify can expand

**Why collapsible (not inline numbered references):**
- The citation sources are code file references, not web URLs with readable titles
- Inline `[1]` markers work well for web search (Perplexity-style) but would clutter code-focused answers
- A personal site assistant should feel conversational, not academic
- Most visitors will not verify source code -- the presence of citations signals trustworthiness even if not clicked

**Confidence level:** HIGH -- this pattern is well-established in Perplexity (expandable "Sources" section), ChatGPT (collapsed source cards), and documented in [ShapeofAI citation patterns](https://www.shapeof.ai/patterns/citations).

### TS-2: Confidence Indicator

| Aspect | Detail |
|--------|--------|
| **Feature** | Visual indicator of answer confidence level (low/medium/high) |
| **Why Expected** | The backend computes confidence from retrieval signals (chunk count + ts_rank_cd scores). Surfacing this helps visitors calibrate trust in the answer |
| **Complexity** | Low |
| **Dependencies** | `ChatMessage` modification |

**Recommended pattern: Small color-coded pill/badge below the answer, near the citation trigger.**

| Confidence | Color | Label | Tooltip |
|------------|-------|-------|---------|
| `high` | Green (sage/emerald) | "High confidence" | "Based on multiple relevant code sources" |
| `medium` | Amber/gold | "Moderate confidence" | "Based on some relevant sources" |
| `low` | Muted gray/red | "Low confidence" | "Limited source material found" |

**Implementation notes:**
- Use the site's existing color system: sage for high, gold/amber for medium, muted for low
- Text + color (not color alone) for accessibility
- Small, unobtrusive -- should not dominate the message
- Position near the collapsible sources trigger, creating a metadata row: `[confidence pill] [Sources (N) trigger] [FeedbackButtons]`

**Confidence level:** HIGH -- color-coded confidence badges are a well-documented pattern per [Agentic Design confidence visualization patterns](https://agentic-design.ai/patterns/ui-ux-patterns/confidence-visualization-patterns) and the 64% user preference finding for overall confidence ratings.

### TS-3: Loading State for Non-Streaming Responses

| Aspect | Detail |
|--------|--------|
| **Feature** | Visual feedback while waiting for the FastAPI response |
| **Why Expected** | The old UI used Vercel AI SDK streaming (tokens appeared incrementally). The new backend returns a complete JSON response, so there will be a perceptible wait (1-5s). Without feedback, users will think it is broken |
| **Complexity** | Low |
| **Dependencies** | `ChatInterface` state management, existing `TypingIndicator` |

**Recommended pattern:** Keep the existing `TypingIndicator` (animated dots). It already renders during the "submitted" state. The new fetch-based flow should show it between sending the request and receiving the response. No visual change needed -- just wire it to new state.

**Confidence level:** HIGH -- the existing component already handles this well.

### TS-4: Error Handling for External Service

| Aspect | Detail |
|--------|--------|
| **Feature** | Graceful error states for network failures, timeouts, 4xx/5xx from FastAPI |
| **Why Expected** | The old architecture was same-origin (Next.js API route). External CORS calls introduce new failure modes: DNS resolution, CORS misconfig, Cloud Run cold starts (can take 5-10s), 429 rate limits, 500 errors |
| **Complexity** | Low-Medium |
| **Dependencies** | `ChatInterface` modification |

**Error states to handle:**

| Error Type | User-Facing Message | Technical Detail |
|------------|---------------------|------------------|
| Network failure / CORS | "Unable to reach the assistant. Please try again in a moment." | `fetch` throws, no response |
| Timeout (>15s) | "The assistant is taking too long. Please try again." | AbortController timeout |
| 429 rate limit | "Too many messages. Please wait a moment." | Backend enforces its own rate limits |
| 500 server error | "Something went wrong. Please try again." | Backend error |
| Invalid response shape | "Something went wrong. Please try again." | Response doesn't match expected schema |

**Confidence level:** HIGH -- standard error handling patterns.

### TS-5: Request/Response Type Safety

| Aspect | Detail |
|--------|--------|
| **Feature** | TypeScript types for the FastAPI request/response contract |
| **Why Expected** | Type safety prevents runtime errors and documents the API contract |
| **Complexity** | Low |
| **Dependencies** | New types file |

**The contract from the FastAPI schemas:**

```typescript
// Request
type ChatRequest = {
  question: string; // 1-1000 chars
};

// Response
type ChatResponse = {
  answer: string;
  citations: Citation[];
  confidence: "low" | "medium" | "high";
};

type Citation = {
  source: string;  // "owner/repo/path@sha:start-end"
  relevance: string;
};
```

**Confidence level:** HIGH -- directly from `chatbot-assistant/app/schemas/chat.py`.

### TS-6: CORS Configuration on Backend

| Aspect | Detail |
|--------|--------|
| **Feature** | FastAPI CORS middleware allowing requests from `dan-weinbeck.com` |
| **Why Expected** | Without CORS headers, browser blocks cross-origin requests entirely. Currently no CORSMiddleware in `app/main.py` |
| **Complexity** | Low |
| **Dependencies** | Backend code change (chatbot-assistant repo) |

**Required CORS config:**
- Allow origin: `https://dan-weinbeck.com` (production), `http://localhost:3000` (development)
- Allow methods: `POST` (for `/chat`)
- Allow headers: `Content-Type`
- No credentials needed (no auth)

**Confidence level:** HIGH -- inspected `app/main.py`, confirmed no CORS middleware exists.

---

## Differentiators

Features that set this apart from a generic chatbot. Not expected, but signal quality and attention to detail.

### D-1: Clickable GitHub Permalinks in Citations

| Aspect | Detail |
|--------|--------|
| **Feature** | Parse citation source strings into clickable GitHub permalink URLs |
| **Why Expected** | Not expected by casual visitors, but for technical visitors (recruiters, collaborators), being able to click through to the exact lines of code is a powerful credibility signal |
| **Complexity** | Low |
| **Value** | HIGH -- converts citations from opaque strings to actionable proof |

**URL construction:**
The backend citation format `owner/repo/path@sha:start-end` maps directly to GitHub's permalink format:
```
https://github.com/{owner}/{repo}/blob/{sha}/{path}#L{start}-L{end}
```

**Example:**
- Citation source: `dweinbeck/chatbot-assistant/app/routers/chat.py@abc123:31-50`
- GitHub link: `https://github.com/dweinbeck/chatbot-assistant/blob/abc123/app/routers/chat.py#L31-L50`

Parse with a simple regex or string split. Open in new tab.

**Confidence level:** HIGH -- GitHub permalink format is [well-documented](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-a-permanent-link-to-a-code-snippet).

### D-2: Smart Empty State with RAG Context

| Aspect | Detail |
|--------|--------|
| **Feature** | Update the welcome message and suggested prompts to reflect RAG capabilities |
| **Why Expected** | Not required, but the current prompts ("Best AI projects", "Background & experience") are generic. With RAG backing, prompts should invite questions about specific repos and code |
| **Complexity** | Low |
| **Value** | Medium -- better first impression, shows this is not a generic chatbot |

**Suggested new prompts:**
- "How does the chatbot backend work?"
- "What tech stack does Dan use?"
- "Show me the RAG pipeline code"
- "How is the personal site deployed?"

**Confidence level:** HIGH -- straightforward content change.

### D-3: Low-Confidence Messaging with Clarification

| Aspect | Detail |
|--------|--------|
| **Feature** | When confidence is "low", append a subtle note encouraging the user to rephrase or ask a more specific question |
| **Why Expected** | Not expected, but the backend already has `needs_clarification` and `clarifying_question` fields in its LLM response schema. Surfacing this creates a better conversational flow |
| **Complexity** | Low |
| **Value** | Medium -- reduces dead-end conversations |

**Implementation:** When `confidence === "low"` and the answer contains "I don't know" or similar, show a muted helper text below the answer:
> "Try asking about a specific project or file for better results."

**Note:** The current FastAPI endpoint does NOT return `needs_clarification` or `clarifying_question` in the `ChatResponse` schema -- those are internal to the `LLMResponse` model. If this feature is desired, the API contract would need updating. For v1.3, a simple frontend heuristic on confidence level is sufficient.

**Confidence level:** MEDIUM -- the backend schema would need extension to fully implement; frontend heuristic is simpler.

### D-4: Citation Count in Message Metadata

| Aspect | Detail |
|--------|--------|
| **Feature** | Show a small "Cited N sources" label even when citations are collapsed |
| **Why Expected** | Not expected, but seeing "Cited 4 sources" without expanding gives an instant credibility signal. Perplexity does this effectively |
| **Complexity** | Low |
| **Value** | Medium -- subtle trust signal |

**Confidence level:** HIGH -- this is the collapsed state of the citation section anyway (TS-1).

---

## Anti-Features

Features to deliberately NOT build. These are tempting but wrong for a personal site assistant.

### AF-1: Streaming / Token-by-Token Display

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Stream tokens from FastAPI to simulate typing | The FastAPI backend returns complete JSON responses, not SSE streams. Adding streaming would require: (1) rewriting the FastAPI endpoint to use SSE, (2) splitting the structured response (answer + citations + confidence) across stream chunks, (3) handling partial citation rendering. This is significant backend complexity for marginal UX improvement on a personal site | Show the typing indicator during the fetch, then render the complete response at once. The 1-5s wait is acceptable for a personal site. If response time becomes an issue, optimize the backend query, not the transport |

### AF-2: Inline Numbered Citations (Perplexity-Style)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Parse the answer text for `[1]`, `[2]` markers and render inline citation pills | The backend's LLM might include citation references in the answer text, but the citation format is code file references (not web URLs with human-readable titles). Inline `[1]` pills that expand to show `app/routers/chat.py@abc123:31-50` would look noisy and confusing. This also requires the LLM to consistently use numbered markers, adding prompt complexity | Use the collapsible sources section below the answer (TS-1). The answer text stays clean and readable; citations are available for those who want them |

### AF-3: Code Preview / Syntax-Highlighted Snippet Expansion

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Fetch and render the actual code content from GitHub when a citation is expanded | Requires additional GitHub API calls (rate-limited), syntax highlighting library (Prism/Shiki), code viewer component. Massive complexity for a feature most visitors will never use | Link to the GitHub permalink (D-1). GitHub already renders code with syntax highlighting. Don't recreate it |

### AF-4: Citation Verification / "Check Source" Button

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Add a "Verify" button that re-fetches the source and confirms the citation is still valid | The backend already does mechanical citation verification (comparing LLM citations against actually-retrieved chunks). Adding client-side verification is redundant and adds latency | Trust the backend's verification. The GitHub permalink already lets users manually verify if they want |

### AF-5: Conversation Persistence / History

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Save conversations to localStorage or Firestore so users can resume | Adds state management complexity, privacy concerns (storing visitor conversations client-side), and UI for listing/resuming conversations. Overkill for a personal site where conversations are typically 2-5 messages | Keep conversations ephemeral. Each page load is a fresh start. The existing `HumanHandoff` component already captures the conversation in a mailto link if the visitor wants to continue via email |

### AF-6: Feedback on Individual Citations

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Add thumbs up/down on each citation to rate source relevance | Over-granular for a personal site. Citation quality is a backend concern (retrieval ranking, chunk quality). Visitor feedback at the citation level is noise | Keep the existing per-message `FeedbackButtons`. If an answer is bad, that feedback covers the citations too |

### AF-7: Multi-Turn Context / Conversation History Sent to Backend

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Send full conversation history with each request so the backend can do multi-turn RAG | The FastAPI `/chat` endpoint accepts a single `question` string, not a conversation array. Adding multi-turn support requires backend schema changes, context window management, and significantly more complex retrieval. The old Vercel AI SDK `useChat` sent conversation history automatically; the new backend does not expect it | Send each question independently. For a code knowledge assistant, most questions are self-contained ("How does X work?"). If users need follow-up context, they can rephrase to include it. This is a v2 feature at best |

### AF-8: Admin Analytics for RAG-Specific Metrics

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Build dashboards showing retrieval scores, citation hit rates, confidence distributions | The control center is explicitly deferred to a future milestone. RAG analytics belong in the backend observability layer (structured logging, Cloud Logging), not in a frontend admin panel | Keep existing Firestore analytics for now. Backend observability via structlog is already in place. Defer admin tooling |

---

## Feature Dependencies

```
CORS config (TS-6, backend)
  |
  v
Type definitions (TS-5)
  |
  v
ChatInterface rewrite (TS-3, TS-4)  -- fetch-based, replaces useChat/streaming
  |
  +----> ChatMessage modification (TS-1, TS-2)
  |        |
  |        +----> CitationList component (NEW)
  |        |        |
  |        |        +----> GitHub permalink construction (D-1)
  |        |
  |        +----> ConfidenceBadge component (NEW)
  |
  +----> PrivacyDisclosure update
  |
  +----> Error handling states (TS-4)
  |
  +----> SuggestedPrompts update (D-2)

PARALLEL (no dependency on above):
  Remove old assistant server code
  Remove old admin components (FactsEditor, PromptVersions, ReindexButton)
  Clean up unused dependencies
```

**Critical path:** CORS (TS-6) must be done first -- nothing else works without it. Then types (TS-5) and ChatInterface rewrite (TS-3/TS-4) are the foundation. Citation rendering (TS-1) and confidence (TS-2) layer on top.

---

## MVP Recommendation

For the v1.3 MVP, prioritize in this order:

**Must ship (table stakes):**
1. CORS configuration on FastAPI backend (TS-6)
2. TypeScript types for API contract (TS-5)
3. ChatInterface rewrite: fetch-based request/response (TS-3)
4. Error handling for external service (TS-4)
5. Citation rendering with collapsible sources section (TS-1)
6. Confidence indicator badge (TS-2)

**Should ship (differentiators that are low-effort):**
7. GitHub permalink URLs in citations (D-1) -- parse and link, trivial
8. Updated suggested prompts for RAG context (D-2)
9. Citation count in collapsed state (D-4) -- inherent in TS-1 design

**Defer to post-v1.3:**
- Low-confidence clarification messaging (D-3) -- needs API contract discussion
- Streaming responses (AF-1) -- backend rewrite for marginal UX gain
- Multi-turn conversation (AF-7) -- backend does not support it
- RAG analytics admin panel (AF-8) -- deferred per milestone plan

---

## New Components to Build

| Component | Purpose | Estimated Size |
|-----------|---------|---------------|
| `CitationList` | Collapsible list of source citations with GitHub links | ~80-100 lines |
| `ConfidenceBadge` | Color-coded pill showing confidence level | ~30-40 lines |
| `types/chat.ts` | TypeScript types for FastAPI request/response | ~20 lines |

**Note:** These are new leaf components. The primary complexity is in modifying `ChatInterface` (replacing streaming with fetch) and `ChatMessage` (integrating the new components).

---

## Sources

- Backend API contract: directly inspected `/Users/dweinbeck/Documents/chatbot-assistant/app/schemas/chat.py` and `/Users/dweinbeck/Documents/chatbot-assistant/app/routers/chat.py` (HIGH confidence)
- Frontend components: directly inspected all files in `src/components/assistant/` (HIGH confidence)
- Citation UI patterns: [ShapeofAI Citations](https://www.shapeof.ai/patterns/citations) (HIGH confidence)
- Confidence visualization: [Agentic Design CVP](https://agentic-design.ai/patterns/ui-ux-patterns/confidence-visualization-patterns) (HIGH confidence)
- Vercel AI SDK InlineCitation: [AI SDK Elements](https://elements.ai-sdk.dev/components/inline-citation) (HIGH confidence -- evaluated and rejected for this use case)
- shadcn/ui AI Sources component: [shadcn.io/ai/sources](https://www.shadcn.io/ai/sources) (MEDIUM confidence -- pattern reference only)
- GitHub permalink format: [GitHub Docs](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-a-permanent-link-to-a-code-snippet) (HIGH confidence)
- AI citation patterns across platforms: [Medium analysis](https://medium.com/@shuimuzhisou/how-ai-engines-cite-sources-patterns-across-chatgpt-claude-perplexity-and-sge-8c317777c71d) (MEDIUM confidence)
