# Phase 30: Assets Page + User History - Research

**Researched:** 2026-02-10
**Domain:** Next.js dynamic routes, Firestore collection design, signed URL asset display, per-asset download UI
**Confidence:** HIGH

## Summary

Phase 30 is the final phase of v1.7, adding two features to the Brand Scraper tool: (1) an individual assets page at `/apps/brand-scraper/[jobId]/assets` where users can see all extracted assets with previews, per-asset download buttons, and a "Download Zip File" button; and (2) a scrape history section below the URL input on the Brand Scraper page, showing previously scraped URLs with dates and a "View Results" link.

The existing codebase provides strong foundations for both features. The `assets_manifest` field (added in Phase 28/29) already exists in the `jobStatusSchema` Zod type and contains per-asset metadata with signed URLs (`signed_url`, `filename`, `category`, `content_type`, `size_bytes`). The authenticated proxy for zip download already works at `/api/tools/brand-scraper/jobs/[id]/assets/zip`. The `useJobStatus` SWR hook can be reused for the assets page. For history, a new Firestore collection is needed because the existing `billing_tool_usage` collection does not store the scraped URL.

No new npm dependencies are required. All features use existing libraries (Next.js App Router dynamic routes, Firestore, SWR, Zod, Tailwind CSS, date-fns).

**Primary recommendation:** Create a new dynamic route at `src/app/apps/brand-scraper/[jobId]/assets/page.tsx` that fetches job status (reusing the existing API endpoint) and renders the `assets_manifest` as a grid of previews. Create a new `scrape_history` Firestore collection keyed by `{uid}_{jobId}` to store history records. Add server-side Firestore write during scrape submission and a new API route for history fetching. Render history as a section in `UserBrandScraperPage` below the URL input.

## Standard Stack

### Core (Already in use -- no new dependencies)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| next | 16.1.6 | App Router, dynamic routes `[jobId]` | Existing |
| react | 19.2.3 | UI framework | Existing |
| swr | ^2.4.0 | Data fetching for assets page and history | Existing |
| zod | ^4.3.6 | Schema validation (AssetManifestEntry, history) | Existing |
| firebase-admin | ^13.6.0 | Firestore for scrape history collection | Existing |
| tailwindcss | ^4 | Styling | Existing |
| date-fns | ^4.1.0 | Date formatting for history entries (already used in envelopes) | Existing |
| clsx | ^2.1.1 | Conditional class names | Existing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns `formatDistanceToNow` | ^4.1.0 | "2 days ago" relative time display in history | History section |
| date-fns `format` | ^4.1.0 | Formatted date display for history entries | History section |

### No New Dependencies
All Phase 30 requirements can be met with existing dependencies:
- **Next.js App Router** for `[jobId]` dynamic route
- **SWR** for client-side data fetching (assets page job status, history list)
- **Firestore** for history persistence (same pattern as billing collections)
- **date-fns** for date formatting (already used in envelopes feature)
- **Zod** for API response validation
- **Existing `AssetManifestEntry` type** already has all fields needed for the assets display

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `scrape_history` collection | Query `billing_tool_usage` | `billing_tool_usage` lacks `siteUrl` and `status` update; adding fields to billing collection mixes concerns |
| Client-side SWR for history | Server component with Firestore read | History needs auth context (client token); SWR provides loading/error states and is consistent with existing patterns |
| Separate assets API proxy route | Reuse existing job status endpoint | Job status already returns `assets_manifest` with signed URLs; no new proxy needed |

## Architecture Patterns

### Recommended File Structure
```
src/
  app/
    apps/
      brand-scraper/
        page.tsx                               # EXISTING: main scraper page
        [jobId]/
          assets/
            page.tsx                           # NEW: assets page (dynamic route)
    api/
      tools/
        brand-scraper/
          history/
            route.ts                           # NEW: GET history for authenticated user
          scrape/
            route.ts                           # MODIFY: write history record after job submission
          jobs/[id]/
            route.ts                           # EXISTING: job status (unchanged, already returns assets_manifest)
            assets/
              zip/
                route.ts                       # EXISTING: zip proxy (unchanged)
  components/
    tools/
      brand-scraper/
        UserBrandScraperPage.tsx               # MODIFY: add history section below URL input
        AssetsPage.tsx                         # NEW: client component for assets page
        AssetGrid.tsx                          # NEW: grid of asset previews with download buttons
        AssetCard.tsx                          # NEW: single asset preview card
        ScrapeHistory.tsx                      # NEW: history section component
        ScrapeHistoryItem.tsx                  # NEW: single history row
  lib/
    brand-scraper/
      types.ts                                # MODIFY: add ScrapeHistoryEntry type
      history.ts                              # NEW: Firestore helpers for scrape history
```

### Pattern 1: Dynamic Route for Assets Page
**What:** A Next.js App Router dynamic route `[jobId]` that fetches job status client-side and renders assets from the manifest.
**When to use:** When user navigates to view extracted assets for a specific job.
**Why client-side:** The job status endpoint requires authentication (Bearer token). The page needs to fetch fresh signed URLs (which expire).

```typescript
// src/app/apps/brand-scraper/[jobId]/assets/page.tsx
// This is a server component shell that wraps the client component
import { AssetsPage } from "@/components/tools/brand-scraper/AssetsPage";

export const metadata = {
  title: "Brand Assets | Daniel Weinbeck",
  description: "View and download extracted brand assets.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <AssetsPage jobId={jobId} />;
}
```

```typescript
// src/components/tools/brand-scraper/AssetsPage.tsx
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { useJobStatus } from "@/lib/brand-scraper/hooks";

export function AssetsPage({ jobId }: { jobId: string }) {
  return (
    <AuthGuard>
      <AssetsPageContent jobId={jobId} />
    </AuthGuard>
  );
}

function AssetsPageContent({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  // Reuse existing hook -- it already returns assets_manifest
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    user?.getIdToken().then(setToken);
  }, [user]);

  const { data, error } = useJobStatus(jobId, token, "/api/tools/brand-scraper");

  // data.assets_manifest.assets has signed URLs for display
  // ...
}
```

### Pattern 2: Firestore History Collection Design
**What:** A `scrape_history` collection with documents keyed by `{uid}_{jobId}` to prevent duplicates.
**When to use:** When a scrape job is submitted successfully and when displaying user history.

```typescript
// Firestore document shape
type ScrapeHistoryEntry = {
  uid: string;
  jobId: string;
  siteUrl: string;
  status: "queued" | "processing" | "succeeded" | "partial" | "failed";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

// Collection: scrape_history
// Document ID: {uid}_{jobId}

// Write on scrape submission:
async function addHistoryEntry(params: {
  uid: string;
  jobId: string;
  siteUrl: string;
}): Promise<void> {
  const docId = `${params.uid}_${params.jobId}`;
  await requireDb().collection("scrape_history").doc(docId).set({
    uid: params.uid,
    jobId: params.jobId,
    siteUrl: params.siteUrl,
    status: "queued",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
```

**Why compound key `{uid}_{jobId}`:**
- Prevents duplicate entries if idempotent retry hits the scrape route
- Enables direct document lookup for status updates
- Consistent with the `billing_idempotency` pattern (`{uid}_{key}`)

**Why not a subcollection under `billing_users/{uid}/history`:**
- The requirements say "keyed by uid" which means indexed/queryable by uid, not necessarily subcollection
- A top-level collection with compound key and `uid` field enables both user-scoped queries (`.where("uid", "==", uid)`) and direct doc access
- Consistent with `billing_tool_usage` (top-level with `uid` field)

### Pattern 3: History Write in Scrape Submission Route
**What:** After successful job submission, write a history record to Firestore in the scrape route handler.
**When to use:** In `POST /api/tools/brand-scraper/scrape/route.ts`, after the backend returns a job_id.

```typescript
// In scrape/route.ts, after the existing job submission succeeds:
import { addHistoryEntry } from "@/lib/brand-scraper/history";

// After submitScrapeJob succeeds:
const job = await submitScrapeJob(parsed.data.url);

// Write history record (fire-and-forget, non-blocking)
addHistoryEntry({
  uid: auth.uid,
  jobId: job.job_id,
  siteUrl: parsed.data.url,
}).catch((err) => console.error("Failed to write scrape history:", err));
```

**Why fire-and-forget:** The history write should not block or fail the scrape response. If it fails, the user's scrape still works; they just won't see it in history.

### Pattern 4: History Status Update on Job Poll
**What:** When the job status route detects a terminal state, update the history record's status field.
**When to use:** In `GET /api/tools/brand-scraper/jobs/[id]/route.ts`, alongside the existing billing status updates.

```typescript
// In jobs/[id]/route.ts, after detecting terminal status:
import { updateHistoryStatus } from "@/lib/brand-scraper/history";

if (job.status === "succeeded" || job.status === "partial" || job.status === "failed") {
  updateHistoryStatus({
    uid: auth.uid,
    jobId: id,
    status: job.status,
  }).catch((err) => console.error("History status update failed:", err));
}
```

### Pattern 5: Asset Preview with Image Detection
**What:** Show image previews for image assets, generic file icons for non-images.
**When to use:** In the asset grid for each manifest entry.

```typescript
function isImageContentType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

// In AssetCard:
function AssetCard({ asset }: { asset: AssetManifestEntry }) {
  const isImage = isImageContentType(asset.content_type);

  return (
    <div className="rounded-lg border border-border p-3">
      {isImage && asset.signed_url ? (
        // biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames
        <img
          src={asset.signed_url}
          alt={asset.filename}
          loading="lazy"
          className="max-h-32 w-full object-contain"
        />
      ) : (
        <div className="h-32 flex items-center justify-center bg-gray-50">
          {/* File type icon */}
        </div>
      )}
      <p className="text-sm text-text-primary truncate mt-2">{asset.filename}</p>
      <p className="text-xs text-text-tertiary">{asset.category}</p>
      {asset.signed_url && (
        <a
          href={asset.signed_url}
          download={asset.filename}
          className="text-xs text-gold hover:underline mt-1 inline-block"
        >
          Download
        </a>
      )}
    </div>
  );
}
```

### Pattern 6: History API Route
**What:** A GET endpoint that returns the user's scrape history sorted by `createdAt` desc.
**When to use:** Called by the client-side ScrapeHistory component on mount.

```typescript
// src/app/api/tools/brand-scraper/history/route.ts
import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { getUserHistory } from "@/lib/brand-scraper/history";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const history = await getUserHistory(auth.uid);
  return Response.json({ entries: history });
}
```

### Anti-Patterns to Avoid
- **Fetching assets from the scraper backend directly:** All access must go through the Next.js proxy routes with auth. Never expose `BRAND_SCRAPER_API_URL` to the client.
- **Storing signed URLs in Firestore history:** Signed URLs expire (1 hour default). Only store `jobId` and re-fetch fresh URLs via the job status endpoint.
- **Using `billing_tool_usage` as history:** That collection serves billing purposes. Mixing history concerns violates separation. The `siteUrl` field does not exist there.
- **Creating a new proxy route for individual asset downloads:** The assets manifest already contains per-asset `signed_url` fields from the job status endpoint. No new proxy needed -- use the signed URLs directly.
- **Server components for authenticated data:** Both the assets page and history section need client-side auth tokens. Use client components with SWR.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job status fetching for assets page | Custom fetch + polling | `useJobStatus(jobId, token)` hook | Already handles polling, terminal detection, timeout, auth |
| Date formatting in history | Custom date logic | `date-fns` `format` / `formatDistanceToNow` | Already in dependencies, used by envelopes feature |
| Asset image detection | Regex on filename extension | Check `content_type.startsWith("image/")` | Content type from manifest is authoritative; extensions can lie |
| Zip download | Custom blob/stream handling | Existing `BrandCardDownloads` zip logic | Already implemented with loading state, error handling, temp anchor |
| Auth gating on assets page | Custom auth check | `<AuthGuard>` wrapper | Consistent pattern across all protected pages |
| Firestore collection helpers | Inline Firestore calls | Extracted helper module (like `billing/firestore.ts`) | Testable, reusable, consistent |

**Key insight:** Almost all data infrastructure is already built. Phase 30 is primarily a UI composition and Firestore collection creation task. The job status API already returns everything needed for the assets page. The only truly new backend work is the history collection.

## Common Pitfalls

### Pitfall 1: Signed URL Expiry on Assets Page
**What goes wrong:** User loads assets page, waits more than 1 hour, then clicks "Download" on an asset. The signed URL has expired and the download fails.
**Why it happens:** GCS signed URLs expire after `GCS_SIGNED_URL_EXPIRY_MS` (default 1 hour). The assets page fetches once and renders.
**How to avoid:** The `useJobStatus` hook polls every 3 seconds during non-terminal states. Once terminal, polling stops. For the assets page specifically, the user will typically view it shortly after job completion. As a safety measure, either: (a) add a "Refresh URLs" button, or (b) make SWR refetch on focus (`revalidateOnFocus: true` -- note: the current hook has this disabled). The simplest approach: since the assets page shows a completed job, a one-time fetch is sufficient for most use cases. The signed URLs have a 1-hour window which is plenty.
**Warning signs:** 403/expired URL errors when clicking download links.

### Pitfall 2: History Collection Missing Firestore Index
**What goes wrong:** The query `scrape_history.where("uid", "==", uid).orderBy("createdAt", "desc")` throws a Firestore error about missing composite index.
**Why it happens:** Firestore requires composite indexes for queries that combine equality filters with orderBy on a different field.
**How to avoid:** This specific query pattern (single equality filter + orderBy) is a single-field query in Firestore and does NOT require a composite index. Firestore automatically creates single-field indexes for all fields. The query `.where("uid", "==", uid).orderBy("createdAt", "desc")` will work without manual index creation. HOWEVER, if we add additional filters later (e.g., `.where("status", "==", "succeeded")`), a composite index would be needed.
**Warning signs:** Firestore error logs with "Missing composite index" link.

### Pitfall 3: Race Condition Between History Write and Job Status Poll
**What goes wrong:** The history entry shows `status: "queued"` even after the job has completed, because the status update in the job poll route fires asynchronously and may not have completed.
**Why it happens:** History write happens on scrape submission (status: queued). Status update happens on terminal job poll (fire-and-forget). If the user loads history before the poll triggers, they see stale status.
**How to avoid:** This is acceptable behavior. The history entry will eventually be updated when any user polls the job status to completion. For the MVP, stale status is fine because: (a) clicking "View Results" navigates to the Brand Card (which fetches live status), and (b) history is sorted by date, not status.
**Warning signs:** History showing "queued" for jobs that are actually complete.

### Pitfall 4: Token Expiry on Assets Page
**What goes wrong:** User navigates to assets page, the token used for the initial fetch expires before additional actions (zip download, etc.).
**Why it happens:** Firebase ID tokens expire after 1 hour. The assets page gets a token on mount but doesn't refresh it.
**How to avoid:** Call `user.getIdToken()` (which auto-refreshes if expired) before each fetch operation, not just once on mount. The existing `UserBrandScraperPage` stores a token from scrape submission, which works because the session is short. The assets page may have longer sessions.
**Warning signs:** 401 errors when clicking download buttons after sitting on the page.

### Pitfall 5: Assets Page Without Valid Job
**What goes wrong:** User navigates to `/apps/brand-scraper/some-invalid-id/assets` and sees a confusing error.
**Why it happens:** The `jobId` param comes from the URL and may be invalid, or the job may belong to a different user.
**How to avoid:** Handle the 404/error case gracefully. If the job status fetch returns an error, show a "Job not found" message with a link back to the scraper page. The existing job status endpoint already returns 404 for unknown jobs.
**Warning signs:** Unhandled error state on assets page.

### Pitfall 6: History Shows Other Users' Jobs
**What goes wrong:** A security issue where user A can see user B's scrape history.
**Why it happens:** The history API route does not properly filter by authenticated UID.
**How to avoid:** The history query MUST filter by `auth.uid`. The Firestore query `where("uid", "==", auth.uid)` ensures user isolation. Double-check that the API route uses `auth.uid` from `verifyUser()`, not a user-supplied parameter.
**Warning signs:** History entries appearing that the user didn't create.

## Code Examples

### Firestore History Helpers
```typescript
// Source: pattern from src/lib/billing/firestore.ts
// src/lib/brand-scraper/history.ts

import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";

function requireDb() {
  if (!db) throw new Error("Firestore not available.");
  return db;
}

function historyCol() {
  return requireDb().collection("scrape_history");
}

export type ScrapeHistoryEntry = {
  uid: string;
  jobId: string;
  siteUrl: string;
  status: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export async function addHistoryEntry(params: {
  uid: string;
  jobId: string;
  siteUrl: string;
}): Promise<void> {
  const docId = `${params.uid}_${params.jobId}`;
  await historyCol().doc(docId).set({
    uid: params.uid,
    jobId: params.jobId,
    siteUrl: params.siteUrl,
    status: "queued",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function updateHistoryStatus(params: {
  uid: string;
  jobId: string;
  status: string;
}): Promise<void> {
  const docId = `${params.uid}_${params.jobId}`;
  const ref = historyCol().doc(docId);
  const snap = await ref.get();
  if (!snap.exists) return; // No history entry to update
  await ref.update({
    status: params.status,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function getUserHistory(
  uid: string,
  limit = 20,
): Promise<(ScrapeHistoryEntry & { id: string })[]> {
  const snap = await historyCol()
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ScrapeHistoryEntry) }));
}
```

### Assets Page Client Component
```typescript
// Source: pattern from UserBrandScraperPage.tsx + useJobStatus hook
"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import type { AssetManifestEntry } from "@/lib/brand-scraper/types";

const API_BASE = "/api/tools/brand-scraper";

function AssetsPageContent({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [assets, setAssets] = useState<AssetManifestEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get fresh token
  useEffect(() => {
    user?.getIdToken().then(setToken);
  }, [user]);

  // Fetch job status (which includes assets_manifest)
  useEffect(() => {
    if (!token) return;

    async function fetchAssets() {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        setAssets(data.assets_manifest?.assets ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assets");
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, [jobId, token]);

  // Render asset grid...
}
```

### History Section in UserBrandScraperPage
```typescript
// Source: pattern from existing SWR usage in hooks.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

type HistoryEntry = {
  id: string;
  jobId: string;
  siteUrl: string;
  status: string;
  createdAt: string; // ISO string from API response
};

function ScrapeHistory() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    user?.getIdToken().then(setToken);
  }, [user]);

  const fetcher = useCallback(
    async (url: string) => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    [token],
  );

  const { data } = useSWR(
    token ? "/api/tools/brand-scraper/history" : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (!data?.entries?.length) return null;

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Recent Scrapes
      </h2>
      <div className="space-y-2">
        {data.entries.map((entry: HistoryEntry) => (
          <div key={entry.id} className="flex items-center justify-between ...">
            <div>
              <span className="text-sm text-text-primary">{new URL(entry.siteUrl).hostname}</span>
              <span className="text-xs text-text-tertiary ml-2">
                {format(new Date(entry.createdAt), "MMM d, yyyy")}
              </span>
            </div>
            <a href={`/apps/brand-scraper?jobId=${entry.jobId}`} className="text-xs text-gold">
              View Results
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Per-Asset Download via Signed URL
```typescript
// Source: pattern from BrandCardDownloads.tsx
// Direct download via signed URL -- no proxy needed
function handleAssetDownload(signedUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = signedUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
```

## Existing Code Reuse Map

### Fully Reusable (no changes needed)
| Existing Code | Reuse For | Notes |
|---------------|-----------|-------|
| `useJobStatus` hook | Assets page job fetch | Already returns `assets_manifest` with signed URLs |
| `AssetManifestEntry` Zod type | Asset display type | Has `filename`, `category`, `content_type`, `size_bytes`, `signed_url` |
| `BrandCardDownloads` zip logic | "Download Zip" button on assets page | Same POST to zip proxy, same anchor download pattern |
| `AuthGuard` component | Wrap assets page | Same pattern as brand scraper page |
| `verifyUser` auth helper | History API route | Same auth pattern as all tool routes |
| `Button` UI component | Download buttons | Same styling system |
| `JobStatusIndicator` | Loading/error states on assets page | Already handles all job statuses |
| Firestore `requireDb()` pattern | History helpers | Same singleton pattern as billing |

### Must Modify
| Existing Code | Changes | Why |
|---------------|---------|-----|
| `UserBrandScraperPage.tsx` | Add `<ScrapeHistory>` section below URL form | HIST-03 requires history below URL input |
| `src/app/api/tools/brand-scraper/scrape/route.ts` | Add history write after job submission | HIST-01 requires persistence on submission |
| `src/app/api/tools/brand-scraper/jobs/[id]/route.ts` | Add history status update on terminal states | HIST-01 requires status tracking |
| `src/lib/brand-scraper/types.ts` | Add `ScrapeHistoryEntry` type (client-side) | Type safety for history API responses |

### Must Create
| New Code | Purpose |
|----------|---------|
| `src/app/apps/brand-scraper/[jobId]/assets/page.tsx` | Server component shell for assets page route (APAG-01) |
| `src/components/tools/brand-scraper/AssetsPage.tsx` | Client component for assets display (APAG-01, APAG-02, APAG-03) |
| `src/components/tools/brand-scraper/AssetGrid.tsx` | Grid of asset cards with previews (APAG-03) |
| `src/components/tools/brand-scraper/ScrapeHistory.tsx` | History section component (HIST-03, HIST-04) |
| `src/lib/brand-scraper/history.ts` | Firestore helpers for scrape history (HIST-01, HIST-02) |
| `src/app/api/tools/brand-scraper/history/route.ts` | GET history API route (HIST-02) |

## "View Results" Navigation Strategy

HIST-04 requires that clicking "View Results" on a history entry "opens the Brand Card for that job." There are two approaches:

### Option A: Query Parameter on Existing Page (Recommended)
Navigate to `/apps/brand-scraper?jobId=xxx`. The `UserBrandScraperPage` reads the `jobId` from the URL search params and immediately enters the "viewing results" state (skipping the URL form). This reuses all existing Brand Card rendering logic.

**Advantages:**
- Reuses existing Brand Card + job status polling
- No new page needed for Brand Card viewing
- Token management already handled

**Implementation:** Add `useSearchParams()` in `UserBrandScraperPage` to check for `jobId` param on mount and auto-enter the results view.

### Option B: Separate Results Page
Create `/apps/brand-scraper/[jobId]/page.tsx` for viewing results. Duplicates Brand Card rendering.

**Disadvantage:** Code duplication.

**Recommendation:** Use Option A (query parameter approach). It requires minimal changes to `UserBrandScraperPage` and reuses all existing rendering logic.

## Firestore Collection Design

### Collection: `scrape_history`

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Firebase UID of the user who submitted the scrape |
| `jobId` | string | External job ID from the scraper service |
| `siteUrl` | string | The URL that was scraped |
| `status` | string | Job status: queued, processing, succeeded, partial, failed |
| `createdAt` | Timestamp | Server timestamp of when the scrape was submitted |
| `updatedAt` | Timestamp | Server timestamp of last status update |

**Document ID pattern:** `{uid}_{jobId}` (compound key for idempotency and direct lookup)

**Indexes needed:** None beyond automatic. The query `.where("uid", "==", uid).orderBy("createdAt", "desc")` uses the automatic single-field indexes that Firestore creates for every field.

**Data lifecycle:** History entries are write-once with status updates. No deletion policy needed for MVP. A future phase could add TTL-based cleanup if needed.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No assets page | Individual asset preview + download | Phase 30 (now) | Users can see and download individual assets |
| No user history | Firestore-backed scrape history | Phase 30 (now) | Users can revisit previous scrapes |
| Zip-only download | Per-asset signed URL download + zip option | Phase 30 (now) | More granular asset access |

## Open Questions

1. **Should the assets page show a "Back to Brand Card" link or breadcrumb?**
   - What we know: The assets page is at `/apps/brand-scraper/[jobId]/assets`, which is a child of the brand scraper route.
   - Recommendation: Yes, include a back link. Pattern exists in `about/[slug]/page.tsx` with `<- Back to About` link.

2. **Should history entries be limited to a certain count?**
   - What we know: The query uses `.limit(20)` matching the billing ledger pattern.
   - Recommendation: Start with 20 entries limit. Add pagination in a future phase if needed.

3. **Should the assets page handle jobs that are still processing?**
   - What we know: Requirements say "displays a list of extracted assets" implying completed jobs. The `assets_manifest` is only populated for terminal jobs.
   - Recommendation: If the job is still processing, show a "Job is still processing" message with a link back. If it has no assets manifest, show "No assets available."

4. **Should the "View Results" link in history need a fresh token?**
   - What we know: Navigating via query param (`?jobId=xxx`) will land on the same page where `UserBrandScraperPage` manages tokens.
   - Recommendation: The existing page already handles token acquisition via `user.getIdToken()` on scrape submission. For history-based navigation, the page will need to acquire a token on mount when it detects a `jobId` param. This is a small modification to `UserBrandScraperPage`.

## Sources

### Primary (HIGH confidence)
- `src/lib/brand-scraper/types.ts` - AssetManifestEntry schema with `signed_url`, `filename`, `category`, `content_type`, `size_bytes`
- `src/lib/brand-scraper/hooks.ts` - `useJobStatus` SWR hook pattern (polling, terminal detection)
- `src/components/tools/brand-scraper/UserBrandScraperPage.tsx` - Current page structure, token management, job flow
- `src/components/tools/brand-scraper/BrandCardDownloads.tsx` - Zip download pattern (POST proxy, anchor download)
- `src/lib/billing/firestore.ts` - Firestore collection helper pattern (`requireDb()`, collection helpers, query helpers)
- `src/lib/billing/types.ts` - `ToolUsage` type (confirms no `siteUrl` field)
- `src/app/api/tools/brand-scraper/scrape/route.ts` - Scrape submission flow (where to add history write)
- `src/app/api/tools/brand-scraper/jobs/[id]/route.ts` - Job status flow (where to add history update)
- `src/app/about/[slug]/page.tsx` - Dynamic route pattern with `params: Promise<{ slug: string }>`
- `.planning/phases/28-scraper-service-backend/28-04-SUMMARY.md` - Assets manifest API shape (snake_case fields)
- `.planning/phases/29-brand-card-progress-ui/29-RESEARCH.md` - Data flow, API response shape documentation

### Secondary (MEDIUM confidence)
- `src/lib/envelopes/firestore.ts` - Alternative Firestore collection pattern reference
- `date-fns` usage in envelopes components - Confirms `format`, `formatDistanceToNow` availability

### Tertiary (LOW confidence)
- None -- all findings verified with primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, zero new dependencies
- Architecture: HIGH - Full codebase read; clear mapping from requirements to existing code
- Firestore design: HIGH - Follows established patterns from billing collections
- Assets page: HIGH - Existing `assets_manifest` type and job status endpoint provide all needed data
- History feature: HIGH - Standard Firestore CRUD with established auth patterns
- Pitfalls: HIGH - Based on direct analysis of signed URL expiry, auth flow, Firestore query semantics

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (stable stack, all infrastructure already built)
