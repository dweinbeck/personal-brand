# Technical Design Document: dan-weinbeck.com

## System Architecture

Next.js 16 application using App Router with React Server Components. Hybrid rendering: SSG for static pages, ISR for GitHub data (hourly revalidation), server actions for the contact form. Deployed as a Docker standalone build on GCP Cloud Run.

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
│ - (Future AI) │            ┌─────────────────┐
└───────┬───────┘            │ Todoist REST API │
        │                    │ (External)       │
        ▼                    └─────────────────┘
┌───────────────┐
│ Firestore     │            ┌─────────────────┐
│ - Contact msgs│            │ Firebase Auth    │
│ - (Future)    │            │ (Google Sign-In) │
└───────────────┘            └─────────────────┘
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
│   └── page.tsx            # Full project grid (static curated data)
├── building-blocks/
│   ├── page.tsx            # Tutorial listing
│   └── [slug]/page.tsx     # Individual tutorial (dynamic MDX import)
├── writing/
│   └── page.tsx            # Article listing with placeholder cards (2-col grid)
├── assistant/
│   └── page.tsx            # Coming soon stub
├── contact/
│   └── page.tsx            # Contact form + social links
├── control-center/
│   ├── layout.tsx          # AdminGuard wrapper
│   ├── page.tsx            # Admin dashboard (GitHub repos + Todoist projects)
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
├── admin/
│   ├── AdminGuard.tsx      # Client component — email-based admin route guard
│   ├── RepoCard.tsx        # GitHub repo card (name, last commit, purpose)
│   ├── TodoistProjectCard.tsx # Todoist project card (name, task count)
│   └── TodoistBoard.tsx    # Board layout (sections as columns, tasks as cards)
├── home/
│   ├── HeroSection.tsx     # Headshot, Playfair Display name, tagline pills, bio, social links, gold HR
│   ├── FeaturedProjects.tsx # Static curated project data (6 projects with status)
│   ├── ProjectCard.tsx     # Project card with status badge, tech tags, hover effects
│   └── BlogTeaser.tsx      # Writing teaser with gold left border
├── writing/
│   └── ArticleCard.tsx     # Article card with topic badge, date, excerpt, hover effects
├── contact/
│   ├── ContactForm.tsx     # Client component — useActionState + Zod validation
│   └── CopyEmailButton.tsx # Client component — click-to-copy email
└── ui/
    └── ...                 # Shared UI primitives
```

## Data Flows

### Home Page Projects

1. `FeaturedProjects` exports a static array of 6 `PlaceholderProject` objects
2. Each project has `name`, `description`, `tags`, and `status` ("Live" | "In Development" | "Planning")
3. `ProjectCard` renders status badges with color-coded styles (gold, navy, burgundy)
4. `Projects` page imports the same `PlaceholderProject` type and renders the same static data
5. GitHub API (`fetchGitHubRepos`) is still used by the admin Control Center for repo management

### Writing Page

1. `WritingPage` defines a static array of 4 `Article` objects (placeholder lorem ipsum)
2. Each article has `title`, `publishDate`, `topic`, and `excerpt`
3. `ArticleCard` renders topic badges with color-coded styles matching project status badges (gold for AI, navy for Development, burgundy for Analytics)
4. Cards display in a 2-column responsive grid matching the Projects page layout
5. Cards include hover lift effect and gold title shift, consistent with `ProjectCard`
6. Article links are non-functional (no individual article pages yet)

### Contact Form

1. User fills out `ContactForm` (client component with `useActionState`)
2. Form submits via React Server Action (`submitContactForm`)
3. Server action validates with Zod `safeParse` + `flatten` for field-level errors
4. Honeypot field check rejects bot submissions silently
5. In-memory rate limiter enforces 3 submissions per 15 minutes per IP
6. On success, submission is written to Firestore via Firebase Admin SDK
7. Success/error status returned to client via `<output>` element

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

## Error Handling

- **Contact form validation:** Zod schema with `safeParse` returns field-level errors displayed inline
- **Rate limiting:** In-memory Map tracking IP + timestamp; returns 429-style error message
- **Firebase connection:** Graceful degradation — warns at import if env vars missing, throws at write time
- **GitHub API:** ISR serves stale cache if API is unreachable; no client-side error state needed
- **Navigation:** Active link uses exact match for `/` and `startsWith` for other routes

## Integration Points

### Firebase (Firestore + Auth)

- **Admin SDK:** `firebase-admin` (server-side) for Firestore writes
- **Client SDK:** `firebase` for Google Sign-In (browser-side)
- **Auth:** ADC on Cloud Run for admin SDK; `NEXT_PUBLIC_*` env vars for client SDK
- **Env vars needed:** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- **Collection:** Contact form submissions
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
