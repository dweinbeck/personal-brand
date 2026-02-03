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
│ - (Future AI) │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Firestore     │
│ - Contact msgs│
│ - (Future)    │
└───────────────┘
```

## Component Hierarchy

### Pages (App Router)

```
src/app/
├── layout.tsx              # Root layout (Navbar, Footer, metadata, JSON-LD)
├── page.tsx                # Home (Hero, FeaturedProjects, BlogTeaser)
├── projects/
│   └── page.tsx            # Full project grid (GitHub API via ISR)
├── building-blocks/
│   ├── page.tsx            # Tutorial listing
│   └── [slug]/page.tsx     # Individual tutorial (dynamic MDX import)
├── writing/
│   └── page.tsx            # Coming soon stub
├── assistant/
│   └── page.tsx            # Coming soon stub
├── contact/
│   └── page.tsx            # Contact form + social links
├── sitemap.ts              # Generated sitemap.xml
└── robots.ts               # Generated robots.txt
```

### Shared Components

```
src/components/
├── layout/
│   ├── Navbar.tsx          # Server component — site navigation
│   ├── NavLinks.tsx        # Client component — active link state, mobile menu
│   └── Footer.tsx          # Footer with social links
├── home/
│   ├── Hero.tsx            # Headshot, tagline, CTA buttons
│   ├── FeaturedProjects.tsx # Async server component — top project cards from GitHub
│   └── BlogTeaser.tsx      # Writing section teaser
├── projects/
│   ├── ProjectCard.tsx     # Individual project card (description, language, topics)
│   └── ProjectGrid.tsx     # Responsive grid of project cards
├── contact/
│   ├── ContactForm.tsx     # Client component — useActionState + Zod validation
│   └── CopyEmailButton.tsx # Client component — click-to-copy email
└── ui/
    └── ...                 # Shared UI primitives
```

## Data Flows

### GitHub Projects

1. Server component calls `fetchGitHubRepos()` from `src/lib/github.ts`
2. Fetch uses `{ next: { revalidate: 3600 } }` for hourly ISR cache
3. Response is typed as `GitHubRepo[]` and filtered/sorted
4. No client-side fetching — server components render directly

### Contact Form

1. User fills out `ContactForm` (client component with `useActionState`)
2. Form submits via React Server Action (`submitContactForm`)
3. Server action validates with Zod `safeParse` + `flatten` for field-level errors
4. Honeypot field check rejects bot submissions silently
5. In-memory rate limiter enforces 3 submissions per 15 minutes per IP
6. On success, submission is written to Firestore via Firebase Admin SDK
7. Success/error status returned to client via `<output>` element

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

## Error Handling

- **Contact form validation:** Zod schema with `safeParse` returns field-level errors displayed inline
- **Rate limiting:** In-memory Map tracking IP + timestamp; returns 429-style error message
- **Firebase connection:** Graceful degradation — warns at import if env vars missing, throws at write time
- **GitHub API:** ISR serves stale cache if API is unreachable; no client-side error state needed
- **Navigation:** Active link uses exact match for `/` and `startsWith` for other routes

## Integration Points

### Firebase (Firestore)

- **SDK:** `firebase-admin` (server-side only, no client SDK in v1)
- **Auth:** Application Default Credentials (ADC) on Cloud Run; env vars in development
- **Env vars needed:** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- **Collection:** Contact form submissions
- **Graceful init:** Warns if env vars missing (dev without Firebase works), throws on actual write

### GitHub REST API

- **Auth:** Unauthenticated for public repos (60 req/hour limit); optional `GITHUB_TOKEN` for higher limits
- **Endpoint:** `/users/dweinbeck/repos`
- **Caching:** Next.js ISR fetch cache with `revalidate: 3600`

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
| 13 | Child pages omit openGraph config | Inherit from root layout; avoids Next.js shallow merge pitfall |
| 14 | String plugin names in createMDX | Required for Turbopack serialization compatibility |
| 15 | `<output>` element for form status messages | Per Biome `useSemanticElements` rule |
| 16 | Alphabetical import ordering | Enforced by Biome; use `biome check --write` to auto-fix |

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
- **No client-side Firebase SDK** — real-time features (AI chat) will require adding it in v2
- **OG image is a placeholder** — needs replacement with branded 1200x630 image before production
- **Firebase env vars required for production** — contact form silently degrades without them in dev
- **No dark mode in v1** — deferred to v2 (DESIGN-01)
- **No custom error pages in v1** — deferred to v2 (DESIGN-02)
