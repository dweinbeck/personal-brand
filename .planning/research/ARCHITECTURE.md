# Architecture Patterns: Control Center Content Editor + Brand Scraper UI

**Project:** personal-brand -- Control Center expansion
**Researched:** 2026-02-08
**Confidence:** HIGH (direct codebase analysis + verified patterns)

---

## Current Architecture Snapshot

```
src/
  app/
    control-center/
      layout.tsx                  -- Wraps all children in AdminGuard (client-side)
      page.tsx                    -- Dashboard: GitHub repos + Todoist projects (RSC, force-dynamic)
      todoist/[projectId]/page.tsx -- Kanban board for one Todoist project (RSC)
    api/
      assistant/chat/route.ts     -- Chatbot proxy: Next.js API -> FastAPI Cloud Run service
    building-blocks/
      page.tsx                    -- Tutorial listing (SSG)
      [slug]/page.tsx             -- MDX detail page (SSG via generateStaticParams)
  components/
    admin/
      AdminGuard.tsx              -- Client: Firebase email check, redirects non-admins
      RepoCard.tsx                -- Server component (presentational)
      TodoistProjectCard.tsx      -- Server component with Link to /control-center/todoist/[id]
      TodoistBoard.tsx            -- Presentational kanban board
  content/
    building-blocks/
      *.mdx                      -- Content files with `export const metadata = {...}`
  lib/
    auth/admin.ts                 -- verifyAdmin(): Firebase ID token verification for API routes
    tutorials.ts                  -- getAllTutorials(): filesystem MDX discovery
    assistant/fastapi-client.ts   -- Typed HTTP client for chatbot FastAPI service
    schemas/fastapi.ts            -- Zod schemas for FastAPI response validation
    actions/contact.ts            -- Server Action: Zod + honeypot + rate limit + Firestore
  context/
    AuthContext.tsx               -- Client: Firebase Auth state provider (user, loading)
```

### Established Patterns to Carry Forward

| Pattern | Where Used | Relevance to New Features |
|---------|-----------|--------------------------|
| AdminGuard wrapping layout | `control-center/layout.tsx` | New pages inherit this protection automatically |
| `verifyAdmin()` for API routes | `lib/auth/admin.ts` | Editor write API and scraper proxy MUST use this |
| FastAPI proxy via API route | `api/assistant/chat/route.ts` | Brand scraper proxy follows exact same pattern |
| Zod schema validation | `schemas/fastapi.ts`, `schemas/contact.ts` | Scraper response and editor input schemas |
| Server Action with `useActionState` | `actions/contact.ts` + `ContactForm.tsx` | Content editor save action pattern |
| Filesystem MDX discovery | `lib/tutorials.ts` | Editor needs to write files that this function discovers |
| `export const metadata` in MDX | `content/building-blocks/*.mdx` | Editor must generate this exact format |
| `force-dynamic` on control center pages | `control-center/page.tsx` | New pages also need this (admin data is never cached) |

---

## Recommended Architecture for New Features

### Overall Route Structure

Use **sub-routes** under `/control-center/`, not tabs on the existing page. Rationale:

1. The existing page (`page.tsx`) is a server component fetching repos + Todoist. Adding client-side tabs would require converting it to a client component or splitting into a layout -- unnecessary complexity.
2. Sub-routes get independent data fetching. The editor page needs different data (MDX file list) than the scraper page (job status).
3. Sub-routes get independent `force-dynamic` / caching control.
4. The existing pattern already uses sub-routes: `/control-center/todoist/[projectId]`.

**Proposed route tree:**

```
/control-center/                    -- Dashboard (existing: repos + todoist)
/control-center/content/            -- Content editor: list all MDX files
/control-center/content/new         -- Create new MDX article
/control-center/content/[slug]      -- Edit existing MDX article
/control-center/brand-scraper/      -- Brand scraper: submit URL, view results
```

### Navigation: Add a Sidebar/Nav to Control Center Layout

The existing `layout.tsx` is minimal (just AdminGuard). Add a lightweight nav component inside the AdminGuard:

```
ControlCenterLayout
  |-- AdminGuard
       |-- ControlCenterNav (new client component -- needs usePathname for active state)
       |     |-- Link: Dashboard (/control-center)
       |     |-- Link: Content (/control-center/content)
       |     |-- Link: Brand Scraper (/control-center/brand-scraper)
       |-- {children}
```

Use a horizontal nav bar (not a sidebar), matching the existing page's max-w-6xl constraint. Sidebar is overkill for 3 links and wastes horizontal space the editor needs.

---

## Feature 1: Content Editor

### Component Architecture

```
src/app/control-center/content/
  page.tsx                           -- List all MDX files (RSC, force-dynamic)
  new/page.tsx                       -- New article form (thin RSC wrapper)
  [slug]/page.tsx                    -- Edit article form (thin RSC wrapper, loads existing content)

src/components/admin/content-editor/
  ContentList.tsx                    -- Server component: table of all MDX files
  ContentEditorForm.tsx              -- Client component: textarea, metadata fields, preview, save
  MdxPreview.tsx                     -- Client component: rendered preview of MDX content

src/lib/actions/content.ts           -- Server Actions: saveContent, deleteContent
src/lib/schemas/content.ts           -- Zod schemas for content editor input
```

### Data Flow: Saving Content

```
ContentEditorForm (client)
  |-- User fills metadata fields + MDX textarea
  |-- Calls saveContent server action with FormData
       |
       v
saveContent (server action in lib/actions/content.ts)
  |-- "use server"
  |-- Parse FormData, validate with Zod (contentSchema)
  |-- Verify admin: call verifyAdminFromAction() (see Security section below)
  |-- Path validation: sanitize slug (alphanumeric + hyphens only)
  |-- Slug collision check: fs.existsSync on target path (for new articles)
  |-- Construct MDX content string:
  |     export const metadata = { title, description, publishedAt, tags };
  |     \n
  |     [markdown body]
  |-- fs.writeFileSync to src/content/building-blocks/{slug}.mdx
  |-- Return { success: true, slug }
```

### MDX Preview: Server-Side Compile, Client-Side Render

Do NOT compile MDX in the browser. The project already has `@mdx-js/loader` and `@mdx-js/react` installed, and the MDX compilation pipeline (remark-gfm, rehype-slug, rehype-pretty-code) is configured in `next.config.ts`. Replicating this in the browser would require shipping the entire compilation toolchain to the client.

**Recommended approach:** Use a preview API route that compiles MDX server-side and returns HTML.

```
User types in ContentEditorForm textarea
  |-- Debounce 500ms
  |-- POST /api/admin/preview-mdx with { content: string }
       |
       v
API Route (src/app/api/admin/preview-mdx/route.ts)
  |-- verifyAdmin(request) -- requires Firebase ID token
  |-- compile MDX string using @mdx-js/mdx compile() with outputFormat: "function-body"
  |     (same remark/rehype plugins as next.config.ts)
  |-- Return compiled function-body string
       |
       v
MdxPreview (client component)
  |-- Receives compiled string
  |-- Uses run() from @mdx-js/mdx with react/jsx-runtime to get component
  |-- Renders component inside prose wrapper

Alternative (simpler, recommended for v1):
  |-- Use react-markdown (already installed) for preview
  |-- Accepts raw markdown string, renders with remarkGfm
  |-- Does NOT support JSX in preview, but most content is plain markdown
  |-- Zero API calls, instant preview
  |-- Upgrade to full MDX preview later if JSX-in-content becomes common
```

**Recommendation for v1: Use `react-markdown` for preview.** It is already in `package.json`. The content is predominantly standard markdown. JSX components in MDX are rare for tutorial/article content. This avoids the complexity of a preview API route entirely. The preview will be 95% accurate -- the only gap is JSX syntax and custom components, which can be validated at save time by attempting a server-side MDX compile.

### Server Action Auth: The "use server" Challenge

Server Actions called via `useActionState` do NOT receive a `Request` object -- they receive `(prevState, formData)`. This means `verifyAdmin(request)` cannot be called directly. Two options:

**Option A (Recommended): Pass Firebase ID token in FormData.**

```typescript
// Client: ContentEditorForm.tsx
const { user } = useAuth();
const token = await user.getIdToken();
formData.append("_token", token);

// Server: actions/content.ts
const token = formData.get("_token") as string;
// Verify with Firebase Admin SDK directly (extract from verifyAdmin logic)
const decodedToken = await getAuth().verifyIdToken(token);
if (decodedToken.email !== ADMIN_EMAIL) throw new Error("Forbidden");
```

This is safe because: (a) the token is a Firebase ID token verified server-side, (b) formData is transmitted over HTTPS, (c) it follows the same pattern as the existing `verifyAdmin()` but without needing a Request object.

**Option B: Use API route instead of server action.** Converts the save operation to a `fetch` call to `/api/admin/content` where the full `verifyAdmin(request)` function works. Less idiomatic for form submission, but simpler auth.

**Choose Option A** because it keeps the save as a proper server action, enabling `useActionState` for form state management, which is the established pattern in this codebase (see `ContactForm.tsx`).

### Path Validation and Security

Content writes are the most security-sensitive operation in this feature. Enforce these constraints in the server action:

```typescript
// lib/actions/content.ts
const CONTENT_DIR = path.join(process.cwd(), "src", "content", "building-blocks");

function validateSlug(slug: string): boolean {
  // Only lowercase alphanumeric and hyphens
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length <= 100;
}

function safePath(slug: string): string {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  // Ensure resolved path stays within CONTENT_DIR (prevents path traversal)
  if (!filePath.startsWith(path.resolve(CONTENT_DIR))) {
    throw new Error("Invalid path");
  }
  return filePath;
}
```

### Ephemeral Filesystem: The Cloud Run Problem

**Critical architectural constraint:** This project deploys to Cloud Run via `output: "standalone"` Docker image. Cloud Run containers have ephemeral filesystems. Files written by `fs.writeFileSync` will:

- Persist during the container's lifetime (typically minutes to hours)
- Disappear when the container scales to zero or is replaced
- NOT survive redeployment

**This means the content editor CANNOT be used as a production CMS on Cloud Run.** However, it IS useful for:

1. **Local development workflow:** Write MDX locally, preview, test, then commit to git. This is the primary use case.
2. **Draft/preview on Cloud Run:** Drafts visible until container recycles. Acceptable for a single-user admin tool.

**For a production-ready CMS, future options include:**
- Store content in Firestore and compile MDX from DB at request time (using `next-mdx-remote` or `@mdx-js/mdx evaluate()`)
- Use GitHub API to commit files directly to the repository
- Use GCS (Google Cloud Storage) for content persistence

**Recommendation for this milestone:** Build the editor targeting local development workflow. The file-write approach works perfectly for `npm run dev`. Add a clear UI notice on the editor when deployed ("Changes persist until container recycles -- commit to git for permanence"). Defer the persistence problem to a future milestone if/when the editor sees heavy use.

---

## Feature 2: Brand Scraper UI

### Component Architecture

```
src/app/control-center/brand-scraper/
  page.tsx                           -- Scraper UI (thin RSC wrapper)

src/components/admin/brand-scraper/
  BrandScraperForm.tsx               -- Client component: URL input, submit, status polling
  BrandScraperResults.tsx            -- Client component: display BrandTaxonomy results
  BrandScraperJobStatus.tsx          -- Client component: polling indicator + status badge

src/app/api/admin/brand-scraper/
  route.ts                           -- POST proxy: submit scrape job
  [jobId]/route.ts                   -- GET proxy: poll job status

src/lib/brand-scraper/
  client.ts                          -- Typed HTTP client (mirrors fastapi-client.ts pattern)
  types.ts                           -- BrandTaxonomy type + Zod schemas

```

### Proxy Pattern: Route Through Next.js API (Not Direct)

**Use the same proxy pattern as the chatbot.** Reasons:

1. **CORS:** The brand scraper runs on a separate Cloud Run service. Browser-direct calls would need CORS headers configured on the scraper service. The proxy avoids this entirely.
2. **Auth:** The Next.js API route can verify the Firebase ID token server-side via `verifyAdmin()`. The scraper service does not need to know about Firebase auth.
3. **Secret isolation:** `BRAND_SCRAPER_API_URL` stays server-side. It is never exposed to the browser.
4. **Established pattern:** `api/assistant/chat/route.ts` already does exactly this for FastAPI. Follow the same structure.

### Data Flow

```
BrandScraperForm (client component)
  |-- User enters site_url, clicks "Scrape"
  |-- fetch POST /api/admin/brand-scraper with { site_url }
  |     Authorization: Bearer [firebase-id-token]
       |
       v
POST /api/admin/brand-scraper/route.ts (API route)
  |-- verifyAdmin(request)
  |-- Forward to BRAND_SCRAPER_API_URL: POST /scrape { site_url }
  |-- Return { job_id, status: "queued" }
       |
       v
BrandScraperForm receives job_id
  |-- Starts polling: GET /api/admin/brand-scraper/[jobId] every 3 seconds
       |
       v
GET /api/admin/brand-scraper/[jobId]/route.ts (API route)
  |-- verifyAdmin(request)
  |-- Forward to BRAND_SCRAPER_API_URL: GET /jobs/[jobId]
  |-- Return { job_id, status, result?, brand_json_url?, assets_zip_url? }
       |
       v
BrandScraperForm checks status:
  |-- "queued" or "processing" -> continue polling (show BrandScraperJobStatus)
  |-- "completed" -> stop polling, render BrandScraperResults with result data
  |-- "failed" -> stop polling, show error message
```

### Brand Scraper Client (lib/brand-scraper/client.ts)

Mirror the `fastapi-client.ts` pattern exactly:

```typescript
// lib/brand-scraper/client.ts
const BRAND_SCRAPER_API_URL = process.env.BRAND_SCRAPER_API_URL;

export class BrandScraperError extends Error {
  constructor(message: string, public status: number, public isTimeout = false) {
    super(message);
    this.name = "BrandScraperError";
  }
}

export async function submitScrapeJob(siteUrl: string): Promise<ScrapeJobResponse> {
  if (!BRAND_SCRAPER_API_URL) {
    throw new BrandScraperError("BRAND_SCRAPER_API_URL not configured", 503);
  }
  // POST /scrape with timeout, Zod validation of response
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  // GET /jobs/{jobId} with timeout, Zod validation of response
}
```

### State Management: React State + useRef for Polling

The brand scraper has two state concerns:

1. **Form state:** URL input, submission status. Use `useState` -- it is simple single-field form state.
2. **Polling state:** job_id, current status, result data, polling interval ref. Use `useState` for data + `useRef` for the interval ID + `useEffect` cleanup.

Do NOT use Context or URL state for this. Reasons:
- Only one component tree needs this state (the brand scraper page)
- No state sharing between pages
- URL state (`searchParams`) would clutter the URL with job IDs unnecessarily
- Context is for cross-tree state (like AuthContext); this is local to one page

```typescript
// BrandScraperForm.tsx
const [jobId, setJobId] = useState<string | null>(null);
const [status, setStatus] = useState<"idle" | "submitting" | "polling" | "completed" | "failed">("idle");
const [result, setResult] = useState<BrandTaxonomy | null>(null);
const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  };
}, []);
```

### Token Passing for API Route Calls

The brand scraper client components call API routes (not server actions), so they need to pass the Firebase ID token as a Bearer header:

```typescript
// BrandScraperForm.tsx
const { user } = useAuth();

async function handleSubmit() {
  const token = await user?.getIdToken();
  const res = await fetch("/api/admin/brand-scraper", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ site_url: url }),
  });
  // ...
}
```

This is the standard pattern for authenticated API calls in this project. The `verifyAdmin()` function in `lib/auth/admin.ts` already handles the Bearer token extraction and Firebase verification.

### Component Separation for Reuse

Keep the brand scraper cleanly separated:

```
src/components/admin/brand-scraper/   -- UI components (client)
src/lib/brand-scraper/                -- Business logic (server)
src/app/api/admin/brand-scraper/      -- API routes (server)
```

The `lib/brand-scraper/` module has no dependencies on admin UI components. The `types.ts` file exports the `BrandTaxonomy` type which could be consumed by any future feature that needs brand data (e.g., auto-theming, brand consistency checker).

---

## Component Organization Decision

**Where do new components go?** Two new subfolders inside `src/components/admin/`:

```
src/components/admin/
  AdminGuard.tsx                     -- (existing)
  RepoCard.tsx                       -- (existing)
  TodoistProjectCard.tsx             -- (existing)
  TodoistBoard.tsx                   -- (existing)
  ControlCenterNav.tsx               -- NEW: navigation for control center
  content-editor/                    -- NEW folder
    ContentList.tsx
    ContentEditorForm.tsx
    MdxPreview.tsx
  brand-scraper/                     -- NEW folder
    BrandScraperForm.tsx
    BrandScraperResults.tsx
    BrandScraperJobStatus.tsx
```

**Rationale for subfolders:** Each feature has 3+ components. Flat files in `admin/` would reach 10+ files and become unwieldy. Feature subfolders keep related components together. This mirrors how other component directories are organized (e.g., `components/home/`, `components/contact/`).

---

## Summary: New vs. Modified Files

### New Files

| File | Type | Purpose |
|------|------|---------|
| `src/app/control-center/content/page.tsx` | Page (RSC) | List all MDX content files |
| `src/app/control-center/content/new/page.tsx` | Page (RSC) | New content form wrapper |
| `src/app/control-center/content/[slug]/page.tsx` | Page (RSC) | Edit content form wrapper |
| `src/app/control-center/brand-scraper/page.tsx` | Page (RSC) | Brand scraper UI wrapper |
| `src/app/api/admin/preview-mdx/route.ts` | API Route | MDX preview endpoint (future, if react-markdown is insufficient) |
| `src/app/api/admin/brand-scraper/route.ts` | API Route | Proxy: submit scrape job |
| `src/app/api/admin/brand-scraper/[jobId]/route.ts` | API Route | Proxy: poll job status |
| `src/components/admin/ControlCenterNav.tsx` | Client Component | Navigation links with active state |
| `src/components/admin/content-editor/ContentList.tsx` | Server Component | Table/grid of MDX files |
| `src/components/admin/content-editor/ContentEditorForm.tsx` | Client Component | Metadata fields + textarea + preview |
| `src/components/admin/content-editor/MdxPreview.tsx` | Client Component | Live markdown preview (react-markdown) |
| `src/components/admin/brand-scraper/BrandScraperForm.tsx` | Client Component | URL input + submit + polling |
| `src/components/admin/brand-scraper/BrandScraperResults.tsx` | Client Component | Display brand taxonomy results |
| `src/components/admin/brand-scraper/BrandScraperJobStatus.tsx` | Client Component | Polling indicator + status badge |
| `src/lib/actions/content.ts` | Server Action | saveContent, deleteContent |
| `src/lib/schemas/content.ts` | Schema | Zod validation for content editor |
| `src/lib/brand-scraper/client.ts` | HTTP Client | Typed client for brand scraper API |
| `src/lib/brand-scraper/types.ts` | Types | BrandTaxonomy type + Zod schemas |

### Modified Files

| File | Change |
|------|--------|
| `src/app/control-center/layout.tsx` | Add ControlCenterNav inside AdminGuard |
| `src/lib/tutorials.ts` | Possibly extract shared MDX discovery logic (or keep separate) |

### No Changes Required

| File | Why |
|------|-----|
| `src/components/admin/AdminGuard.tsx` | Already wraps all control center routes |
| `src/lib/auth/admin.ts` | Already has `verifyAdmin()` for API routes |
| `src/context/AuthContext.tsx` | Already provides `useAuth()` for token access |
| `next.config.ts` | MDX pipeline already configured |

---

## Recommended Build Order

### Phase 1: Control Center Navigation

**Scope:** `ControlCenterNav` component + modify `layout.tsx`
**Files:** 2 (1 new, 1 modified)
**Dependencies:** None
**Rationale:** Foundation for all subsequent features. Without navigation, new pages are unreachable from the UI. Build this first so all subsequent work is immediately navigable.

### Phase 2: Content Editor -- List + Read

**Scope:** Content listing page, read-only view of existing MDX files
**Files:** 3 (content/page.tsx, ContentList.tsx, content/[slug]/page.tsx as read-only)
**Dependencies:** Phase 1 (navigation)
**Rationale:** Read-before-write. Proves the content discovery pipeline works in the admin context before adding mutation logic. Uses existing `getAllTutorials()` from `lib/tutorials.ts`.

### Phase 3: Content Editor -- Create + Edit + Preview

**Scope:** ContentEditorForm, MdxPreview, server actions, Zod schemas, new content page
**Files:** 6 (ContentEditorForm.tsx, MdxPreview.tsx, content/new/page.tsx, actions/content.ts, schemas/content.ts, modify content/[slug]/page.tsx)
**Dependencies:** Phase 2 (list page exists), react-markdown (already installed)
**Rationale:** Most complex feature with the most moving parts (form state, preview, server action, file I/O, auth). Built after read-only view is proven.

### Phase 4: Brand Scraper -- API Proxy + Types

**Scope:** API routes, typed client, Zod schemas
**Files:** 4 (route.ts, [jobId]/route.ts, client.ts, types.ts)
**Dependencies:** BRAND_SCRAPER_API_URL env var configured
**Rationale:** Server-side plumbing first. Can be tested with curl/Postman before UI exists. Mirrors the proven fastapi-client.ts pattern.

### Phase 5: Brand Scraper -- UI

**Scope:** BrandScraperForm, BrandScraperResults, BrandScraperJobStatus, page wrapper
**Files:** 4 (3 components + page.tsx)
**Dependencies:** Phase 4 (API proxy working)
**Rationale:** UI wired to working API. Polling logic is the key complexity.

### Phase Ordering Rationale

- Phase 1 first: all subsequent features need navigation.
- Phases 2-3 before 4-5: content editor is the more complex feature and touches filesystem I/O patterns that need careful testing. Ship it first.
- Phase 4 before 5: server plumbing proven before client UI wired up.
- Content editor and brand scraper are independent after Phase 1. They could be built in parallel by different developers if needed.

---

## Anti-Patterns to Avoid

### Do NOT convert the control center page.tsx to a client component

The existing dashboard page is a server component that fetches repos and Todoist data in parallel. Adding tabs or client-side navigation logic to this page would require `"use client"`, losing RSC data fetching. Use sub-routes and a separate nav component instead.

### Do NOT use `next-mdx-remote` for preview

The project uses `@next/mdx` (compile-time MDX via loader), not `next-mdx-remote` (runtime MDX). Introducing `next-mdx-remote` adds a second MDX compilation path. For preview, use `react-markdown` (already installed) or `@mdx-js/mdx` `compile()` directly. Do not mix MDX integration patterns.

### Do NOT poll brand scraper without a timeout/max-attempts limit

Scrape jobs can hang. Implement a maximum polling duration (e.g., 5 minutes) or maximum attempt count (e.g., 100 polls at 3s = 5 min). After timeout, show "Job is taking longer than expected" with a manual refresh button.

### Do NOT use server actions for the brand scraper

Server actions are for form mutations that return to the same page. The brand scraper needs: (a) async job submission, (b) polling for status, (c) streaming results. API routes with `fetch` from the client are the right pattern here. Server actions do not support polling.

### Do NOT store editor state in URL searchParams

The content editor has a full markdown body, metadata fields, and preview state. URL state is for shareable/bookmarkable state. Editor content is ephemeral work-in-progress. Use React `useState`. The slug in the URL path (`/content/[slug]`) is sufficient for identifying which article is being edited.

### Do NOT create a unified "admin API client" abstraction

The brand scraper client and chatbot client have different APIs, different response shapes, and different error handling. A unified abstraction would paper over these differences. Keep them as separate typed clients (`fastapi-client.ts`, `brand-scraper/client.ts`).

### Do NOT skip server-side auth on write operations

`AdminGuard` is client-side only -- it checks `user.email` in the browser. A determined user could bypass it. Every mutation (file write via server action, scrape job submission via API route) MUST verify the Firebase ID token server-side via `verifyAdmin()` or equivalent Firebase Admin SDK check.

---

## Scalability Considerations

| Concern | Current (1 user) | If Expanded |
|---------|------------------|-------------|
| Content editor file writes | Fine locally, ephemeral on Cloud Run | Move to Firestore or GitHub API for persistence |
| Brand scraper polling | Single user, 3s interval is fine | Add server-sent events or websocket for multi-user |
| MDX file count | 4 files, `readdirSync` is instant | Over 100 files: add pagination to ContentList |
| Navigation links | 3 links, horizontal nav | Over 6 links: switch to sidebar layout |

---

## Sources

- Direct codebase analysis of all files listed in architecture snapshot (HIGH confidence)
- `@mdx-js/mdx` compile/evaluate API: [MDX packages documentation](https://mdxjs.com/packages/mdx/) (HIGH confidence, official docs)
- `react-markdown` already in package.json at v10.1.0 (HIGH confidence, direct observation)
- Cloud Run ephemeral filesystem behavior: well-documented GCP constraint (HIGH confidence)
- Firebase ID token verification via `getAuth().verifyIdToken()`: already implemented in `src/lib/auth/admin.ts` (HIGH confidence, direct observation)
- Chatbot FastAPI proxy pattern: already implemented in `src/app/api/assistant/chat/route.ts` (HIGH confidence, direct observation)
