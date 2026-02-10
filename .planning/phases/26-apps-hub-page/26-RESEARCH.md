# Phase 26: Apps Hub Page - Research

**Researched:** 2026-02-10
**Domain:** Next.js static listing page, navigation integration, sitemap
**Confidence:** HIGH

## Summary

Phase 26 requires building a dedicated `/apps` listing page with a card grid, adding "Apps" to the main navigation, and extending the sitemap. This is a straightforward feature phase that follows well-established patterns already in the codebase -- no new libraries, no new frameworks, no external APIs.

The codebase already has identical patterns for listing pages (`/custom-gpts`, `/building-blocks`, `/projects`), data-driven content (`src/data/*.json` with typed accessor functions), and card components (`ProjectCard`, `TutorialCard`, `Card`). The implementation should follow these existing patterns exactly rather than inventing new approaches.

**Primary recommendation:** Mirror the `custom-gpts` pattern (JSON data file + typed accessor + server component page) with a purpose-built `AppCard` component modeled after `TutorialCard`'s badge/tags/action-button layout.

## Standard Stack

### Core

No new libraries required. This phase uses only what already exists in the project.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router page, metadata, sitemap | Already in project |
| React | 19.2.3 | Components | Already in project |
| Tailwind CSS | 4.x | Styling | Already in project |
| clsx | 2.1.1 | Conditional CSS classes | Already in project |
| Vitest | 3.2.4 | Unit tests | Already in project |

### Supporting

None needed. No new dependencies required for this phase.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON data file | Firestore collection | Overkill for 2 static apps; JSON is simpler, no API call, matches custom-gpts pattern |
| Custom AppCard | Reuse existing `Card` component directly | `Card` is too generic -- AppCard needs topic badge, subtitle, tech stack tags, dates, and conditional action button; better as a dedicated component like `TutorialCard` |
| Server component page | Client component with SWR | Data is static, no user interaction needed on the listing; server component is correct |

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── data/
│   └── apps.ts              # App listing type + data array (APPS-01, APPS-02)
├── components/
│   └── apps/
│       └── AppCard.tsx       # Card component (APPS-03, APPS-04)
├── app/
│   └── apps/
│       ├── page.tsx          # Index page (APPS-05) — already exists as parent of brand-scraper
│       └── brand-scraper/
│           └── page.tsx      # Already exists
├── components/
│   └── layout/
│       └── NavLinks.tsx      # Add "Apps" link (APPS-06)
└── app/
    └── sitemap.ts            # Add /apps entries (APPS-07)
```

### Pattern 1: JSON/TS Data File with Typed Accessor

**What:** Define a TypeScript type and export a typed array of app listings from a single file.
**When to use:** Static listing data that doesn't need a database.
**Why this over JSON:** The app listing type has a union type (`available` flag) and dates -- TypeScript gives better type safety and allows computed values. The `custom-gpts` pattern uses JSON, but since the app type is richer (dates, boolean flags), a `.ts` file is cleaner.

**Example (based on `src/lib/custom-gpts.ts` pattern):**
```typescript
// src/data/apps.ts
export interface AppListing {
  title: string;
  tag: string;           // Topic badge (e.g., "Web Scraping", "Fintech")
  subtitle: string;      // Short one-liner
  description: string;   // Longer description
  href: string;          // App route (e.g., "/apps/brand-scraper")
  launchedAt: string;    // ISO date string or "TBD"
  updatedAt: string;     // ISO date string or "TBD"
  techStack: string[];   // Tech tags (e.g., ["TypeScript", "Puppeteer"])
  available: boolean;    // true = "Enter App", false = "Coming Soon"
}

export const apps: AppListing[] = [
  {
    title: "Brand Scraper",
    tag: "Web Scraping",
    subtitle: "Extract brand assets from any website",
    description: "Automatically grabs the most important brand style components and images from any website you specify.",
    href: "/apps/brand-scraper",
    launchedAt: "2026-02-09",
    updatedAt: "2026-02-10",
    techStack: ["TypeScript", "Puppeteer", "GCP"],
    available: true,
  },
  {
    title: "Dave Ramsey Digital Envelopes",
    tag: "Fintech",
    subtitle: "Envelope budgeting made digital",
    description: "A full-featured budget management app implementing the popular envelope method for personal finance.",
    href: "/apps/envelopes",
    launchedAt: "TBD",
    updatedAt: "TBD",
    techStack: ["React", "Firebase", "Fintech"],
    available: false,
  },
];
```

**Source:** Codebase pattern from `src/lib/custom-gpts.ts` and `src/data/custom-gpts.json`

### Pattern 2: Server Component Listing Page

**What:** A server component page with metadata export, heading, intro text, and responsive grid.
**When to use:** Static listing pages with no client-side interactivity.

**Example (based on `src/app/custom-gpts/page.tsx` and `src/app/building-blocks/page.tsx`):**
```typescript
// src/app/apps/page.tsx
import type { Metadata } from "next";
import { AppCard } from "@/components/apps/AppCard";
import { apps } from "@/data/apps";

export const metadata: Metadata = {
  title: "Apps",
  description: "Discover and access tools built by Dan Weinbeck.",
};

export default function AppsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">Apps</h1>
      <p className="mt-2 text-text-secondary">
        Tools and applications I've built. Try them out.
      </p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {apps.map((app) => (
          <AppCard key={app.href} app={app} />
        ))}
      </div>
    </div>
  );
}
```

**Source:** Codebase patterns from `src/app/custom-gpts/page.tsx` (line structure), `src/app/building-blocks/page.tsx` (grid layout)

### Pattern 3: Feature Card Component with Badge + Conditional Action

**What:** A card with topic badge (top-right), subtitle, description, tech stack tags, dates, and a conditional action button (link vs disabled).
**When to use:** Any listing where items have an "available" vs "coming soon" state.

**Example (based on `TutorialCard` badge pattern + `ProjectCard` status badge + `Button` component):**
```typescript
// src/components/apps/AppCard.tsx
import { Button } from "@/components/ui/Button";
import type { AppListing } from "@/data/apps";

interface AppCardProps {
  app: AppListing;
}

export function AppCard({ app }: AppCardProps) {
  return (
    <div className="relative flex h-full flex-col rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)] transition-all duration-200">
      {/* Topic badge */}
      <span className="absolute top-4 right-4 px-2.5 py-0.5 text-xs font-medium rounded-full border bg-gold-light text-gold-hover border-gold">
        {app.tag}
      </span>

      <h3 className="font-display text-lg font-bold text-text-primary pr-24">
        {app.title}
      </h3>
      <p className="mt-1 text-sm font-medium text-gold">{app.subtitle}</p>
      <p className="mt-3 flex-1 text-sm text-text-secondary leading-relaxed">
        {app.description}
      </p>

      {/* Tech stack tags */}
      <div className="mt-5 flex flex-wrap gap-2">
        {app.techStack.map((tech) => (
          <span
            key={tech}
            className="px-2.5 py-0.5 font-mono text-xs text-text-tertiary bg-[rgba(27,42,74,0.04)] rounded-full"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Dates */}
      <p className="mt-4 text-xs text-text-tertiary">
        {app.available
          ? `Launched ${app.launchedAt} · Updated ${app.updatedAt}`
          : "Coming Soon"}
      </p>

      {/* Action button */}
      <div className="mt-5">
        {app.available ? (
          <Button size="sm" href={app.href}>Enter App</Button>
        ) : (
          <Button size="sm" disabled>Coming Soon</Button>
        )}
      </div>
    </div>
  );
}
```

**Source:** Codebase patterns from `TutorialCard` (badge), `ProjectCard` (status), `Button` (disabled state)

### Pattern 4: Navigation Link Addition

**What:** Add "Apps" to the `baseLinks` array in `NavLinks.tsx`.
**When to use:** When a new public page needs to appear in the main nav.

The existing `isActive` function already handles nested routes:
```typescript
function isActive(href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}
```

Adding `{ name: "Apps", href: "/apps" }` to `baseLinks` will automatically highlight "Apps" for both `/apps` and `/apps/brand-scraper` because `"/apps/brand-scraper".startsWith("/apps")` is `true`.

**Placement:** Insert after "Custom GPTs" and before "Assistant" to keep the nav logically ordered (showcase content, then tools, then utilities).

**Source:** Codebase `src/components/layout/NavLinks.tsx` lines 11-18, 36-39

### Pattern 5: Sitemap Extension

**What:** Add static entries to the sitemap return array.
**When to use:** When new public pages need search engine discoverability.

```typescript
// Add to the static pages array in src/app/sitemap.ts
{
  url: `${BASE_URL}/apps`,
  lastModified: now,
  changeFrequency: "monthly",
  priority: 0.7,
},
{
  url: `${BASE_URL}/apps/brand-scraper`,
  lastModified: now,
  changeFrequency: "monthly",
  priority: 0.6,
},
```

**Source:** Codebase `src/app/sitemap.ts` lines 43-86

### Anti-Patterns to Avoid

- **Don't use "use client" on the apps page:** There's no client-side interactivity needed. The page is a static listing. Server component is correct.
- **Don't create a layout.tsx for /apps:** There's no shared layout between the apps index and individual app pages. The brand-scraper page is already a standalone page. Adding a layout adds unnecessary complexity.
- **Don't conditionally show "Apps" based on auth:** The requirements say "Visitor" (not "User"), so "Apps" should be in `baseLinks`, not behind auth like "Envelopes" or "Control Center".
- **Don't use the `Card` UI component as the AppCard wrapper:** `Card` renders as a `<Link>` when given `href`, but the AppCard needs an internal `Button` link, not the whole card as a link. The "Coming Soon" card should not be clickable at all.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional CSS classes | String concatenation | `clsx` (already in project) | Handles falsy values, cleaner syntax |
| Button with link/disabled states | Custom `<a>` / `<button>` | `Button` component from `src/components/ui/Button.tsx` | Already handles `href` → Link, no `href` → button, `disabled` prop |
| Card styling (borders, shadows, hover) | Custom div styling from scratch | Reference existing card tokens (`--shadow-card`, `--shadow-card-hover`, `border-border`, `bg-surface`, `rounded-2xl`) | Consistent with all other cards in the codebase |
| Tag rendering (tech stack badges) | Custom badge component | Reuse the inline `<span>` pattern from `ProjectCard` / `TutorialCard` | Identical styling: `px-2.5 py-0.5 font-mono text-xs text-text-tertiary bg-[rgba(27,42,74,0.04)] rounded-full` |

**Key insight:** Every visual element needed for this phase already exists as a pattern somewhere in the codebase. The job is assembly, not invention.

## Common Pitfalls

### Pitfall 1: Navigation Active State for Nested Routes

**What goes wrong:** The "Apps" nav link doesn't highlight when viewing `/apps/brand-scraper`.
**Why it happens:** Incorrect `isActive` logic or using exact match instead of `startsWith`.
**How to avoid:** The existing `isActive` function in `NavLinks.tsx` already uses `pathname.startsWith(href)` for non-root paths. Simply adding `{ name: "Apps", href: "/apps" }` to `baseLinks` is sufficient. No custom logic needed.
**Warning signs:** Test by verifying both `/apps` and `/apps/brand-scraper` show the "Apps" link as active.

### Pitfall 2: "Coming Soon" Button is Clickable

**What goes wrong:** The disabled button wraps in a link or is otherwise clickable/focusable in a misleading way.
**Why it happens:** Using `Button` with both `href` and `disabled`, or wrapping in a `<Link>`.
**How to avoid:** For coming-soon apps, render `<Button size="sm" disabled>Coming Soon</Button>` WITHOUT an `href`. The `Button` component already applies `disabled:opacity-50 disabled:pointer-events-none` (line 41 of Button.tsx), which handles both visual dimming and click prevention.
**Warning signs:** Check that the disabled button has no `href`, no wrapping `<a>`, and `pointer-events: none` in the computed styles.

### Pitfall 3: Metadata Template Not Used

**What goes wrong:** The page title shows "Apps" instead of "Apps | Dan Weinbeck".
**Why it happens:** Exporting `metadata` as a plain object with `title: "Apps"` without understanding the template.
**How to avoid:** The root layout already has `title: { template: "%s | Dan Weinbeck" }`. Setting `title: "Apps"` in the page metadata will automatically produce "Apps | Dan Weinbeck". This is the correct behavior -- no need to manually append the site name.
**Warning signs:** Check that the page uses `export const metadata: Metadata = { title: "Apps", ... }` (not a string-only export).

### Pitfall 4: Mobile Navigation Overflow

**What goes wrong:** Adding "Apps" to the nav causes desktop links to overflow or wrap awkwardly.
**Why it happens:** Too many links in a horizontal flex container on medium-width screens.
**How to avoid:** The current nav has 7 base links + conditional "Envelopes" and "Control Center". Adding "Apps" makes 8 base links. Test at `md` breakpoint (768px) to ensure links don't overflow. The mobile hamburger menu handles smaller screens, so the risk is mainly at `md` to `lg` widths. The existing `text-sm` + `px-3` + `gap-1` styling should accommodate one more short link, but this must be visually verified.
**Warning signs:** Check the nav at 768px-1024px viewport widths.

### Pitfall 5: Date Formatting Inconsistency

**What goes wrong:** Dates show as raw ISO strings ("2026-02-09") instead of human-friendly format.
**Why it happens:** Using raw date strings from the data without formatting.
**How to avoid:** Decide upfront whether to show ISO dates, formatted dates, or relative dates. Since the requirements say "dates" generically, using a simple formatted display (e.g., "Feb 9, 2026") is appropriate. For "Coming Soon" apps, dates should show "TBD" or be omitted entirely.
**Warning signs:** Verify both available and coming-soon cards render dates appropriately.

## Code Examples

### Complete AppCard Component

See Pattern 3 above for the full component code.

### NavLinks Update

```typescript
// In src/components/layout/NavLinks.tsx, update baseLinks:
const baseLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Building Blocks", href: "/building-blocks" },
  { name: "Custom GPTs", href: "/custom-gpts" },
  { name: "Apps", href: "/apps" },           // NEW
  { name: "Assistant", href: "/assistant" },
  { name: "Contact", href: "/contact" },
];
```

### Sitemap Addition

```typescript
// Add to the static pages array in src/app/sitemap.ts return statement:
{
  url: `${BASE_URL}/apps`,
  lastModified: now,
  changeFrequency: "monthly",
  priority: 0.7,
},
{
  url: `${BASE_URL}/apps/brand-scraper`,
  lastModified: now,
  changeFrequency: "monthly",
  priority: 0.6,
},
```

### Unit Test for App Listings Data

```typescript
// src/data/__tests__/apps.test.ts
import { describe, expect, it } from "vitest";
import { apps } from "../apps";
import type { AppListing } from "../apps";

describe("apps data", () => {
  it("exports a non-empty array", () => {
    expect(apps.length).toBeGreaterThan(0);
  });

  it("each app has required fields", () => {
    for (const app of apps) {
      expect(app.title).toBeTruthy();
      expect(app.tag).toBeTruthy();
      expect(app.subtitle).toBeTruthy();
      expect(app.description).toBeTruthy();
      expect(app.href).toMatch(/^\/apps\//);
      expect(typeof app.available).toBe("boolean");
      expect(app.techStack.length).toBeGreaterThan(0);
    }
  });

  it("Brand Scraper is available", () => {
    const bs = apps.find((a) => a.title === "Brand Scraper");
    expect(bs).toBeDefined();
    expect(bs!.available).toBe(true);
    expect(bs!.href).toBe("/apps/brand-scraper");
  });

  it("Digital Envelopes is coming soon", () => {
    const de = apps.find((a) => a.title.includes("Envelopes"));
    expect(de).toBeDefined();
    expect(de!.available).toBe(false);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pages/` directory routing | `app/` directory (App Router) | Next.js 13+ | Already using App Router |
| `export const metadata` as object | Same, with `Metadata` type | Next.js 13+ | Already using this pattern |
| Custom sitemap generation | `sitemap.ts` convention file | Next.js 13+ | Already using this pattern |
| Tailwind CSS config file | `@theme` inline in CSS | Tailwind CSS 4 | Already using this pattern |

**Deprecated/outdated:**
- None relevant. All codebase patterns are current.

## Open Questions

1. **Exact date format for app cards**
   - What we know: Requirements say "dates" — the data includes `launchedAt` and `updatedAt`.
   - What's unclear: Should dates be formatted (e.g., "Feb 9, 2026"), relative ("3 days ago"), or raw ISO?
   - Recommendation: Use a simple formatted date like "Feb 2026" or "Feb 9, 2026" using `Date.toLocaleDateString`. For coming-soon apps, omit dates entirely or show "Coming Soon" in the date area. Let the planner decide the exact format -- this is a minor styling choice.

2. **"Apps" link placement in navigation**
   - What we know: It should be in the public nav (not auth-gated).
   - What's unclear: Exact position among the 7 existing base links.
   - Recommendation: Place after "Custom GPTs" and before "Assistant" — this groups content-discovery links together. This is what the code examples above show.

3. **Digital Envelopes href**
   - What we know: The Envelopes app exists at `/envelopes` (auth-gated). The "Coming Soon" card needs an `href` in the data for when it eventually becomes available.
   - What's unclear: Should it be `/apps/envelopes` (consistent with `/apps/brand-scraper` pattern) or `/envelopes` (existing route)?
   - Recommendation: Use `/apps/envelopes` in the data to be consistent with the apps routing pattern. When the app goes live, a redirect or page can be created. Since the button is disabled for now, the href value doesn't matter functionally.

## Sources

### Primary (HIGH confidence)

- **Codebase inspection** — All patterns verified by reading actual source files:
  - `src/components/layout/NavLinks.tsx` — Navigation structure, `isActive` function, `baseLinks` array
  - `src/components/layout/Navbar.tsx` — Navbar wrapper
  - `src/app/sitemap.ts` — Sitemap structure and static page entries
  - `src/components/ui/Card.tsx` — Shared Card component (variants, styling)
  - `src/components/ui/Button.tsx` — Shared Button component (disabled state, href handling)
  - `src/app/custom-gpts/page.tsx` — Listing page pattern (server component, metadata, grid)
  - `src/app/building-blocks/page.tsx` — Listing page pattern (server component, metadata, grid)
  - `src/app/projects/page.tsx` — Listing page pattern with filter
  - `src/lib/custom-gpts.ts` — Typed data accessor pattern
  - `src/data/custom-gpts.json` — JSON data file pattern
  - `src/data/projects.json` — JSON data with tags and status
  - `src/components/home/ProjectCard.tsx` — Card with status badge + tags
  - `src/components/building-blocks/TutorialCard.tsx` — Card with topic badge + tags
  - `src/components/home/FeaturedProjects.tsx` — Grid layout pattern
  - `src/app/layout.tsx` — Root metadata template (`%s | Dan Weinbeck`)
  - `src/app/globals.css` — Design tokens (colors, shadows, fonts)
  - `src/app/apps/brand-scraper/page.tsx` — Existing brand scraper page
  - `vitest.config.ts` — Test configuration
  - `src/lib/billing/__tests__/types.test.ts` — Test pattern reference
  - `package.json` — Dependencies and scripts

### Secondary (MEDIUM confidence)

- None needed — all findings are from direct codebase inspection.

### Tertiary (LOW confidence)

- None — no external research needed for this phase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new libraries; everything already exists in the project
- Architecture: HIGH — Directly mirrors 3+ existing listing page patterns in the codebase
- Pitfalls: HIGH — All identified from direct code analysis of existing navigation, button, and metadata behavior

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (stable — no external dependencies or fast-moving libraries involved)
