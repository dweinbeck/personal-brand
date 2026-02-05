# Architecture Patterns: v1.1 Feature Integration

**Project:** personal-brand v1.1 page buildout and branding polish
**Researched:** 2026-02-04
**Confidence:** HIGH (based on direct codebase analysis of all source files)

## Current Architecture Snapshot

```
src/
  app/
    layout.tsx          -- Root layout: Navbar + Footer + AuthProvider
    page.tsx            -- Home: HeroSection, FeaturedProjects, BlogTeaser
    projects/page.tsx   -- Hardcoded PlaceholderProject[] array (6 items)
    writing/page.tsx    -- "Coming Soon" placeholder
    contact/page.tsx    -- ContactForm + CopyEmailButton + social links
    building-blocks/    -- MDX tutorials (filesystem discovery via lib/tutorials.ts)
  components/
    home/               -- HeroSection, FeaturedProjects, ProjectCard, BlogTeaser
    contact/            -- ContactForm, CopyEmailButton, SubmitButton
    layout/             -- Navbar, NavLinks, AuthButton, Footer
    ui/                 -- Button (shared)
  lib/
    github.ts           -- fetchGitHubProjects() with ISR (revalidate: 3600)
    tutorials.ts        -- getAllTutorials() filesystem MDX discovery
    firebase.ts         -- Firebase Admin SDK (Firestore writes)
    actions/contact.ts  -- Server Action: validation + honeypot + rate limit + Firestore save
    schemas/contact.ts  -- Zod schema for contact form
  types/
    project.ts          -- Project interface (name, description, language, stars, url, homepage, topics)
  content/
    building-blocks/    -- MDX files with exported metadata objects
```

### Current Rendering Strategy

| Route | Strategy | Data Source |
|-------|----------|------------|
| `/` | SSG | Hardcoded |
| `/projects` | SSG | Hardcoded array in page file |
| `/writing` | SSG | None (placeholder) |
| `/building-blocks` | SSG | Filesystem MDX |
| `/contact` | SSG + Server Action | Form submits via server action to Firestore |

### Established Patterns (carry forward into v1.1)

1. **Server Components by default** -- All page components are RSCs; `"use client"` only for ContactForm, CopyEmailButton, AuthButton
2. **Server Actions for mutations** -- `submitContact` in `lib/actions/contact.ts` with Zod validation
3. **ISR for external API data** -- `fetchGitHubProjects()` uses `next: { revalidate: 3600 }`
4. **MDX content via filesystem discovery** -- `export const metadata` pattern in `.mdx` files, parsed by `lib/tutorials.ts`
5. **Design tokens in CSS custom properties** -- `:root` in `globals.css` defines all colors/shadows/radii, mapped to Tailwind via `@theme inline`
6. **Standalone Docker output** -- `output: "standalone"` in `next.config.ts` for Cloud Run

---

## Feature-by-Feature Integration Plan

### 1. Projects Page -- GitHub API Data

**Current state:** `src/app/projects/page.tsx` renders a hardcoded `PlaceholderProject[]` array of 6 items. Separately, `src/lib/github.ts` has a working `fetchGitHubProjects()` function that fetches from the GitHub REST API with ISR caching, but the Projects page does not use it.

**Integration approach:**

| File | Action | Details |
|------|--------|---------|
| `src/lib/github.ts` | MODIFY | Expand `GitHubRepo` interface to include `created_at`, `pushed_at`, `visibility` -- these are standard fields already returned by `/users/{user}/repos`, no new API calls needed |
| `src/types/project.ts` | MODIFY | Add `createdAt: string`, `pushedAt: string`, `visibility: "public" \| "private"` to `Project` interface |
| `src/app/projects/page.tsx` | REWRITE | Replace hardcoded array with `await fetchGitHubProjects()`. Page becomes async RSC. Two-column grid (`md:grid-cols-2`). |
| `src/components/projects/ProjectCard.tsx` | NEW | Larger card with date range, visibility badge, full description, tags, link button. Distinct from home `ProjectCard` which is compact. |

**Rendering strategy change:** `/projects` moves from pure SSG to ISR (`revalidate: 3600`) since it calls `fetchGitHubProjects()` which uses `next: { revalidate: 3600 }`.

**Data flow:**

```
GitHub REST API (/users/dweinbeck/repos?per_page=100&sort=pushed)
  |
  v
src/lib/github.ts  (fetchGitHubProjects, cached via ISR 3600s)
  |
  v
src/app/projects/page.tsx  (async RSC, renders at request time, cached)
  |
  v
src/components/projects/ProjectCard.tsx  (server component, no client JS)
```

**Critical decision -- keep homepage cards hardcoded:** The homepage `FeaturedProjects` uses curated data with custom names (e.g., "Dave Ramsey Digital Envelope App"), custom descriptions, and status labels (Live/In Development/Planning). The GitHub API cannot provide this richness. The homepage serves as a curated portfolio; `/projects` serves as a live coding activity feed. Do NOT unify these data sources.

---

### 2. Writing Page -- MDX Content System

**Current state:** Empty placeholder page with "Coming Soon" text. The MDX infrastructure is already fully operational for building-blocks tutorials.

**Integration approach:**

| File | Action | Details |
|------|--------|---------|
| `src/content/writing/` | NEW directory | MDX article files following the same `export const metadata` pattern |
| `src/lib/writing.ts` | NEW | `getAllArticles()` function -- clone of `tutorials.ts` pointing to `src/content/writing/` |
| `src/app/writing/page.tsx` | REWRITE | Article listing page, async RSC calling `getAllArticles()` |
| `src/app/writing/[slug]/page.tsx` | NEW | Individual article detail page with MDX rendering + `generateStaticParams` |
| `src/components/writing/ArticleCard.tsx` | NEW | Card showing title, publish date, topic tag |

**Content metadata interface:**

```typescript
// src/lib/writing.ts
export interface ArticleMeta {
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
}
```

This mirrors `TutorialMeta` exactly. The filesystem discovery logic in `tutorials.ts` (lines 38-69) can be directly adapted -- change the `CONTENT_DIR` path from `src/content/building-blocks` to `src/content/writing` and update the type names.

**MDX rendering:** Already configured in `next.config.ts` via `@next/mdx` with `remark-gfm` and `rehype-pretty-code`. The `[slug]` route uses dynamic `import()` to load the MDX file, same pattern as `building-blocks/[slug]`. No configuration changes needed.

**Rendering strategy:** Pure SSG. Content is filesystem-based, known at build time. The `[slug]` route uses `generateStaticParams` to pre-render all articles.

**Data flow:**

```
src/content/writing/*.mdx  (filesystem, export const metadata = {...})
  |
  v
src/lib/writing.ts  (getAllArticles, fs.readdirSync + metadata extraction)
  |
  v
src/app/writing/page.tsx  (async RSC, SSG)
  |                         \
  v                          v
ArticleCard.tsx       src/app/writing/[slug]/page.tsx  (SSG via generateStaticParams)
```

---

### 3. Contact Page Redesign

**Current state:** Two-column layout: ContactForm (left), email + social links (right). Already has: honeypot spam protection, IP-based rate limiting (3 per 15 min), Zod validation, Firestore persistence, `useActionState` for form state management, `CopyEmailButton` with clipboard API.

**What exists and stays:** The server action (`lib/actions/contact.ts`) is well-structured and does not need architectural changes. The Zod schema, Firestore integration, and spam controls are solid.

**Integration approach:**

| File | Action | Details |
|------|--------|---------|
| `src/app/contact/page.tsx` | REWRITE | New layout: hero with CTAs, form section, fast links, privacy note |
| `src/components/contact/ContactHero.tsx` | NEW | Hero section: headline, subhead, primary CTA buttons (mailto, copy, LinkedIn) |
| `src/components/contact/MailtoButton.tsx` | NEW | Client component: `<a href="mailto:...">` styled as button, fires analytics event on click |
| `src/components/contact/PrivacyNote.tsx` | NEW | Server component: static retention/privacy disclosure text |
| `src/components/contact/ContactForm.tsx` | MODIFY | Add explicit loading state styling, error state with email fallback link, keep existing useActionState pattern |
| `src/components/contact/CopyEmailButton.tsx` | MODIFY | Add analytics event call on successful copy |
| `src/lib/analytics.ts` | NEW | `trackEvent(name: string, data?: Record<string, string>)` -- thin wrapper, starts as console.log stub |

**Analytics strategy:** The requirements call for instrumented events (copy, click, start, submit, error). No analytics platform is currently integrated. Create a `lib/analytics.ts` that exports `trackEvent()`. Implementation starts as a no-op or `console.log`. When Google Analytics, Plausible, or another provider is added later, only this one module changes. The contact components call `trackEvent` regardless of whether a provider is wired in.

**Form UX states (no architectural change, just UX refinement):**

```
idle --> submitting --> success ("Sent -- thanks. I'll reply within 1-2 business days.")
                   \-> error ("Couldn't send right now. Email me at daniel.weinbeck@gmail.com")
```

The existing `useActionState` + `useFormStatus` (in SubmitButton) already supports this flow. The changes are cosmetic: better success messaging, email fallback in error state, and visible loading indicator.

**New page layout structure:**

```
ContactPage (server component)
  |-- ContactHero (server component)
  |     |-- MailtoButton (client -- analytics event)
  |     |-- CopyEmailButton (client -- clipboard + analytics)
  |     |-- LinkedIn link (plain anchor)
  |
  |-- ContactForm (client -- useActionState)
  |     |-- SubmitButton (client -- useFormStatus)
  |
  |-- "Other Ways to Reach Me" section (server component, plain links)
  |
  |-- PrivacyNote (server component)
```

---

### 4. OG Image -- Static Asset Replacement

**Current state:** `src/app/opengraph-image.png` exists. Next.js serves it automatically via file-based metadata convention. The root `layout.tsx` also explicitly references it in the `openGraph.images` metadata.

**Decision: Static asset, not dynamic generation.** Reasons:
- Single persona, single brand treatment -- no per-page variation needed
- Zero runtime cost vs. `next/og` ImageResponse which runs on every request
- Simpler to maintain (designer creates PNG, drop it in)
- If per-article OG images are needed later for `/writing/[slug]`, add a route-specific `opengraph-image.tsx` at that time

**Action:** Replace `src/app/opengraph-image.png` with updated 1200x630 PNG matching navy/gold brand. No code changes.

---

### 5. Favicon -- Static Asset Replacement

**Current state:** `src/app/favicon.ico` exists (Next.js file-based metadata convention).

**Action:** Replace `src/app/favicon.ico` with updated design. Optionally add `src/app/icon.png` (modern browsers) and `src/app/apple-icon.png` (iOS). Next.js detects these files automatically -- no code changes needed.

---

### 6. Logo Gold Underline -- CSS Change

**Current state in `Navbar.tsx`:**

```tsx
<span className="font-display text-xl font-extrabold tracking-tight text-primary group-hover:text-gold transition-colors">
  DW
</span>
```

**Action:** Add gold underline via Tailwind utilities. Simplest approach:

```tsx
<span className="font-display text-xl font-extrabold tracking-tight text-primary group-hover:text-gold transition-colors border-b-2 border-gold">
  DW
</span>
```

If more precise control is needed (underline width shorter than text, offset adjustment), use a `decoration-*` utility or a small CSS class. No architectural change.

---

## Summary: New vs. Modified Components

### New Components

| Component | Type | Path |
|-----------|------|------|
| Projects `ProjectCard` | Server Component | `src/components/projects/ProjectCard.tsx` |
| `ArticleCard` | Server Component | `src/components/writing/ArticleCard.tsx` |
| `ContactHero` | Server Component | `src/components/contact/ContactHero.tsx` |
| `MailtoButton` | Client Component | `src/components/contact/MailtoButton.tsx` |
| `PrivacyNote` | Server Component | `src/components/contact/PrivacyNote.tsx` |
| `writing.ts` | Data Fetching | `src/lib/writing.ts` |
| `analytics.ts` | Utility | `src/lib/analytics.ts` |
| Writing content dir | Content | `src/content/writing/` |
| Article detail page | Page | `src/app/writing/[slug]/page.tsx` |

### Modified Components

| Component | Change |
|-----------|--------|
| `src/lib/github.ts` | Add `created_at`, `pushed_at`, `visibility` to interface and mapping |
| `src/types/project.ts` | Add `createdAt`, `pushedAt`, `visibility` fields |
| `src/app/projects/page.tsx` | Replace hardcoded data with `fetchGitHubProjects()` |
| `src/app/writing/page.tsx` | Replace placeholder with article listing |
| `src/app/contact/page.tsx` | Restructure layout with hero, form, links, privacy sections |
| `src/components/contact/ContactForm.tsx` | Enhanced error state with email fallback |
| `src/components/contact/CopyEmailButton.tsx` | Add analytics event |
| `src/components/layout/Navbar.tsx` | Add `border-b-2 border-gold` to logo span |

### Static Asset Changes (no code)

| Asset | Action |
|-------|--------|
| `src/app/opengraph-image.png` | Replace with new 1200x630 design |
| `src/app/favicon.ico` | Replace with new design |
| `src/app/icon.png` | NEW (optional, for modern browsers) |
| `src/app/apple-icon.png` | NEW (optional, for iOS) |

---

## Recommended Build Order

### Phase 1: Static Assets + CSS (zero risk, immediate visual impact)

**Scope:** Favicon, OG image, logo gold underline
**Touches:** 3 files (asset replacements + Navbar.tsx one-line change)
**Dependencies:** None
**Rationale:** Independent of all other work, no data dependencies, instant visual improvement, validates deploy pipeline works.

### Phase 2: Projects Page (extends existing infrastructure)

**Scope:** Expand GitHub API types, create projects ProjectCard, rewrite projects page
**Touches:** 4 files (github.ts, project.ts, new ProjectCard, projects/page.tsx)
**Dependencies:** None (github.ts already works)
**Rationale:** Low risk -- extends a proven ISR + GitHub API pattern. No new infrastructure needed.

### Phase 3: Writing Page (replicates established pattern)

**Scope:** Create content directory, writing.ts, ArticleCard, writing page, article detail page
**Touches:** 5+ files (all new except writing/page.tsx rewrite)
**Dependencies:** MDX infrastructure (already configured in next.config.ts)
**Rationale:** Follows the exact same filesystem MDX pattern as building-blocks. Needs at least one seed article to test.

### Phase 4: Contact Redesign (highest UX complexity)

**Scope:** Analytics module, ContactHero, MailtoButton, PrivacyNote, ContactForm enhancements, page restructure
**Touches:** 7 files (3 new components, 1 new module, 3 modifications)
**Dependencies:** None (server action and Firestore already work)
**Rationale:** Most UX states to handle (loading, error with fallback, success, analytics instrumentation). Build last because it benefits from patterns established in earlier phases.

### Phase ordering rationale

Phases 2 and 3 are independent and could run in parallel. Phase 4 is last because it has the most moving parts and the most client-side interactivity. Phase 1 is first because it is trivial and establishes deployment confidence.

---

## Anti-Patterns to Avoid

### Do NOT create a generic Card component

Projects and Writing cards have different data shapes, layouts, and behaviors. A unified `<Card>` would accumulate props and conditionals. Keep `ProjectCard` and `ArticleCard` as separate focused components. Visual consistency comes from Tailwind utility patterns, not component abstraction.

### Do NOT fetch GitHub data client-side

The ISR pattern (`next: { revalidate: 3600 }`) in `lib/github.ts` is correct. Moving this to a client-side `useEffect` + `fetch` would lose caching, expose the API call to browsers, and cause layout shift.

### Do NOT merge tutorials.ts and writing.ts

These modules are ~30 lines each, point to different directories, and may evolve independently. Premature abstraction into a generic `getContent(type)` function adds indirection without value.

### Do NOT add a full analytics SDK for contact events

A thin `trackEvent()` stub in `lib/analytics.ts` is sufficient. Adding Google Analytics or Plausible as a dependency for 5 contact events is premature. Wire in a provider later when event volume justifies it.

### Do NOT unify homepage FeaturedProjects with GitHub API data

The homepage cards have curated names, descriptions, and status labels that the GitHub API cannot provide. Keep them hardcoded. The homepage is a curated portfolio; `/projects` is a live activity feed.

---

## Sources

- Direct codebase analysis of all source files listed above (HIGH confidence)
- GitHub REST API `/users/{user}/repos` field availability: `created_at`, `pushed_at`, `visibility` are documented standard response fields (HIGH confidence -- the existing `github.ts` already consumes `topics`, `stargazers_count`, and other fields from the same endpoint)
- Next.js file-based metadata conventions (favicon.ico, opengraph-image.png, icon.png, apple-icon.png): established pattern already in use in this codebase at `src/app/favicon.ico` and `src/app/opengraph-image.png` (HIGH confidence)
