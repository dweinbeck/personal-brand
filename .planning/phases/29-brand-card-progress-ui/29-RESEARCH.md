# Phase 29: Brand Card + Progress UI - Research

**Researched:** 2026-02-10
**Domain:** React UI components, real-time polling progress, dynamic font loading, Next.js API proxy routes
**Confidence:** HIGH

## Summary

Phase 29 builds on Phases 27 (schema alignment) and 28 (enriched backend API) to deliver two major UI features in the main site: (1) a live progress display showing "Pages being scraped" and "Files saved" lists during job execution, and (2) a polished Brand Card that replaces the current 2x2 results gallery with a single wide card showing favicon+hostname header, logos, color palette swatches, a description rendered in the extracted font, and download buttons.

The existing codebase already has the polling infrastructure (SWR-based `useJobStatus` hook polling every 3s), Zod schemas matching the scraper service taxonomy (with ExtractedField wrappers and `.passthrough()`), and UI components for individual result sections (ColorPaletteCard, TypographyCard, LogoAssetsCard). Phase 29 replaces the `BrandResultsGallery` (2x2 grid of Cards) with a new `BrandCard` component and adds a `ScrapeProgressPanel` that reads `pipeline_meta.events` from the polling response.

The backend (Phase 28) now returns enriched job responses including `pipeline_meta.events` (array of progress events with types like `page_started`, `page_done`, `asset_saved`, `asset_failed`) and `assets_manifest` (with per-asset signed URLs). A new proxy route is needed for the on-demand zip endpoint (`POST /jobs/:id/assets/zip`) with authentication gating.

**Primary recommendation:** Extend the existing `jobStatusSchema` Zod type to include `pipeline_meta` and `assets_manifest` fields. Build the progress panel as a new component reading events from the poll data. Build the Brand Card as a single wide component with sections for browser-tab header, logos, colors, description, and download buttons. Use the CSS Font Loading API (`FontFace` constructor + `document.fonts.add()`) for best-effort dynamic font loading. Add an authenticated proxy route at `/api/tools/brand-scraper/jobs/[id]/assets/zip`.

## Standard Stack

### Core (Already in use -- no new dependencies needed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| react | ^19.2.3 | UI framework | Existing |
| next | 16.1.6 | App Router, API routes | Existing |
| swr | ^2.4.0 | Polling hook for job status | Existing |
| zod | ^4.3.6 | Schema validation for API responses | Existing |
| tailwindcss | ^4 | Styling | Existing |
| clsx | ^2.1.1 | Conditional class names | Existing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS Font Loading API | Browser native | Dynamic font loading for CARD-05 | Load extracted font at runtime |
| Google Fonts CSS2 API | Web API | Font source URL construction | Fetch font files for extracted Google Fonts |

### No New Dependencies
All Phase 29 requirements can be met with existing dependencies plus browser-native APIs:
- **SWR** already handles polling (3s interval, terminal state detection)
- **Zod** already validates API responses with `.passthrough()` for forward-compatibility
- **CSS Font Loading API** is natively available in all modern browsers (Chrome 35+, Firefox 41+, Safari 10+)
- **Google Fonts CSS2 API** is a free web API for font file URLs

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Font Loading API | `@fontsource/*` packages | Would require installing a package per font; runtime loading better for unknown fonts |
| CSS Font Loading API | Injecting `<link>` tag to Google Fonts | Simpler but no load-complete callback; may cause FOUT |
| Polling (SWR) | SSE/EventSource | Would require new backend endpoint; polling already works with 3s interval |

## Architecture Patterns

### Recommended File Structure
```
src/
  components/
    tools/
      brand-scraper/
        UserBrandScraperPage.tsx    # MODIFY: wire progress panel + brand card
        ScrapeProgressPanel.tsx     # NEW: live progress display during job execution
        BrandCard.tsx               # NEW: single wide card replacing BrandResultsGallery
        BrandCardHeader.tsx         # NEW: browser-tab header with favicon + hostname
        BrandCardLogos.tsx          # NEW: logos section within brand card
        BrandCardColors.tsx         # NEW: color palette swatches with hex values
        BrandCardDescription.tsx    # NEW: description area rendered in extracted font
        BrandCardDownloads.tsx      # NEW: download buttons (JSON + ZIP)
  lib/
    brand-scraper/
      types.ts                     # MODIFY: extend jobStatusSchema with pipeline_meta + assets_manifest
      hooks.ts                     # EXISTING: useJobStatus hook (no changes needed)
      fonts.ts                     # NEW: dynamic font loading utility
  app/
    api/
      tools/
        brand-scraper/
          jobs/[id]/
            assets/
              zip/
                route.ts           # NEW: authenticated proxy for on-demand zip
```

### Pattern 1: Progress Events from Polling Data
**What:** Read `pipeline_meta.events` from the existing SWR polling response to build live progress lists.
**When to use:** During job execution (status is `queued` or `processing`).
**Why not SSE:** The backend already persists events to JSONB and the frontend already polls every 3 seconds via SWR. Adding SSE would require a new backend endpoint, connection management, and reconnection logic for marginal benefit (~3s vs real-time). SWR polling is simpler and already battle-tested in this codebase.

```typescript
// In ScrapeProgressPanel.tsx
// Events come from the existing polling response
type ProgressEvent = {
  type: string;
  timestamp: string;
  detail?: Record<string, unknown>;
};

function ScrapeProgressPanel({ events }: { events: ProgressEvent[] }) {
  // Derive "Pages being scraped" from page_started/page_done events
  const pageEvents = events.filter(e => e.type === "page_started" || e.type === "page_done");
  const pagesInProgress = /* pages with page_started but no page_done */;
  const pagesCompleted = /* pages with page_done */;

  // Derive "Files saved" from asset_saved events
  const assetsSaved = events.filter(e => e.type === "asset_saved");

  return (
    <div>
      <section>
        <h3>Pages being scraped</h3>
        <ul>{/* List pages with status indicators */}</ul>
      </section>
      <section>
        <h3>Files saved</h3>
        <ul>{/* List saved asset filenames */}</ul>
      </section>
    </div>
  );
}
```

### Pattern 2: Brand Card as Single Wide Component
**What:** Replace the 2x2 gallery grid with a single full-width card containing all brand identity sections.
**When to use:** When job status is `succeeded` or `partial` and result passes safeParse.

```typescript
// BrandCard layout concept (single wide card)
function BrandCard({ result, brandJsonUrl, assetsZipUrl, jobId, token }: BrandCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] overflow-hidden">
      {/* Browser-tab header: favicon + hostname */}
      <BrandCardHeader favicon={firstFavicon} hostname={hostname} />

      {/* Content sections */}
      <div className="p-6 space-y-6">
        {/* Logos row */}
        <BrandCardLogos logos={result.assets?.logos} />

        {/* Color palette swatches */}
        <BrandCardColors palette={result.color?.palette} />

        {/* Description in extracted font */}
        <BrandCardDescription
          identity={result.identity}
          primaryFont={primaryFontFamily}
        />

        {/* Download buttons bottom-right */}
        <div className="flex justify-end gap-3">
          <BrandCardDownloads
            brandJsonUrl={brandJsonUrl}
            jobId={jobId}
            token={token}
          />
        </div>
      </div>
    </div>
  );
}
```

### Pattern 3: Browser-Tab Header (CARD-02)
**What:** A fake browser tab showing favicon + hostname, visually resembling a browser's address bar/tab.
**When to use:** Top of the Brand Card.

```typescript
function BrandCardHeader({ favicon, hostname }: { favicon?: string; hostname: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b border-border rounded-t-2xl">
      {/* Fake browser dots */}
      <div className="flex gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <span className="w-3 h-3 rounded-full bg-emerald-400" />
      </div>
      {/* Tab content */}
      <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-white rounded-t-lg border border-b-0 border-border">
        {favicon && (
          <img src={favicon} alt="" className="w-4 h-4" />
        )}
        <span className="text-sm text-text-secondary truncate">{hostname}</span>
      </div>
    </div>
  );
}
```

### Pattern 4: Dynamic Font Loading (CARD-05)
**What:** Load the extracted primary font-family at runtime using the CSS Font Loading API, rendering the description area in that font with a fallback.
**When to use:** When the brand taxonomy includes `typography.font_families` with a `source: "google_fonts"` entry.

```typescript
// src/lib/brand-scraper/fonts.ts
export async function loadGoogleFont(family: string, weight = "400"): Promise<boolean> {
  // Construct Google Fonts CSS2 URL
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;

  try {
    // Fetch the CSS to extract the actual font file URL
    const cssResponse = await fetch(url);
    if (!cssResponse.ok) return false;

    const css = await cssResponse.text();
    // Extract woff2 URL from @font-face rule
    const woff2Match = css.match(/url\(([^)]+\.woff2[^)]*)\)/);
    if (!woff2Match) return false;

    const fontUrl = woff2Match[1];
    const fontFace = new FontFace(family, `url(${fontUrl})`, { weight });
    await fontFace.load();
    document.fonts.add(fontFace);
    return true;
  } catch {
    return false;  // Best-effort: fall back to sans-serif
  }
}
```

**Key considerations:**
- CARD-05 says "best-effort" -- font loading failure is non-fatal
- Only attempt loading for `source: "google_fonts"` fonts (system fonts like Arial don't need loading)
- Show a CSS transition when font loads to avoid jarring text shift
- Use React `useEffect` + `useState` to track loading state

### Pattern 5: Authenticated Zip Proxy Route (ASST-05)
**What:** A Next.js API route that proxies the scraper service's `POST /jobs/:id/assets/zip` endpoint with authentication.
**When to use:** When user clicks "Download Assets" button.

```typescript
// src/app/api/tools/brand-scraper/jobs/[id]/assets/zip/route.ts
import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { id } = await params;
  const BRAND_SCRAPER_API_URL = process.env.BRAND_SCRAPER_API_URL;

  const res = await fetch(`${BRAND_SCRAPER_API_URL}/jobs/${id}/assets/zip`, {
    method: "POST",
    signal: AbortSignal.timeout(60_000),  // Zip creation can take time
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return Response.json(
      { error: body?.error ?? `Zip creation failed (${res.status})` },
      { status: res.status },
    );
  }

  return Response.json(await res.json());
}
```

### Anti-Patterns to Avoid
- **SSE for progress when polling already works:** Adding EventSource adds complexity (connection management, reconnection, new backend endpoint) for ~3s improvement. The 3s SWR poll is already implemented and tested.
- **Storing signed URLs in state:** Signed URLs expire. Always use fresh URLs from the latest poll response.
- **Loading arbitrary fonts from untrusted sources:** Only load from Google Fonts CSS2 API. System fonts (Arial, Helvetica, etc.) don't need loading.
- **Blocking render on font loading:** The description area should render immediately with a fallback font, then transition when the custom font loads.
- **Keeping the 2x2 gallery AND adding a Brand Card:** CARD-01 says "replaces" -- the old gallery must be removed (or at minimum not used by the user-facing page).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading | Custom `<link>` injection | CSS Font Loading API (`FontFace`) | Native API with load callbacks, no layout shift guessing |
| Polling | Custom `setInterval` + fetch | SWR `refreshInterval` (already in use) | Handles dedup, caching, error retry, focus revalidation |
| URL parsing | Regex for hostname extraction | `new URL(siteUrl).hostname` | Handles all edge cases (ports, paths, IDN) |
| Color contrast check | Manual luminance calculation | Inline `style` with white/dark text | Simple hex-based light/dark detection sufficient for swatches |
| Zip download | Custom blob handling | Browser-native `<a download>` with signed URL | Signed URL is a direct download link |

**Key insight:** This phase is primarily a UI composition task. The data pipeline (polling, schema validation, API proxying) is already established. The novelty is in the visual design (Brand Card, browser-tab header, font loading) not the data flow.

## Common Pitfalls

### Pitfall 1: Extending jobStatusSchema Without Breaking Existing Consumers
**What goes wrong:** Adding required fields to `jobStatusSchema` causes safeParse to fail for jobs created before Phase 28 (which don't have `pipeline_meta.events` or `assets_manifest`).
**Why it happens:** Old jobs in the DB won't have the new fields.
**How to avoid:** All new fields must be optional/nullish in the Zod schema. Use `.optional()` or `.nullish()` for `pipeline_meta` and `assets_manifest`. The existing schema already uses `.passthrough()` which tolerates unknown fields, but we also need to handle MISSING fields.
**Warning signs:** safeParse failures for completed jobs.

### Pitfall 2: Font Loading Race Condition
**What goes wrong:** The description text renders in the fallback font, then snaps to the custom font causing a visible text shift.
**Why it happens:** Font loading is async; React renders before the font is ready.
**How to avoid:** Use a CSS transition on the font-family change. Track loading state with useState and conditionally apply the font-family style only after loading completes. Use `opacity` or a subtle transition to smooth the change.
**Warning signs:** Visible text snap/reflow when font loads.

### Pitfall 3: Missing Favicon in Brand Card Header
**What goes wrong:** The browser-tab header shows no favicon because the taxonomy may not have any favicons, or the signed URL may have expired.
**Why it happens:** Not all sites have favicons; signed URLs from the poll response may expire between polls.
**How to avoid:** Make favicon display conditional. Fall back to a generic globe/world icon. Use the favicon from the latest poll response (which has fresh signed URLs).
**Warning signs:** Broken image icon in the header.

### Pitfall 4: Download Assets Button Before Zip Exists
**What goes wrong:** User clicks "Download Assets" and the UI hangs or shows no feedback.
**Why it happens:** The zip doesn't exist until the proxy route creates it on-demand. First request can take several seconds.
**How to avoid:** Show a loading state on the button ("Preparing download..."), make the POST request, then redirect to the signed URL on success.
**Warning signs:** Button appears to do nothing on first click.

### Pitfall 5: Progress Panel Showing Stale Events After New Scrape
**What goes wrong:** After completing one scrape and starting another, the progress panel briefly shows events from the previous job.
**Why it happens:** SWR cache retains previous job data until the new job's first poll returns.
**How to avoid:** The existing `reset()` function in useJobStatus resets state. Ensure the progress panel checks `jobId` matches and clears when a new scrape starts. The existing `handleNewScrape` already calls `reset()`.
**Warning signs:** Events from previous URL appearing for new scrape.

### Pitfall 6: Assets Manifest snake_case vs camelCase
**What goes wrong:** Frontend code accesses `asset.originalUrl` but the API returns `asset.original_url`.
**Why it happens:** Phase 28-04 decided that the assets manifest API response uses snake_case field names (original_url, content_type, size_bytes, gcs_object_path) mapped from camelCase DB columns.
**How to avoid:** Use snake_case field names in the frontend Zod schema for assets_manifest. Read the 28-04 summary carefully.
**Warning signs:** TypeScript errors or undefined values when accessing manifest fields.

## Code Examples

### Extending jobStatusSchema for Phase 29
```typescript
// Source: existing src/lib/brand-scraper/types.ts pattern + Phase 28 API response
const progressEventSchema = z
  .object({
    type: z.string(),
    timestamp: z.string(),
    detail: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const pipelineMetaSchema = z
  .object({
    stages: z.array(z.object({
      stage: z.string(),
      status: z.string(),
      duration_ms: z.number(),
    })).optional(),
    pages_sampled: z.number().optional(),
    duration_ms: z.number().optional(),
    events: z.array(progressEventSchema).optional(),
  })
  .passthrough();

const assetManifestEntrySchema = z
  .object({
    category: z.string(),
    filename: z.string(),
    original_url: z.string(),          // snake_case per 28-04
    content_type: z.string(),          // snake_case per 28-04
    size_bytes: z.number(),            // snake_case per 28-04
    gcs_object_path: z.string(),       // snake_case per 28-04
    signed_url: z.string().optional(), // may be absent if generation failed
  })
  .passthrough();

const assetsManifestSchema = z
  .object({
    assets: z.array(assetManifestEntrySchema),
    total_count: z.number(),          // snake_case per 28-04
    total_size_bytes: z.number(),     // snake_case per 28-04
    created_at: z.string(),           // snake_case per 28-04
  })
  .passthrough();

// Updated jobStatusSchema
export const jobStatusSchema = z
  .object({
    job_id: z.string(),
    status: z.string(),
    result: brandTaxonomySchema.nullish(),
    error: jobErrorSchema.nullish(),
    brand_json_url: z.string().nullish(),
    assets_zip_url: z.string().nullish(),
    pipeline_meta: pipelineMetaSchema.nullish(),     // NEW
    assets_manifest: assetsManifestSchema.nullish(),  // NEW
  })
  .passthrough();
```

### Deriving Progress Lists from Events
```typescript
// Source: codebase pattern analysis
type PageProgress = {
  url: string;
  isHomepage: boolean;
  status: "scraping" | "done" | "failed";
  duration_ms?: number;
};

function derivePageProgress(events: ProgressEvent[]): PageProgress[] {
  const pages = new Map<string, PageProgress>();

  for (const event of events) {
    const url = event.detail?.url as string | undefined;
    if (!url) continue;

    if (event.type === "page_started") {
      pages.set(url, {
        url,
        isHomepage: Boolean(event.detail?.isHomepage),
        status: "scraping",
      });
    } else if (event.type === "page_done") {
      const existing = pages.get(url);
      if (existing) {
        existing.status = event.detail?.failed ? "failed" : "done";
        existing.duration_ms = event.detail?.duration_ms as number | undefined;
      }
    }
  }

  return Array.from(pages.values());
}

type SavedFile = {
  filename: string;
  sizeBytes: number;
};

function deriveSavedFiles(events: ProgressEvent[]): SavedFile[] {
  return events
    .filter(e => e.type === "asset_saved")
    .map(e => ({
      filename: e.detail?.filename as string ?? "unknown",
      sizeBytes: e.detail?.sizeBytes as number ?? 0,
    }));
}
```

### Dynamic Google Fonts Loading Hook
```typescript
// Source: MDN CSS Font Loading API + Google Fonts CSS2 API
import { useEffect, useState } from "react";

export function useGoogleFont(family: string | null, weight = "400"): {
  loaded: boolean;
  error: boolean;
} {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!family) return;

    let cancelled = false;

    async function loadFont() {
      try {
        // Check if font is already available
        if (document.fonts.check(`16px "${family}"`)) {
          if (!cancelled) setLoaded(true);
          return;
        }

        // Fetch Google Fonts CSS to get the woff2 URL
        const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Font CSS fetch failed");

        const css = await response.text();
        const woff2Match = css.match(/url\(([^)]+\.woff2[^)]*)\)/);
        if (!woff2Match) throw new Error("No woff2 URL found in CSS");

        const fontFace = new FontFace(family, `url(${woff2Match[1]})`, {
          weight,
          display: "swap",
        });
        await fontFace.load();
        document.fonts.add(fontFace);

        if (!cancelled) setLoaded(true);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    loadFont();
    return () => { cancelled = true; };
  }, [family, weight]);

  return { loaded, error };
}
```

### Zip Download with Loading State
```typescript
// Source: codebase pattern analysis (api proxy + button state)
async function handleDownloadZip(
  jobId: string,
  token: string,
  setDownloading: (v: boolean) => void,
) {
  setDownloading(true);
  try {
    const res = await fetch(`/api/tools/brand-scraper/jobs/${jobId}/assets/zip`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Zip creation failed");
    const { zip_url } = await res.json();
    // Trigger download via temporary anchor
    const a = document.createElement("a");
    a.href = zip_url;
    a.download = "assets.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    // Show error state
  } finally {
    setDownloading(false);
  }
}
```

## Existing Code to Modify vs Create

### Files to MODIFY
| File | Changes | Confidence |
|------|---------|------------|
| `src/lib/brand-scraper/types.ts` | Add `pipelineMetaSchema`, `assetsManifestSchema`, extend `jobStatusSchema` | HIGH |
| `src/components/tools/brand-scraper/UserBrandScraperPage.tsx` | Replace `BrandResultsGallery` with `BrandCard`, add `ScrapeProgressPanel`, wire events | HIGH |

### Files to CREATE
| File | Purpose | Confidence |
|------|---------|------------|
| `src/components/tools/brand-scraper/ScrapeProgressPanel.tsx` | Live progress display (pages + files) | HIGH |
| `src/components/tools/brand-scraper/BrandCard.tsx` | Main Brand Card container | HIGH |
| `src/components/tools/brand-scraper/BrandCardHeader.tsx` | Browser-tab header with favicon + hostname | HIGH |
| `src/components/tools/brand-scraper/BrandCardLogos.tsx` | Logos section | HIGH |
| `src/components/tools/brand-scraper/BrandCardColors.tsx` | Color palette swatches | HIGH |
| `src/components/tools/brand-scraper/BrandCardDescription.tsx` | Description area with dynamic font | HIGH |
| `src/components/tools/brand-scraper/BrandCardDownloads.tsx` | Download buttons (JSON + ZIP) | HIGH |
| `src/lib/brand-scraper/fonts.ts` | Dynamic font loading utility + hook | HIGH |
| `src/app/api/tools/brand-scraper/jobs/[id]/assets/zip/route.ts` | Auth proxy for zip endpoint | HIGH |

### Files to LEAVE ALONE
| File | Reason |
|------|--------|
| `src/components/admin/brand-scraper/*` | Admin components stay as-is; Phase 29 is user-facing |
| `src/lib/brand-scraper/hooks.ts` | Polling hook already works; no changes needed |
| `src/lib/brand-scraper/client.ts` | Server-side proxy client unchanged |
| `src/app/api/tools/brand-scraper/scrape/route.ts` | Scrape submission unchanged |
| `src/app/api/tools/brand-scraper/jobs/[id]/route.ts` | Job status proxy unchanged (passthrough already passes new fields) |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 2x2 Card gallery | Single wide Brand Card | Phase 29 (now) | Richer display, matches modern brand kit tools |
| Simple status dot | Live progress lists | Phase 29 (now) | Users see what's happening during the 30-60s scrape |
| Direct signed URL downloads | On-demand zip via proxy | Phase 28/29 | ZIP created only when requested, auth-gated |
| Static font display | Dynamic font rendering | Phase 29 (now) | Brand description previewed in actual font |

## Data Flow Summary

```
User clicks "Scrape" → POST /api/tools/brand-scraper/scrape → backend creates job
  ↓
SWR polls GET /api/tools/brand-scraper/jobs/{id} every 3s
  ↓
Backend returns: { status, pipeline_meta: { events: [...] }, result, assets_manifest, brand_json_url }
  ↓
While status is queued/processing:
  → ScrapeProgressPanel reads pipeline_meta.events
  → Derives "Pages being scraped" from page_started/page_done events
  → Derives "Files saved" from asset_saved events
  ↓
When status is succeeded/partial:
  → brandTaxonomySchema.safeParse(data.result)
  → If valid: render BrandCard with parsed result + assets_manifest signed URLs
  → If invalid: fallback download UI (already exists)
  ↓
User clicks "Download Assets":
  → POST /api/tools/brand-scraper/jobs/{id}/assets/zip (auth proxy)
  → Backend creates zip on demand, returns signed URL
  → Browser initiates download
```

## API Response Shape (What Frontend Receives)

Based on Phase 28 implementation, `GET /api/tools/brand-scraper/jobs/{id}` returns:

```json
{
  "job_id": "abc123",
  "status": "processing",
  "result": null,
  "error": null,
  "brand_json_url": null,
  "assets_zip_url": null,
  "pipeline_meta": {
    "stages": [],
    "pages_sampled": 3,
    "duration_ms": null,
    "events": [
      { "type": "pipeline_started", "timestamp": "...", "detail": { "siteUrl": "https://example.com" } },
      { "type": "page_started", "timestamp": "...", "detail": { "url": "https://example.com", "isHomepage": true } },
      { "type": "page_done", "timestamp": "...", "detail": { "url": "https://example.com", "isHomepage": true, "duration_ms": 3200 } },
      { "type": "asset_saved", "timestamp": "...", "detail": { "filename": "logos/primary.svg", "sizeBytes": 4521 } }
    ]
  },
  "assets_manifest": {
    "assets": [
      {
        "category": "logos",
        "filename": "primary.svg",
        "original_url": "https://example.com/logo.svg",
        "content_type": "image/svg+xml",
        "size_bytes": 4521,
        "gcs_object_path": "jobs/abc123/assets/logos/primary.svg",
        "signed_url": "https://storage.googleapis.com/..."
      }
    ],
    "total_count": 5,
    "total_size_bytes": 125000,
    "created_at": "2026-02-10T12:00:00Z"
  },
  "usageId": "usage_xyz"
}
```

Note: The main site proxy route (`/api/tools/brand-scraper/jobs/[id]/route.ts`) does `Response.json({ ...job, usageId: usage?.id ?? null })` which passes through ALL backend fields including the new `pipeline_meta` and `assets_manifest`. No proxy route changes needed.

## Open Questions

1. **Should the Brand Card description use `identity.tagline` or a generated description?**
   - What we know: The taxonomy has `identity.tagline` and `identity.industry_guess` (both optional). There's no "description" field per se.
   - What's unclear: What text to render in the extracted font.
   - Recommendation: Use the tagline if available, otherwise show the industry guess. If neither exists, show the site URL in the extracted font as a typography preview.

2. **Should non-Google fonts be handled (e.g., system fonts, self-hosted fonts)?**
   - What we know: The taxonomy includes `typography.font_families[].value.source` which can be `google_fonts`, `local`, or other values. Only Google Fonts can be loaded dynamically via the CSS2 API.
   - What's unclear: Whether to attempt loading for non-Google fonts.
   - Recommendation: Only attempt dynamic loading for `source === "google_fonts"`. For system fonts (Arial, Helvetica, etc.), apply them directly in the style prop. For other sources, fall back to sans-serif with a note.

3. **Should the admin Brand Scraper page also get the new Brand Card?**
   - What we know: Requirements only specify user-facing changes. Admin page has its own component set.
   - Recommendation: Leave admin page as-is. Phase 29 is user-facing only. Admin can be updated in a future phase if desired.

4. **Should the progress panel persist after job completion or transition to the Brand Card?**
   - What we know: Requirements say "while a scrape job is running" for progress, and "on completion" for Brand Card.
   - Recommendation: Show progress panel during processing, then transition to Brand Card when terminal. Optionally keep a collapsed "Scrape Details" section with timing info.

## Sources

### Primary (HIGH confidence)
- `src/lib/brand-scraper/types.ts` - Current Zod schemas with ExtractedField wrappers
- `src/lib/brand-scraper/hooks.ts` - SWR polling hook (3s interval, 100 poll max)
- `src/components/tools/brand-scraper/UserBrandScraperPage.tsx` - Current user page structure
- `src/components/admin/brand-scraper/BrandResultsGallery.tsx` - Current 2x2 gallery (to be replaced)
- `src/components/admin/brand-scraper/ColorPaletteCard.tsx` - Existing color swatch pattern
- `src/components/admin/brand-scraper/LogoAssetsCard.tsx` - Existing logo display pattern
- `src/app/api/tools/brand-scraper/jobs/[id]/route.ts` - Current proxy route (passthrough)
- `.planning/phases/28-scraper-service-backend/28-02-SUMMARY.md` - Events implementation details
- `.planning/phases/28-scraper-service-backend/28-04-SUMMARY.md` - API response shape + snake_case decision
- `.planning/phases/27-apps-first-home-schema-alignment/27-03-SUMMARY.md` - Schema alignment details

### Secondary (MEDIUM confidence)
- [MDN CSS Font Loading API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API) - FontFace constructor, document.fonts.add()
- [Google Fonts CSS2 API](https://developers.google.com/fonts/docs/css2) - URL format for font loading

### Tertiary (LOW confidence)
- None -- all findings verified with primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies needed
- Architecture: HIGH - Full codebase read, clear mapping from backend API to frontend components
- Data flow: HIGH - Verified proxy passthrough, schema compatibility, polling hook behavior
- Font loading: MEDIUM - CSS Font Loading API is well-documented; Google Fonts CSS2 parsing needs runtime testing
- Pitfalls: HIGH - Based on direct analysis of existing code and Phase 28 decisions

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (stable stack, Phase 28 API response locked)
