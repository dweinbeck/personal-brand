# Technical Design Document: dan-weinbeck.com

## System Architecture

Next.js 16 application using App Router with React Server Components. Hybrid rendering: SSG for static pages, ISR for GitHub data (hourly revalidation), server actions for the contact form, streaming route handlers for the AI assistant. Deployed as a Docker standalone build on GCP Cloud Run.

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  Next.js App (SSR/SSG hybrid)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ Pages    │ │Components│ │ Client Components ││
│  │ (Server) │ │ (Shared) │ │ (use client)     ││
│  └────┬─────┘ └──────────┘ └────────┬─────────┘│
└───────┼──────────────────────────────┼──────────┘
        │                              │
        ▼                              ▼
┌───────────────┐            ┌─────────────────┐
│ Server Actions│            │ GitHub REST API  │
│ (Cloud Run)   │            │ (External)       │
│               │            └─────────────────┘
│ - Contact form│
│               │            ┌─────────────────┐
│ Route Handlers│            │ Todoist REST API │
│ - AI chat API │            │ (External)       │
│ - Feedback API│            └─────────────────┘
│ - Facts CRUD  │
└───────┬───────┘            ┌─────────────────┐
        │                    │ Gemini 2.0 Flash │
        ▼                    │ (Google AI)      │
┌───────────────┐            └─────────────────┘
│ Firestore     │
│ - Contact msgs│            ┌─────────────────┐
│ - Conversations│           │ Firebase Auth    │
│ - Feedback    │            │ (Google Sign-In) │
│ - Facts/Config│            └─────────────────┘
└───────────────┘
```

## Component Hierarchy

### Pages (App Router)

```
src/app/
├── layout.tsx              # Root layout (AuthProvider, Navbar, Footer, fonts: Playfair/Inter/JetBrains)
├── page.tsx                # Home (Hero, FeaturedProjects, BlogTeaser)
├── globals.css             # Design tokens (navy/gold palette, shadows, animations)
├── opengraph-image.tsx     # Dynamic OG image (1200x630) via ImageResponse API (edge runtime)
├── icon.svg                # SVG favicon — "DW" in gold rounded square
├── projects/
│   └── page.tsx            # Detailed project grid with filtering/sorting (static curated data)
├── building-blocks/
│   ├── page.tsx            # Tutorial listing
│   └── [slug]/page.tsx     # Individual tutorial (dynamic MDX import)
├── writing/
│   └── page.tsx            # Article listing with placeholder cards (2-col grid)
├── assistant/
│   └── page.tsx            # AI chat interface (ChatInterface client component)
├── api/assistant/
│   ├── chat/route.ts       # Streaming chat API (Gemini 2.0 Flash)
│   ├── feedback/route.ts   # Feedback collection endpoint
│   ├── facts/route.ts      # Facts CRUD endpoint (admin)
│   ├── reindex/route.ts    # Knowledge cache clear endpoint
│   └── prompt-versions/route.ts # Prompt version rollback
├── contact/
│   └── page.tsx            # Contact page — hero CTAs, form, "Other Ways", privacy note
├── control-center/
│   ├── layout.tsx          # AdminGuard wrapper
│   ├── page.tsx            # Admin dashboard (GitHub repos + Todoist projects)
│   ├── assistant/
│   │   ├── page.tsx        # AI assistant analytics dashboard
│   │   └── facts/
│   │       └── page.tsx    # Canonical facts editor + prompt versions
│   └── todoist/
│       └── [projectId]/
│           └── page.tsx    # Todoist board view per project
├── sitemap.ts              # Generated sitemap.xml
└── robots.ts               # Generated robots.txt
```

### Shared Components

```
src/components/
├── layout/
│   ├── Navbar.tsx          # Server component — DW wordmark, warm glass backdrop
│   ├── NavLinks.tsx        # Client component — pill-style active state, mobile menu, admin link
│   ├── AuthButton.tsx      # Client component — gold-bordered sign-in pill, avatar with gold border
│   └── Footer.tsx          # Navy background footer with social links
├── assistant/
│   ├── ChatInterface.tsx   # Client component — useChat + DefaultChatTransport
│   ├── ChatMessage.tsx     # User/assistant message bubbles with feedback
│   ├── ChatInput.tsx       # Auto-resize textarea with Enter-to-send
│   ├── ChatHeader.tsx      # Title, status, brief description
│   ├── SuggestedPrompts.tsx # Prompt chips for core jobs-to-be-done
│   ├── MarkdownRenderer.tsx # Bold, links, lists, code rendering
│   ├── ExitRamps.tsx       # Email/LinkedIn/GitHub/Contact quick links
│   ├── TypingIndicator.tsx # Animated dots during streaming
│   ├── FeedbackButtons.tsx # Thumbs up/down after assistant responses
│   ├── HumanHandoff.tsx    # "Talk to Dan" mailto with conversation summary
│   ├── LeadCaptureFlow.tsx # In-chat lead form for hiring/consulting
│   └── PrivacyDisclosure.tsx # Privacy notice footer
├── admin/
│   ├── AdminGuard.tsx      # Client component — email-based admin route guard
│   ├── RepoCard.tsx        # GitHub repo card (name, last commit, purpose)
│   ├── TodoistProjectCard.tsx # Todoist project card (name, task count)
│   ├── TodoistBoard.tsx    # Board layout (sections as columns, tasks as cards)
│   ├── AssistantAnalytics.tsx # Stats cards (conversations, messages, satisfaction)
│   ├── TopQuestions.tsx     # Question ranking table
│   ├── UnansweredQuestions.tsx # Safety-blocked conversation list
│   ├── FactsEditor.tsx     # CRUD form (tabbed by category)
│   ├── PromptVersions.tsx  # Version history with rollback
│   └── ReindexButton.tsx   # Clear knowledge cache button
├── home/
│   ├── HeroSection.tsx     # Headshot, Playfair Display name, tagline pills, bio, social links, gold HR
│   ├── FeaturedProjects.tsx # Static curated project data (6 projects with status)
│   ├── ProjectCard.tsx     # Project card with status badge, tech tags, hover effects
│   └── BlogTeaser.tsx      # Writing teaser with gold left border
├── projects/
│   ├── DetailedProjectCard.tsx  # Rich project card (description, dates, visibility, "View Project" button)
│   └── ProjectsFilter.tsx       # Client component — tag chip filter + date sort dropdown
├── writing/
│   └── ArticleCard.tsx     # Article card with topic badge, date, excerpt, hover effects
├── contact/
│   ├── ContactForm.tsx     # Client component — useActionState + inline validation + analytics
│   ├── CopyEmailButton.tsx # Client component — click-to-copy with CTA variant + analytics
│   ├── EmailDanButton.tsx  # Client component — mailto CTA with analytics tracking
│   └── SubmitButton.tsx    # Client component — useFormStatus with loading spinner
└── ui/
    └── ...                 # Shared UI primitives
```

## Data Flows

### AI Assistant

1. `ChatInterface` (client component) uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport` pointing to `/api/assistant/chat`
2. User sends message via `sendMessage({ text })` — transport POSTs UI messages to route handler
3. Route handler validates with Zod, checks rate limit (10 msg/15min per IP), runs safety pipeline
4. Safety pipeline: sanitizes input (zero-width chars, HTML, encoding tricks), checks blocklist patterns and sensitive topics
5. If blocked: returns pre-approved refusal via `createUIMessageStream` without calling Gemini
6. If safe: builds system prompt from knowledge base (`src/data/` JSON/MD files), streams via `streamText()` with Gemini 2.0 Flash
7. Response streamed back via `toUIMessageStreamResponse()` — client renders incrementally
8. Conversation logged to Firestore `assistant_conversations` collection (fire-and-forget)
9. Feedback buttons (thumbs up/down) POST to `/api/assistant/feedback`
10. Admin dashboard at `/control-center/assistant` queries Firestore for analytics
11. Facts editor at `/control-center/assistant/facts` provides CRUD for Firestore-based fact overrides

**Knowledge Base (RAG approach):** Curated JSON/MD files in `src/data/` (~3K tokens total) loaded into the system prompt. No vector DB needed — fits entirely in context window. File-based data with optional Firestore overrides via admin editor.

**System Prompt Layers:**
1. Identity & behavior rules (~500 tokens) — tone, format, response structure
2. Canonical facts from `src/data/` (~2000 tokens) — bio, projects, services, FAQ
3. Site content index (~500 tokens) — page summaries with URLs for citations
4. Safety guardrails (~300 tokens) — immutable rules, content boundaries, manipulation defense

### Home Page Projects

1. `FeaturedProjects` exports a static array of 6 `PlaceholderProject` objects
2. Each project has `name`, `description`, `tags`, and `status` ("Live" | "In Development" | "Planning")
3. `ProjectCard` renders status badges with color-coded styles (gold, navy, burgundy)
4. GitHub API (`fetchGitHubRepos`) is still used by the admin Control Center for repo management

### Projects Page (Detailed)

1. `ProjectsPage` defines a static array of `DetailedProject` objects with extended fields
2. Each project has `name`, `description` (full paragraph), `tags`, `status`, `dateInitiated`, `lastCommit`, `visibility` ("public" | "private"), `detailUrl`
3. `ProjectsFilter` (client component) receives projects as props and manages filter/sort state
4. Tag chips allow filtering by any tag; sort dropdown offers "Recently updated", "Newest first", "Oldest first"
5. `DetailedProjectCard` renders rich cards with status badge, visibility badge, paragraph description, date range, tags, and "View Project" button
6. Grid uses 2-column layout on large screens (`lg:grid-cols-2`)

### Writing Page

1. `WritingPage` defines a static array of 4 `Article` objects (placeholder lorem ipsum)
2. Each article has `title`, `publishDate`, `topic`, and `excerpt`
3. `ArticleCard` renders topic badges with color-coded styles matching project status badges (gold for AI, navy for Development, burgundy for Analytics)
4. Cards display in a 2-column responsive grid matching the Projects page layout
5. Cards include hover lift effect and gold title shift, consistent with `ProjectCard`
6. Article links are non-functional (no individual article pages yet)

### Contact Form

1. Contact page renders hero section with three CTA buttons (Email Dan mailto, Copy Email, LinkedIn Message)
2. Microcopy displays typical reply time and urgent-subject tip
3. User fills out `ContactForm` (client component with `useActionState`)
4. Inline client-side validation triggers on blur and subsequent changes (email format, message min 10 chars)
5. Analytics stubs (`trackEvent`) fire for form_start (first focus), form_submit, form_error, copy_email, mailto_click
6. Form submits via React Server Action (`submitContact`)
7. Server action validates with Zod `safeParse` + `flatten` for field-level errors
8. Honeypot field check rejects bot submissions silently
9. In-memory rate limiter enforces 3 submissions per 15 minutes per IP
10. On success, submission is written to Firestore via Firebase Admin SDK
11. Success state: `<output>` element with check icon and "Sent -- thanks. I'll reply within 48 hours."
12. Failure state: amber alert box with "Couldn't send right now. Please email me at ..."
13. Loading state: submit button disabled with spinner animation
14. `<noscript>` fallback provides email-only contact for JS-disabled browsers
15. Privacy note below form discloses 90-day retention policy

### Firebase Auth (Google Sign-In)

1. `AuthProvider` context wraps app in root layout
2. `onAuthStateChanged` listener tracks user state client-side
3. `AuthButton` renders "Sign In" or avatar circle based on auth state
4. Sign-in uses `signInWithPopup` with `GoogleAuthProvider`
5. Firebase client SDK initialized lazily via getter to avoid SSR errors during prerender

### Admin Control Center

1. `AdminGuard` checks `user.email === "daniel.weinbeck@gmail.com"` via `AuthContext`
2. Non-admin users are redirected to home
3. `NavLinks` conditionally renders "Control Center" link for admin
4. Server component fetches all GitHub repos via authenticated `/user/repos` endpoint
5. README purpose extracted by decoding base64 content and finding first meaningful paragraph
6. Todoist projects fetched server-side; task counts resolved in parallel

### Todoist Integration

1. Server-side API client uses bearer token auth (`TODOIST_API_TOKEN`)
2. Projects listed via `GET /rest/v2/projects`
3. Board view fetches sections and tasks in parallel for a given project
4. Tasks grouped by `section_id` and rendered as columns
5. ISR caching with 5-minute revalidation

### MDX Tutorials

1. MDX files live in `src/content/building-blocks/`
2. Each file exports a typed `metadata` const (title, description, date)
3. Listing page imports all metadata objects for the index
4. Detail page uses dynamic `import()` in `[slug]/page.tsx` for Next.js static analysis compatibility
5. `@next/mdx` with `createMDX` configured for Turbopack (string plugin names, not imports)

## API / Server Action Contracts

### `submitContactForm(prevState, formData)`

Server Action for contact form submission.

**Input (FormData):**
- `name`: string (required, 2-100 chars)
- `email`: string (required, valid email)
- `message`: string (required, 10-5000 chars)
- `website`: string (honeypot — must be empty)

**Output:**
```typescript
{
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
}
```

### `fetchGitHubRepos(): Promise<GitHubRepo[]>`

Fetches public repos from GitHub REST API.

**Endpoint:** `https://api.github.com/users/dweinbeck/repos`
**Caching:** ISR with 1-hour revalidation
**Returns:** Typed array of repo objects (name, description, html_url, homepage, language, topics, stargazers_count)

### `fetchAllGitHubRepos(): Promise<AdminRepo[]>`

Fetches all repos (public + private) via authenticated GitHub API. Admin only.

**Endpoint:** `https://api.github.com/user/repos` (paginated)
**Auth:** `GITHUB_TOKEN` with `repo` scope
**Caching:** ISR with 1-hour revalidation
**Returns:** Array of `{ name, url, isPrivate, lastCommit, purpose }`

### `fetchTodoistProjects(): Promise<TodoistProject[]>`

Fetches all Todoist projects.

**Endpoint:** `https://api.todoist.com/rest/v2/projects`
**Auth:** Bearer token (`TODOIST_API_TOKEN`)
**Caching:** ISR with 5-minute revalidation

### `fetchProjectSections(projectId)` / `fetchProjectTasks(projectId)`

Fetches sections and tasks for a given Todoist project.

**Endpoints:** `/rest/v2/sections?project_id={id}`, `/rest/v2/tasks?project_id={id}`
**Auth:** Bearer token (`TODOIST_API_TOKEN`)
**Caching:** ISR with 5-minute revalidation

### `POST /api/assistant/chat`

Streaming chat API for the AI assistant.

**Input (JSON):**
```typescript
{
  id?: string;           // Conversation ID
  messages: {
    id: string;
    role: "user" | "assistant";
    parts?: { type: string; text?: string }[];
  }[];                   // Max 20 messages, max 1000 chars per message
}
```

**Output:** SSE stream (UI Message Stream format)

**Rate Limit:** 10 requests per 15 minutes per IP (429 with Retry-After header)

**Safety:** Input sanitized and checked against blocklist before reaching Gemini

### `POST /api/assistant/feedback`

Feedback collection for assistant responses.

**Input (JSON):**
```typescript
{
  conversationId: string;
  messageId: string;
  rating: "up" | "down";
  reason?: string;        // Max 500 chars
}
```

**Output:** `{ success: true }`

### `POST /api/assistant/facts` | `DELETE /api/assistant/facts?id={id}`

Admin CRUD for canonical facts (Firestore overrides).

### `POST /api/assistant/reindex`

Clears the in-memory knowledge cache, forcing reload from files on next request.

### `POST /api/assistant/prompt-versions`

Rolls back to a previous prompt version. Input: `{ action: "rollback", versionId: string }`.

## Error Handling

- **Contact form validation:** Zod schema with `safeParse` returns field-level errors displayed inline
- **Rate limiting:** In-memory Map tracking IP + timestamp; returns 429-style error message
- **Firebase connection:** Graceful degradation — warns at import if env vars missing, throws at write time
- **GitHub API:** ISR serves stale cache if API is unreachable; no client-side error state needed
- **Navigation:** Active link uses exact match for `/` and `startsWith` for other routes
- **AI Assistant rate limit:** In-memory Map tracking IP + timestamps; returns 429 with Retry-After header
- **AI Assistant safety:** Multi-layer pipeline (sanitize → detect → refuse) before Gemini call; blocked queries return pre-approved static refusals
- **AI Assistant streaming:** Error during Gemini streaming displays generic error in chat UI
- **AI conversation logging:** Fire-and-forget Firestore writes; failures logged to console only
- **AI knowledge cache:** In-memory cache of parsed data files; cleared via admin reindex endpoint

## Integration Points

### Firebase (Firestore + Auth)

- **Admin SDK:** `firebase-admin` (server-side) for Firestore writes
- **Client SDK:** `firebase` for Google Sign-In (browser-side)
- **Auth:** ADC on Cloud Run for admin SDK; `NEXT_PUBLIC_*` env vars for client SDK
- **Env vars needed:** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- **Collections:** `contact_submissions`, `assistant_conversations`, `assistant_feedback`, `assistant_facts`, `assistant_prompt_versions`, `assistant_leads`
- **Auth provider:** Google Sign-In via `signInWithPopup`
- **Admin check:** Client-side email comparison (`daniel.weinbeck@gmail.com`)

### GitHub REST API

- **Auth:** Unauthenticated for public repos (60 req/hour limit); optional `GITHUB_TOKEN` for higher limits
- **Endpoint:** `/users/dweinbeck/repos`
- **Caching:** Next.js ISR fetch cache with `revalidate: 3600`

### Todoist REST API

- **Auth:** Bearer token via `TODOIST_API_TOKEN`
- **Endpoints:** `/rest/v2/projects`, `/rest/v2/sections`, `/rest/v2/tasks`
- **Caching:** ISR with 5-minute revalidation
- **Usage:** Admin-only Control Center

### Google AI (Gemini)

- **SDK:** `ai` + `@ai-sdk/google` (Vercel AI SDK)
- **Model:** `gemini-2.0-flash` ($0.10/$0.40 per 1M tokens)
- **Auth:** `GOOGLE_GENERATIVE_AI_API_KEY` env var
- **Streaming:** `streamText()` → `toUIMessageStreamResponse()`
- **Client:** `useChat()` from `@ai-sdk/react` with `DefaultChatTransport`
- **Max output:** 1024 tokens per response
- **Temperature:** 0.7

### MDX / Content

- **Processor:** `@next/mdx` with `createMDX` wrapper
- **Plugins:** `remark-gfm`, `rehype-slug`, `@tailwindcss/typography`
- **Pattern:** String plugin names in config for Turbopack serialization compatibility

## Architecture Decision Records

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Next.js 16 + TypeScript | Dan's preference; SSR/SSG hybrid suits a portfolio site |
| 2 | GCP Cloud Run hosting | Dan's preference; scales to zero, cost-effective |
| 3 | Tailwind CSS v4 | Utility-first, minimal CSS bundle, fast iteration |
| 4 | Biome v2.3 over ESLint + Prettier | 10-25x faster; Next.js 16 removed built-in lint |
| 5 | Firebase Admin SDK only (v1) | No client SDK needed until AI assistant phase |
| 6 | GitHub API for project data | Always current, no manual curation |
| 7 | ISR over SSR for projects | Hourly revalidation balances freshness and performance |
| 8 | Server Actions over API routes | Simpler form handling with `useActionState` + Zod |
| 9 | In-memory rate limiting | Sufficient for single-server personal site |
| 10 | MDX with exported metadata objects | Type-safe extraction without YAML frontmatter parsing |
| 11 | `preload` over `priority` for Next.js 16 Image | Follows Next.js 16 Image component API |
| 12 | NavLinks as only `use client` component in layout | Minimal client JS; server/client split pattern |
| 20 | Static curated projects over GitHub API for public pages | Allows custom descriptions, status badges, and projects not yet on GitHub |
| 21 | Navy/gold palette (#063970/#C8A55A) with burgundy accent (#8B1E3F) | Founder aesthetic — sophisticated, editorial, avoids generic blue/gray |
| 22 | Playfair Display for hero name, Inter for body, JetBrains Mono for tech tags | Distinctive serif display with clean sans-serif body and monospace accents |
| 23 | Pill-style active nav with gold border over underline indicator | More visually distinctive; complements the overall design language |
| 17 | Firebase client SDK lazy initialization | Getter function avoids SSR errors during Next.js prerender |
| 18 | Client-side admin email check | Simple guard for personal site; no server-side token verification needed |
| 19 | Todoist ISR with 5-minute revalidation | Shorter than GitHub (1h) since task data changes more frequently |
| 13 | Child pages omit openGraph config | Inherit from root layout; avoids Next.js shallow merge pitfall |
| 14 | String plugin names in createMDX | Required for Turbopack serialization compatibility |
| 15 | `<output>` element for form status messages | Per Biome `useSemanticElements` rule |
| 16 | Alphabetical import ordering | Enforced by Biome; use `biome check --write` to auto-fix |
| 24 | Dynamic OG image via ImageResponse API | Edge runtime generates branded 1200x630 PNG on demand; no static file to maintain |
| 25 | SVG favicon via App Router `icon.svg` convention | Scalable at all sizes; no ICO conversion needed; Next.js serves automatically |
| 26 | Persistent gold underline on DW wordmark | `border-b-2 border-gold pb-0.5` — always visible, not just on hover |
| 27 | ArticleCard mirrors ProjectCard styling | Consistent card pattern (shadow, hover lift, gold title, color-coded badges) across Projects and Writing pages |
| 28 | Separate DetailedProject type from PlaceholderProject | Projects page needs extended fields (dates, visibility, detailUrl) that home page cards don't need; avoids coupling |
| 29 | Client-side filtering with server-rendered data | Static curated data passed as props to client component; no API needed for filtering/sorting |
| 30 | Analytics stubs via console.log `trackEvent` | No analytics provider until event volume justifies it; stubs capture intent and integration points |
| 31 | Client-side inline validation alongside server Zod validation | Immediate UX feedback on blur; server validation is authoritative; no duplication of schema |
| 32 | Noscript fallback for contact form | Email-only fallback ensures contact is always possible without JS |
| 33 | Gemini 2.0 Flash for AI assistant | GCP ecosystem, cheapest capable model ($0.10/$0.40 per 1M tokens) |
| 34 | Vercel AI SDK (`ai` + `@ai-sdk/google` + `@ai-sdk/react`) | Cloud-agnostic, `streamText()` + `useChat()` pairing |
| 35 | Curated JSON/MD knowledge base over vector DB | ~3K tokens fits in system prompt; deterministic, cheap, reliable |
| 36 | Route Handler over Server Action for chat API | Streaming requires persistent HTTP connection |
| 37 | In-memory rate limit for chat (same pattern as contact) | Proven pattern, acceptable for personal site traffic |
| 38 | Pre-approved static refusals for safety | Safer than LLM-generated refusals; blocked queries never reach API |
| 39 | SHA-256 hashed IPs in Firestore | Privacy-preserving; consistent with contact form approach |
| 40 | Fire-and-forget conversation logging | Non-blocking; failures don't affect user experience |
| 41 | Dedicated /assistant page (not floating widget) | Simpler, intentional UX; avoids layout complexity on other pages |

## Deployment Architecture

```
GitHub Repo -> Docker Build -> GCP Cloud Run
                                    │
                                    ├── Next.js standalone server
                                    ├── Server Actions (contact form)
                                    └── Scales to zero when idle
```

- **Docker:** Multi-stage build (install deps -> build -> copy standalone output)
- **Image target:** < 150MB (standalone output vs ~1GB with full node_modules)
- **Output mode:** `output: 'standalone'` in `next.config.ts`
- **Secrets:** Cloud Run environment variables / Secret Manager

## Limitations and Tradeoffs

- **In-memory rate limiting resets on deploy** — acceptable for a personal site; would need Redis for multi-instance
- **Unauthenticated GitHub API has 60 req/hour limit** — ISR caching mitigates this; add token if needed
- **Admin guard is client-side only** — email check happens in browser; acceptable for a personal admin dashboard
- **Todoist API token is server-side only** — never exposed to client
- **OG image generated at edge runtime** — uses `next/og` ImageResponse API with serif fallback font (no custom font loading)
- **Firebase env vars required for production** — contact form silently degrades without them in dev
- **No dark mode in v1** — deferred to v2 (DESIGN-01)
- **No custom error pages in v1** — deferred to v2 (DESIGN-02)
- **AI assistant rate limit resets on deploy** — same as contact form; acceptable for personal site
- **AI knowledge base is file-based with optional Firestore overrides** — changes to src/data/ require redeploy; Firestore overrides are immediate
- **No vector DB for RAG** — knowledge fits in system prompt (~3K tokens); would need vector DB if knowledge exceeds ~8K tokens
- **AI conversation logging is best-effort** — Firestore write failures are silently caught; no retry mechanism
