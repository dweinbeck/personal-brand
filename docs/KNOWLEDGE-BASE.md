# Knowledge Base Architecture

## Overview

The AI assistant ("Dan's AI") uses a two-layer knowledge system. Layer 1 is a separate FastAPI backend service that handles question answering via RAG (Retrieval-Augmented Generation). Layer 2 is the set of data files in this repo that power the site's UI components (project cards, app listings, tool listings, etc.). Both layers need to stay accurate and in sync to avoid contradictions between what the assistant says and what the site displays.

## Full Request Pipeline

When a user asks a question in the chat widget or assistant page, the request flows through this pipeline:

```
User types question
  -> ChatInterface (src/components/assistant/ChatInterface.tsx)
  -> ChatInput captures text, calls sendMessage()
  -> useChat hook (Vercel AI SDK) sends POST to /api/assistant/chat
  -> API route (src/app/api/assistant/chat/route.ts)
     - Validates request body with Zod (chatRequestSchema)
     - Extracts last user message text from UIMessage parts
  -> askFastApi() (src/lib/assistant/fastapi-client.ts)
     - POST to CHATBOT_API_URL/chat with question + API key
     - 15-second timeout via AbortSignal
     - Validates response shape with Zod (fastApiResponseSchema)
  -> FastAPI backend (chatbot-assistant repo, separate Cloud Run service)
     - RAG pipeline: retrieves relevant context from indexed knowledge base
     - Returns { answer, citations, confidence }
  -> API route builds UIMessageStream
     - Writes text chunks (the answer)
     - Writes source-url chunks (citations with GitHub permalinks)
     - Includes confidence metadata (low/medium/high)
  -> Streamed back to ChatInterface via useChat hook
  -> ChatMessage component renders response with formatted parts
```

## Layer 1: FastAPI Backend (chatbot-assistant repo)

The assistant's actual intelligence lives in a separate FastAPI service, deployed as its own Cloud Run instance.

- **Env var:** `CHATBOT_API_URL` points to this service
- **Auth:** `CHATBOT_API_KEY` sent as `X-API-Key` header
- **Protocol:** POST JSON `{ question }` -> JSON `{ answer, citations, confidence }`
- **RAG pipeline:** The backend uses Retrieval-Augmented Generation with indexed content about Dan's work, skills, and experience
- **Citations:** Each response includes source references that get converted to GitHub permalinks via `buildGitHubPermalink()` in `src/lib/citation-utils.ts`
- **Confidence scoring:** Returns `low`, `medium`, or `high` confidence which is displayed as metadata on the assistant's response

### Updating Layer 1

To update what the assistant knows:

1. Modify the knowledge base in the `chatbot-assistant` repo
2. Re-index the content (repo-specific process)
3. Redeploy the FastAPI service to Cloud Run
4. Verify with a test question that touches the updated content

### Error Handling

The API route maps FastAPI errors to user-friendly messages:

| FastAPI Status | User Message |
|---|---|
| Timeout | "The assistant is taking too long to respond. Please try again." |
| 429 | "Too many messages. Please wait a moment." |
| 503 | "The assistant is currently unavailable. Please try again later." |
| 500 | "The assistant service encountered an error. This may indicate the knowledge base needs to be re-synced." |

## Layer 2: Site Data Files (this repo)

These files power the UI components that display Dan's projects, apps, tools, and accomplishments. They are NOT fed to the assistant directly, but stale data here creates contradictions with what the assistant says.

| File | What It Powers | UI Location |
|---|---|---|
| `src/data/projects.json` | Project cards (name, status, description, tags) | `/projects`, home page |
| `src/data/apps.ts` | App listings (title, description, href, tech stack) | `/apps`, home page |
| `src/data/tools.ts` | Tool listings (title, description, href) | `/tools` |
| `src/data/custom-gpts.json` | Custom GPT listings (legacy, currently unused in UI) | Previously `/tools`, now superseded by `tools.ts` |
| `src/data/accomplishments.json` | Professional accomplishments (role, company, results) | `/accomplishments` |

### File Details

**projects.json** - Array of project objects with:
- `slug`: URL-safe identifier
- `repo`: GitHub repo path (null if private/internal)
- `featured`: Whether to show on home page
- `status`: "Live", "In Development", or "Planning"
- `name`, `description`, `tags`: Display metadata

**apps.ts** - Function `getApps()` returns app listings with:
- `slug`, `title`, `tag`, `subtitle`, `description`: Display metadata
- `href`: Route path or external URL
- `sameTab`: Whether to open in same tab (for external apps on same domain)
- `techStack`: Array of technology names

**tools.ts** - Function `getTools()` returns tool listings with:
- `slug`, `title`, `tag`, `subtitle`, `description`: Display metadata
- `href`: External URL (ChatGPT links)
- `external`: Always true (all tools are external GPTs)

**custom-gpts.json** - Legacy file, no longer consumed by any UI component. Kept for reference. The tools page now uses `getTools()` from `tools.ts`.

**accomplishments.json** - Array of professional accomplishment objects with:
- `slug`, `title`, `role`, `years`, `company`, `location`: Career metadata
- `companyLogo`: Path to logo image
- `tags`: Skill/domain tags
- `setup`, `workCompleted`, `results`: Narrative sections
- `skillsExercised`: Specific skills demonstrated

### Updating Layer 2

1. Edit the relevant file in `src/data/`
2. Run `npm run lint && npm run build` to verify
3. Commit and deploy

## When to Update

| Event | Update Layer 1 | Update Layer 2 |
|---|---|---|
| New app or tool added | Yes (so assistant knows about it) | Yes (so site displays it) |
| Project status changes (e.g., Planning -> Live) | Yes | Yes (`projects.json` status field) |
| Significant feature launch | Yes (new capabilities to discuss) | Yes (description updates) |
| Removing or renaming features | Yes | Yes |
| New accomplishment | Maybe (if assistant should discuss it) | Yes (`accomplishments.json`) |
| Bug fix or refactor | No | No |

## Key Integration Points

| Component | File | Role |
|---|---|---|
| `ChatInterface` | `src/components/assistant/ChatInterface.tsx` | Orchestrates chat UI, manages messages via `useChat` hook |
| `ChatInput` | `src/components/assistant/ChatInput.tsx` | Text input with Enter-to-send, Shift+Enter for newline |
| `ChatMessage` | `src/components/assistant/ChatMessage.tsx` | Renders individual messages with parts and metadata |
| `SuggestedPrompts` | `src/components/assistant/SuggestedPrompts.tsx` | Pre-built prompt buttons for empty state |
| `HumanHandoff` | `src/components/assistant/HumanHandoff.tsx` | Escalation to contact form after conversation |
| `ChatWidgetProvider` | `src/components/assistant/ChatWidgetProvider.tsx` | Popup widget wrapper, available site-wide |
| API Route | `src/app/api/assistant/chat/route.ts` | Server-side handler, validates + proxies to FastAPI |
| FastAPI Client | `src/lib/assistant/fastapi-client.ts` | Typed HTTP client for the FastAPI backend |
| Request Schema | `src/lib/schemas/assistant.ts` | Zod validation for incoming chat requests |
| Response Schema | `src/lib/schemas/fastapi.ts` | Zod validation for FastAPI responses |
| Citation Utils | `src/lib/citation-utils.ts` | Converts source references to GitHub permalinks |

## Maintenance Checklist

When auditing the knowledge base for accuracy:

- [ ] `projects.json` statuses match reality (Live/In Development/Planning)
- [ ] `projects.json` tags match actual tech stacks used
- [ ] `projects.json` descriptions match current functionality
- [ ] `apps.ts` hrefs point to correct, accessible routes
- [ ] `apps.ts` descriptions match current app capabilities
- [ ] `tools.ts` external links are still valid
- [ ] `accomplishments.json` entries are current and accurate
- [ ] FastAPI backend knowledge base is synced with latest site features
