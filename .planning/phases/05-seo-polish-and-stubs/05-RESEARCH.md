# Phase 5: SEO, Polish, and Stubs - Research

**Researched:** 2026-02-02
**Domain:** Next.js 16 Metadata API, SEO, Structured Data, Lighthouse Optimization
**Confidence:** HIGH

## Summary

This phase adds SEO metadata, structured data, sitemap/robots generation, Lighthouse optimization, and polished stub pages to an existing Next.js 16 App Router portfolio site. The site already uses the `Metadata` export pattern in `layout.tsx` and one page (`building-blocks`) with per-page metadata, plus `generateMetadata` on dynamic `[slug]` routes.

Next.js 16 has mature, built-in support for all SEO requirements: the Metadata API handles meta/OG tags with title templates, `sitemap.ts` and `robots.ts` convention files generate XML/TXT automatically, and JSON-LD is rendered via `<script>` tags in server components. No third-party SEO libraries are needed.

The site is already well-structured for high Lighthouse scores: server components by default, `next/font` for fonts, `next/image` for images, Tailwind CSS with purging. The main work is adding missing metadata exports to pages and creating convention files.

**Primary recommendation:** Use Next.js built-in Metadata API with title templates in the root layout, add per-page metadata exports to every page, create `sitemap.ts` and `robots.ts` convention files, and add a JSON-LD `<script>` tag with Person schema on the home page.

## Standard Stack

### Core (All Built-in to Next.js)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js Metadata API | 16.1.6 (built-in) | Meta tags, OG tags, title templates | Official, zero-dependency, type-safe |
| `sitemap.ts` convention | 16.1.6 (built-in) | Generate sitemap.xml | Official convention file, cached by default |
| `robots.ts` convention | 16.1.6 (built-in) | Generate robots.txt | Official convention file, cached by default |
| `next/font` | 16.1.6 (built-in) | Font optimization | Already in use (Geist), prevents CLS/FOIT |
| `next/image` | 16.1.6 (built-in) | Image optimization | Already configured in next.config.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `schema-dts` | ^1.1.0 | TypeScript types for JSON-LD schemas | Type-safe Person/ProfilePage schema |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Built-in Metadata API | `next-seo` | next-seo is legacy/unnecessary with App Router; built-in is better |
| Built-in `sitemap.ts` | `next-sitemap` | next-sitemap is for Pages Router; convention file is native |
| `schema-dts` | Manual typing | schema-dts gives autocomplete and catches typos; worth the small dep |
| Static OG image | `opengraph-image.tsx` (dynamic) | Dynamic OG images are overkill for a portfolio with ~7 pages; use a static image |

**Installation:**
```bash
npm install schema-dts
```

## Architecture Patterns

### New Files to Create
```
src/app/
├── sitemap.ts              # Convention file -> /sitemap.xml
├── robots.ts               # Convention file -> /robots.txt
├── opengraph-image.png     # Static OG image (1200x630)
├── layout.tsx              # UPDATE: add title template, metadataBase, OG defaults
├── page.tsx                # UPDATE: add metadata export, JSON-LD script
├── projects/page.tsx       # UPDATE: add metadata export
├── contact/page.tsx        # UPDATE: add metadata export
├── writing/page.tsx        # UPDATE: add metadata export, polish stub
├── assistant/page.tsx      # UPDATE: add metadata export, polish stub
├── building-blocks/
│   ├── page.tsx            # Already has metadata (UPDATE: use title template)
│   └── [slug]/page.tsx     # Already has generateMetadata (UPDATE: add OG fields)
```

### Pattern 1: Root Layout Title Template
**What:** Define a title template in root layout so child pages only set their page-specific title.
**When to use:** Always -- prevents inconsistent title formatting across pages.
**Example:**
```typescript
// src/app/layout.tsx
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

const SITE_URL = "https://dweinbeck.com"; // or actual domain

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | Dan Weinbeck",
    default: "Dan Weinbeck - AI Developer & Data Scientist",
  },
  description: "AI developer, analytics professional, and data scientist",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Dan Weinbeck",
    title: "Dan Weinbeck - AI Developer & Data Scientist",
    description: "AI developer, analytics professional, and data scientist",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
};
```

### Pattern 2: Per-Page Metadata Export
**What:** Each page exports a `metadata` object with page-specific title and description.
**When to use:** Every page that doesn't already have metadata.
**Example:**
```typescript
// src/app/projects/page.tsx
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",  // becomes "Projects | Dan Weinbeck" via template
  description: "Open-source projects and experiments from my GitHub.",
  openGraph: {
    title: "Projects",
    description: "Open-source projects and experiments from my GitHub.",
  },
};
```

### Pattern 3: JSON-LD in Server Component
**What:** Render a `<script type="application/ld+json">` tag inside a server component page.
**When to use:** Home page for Person schema.
**Example:**
```typescript
// src/app/page.tsx
// Source: https://nextjs.org/docs/app/guides/json-ld

import type { Person, WithContext } from "schema-dts";

const personJsonLd: WithContext<Person> = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Dan Weinbeck",
  url: "https://dweinbeck.com",
  jobTitle: "AI Developer & Data Scientist",
  description: "AI developer, analytics professional, and data scientist",
  sameAs: [
    "https://www.linkedin.com/in/dw789/",
    "https://github.com/dweinbeck",
    "https://instagram.com/dweinbeck",
  ],
  email: "dan@dweinbeck.com",
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HeroSection />
      <FeaturedProjects />
      <BlogTeaser />
    </div>
  );
}
```

### Pattern 4: Convention File for Sitemap
**What:** Export a default function returning `MetadataRoute.Sitemap` from `src/app/sitemap.ts`.
**When to use:** Always -- Next.js automatically serves it at `/sitemap.xml`.
**Example:**
```typescript
// src/app/sitemap.ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

import type { MetadataRoute } from "next";

const BASE_URL = "https://dweinbeck.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/projects`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/building-blocks`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/writing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/assistant`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
```

### Pattern 5: Convention File for Robots
**What:** Export a default function returning `MetadataRoute.Robots` from `src/app/robots.ts`.
**Example:**
```typescript
// src/app/robots.ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://dweinbeck.com/sitemap.xml",
  };
}
```

### Anti-Patterns to Avoid
- **Mixing `next-seo` with Metadata API:** Causes duplicate tags and conflicts. Use only the built-in API.
- **Forgetting to set OG fields explicitly:** OG tags do NOT inherit from top-level `title`/`description`. You must set `openGraph.title` and `openGraph.description` separately.
- **Shallow merge surprise:** If a child page sets `openGraph: { title: "X" }`, it REPLACES the entire parent `openGraph` object (including `description`, `images`, etc.). Either spread shared fields or let the parent's OG config be inherited by not setting `openGraph` at all.
- **Hardcoding absolute URLs in OG images:** Use `metadataBase` + relative paths instead. `metadataBase` resolves them automatically.
- **Using client components for JSON-LD:** Must be server-rendered for crawlers to see it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Meta tag management | Custom `<Head>` component | `export const metadata` / `generateMetadata` | Built-in, type-safe, handles dedup |
| Sitemap generation | Manual XML string building | `src/app/sitemap.ts` convention file | Cached, typed, auto-served |
| Robots.txt | Static file in /public | `src/app/robots.ts` convention file | Programmatic, can reference sitemap URL |
| JSON-LD types | Manual interfaces | `schema-dts` package | Complete schema.org types, catches errors |
| OG image serving | Custom API route | Static `opengraph-image.png` in app dir | Auto-detected by Next.js, correct headers |
| Font loading | `@import` or `<link>` tags | `next/font/google` (already used) | Zero CLS, preloaded, self-hosted |

**Key insight:** Next.js 16 App Router has built-in conventions for every SEO file type. Using them means zero configuration, automatic caching, and correct Content-Type headers.

## Common Pitfalls

### Pitfall 1: OG Metadata Shallow Merge
**What goes wrong:** Child page sets `openGraph: { title: "Page" }` and loses parent's `description`, `images`, `siteName`.
**Why it happens:** Next.js metadata merging is shallow -- nested objects are replaced entirely, not deep-merged.
**How to avoid:** Either (a) let OG inherit from parent by not setting `openGraph` in child pages at all, or (b) always include all required OG fields when overriding. Create a shared metadata helper if needed.
**Warning signs:** OG preview missing image or description on specific pages.

### Pitfall 2: Missing `metadataBase`
**What goes wrong:** OG images and canonical URLs show as relative paths (e.g., `/opengraph-image.png`) instead of absolute URLs in the HTML.
**Why it happens:** `metadataBase` is not set in root layout.
**How to avoid:** Always set `metadataBase: new URL("https://yourdomain.com")` in root layout.
**Warning signs:** Sharing a link on social media shows no preview image.

### Pitfall 3: Duplicate JSON-LD from Hydration
**What goes wrong:** `<script type="application/ld+json">` appears twice in the DOM.
**Why it happens:** React hydration can duplicate server-rendered script tags in some versions.
**How to avoid:** Place JSON-LD script in a server component (no "use client"). In the current Next.js 16 App Router, pages are server components by default, so this is handled automatically. Avoid wrapping JSON-LD in client components.
**Warning signs:** Google Structured Data Testing Tool shows duplicate entities.

### Pitfall 4: Title Template Not Applied to Current Segment
**What goes wrong:** Root layout sets `title: { template: "%s | Dan Weinbeck" }` but the home page title shows just "%s | Dan Weinbeck" or is missing.
**Why it happens:** Title template only applies to CHILD segments, not the segment where it is defined.
**How to avoid:** Always set `title.default` alongside `title.template` in the layout. The home page (`src/app/page.tsx`) is a child of the root layout, so it WILL use the template -- but it still needs its own `title` export.
**Warning signs:** Home page title is wrong or says "undefined | Dan Weinbeck".

### Pitfall 5: Lighthouse Accessibility Failures
**What goes wrong:** Lighthouse accessibility score drops below 90.
**Why it happens:** Missing alt text on images, insufficient color contrast, missing form labels, missing landmark elements.
**How to avoid:** Audit all images for `alt` props (Next.js `<Image>` requires it), ensure text contrast ratios meet WCAG AA (4.5:1 for normal text), add `aria-label` to icon-only buttons, use semantic HTML elements (`<nav>`, `<main>`, `<footer>`, `<article>`).
**Warning signs:** Biome already enforces `useSemanticElements` and `useAnchorContent`, which helps.

### Pitfall 6: Building Blocks Title Not Using Template
**What goes wrong:** `building-blocks/page.tsx` currently sets `title: "Building Blocks | Dan Weinbeck"` manually, which would become "Building Blocks | Dan Weinbeck | Dan Weinbeck" if the template is applied.
**Why it happens:** The page was created before the title template was set up.
**How to avoid:** Update existing metadata exports to only set the page-specific portion: `title: "Building Blocks"`. Similarly update `[slug]/page.tsx` to use `title: \`\${meta.title} | Building Blocks\`` (the root template adds "| Dan Weinbeck").

## Code Examples

### Complete Root Layout Metadata
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
import type { Metadata } from "next";

const SITE_URL = "https://dweinbeck.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | Dan Weinbeck",
    default: "Dan Weinbeck - AI Developer & Data Scientist",
  },
  description: "AI developer, analytics professional, and data scientist",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Dan Weinbeck",
    title: "Dan Weinbeck - AI Developer & Data Scientist",
    description: "AI developer, analytics professional, and data scientist",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### Complete Sitemap with Dynamic Tutorial Routes
```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllTutorials } from "@/lib/tutorials";

const BASE_URL = "https://dweinbeck.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tutorials = await getAllTutorials();

  const tutorialUrls: MetadataRoute.Sitemap = tutorials.map((t) => ({
    url: `${BASE_URL}/building-blocks/${t.slug}`,
    lastModified: new Date(t.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/projects`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/building-blocks`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/writing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/assistant`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    ...tutorialUrls,
  ];
}
```

### Person JSON-LD with schema-dts Types
```typescript
// Source: https://nextjs.org/docs/app/guides/json-ld
import type { Person, WithContext } from "schema-dts";

const personJsonLd: WithContext<Person> = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Dan Weinbeck",
  url: "https://dweinbeck.com",
  jobTitle: "AI Developer & Data Scientist",
  description: "AI developer, analytics professional, and data scientist",
  email: "dan@dweinbeck.com",
  sameAs: [
    "https://www.linkedin.com/in/dw789/",
    "https://github.com/dweinbeck",
    "https://instagram.com/dweinbeck",
  ],
};
```

### Polished Stub Page Pattern
```typescript
// src/app/writing/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing",
  description: "Articles and thoughts on AI, data science, and software development.",
};

export default function WritingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Writing</h1>
      <p className="mt-4 text-gray-600">
        Articles and thoughts on AI, data science, and software development.
      </p>
      <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 text-center">
        <p className="text-lg font-medium text-gray-900">Coming Soon</p>
        <p className="mt-2 text-sm text-gray-500">
          New articles are on the way. Check back soon.
        </p>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next-seo` package | Built-in Metadata API | Next.js 13.2+ (2023) | No external dep needed |
| `next-sitemap` package | `sitemap.ts` convention file | Next.js 13.3+ (2023) | Native, cached, typed |
| `<Head>` component | `export const metadata` | Next.js 13+ App Router | Server-side only, type-safe |
| `getStaticProps` for meta | `generateMetadata` async function | Next.js 13+ App Router | Colocated with page |
| Manual `robots.txt` in /public | `robots.ts` convention file | Next.js 13.3+ (2023) | Programmatic, references sitemap |
| `next/head` for JSON-LD | `<script>` in server component | Next.js 13+ App Router | SSR-guaranteed, no hydration issues |

**Deprecated/outdated:**
- `next-seo`: Unnecessary with App Router; can cause duplicate tags if mixed with Metadata API
- `next-sitemap`: Designed for Pages Router; convention file is the standard now
- `<Head>` from `next/head`: Not available in App Router

## Open Questions

1. **Production domain URL**
   - What we know: Contact page shows `dan@dweinbeck.com`, suggesting the domain is `dweinbeck.com`
   - What's unclear: Whether the production URL is `dweinbeck.com` or something else
   - Recommendation: Use a `SITE_URL` constant that can be easily updated. Default to `https://dweinbeck.com`

2. **OG image content**
   - What we know: A static `opengraph-image.png` (1200x630) is needed for social sharing previews
   - What's unclear: Whether the user has a preferred design or headshot to include (there is a `headshot.jpeg` in the repo root)
   - Recommendation: Create a simple OG image with name + title text, or use the headshot. Can be done in any image editor -- no dynamic generation needed for ~7 pages.

3. **Whether tutorials should have individual OG metadata**
   - What we know: `[slug]/page.tsx` already has `generateMetadata` with title/description
   - What's unclear: Whether OG images per tutorial are desired
   - Recommendation: For now, tutorials inherit the root OG image. Individual OG images can be added later via `opengraph-image.tsx` in the `[slug]` folder.

## Sources

### Primary (HIGH confidence)
- [Next.js Metadata API Reference](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) - Title templates, metadataBase, OG config, merging behavior
- [Next.js Metadata & OG Images Guide](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) - Static and dynamic OG images, file conventions
- [Next.js sitemap.xml Convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) - sitemap.ts API, MetadataRoute.Sitemap type
- [Next.js robots.txt Convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) - robots.ts API, MetadataRoute.Robots type
- [Next.js JSON-LD Guide](https://nextjs.org/docs/app/guides/json-ld) - Script tag pattern, XSS prevention, schema-dts

### Secondary (MEDIUM confidence)
- [schema.org Person type](https://schema.org/Person) - Person schema properties
- [Google ProfilePage structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page) - Google's recommendation for profile pages
- [JSON-LD Person Example](https://jsonld.com/person/) - Validated Person schema examples

### Tertiary (LOW confidence)
- Various Medium/DEV articles on Lighthouse optimization - General patterns, not version-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All based on official Next.js documentation, verified via WebFetch
- Architecture: HIGH - Patterns directly from Next.js docs with code examples verified
- Pitfalls: HIGH - Merging behavior and title template documented in official API reference
- JSON-LD: HIGH - Official Next.js guide with verified code patterns
- Lighthouse: MEDIUM - General best practices; site already follows most patterns (server components, next/font, next/image)

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (stable APIs, unlikely to change)
