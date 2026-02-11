# Phase 28: Scraper Service Backend - Research

**Researched:** 2026-02-10
**Domain:** Fastify worker pipeline, GCS asset management, Drizzle/Postgres schema evolution
**Confidence:** HIGH
**Target repo:** `/Users/dweinbeck/Documents/brand-scraper/`

## Summary

The brand-scraper service is a well-structured Fastify + Drizzle + GCS pipeline that currently:
1. Processes scrape jobs via a worker handler that runs crawl -> extract -> assemble stages
2. Uploads `brand.json` and a single `assets.zip` to GCS after pipeline completion
3. Returns job status via `GET /jobs/:id` with signed URLs regenerated per-request

Phase 28 requires three major changes: (a) granular progress event emission during pipeline execution with persistent storage in `pipelineMeta` JSONB, (b) individual asset uploads to GCS (instead of batch zip), with an assets manifest in the DB, and (c) on-demand zip generation via a new endpoint. The existing architecture supports all of this cleanly -- the `PipelineContext` is a mutable context threaded through all stages, the `pipelineMeta` JSONB column already stores stage data, and `archiver` is already a dependency.

**Primary recommendation:** Thread a database reference and job ID into the pipeline context so stages can emit progress events directly. Upload assets individually during the download phase (replacing temp-dir-then-zip). Store manifest in a new `assetsManifest` JSONB column. Add `POST /jobs/:id/assets/zip` that streams archiver output directly to GCS.

## Scraper Service Architecture (Current State)

### Service Layout
```
brand-scraper/
  src/
    api/                    # Fastify API server (port 8080)
      server.ts             # App factory + startup
      routes/scrape.ts      # POST /scrape - job submission
      routes/jobs.ts        # GET /jobs/:id - status polling
      routes/health.ts      # GET /health
      plugins/database.ts   # Drizzle DB decoration
      plugins/error-handler.ts
    worker/                 # Fastify worker server (port 8081)
      server.ts             # Dispatch endpoint + startup
      handler.ts            # Job lifecycle: processing -> GCS -> webhook
    pipeline/               # Core scraping pipeline
      orchestrator.ts       # crawl -> extract -> assemble orchestration
      context.ts            # PipelineContext (mutable, threaded through stages)
      crawl/                # Browser crawling (Playwright)
      extract/              # Parallel extractors (color, typography, logo, design-tokens)
      assemble/             # Taxonomy assembly + validation
      package/              # Asset downloading + archiving
        downloader.ts       # Sequential asset download with validation
        archiver.ts         # ZIP packaging (used by CLI only currently)
    delivery/               # Post-pipeline delivery
      gcs.ts                # Upload brand.json + assets.zip, generate signed URLs
      dispatch.ts           # Cloud Tasks or direct HTTP dispatch
      webhook.ts            # HMAC-signed webhook delivery
    db/
      schema.ts             # Drizzle schema (single `jobs` table)
      client.ts             # Pool + Drizzle instance factory
      migrate.ts            # Migration runner
    schema/
      taxonomy.ts           # BrandTaxonomy Zod schema (THE contract)
      pipeline.ts           # StageResult, PipelineResult types
      extraction.ts         # ExtractionResult type
    shared/
      errors.ts             # ErrorCodes enum + StageError class
      logger.ts             # Pino logger factory
```

### Dual-Server Architecture
- **API server** (port 8080): Receives job submissions, serves job status
- **Worker server** (port 8081): Receives dispatch calls, runs pipeline asynchronously
- Both share the same DB schema and Drizzle client

### Current Flow
1. `POST /scrape` creates job in DB (status: queued), dispatches to worker
2. Worker receives dispatch, calls `handleJob()` which:
   a. Sets status to `processing`
   b. Runs `runPipeline()` (crawl -> extract -> assemble)
   c. Stores taxonomy in `result` column, stage timings in `pipeline_meta`
   d. Downloads assets to temp dir, creates in-memory ZIP
   e. Uploads `brand.json` + `assets.zip` to GCS
   f. Fires webhook if configured
3. `GET /jobs/:id` returns job with fresh signed URLs

## Current DB Schema

**Confidence: HIGH** (read directly from `src/db/schema.ts`)

```typescript
// jobs table columns:
id: text (PK, nanoid)
siteUrl: text (NOT NULL)
webhookUrl: text (nullable)
status: pgEnum("queued" | "processing" | "succeeded" | "failed" | "partial")
createdAt: timestamp with TZ (default now)
startedAt: timestamp with TZ
completedAt: timestamp with TZ
timeoutAt: timestamp with TZ
result: jsonb (full taxonomy JSON)
error: jsonb ({ code, message, stage })
pipelineMeta: jsonb ({ stages: [{stage, status, duration_ms}], pages_sampled, duration_ms })
gcsBrandJsonUri: text (gs://bucket/jobs/{id}/brand.json)
gcsAssetsZipUri: text (gs://bucket/jobs/{id}/assets.zip)
webhookStatus: text
webhookAttempts: integer
webhookError: text
webhookLastAttemptAt: timestamp with TZ
```

### Existing Migrations
- `0000_brief_red_skull.sql`: Initial table creation
- `0001_thin_komodo.sql`: Added GCS URIs + webhook columns

### PipelineMeta Shape (Current)
```typescript
type PipelineMeta = {
  stages?: Array<{ stage: string; status: string; duration_ms: number }>;
  pages_sampled?: number;
  duration_ms?: number;
};
```

This type needs extending to include an `events` array.

## Current GCS Helpers

**Confidence: HIGH** (read directly from `src/delivery/gcs.ts`)

Two functions exist:
1. `uploadResults(bucket, jobId, brandJsonBuffer, assetsZipBuffer, expiryMs)` - Uploads brand.json and optional assets.zip, returns URIs + signed URLs
2. `generateSignedUrl(bucket, objectPath, expiryMs)` - Generates a fresh signed URL for an existing GCS object

**Key details:**
- Uses singleton `Storage()` instance (reuses gRPC channels)
- Path convention: `jobs/{jobId}/brand.json` and `jobs/{jobId}/assets.zip`
- V4 signed URLs with configurable expiry (default 1 hour)
- No batch signed URL API exists in `@google-cloud/storage` -- must use `Promise.all()` for parallel generation

### New GCS path convention needed:
```
jobs/{jobId}/brand.json          # existing, keep
jobs/{jobId}/assets/{category}/{filename}  # NEW: individual assets
jobs/{jobId}/assets.zip          # ON-DEMAND: created by zip endpoint
```

## Current Worker Handler

**Confidence: HIGH** (read directly from `src/worker/handler.ts`)

The `handleJob` function currently:
1. Sets status to "processing" (single DB update)
2. Runs pipeline (NO intermediate DB updates during processing)
3. On completion: stores result + pipelineMeta (single DB update)
4. Downloads assets to temp dir, creates in-memory ZIP via `archiver`
5. Uploads brand.json + assets.zip via `uploadResults()`
6. Updates DB with GCS URIs
7. Fires webhook

**Critical observation:** The handler does NOT update `pipelineMeta` during processing -- only once at the end. Phase 28 requires INCREMENTAL updates during processing.

### Asset Flow (Current)
```
extractDownloadableAssets(taxonomy) -> [{url, type, rank}]
  -> mkdtemp() -> downloadAssets(assets, tempDir, ctx)
  -> createInMemoryZip(tempDir)
  -> uploadResults(bucket, jobId, brandJsonBuffer, assetsZipBuffer)
```

This needs to change to: download each asset -> upload individually to GCS -> build manifest -> store manifest in DB.

## Current API Response Shape

**Confidence: HIGH** (read directly from `src/api/routes/jobs.ts`)

```json
{
  "job_id": "string",
  "site_url": "string",
  "status": "queued | processing | succeeded | failed | partial",
  "created_at": "ISO string",
  "started_at": "ISO string | null",
  "completed_at": "ISO string | null",
  "result": { /* full taxonomy */ } | null,
  "error": { "code": "string", "message": "string", "stage": "string" } | null,
  "pipeline_meta": { "stages": [...], "pages_sampled": N, "duration_ms": N } | null,
  "brand_json_url": "signed URL | null",
  "assets_zip_url": "signed URL | null",
  "webhook_status": "string | null"
}
```

**Phase 28 additions to response:**
- `pipeline_meta.events`: array of progress events
- `assets_manifest`: array of asset entries with signed URLs
- `brand_json_url` must continue working (no regression)

## Real Taxonomy Shape

**Confidence: HIGH** (read from `output/brand.json` and `src/schema/taxonomy.ts`)

Asset categories in the taxonomy:
- `taxonomy.assets.logos[]` - Each has `value.url`, `value.type`, `value.format`, `value.sizes`
- `taxonomy.assets.favicons[]` - Same shape
- `taxonomy.assets.og_images[]` - Same shape

Asset types (from `AssetEntrySchema`):
- `logo`, `favicon`, `apple_touch_icon`, `og_image`, `twitter_image`, `manifest_icon`

Current downloader categories map:
- logos -> `logos/` directory
- favicons -> `favicons/` directory
- og_images -> `og/` directory

## Implementation Approach: Progress Events

### Event Types
Based on the pipeline stages and the requirements (page_started, page_done, asset_saved, asset_failed):

```typescript
type ProgressEvent = {
  type: "pipeline_started" | "page_started" | "page_done" | "extract_done" |
        "asset_started" | "asset_saved" | "asset_failed" | "assembly_done" |
        "pipeline_done";
  timestamp: string;  // ISO 8601
  detail?: Record<string, unknown>;
};
```

### Emission Points in the Pipeline

1. **pipeline_started** - At start of `handleJob` (when status transitions to "processing")
2. **page_started** - Before `crawlPage()` call in `orchestrator.ts` (homepage + each sampled page)
3. **page_done** - After successful page crawl + extraction (or on page failure)
4. **extract_done** - After all extractors complete for the current page
5. **asset_started** / **asset_saved** / **asset_failed** - In the asset download+upload loop (new)
6. **assembly_done** - After `assembleTaxonomy()` completes
7. **pipeline_done** - At end of `handleJob`

### How to Thread DB Access into Pipeline

**Option A (recommended): Event emitter callback**
Pass an `onEvent` callback into the pipeline context. The handler provides an implementation that appends to an in-memory array AND writes to DB.

```typescript
// In context.ts
export interface PipelineContext {
  // ... existing fields
  onEvent?: (event: ProgressEvent) => Promise<void>;
}
```

This is preferred because:
- Pipeline stays DB-agnostic (testable without DB)
- Handler controls persistence strategy
- No need to pass `db` deep into pipeline internals

**Option B: Pass db + jobId into context**
Tighter coupling, simpler code, but makes pipeline depend on DB.

### DB Persistence Strategy

Use a helper function in the handler that:
1. Appends event to an in-memory array
2. Writes the updated array to `pipelineMeta.events` via SQL UPDATE
3. Caps stored events at ~200 by trimming oldest

```typescript
async function emitEvent(
  db: Database,
  jobId: string,
  events: ProgressEvent[],
  event: ProgressEvent,
): Promise<void> {
  events.push(event);
  // Cap at 200 events
  const capped = events.length > 200 ? events.slice(-200) : events;
  await db.update(jobs).set({
    pipelineMeta: sql`jsonb_set(
      COALESCE(pipeline_meta, '{}'::jsonb),
      '{events}',
      ${JSON.stringify(capped)}::jsonb
    )`
  }).where(eq(jobs.id, jobId));
}
```

**Alternative (simpler):** Just read-modify-write the entire pipelineMeta. Since only one worker processes a job, there's no concurrency concern.

### Extended PipelineMeta Type

```typescript
export type PipelineMeta = {
  stages?: Array<{ stage: string; status: string; duration_ms: number }>;
  pages_sampled?: number;
  duration_ms?: number;
  events?: ProgressEvent[];  // NEW
};

export type ProgressEvent = {
  type: string;
  timestamp: string;
  detail?: Record<string, unknown>;
};
```

## Implementation Approach: Individual Asset Uploads

### New Flow
Replace the current temp-dir-then-zip approach in `handleJob`:

```
For each downloadable asset:
  1. Download asset to buffer (reuse existing download logic)
  2. Upload buffer to GCS: jobs/{jobId}/assets/{category}/{filename}
  3. Emit asset_saved or asset_failed event
  4. Build manifest entry
Store manifest in DB (assetsManifest column)
```

### GCS Upload Helper (New)

Add a function to `gcs.ts`:

```typescript
export async function uploadAsset(
  bucketName: string,
  jobId: string,
  category: string,      // "logos" | "favicons" | "og"
  filename: string,       // "primary.svg", "favicon.png"
  buffer: Buffer,
  contentType: string,
): Promise<{ gcsUri: string; objectPath: string }> {
  const objectPath = `jobs/${jobId}/assets/${category}/${filename}`;
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectPath);
  await file.save(buffer, { contentType });
  return {
    gcsUri: `gs://${bucketName}/${objectPath}`,
    objectPath,
  };
}
```

### Assets Manifest Schema

```typescript
type AssetsManifest = {
  assets: Array<{
    category: string;        // "logos" | "favicons" | "og"
    filename: string;        // "primary.svg"
    originalUrl: string;     // source URL
    contentType: string;     // "image/svg+xml"
    sizeBytes: number;
    gcsObjectPath: string;   // "jobs/{jobId}/assets/logos/primary.svg"
  }>;
  totalCount: number;
  totalSizeBytes: number;
  createdAt: string;         // ISO timestamp
};
```

### Signed URL Generation for Manifest

When returning the manifest via `GET /jobs/:id`, generate signed URLs for each asset on-demand:

```typescript
// Use Promise.all for parallel signed URL generation
const assetsWithUrls = await Promise.all(
  manifest.assets.map(async (asset) => ({
    ...asset,
    signed_url: await generateSignedUrl(bucket, asset.gcsObjectPath, expiryMs),
  }))
);
```

**Performance note:** For a job with ~20 assets, this means ~20 parallel `getSignedUrl()` calls. Each takes ~50-100ms. With `Promise.all`, total wall time is ~100-200ms, acceptable for a polling endpoint.

## Implementation Approach: On-Demand Zip

### Endpoint Design
```
POST /jobs/:id/assets/zip
Response: { zip_url: "signed GCS URL" }
```

### Streaming Approach (Recommended)

Pipe `archiver` output directly to a GCS write stream. This avoids buffering the entire zip in memory:

```typescript
import archiver from "archiver";

async function createAndUploadZip(
  bucketName: string,
  jobId: string,
  manifest: AssetsManifest,
): Promise<string> {
  const bucket = storage.bucket(bucketName);

  // Read each asset from GCS and add to archive
  const archive = archiver("zip", { zlib: { level: 6 } });
  const zipPath = `jobs/${jobId}/assets.zip`;
  const zipFile = bucket.file(zipPath);
  const writeStream = zipFile.createWriteStream({
    contentType: "application/zip",
    resumable: false,  // Zip is likely < 10MB
  });

  const done = new Promise<void>((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(writeStream);

  // Add each asset from GCS
  for (const asset of manifest.assets) {
    const file = bucket.file(asset.gcsObjectPath);
    const [buffer] = await file.download();
    archive.append(buffer, { name: `${asset.category}/${asset.filename}` });
  }

  // Also add brand.json
  const brandFile = bucket.file(`jobs/${jobId}/brand.json`);
  const [brandBuffer] = await brandFile.download();
  archive.append(brandBuffer, { name: "brand.json" });

  await archive.finalize();
  await done;

  // Generate signed URL
  const [signedUrl] = await zipFile.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + (Number(process.env.GCS_SIGNED_URL_EXPIRY_MS) || 3_600_000),
  });

  return signedUrl;
}
```

### Caching Strategy

Store `gcsAssetsZipUri` in the DB after first zip creation. On subsequent requests, check if the zip already exists before recreating:

```typescript
// In the endpoint:
if (job.gcsAssetsZipUri) {
  // Zip already exists, just generate fresh signed URL
  const signedUrl = await generateSignedUrl(bucket, zipPath, expiryMs);
  return { zip_url: signedUrl };
}
// Otherwise create zip, store URI, return URL
```

**Caveat:** If assets change (unlikely for completed jobs), cached zip becomes stale. Since jobs are immutable after completion, this is safe.

## Migration Plan

### New DB Columns

Add to `src/db/schema.ts`:

```typescript
/** GCS prefix for individual assets (e.g., jobs/{jobId}/assets/) */
gcsAssetsPrefix: text("gcs_assets_prefix"),

/** Assets manifest with metadata for all uploaded assets */
assetsManifest: jsonb("assets_manifest").$type<AssetsManifest>(),
```

### Generate Migration

```bash
cd /Users/dweinbeck/Documents/brand-scraper
npx drizzle-kit generate
```

This will create migration `0002_*.sql` with:
```sql
ALTER TABLE "jobs" ADD COLUMN "gcs_assets_prefix" text;
ALTER TABLE "jobs" ADD COLUMN "assets_manifest" jsonb;
```

### Migration Process
The project uses `drizzle-kit generate` + `drizzle-kit migrate`. The workflow is:
1. Update `src/db/schema.ts`
2. Run `npx drizzle-kit generate` (creates SQL file + snapshot)
3. Run `npx drizzle-kit migrate` or `drizzle-kit push` to apply

**Note:** The existing `gcsAssetsZipUri` column should be KEPT (not removed) -- it will continue to store the URI of on-demand zips.

## Standard Stack

### Core (Already in use)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| fastify | ^5.7.4 | HTTP server (API + worker) | Existing |
| drizzle-orm | ^0.45.1 | ORM + query builder | Existing |
| @google-cloud/storage | ^7.19.0 | GCS uploads + signed URLs | Existing |
| archiver | ^7.0.1 | ZIP creation | Existing |
| zod | ^4.3.0 | Schema validation | Existing |
| pino | ^9.6.0 | Structured logging | Existing |

### No New Dependencies Needed

All required functionality is covered by existing dependencies:
- **archiver** for on-demand zip (already installed, already used in handler.ts)
- **@google-cloud/storage** for individual asset uploads and streaming zip (already installed)
- **drizzle-orm** for schema evolution and JSONB operations (already installed)
- **zod** for new schema validation (already installed)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP creation | Custom zip implementation | `archiver` (already a dep) | Handles streaming, compression levels, error handling |
| GCS signed URLs | Custom token generation | `@google-cloud/storage` getSignedUrl v4 | Handles key rotation, expiry, URL encoding |
| DB migrations | Manual ALTER TABLE | `drizzle-kit generate` | Generates migration + snapshot, tracks state |
| JSONB updates | Raw SQL string building | Drizzle's `sql` template literal | SQL injection protection, type safety |
| Content-type detection | Manual header parsing | Reuse existing `validateImageContent()` | Already handles magic bytes for all image types |

## Common Pitfalls

### Pitfall 1: N+1 Signed URL Generation
**What goes wrong:** Generating signed URLs sequentially for 20+ assets makes GET /jobs/:id slow (~2-3 seconds).
**Why it happens:** Each `getSignedUrl()` call is an independent async operation.
**How to avoid:** Use `Promise.all()` to parallelize all signed URL generations.
**Warning signs:** GET /jobs/:id latency > 500ms for completed jobs.

### Pitfall 2: Unbounded Event Array in pipelineMeta
**What goes wrong:** A job that processes many pages accumulates hundreds of events, bloating the JSONB column.
**Why it happens:** Each page generates page_started + page_done + N asset events.
**How to avoid:** Cap the events array at 200 entries, trimming oldest when exceeded.
**Warning signs:** `pipeline_meta` column size exceeding 100KB per row.

### Pitfall 3: DB Updates During Pipeline Blocking Worker
**What goes wrong:** Frequent DB writes (one per event) slow down the pipeline.
**Why it happens:** Each event persists with a full row UPDATE.
**How to avoid:** Batch events -- accumulate in memory, flush to DB every N events or every M seconds. For this use case, one DB write per major event (page_started/page_done/asset_saved) is acceptable since there are typically 5-25 such events per job.
**Warning signs:** Pipeline duration increasing significantly vs. pre-Phase-28 baseline.

### Pitfall 4: Regression on brand_json_url
**What goes wrong:** Changing the GCS upload flow breaks the existing brand.json upload path.
**Why it happens:** Refactoring `uploadResults()` to handle individual assets could accidentally remove brand.json upload.
**How to avoid:** Keep `uploadResults()` for brand.json, add NEW functions for individual assets. The brand.json upload path should remain untouched. Test that `brand_json_url` still appears in GET /jobs/:id response.
**Warning signs:** brand_json_url returning null for completed jobs.

### Pitfall 5: Archiver Stream Error Handling
**What goes wrong:** Archiver stream errors during zip creation leave orphaned GCS objects or hang the request.
**Why it happens:** Stream error events must be handled on both the archive and the GCS write stream.
**How to avoid:** Listen for `error` on both archive and writeStream. Wrap in try/catch with cleanup.
**Warning signs:** Zip endpoint hanging or returning 500 without cleanup.

### Pitfall 6: Missing Content-Type on GCS Upload
**What goes wrong:** Assets uploaded without proper content-type headers can't be viewed in browsers.
**Why it happens:** The downloader knows the content-type but it must be passed through to GCS upload.
**How to avoid:** Carry `contentType` from the download result through to the GCS `file.save()` call.
**Warning signs:** Assets downloading as `application/octet-stream` instead of `image/png`.

## Architecture Patterns

### Pattern 1: Event Emitter Callback
**What:** Pass an async callback into the pipeline context for event emission.
**When to use:** When the pipeline needs to notify the handler without knowing about DB.
```typescript
// handler.ts creates the callback
const events: ProgressEvent[] = [];
ctx.onEvent = async (event) => {
  events.push(event);
  const capped = events.length > 200 ? events.slice(-200) : events;
  await db.update(jobs).set({
    pipelineMeta: sql`jsonb_set(
      COALESCE(pipeline_meta, '{}'::jsonb),
      '{events}',
      ${JSON.stringify(capped)}::jsonb
    )`
  }).where(eq(jobs.id, jobId));
};

// orchestrator.ts emits events
await ctx.onEvent?.({ type: "page_started", timestamp: new Date().toISOString(), detail: { url: pageUrl } });
```

### Pattern 2: Upload-As-You-Go Assets
**What:** Upload each asset to GCS immediately after download, building manifest incrementally.
**When to use:** Replacing the batch temp-dir-then-zip approach.
```typescript
// In handler.ts, after pipeline completes:
for (const asset of downloadableAssets) {
  const downloadResult = await downloadSingleAssetToBuffer(asset, ctx);
  if (downloadResult.success) {
    const gcsResult = await uploadAsset(bucket, jobId, category, filename, downloadResult.buffer, downloadResult.contentType);
    manifestEntries.push({ ...metadata, gcsObjectPath: gcsResult.objectPath });
    await ctx.onEvent?.({ type: "asset_saved", timestamp: new Date().toISOString(), detail: { filename } });
  } else {
    await ctx.onEvent?.({ type: "asset_failed", timestamp: new Date().toISOString(), detail: { url: asset.url, error: downloadResult.error } });
  }
}
```

### Pattern 3: Stream ZIP to GCS
**What:** Pipe archiver output directly to GCS write stream (no in-memory buffer).
**When to use:** On-demand zip creation endpoint.
```typescript
const archive = archiver("zip", { zlib: { level: 6 } });
const writeStream = bucket.file(zipPath).createWriteStream({
  contentType: "application/zip",
  resumable: false,
});
archive.pipe(writeStream);
// Add files from GCS...
await archive.finalize();
```

### Anti-Patterns to Avoid
- **Modifying orchestrator.ts to import DB modules:** Keep pipeline DB-agnostic. Use callbacks.
- **Removing the in-memory zip from handler.ts without replacing it:** The zip endpoint must exist before removing the auto-zip.
- **Storing signed URLs in the DB:** Signed URLs expire. Always generate on-demand from stored GCS URIs/paths.
- **Creating a separate events table:** Overkill for this scale. JSONB array in pipelineMeta is sufficient.

## Key Files to Modify

| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add `gcsAssetsPrefix` and `assetsManifest` columns + types |
| `src/pipeline/context.ts` | Add `onEvent` callback to PipelineContext interface |
| `src/pipeline/orchestrator.ts` | Emit page_started/page_done/extract_done events via onEvent |
| `src/worker/handler.ts` | Major refactor: event wiring, individual asset uploads, manifest building |
| `src/delivery/gcs.ts` | Add `uploadAsset()` and `createOnDemandZip()` functions |
| `src/api/routes/jobs.ts` | Extend response with events + assets manifest + signed URLs |
| `src/api/routes/zip.ts` | NEW: POST /jobs/:id/assets/zip endpoint |
| `src/shared/errors.ts` | Add new error codes if needed (e.g., ZIP_CREATION_FAILED) |

## Key Files NOT to Modify

| File | Reason |
|------|--------|
| `src/pipeline/extract/runner.ts` | Extractors don't need to know about events |
| `src/pipeline/crawl/crawler.ts` | Crawling logic is fine; events emit from orchestrator |
| `src/delivery/webhook.ts` | Webhook payload may extend in Phase 29 (not this phase) |
| `src/api/routes/scrape.ts` | Job submission unchanged |
| `src/pipeline/package/downloader.ts` | Need to refactor but the CORE download logic stays. May extract buffer-returning variant. |

## Consumer Compatibility (Main Site)

**Confidence: HIGH** (read from `src/lib/brand-scraper/types.ts` in personal-brand repo)

The main site's `jobStatusSchema` uses `.passthrough()`, so new fields in the response will be tolerated:
```typescript
export const jobStatusSchema = z.object({
  job_id: z.string(),
  status: z.string(),
  result: brandTaxonomySchema.nullish(),
  error: z.string().nullish(),
  brand_json_url: z.string().nullish(),
  assets_zip_url: z.string().nullish(),
}).passthrough();
```

This means Phase 28 can safely add `pipeline_meta`, `events`, and `assets_manifest` fields without breaking the main site's polling. The main site will ignore unknown fields until Phase 27 (frontend changes) consumes them.

## Open Questions

1. **Should the zip endpoint require authentication?**
   - What we know: Current endpoints have no auth (rely on Cloud Run IAM)
   - Recommendation: Match existing pattern (no app-level auth). Cloud Run IAM handles it.

2. **Should events include asset download progress (e.g., bytes downloaded)?**
   - What we know: Requirements specify page_started, page_done, asset_saved, asset_failed
   - Recommendation: Start with the four required event types. Adding byte-level progress would require streaming download observation, which adds complexity for marginal benefit.

3. **Should the downloader be refactored to return buffers instead of writing to disk?**
   - What we know: Current `downloadSingleAsset()` writes to disk. For GCS upload, we need the buffer.
   - Recommendation: Create a new `downloadAssetToBuffer()` function that returns `{ buffer, contentType, sizeBytes }`. Keep the existing disk-writing function for CLI usage.

## Sources

### Primary (HIGH confidence)
- `src/db/schema.ts` - Full schema definition with column types
- `src/worker/handler.ts` - Complete job lifecycle including GCS upload flow
- `src/delivery/gcs.ts` - GCS upload and signed URL generation
- `src/pipeline/orchestrator.ts` - Full pipeline flow (crawl -> extract -> assemble)
- `src/pipeline/context.ts` - PipelineContext interface definition
- `src/api/routes/jobs.ts` - GET /jobs/:id response shape
- `src/schema/taxonomy.ts` - BrandTaxonomy Zod schema (asset types)
- `src/pipeline/package/downloader.ts` - Asset download logic with validation
- `output/brand.json` - Real taxonomy output from 3m.com scrape
- `package.json` - All dependencies confirmed (archiver ^7.0.1, @google-cloud/storage ^7.19.0)

### Secondary (MEDIUM confidence)
- [Drizzle ORM migration docs](https://orm.drizzle.team/docs/migrations) - Migration workflow
- [GCS Streaming uploads docs](https://docs.cloud.google.com/storage/docs/streaming-uploads) - Stream to GCS pattern
- [GCS Node.js File docs](https://googleapis.dev/nodejs/storage/latest/File.html) - createWriteStream API

### Tertiary (LOW confidence)
- [GCS batch signed URLs issue](https://github.com/googleapis/nodejs-storage/issues/2077) - No batch API confirmed
- [archiver GitHub](https://github.com/archiverjs/node-archiver) - Streaming interface docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, versions confirmed from package.json
- Architecture: HIGH - Full codebase read, all files analyzed
- DB Schema: HIGH - Direct read of schema.ts and migration files
- Pitfalls: MEDIUM - Based on architectural analysis and common patterns
- On-demand zip: MEDIUM - Stream-to-GCS pattern verified via docs but not tested

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (stable stack, unlikely to change)
