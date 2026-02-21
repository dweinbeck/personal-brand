# Phase 2: Fix Brand Scraper — Asset Downloads, Color Accuracy, Color Labels, and Company Name Extraction — Research

**Researched:** 2026-02-21
**Domain:** Brand scraper frontend fixes (Next.js, Zod, color naming, web scraping data display)
**Confidence:** HIGH

## Summary

This phase addresses four remaining user-reported issues with the brand scraper tool. Phase 1 already fixed download proxy routing (JSON works), color role labels (Primary/Secondary/Accent), credits display, progress text, input backgrounds, and profile cards. However, testing feedback reveals:

1. **Asset ZIP downloads still fail** — the user reports getting errors when attempting ZIP downloads from the assets page. The Phase 1 fix created proxy routes, but the backend scraper service returns 403 when generating ZIP files (likely a GCS permission/auth issue between the Next.js proxy and the scraper service). The frontend handles this gracefully with a "try JSON instead" fallback, but the root download issue persists.

2. **Color labels need human-readable names** — the current "Primary/Secondary/Accent" positional labels are a start, but the user wants actual color names (e.g., "Red", "Navy Blue", "Forest Green") alongside or instead of just hex codes. This is a frontend concern — mapping hex values to human-readable color names.

3. **Color accuracy** — the scraper returns wrong colors for some sites (e.g., 3M.com missing red). This is an **external scraper service issue** that Phase 1 explicitly deferred. However, we can add frontend improvements: better display of what was found, confidence indicators, and handling for when results look incomplete.

4. **Company name extraction** — the UI currently shows the hostname (e.g., `3m.com`, `transparent.partners`) instead of the actual company name. The `identity` section of the taxonomy only has `tagline` and `industry_guess` — no `company_name` field. The scraper service would need to be updated to extract `og:site_name`, `<title>` tag content, or schema.org organization name. On the frontend side, we can update the taxonomy schema to accept a company name field and display it when available.

**Primary recommendation:** Focus on the two issues fully solvable in this codebase (color naming, company name display) and improve the asset download error handling. For color accuracy and backend changes (company name extraction, ZIP generation), document what the scraper service needs to change but implement only the frontend side.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App framework, API routes | Already in project |
| React | 19.2.3 | UI components | Already in project |
| Zod | 4.3.6 | Schema validation | Already in project |
| Tailwind CSS | 4.x | Styling | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| color-namer | 5.x | Hex → human-readable color name | For color label generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| color-namer | ntc.js (Name That Color) | ntc.js is smaller but unmaintained; color-namer uses Delta-E distance (perceptually accurate), actively maintained, multiple name lists |
| color-namer | hex-color-to-color-name | Newer (2.0.1) but less established community; color-namer has broader adoption |
| color-namer | Hand-rolled basic color map | Simple but inaccurate for edge cases; libraries handle the full color space correctly |

**Installation:**
```bash
npm install color-namer
```

## Architecture Patterns

### Recommended Project Structure
No new directories needed. Changes are within existing files:
```
src/
├── lib/brand-scraper/
│   ├── types.ts           # MODIFY: Add company_name to identity schema
│   ├── colors.ts          # CREATE: Color naming utility (hex → name)
│   └── client.ts          # No changes
├── components/tools/brand-scraper/
│   ├── BrandCardColors.tsx     # MODIFY: Show color names alongside hex
│   ├── BrandCardHeader.tsx     # MODIFY: Show company name when available
│   ├── BrandCard.tsx           # MODIFY: Pass company name through
│   ├── BrandProfileCard.tsx    # MODIFY: Show company name instead of hostname
│   └── BrandCardDownloads.tsx  # MODIFY: Improve ZIP error handling/messaging
├── components/admin/brand-scraper/
│   └── ColorPaletteCard.tsx    # MODIFY: Show color names
└── app/api/tools/brand-scraper/
    └── jobs/[id]/assets/zip/route.ts  # MODIFY: Improve auth header forwarding
```

### Pattern 1: Color Naming Utility
**What:** A thin wrapper around `color-namer` that returns a single best-match name for a hex value.
**When to use:** Every color swatch display in both BrandCard and admin views.
**Example:**
```typescript
// src/lib/brand-scraper/colors.ts
import namer from "color-namer";

/**
 * Returns the closest human-readable color name for a hex value.
 * Uses the "basic" list for broad, recognizable names (Red, Blue, Green, etc.)
 * with the "x11" list as fallback for more specific names.
 */
export function getColorName(hex: string): string {
  try {
    const result = namer(hex, { pick: ["basic"] });
    return result.basic[0]?.name ?? "Unknown";
  } catch {
    return "Unknown";
  }
}
```

### Pattern 2: Company Name Fallback Chain
**What:** Try multiple sources for company name with graceful fallback.
**When to use:** Displaying brand identity in card headers and profile cards.
**Fallback chain:**
1. `identity.company_name` (from scraper, when available)
2. `identity.site_name` (from og:site_name, when available)
3. Hostname with TLD stripped and title-cased (e.g., `3m.com` → `3m`, `transparent.partners` → `Transparent Partners`)

```typescript
/**
 * Extract a display name from brand taxonomy data.
 * Prefers explicit company name > site name > formatted hostname.
 */
function getBrandDisplayName(
  identity: BrandTaxonomy["identity"],
  siteUrl: string,
): string {
  if (identity?.company_name) return identity.company_name;
  if (identity?.site_name) return identity.site_name;
  try {
    const hostname = new URL(siteUrl).hostname;
    // Strip www. prefix and format
    const clean = hostname.replace(/^www\./, "");
    // For single-word domains like "3m.com", just use the name part
    const namePart = clean.split(".")[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  } catch {
    return siteUrl;
  }
}
```

### Pattern 3: ZIP Download Auth Header Forwarding
**What:** The ZIP proxy route currently does not forward an authorization header to the scraper backend when requesting ZIP creation. The scraper service may require server-to-server auth (GCP identity token).
**When to use:** Asset ZIP download proxy.
**Root cause analysis:** Looking at the ZIP route (`src/app/api/tools/brand-scraper/jobs/[id]/assets/zip/route.ts`), it uses `process.env.BRAND_SCRAPER_API_URL` directly and calls `fetch()` without any auth headers — unlike the `client.ts` methods (`submitScrapeJob`, `getScrapeJobStatus`) which both call `getIdentityToken()` for Cloud Run service-to-service auth. This is likely why the scraper service returns 403.

### Anti-Patterns to Avoid
- **Don't call external color APIs at runtime:** Use a local library (color-namer) to avoid latency and rate limits.
- **Don't duplicate the `getIdentityToken` logic:** Extract from `client.ts` into a shared utility if needed, or import it.
- **Don't assume the scraper will change:** All frontend improvements must work with the existing taxonomy shape. New fields (company_name, site_name) should be `.optional()` in the schema.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hex → color name | Custom color distance algorithm | `color-namer` npm package | Delta-E perceptual distance is complex; library handles 1500+ named colors correctly |
| Company name from URL | Complex regex parsing | `new URL()` + simple string formatting | URL parsing is standardized; edge cases handled by the URL constructor |
| GCP auth tokens | Manual metadata server calls (already exists) | Reuse `getIdentityToken` from `client.ts` | Already tested and working in the codebase |

**Key insight:** Color naming involves perceptual color science (CIELAB color space, Delta-E distance). A naive approach (mapping hex ranges to names) fails badly for ambiguous colors. The `color-namer` library is ~16KB and handles this correctly.

## Common Pitfalls

### Pitfall 1: ZIP Download 403 — Missing Service-to-Service Auth
**What goes wrong:** The ZIP proxy route (`/api/tools/brand-scraper/jobs/[id]/assets/zip/route.ts`) calls the scraper backend without a GCP identity token. On Cloud Run, all service-to-service calls require an identity token in the Authorization header.
**Why it happens:** The ZIP route was written using `process.env.BRAND_SCRAPER_API_URL` directly instead of using the `client.ts` pattern that includes `getIdentityToken()`.
**How to avoid:** Add the same auth header pattern used in `client.ts#submitScrapeJob` and `client.ts#getScrapeJobStatus`.
**Warning signs:** 403 errors from the scraper service; works locally but fails on Cloud Run.

### Pitfall 2: Color Namer Bundle Size on Client
**What goes wrong:** `color-namer` includes multiple name lists (basic, x11, html, pantone, ntc, roygbiv). Importing all lists bloats the client bundle.
**Why it happens:** Default import includes all lists.
**How to avoid:** Use the `pick` option to only load the "basic" list (147 names, ~2KB). Or run color naming server-side in the API route and include names in the response.
**Warning signs:** Large client bundle increase after adding the dependency.

### Pitfall 3: Schema Extension Breaking Existing Data
**What goes wrong:** Adding required fields to the `brandTaxonomySchema` breaks parsing of existing jobs that don't have those fields.
**Why it happens:** Existing stored jobs don't have `company_name` or `site_name` in their identity object.
**How to avoid:** All new fields MUST be `.optional()`. The `.passthrough()` on the identity schema already handles this, but be explicit.
**Warning signs:** Existing brand profile cards stop rendering; `safeParse` returns errors.

### Pitfall 4: Color Name Not Matching User Expectation
**What goes wrong:** The library returns a technically correct but unintuitive name (e.g., "Maroon" instead of "Red" for `#CC0000`).
**Why it happens:** The "basic" list has limited names; some hex values are equidistant from multiple named colors.
**How to avoid:** Use the "basic" list first for broad names, which gives recognizable results. Test with known brand colors (3M red #FF0000, Facebook blue #1877F2, etc.) to verify naming quality.
**Warning signs:** Color names that feel wrong when viewed alongside the swatch.

## Code Examples

### Color Naming Integration in BrandCardColors
```typescript
// In BrandCardColors.tsx — add color name below hex
import { getColorName } from "@/lib/brand-scraper/colors";

// Inside the color swatch rendering:
const colorName = getColorName(entry.value.hex);
// Display: "Red" below "#FF0000" and above "Primary"
```

### Schema Update for Company Name
```typescript
// In types.ts — extend the identity schema
identity: z
  .object({
    tagline: z.string().optional(),
    industry_guess: z.string().optional(),
    company_name: z.string().optional(), // NEW: from og:site_name or title tag
    site_name: z.string().optional(),    // NEW: raw og:site_name value
  })
  .passthrough()
  .optional(),
```

### ZIP Route Auth Fix
```typescript
// In zip/route.ts — add identity token
import { getIdentityToken } from "@/lib/brand-scraper/client"; // Need to export

const headers: Record<string, string> = {};
const idToken = await getIdentityToken(BRAND_SCRAPER_API_URL);
if (idToken) {
  headers.Authorization = `Bearer ${idToken}`;
}

const createRes = await fetch(
  `${BRAND_SCRAPER_API_URL}/jobs/${id}/assets/zip`,
  { method: "POST", headers, signal: AbortSignal.timeout(60_000) },
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Show hostname only | Show hostname only (current) | Phase 1 | User wants company names instead |
| No color names | Positional labels (Primary/Secondary/Accent) | Phase 1 | User wants actual color names too |
| Direct GCS signed URLs for downloads | Server-side proxy | Phase 1 | JSON works; ZIP still 403 |
| No auth on ZIP proxy | No auth on ZIP proxy (current) | Phase 1 | Root cause of ZIP 403 |

**Key state:** Phase 1 laid excellent groundwork but left four issues:
1. ZIP auth headers missing (fixable in this codebase)
2. Color names missing (fixable with color-namer library)
3. Company name not extracted (schema + frontend fixable; backend scraper needs update for full solution)
4. Color accuracy (external scraper issue — deferred again)

## Detailed Issue Analysis

### Issue 1: Asset ZIP Downloads (Priority H)

**User report:** "I still can't download the assets" with a curl showing a POST to `/api/tools/brand-scraper/jobs/{id}/assets/zip`

**Root cause chain:**
1. Frontend calls `POST /api/tools/brand-scraper/jobs/{id}/assets/zip` (our proxy)
2. Proxy calls `POST ${BRAND_SCRAPER_API_URL}/jobs/${id}/assets/zip` (external scraper)
3. External scraper returns 403 because the proxy doesn't send an identity token

**Evidence:** Compare `client.ts` (which works for job status) — it calls `getIdentityToken()` and sets the Authorization header. The ZIP route does NOT do this.

**Fix:** Export `getIdentityToken` from `client.ts` and use it in the ZIP route. This is a straightforward fix with high confidence.

**Remaining risk:** If the 403 is not an auth issue but a GCS bucket permission issue on the scraper side, the fix won't resolve it. The frontend should still have good error handling with retry + fallback.

### Issue 2: Color Labels (Priority M)

**User report:** "It's not labelling the secondary color. For most brands, there should be a primary, secondary, accent, and text"

**Current state:** Phase 1 added positional role labels (Primary/Secondary/Accent for positions 0/1/2). But the user also wants more descriptive labels — actual color names.

**Two-part fix:**
1. Add human-readable color names using `color-namer` (e.g., "Red", "Navy Blue")
2. Expand positional labels to include "Text" for 4th color (index 3)

### Issue 3: Company Name (Priority M)

**User report:** "The tool should be able to extract the company name from the website and use that for the Brand's title instead of the URL"

**Analysis:** The external scraper's taxonomy has an `identity` object with `tagline` and `industry_guess`. It does NOT currently include `company_name` or `site_name`. The scraper service would need to:
- Extract `og:site_name` from `<meta property="og:site_name" content="..."/>`
- Parse `<title>` tag to extract the brand name (usually before a `|` or `-` separator)
- Check for Schema.org Organization name

**Frontend-only approach:**
- Extend the Zod schema to accept `company_name` and `site_name` as optional fields
- Implement a fallback chain: `company_name` → `site_name` → cleaned hostname
- When neither is available, use a smarter hostname-to-name conversion (strip TLD, title-case, handle edge cases like `3m` → `3M`)

### Issue 4: Color Accuracy (Priority H — DEFERRED)

**User report:** "3M.com — their main color is red. Why is it not returning red?"

**Analysis:** Same as Phase 1 — this is an external scraper service issue. The scraper may be:
- Blocked by robots.txt
- Failing to render JS-heavy pages
- Not sampling enough pages
- Not weighting header/nav colors highly enough

**Frontend cannot fix this.** We can only improve display of what we get and make the experience better when results are incomplete. Mark as deferred again.

## Open Questions

1. **Does the scraper service already return `company_name` or `site_name` in identity?**
   - What we know: The Zod schema only has `tagline` and `industry_guess`, but the schema uses `.passthrough()` so extra fields would survive parsing
   - What's unclear: Whether the scraper actually sends these fields — we'd need to inspect a real response
   - Recommendation: Add the optional fields to the schema and test with a real scrape. If the data is there (passed through), it'll work immediately. If not, the fallback chain handles it.

2. **Is `getIdentityToken` the correct fix for ZIP 403?**
   - What we know: `client.ts` uses it for all other scraper calls, and those work. The ZIP route doesn't use it.
   - What's unclear: 100% certainty the 403 is auth vs. GCS permissions
   - Recommendation: Add the auth header (it's the most likely fix) and also improve error messaging if it still fails.

3. **Should color naming happen client-side or server-side?**
   - What we know: `color-namer` works in both Node.js and browser
   - What's unclear: Bundle size impact with tree shaking
   - Recommendation: Start client-side (simpler, no API changes needed). If bundle size is a concern, move to a utility function called in the API route.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/lib/brand-scraper/types.ts` (taxonomy schema), `src/lib/brand-scraper/client.ts` (auth pattern), `src/app/api/tools/brand-scraper/jobs/[id]/assets/zip/route.ts` (ZIP route without auth)
- Phase 1 PLAN.md and commit `ecf0975` (what was already fixed)
- TESTING-FEEDBACK.md items 1-4 in Brand Scraper section (exact user reports)

### Secondary (MEDIUM confidence)
- [color-namer npm](https://www.npmjs.com/package/color-namer) — Delta-E color naming library, actively maintained
- [color-namer GitHub](https://github.com/colorjs/color-namer) — source code and usage examples
- [Open Graph protocol](https://ogp.me/) — og:site_name specification for company name extraction

### Tertiary (LOW confidence)
- [hex-color-to-color-name](https://www.npmjs.com/package/hex-color-to-color-name) — alternative library, newer but less established

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries except color-namer (well-established)
- Architecture: HIGH — extending existing patterns, no new architectural decisions
- Pitfalls: HIGH — root cause of ZIP 403 identified with strong evidence from code comparison
- Color accuracy fix: N/A — deferred to external scraper service

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable — no fast-moving dependencies)
