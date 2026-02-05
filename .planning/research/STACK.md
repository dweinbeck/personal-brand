# Technology Stack: v1.1 Features

**Project:** dan-weinbeck.com v1.1
**Researched:** 2026-02-04

## Key Finding: Zero New Dependencies

Every v1.1 feature builds on the existing stack. No `npm install` commands needed.

## Current Stack (Unchanged)

| Technology | Version | Relevant To |
|------------|---------|-------------|
| Next.js | 16.1.6 | All features (App Router, ISR, Server Actions, `next/og`) |
| React | 19.2.3 | All UI (useActionState for contact form) |
| Tailwind CSS | v4 | All styling including logo accent |
| @tailwindcss/typography | ^0.5.19 | Writing page prose rendering |
| @next/mdx + @mdx-js/loader | ^16.1.6 / ^3.1.1 | Writing page MDX content |
| rehype-pretty-code + shiki | ^0.14.1 / ^3.22.0 | Code blocks in articles |
| remark-gfm | ^4.0.1 | GFM tables/lists in articles |
| sharp | ^0.34.3 | Image optimization (already installed) |
| Zod | ^4.3.6 | Contact form validation |
| clsx | ^2.1.1 | Conditional CSS classes |
| Firebase Admin SDK | ^13.6.0 | Contact form Firestore writes |
| Biome | 2.2.0 | Linting and formatting |

## Feature-by-Feature Stack Analysis

### 1. Projects Page -- Enhanced Cards with GitHub API

**What exists:** `src/lib/github.ts` fetches from `/users/dweinbeck/repos` with ISR (1-hour revalidation). Returns name, description, language, stars, topics, url.

**What's needed:** Extend the `GitHubRepo` interface to include `created_at`, `pushed_at`, and `visibility` fields. The GitHub REST API already returns these fields in every response -- they are just not typed or used yet.

**Stack impact:** None. Interface change + card UI work only.

**Public vs. Private repos:** The unauthenticated `/users/dweinbeck/repos` endpoint returns only public repos. The authenticated `/user/repos` endpoint (used in `github-admin.ts` for the Control Center) returns both. **Recommendation:** Keep the public endpoint for the Projects page. All displayed repos are public by definition. For private projects that should appear on the page, continue the static curated entry pattern (ADR #20) with a "Private" badge. This avoids exposing private repo names and keeps the page working without a `GITHUB_TOKEN`.

**Confidence:** HIGH -- verified against GitHub REST API docs and existing codebase.

### 2. Writing Page -- Article Listing with MDX

**What exists:** A "Coming Soon" stub at `src/app/writing/page.tsx`. A proven MDX content pattern in `src/lib/tutorials.ts` + `src/content/building-blocks/` with exported metadata objects.

**What's needed:** Mirror the tutorials pattern:
- Create `src/content/writing/` directory for MDX article files
- Create `src/lib/articles.ts` (clone of `tutorials.ts` with path changed)
- Each `.mdx` file exports `metadata = { title, description, publishedAt, tags }`
- Article listing page reads metadata, sorts by date, renders cards
- Individual article pages use dynamic `import()` for static analysis compatibility

**Stack impact:** None. The MDX pipeline (`@next/mdx`, `remark-gfm`, `rehype-pretty-code`, `@tailwindcss/typography`) is fully configured and proven.

**Key decision:** Do NOT add a content layer (Contentlayer, Velite) or switch to `next-mdx-remote`. The existing `@next/mdx` with exported metadata pattern (ADR #10) is simpler, type-safe, and already working.

**Confidence:** HIGH -- exact pattern proven in existing codebase.

### 3. Contact Page Redesign

**What exists:** `ContactForm.tsx` with `useActionState`, Zod server-side validation, honeypot, rate limiting, `CopyEmailButton.tsx`.

**What's needed:**
- **Hero section:** New layout with headline, subhead, primary CTAs (mailto, copy, LinkedIn) -- pure JSX + Tailwind
- **Inline validation:** Add `onBlur` handlers that validate individual fields against the existing Zod schema. No form library needed.
- **Loading state:** `useActionState` already provides pending state via `useFormStatus` (used in `SubmitButton.tsx`)
- **Failure fallback:** Add email fallback text when submission fails (JSX change)
- **JS-disabled fallback:** Add `<noscript>` block with mailto link -- native HTML
- **Analytics events:** See analytics section below

**Stack impact:** None. All capabilities exist in React 19 + Zod + native HTML.

**What NOT to add:** `react-hook-form` -- overkill for a 3-field form. The existing `useActionState` + Zod pattern is simpler and already proven.

**Confidence:** HIGH -- all capabilities verified in existing codebase.

### 4. OG Image -- Branded 1200x630

**What's needed:** Create `src/app/opengraph-image.tsx` using the Next.js built-in `ImageResponse` API.

**Stack impact:** None. `ImageResponse` ships with Next.js -- import from `next/og`.

**Implementation:**
```typescript
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Dan Weinbeck - AI Developer & Data Scientist'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const playfairBold = await readFile(
    join(process.cwd(), 'assets/fonts/PlayfairDisplay-Bold.ttf')
  )
  return new ImageResponse(/* navy bg, gold accent, DW branding */, {
    ...size,
    fonts: [{ name: 'Playfair Display', data: playfairBold, weight: 700 }],
  })
}
```

**Key details:**
- `ImageResponse` uses Satori under the hood -- only flexbox layout, no CSS grid
- Custom fonts require raw TTF/OTF/WOFF files loaded via `readFile` (cannot use Google Fonts CSS)
- Statically optimized at build time by default (no dynamic data)
- The existing `openGraph.images` config in `layout.tsx` can be removed -- the file convention auto-generates meta tags
- 500KB bundle limit for the image route (fonts + JSX + images combined)

**New asset needed:** Download Playfair Display Bold and Inter SemiBold TTF files from Google Fonts. Place in `assets/fonts/` at project root. This is the only new asset across all v1.1 features (~200KB total).

**Why NOT `@vercel/og`:** That package is for Pages Router. App Router uses `next/og` directly (built-in, no install).

**Confidence:** HIGH -- verified against Next.js official docs for ImageResponse and opengraph-image file convention.

### 5. Favicon -- DW Logo

**What's needed:** Place favicon files in `src/app/` using Next.js file conventions:
- `src/app/favicon.ico` (32x32) -- browser tab icon
- `src/app/icon.png` (512x512, optional) -- modern browsers / PWA
- `src/app/apple-icon.png` (180x180, optional) -- iOS home screen

**Stack impact:** None. Static asset placement. Next.js auto-discovers and generates `<link>` tags.

**Alternative:** Could create `src/app/icon.tsx` using `ImageResponse` to generate the favicon programmatically. But for a static brand mark, a designed asset file is simpler and more predictable.

**Note:** The existing `public/` directory has only Next.js starter placeholder SVGs (file.svg, vercel.svg, etc.) that should be cleaned up.

**Confidence:** HIGH -- standard Next.js file convention.

### 6. DW Logo Gold Underline -- CSS Accent

**What's needed:** Add a gold underline to the "DW" text in `src/components/layout/Navbar.tsx`.

**Stack impact:** None. Pure Tailwind CSS change.

**Approach options:**
- `border-b-2 border-gold` -- simple bottom border
- `decoration-gold underline decoration-2 underline-offset-4` -- text decoration (more control over offset)
- Pseudo-element via arbitrary Tailwind for a partial underline effect

The existing Navbar already has `text-primary group-hover:text-gold transition-colors` on the DW link. The gold underline should be persistent (not just on hover) to serve as a brand accent.

**Confidence:** HIGH -- trivial CSS.

## Analytics Events

The contact page requirements specify tracking: email copy, email click, form start, form submit, form error.

### Recommendation: Stub Now, Instrument Later

**Do NOT add an analytics library in v1.1.** Rationale:
- The site has no analytics yet and no established need for dashboards
- Adding Google Analytics requires cookie consent (GDPR) -- antithetical to a clean personal site
- Privacy-first alternatives (Plausible ~$9/mo, Fathom ~$14/mo) are good but premature

**Implementation approach:**
1. Create a `src/lib/analytics.ts` module with a `trackEvent(name: string, data?: Record<string, string>)` function
2. Initial implementation: no-op (or `console.debug` in development)
3. Wire up event calls in contact page components at the instrumentation points
4. When analytics are actually needed, swap the implementation to Plausible (1KB script, no cookies, no consent banner) or Firestore event logging

This creates the instrumentation points without adding a dependency. The contact form already writes to Firestore, so submission counts can be queried directly.

**If analytics are explicitly required in v1.1:** Use [Plausible Analytics](https://plausible.io/) -- lightweight (~1KB), cookie-free, GDPR-compliant, custom events supported. Self-hosted option available for GCP. But defer this decision to the roadmap phase.

**Confidence:** MEDIUM -- architectural recommendation, not a verified integration.

## What NOT to Add

| Library | Why Tempting | Why Not |
|---------|-------------|---------|
| `@vercel/og` | OG image generation | Built into Next.js App Router as `next/og` -- no install needed |
| `react-hook-form` | Form validation UX | Overkill for a 3-field form; `useActionState` + Zod is simpler |
| `contentlayer` / `velite` | MDX content management | Existing `@next/mdx` + exported metadata pattern works; adding a layer adds complexity |
| `next-mdx-remote` | Remote/flexible MDX | Only needed if MDX comes from a CMS; local files work with `@next/mdx` |
| Google Analytics | Analytics events | Heavy (~45KB), requires cookie consent, privacy-hostile |
| `react-icons` / `lucide-react` | Social link icons | Inline SVGs or Unicode suffice for v1.1 scope |
| `nodemailer` / SendGrid | Email forwarding | Contact form stores to Firestore; email notification is a separate feature |
| `plaiceholder` | Blur image placeholders | `sharp` + Next.js Image handle this natively |

## New Assets Required (Not Code Dependencies)

| Asset | Purpose | Source | Size |
|-------|---------|--------|------|
| PlayfairDisplay-Bold.ttf | OG image font | Google Fonts download | ~100KB |
| Inter-SemiBold.ttf | OG image font | Google Fonts download | ~100KB |
| favicon.ico | Browser tab icon | Design tool (Figma/SVG) | ~4KB |
| icon.png (optional) | Modern browser icon | Design tool | ~10KB |
| apple-icon.png (optional) | iOS home screen | Design tool | ~10KB |

**Location:** Font files in `assets/fonts/`, favicon files in `src/app/`.

## Installation

```bash
# No new packages needed for v1.1.
# Only action: download font TTF files for OG image generation.
```

## Sources

- [Next.js ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response) -- HIGH confidence
- [Next.js opengraph-image file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) -- HIGH confidence
- [GitHub REST API: List user repos](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user) -- HIGH confidence
- [Plausible Analytics](https://plausible.io/) -- MEDIUM confidence (deferred recommendation)
