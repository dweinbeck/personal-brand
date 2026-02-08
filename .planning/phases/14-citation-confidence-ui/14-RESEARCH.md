# Phase 14: Citation and Confidence UI - Research

**Researched:** 2026-02-08
**Domain:** AI SDK UIMessageStream structured parts; React citation/confidence UI components; GitHub permalink construction
**Confidence:** HIGH

## Summary

Phase 14 replaces the temporary markdown-appended citations (from Phase 13) with structured UI components. The key discovery is that the Vercel AI SDK v5 (`ai@6.0.71`) has **native `source-url` chunk and part types** built into the UIMessage protocol. The route handler can write `source-url` chunks via `createUIMessageStream`, and `useChat` will automatically populate them as `SourceUrlUIPart` objects in `message.parts`. This means citations can be rendered as distinct UI components rather than parsed from markdown text.

For confidence, the AI SDK provides `message-metadata` chunks that populate `message.metadata` on the client. The route handler writes a `start` chunk with `messageMetadata: { confidence: "high" }` before the text, and `useChat` attaches it to the message object. The frontend reads `message.metadata?.confidence` to render a color-coded badge.

The frontend work involves: (1) a `CitationList` component with collapsible `<details>/<summary>` for the sources section, (2) a `ConfidenceBadge` component with color-coded styling, (3) modifications to `ChatMessage` to render these new parts, (4) updated `SuggestedPrompts` to reflect RAG capabilities, and (5) updated `PrivacyDisclosure` to mention the external service.

**Primary recommendation:** Use the AI SDK's native `source-url` chunk type for citations and `messageMetadata` on the `start` chunk for confidence. Build two new leaf components (`CitationList`, `ConfidenceBadge`). Modify `ChatMessage` to render them below the message bubble. Use HTML `<details>/<summary>` for the collapsible sources section (zero JS, accessible by default).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | `^6.0.71` (installed) | `source-url` chunk type in `createUIMessageStream`; `messageMetadata` on `start` chunk | Native support for citations and metadata in the UIMessage protocol; already used in route handler |
| React | `19.2.3` (installed) | Component rendering | Already used |
| Tailwind CSS | `4.x` (installed) | Styling for citation list, confidence badge | Already used; design tokens in `globals.css` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `^4.3.6` (installed) | Validate messageMetadata schema on client | Optional -- `messageMetadataSchema` in `useChat` options validates incoming metadata |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `source-url` chunks | Append citations as JSON in text then parse client-side | Fragile, breaks markdown rendering, loses type safety from AI SDK |
| `source-url` chunks | Custom `data-citations` DataUIPart | Works but `source-url` is purpose-built for exactly this use case |
| `messageMetadata` for confidence | Append confidence as text | Not machine-readable, can't style as badge |
| `messageMetadata` for confidence | Custom `data-confidence` DataUIPart | Overkill -- confidence is message-level metadata, not a renderable part |
| HTML `<details>/<summary>` | State-based expand/collapse | `<details>` is zero-JS, accessible, progressive enhancement; matches "no new dependencies" constraint |

**Installation:**
```bash
# Nothing to install. Zero new dependencies.
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/api/assistant/chat/
│   └── route.ts                    # MODIFY: Write source-url chunks + messageMetadata instead of markdown citations
├── lib/assistant/
│   └── fastapi-client.ts           # UNCHANGED
├── lib/schemas/
│   └── fastapi.ts                  # UNCHANGED
├── lib/
│   └── citation-utils.ts           # NEW: parseCitationSource() to build GitHub permalink URLs
└── components/assistant/
    ├── ChatInterface.tsx            # MODIFY: Pass full message object (or metadata + parts) to ChatMessage
    ├── ChatMessage.tsx              # MODIFY: Render CitationList + ConfidenceBadge below message bubble
    ├── CitationList.tsx             # NEW: Collapsible source list with GitHub permalink links
    ├── ConfidenceBadge.tsx          # NEW: Color-coded confidence indicator
    ├── SuggestedPrompts.tsx         # MODIFY: Update prompt text to reflect RAG capabilities
    ├── PrivacyDisclosure.tsx        # MODIFY: Update wording for external service
    └── MarkdownRenderer.tsx         # UNCHANGED (no longer receives citations in text)
```

### Pattern 1: Source-URL Chunks in createUIMessageStream

**What:** The route handler writes `source-url` chunks for each citation. The AI SDK automatically adds these to `message.parts` as `SourceUrlUIPart` objects on the client.

**When to use:** For every citation returned by FastAPI.

**Example:**
```typescript
// Source: Verified from node_modules/ai/dist/index.d.ts lines 1878-1882 (UIMessageChunk source-url type)
// and ai-sdk.dev/docs/ai-sdk-ui/chatbot (source-url rendering)
const stream = createUIMessageStream({
  execute: ({ writer }) => {
    // Start message with metadata (confidence)
    writer.write({
      type: "start",
      messageMetadata: { confidence: data.confidence },
    });

    // Write the answer text
    writer.write({ type: "text-start", id: partId });
    writer.write({ type: "text-delta", delta: data.answer, id: partId });
    writer.write({ type: "text-end", id: partId });

    // Write each citation as a source-url part
    for (const cite of data.citations) {
      const url = buildGitHubPermalink(cite.source);
      const title = extractFilePath(cite.source);
      writer.write({
        type: "source-url",
        sourceId: `cite-${index}`,
        url,
        title,
      });
    }

    writer.write({ type: "finish" });
  },
});
```

**Confidence:** HIGH -- `source-url` is a defined UIMessageChunk type (verified in type declarations); `SourceUrlUIPart` is in the UIMessagePart union; official docs show rendering pattern.

### Pattern 2: Message Metadata for Confidence

**What:** The route handler writes a `start` chunk with `messageMetadata` containing the confidence level. On the client, `message.metadata?.confidence` is available for rendering.

**When to use:** For every response that includes a confidence level.

**Example:**
```typescript
// Source: Verified from node_modules/ai/dist/index.d.ts lines 1900-1902
// and ai-sdk.dev/docs/ai-sdk-ui/chatbot (message metadata)
writer.write({
  type: "start",
  messageMetadata: { confidence: data.confidence },  // "low" | "medium" | "high"
});
```

Client-side:
```typescript
// In useChat options, optionally validate with schema:
const { messages } = useChat({
  transport,
  messageMetadataSchema: z.object({
    confidence: z.enum(["low", "medium", "high"]).optional(),
  }),
});

// Access in rendering:
const confidence = (message.metadata as { confidence?: string })?.confidence;
```

**Confidence:** HIGH -- `messageMetadata` field on `start` chunk verified in type declarations; `metadata` field on UIMessage interface verified.

### Pattern 3: GitHub Permalink Construction

**What:** Parse the citation `source` string (`owner/repo/path@sha:start_line-end_line`) into a GitHub permalink URL.

**When to use:** For every citation source string.

**Example:**
```typescript
// Source: Verified from chatbot-assistant/app/routers/chat.py lines 81-85
// Citation format: "owner/repo/path@sha:start_line-end_line"
// GitHub permalink: "https://github.com/owner/repo/blob/sha/path#Lstart-Lend"

export function buildGitHubPermalink(source: string): string {
  // Parse: "dweinbeck/chatbot-assistant/app/main.py@abc123:1-10"
  const atIndex = source.indexOf("@");
  const colonIndex = source.lastIndexOf(":");

  if (atIndex === -1 || colonIndex === -1 || colonIndex <= atIndex) {
    return `https://github.com/${source}`; // Fallback: link to repo/path
  }

  const repoAndPath = source.slice(0, atIndex);      // "owner/repo/path"
  const sha = source.slice(atIndex + 1, colonIndex);  // "abc123"
  const lineRange = source.slice(colonIndex + 1);      // "1-10"
  const [startLine, endLine] = lineRange.split("-");

  // Split repoAndPath into owner/repo and path
  const parts = repoAndPath.split("/");
  const owner = parts[0];
  const repo = parts[1];
  const path = parts.slice(2).join("/");

  let url = `https://github.com/${owner}/${repo}/blob/${sha}/${path}`;
  if (startLine) {
    url += `#L${startLine}`;
    if (endLine && endLine !== startLine) {
      url += `-L${endLine}`;
    }
  }
  return url;
}

export function extractFilePath(source: string): string {
  // Extract just "path" portion for display: "app/main.py:1-10"
  const atIndex = source.indexOf("@");
  const colonIndex = source.lastIndexOf(":");
  const repoAndPath = source.slice(0, atIndex > 0 ? atIndex : undefined);
  const parts = repoAndPath.split("/");
  const path = parts.slice(2).join("/");
  const lineRange = colonIndex > 0 ? source.slice(colonIndex + 1) : "";
  return lineRange ? `${path}:${lineRange}` : path;
}
```

**Confidence:** HIGH -- citation format verified from `chatbot-assistant/app/routers/chat.py` lines 81-85 and test fixtures. GitHub permalink format is stable and well-documented.

### Pattern 4: Collapsible Citation List with HTML `<details>`

**What:** Use the native `<details>/<summary>` HTML elements for the collapsible sources section. Zero JavaScript needed, accessible by default, progressive enhancement.

**When to use:** When rendering citations below an assistant message.

**Example:**
```tsx
// CitationList.tsx
type Citation = {
  sourceId: string;
  url: string;
  title?: string;
};

function CitationList({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null;

  return (
    <details className="mt-2 rounded-lg border border-border bg-surface/50 text-sm">
      <summary className="cursor-pointer px-3 py-2 text-text-secondary hover:text-text-primary transition-colors select-none">
        Sources ({citations.length})
      </summary>
      <ul className="border-t border-border px-3 py-2 space-y-1">
        {citations.map((cite) => (
          <li key={cite.sourceId} className="flex items-start gap-2">
            <span className="text-text-tertiary mt-0.5 text-xs" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
              </svg>
            </span>
            <a
              href={cite.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-primary hover:text-gold transition-colors underline decoration-border hover:decoration-gold"
            >
              {cite.title ?? cite.url}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
```

**Confidence:** HIGH -- `<details>/<summary>` is standard HTML supported by all modern browsers. No library needed.

### Pattern 5: Confidence Badge

**What:** A small inline badge showing the confidence level with color coding that matches the existing design system.

**When to use:** On every assistant response that has a confidence value.

**Example:**
```tsx
// ConfidenceBadge.tsx
const CONFIDENCE_STYLES = {
  high: "bg-sage/15 text-sage border-sage/30",      // Green -- sage from design system
  medium: "bg-gold-light text-amber border-amber/30", // Amber -- gold/amber from design system
  low: "bg-red-50 text-red-600 border-red-200",      // Red -- standard caution color
} as const;

const CONFIDENCE_LABELS = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
} as const;

type Confidence = "high" | "medium" | "low";

function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${CONFIDENCE_STYLES[level]}`}
      title={CONFIDENCE_LABELS[level]}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {CONFIDENCE_LABELS[level]}
    </span>
  );
}
```

**Confidence:** HIGH -- uses existing design tokens (sage, gold-light, amber). Color mapping: high=sage (green), medium=amber (gold), low=red. Matches the status badge pattern used in ProjectCard.

### Anti-Patterns to Avoid

- **Parsing citations from markdown text:** The Phase 13 approach of appending `---\n**Sources:**\n` to the text was explicitly temporary. Do NOT try to regex-parse citations out of the text string. Use the structured `source-url` parts instead.
- **Using `providerMetadata` for confidence:** `providerMetadata` is intended for provider-specific (OpenAI, Anthropic, Google) metadata passed through from the LLM API, not for custom application metadata. Use `messageMetadata` instead.
- **Creating a full React state machine for collapsible:** The `<details>` element handles open/close natively. Don't add `useState` + `onClick` when HTML does it for free.
- **Passing citations as props separately from the message:** Citations are part of `message.parts` -- render them from the same message object. Don't create a parallel data flow.
- **Forgetting the `start` chunk:** The `messageMetadata` field lives on the `start` chunk type. Without writing a `start` chunk, no metadata reaches the client. The route handler must write `start` BEFORE `text-start`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sending citation data to client | Custom JSON encoding in text body | AI SDK `source-url` chunk type | Native protocol support; `useChat` automatically populates `message.parts` |
| Message-level metadata | Custom header or body field | AI SDK `messageMetadata` on `start` chunk | Built into UIMessage protocol; auto-populates `message.metadata` |
| Collapsible UI | React state-based expand/collapse | HTML `<details>/<summary>` | Zero JS, accessible, keyboard-navigable, works without hydration |
| GitHub URL construction | Hardcoded string templates | A `buildGitHubPermalink()` utility function | Centralizes format parsing, easy to test, handles edge cases |

**Key insight:** The AI SDK already has first-class support for both citations (`source-url`) and metadata (`messageMetadata`). Phase 14 is primarily about using capabilities that were always available but not utilized in Phase 13's MVP approach.

## Common Pitfalls

### Pitfall 1: Missing `start` Chunk Before Text

**What goes wrong:** If the route handler writes `text-start` without first writing a `start` chunk containing `messageMetadata`, the confidence metadata never reaches the client. `message.metadata` will be `undefined`.

**Why it happens:** Phase 13 didn't write a `start` chunk because it had no metadata to send.

**How to avoid:** Always write the `start` chunk first:
```typescript
writer.write({ type: "start", messageMetadata: { confidence: data.confidence } });
writer.write({ type: "text-start", id: partId });
// ... text deltas ...
writer.write({ type: "text-end", id: partId });
// ... source-url chunks ...
writer.write({ type: "finish" });
```

**Warning signs:** Confidence badge never renders; `message.metadata` is `undefined` in React DevTools.

### Pitfall 2: ChatInterface Stripping Parts to Plain String

**What goes wrong:** The current `ChatInterface.tsx` extracts text from `message.parts` into a plain string before passing to `ChatMessage`. This loses the `source-url` parts entirely.

**Why it happens:** Phase 13 only needed the text content. The current code at lines 118-122 does:
```typescript
content={
  message.parts
    ?.filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("") ?? ""
}
```

**How to avoid:** Pass `message.parts` (or the full message object) to `ChatMessage` so it can access both text parts and source-url parts. Also pass `message.metadata` for confidence.

**Warning signs:** Citations never appear despite being in the stream. Check `message.parts` in React DevTools -- `source-url` parts should be there.

### Pitfall 3: Citation Source Parsing Edge Cases

**What goes wrong:** The citation source string `owner/repo/path@sha:start-end` has variable path depth. A naive split on `/` can fail for paths like `owner/repo/src/app/page.tsx@sha:1-10` (4 levels deep).

**Why it happens:** The path portion can contain any number of `/` separators.

**How to avoid:** Split owner and repo from the first two segments, join the rest as path:
```typescript
const parts = repoAndPath.split("/");
const owner = parts[0];
const repo = parts[1];
const path = parts.slice(2).join("/");  // Handles any depth
```

**Warning signs:** GitHub permalink URLs are malformed for deeply nested files.

### Pitfall 4: Empty Citations Array

**What goes wrong:** Not all FastAPI responses have citations (e.g., "I don't know" responses or low-confidence answers may have zero citations). The CitationList component must handle `citations.length === 0` gracefully.

**Why it happens:** The FastAPI backend returns an empty `citations: []` array when no relevant chunks are found.

**How to avoid:** Return `null` from `CitationList` when there are no citations. Don't render the `<details>` element at all -- "Sources (0)" looks broken.

**Warning signs:** Empty "Sources (0)" section appears on responses that have no citations.

### Pitfall 5: Citations Still Appended as Markdown

**What goes wrong:** If the route handler is updated to write `source-url` chunks but still appends citations as markdown text, the user sees citations twice: once as structured UI and once as markdown text in the message body.

**Why it happens:** Forgetting to remove the Phase 13 markdown citation appending code from the route handler.

**How to avoid:** Remove the entire markdown citation block from `route.ts`:
```typescript
// REMOVE THIS BLOCK:
if (data.citations.length > 0) {
  text += "\n\n---\n**Sources:**\n";
  for (const cite of data.citations) {
    text += `- ${cite.source}\n`;
  }
}
```

Replace with `source-url` chunk writes.

**Warning signs:** Citations appear both as clickable links in the CitationList AND as raw text at the bottom of the message.

### Pitfall 6: useChat Generic Type for Metadata

**What goes wrong:** By default, `useChat` returns `UIMessage<unknown>` so `message.metadata` is typed as `unknown`. Accessing `.confidence` requires a type assertion or generic parameter.

**Why it happens:** TypeScript strictness -- `unknown` doesn't have a `.confidence` property.

**How to avoid:** Either:
1. Type-narrow with `messageMetadataSchema` in `useChat` options (cleanest, runtime-validated)
2. Use a type assertion: `(message.metadata as { confidence?: string })?.confidence`
3. Define a custom UIMessage type: `useChat<UIMessage<{ confidence?: string }>>()`

Option 1 is recommended as it provides runtime validation and type inference.

**Warning signs:** TypeScript error: "Property 'confidence' does not exist on type 'unknown'".

## Code Examples

### Example 1: Updated Route Handler (route.ts)

```typescript
// Source: Verified from ai@6.0.71 type declarations (UIMessageChunk types)
// and existing route.ts pattern (Phase 13)

const partId = "fastapi-response";
const stream = createUIMessageStream({
  execute: ({ writer }) => {
    // 1. Start with confidence metadata
    writer.write({
      type: "start",
      messageMetadata: { confidence: data.confidence },
    });

    // 2. Write answer text (no citations in text!)
    writer.write({ type: "text-start", id: partId });
    writer.write({ type: "text-delta", delta: data.answer, id: partId });
    writer.write({ type: "text-end", id: partId });

    // 3. Write each citation as a source-url part
    for (let i = 0; i < data.citations.length; i++) {
      const cite = data.citations[i];
      writer.write({
        type: "source-url",
        sourceId: `cite-${i}`,
        url: buildGitHubPermalink(cite.source),
        title: extractFilePath(cite.source),
      });
    }

    // 4. Finish
    writer.write({ type: "finish" });
  },
});
return createUIMessageStreamResponse({ stream });
```

### Example 2: ChatMessage Rendering Updated Parts

```tsx
// ChatMessage.tsx -- rendering source-url parts and confidence
type ChatMessageProps = {
  role: "user" | "assistant";
  parts: Array<{ type: string; text?: string; sourceId?: string; url?: string; title?: string }>;
  metadata?: { confidence?: "low" | "medium" | "high" };
  messageId: string;
  conversationId: string;
};

export function ChatMessage({ role, parts, metadata, messageId, conversationId }: ChatMessageProps) {
  const isUser = role === "user";

  // Extract text content for the message bubble
  const textContent = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");

  // Extract source-url parts for citations
  const citations = parts
    .filter((p) => p.type === "source-url")
    .map((p) => ({
      sourceId: p.sourceId ?? "",
      url: p.url ?? "",
      title: p.title,
    }));

  return (
    <div className={`flex gap-3 px-4 py-3 sm:px-6 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {/* ... unchanged ... */}

      <div className="max-w-[80%]">
        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-3 ${/* ... styles ... */}`}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{textContent}</p>
          ) : (
            <MarkdownRenderer content={textContent} />
          )}
        </div>

        {/* Confidence badge + citations (assistant only) */}
        {!isUser && textContent && (
          <div className="mt-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {metadata?.confidence && (
                <ConfidenceBadge level={metadata.confidence} />
              )}
              <FeedbackButtons conversationId={conversationId} messageId={messageId} />
            </div>
            <CitationList citations={citations} />
          </div>
        )}
      </div>
    </div>
  );
}
```

### Example 3: ChatInterface Passing Full Message Data

```tsx
// ChatInterface.tsx -- key change: pass parts + metadata instead of content string
{messages.map((message) => (
  <ChatMessage
    key={message.id}
    role={message.role as "user" | "assistant"}
    parts={message.parts ?? []}
    metadata={message.metadata as { confidence?: "low" | "medium" | "high" } | undefined}
    messageId={message.id}
    conversationId={conversationId}
  />
))}
```

### Example 4: Updated Suggested Prompts

```typescript
// SuggestedPrompts.tsx -- reflect RAG capabilities
const SUGGESTED_PROMPTS = [
  "How does the chatbot backend work?",
  "What projects has Dan built?",
  "How is the portfolio site deployed?",
  "What's Dan's experience with AI?",
];
```

### Example 5: Updated Privacy Disclosure

```tsx
// PrivacyDisclosure.tsx -- mention external service
<p>
  Conversations are sent to an external AI service and stored anonymously
  for up to 90 days. Don&rsquo;t share sensitive personal information.{" "}
  <a href="/contact" className="underline hover:text-text-secondary transition-colors">
    Privacy info
  </a>
</p>
```

## State of the Art

| Old Approach (Phase 13) | Current Approach (Phase 14) | When Changed | Impact |
|--------------------------|---------------------------|--------------|--------|
| Citations appended as markdown text | `source-url` chunks in UIMessageStream | Phase 14 | Structured, clickable, styleable citations with GitHub permalinks |
| No confidence indicator | `messageMetadata` with confidence on `start` chunk | Phase 14 | Users see how confident the answer is |
| Generic suggested prompts | RAG-aware suggested prompts | Phase 14 | Prompts match actual system capabilities |
| "processed by AI" privacy text | "sent to an external AI service" privacy text | Phase 14 | Accurate disclosure of data flow |

**Deprecated/outdated:**
- The Phase 13 pattern of appending `\n\n---\n**Sources:**\n` to the text body is replaced. Remove this code entirely from `route.ts`.
- The Phase 13 `content` prop on `ChatMessage` (plain string) is replaced with `parts` (full parts array) and `metadata`.

## Open Questions

### 1. Message Metadata Schema Validation on Client

**What we know:** The AI SDK supports `messageMetadataSchema` in `useChat` options for runtime validation of incoming metadata. This would automatically validate confidence values.

**What's unclear:** Whether adding the schema changes any runtime behavior (e.g., does it reject invalid metadata? Or just type-narrow?). The official docs show it for typing purposes but don't clarify error behavior.

**Recommendation:** Add the schema for type safety. If it causes issues, fall back to type assertion. This is LOW risk because our backend controls the metadata format.

### 2. Source-URL Chunk Order Relative to Text

**What we know:** The route handler writes text chunks first, then source-url chunks. The AI SDK type declarations show both chunk types exist in the union.

**What's unclear:** Whether source-url chunks must come after all text chunks, or can be interleaved. The official docs show `sendSources: true` which auto-sends them, suggesting order is handled internally.

**Recommendation:** Write source-url chunks AFTER text-end and BEFORE finish. This matches the logical flow (answer first, then sources) and is consistent with how `streamText` + `sendSources` would order them.

### 3. Safety Refusal Path Missing Metadata

**What we know:** The current route handler's error/refusal paths (FastApiError catch block) return plain JSON error responses, not UIMessageStream. These paths don't write `start` or `source-url` chunks.

**What's unclear:** Whether the error path needs to be updated. Currently errors are shown in a separate error div, not as assistant messages.

**Recommendation:** Leave error paths unchanged. Errors are displayed in the error banner, not as chat messages. Only successful FastAPI responses need citations and confidence.

## Sources

### Primary (HIGH confidence)
- `/Users/dweinbeck/Documents/personal-brand/node_modules/ai/dist/index.d.ts` lines 1303-1327 -- UIMessage interface with `metadata` and `parts` fields
- `/Users/dweinbeck/Documents/personal-brand/node_modules/ai/dist/index.d.ts` lines 1368-1374 -- SourceUrlUIPart type (`type: 'source-url'`, `sourceId`, `url`, `title`)
- `/Users/dweinbeck/Documents/personal-brand/node_modules/ai/dist/index.d.ts` lines 1797-1914 -- UIMessageChunk union type including `source-url`, `start` with `messageMetadata`, `message-metadata`
- `/Users/dweinbeck/Documents/personal-brand/node_modules/ai/dist/index.d.ts` lines 3789-3801 -- `createUIMessageStream` function signature
- `/Users/dweinbeck/Documents/personal-brand/src/app/api/assistant/chat/route.ts` -- Current route handler (Phase 13 implementation to be modified)
- `/Users/dweinbeck/Documents/personal-brand/src/components/assistant/ChatInterface.tsx` -- Current chat UI (to be modified)
- `/Users/dweinbeck/Documents/personal-brand/src/components/assistant/ChatMessage.tsx` -- Current message component (to be modified)
- `/Users/dweinbeck/Documents/personal-brand/src/lib/schemas/fastapi.ts` -- FastAPI response schema (citations, confidence)
- `/Users/dweinbeck/Documents/chatbot-assistant/app/routers/chat.py` lines 81-85 -- Citation source format construction
- `/Users/dweinbeck/Documents/chatbot-assistant/app/schemas/chat.py` -- Citation schema definition

### Secondary (MEDIUM confidence)
- `https://ai-sdk.dev/docs/ai-sdk-ui/chatbot` -- Official AI SDK docs showing `source-url` rendering and `messageMetadata` usage (fetched via WebFetch)
- `.planning/phases/13-proxy-integration/13-RESEARCH.md` -- Phase 13 research (UIMessageStream patterns, verified)
- `.planning/phases/13-proxy-integration/13-02-SUMMARY.md` -- Phase 13 summary confirming "structured citation UI in Phase 14"

### Tertiary (LOW confidence)
- None -- all findings verified against installed type declarations and official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; all capabilities verified in installed `ai@6.0.71` type declarations
- Architecture: HIGH -- `source-url` chunk and `SourceUrlUIPart` verified in type declarations; `messageMetadata` on `start` chunk verified; rendering pattern confirmed by official docs
- Pitfalls: HIGH -- all pitfalls derived from reading actual code in route.ts and ChatInterface.tsx; the "stripping parts to string" pitfall is observable in current line 118-122
- GitHub permalink: HIGH -- citation format verified from chatbot-assistant source code and tests; GitHub permalink URL format is stable and well-documented

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (stable -- `ai@6.0.71` and chatbot-assistant schemas are pinned)
