# Phase 27: Apps-first Home + Schema Alignment - Research

**Researched:** 2026-02-10
**Domain:** Next.js routing, component refactoring, Zod schema alignment
**Confidence:** HIGH

## Summary

Phase 27 covers three distinct workstreams: (1) removing the Projects section and updating navigation, (2) rebuilding the Home page around an apps grid with a Building Blocks CTA, and (3) fixing the Brand Scraper Zod schemas on the main site to match the real taxonomy produced by the scraper service. All three are well-understood changes that require zero new dependencies.

The codebase investigation reveals the exact scope: 5 files to delete, 8 files to modify, 2 new files to create, and 1 Zod schema file to rewrite. The existing `AppCard` component and `getApps()` data source from the `/apps` page provide a solid foundation for the home page grid, needing only styling adjustments (3-wide grid, blue+gold button, full-width button, pinned bottom). The real scraper taxonomy (confirmed via `brand-scraper/src/schema/taxonomy.ts` and a real `brand.json` output file) uses a fundamentally different structure from the current site schemas -- every field is wrapped in `{ value, confidence, evidence, needs_review }` rather than having flat fields with top-level confidence.

**Primary recommendation:** Execute in three clean passes: (1) routing/nav cleanup, (2) home page rebuild, (3) schema alignment. Each pass is independently verifiable.

## Current Codebase State

### Files to REMOVE (Projects section)
| File | Purpose | References to Clean Up |
|------|---------|----------------------|
| `src/app/projects/page.tsx` | Projects listing page | Redirect instead |
| `src/app/projects/[slug]/page.tsx` | Project detail page | Redirect instead |
| `src/components/projects/ProjectsFilter.tsx` | Client-side filter component | Only used by projects/page.tsx |
| `src/components/projects/DetailedProjectCard.tsx` | Detailed project card | Only used by ProjectsFilter |
| `src/components/projects/ReadmeRenderer.tsx` | README markdown display | Only used by [slug]/page.tsx |
| `src/components/home/FeaturedProjects.tsx` | Home section showing 6 featured projects | Replaced by apps grid |
| `src/components/home/ProjectCard.tsx` | Card component for home featured projects | Only used by FeaturedProjects |

### Files to MODIFY
| File | Change |
|------|--------|
| `src/app/page.tsx` | Replace `FeaturedProjects` with apps grid section; replace `FeaturedBuildingBlocks` with new CTA section |
| `src/components/layout/NavLinks.tsx` | Remove "Projects" from `baseLinks`; reorder to match spec |
| `next.config.ts` | Add `/projects` and `/projects/:slug` redirects |
| `src/app/not-found.tsx` | Remove "Projects" from navigation links |
| `src/app/sitemap.ts` | Remove projects URLs; remove `fetchAllProjects` import |
| `src/lib/brand-scraper/types.ts` | Complete rewrite of `brandTaxonomySchema` to match real taxonomy |
| `src/components/admin/brand-scraper/ColorPaletteCard.tsx` | Read from `entry.value.hex` instead of `color.hex` |
| `src/components/admin/brand-scraper/TypographyCard.tsx` | Read from `entry.value.family` instead of `font.family` |
| `src/components/admin/brand-scraper/LogoAssetsCard.tsx` | Read from `entry.value.url` instead of `logo.url`; handle nested assets structure |
| `src/components/admin/brand-scraper/BrandResultsGallery.tsx` | Update prop paths for new taxonomy shape |
| `src/components/tools/brand-scraper/UserBrandScraperPage.tsx` | Add defensive Zod parsing with fallback UI |

### Files to CREATE
| File | Purpose |
|------|---------|
| `src/components/home/AppsGrid.tsx` | New home section: 3-wide grid of app cards with custom styling |
| `src/components/home/BuildingBlocksCta.tsx` | New CTA section below apps grid |

## Navigation

### Current Nav Config
Located in `src/components/layout/NavLinks.tsx` (line 10-19):
```typescript
const baseLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },        // REMOVE
  { name: "Building Blocks", href: "/building-blocks" },
  { name: "Custom GPTs", href: "/custom-gpts" },
  { name: "Apps", href: "/apps" },
  { name: "Assistant", href: "/assistant" },
  { name: "Contact", href: "/contact" },
];
```

### Required Nav Config
```typescript
const baseLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Building Blocks", href: "/building-blocks" },
  { name: "Custom GPTs", href: "/custom-gpts" },
  { name: "Apps", href: "/apps" },
  { name: "Assistant", href: "/assistant" },
  { name: "Contact", href: "/contact" },
];
```

### Control Center Visibility (NAV-03)
Already implemented correctly in `NavLinks.tsx` (lines 26-31):
```typescript
const links = useMemo(() => {
  const result = [...baseLinks];
  if (user?.email === ADMIN_EMAIL) {
    result.push({ name: "Control Center", href: "/control-center" });
  }
  return result;
}, [user]);
```
**No change needed** for NAV-03. The admin-only conditional append already works. Just removing "Projects" and reordering satisfies NAV-02 and NAV-03.

### All /projects References to Clean
**Confidence: HIGH** -- Verified via grep across entire `src/` directory.

| File | Line | Reference | Action |
|------|------|-----------|--------|
| `src/components/layout/NavLinks.tsx` | 13 | `{ name: "Projects", href: "/projects" }` | Remove entry |
| `src/components/home/FeaturedProjects.tsx` | 20 | `href="/projects"` (See All button) | Delete entire file |
| `src/components/home/ProjectCard.tsx` | 16 | `href={/projects/${project.slug}}` | Delete entire file |
| `src/app/not-found.tsx` | 16 | `{ href: "/projects", label: "Projects" }` | Remove entry |
| `src/app/sitemap.ts` | 37,58 | Project URLs in sitemap | Remove project URLs and imports |
| `src/app/projects/page.tsx` | -- | Entire file | Delete (redirect handles) |
| `src/app/projects/[slug]/page.tsx` | -- | Entire file | Delete (redirect handles) |
| `src/lib/github.ts` | 1 | `import projectConfig` | Keep file (may be used elsewhere) |
| `src/lib/todoist.ts` | 27 | `"/projects"` | Unrelated Todoist API call, no action |

## Home Page

### Current Structure (`src/app/page.tsx`)
```
<HeroSection />           -- KEEP (hero with headshot, taglines, bio)
<FeaturedProjects />       -- REPLACE with AppsGrid
<FeaturedBuildingBlocks /> -- REPLACE with BuildingBlocksCta
```

### Required Structure
```
<HeroSection />            -- KEEP (with tag spacing reduction)
<AppsGrid />               -- NEW: 3-wide grid of published apps
<BuildingBlocksCta />      -- NEW: "Want to learn about AI Agent Development?" section
```

### Apps Data Source
`src/data/apps.ts` exports `getApps()` which returns `AppListing[]`. Currently 2 apps:
- Brand Scraper (available: true)
- Dave Ramsey Digital Envelopes (available: true)

The `AppListing` interface:
```typescript
interface AppListing {
  slug: string;
  title: string;
  tag: string;
  subtitle: string;
  description: string;
  href: string;
  launchedAt: string;
  updatedAt: string;
  techStack: string[];
  available: boolean;
}
```

### Existing AppCard Analysis
The current `AppCard` in `src/components/apps/AppCard.tsx` renders:
- Topic badge (tag with color)
- Title + subtitle
- Description (line-clamped to 3 lines)
- Tech stack tags
- Dates (launched, updated)
- Action button ("Enter App" or "Coming Soon")

For the home page grid, the requirements specify:
1. **3-wide grid** (current apps page uses 2-wide)
2. **Uniform card height** with flex layout
3. **Button pinned to bottom** (current card uses `flex-1` on description for this)
4. **Blue fill + thin gold border button** (different from current `variant="secondary"`)
5. **Full-width button** within card padding
6. **Top tag spacing reduced ~50%** (hero section tags, not app card tags)

### Button Styling for Apps Grid
Current "Enter App" button uses `variant="secondary"` which gives:
```
border-2 border-primary/20 bg-surface text-text-primary hover:shadow-md hover:border-primary/40
```

Required: blue fill + thin gold border. This matches `variant="primary"`:
```
bg-gradient-to-b from-primary to-primary-hover text-white border border-gold/40 shadow-lg
```

The primary variant already has the blue fill + gold border. The only additions needed:
- `w-full` for full-width within card padding
- Possibly remove the gradient for a flat blue, but the spec says "blue fill with thin gold border" which the primary variant satisfies

### Tag Spacing (HOME-05)
The hero section taglines in `src/components/home/HeroSection.tsx` line 34:
```html
<div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
```
Each tag has `px-4 py-1.5`. Reducing by ~50% means changing to approximately `px-2 py-0.5` or `px-3 py-1`.

### Sections to Remove (HOME-07)
The current Home page has:
1. `HeroSection` -- KEEP
2. `FeaturedProjects` -- REMOVE (replaced by apps grid)
3. `FeaturedBuildingBlocks` -- This renders the full tutorial grid with "See all tutorials" button. REPLACE with the simpler CTA section.

The `BlogTeaser` component (`src/components/home/BlogTeaser.tsx`) exists but is NOT currently used on the home page. It may be a leftover. It does reference Building Blocks with a CTA, similar to what HOME-06 needs but with different copy.

## Brand Scraper Schema Alignment

### Current Main Site Schema (WRONG)
File: `src/lib/brand-scraper/types.ts`

The current `brandTaxonomySchema` assumes **flat** structures:
```typescript
colors: z.array(z.object({
  hex: z.string(),
  rgb: z.object({ r, g, b }).optional(),
  name: z.string().optional(),
  role: z.string().optional(),
  confidence: z.number(),
  needs_review: z.boolean().optional(),
})).optional()
```

### Real Scraper Service Taxonomy (CORRECT)
Source: `brand-scraper/src/schema/taxonomy.ts` (the authoritative contract)
Verified against: `brand-scraper/output/brand.json` (real 3M scrape output)

**Confidence: HIGH** -- Read directly from the scraper service source code and a real output file.

The real taxonomy wraps EVERY extracted item in an `ExtractedField` envelope:
```typescript
{
  value: { hex, rgb, role, frequency },   // The actual data
  confidence: 0.7,                         // 0-1 score
  evidence: [{ source_url, selector, method }],
  needs_review: boolean
}
```

### Real Taxonomy Top-Level Structure
```typescript
{
  brand_id: string,                    // e.g. "3m-com"
  source: {
    site_url: string,                  // z.url()
    timestamp: string,                 // ISO datetime
    pages_sampled: number,
  },
  color?: {
    palette: ExtractedField<ColorPaletteEntry>[],
    tokens_detected: boolean,
  },
  typography?: {
    font_families: ExtractedField<TypographyEntry>[],
    type_scale?: Record<string, ExtractedField<string>>,
  },
  assets?: {
    logos?: ExtractedField<AssetEntry>[],
    favicons?: ExtractedField<AssetEntry>[],
    og_images?: ExtractedField<AssetEntry>[],
  },
  design_tokens?: {
    tokens: ExtractedField<DesignToken>[],
    source_count: number,
  },
  identity?: {
    tagline?: string,
    industry_guess?: string,
  },
  visual_style?: { ... },
  ui_system?: { ... },
  voice_tone?: { ... },
  governance?: {
    robots_respected?: boolean,
    license_hints?: string[],
  },
  meta: {
    extraction_version: string,
    stages_completed: string[],
    stages_failed: string[],
    errors: Array<{ code, message, stage }>,
    summary: {
      fields_populated: number,
      low_confidence_count: number,
      duration_ms: number,
    },
  },
}
```

### Key Differences (Current vs Real)

| Aspect | Current Site Schema | Real Scraper Schema | Impact |
|--------|-------------------|---------------------|--------|
| Top-level keys | `colors`, `fonts`, `logos`, `assets`, `identity` | `color`, `typography`, `assets`, `identity`, `source`, `meta`, `brand_id`, etc. | All access paths wrong |
| Color access | `result.colors[i].hex` | `result.color.palette[i].value.hex` | Deep nesting via ExtractedField |
| Font access | `result.fonts[i].family` | `result.typography.font_families[i].value.family` | Deep nesting + different key name |
| Font weights | `weights: number[]` | `weight: string` (single, e.g. "400") | Array vs single string |
| Logo access | `result.logos[i].url` | `result.assets.logos[i].value.url` | Nested under assets section |
| Assets | Flat `result.assets[i]` | `result.assets.logos[]`, `result.assets.favicons[]`, `result.assets.og_images[]` | Sub-categorized by type |
| Confidence | Top-level on each item: `color.confidence` | Wrapper level: `entry.confidence` (sibling of `entry.value`) | Different location |
| Evidence | Not present | `entry.evidence[]` array on every field | New data to potentially display |
| Source | Not present | `result.source` with site_url, timestamp, pages_sampled | New top-level section |
| Meta | Not present | `result.meta` with extraction stats | New top-level section |

### UI Components That Need Updating

**1. `ColorPaletteCard.tsx`** (reads `colors: BrandTaxonomy["colors"]`)
- Currently: `colors.map(color => color.hex, color.confidence, color.name)`
- Needs: `color.palette.map(entry => entry.value.hex, entry.confidence, entry.value.role)`

**2. `TypographyCard.tsx`** (reads `fonts: BrandTaxonomy["fonts"]`)
- Currently: `fonts.map(font => font.family, font.weights, font.confidence, font.source)`
- Needs: `typography.font_families.map(entry => entry.value.family, entry.value.weight, entry.confidence, entry.value.source)`

**3. `LogoAssetsCard.tsx`** (reads `logos: BrandTaxonomy["logos"]`, `assets: BrandTaxonomy["assets"]`)
- Currently: `logos.map(logo => logo.url, logo.confidence)` and `assets.map(asset => asset.url)`
- Needs: `assets.logos.map(entry => entry.value.url, entry.confidence)` and `assets.favicons`, `assets.og_images`

**4. `BrandResultsGallery.tsx`** (orchestrator passing props)
- Currently: `result.colors`, `result.fonts`, `result.logos`, `result.assets`
- Needs: `result.color`, `result.typography`, `result.assets` (assets contains logos/favicons/og_images)

### Defensive Error Handling (SCHM-03)
The `getScrapeJobStatus` function in `src/lib/brand-scraper/client.ts` already uses `jobStatusSchema.safeParse(raw)` and throws `BrandScraperError` on parse failure. However:

1. The current approach throws a generic 502 error to the caller, which becomes an opaque "failed" message in the UI
2. SCHM-03 requires: fallback message + "Download Brand JSON" link when unexpected data arrives

The defensive handling should:
- Use `.safeParse()` at the UI layer (not just the API proxy)
- When parsing fails, still show `brand_json_url` if available (since the raw response may have it even if `result` is malformed)
- Show a fallback message: "We extracted brand data but couldn't display it. Download the raw JSON instead."

## Redirect Mechanism

### Approach: next.config.ts `redirects()` (Claude's discretion)
**Confidence: HIGH** -- The codebase already uses this pattern for `/tutorials` -> `/building-blocks`.

Existing pattern in `next.config.ts`:
```typescript
async redirects() {
  return [
    { source: "/tutorials", destination: "/building-blocks", permanent: true },
    { source: "/tutorials/:slug", destination: "/building-blocks/:slug", permanent: true },
  ];
},
```

Add:
```typescript
{ source: "/projects", destination: "/", permanent: true },
{ source: "/projects/:slug", destination: "/", permanent: true },
```

**Why not middleware:** Middleware is overkill for static redirects. The `next.config.ts` approach is already the established pattern, requires zero runtime code, and handles both the exact path and wildcard slug.

## Architecture Patterns

### Home Page Grid Component
```typescript
// src/components/home/AppsGrid.tsx
// Server component (no "use client" needed)
import { getApps } from "@/data/apps";

export async function AppsGrid() {
  const apps = getApps();
  return (
    <section>
      <h2>Explore my Published Apps</h2>
      <p>And sign up or sign in to use them</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => <HomeAppCard key={app.slug} app={app} />)}
      </div>
    </section>
  );
}
```

### Button Styling Decision (Claude's discretion)
The requirement says "blue fill with thin gold border, full-width within card padding." Two approaches:

**Option A: Use existing `variant="primary"` + `className="w-full"`**
This gives `bg-gradient-to-b from-primary to-primary-hover text-white border border-gold/40` which is exactly blue fill + gold border. Just add `w-full` and `mt-auto` for full-width pinned-bottom.

**Option B: Custom one-off classes**
Would be: `bg-primary text-white border border-gold w-full`. No gradient.

**Recommendation: Option A** -- reuses the existing `Button` component with `variant="primary"` and adds `className="w-full"`. The gradient is subtle and looks polished. The gold border is already part of the primary variant (`border-gold/40`). This is the simplest approach with zero custom CSS.

### Building Blocks CTA Section
The `BlogTeaser` component already exists with a similar structure (CTA card with gradient background). However, it has different copy and includes an "Ask Dan" button that is not in the requirements.

**Recommendation:** Create a new `BuildingBlocksCta` component rather than repurposing `BlogTeaser`. The required copy is specific:
- Title: "Want to learn about AI Agent Development?"
- Subtitle: "Start with the building blocks below"
- Then the existing Building Blocks teaser content (tutorial cards)

The existing `FeaturedBuildingBlocks` component renders a full grid of tutorials. The spec says "existing Building Blocks teaser" which suggests keeping the tutorial cards but with the new title/subtitle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route redirects | Custom middleware | `next.config.ts` `redirects()` | Already the established pattern; zero runtime code |
| Admin-only nav item | New auth check | Existing `NavLinks.tsx` pattern with `ADMIN_EMAIL` check | Already works, just remove Projects entry |
| App card grid | New card component from scratch | Adapt existing `AppCard` pattern | Same data source, same card structure, just different grid and button styling |
| Zod schema validation | Manual field checking | Zod `.safeParse()` with `.passthrough()` | Already the project standard; handles edge cases |
| Responsive grid | Custom breakpoints | Tailwind `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | Already used by FeaturedProjects and other grids |

## Common Pitfalls

### Pitfall 1: Stale Project Imports After Deletion
**What goes wrong:** Deleting project files but missing an import elsewhere causes build failure.
**Why it happens:** Projects are referenced in 8+ files across the codebase.
**How to avoid:** Use the reference table above. After deletion, run `npm run build` immediately to catch any missed imports.
**Warning signs:** TypeScript `Cannot find module` errors during build.

### Pitfall 2: Sitemap Still Referencing Projects
**What goes wrong:** `src/app/sitemap.ts` imports `fetchAllProjects` and generates `/projects/*` URLs. If the import or URL generation remains, the sitemap produces dead links.
**Why it happens:** Sitemap is an easy-to-forget file.
**How to avoid:** Remove the `fetchAllProjects` import and all `projectUrls` generation from sitemap.ts. Remove the static `/projects` entry too.
**Warning signs:** Sitemap.xml contains `/projects` URLs that 301 to `/`.

### Pitfall 3: Brand Scraper Schema Breaks API Proxy
**What goes wrong:** Changing `brandTaxonomySchema` in `types.ts` causes the API proxy route (`/api/tools/brand-scraper/jobs/[id]/route.ts`) to reject valid responses with `safeParse` failure.
**Why it happens:** The `client.ts` uses `jobStatusSchema.safeParse(raw)` which includes `brandTaxonomySchema` for the `result` field. If the new schema is too strict, valid responses get rejected.
**How to avoid:** Use `.passthrough()` generously on all object schemas. The real taxonomy has many optional sections. Make sure the schema is permissive enough to handle partial results (e.g., no typography section, no assets section).
**Warning signs:** Brand scraper returns "Invalid response shape" error after schema update.

### Pitfall 4: ExtractedField Wrapper Confusion in UI
**What goes wrong:** UI components try to access `entry.hex` directly instead of `entry.value.hex`. The component renders `undefined` silently.
**Why it happens:** The old schema had flat items. The new schema wraps everything in `{ value, confidence, evidence, needs_review }`.
**How to avoid:** Update EVERY property access in the four brand scraper gallery components. Search for all direct property accesses and add `.value.` prefix.
**Warning signs:** Color swatches show no hex code, fonts show no family name, logos show no images.

### Pitfall 5: Not-Found Page Still Lists Projects
**What goes wrong:** A user hitting a 404 page sees "Projects" as a suggested navigation link, which then redirects to `/`.
**Why it happens:** The `not-found.tsx` has a hardcoded `navigationLinks` array.
**How to avoid:** Update the `navigationLinks` array in `not-found.tsx` to remove Projects and add Apps.
**Warning signs:** 404 page shows outdated navigation options.

### Pitfall 6: Home Page Grid With Only 2 Apps
**What goes wrong:** The 3-wide grid looks awkward with only 2 apps -- the third slot is empty, creating visual imbalance.
**Why it happens:** `getApps()` currently returns only 2 apps.
**How to avoid:** This is acceptable for now. The grid will naturally fill as more apps are added. With `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, 2 apps will fill the first row on desktop with an empty third slot. This is standard grid behavior and not a bug.
**Warning signs:** Purely visual -- no code issue.

## Code Examples

### Redirect Configuration
```typescript
// Source: existing pattern in next.config.ts
async redirects() {
  return [
    // Legacy route redirects
    { source: "/tutorials", destination: "/building-blocks", permanent: true },
    { source: "/tutorials/:slug", destination: "/building-blocks/:slug", permanent: true },
    // Projects removal redirects
    { source: "/projects", destination: "/", permanent: true },
    { source: "/projects/:slug", destination: "/", permanent: true },
  ];
},
```

### Updated Nav Links
```typescript
// src/components/layout/NavLinks.tsx
const baseLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Building Blocks", href: "/building-blocks" },
  { name: "Custom GPTs", href: "/custom-gpts" },
  { name: "Apps", href: "/apps" },
  { name: "Assistant", href: "/assistant" },
  { name: "Contact", href: "/contact" },
];
```

### New BrandTaxonomy Zod Schema (Aligned with Real Service)
```typescript
// src/lib/brand-scraper/types.ts -- complete rewrite of brandTaxonomySchema

const evidenceSchema = z.object({
  source_url: z.string(),
  selector: z.string().optional(),
  css_rule: z.string().optional(),
  method: z.string(),
}).passthrough();

function extractedFieldSchema<T extends z.ZodType>(valueSchema: T) {
  return z.object({
    value: valueSchema,
    confidence: z.number(),
    evidence: z.array(evidenceSchema),
    needs_review: z.boolean(),
  }).passthrough();
}

const colorPaletteEntrySchema = z.object({
  hex: z.string(),
  rgb: z.object({ r: z.number(), g: z.number(), b: z.number() }),
  role: z.string().optional(),
  frequency: z.number().optional(),
}).passthrough();

const typographyEntrySchema = z.object({
  family: z.string(),
  weight: z.string(),
  size: z.string().optional(),
  line_height: z.string().optional(),
  usage: z.string().optional(),
  source: z.string().optional(),
}).passthrough();

const assetEntrySchema = z.object({
  url: z.string(),
  local_path: z.string().optional(),
  type: z.string(),
  format: z.string().optional(),
  sizes: z.string().optional(),
  score: z.number().optional(),
  downloaded: z.boolean().optional(),
}).passthrough();

export const brandTaxonomySchema = z.object({
  brand_id: z.string(),
  source: z.object({
    site_url: z.string(),
    timestamp: z.string(),
    pages_sampled: z.number(),
  }).passthrough(),
  color: z.object({
    palette: z.array(extractedFieldSchema(colorPaletteEntrySchema)),
    tokens_detected: z.boolean(),
  }).optional(),
  typography: z.object({
    font_families: z.array(extractedFieldSchema(typographyEntrySchema)),
    type_scale: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
  assets: z.object({
    logos: z.array(extractedFieldSchema(assetEntrySchema)).optional(),
    favicons: z.array(extractedFieldSchema(assetEntrySchema)).optional(),
    og_images: z.array(extractedFieldSchema(assetEntrySchema)).optional(),
  }).optional(),
  design_tokens: z.object({
    tokens: z.array(z.unknown()),
    source_count: z.number(),
  }).optional(),
  identity: z.object({
    tagline: z.string().optional(),
    industry_guess: z.string().optional(),
  }).optional(),
  governance: z.object({
    robots_respected: z.boolean().optional(),
    license_hints: z.array(z.string()).optional(),
  }).optional(),
  meta: z.object({
    extraction_version: z.string(),
    stages_completed: z.array(z.string()),
    stages_failed: z.array(z.string()),
    errors: z.array(z.object({
      code: z.string(),
      message: z.string(),
      stage: z.string(),
    })),
    summary: z.object({
      fields_populated: z.number(),
      low_confidence_count: z.number(),
      duration_ms: z.number(),
    }),
  }),
}).passthrough();
```

### Defensive Parsing in UI
```typescript
// Pattern for SCHM-03: fallback when result fails to parse
const parsed = brandTaxonomySchema.safeParse(data.result);
if (!parsed.success) {
  // Show fallback with download link
  return (
    <div>
      <p>We extracted brand data but could not display it.</p>
      {data.brand_json_url && (
        <a href={data.brand_json_url} download="brand.json">
          Download Brand JSON
        </a>
      )}
    </div>
  );
}
// Otherwise render gallery with parsed.data
```

### UI Component Access Pattern Update
```typescript
// OLD (flat): color.hex, color.confidence
// NEW (wrapped): entry.value.hex, entry.confidence

// ColorPaletteCard -- old
colors.map(color => ({ hex: color.hex, confidence: color.confidence }))

// ColorPaletteCard -- new
palette.map(entry => ({ hex: entry.value.hex, confidence: entry.confidence }))
```

## Job Status Schema Update

The `jobStatusSchema` in `types.ts` also needs updating. The real API response from the scraper service (per `src/api/routes/jobs.ts`) returns:

```typescript
{
  job_id: string,
  site_url: string,
  status: "queued" | "processing" | "succeeded" | "failed" | "partial",
  created_at: string,
  started_at: string | null,
  completed_at: string | null,
  result: Record<string, unknown> | null,  // This is the BrandTaxonomy
  error: { code, message, stage } | null,
  pipeline_meta: { stages?, pages_sampled?, duration_ms? } | null,
  brand_json_url: string | null,
  assets_zip_url: string | null,
  webhook_status: string | null,
}
```

The current `jobStatusSchema` is close but uses `error: z.string().nullish()` instead of the real `{ code, message, stage }` object. This should also be updated (but with `.passthrough()` to avoid breaking on extras).

## Open Questions

1. **Should `FeaturedBuildingBlocks` keep showing the full tutorial grid or just show a CTA?**
   - What we know: HOME-06 says "existing Building Blocks teaser" which could mean the tutorial cards
   - The BlogTeaser component has a simple CTA-style layout without cards
   - Recommendation: Create a CTA section with the specified title/subtitle, plus a condensed version of the building blocks (maybe 3 featured tutorials) or just buttons. Let the planner decide based on the "existing Building Blocks teaser" phrasing.

2. **Should the `src/lib/github.ts` file be cleaned up?**
   - What we know: It exports `fetchAllProjects`, `fetchProjectBySlug`, `fetchReadme` -- all used only by the projects pages and home page FeaturedProjects
   - If no other code uses these functions, the file could be cleaned up or removed
   - Recommendation: Check if `src/lib/github.ts` exports are used by anything other than the project-related files being deleted. If not, it can be cleaned up but this is optional since dead code is harmless.

3. **Should `src/data/projects.json` be removed?**
   - What we know: It is imported by `src/lib/github.ts`
   - If github.ts is cleaned up, projects.json becomes dead data
   - Recommendation: Low priority, can be deferred. The redirect handles all user-facing concerns.

## Sources

### Primary (HIGH confidence)
- `src/components/layout/NavLinks.tsx` -- Current nav configuration, admin-only Control Center logic (READ directly)
- `src/app/page.tsx` -- Current home page structure (READ directly)
- `src/components/home/*.tsx` -- All 5 home components inspected (READ directly)
- `src/data/apps.ts` -- Apps data source and `AppListing` interface (READ directly)
- `src/components/apps/AppCard.tsx` -- Existing app card component (READ directly)
- `src/lib/brand-scraper/types.ts` -- Current (wrong) Zod schemas (READ directly)
- `brand-scraper/src/schema/taxonomy.ts` -- Real taxonomy contract from scraper service (READ directly)
- `brand-scraper/output/brand.json` -- Real scraper output (3M.com scrape) (READ directly)
- `brand-scraper/src/api/routes/jobs.ts` -- Real job response shape (READ directly)
- `brand-scraper/src/pipeline/assemble/assembler.ts` -- How taxonomy is built (READ directly)
- `src/components/admin/brand-scraper/*.tsx` -- All 4 gallery components inspected (READ directly)
- `next.config.ts` -- Existing redirect pattern (READ directly)
- `src/app/not-found.tsx` -- 404 page navigation links (READ directly)
- `src/app/sitemap.ts` -- Sitemap project references (READ directly)
- `src/components/ui/Button.tsx` -- Button variants and styling (READ directly)

### Secondary (MEDIUM confidence)
- Grep of `/projects` across `src/` -- Complete reference list (VERIFIED)
- `.planning/REQUIREMENTS.md` -- Phase 27 requirement details (READ directly)

### Tertiary (LOW confidence)
- None. All findings are from direct source code inspection.

## Metadata

**Confidence breakdown:**
- Navigation changes: HIGH -- Direct inspection of NavLinks.tsx, all references grepped
- Home page changes: HIGH -- Direct inspection of page.tsx and all home components
- Schema alignment: HIGH -- Read real taxonomy schema AND a real output file from scraper service
- UI component updates: HIGH -- Read all 4 gallery components and mapped old vs new paths
- Redirect mechanism: HIGH -- Existing pattern already in next.config.ts

**Research date:** 2026-02-10
**Valid until:** 60 days (stable codebase, no fast-moving dependencies)
