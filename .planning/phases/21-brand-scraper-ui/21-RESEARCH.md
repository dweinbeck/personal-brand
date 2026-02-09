# Phase 21: Brand Scraper UI - Research

**Researched:** 2026-02-08
**Domain:** React client components for async job submission, SWR polling, and brand data gallery display
**Confidence:** HIGH

## Summary

This phase builds the client-side UI for the brand scraper feature: a URL submission form, job status polling with visual indicators, a 2-wide card gallery displaying extracted brand data (colors, fonts, logos, assets with confidence badges), and download links for `brand.json` and `assets.zip`. The page lives at `/control-center/brand-scraper` and replaces the existing stub page.

The codebase already contains every pattern needed for this phase. The `TutorialEditor` component demonstrates the established client-side form pattern (useState, useAuth for token retrieval, async fetch with Bearer token, status/error messaging). The `ConfidenceBadge` component provides the confidence display pattern. The `Card` component provides the card container. The `Button` component provides styled actions. The only new dependency is `swr@2.4.0` for polling, which was already identified in the STACK.md research.

The primary complexity is threefold: (1) integrating SWR for polling with dynamic `refreshInterval` that stops on terminal states, (2) defining the BrandTaxonomy Zod schema for the `result` field (currently `z.unknown()` from Phase 20), and (3) building the gallery sub-components (color swatches, font specimens, logo thumbnails, asset cards) with confidence indicators. All three are well-understood patterns with no novel technical risk.

**Primary recommendation:** Install SWR, create a `useJobStatus` custom hook with dynamic `refreshInterval`, build gallery components as pure presentational components that receive typed BrandTaxonomy data, and reuse existing Card/Button/ConfidenceBadge patterns throughout.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `swr` | `^2.4.0` | Job status polling with `refreshInterval` | Vercel-ecosystem library, ~4.5 kB gzip, built-in polling with dynamic interval control, stale-while-revalidate caching, automatic cleanup on unmount |
| `zod` | `^4.3.6` | BrandTaxonomy response validation | Already used for all schema validation in this project; Phase 20 schemas need `result` field tightened |
| `react` | `19.2.3` | UI components with hooks (useState, useEffect, useRef, useCallback) | Already installed; React 19 is the project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `clsx` | `2.1.1` | Conditional CSS class composition | Already used in Card, Button, TutorialEditor; use for status-dependent styling |
| `next/image` | `16.1.6` | Optimized image display for logos/assets | If logo URLs are from a configured remote pattern; otherwise use plain `<img>` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SWR for polling | `useEffect` + `setTimeout` chain | Works but requires manual cleanup, stale closure management, error retry logic; SWR handles all of this in ~3 lines |
| SWR for polling | `@tanstack/react-query` | Heavier bundle (~40 kB vs ~4.5 kB); more powerful but overkill for polling a single endpoint |
| Custom gallery components | Component library (shadcn/ui, Radix) | Project already has its own design system (Card, Button); adding a component library mid-project creates inconsistency |
| Plain `<img>` for logos | `next/image` | `next/image` requires `remotePatterns` config for external domains; logos come from GCS signed URLs whose hostnames are unknown at build time; plain `<img>` with `loading="lazy"` is simpler and sufficient |

**Installation:**
```bash
npm install swr
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    control-center/
      brand-scraper/
        page.tsx                          # Thin RSC wrapper, renders BrandScraperPage
  components/
    admin/
      brand-scraper/
        BrandScraperPage.tsx              # Client component: orchestrator (form + status + results)
        UrlSubmitForm.tsx                 # Client component: URL input + submit button
        JobStatusIndicator.tsx            # Client component: polling status display
        BrandResultsGallery.tsx           # Client component: 2-wide card grid with all sections
        ColorPaletteCard.tsx              # Client component: color swatches grid
        TypographyCard.tsx                # Client component: font specimens
        LogoAssetsCard.tsx                # Client component: logo/asset thumbnails
        DownloadLinks.tsx                 # Client component: brand.json + assets.zip buttons
        BrandConfidenceBadge.tsx          # Client component: numeric (0-1) confidence badge
  lib/
    brand-scraper/
      types.ts                            # (from Phase 20, EXTENDED with BrandTaxonomy schema)
      client.ts                           # (from Phase 20, unchanged)
      hooks.ts                            # useJobStatus custom hook (SWR polling)
```

### Pattern 1: SWR Polling with Dynamic refreshInterval
**What:** Use SWR's `refreshInterval` option to poll the job status endpoint. The interval is controlled by a state variable that is set to 0 when the job reaches a terminal state, which stops polling automatically. SWR also handles cleanup on component unmount, preventing memory leaks.
**When to use:** Any async job that requires periodic status checks until completion.
**Example:**
```typescript
// src/lib/brand-scraper/hooks.ts
"use client";
import useSWR from "swr";
import { useState, useCallback } from "react";
import type { JobStatus } from "@/lib/brand-scraper/types";

const TERMINAL_STATUSES = ["succeeded", "partial", "failed"];
const POLL_INTERVAL_MS = 3000;

async function fetchJobStatus(url: string): Promise<JobStatus> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `Status ${res.status}`);
  }
  return res.json();
}

export function useJobStatus(jobId: string | null, token: string | null) {
  const [pollInterval, setPollInterval] = useState(POLL_INTERVAL_MS);

  const { data, error, isLoading } = useSWR<JobStatus>(
    jobId && token
      ? `/api/admin/brand-scraper/jobs/${jobId}`
      : null, // null key = no request (conditional fetching)
    (url: string) =>
      fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      }),
    {
      refreshInterval: pollInterval,
      onSuccess: (data) => {
        if (TERMINAL_STATUSES.includes(data.status)) {
          setPollInterval(0); // Stop polling
        }
      },
    },
  );

  const isTerminal = data ? TERMINAL_STATUSES.includes(data.status) : false;
  const isPolling = pollInterval > 0 && jobId !== null;

  const reset = useCallback(() => {
    setPollInterval(POLL_INTERVAL_MS);
  }, []);

  return { data, error, isLoading, isPolling, isTerminal, reset };
}
```

### Pattern 2: Authenticated Client-Side Fetch to Admin API Routes
**What:** Client components call admin API routes with a Bearer token from Firebase Auth. The token is obtained via `useAuth()` and `user.getIdToken()`.
**When to use:** Any client-side call to `/api/admin/*` routes.
**Example:**
```typescript
// Source: existing pattern in TutorialEditor.tsx
const { user } = useAuth();

async function handleSubmit(url: string) {
  const token = await user?.getIdToken();
  if (!token) return;

  const res = await fetch("/api/admin/brand-scraper/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `Status ${res.status}`);
  }

  return res.json(); // { job_id, status }
}
```

### Pattern 3: 2-Wide Card Gallery Grid
**What:** A responsive grid layout that shows brand data cards in a 2-column layout on desktop, stacking to 1 column on mobile. Uses the existing `Card` component.
**When to use:** The results view after a job succeeds.
**Example:**
```typescript
// BrandResultsGallery.tsx
<div className="grid gap-6 sm:grid-cols-2">
  <Card>
    <ColorPaletteCard colors={result.colors} />
  </Card>
  <Card>
    <TypographyCard fonts={result.fonts} />
  </Card>
  <Card>
    <LogoAssetsCard logos={result.logos} assets={result.assets} />
  </Card>
  <Card>
    <DownloadLinks brandJsonUrl={brandJsonUrl} assetsZipUrl={assetsZipUrl} />
  </Card>
</div>
```

### Pattern 4: Status-Driven UI State Machine
**What:** The brand scraper page has distinct visual states driven by the job lifecycle. Use a discriminated union or status string to drive the UI.
**When to use:** Any UI with distinct phases (idle, submitting, polling, complete, error).
**Example:**
```typescript
// UI state transitions
type PageState =
  | { phase: "idle" }                    // Show URL form
  | { phase: "submitting" }             // Form disabled, spinner
  | { phase: "polling"; jobId: string } // Show status indicator
  | { phase: "complete"; jobId: string; result: BrandTaxonomy } // Show gallery
  | { phase: "failed"; error: string }; // Show error + retry
```

### Anti-Patterns to Avoid
- **Using `setInterval` directly:** Use SWR's `refreshInterval` or `setTimeout` chains. `setInterval` with `useEffect` creates stale closure issues and requires careful cleanup.
- **Calling external brand scraper API directly from browser:** Always proxy through the Next.js API routes. The external URL is server-only.
- **Using `next/image` for GCS signed URLs without `remotePatterns`:** The `next.config.ts` has no `images.remotePatterns` configured. Adding GCS hostnames is fragile because signed URLs use `storage.googleapis.com` subdomains. Use plain `<img>` with `loading="lazy"` for logo/asset display.
- **Creating a separate `BrandConfidenceBadge` that duplicates the existing ConfidenceBadge entirely:** Instead, create a thin wrapper that maps numeric confidence (0-1) to the existing categorical levels ("high" / "medium" / "low") and delegates to the existing component, or create a new component that shares the same visual language.
- **Polling with no maximum duration:** Add a max-attempts or max-duration guard. After 5 minutes of polling (100 polls at 3s), show a "taking longer than expected" message with a manual refresh option.
- **Not passing the auth token to the SWR fetcher:** The poll endpoint is admin-protected. Every fetch to `/api/admin/brand-scraper/jobs/[id]` must include the `Authorization: Bearer` header.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Polling with cleanup | `useEffect` + `setInterval` + manual cleanup | SWR `refreshInterval` with conditional key | SWR handles unmount cleanup, error retries, stale data, and deduplication automatically |
| Confidence visualization | New badge from scratch | Extend or wrap existing `ConfidenceBadge` from `src/components/assistant/` | Same three-tier system (high/medium/low) with same color tokens (sage/amber/muted) |
| Card containers | Custom card styling | `Card` from `src/components/ui/Card.tsx` | Consistent border, shadow, border-radius across all admin UIs |
| Action buttons | Custom button styling | `Button` from `src/components/ui/Button.tsx` | Consistent hover, focus, disabled states |
| Auth token retrieval | Manual Firebase SDK calls | `useAuth()` from `src/context/AuthContext.tsx` | Already provides `user` with `getIdToken()` method |
| Conditional class names | Template literals | `clsx` (already installed) | Handles falsy values, arrays, objects cleanly |
| URL validation | Custom regex | `z.string().url()` from Zod | Already the project standard; handles edge cases |

**Key insight:** This phase is primarily UI composition. Every foundational pattern (auth, cards, buttons, confidence badges, form patterns) exists in the codebase. The novel work is: (1) the SWR polling hook, (2) the BrandTaxonomy type definition, and (3) the brand-specific gallery sub-components (color swatches, font specimens, logo grids).

## Common Pitfalls

### Pitfall 1: SWR Polling Continues After Page Navigation (Memory Leak)
**What goes wrong:** The `useJobStatus` hook keeps polling after the user navigates away from the brand scraper page. The SWR instance fires fetch requests to a component that no longer exists.
**Why it happens:** If the SWR key is not properly nullified when the component unmounts, or if state updates happen after unmount.
**How to avoid:** SWR handles cleanup automatically when the component unmounts -- the key becomes stale and polling stops. The critical thing is to use SWR's built-in `refreshInterval` instead of manual `setInterval`. SWR's architecture ensures that when the hook unmounts, polling stops.
**Warning signs:** Network tab shows continued requests to `/api/admin/brand-scraper/jobs/[id]` after navigating away. Console warnings about state updates on unmounted components.

### Pitfall 2: Missing Auth Token in SWR Fetcher
**What goes wrong:** The SWR fetcher function uses a simple `fetch(url).then(r => r.json())` without including the Firebase ID token. The admin API routes return 401, and SWR retries indefinitely, creating a flood of failed requests.
**Why it happens:** SWR examples on the web use a simple fetcher. The developer copies a basic example without adapting it for authenticated endpoints.
**How to avoid:** Pass the token into the SWR fetcher. Use a custom fetcher that includes the `Authorization: Bearer` header. Get the token from `useAuth()` and include it as part of the SWR key or closure.
**Warning signs:** SWR returns `error` immediately after job submission. Network tab shows 401 responses on poll requests.

### Pitfall 3: BrandTaxonomy Schema Mismatch with Actual API Response
**What goes wrong:** The Zod schema for the `result` field is written based on assumptions about the BrandTaxonomy structure, but the actual Fastify service returns a different shape. The UI either crashes on missing fields or silently drops data.
**Why it happens:** The BrandTaxonomy response shape was documented conceptually in planning but never validated against the live service. Phase 20 intentionally used `z.unknown()` for the `result` field.
**How to avoid:** Before writing the gallery components, run a real scrape job via curl against the Fastify service and capture the actual JSON response. Write the Zod schema from the real data. Use `.passthrough()` on objects to avoid breaking on unexpected extra fields. Start with a permissive schema and tighten after confirming the actual shape.
**Warning signs:** Gallery components render empty sections despite the job succeeding. Console shows Zod validation errors.

### Pitfall 4: GCS Signed URL Expiration Breaks Logo/Asset Display
**What goes wrong:** The brand scraper API returns GCS signed URLs for logos and assets with a time-limited TTL (typically 1 hour). If the admin leaves the results page open for longer than the TTL, all images break with no indication of why.
**Why it happens:** Signed URLs are temporary by design. The UI treats them as permanent image sources.
**How to avoid:** Display logos/assets with plain `<img>` tags (which will show broken image indicators if URLs expire). Add a note or timestamp showing when the data was fetched. Provide a "Refresh" button that re-fetches the job status to get fresh signed URLs. For download links, fetch the download URL at click time rather than caching it.
**Warning signs:** Images that worked initially stop displaying after some time.

### Pitfall 5: No Maximum Polling Duration
**What goes wrong:** A scrape job hangs indefinitely (the Fastify service crashes mid-job, or the job is stuck in "processing"). The UI polls forever, showing an infinite spinner with no resolution.
**Why it happens:** The polling logic only stops on terminal states. If the API never returns a terminal state, polling never stops.
**How to avoid:** Add a maximum poll count or duration. After ~100 polls (5 minutes at 3s intervals), stop polling and show a "Job is taking longer than expected" message with a manual "Check Again" button. Store the poll start time and compare against a max duration.
**Warning signs:** The status indicator shows "Processing..." indefinitely with no timeout.

### Pitfall 6: Dynamic Font Loading Causes Layout Shift
**What goes wrong:** The typography card attempts to render font specimen text in the detected font family by loading it from Google Fonts via a dynamic `<link>` tag. The font loads asynchronously, causing a visible layout shift as the text re-renders from fallback to loaded font.
**Why it happens:** Google Fonts CSS is loaded after the component renders. The browser uses a fallback font, then swaps when the custom font loads.
**How to avoid:** Use `font-display: swap` in the Google Fonts URL (add `&display=swap`). Accept the shift as cosmetic for an admin tool. Alternatively, show the font family name without attempting to load and render it -- a simpler approach that avoids the complexity entirely. For MVP, displaying the font name and a Google Fonts link is sufficient.
**Warning signs:** Text in font specimen cards visibly flashes between fonts on initial load.

### Pitfall 7: Copy-to-Clipboard Fails in Non-HTTPS Contexts
**What goes wrong:** The color swatch click-to-copy feature uses `navigator.clipboard.writeText()`, which requires a secure context (HTTPS or localhost). In development on `localhost:3000` this works, but if accessed via a non-localhost hostname without HTTPS, the API is unavailable.
**Why it happens:** The Clipboard API is restricted to secure contexts by browser security policy.
**How to avoid:** Wrap `navigator.clipboard.writeText()` in a try-catch. Fall back to the deprecated `document.execCommand('copy')` or simply skip the feature if the API is unavailable. Show a brief toast ("Copied!") on success.
**Warning signs:** Click-to-copy silently fails with no user feedback.

## Code Examples

Verified patterns from the existing codebase:

### URL Submit Form (adapting TutorialEditor pattern)
```typescript
// Source: adapted from src/components/admin/TutorialEditor.tsx
"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { ScrapeJobSubmission } from "@/lib/brand-scraper/types";

type UrlSubmitFormProps = {
  onJobSubmitted: (job: ScrapeJobSubmission) => void;
};

export function UrlSubmitForm({ onJobSubmitted }: UrlSubmitFormProps) {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = await user?.getIdToken();
      if (!token) {
        setError("Not authenticated.");
        return;
      }

      const res = await fetch("/api/admin/brand-scraper/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Request failed" }));
        setError(body.error || `Error ${res.status}`);
        return;
      }

      const job: ScrapeJobSubmission = await res.json();
      onJobSubmitted(job);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* URL input + submit button */}
    </form>
  );
}
```

### Color Swatch Component (inline style for dynamic hex)
```typescript
// Source: STACK.md pattern recommendation
function ColorSwatch({
  hex,
  name,
  confidence,
}: {
  hex: string;
  name?: string;
  confidence?: number;
}) {
  async function copyHex() {
    try {
      await navigator.clipboard.writeText(hex);
      // show toast
    } catch {
      // clipboard API not available
    }
  }

  return (
    <button
      type="button"
      onClick={copyHex}
      className="flex items-center gap-3 rounded-lg p-2 hover:bg-gold-light transition-colors text-left w-full"
    >
      <div
        className="h-10 w-10 rounded-lg border border-border shadow-sm shrink-0"
        style={{ backgroundColor: hex }}
      />
      <div className="min-w-0">
        <p className="text-sm font-mono text-text-primary">{hex}</p>
        {name && (
          <p className="text-xs text-text-secondary truncate">{name}</p>
        )}
      </div>
      {confidence !== undefined && (
        <BrandConfidenceBadge score={confidence} />
      )}
    </button>
  );
}
```

### Job Status Visual Indicators
```typescript
// Status indicator mapping
const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  animate: boolean;
}> = {
  queued: {
    label: "Queued...",
    color: "text-text-tertiary",
    animate: true,
  },
  processing: {
    label: "Analyzing...",
    color: "text-amber",
    animate: true,
  },
  succeeded: {
    label: "Complete",
    color: "text-sage",
    animate: false,
  },
  partial: {
    label: "Partial Results",
    color: "text-amber",
    animate: false,
  },
  failed: {
    label: "Failed",
    color: "text-red-500",
    animate: false,
  },
};
```

### BrandConfidenceBadge (numeric to categorical mapping)
```typescript
// Maps numeric 0-1 score to categorical label
// Uses same color tokens as existing ConfidenceBadge
function scoreToCategoryLevel(score: number): "high" | "medium" | "low" {
  if (score >= 0.85) return "high";
  if (score >= 0.60) return "medium";
  return "low";
}

const styleMap = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-600 border-red-200",
};
```

### Download Links Pattern
```typescript
// Use <a download> with signed URLs for direct browser download
function DownloadLinks({
  brandJsonUrl,
  assetsZipUrl,
}: {
  brandJsonUrl?: string;
  assetsZipUrl?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {brandJsonUrl && (
        <a
          href={brandJsonUrl}
          download="brand.json"
          className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-hover transition-colors"
        >
          Download Brand Data (JSON)
        </a>
      )}
      {assetsZipUrl && (
        <a
          href={assetsZipUrl}
          download="assets.zip"
          className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-hover transition-colors"
        >
          Download Assets (ZIP)
        </a>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useEffect` + `setInterval` for polling | SWR `refreshInterval` with dynamic control | SWR v1+ | SWR handles cleanup, retries, deduplication; no stale closure bugs |
| `navigator.clipboard.writeText()` only | Try/catch with fallback to `execCommand` | Ongoing | Clipboard API requires secure context; fallback needed for non-HTTPS |
| `next/image` for all images | Plain `<img>` for external/signed URLs without configured `remotePatterns` | Next.js 13+ | `next/image` requires explicit domain allowlisting; GCS signed URLs have dynamic subdomains |

**Deprecated/outdated:**
- Nothing deprecated relevant to this phase. SWR 2.4.0 is current. React 19 hooks are stable.

## BrandTaxonomy Schema (Best Guess)

The exact BrandTaxonomy shape is an open question from Phase 20. Based on the project documentation (FEATURES.md, ARCHITECTURE.md, PROJECT.md), the expected structure is:

```typescript
// IMPORTANT: This is a BEST GUESS based on planning docs.
// Must be validated against actual Fastify API response before implementation.

const brandTaxonomySchema = z.object({
  colors: z.array(z.object({
    hex: z.string(),
    rgb: z.object({ r: z.number(), g: z.number(), b: z.number() }).optional(),
    name: z.string().optional(),     // "primary", "secondary", "accent", etc.
    role: z.string().optional(),     // Role in the design system
    confidence: z.number(),          // 0-1
    needs_review: z.boolean().optional(),
  })).optional(),

  fonts: z.array(z.object({
    family: z.string(),
    weights: z.array(z.number()).optional(),
    usage: z.string().optional(),    // "heading", "body"
    source: z.string().optional(),   // "google_fonts", "custom"
    confidence: z.number(),
    needs_review: z.boolean().optional(),
  })).optional(),

  logos: z.array(z.object({
    url: z.string(),                 // GCS signed URL
    format: z.string().optional(),   // "svg", "png", "ico"
    dimensions: z.object({
      width: z.number(),
      height: z.number(),
    }).optional(),
    confidence: z.number(),
    needs_review: z.boolean().optional(),
  })).optional(),

  assets: z.array(z.object({
    url: z.string(),                 // GCS signed URL
    type: z.string().optional(),     // "screenshot", "favicon", "og-image"
    format: z.string().optional(),
    confidence: z.number().optional(),
  })).optional(),

  identity: z.object({
    tagline: z.string().optional(),
    industry: z.string().optional(),
  }).optional(),
}).passthrough(); // Allow extra fields from the API
```

**Confidence: LOW** -- This schema is inferred from planning documents, not validated against the live API. The planner should include a task to validate this schema against a real API response before writing gallery components.

## Open Questions

Things that could not be fully resolved:

1. **Exact BrandTaxonomy response shape**
   - What we know: The API returns a `result` field containing colors, fonts, logos, assets, and identity data with confidence scores. Phase 20 uses `z.unknown()` for this field.
   - What's unclear: Exact field names, nesting, whether confidence is per-item or per-section, whether `needs_review` exists at the item level.
   - Recommendation: The first task in the plan should be to run a real scrape job via curl and capture the actual JSON. Write the Zod schema from real data, then build gallery components.

2. **Logo/asset image display: `<img>` vs `next/image`**
   - What we know: `next.config.ts` has no `images.remotePatterns` configured. Logos come from GCS signed URLs on `storage.googleapis.com`.
   - What's unclear: Whether `next/image` is needed for optimization, or if plain `<img>` is acceptable for admin-only pages.
   - Recommendation: Use plain `<img>` with `loading="lazy"`. This is an admin-only page viewed by one user. The optimization benefit of `next/image` does not justify the configuration complexity of adding remote patterns for GCS signed URL domains.

3. **Download link behavior with signed URL expiration**
   - What we know: GCS signed URLs have a TTL (typically 1 hour). The `brand_json_url` and `assets_zip_url` fields contain signed URLs.
   - What's unclear: The exact TTL. Whether the user will typically download immediately or come back later.
   - Recommendation: Display download links prominently immediately after job completion. Do not cache the URLs in client state beyond the SWR response. If the user returns to the page later, re-fetching the job status should return fresh signed URLs (if the API generates them on each request) -- but this depends on the Fastify service implementation.

4. **SWR token refresh during long polling sessions**
   - What we know: Firebase ID tokens expire after 1 hour. If polling runs for a long time, the token in the SWR fetcher closure could expire.
   - What's unclear: Whether this is a practical concern given the 5-minute max polling duration.
   - Recommendation: With a 5-minute max poll duration, token expiration is not a concern. If needed in the future, the fetcher can call `user.getIdToken(true)` to force-refresh the token.

## Sources

### Primary (HIGH confidence)
- `src/components/admin/TutorialEditor.tsx` - Client-side form pattern with auth token, async submit, status/error messaging
- `src/components/assistant/ConfidenceBadge.tsx` - Three-tier confidence display (high/medium/low with emerald/amber/red)
- `src/components/ui/Card.tsx` - Card container with default/clickable/featured variants
- `src/components/ui/Button.tsx` - Button with primary/secondary/ghost variants and link support
- `src/context/AuthContext.tsx` - `useAuth()` hook providing Firebase user with `getIdToken()`
- `src/app/control-center/layout.tsx` - AdminGuard wrapper pattern (already protects `/control-center/*`)
- `src/app/control-center/brand-scraper/page.tsx` - Existing stub page to replace
- `src/app/globals.css` - Design tokens: sage (#6b8e6f), amber (#d4956c), muted (#8a94a6)
- `.planning/phases/20-brand-scraper-api-proxy/20-01-PLAN.md` - Phase 20 artifacts and types
- `.planning/phases/20-brand-scraper-api-proxy/20-RESEARCH.md` - API proxy patterns, Zod schemas
- `.planning/research/ARCHITECTURE.md` - Brand scraper component architecture, data flow
- `.planning/research/FEATURES.md` - TS-7 through TS-11: full feature specifications
- `.planning/research/STACK.md` - SWR recommendation, color/font display patterns
- `.planning/research/PITFALLS.md` - Pitfalls 7 (polling leaks), 8 (signed URL expiry), 9 (CORS), 11 (large responses), 15 (raw errors)

### Secondary (MEDIUM confidence)
- [SWR npm package](https://www.npmjs.com/package/swr) - v2.4.0 confirmed published, ~4.5 kB gzip
- [SWR API documentation](https://swr.vercel.app/docs/api) - `refreshInterval` supports dynamic values and function syntax
- [SWR Revalidation docs](https://swr.vercel.app/docs/revalidation) - Polling interval patterns
- SWR GitHub issues #632, #182, #236 - Dynamic polling interval and stop behavior confirmed

### Tertiary (LOW confidence)
- BrandTaxonomy exact response shape - inferred from planning docs, needs validation against live API
- GCS signed URL TTL - assumed 1 hour based on PITFALLS.md, not confirmed with Fastify service
- Job status enum exact values - "queued", "processing", "succeeded", "partial", "failed" from planning docs, not confirmed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - SWR is the only new dependency, well-verified; all other libraries already exist
- Architecture: HIGH - direct reuse of established codebase patterns (TutorialEditor, ConfidenceBadge, Card, auth)
- Pitfalls: HIGH - derived from prior research (PITFALLS.md) and direct codebase analysis
- BrandTaxonomy schema: LOW - inferred from planning docs, not validated against live API

**Research date:** 2026-02-08
**Valid until:** 30 days (stable patterns, SWR is mature, no fast-moving dependencies)
