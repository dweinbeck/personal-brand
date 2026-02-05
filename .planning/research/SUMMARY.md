# Project Research Summary

**Project:** personal-brand v1.1 page buildout and branding polish
**Domain:** Developer portfolio / personal brand site enhancement
**Researched:** 2026-02-04
**Confidence:** HIGH

## Executive Summary

This project enhances an existing Next.js personal site from scaffolded placeholders to polished, complete pages. The research confirms that all v1.1 features can be built with zero new dependencies — the existing stack (Next.js 16, React 19, Tailwind v4, MDX, Firebase Admin, GitHub API integration) already provides every capability needed. The work is primarily UI/UX enhancement and content structure definition, not architectural expansion.

The recommended approach is to build in four phases ordered by risk and dependency. Start with static assets (favicon, OG image, logo accent) for immediate visual polish with zero risk. Follow with projects page enhancement (extends proven GitHub ISR pattern), writing page buildout (replicates established MDX pattern from building-blocks), and finally contact redesign (most UX complexity, benefits from patterns established in earlier phases). This ordering minimizes rework risk and allows each phase to validate deployment and integration patterns.

Key risks center on data model unification (homepage and projects page currently have separate hardcoded data sources that will drift) and feature completeness without content (building a blog infrastructure with zero articles is wasted effort). Mitigations: establish a single source of truth for project data before UI work, and define the writing content schema (frontmatter structure, metadata requirements) before building article cards. Analytics instrumentation is required for contact success metrics but no provider is chosen yet — stub the event tracking layer early and defer the provider decision to avoid premature dependencies.

## Key Findings

### Recommended Stack

**Zero new dependencies needed.** Every v1.1 feature builds on existing infrastructure. The current stack provides: GitHub API integration with ISR caching (`lib/github.ts`), MDX content pipeline fully configured (`@next/mdx`, `remark-gfm`, `rehype-pretty-code`), contact form with Zod validation, Firebase Admin for Firestore writes, Server Actions with `useActionState`, Tailwind v4 with design tokens, and Next.js built-in OG image generation (`next/og`).

**Core technologies:**
- **Next.js 16.1.6** — App Router with Server Components, ISR, Server Actions, and `ImageResponse` API for OG images
- **Existing GitHub API integration** — `fetchGitHubProjects()` with ISR (1-hour revalidation) already works; just needs expanded type mapping for new fields
- **Existing MDX pipeline** — `building-blocks` tutorials prove the `export const metadata` pattern works; clone for `writing` content
- **Tailwind v4 with custom theme** — All design tokens defined in `globals.css`; new components must use these tokens, not hardcoded colors
- **Firebase Admin SDK** — Contact form already persists to Firestore; no changes needed
- **Zod + Server Actions** — Contact form validation and submission pattern is solid; wrap with new layout, do not rebuild

**Only new assets (not code dependencies):**
- Font files for OG image: PlayfairDisplay-Bold.ttf and Inter-SemiBold.ttf (~200KB total)
- Favicon set: favicon.ico, icon.png (optional), apple-icon.png (optional)
- OG image: branded 1200x630 PNG replacement

### Expected Features

**Must have (table stakes):**
- **Projects page: 2-column detailed cards** — Name, multi-sentence description, tags, status badge, public/private designation, date range (initiated - last commit)
- **Writing page: article listing** — Cards with title, publish date, topic tag, chronological ordering; must match Projects page styling
- **Contact redesign: hero + primary CTAs** — Mailto button, copy email button (already exists), LinkedIn link; inline validation; loading/error/success states; JS-disabled fallback; privacy note
- **OG image: branded 1200x630** — Navy background, gold accent, DW branding; exactly 1200x630px for social platforms
- **Favicon: custom DW design** — Navy/gold monogram replacing Next.js default
- **Logo accent: gold underline** — Persistent (not just hover) on navbar "DW" text

**Should have (competitive):**
- **Analytics events** — Track email copy, mailto click, form start, submit, error (required by success metrics but no provider chosen)
- **Reading time estimate** — For writing cards (calculate from word count at build)
- **GitHub enrichment** — Star count, activity indicators for projects (optional; API already available)
- **Staggered card animations** — Fade-in entrance on projects/writing pages (existing `fade-in-up` animation)

**Defer (v2+):**
- **Dynamic per-page OG images** — No per-page content yet to differentiate; single static branded image sufficient
- **Tag filtering** — Not enough projects/articles yet to justify client-side filtering
- **RSS feed** — Defer until writing content exists
- **GitHub activity sparklines** — Nice-to-have visual polish, adds API complexity

### Architecture Approach

All six features integrate cleanly into the existing Server Component architecture. Projects and writing pages become async RSCs that call data-fetching functions at build/request time (ISR for GitHub API, pure SSG for filesystem MDX). Contact redesign wraps the existing `ContactForm` client component with new hero/CTA sections as Server Components. Static assets (favicon, OG image) use Next.js file-based metadata conventions — drop files in `src/app/`, no code needed. Logo accent is a single CSS class change on an existing element.

**Major components:**
1. **Projects data layer** — Expand `GitHubRepo` interface in `lib/github.ts` to include `created_at`, `pushed_at`, `visibility` (already returned by API); unify with `Project` type; replace hardcoded arrays with `fetchGitHubProjects()` call
2. **Writing content system** — Clone `lib/tutorials.ts` as `lib/writing.ts` pointing to `src/content/writing/`; create `[slug]` route with `generateStaticParams`; card listing page identical pattern to tutorials
3. **Contact page structure** — New layout: `ContactHero` (Server Component with CTAs) → `ContactForm` (existing client component, enhanced error state) → Fast links section → `PrivacyNote`; add `lib/analytics.ts` stub for event tracking
4. **Branding assets** — File replacements (`opengraph-image.png`, `favicon.ico`) + one CSS utility (`border-b-2 border-gold`) on navbar logo span

**Critical pattern to preserve:** Server Components by default, `"use client"` only for interactivity (ContactForm, CopyEmailButton, MailtoButton for analytics). Do NOT create generic/abstract Card components — `ProjectCard` and `ArticleCard` have different data shapes and should stay focused. Do NOT unify homepage featured projects with GitHub API data — homepage is curated, projects page is live feed.

### Critical Pitfalls

1. **Dual project data sources drifting** — Homepage `FeaturedProjects` and `/projects` currently use separate hardcoded arrays. Enhancing `/projects` with GitHub API while leaving homepage hardcoded creates inconsistency. **Mitigation:** Decide single source of truth upfront (GitHub API with curated filtering/ordering, or unified config file); unify types before UI work.

2. **GitHub API missing required fields** — Enhanced cards need `created_at`, `pushed_at`, `visibility` but current `GitHubRepo` interface doesn't include them. **Mitigation:** Audit GitHub `/users/:user/repos` response schema and add all fields before building UI; these fields are already returned, just not extracted.

3. **Contact form server action broken during redesign** — Restructuring page layout can accidentally break `useActionState` binding, lose honeypot field, or duplicate form. **Mitigation:** Treat `ContactForm.tsx` and `submitContact` server action as core — wrap them, don't rebuild; test submission after every layout change; verify honeypot field in rendered HTML.

4. **OG image cache not invalidated** — Social platforms cache OG images aggressively; replacing the file locally doesn't update LinkedIn/Twitter for days. **Mitigation:** Keep exact filename/location (`src/app/opengraph-image.png`); ensure exact 1200x630px dimensions; test with platform debugging tools (Twitter Card Validator, Facebook Debugger, LinkedIn Post Inspector) immediately after deploy to force cache refresh.

5. **Writing page built without content strategy** — Building full MDX infrastructure for zero articles is wasted effort. **Mitigation:** Define frontmatter schema first (title, publishDate, tags, excerpt) before building UI; ship with at least one real article or accept styled empty state with concrete content timeline.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Branding Assets (Static Polish)
**Rationale:** Fastest visual improvement, zero code risk, validates deployment pipeline, independent of all other work. These changes touch only assets and one CSS class — no data dependencies, no server logic, no API integration. Start here to establish confidence and get immediate brand consistency.

**Delivers:**
- Custom favicon set (favicon.ico, icon.png, apple-icon.png) replacing Next.js default
- Branded OG image (1200x630 navy/gold PNG) for social sharing
- Gold underline accent on navbar "DW" logo
- Font files for future OG image generation (PlayfairDisplay-Bold.ttf, Inter-SemiBold.ttf)

**Addresses:** Favicon (table stakes), OG image (table stakes), logo accent (table stakes)

**Avoids:** Pitfall #10 (CSS cascade) by scoping logo change to single element; Pitfall #4 (OG cache) by testing with platform debuggers post-deploy; Pitfall #5 (missing icon formats) by generating full icon set

**Research flag:** Standard pattern, skip `/gsd:research-phase` during planning

### Phase 2: Projects Page (GitHub API Enhancement)
**Rationale:** Extends proven GitHub ISR pattern that already works in `lib/github.ts`. The API integration, caching, and type system are established — this phase just expands the data model and builds a richer UI. Must come before writing page because it establishes the card component patterns and 2-column grid layout that writing page will mirror.

**Delivers:**
- Expanded `GitHubRepo` interface with `created_at`, `pushed_at`, `visibility`
- Unified `Project` type replacing `PlaceholderProject`
- New `ProjectCard` component with full description, date range, public/private badge, "View Project" CTA
- Projects page rewritten to call `fetchGitHubProjects()` (ISR with 1-hour revalidation)
- 2-column responsive grid (basis for writing page layout)

**Addresses:** Projects page detailed cards (table stakes), GitHub enrichment (differentiator)

**Avoids:** Pitfall #1 (dual data sources) by unifying type system and establishing single source of truth; Pitfall #2 (API data gaps) by auditing GitHub response schema before UI work; Pitfall #8 (ISR cache conflicts) by monitoring GitHub API usage, not preemptively over-engineering

**Research flag:** Standard pattern (GitHub REST API `/users/:user/repos` is well-documented), skip `/gsd:research-phase`

### Phase 3: Writing Page (MDX Content System)
**Rationale:** Replicates the exact pattern proven in `building-blocks` tutorials. The MDX pipeline (`@next/mdx`, `remark-gfm`, `rehype-pretty-code`) is fully configured and operational. This phase is a clone-and-adapt operation, not new architecture. Comes after projects page because it reuses the 2-column grid and card styling patterns. Content schema must be defined before implementation.

**Delivers:**
- `src/content/writing/` directory for MDX articles
- `lib/writing.ts` (clone of `tutorials.ts`) with `getAllArticles()` filesystem discovery
- `ArticleCard` component matching Projects styling
- Writing page listing with chronological sort
- `writing/[slug]` route for individual articles with `generateStaticParams`
- At least one seed article to validate the pipeline

**Addresses:** Writing page (table stakes), article listing with metadata (table stakes)

**Avoids:** Pitfall #6 (no content strategy) by defining frontmatter schema (title, publishedAt, description, tags) before building cards; ships with one real article, not just empty state

**Research flag:** Standard pattern (filesystem MDX already proven), skip `/gsd:research-phase`

### Phase 4: Contact Page Redesign (UX Enhancement)
**Rationale:** Most UX complexity (hero layout, primary CTAs, inline validation, multiple states, analytics instrumentation, JS fallback). Benefits from card/layout patterns established in Phases 2-3. Kept last because it has the most moving parts and requires an analytics decision (stub vs. provider integration). The existing contact form works — this phase wraps and polishes it, does not rebuild it.

**Delivers:**
- `ContactHero` component with headline, subhead, primary CTA buttons
- `MailtoButton` client component with analytics event
- Enhanced `ContactForm` with inline validation, improved error state (email fallback), positive validation feedback
- `CopyEmailButton` updated with analytics event
- `PrivacyNote` component with data handling disclosure
- `lib/analytics.ts` stub (starts as console.log, swappable to Plausible/Umami/Firestore later)
- `<noscript>` fallback with email + mailto link
- Analytics events instrumented: copy, mailto click, form start, submit, error

**Addresses:** Contact redesign (table stakes), analytics events (differentiator), inline validation (differentiator), JS fallback (differentiator)

**Avoids:** Pitfall #3 (breaking server action) by wrapping existing form, not rebuilding; Pitfall #7 (analytics gap) by stubbing event layer early; Pitfall #13 (no JS fallback) by adding noscript block with mailto

**Research flag:** Analytics provider decision needed during planning — if choosing Plausible/Umami, run `/gsd:research-phase "analytics provider integration"`. If stubbing for v1.1, standard pattern, skip research.

### Phase Ordering Rationale

- **Phase 1 first:** Zero risk, immediate impact, no dependencies. Validates deploy pipeline and establishes brand consistency before code changes.
- **Phase 2 before 3:** Projects page establishes the card layout and grid patterns that writing page will reuse. Both are independent (GitHub API vs. filesystem MDX) but writing cards should match projects styling.
- **Phase 3 before 4:** Writing page is lower UX complexity (no client state, no form submissions, no analytics). Build it second-to-last to solidify the "listing page with cards" pattern.
- **Phase 4 last:** Contact redesign has the most client-side interactivity, most UX states to handle, and requires an analytics decision. Benefits from patterns established in earlier phases. Also the only phase touching an existing user-facing feature (contact form), so more regression risk — build it when deployment confidence is highest.
- **No circular dependencies:** All four phases can be built sequentially without backtracking. Phases 1-3 could be parallelized if needed, but sequential minimizes integration risk.

### Research Flags

**Phases with standard patterns (skip `/gsd:research-phase` during planning):**
- **Phase 1 (Branding Assets):** Next.js file-based metadata conventions, basic CSS. Well-documented, no unknowns.
- **Phase 2 (Projects Page):** GitHub REST API `/users/:user/repos` is stable and well-documented; ISR pattern already proven in codebase.
- **Phase 3 (Writing Page):** Exact clone of `building-blocks` pattern; MDX already configured and working.

**Phases likely needing deeper research during planning:**
- **Phase 4 (Contact Redesign):** Only if choosing an analytics provider (Plausible, Umami, Google Analytics). If stubbing `lib/analytics.ts` for v1.1, no research needed. If integrating a provider, run `/gsd:research-phase "analytics provider integration"` to compare event APIs, privacy compliance (GDPR), script weight, and custom event support.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All capabilities verified in existing codebase. Zero new packages needed. GitHub API fields confirmed in REST API docs. |
| Features | HIGH | Requirements decomposed against existing patterns. Card layouts, MDX content, form enhancements all have precedent in current code. |
| Architecture | HIGH | Direct codebase analysis of all components. Every integration point mapped. Server Component patterns proven. ISR and MDX pipelines operational. |
| Pitfalls | HIGH | All pitfalls identified through codebase audit (dual data sources, missing API fields, form wrapping risk) and known Next.js/Cloud Run behavior (OG cache, ISR on ephemeral containers). |

**Overall confidence:** HIGH

### Gaps to Address

**Analytics provider decision:** The contact redesign requires event tracking (copy, mailto click, form start, submit, error) but no analytics platform is integrated. Research recommends stubbing `lib/analytics.ts` with a thin `trackEvent()` wrapper that starts as console.log. When a provider is chosen later (Plausible recommended for privacy-first, lightweight 1KB script), only one module changes. **Decision point:** Stub for v1.1 and defer provider choice, or integrate Plausible now? Recommend stubbing — contact form already writes to Firestore, so submission counts can be queried directly. Event volume doesn't justify a paid service yet.

**Content pipeline for writing page:** Research assumes the `building-blocks` MDX pattern will work for articles, but the actual frontmatter schema (title, publishedAt, description, tags, excerpt) must be defined before building the UI. **Validation needed during Phase 3 planning:** Does one seed article exist? If not, writing page ships with styled empty state and content timeline.

**Homepage/projects data unification:** Critical decision during Phase 2 planning: Does homepage `FeaturedProjects` switch to `fetchGitHubProjects()` with curated filtering, or does it stay hardcoded with richer metadata (custom names, descriptions, status labels) that GitHub API can't provide? Research recommends keeping them separate — homepage is a curated portfolio (6 best projects with editorial polish), `/projects` is a live activity feed (all public repos from GitHub). **Validation needed:** Confirm this approach with product owner.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: All files in `src/app/`, `src/components/`, `src/lib/`, `src/types/`, `next.config.ts`, `globals.css`
- [Next.js ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response) — OG image generation built into Next.js
- [Next.js opengraph-image file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) — metadata asset auto-discovery
- [Next.js favicon conventions](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons) — icon.png, apple-icon.png
- [GitHub REST API: List user repos](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user) — response schema includes `created_at`, `pushed_at`, `visibility`

### Secondary (MEDIUM confidence)
- [Plausible Analytics](https://plausible.io/) — Recommended analytics provider (lightweight, cookie-free, GDPR-compliant, custom events)
- [Webflow: 23 Portfolio Website Examples](https://webflow.com/blog/design-portfolio-examples) — Card design patterns
- [Baymard Institute: Inline Form Validation](https://baymard.com/blog/inline-form-validation) — 31% of sites lack inline validation
- [Juan Garcia: Click to Copy Email Pattern](https://www.juangarcia.design/blog/ditching-the-mailto-link:-click-to-copy-email-pattern/) — 84% of users don't use native mail clients
- [Design Studio: Form UX Best Practices 2026](https://www.designstudiouiux.com/blog/form-ux-design-best-practices/) — Form validation patterns

---
*Research completed: 2026-02-04*
*Ready for roadmap: yes*
