# Project Research Summary

**Project:** dan-weinbeck.com -- Control Center: Content Editor & Brand Scraper (v1.4)
**Domain:** Admin tooling -- MDX content authoring and async brand analysis dashboard
**Researched:** 2026-02-08
**Confidence:** HIGH

## Executive Summary

This milestone adds two independent admin tools to the existing Control Center at `/control-center/`: a Building Blocks Content Editor (form-guided MDX authoring with live preview and filesystem writes) and a Brand Scraper UI (URL submission, async job polling, and rich brand data gallery). The research conclusively shows that both features can be built with **one new dependency** (`swr@2.4.0` for polling) by leveraging existing packages (`react-markdown`, `@mdx-js/mdx`, `zod`) and established codebase patterns (Server Actions with `useActionState`, API route proxies, AdminGuard, Firebase auth). No heavy editor libraries, no component frameworks, no query libraries beyond SWR.

The most consequential architecture decision is already settled: **the content editor writes files to the local filesystem in development mode only**. Cloud Run's ephemeral filesystem, combined with the site's build-time MDX compilation via `@next/mdx` and `dynamicParams = false`, makes production filesystem writes fundamentally impossible -- not just impractical. Content authored in the editor is committed to git and deployed through Cloud Build like all other content. This constraint simplifies the entire editor architecture: no GitHub API integration, no Firestore content storage, no runtime MDX compilation. A plain textarea with `react-markdown` preview, backed by a `fs.writeFile()` Server Action gated on `NODE_ENV === "development"`, is the right approach.

The brand scraper follows the proven chatbot proxy pattern: a Next.js API route proxies requests to the deployed Fastify Cloud Run service, keeping `BRAND_SCRAPER_API_URL` server-side and reusing `verifyAdmin()` for auth. SWR's `refreshInterval` with dynamic control handles the poll-until-complete pattern cleanly. The primary risks are GCS signed URL expiration (images break after 1 hour), polling memory leaks if `useEffect` cleanup is wrong, and rendering performance with large `BrandTaxonomy` responses. All are solvable with standard patterns documented in PITFALLS.md.

## Key Findings

### Recommended Stack

See full details: [STACK.md](.planning/research/STACK.md)

The stack delta is minimal by design. The existing codebase already contains every library needed except one.

**Core technologies (all existing except SWR):**
- **`swr@2.4.0`** (NEW): Brand scraper job polling -- built-in `refreshInterval` with dynamic stop, ~4.5 kB gzipped, Vercel ecosystem
- **`react-markdown@10.1.0`** (existing): Live preview in the content editor -- already proven in the assistant chat
- **`@mdx-js/mdx@3.1.1`** (existing, transitive): Server-side MDX validation via `evaluate()` before saving
- **`zod@4.3.6`** (existing): Form validation for content metadata and brand scraper API responses
- **React 19 `useActionState`** (existing): Form state management for content editor, matching the contact form pattern

**What NOT to add (and why):**
- MDXEditor (851 kB gzip), `@uiw/react-md-editor` (200 kB), CodeMirror, Monaco -- overkill for a single-admin markdown textarea
- `@tanstack/react-query` -- heavier than SWR, unnecessary for polling one endpoint
- `react-hook-form` -- 5 flat fields handled by `useActionState`
- `shadcn/ui` or Radix -- project has its own design system (Button, Card)
- `next-mdx-remote` -- would introduce a second MDX compilation path; use `react-markdown` for preview instead

### Expected Features

See full details: [FEATURES.md](.planning/research/FEATURES.md)

**Content Editor -- must have (table stakes):**
- TS-1: Metadata form fields (title, description, publishedAt, tags) matching `TutorialMeta`
- TS-2: Slug auto-generation from title with uniqueness validation against existing files
- TS-3: Plain textarea with markdown toolbar (heading, bold, code, link quick-insert)
- TS-4: Edit/Preview tab toggle using `react-markdown` with `remark-gfm` and prose classes
- TS-5: Save to filesystem via Server Action (`fs.writeFile`, dev-only, assembles `export const metadata` + body)
- TS-6: Unsaved changes protection (`beforeunload` + dirty state tracking)

**Content Editor -- should have:**
- D-3: Word count and estimated reading time (trivial, reuses existing `calculateReadingTime()` formula)
- D-4: Draft support via `_draft-` filename prefix (leverages existing underscore-skip convention in `tutorials.ts`)

**Content Editor -- defer to v2+:**
- D-1: Edit existing tutorials (medium effort, can use manual file editing for now)
- D-2: Fast companion file support (edge case)
- AF-1 through AF-6: WYSIWYG editing, image upload, collaboration, revision history, scheduling, SEO analysis

**Brand Scraper -- must have (table stakes):**
- TS-7: URL submission form with validation
- TS-8: Job status polling with SWR (queued/processing/succeeded/partial/failed states)
- TS-9: Brand data gallery (color palette, typography, logos, design tokens, identity sections)
- TS-10: Confidence indicators (three-tier color system using existing `--color-sage`/`--color-amber` tokens)
- TS-11: Download links for `brand.json` and `assets.zip` via GCS signed URLs

**Brand Scraper -- should have:**
- D-5: Brand gallery/history in Firestore (transforms tool from single-use to brand reference library)

**Brand Scraper -- defer to v2+:**
- D-6: Color contrast matrix (WCAG)
- D-7: Re-scrape button
- D-8: Side-by-side brand comparison
- AF-7 through AF-11: WebSocket streaming, manual data editing, automated monitoring, design tool export, public sharing

### Architecture Approach

See full details: [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md)

Both features are implemented as **sub-routes** under `/control-center/` (not tabs on the existing page), following the established Todoist sub-route pattern. A new `ControlCenterNav` horizontal nav component is added inside the AdminGuard wrapper in `layout.tsx`. The content editor uses Server Actions for filesystem writes; the brand scraper uses API route proxies. Components are organized into feature subfolders (`components/admin/content-editor/`, `components/admin/brand-scraper/`) to keep the `admin/` directory manageable.

**Major components:**
1. **Control Center Navigation** -- horizontal nav bar with Dashboard/Content/Brand Scraper links, `usePathname` for active state
2. **Content Editor** -- `ContentEditorForm` (client) with metadata fields + textarea, `MdxPreview` (client) with `react-markdown`, `saveContent` Server Action with Zod validation + path traversal protection + dev-only guard
3. **Brand Scraper Proxy** -- API routes at `/api/admin/brand-scraper/` mirroring the chatbot proxy pattern, typed `BrandScraperClient` in `lib/brand-scraper/client.ts`
4. **Brand Scraper UI** -- `BrandScraperForm` (URL input + SWR polling), `BrandScraperResults` (gallery sections for colors, typography, logos, tokens), `BrandScraperJobStatus` (polling indicator)

**Key architecture decisions:**
- Content editor pages are RSC wrappers around client form components (matches contact form pattern)
- Brand scraper uses API routes (not Server Actions) because polling requires `fetch` calls, not form submissions
- Server-side auth (`verifyAdmin()` / Firebase token verification) is mandatory on every mutation -- AdminGuard is client-side only
- `react-markdown` for preview (not full MDX compilation) -- 95% accurate, zero API calls, instant rendering
- State management: `useState` for form/polling state, no Context, no URL params for editor content

### Critical Pitfalls

See full details: [PITFALLS.md](.planning/research/PITFALLS.md)

1. **Ephemeral filesystem on Cloud Run (P1)** -- Files written at runtime vanish on restart/redeploy. The standalone Dockerfile does not even include `src/content/` in the production image. MDX is compiled at build time; runtime writes are invisible to `@next/mdx`. The editor MUST gate writes on `NODE_ENV === "development"` and show a clear warning in production.

2. **Invalid MDX breaks the entire site build (P2)** -- A single syntax error in an MDX file blocks deployment of ALL content. Validate MDX with `@mdx-js/mdx evaluate()` before saving. The form-guided editor eliminates metadata syntax errors; only the body needs validation.

3. **Path traversal in slug input (P3)** -- A slug like `../../lib/firebase` escapes the content directory. Sanitize with `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/` regex AND validate the resolved path stays within `CONTENT_DIR` using `path.resolve()`.

4. **Client-side AdminGuard does not protect server mutations (P4)** -- Every Server Action and API route must verify the Firebase ID token server-side. For Server Actions, pass the token via FormData; for API routes, use the existing `verifyAdmin()` with Bearer header.

5. **Polling memory leaks (P7)** -- Use `setTimeout` chains (not `setInterval`) with proper `useEffect` cleanup. SWR handles this correctly with `refreshInterval` set to `0` when job completes. Add a max polling duration (5 minutes) as a safety net.

## Implications for Roadmap

Based on the dependency chains, architecture patterns, and pitfall severity, the research suggests 5 phases:

### Phase 1: Control Center Navigation

**Rationale:** Foundation for all subsequent features. Without navigation, new pages are unreachable. Smallest possible scope to establish the routing pattern.
**Delivers:** `ControlCenterNav` component, modified `layout.tsx`, working links to Dashboard/Content/Brand Scraper (content and scraper pages can be placeholder/empty initially)
**Addresses:** Pitfall 16 (route state on refresh) by using proper Next.js routes instead of client-side tabs
**Avoids:** Converting existing `page.tsx` to client component (anti-pattern identified in ARCHITECTURE.md)
**Estimated scope:** 2 files (1 new component, 1 modified layout)

### Phase 2: Content Editor -- Listing + Server Action Scaffolding

**Rationale:** Read-before-write. Proves the content discovery pipeline works in the admin context before adding mutation logic. Also establishes the Zod schema, Server Action skeleton, and server-side auth pattern that Phase 3 depends on. Getting slug sanitization and path traversal prevention right at this stage avoids security issues later.
**Delivers:** Content listing page showing existing MDX files, Zod content schema, Server Action with auth verification and dev-only guard (save logic implemented but not yet wired to UI), slug utility with validation
**Addresses:** TS-2 (slug validation infrastructure), Pitfall 3 (path traversal), Pitfall 4 (server-side auth), Pitfall 5 (slug collision)
**Uses:** Existing `getAllTutorials()` from `lib/tutorials.ts` for listing
**Estimated scope:** 5 files (content page, ContentList component, Zod schema, Server Action, slug utility)

### Phase 3: Content Editor -- Form, Preview, Save

**Rationale:** Most complex feature in the milestone. Depends on Phase 2's schema, action, and listing. Contains the full create/preview/save loop. Bundles all content editor table stakes plus low-effort differentiators.
**Delivers:** Working content editor with metadata form, markdown textarea with toolbar, Edit/Preview tab toggle via `react-markdown`, save to filesystem, unsaved changes protection, word count, draft support
**Addresses:** TS-1, TS-3, TS-4, TS-5, TS-6 (all remaining content editor table stakes), D-3, D-4 (low-effort differentiators)
**Avoids:** Pitfall 2 (MDX validation before save), Pitfall 6 (no MDX compiler in client bundle), Pitfall 10 (unsaved changes via `beforeunload`), Pitfall 13 (preview parity via shared prose classes + `remark-gfm`), Pitfall 14 (bundle size -- textarea, not rich editor)
**Estimated scope:** 5 files (ContentEditorForm, MdxPreview, new/page.tsx, [slug]/page.tsx for edit, EditorTabs or inline tab toggle)

### Phase 4: Brand Scraper -- API Proxy + Types

**Rationale:** Server-side plumbing before UI. Can be tested with curl independently of any frontend code. Mirrors the proven `fastapi-client.ts` pattern exactly. This is the phase where the `BrandTaxonomy` response shape is confirmed against the live API.
**Delivers:** Working API proxy (POST submit job, GET poll status), typed `BrandScraperClient`, Zod schemas for `BrandTaxonomy` response, `BRAND_SCRAPER_API_URL` env var integration
**Addresses:** API proxy infrastructure needed by all brand scraper UI features
**Avoids:** Pitfall 4 (auth on every route via `verifyAdmin()`), Pitfall 15 (error message mapping at proxy layer)
**Estimated scope:** 4 files (2 API routes, client.ts, types.ts)

### Phase 5: Brand Scraper -- UI + Results Gallery

**Rationale:** UI wired to working API from Phase 4. Polling logic and gallery rendering are the key complexities. SWR is installed at the start of this phase. This is the largest phase by component count but each component is straightforward (display-only with Tailwind).
**Delivers:** URL submission form, SWR-based job polling with status display, full brand data gallery (colors, typography, logos, tokens, identity sections), confidence badges, download links
**Addresses:** TS-7, TS-8, TS-9, TS-10, TS-11 (all brand scraper table stakes)
**Avoids:** Pitfall 7 (polling leaks -- SWR handles cleanup), Pitfall 8 (signed URL expiration -- display timestamp, auto-refresh on image error), Pitfall 9 (CORS -- use `<img>` for display, proxy API route for downloads), Pitfall 11 (large responses -- lazy-load images, collapse secondary sections), Pitfall 17 (mobile responsiveness -- responsive grid for brand cards)
**Estimated scope:** 7+ files (page, form, job status, results container, color/typography/logo/token sections, confidence badge, download links)

### Phase Ordering Rationale

- **Phase 1 first:** Every other phase needs navigation to be reachable in the UI.
- **Phases 2-3 before 4-5:** Content editor is the more architecturally complex feature (filesystem writes, MDX validation, auth in Server Actions via FormData token). Ship it first to surface issues early. Brand scraper follows proven patterns (API proxy, polling) with lower novelty risk.
- **Phase 2 before 3:** Read-only listing + schema + auth validation before write operations. This catches path traversal and slug collision bugs before the form exists to trigger them.
- **Phase 4 before 5:** Server proxy tested independently before client polling is wired up. Matches "plumbing then UI" principle from the chatbot integration.
- **Content editor (2-3) and brand scraper (4-5) are independent after Phase 1.** They could be parallelized by different developers if needed, though the roadmapper may choose sequential ordering for a solo developer.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (Content Editor Form):** The `useActionState` + Firebase token-via-FormData pattern for Server Actions has nuance. The token is passed as a hidden field, verified server-side with `getAuth().verifyIdToken()`. May need a spike to confirm the auth flow works end-to-end before building the full form.
- **Phase 5 (Brand Scraper UI):** The `BrandTaxonomy` response shape from the Fastify API must be confirmed against the live service before Zod schemas and gallery components are finalized. If the response shape differs from assumptions, gallery components need adjustment. Recommend running a test scrape during Phase 4 and documenting the actual JSON.

**Phases with standard patterns (skip deep research):**
- **Phase 1 (Navigation):** Standard Next.js layout + `usePathname` for active state. Fully documented pattern.
- **Phase 2 (Content Listing):** Reuses existing `getAllTutorials()`. Zod schema is trivial. Straightforward.
- **Phase 4 (API Proxy):** Carbon copy of the chatbot proxy pattern already working in the codebase at `src/app/api/assistant/chat/route.ts`.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only 1 new dep (SWR). All other packages already installed and proven in this codebase. Version compatibility verified on npm. |
| Features | HIGH | Feature landscape derived from direct codebase analysis of existing content system, AdminGuard, and control center patterns. Table stakes/differentiator split is clear. Anti-features well-justified. |
| Architecture | HIGH | Component structure, route tree, data flow, and auth patterns all mirror established codebase patterns. No novel architecture introduced. Every proposed pattern has a working precedent in the existing code. |
| Pitfalls | HIGH | 5 critical + 8 moderate + 4 minor pitfalls identified with concrete prevention strategies. Verified against Dockerfile, next.config.ts, AdminGuard source, Cloud Run docs, and GCP documentation. |

**Overall confidence:** HIGH

### Gaps to Address

1. **BrandTaxonomy response schema:** The exact JSON shape returned by the Fastify brand scraper API needs to be confirmed against the live service. The Zod schema in Phase 4 should be written from actual API responses, not assumptions. Run a test scrape job during Phase 4 planning and use the real response to define `types.ts`.

2. **GCS signed URL TTL:** Assumed 1 hour based on common defaults. Confirm actual TTL from the brand scraper service configuration. This affects whether URL expiration warnings and auto-refresh logic are needed in the UI, or if TTLs are long enough to ignore.

3. **Content editor "edit existing" flow (D-1):** Deferred from MVP but will be the most requested follow-up. The MDX parsing infrastructure already exists in `tutorials.ts` (`extractMetadataFromSource()`). When prioritized post-MVP, this should be straightforward to add as an enhancement to Phase 3's `[slug]/page.tsx`.

4. **`next.config.ts` `images.remotePatterns`:** If brand scraper results include image URLs from GCS, and the UI uses Next.js `<Image>` components (for optimization), the GCS hostname must be added to `remotePatterns`. Alternatively, use plain `<img>` tags for admin-only brand asset display (simpler, no config change needed). Decision point during Phase 5 implementation.

5. **Server Action auth pattern:** The recommended approach (Firebase ID token passed via FormData, verified with `getAuth().verifyIdToken()`) is sound but differs from the API route pattern (Bearer header). If this proves awkward during Phase 2 implementation, the fallback is to use an API route for the save operation instead of a Server Action, which the ARCHITECTURE researcher documented as Option B.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `Dockerfile`, `next.config.ts`, `src/lib/tutorials.ts`, `src/content/building-blocks/*.mdx`, `src/app/control-center/`, `src/components/admin/AdminGuard.tsx`, `src/lib/auth/admin.ts`, `src/lib/actions/contact.ts`, `src/app/api/assistant/chat/route.ts`, `src/app/building-blocks/[slug]/page.tsx`
- [MDX packages documentation](https://mdxjs.com/packages/mdx/) -- compile/evaluate API for validation
- [MDX troubleshooting](https://mdxjs.com/docs/troubleshooting-mdx/) -- common MDX syntax errors that break builds
- [MDX on-demand compilation](https://mdxjs.com/guides/mdx-on-demand/) -- evaluate() function for runtime validation
- [SWR API reference](https://swr.vercel.app/docs/api) -- dynamic `refreshInterval` for polling
- [Cloud Run container contract](https://docs.cloud.google.com/run/docs/container-contract) -- ephemeral filesystem behavior
- [GCS signed URLs](https://cloud.google.com/storage/docs/access-control/signed-urls) -- expiration behavior
- [GCS CORS configuration](https://cloud.google.com/storage/docs/cross-origin) -- browser access patterns for signed URLs
- [Next.js security: Server Components and Actions](https://nextjs.org/blog/security-nextjs-server-components-actions) -- server-side auth requirements
- [React useEffect cleanup](https://react.dev/learn/synchronizing-with-effects) -- polling cleanup patterns
- [Firebase Admin Auth](https://firebase.google.com/docs/auth/admin/) -- verifyIdToken for server-side auth

### Secondary (MEDIUM confidence)
- [Next.js Security Checklist (Arcjet)](https://blog.arcjet.com/next-js-security-checklist/) -- path traversal prevention patterns
- [CMS slug patterns (Sanity, DatoCMS)](https://www.sanity.io/answers/best-practice-validation-for-different-types-of-fields-slugs-titles-etc) -- slug validation rules
- [Next.js App Router unsaved changes](https://github.com/vercel/next.js/discussions/50700) -- community patterns for `beforeunload` in App Router
- [Brand.dev Styleguide API](https://docs.brand.dev/api-reference/screenshot-styleguide/extract-design-system-and-styleguide-from-website) -- brand data display reference implementation
- [Confidence Visualization Patterns](https://agentic-design.ai/patterns/ui-ux-patterns/confidence-visualization-patterns) -- tiered badge patterns
- [5 Best Markdown Editors for React (Strapi)](https://strapi.io/blog/top-5-markdown-editors-for-react) -- editor comparison (evaluated, all rejected)

### Tertiary (LOW confidence)
- BrandTaxonomy response shape -- inferred from project context, needs validation against live Fastify API
- GCS signed URL TTL -- assumed 1 hour, needs confirmation from brand scraper service config

---
*Research completed: 2026-02-08*
*Ready for roadmap: yes*
