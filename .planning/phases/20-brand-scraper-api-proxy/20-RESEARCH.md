# Phase 20: Brand Scraper API Proxy - Research

**Researched:** 2026-02-08
**Domain:** Next.js API route proxy to external Fastify service, Zod response validation, Firebase admin auth
**Confidence:** HIGH

## Summary

This phase builds the server-side plumbing for the brand scraper feature: two API routes that proxy requests to the deployed Brand Scraper Fastify service on Cloud Run, a typed HTTP client, and Zod schemas for response validation. This is a carbon copy of the existing chatbot proxy pattern (`src/app/api/assistant/chat/route.ts` + `src/lib/assistant/fastapi-client.ts` + `src/lib/schemas/fastapi.ts`) adapted for a different external service with async job semantics (submit job, poll status).

The codebase already contains every pattern needed. The `verifyAdmin()` function in `src/lib/auth/admin.ts` handles Bearer token extraction and Firebase ID token verification. The `FastApiError` class and `askFastApi()` function in `src/lib/assistant/fastapi-client.ts` demonstrate the typed client pattern with timeout handling, Zod validation, and custom error class. The Zod schema pattern in `src/lib/schemas/fastapi.ts` shows how to validate external API responses. No new dependencies are required for this phase.

The key difference from the chatbot proxy is the async job model: the brand scraper returns a job ID on submission, and the client polls a status endpoint until the job reaches a terminal state. This requires two API routes instead of one, and the Zod schemas must handle multiple response shapes (submission response, in-progress status, completed result with BrandTaxonomy data).

**Primary recommendation:** Mirror the fastapi-client.ts pattern exactly for a typed BrandScraperClient, with two API routes at `/api/admin/brand-scraper/scrape` and `/api/admin/brand-scraper/jobs/[id]`, both guarded by `verifyAdmin()`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | `^4.3.6` | Validate external API responses with typed schemas | Already used for all schema validation in this project (fastapi, contact, content, assistant) |
| `firebase-admin` | (existing) | `verifyIdToken()` for server-side admin auth | Already used by `verifyAdmin()` in `src/lib/auth/admin.ts` |
| Next.js API Routes | 16.1.6 | HTTP handler for proxy endpoints | Already used for chatbot proxy at `src/app/api/assistant/chat/route.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Web Fetch API | (built-in) | HTTP requests to Fastify service | Used by `askFastApi()` pattern; no `axios` or other library needed |
| `AbortSignal.timeout()` | (built-in) | Request timeout for external service calls | Already used in `fastapi-client.ts` with 15s timeout |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw fetch in client.ts | `ky` or `ofetch` | Adds dependency for no benefit; the existing pattern uses raw fetch with 15 lines of error handling |
| Zod `.safeParse()` | Manual type guards | Zod provides better error messages and type inference; already the project standard |
| `verifyAdmin()` per-route | Middleware | Next.js 16 middleware runs at the edge; Firebase Admin SDK requires Node.js runtime |

**Installation:**
```bash
# No new packages needed for this phase
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    api/
      admin/
        brand-scraper/
          scrape/
            route.ts          # POST handler - submit scrape job
          jobs/
            [id]/
              route.ts        # GET handler - poll job status
  lib/
    brand-scraper/
      client.ts               # Typed HTTP client for Fastify service
      types.ts                 # Zod schemas + TypeScript types for BrandTaxonomy
```

### Pattern 1: API Route Proxy with Admin Auth
**What:** A Next.js API route that verifies the Firebase ID token, then forwards the request to an external Cloud Run service. The external service URL is kept server-side via an environment variable.
**When to use:** Any time the frontend needs to call an external service that should not be called directly from the browser (CORS avoidance, secret isolation, auth at the proxy layer).
**Example:**
```typescript
// Source: existing pattern in src/app/api/assistant/chat/route.ts
// Adapted for brand scraper POST /scrape

import { verifyAdmin, unauthorizedResponse } from "@/lib/auth/admin";
import { submitScrapeJob, BrandScraperError } from "@/lib/brand-scraper/client";

export async function POST(request: Request) {
  // 1. Auth check
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }

  // 2. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // 3. Validate with Zod
  const parsed = scrapeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // 4. Proxy to external service
  try {
    const result = await submitScrapeJob(parsed.data.url);
    return Response.json(result);
  } catch (err) {
    if (err instanceof BrandScraperError) {
      return Response.json(
        { error: err.message },
        { status: err.status >= 500 ? 502 : err.status },
      );
    }
    return Response.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
```

### Pattern 2: Typed HTTP Client with Zod Validation
**What:** A module that encapsulates all HTTP communication with an external service, validates responses with Zod, and throws typed errors.
**When to use:** Any external API integration where response shape must be validated at runtime.
**Example:**
```typescript
// Source: existing pattern in src/lib/assistant/fastapi-client.ts

const BRAND_SCRAPER_API_URL = process.env.BRAND_SCRAPER_API_URL;

export class BrandScraperError extends Error {
  constructor(
    message: string,
    public status: number,
    public isTimeout: boolean = false,
  ) {
    super(message);
    this.name = "BrandScraperError";
  }
}

export async function submitScrapeJob(url: string): Promise<ScrapeJobSubmission> {
  if (!BRAND_SCRAPER_API_URL) {
    throw new BrandScraperError("BRAND_SCRAPER_API_URL not configured", 503);
  }

  let res: Response;
  try {
    res = await fetch(`${BRAND_SCRAPER_API_URL}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_url: url }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
    throw new BrandScraperError(
      isTimeout ? "Request timed out" : "Network error",
      503,
      isTimeout,
    );
  }

  if (!res.ok) {
    throw new BrandScraperError(`Brand scraper returned ${res.status}`, res.status);
  }

  const raw = await res.json();
  const parsed = scrapeJobSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new BrandScraperError("Invalid response shape from brand scraper", 502);
  }

  return parsed.data;
}
```

### Pattern 3: Zod Schemas for External API Responses
**What:** Zod schemas that define the expected shape of external API responses. Use `.safeParse()` to validate at runtime and surface clear errors when the external service returns unexpected data.
**When to use:** Any external API response that is not under your control.
**Example:**
```typescript
// Source: existing pattern in src/lib/schemas/fastapi.ts
import { z } from "zod";

// POST /scrape response
export const scrapeJobSubmissionSchema = z.object({
  job_id: z.string(),
  status: z.string(),
});

// GET /jobs/:id response - varies by status
export const jobStatusSchema = z.object({
  job_id: z.string(),
  status: z.enum(["queued", "processing", "succeeded", "partial", "failed"]),
  result: z.unknown().optional(),         // BrandTaxonomy when succeeded
  error: z.string().optional(),           // Error message when failed
  brand_json_url: z.string().optional(),  // GCS signed URL
  assets_zip_url: z.string().optional(),  // GCS signed URL
});

export type ScrapeJobSubmission = z.infer<typeof scrapeJobSubmissionSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
```

### Pattern 4: Dynamic Route Segment for Job ID
**What:** Next.js App Router uses `[id]` folder naming for dynamic route segments. The `params` are passed to the route handler as a Promise (Next.js 16).
**When to use:** Any route that needs a dynamic path parameter.
**Example:**
```typescript
// src/app/api/admin/brand-scraper/jobs/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // ... use id to poll job status
}
```

### Anti-Patterns to Avoid
- **Exposing BRAND_SCRAPER_API_URL to the client:** Never use `NEXT_PUBLIC_` prefix. The URL stays server-side, accessed only by the API route and client module.
- **Skipping auth on GET (poll) routes:** Both POST (submit) and GET (poll) routes must call `verifyAdmin()`. An unauthenticated user could poll arbitrary job IDs to access brand data otherwise.
- **Using Server Actions for the brand scraper:** Server Actions are for form mutations. The brand scraper needs async job submission and polling, which requires `fetch` calls from the client to API routes. Server Actions do not support polling.
- **Creating a unified "admin API client" abstraction:** The brand scraper client and chatbot client have different APIs, response shapes, and error handling. Keep them as separate typed clients.
- **Hardcoding the Fastify URL in route handlers:** Always read from `process.env.BRAND_SCRAPER_API_URL` in the client module, following the `CHATBOT_API_URL` pattern.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Admin auth verification | Custom token parsing | `verifyAdmin()` from `src/lib/auth/admin.ts` | Already handles Bearer extraction, Firebase verification, email check, error responses |
| Unauthorized response formatting | Custom error responses | `unauthorizedResponse()` from `src/lib/auth/admin.ts` | Already formats JSON error with correct status code |
| Request timeout handling | `setTimeout` + `AbortController` | `AbortSignal.timeout(ms)` | Built-in API, already used in `fastapi-client.ts` |
| Response validation | Manual type checks | Zod `.safeParse()` | Already the project standard, provides typed output and error details |
| Error class for external service | Generic `Error` | Custom `BrandScraperError` (mirror `FastApiError`) | Carries status code and timeout flag, enables specific error handling in route |

**Key insight:** This phase is almost entirely pattern replication. The chatbot proxy established every pattern needed. The only novelty is the two-endpoint async job model (submit + poll) vs the chatbot's single-endpoint synchronous model.

## Common Pitfalls

### Pitfall 1: Missing Auth on Poll Route
**What goes wrong:** Developer adds `verifyAdmin()` to the POST route (submit job) but forgets it on the GET route (poll status). An unauthenticated user can guess or enumerate job IDs and access brand taxonomy results.
**Why it happens:** The poll route "just returns status" which feels less sensitive than the submit route.
**How to avoid:** Both routes MUST call `verifyAdmin()` as the first operation. Copy the exact same auth block to both route handlers.
**Warning signs:** The GET route handler does not import `verifyAdmin`.

### Pitfall 2: Zod Schema Mismatch with Actual API Response
**What goes wrong:** The Zod schema for the brand scraper response is written based on assumptions about the API contract (from project docs), but the actual Fastify service returns a different shape. The schema rejects valid responses, and the proxy returns 502 errors.
**Why it happens:** The BrandTaxonomy response shape was documented in planning but never validated against the live service.
**How to avoid:** During implementation, run a real scrape job against the Fastify service (via curl or the API directly) and use the actual JSON response to write the Zod schemas. Start with `.passthrough()` on the root schema to avoid breaking on unexpected extra fields, then tighten once confirmed.
**Warning signs:** Tests pass with mocked data but the proxy returns 502 with real API calls.

### Pitfall 3: Next.js 16 Async Params
**What goes wrong:** Developer destructures `params` synchronously in the GET route handler: `{ params: { id } }`. In Next.js 16, route params are a Promise and must be awaited.
**Why it happens:** Many Next.js examples and tutorials show synchronous params, which was valid in Next.js 14 but deprecated/changed in 15+.
**How to avoid:** Always use `const { id } = await params;` in route handlers. TypeScript will flag this if `params` is typed as `Promise<{ id: string }>`.
**Warning signs:** Build error or runtime error about params being a Promise object, not a string.

### Pitfall 4: Timeout Too Short for Scrape Submission
**What goes wrong:** The submit endpoint uses the same 15-second timeout as the chatbot client. But the brand scraper's POST /scrape endpoint may take longer to respond if the service needs to start up (Cloud Run cold start) or if the queue is full.
**Why it happens:** Copy-pasting the timeout from `fastapi-client.ts` without considering that the brand scraper has different latency characteristics.
**How to avoid:** Use a longer timeout for the submit endpoint (e.g., 30 seconds). The poll endpoint can use a shorter timeout (10 seconds) since it is a lightweight status check. The submit endpoint just needs to accept the job -- it does not wait for the scrape to complete.
**Warning signs:** Intermittent timeout errors on job submission, especially on first use (cold start).

### Pitfall 5: Not Handling Fastify Error Response Body
**What goes wrong:** When the Fastify service returns a non-200 status, the proxy only checks `res.ok` and throws a generic error. But the Fastify service may include useful error details in the response body (e.g., "Invalid URL format", "URL is not reachable"). These details are lost.
**Why it happens:** The `fastapi-client.ts` pattern throws immediately on non-200 without reading the response body.
**How to avoid:** On non-200 responses, attempt to read the response body as JSON and extract an error message. Fall back to a generic message if the body is not JSON or does not contain an error field.
**Warning signs:** Users see "Brand scraper returned 400" instead of "Invalid URL: the provided URL is not a valid website."

### Pitfall 6: Not Adding BRAND_SCRAPER_API_URL to env files
**What goes wrong:** The client module reads `process.env.BRAND_SCRAPER_API_URL` but the variable is not documented in `.env.local.example`. Developers (or future-you) cannot set up the feature without digging through source code.
**Why it happens:** Focus on code, forgetting environment configuration as a deliverable.
**How to avoid:** Add `BRAND_SCRAPER_API_URL` to `.env.local.example` with a descriptive comment, following the pattern used for `CHATBOT_API_URL`.
**Warning signs:** The feature silently returns 503 errors with "BRAND_SCRAPER_API_URL not configured".

## Code Examples

Verified patterns from the existing codebase:

### Admin Auth Pattern (existing, reuse directly)
```typescript
// Source: src/lib/auth/admin.ts
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth/admin";

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }
  // ... proceed with authorized request
}
```

### Typed Client Error Handling (existing pattern to mirror)
```typescript
// Source: src/lib/assistant/fastapi-client.ts
// The try/catch structure for external service calls:

let res: Response;
try {
  res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
} catch (err) {
  const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
  throw new BrandScraperError(
    isTimeout ? "Request timed out" : "Network error",
    503,
    isTimeout,
  );
}

if (!res.ok) {
  throw new BrandScraperError(`Service returned ${res.status}`, res.status);
}

const raw = await res.json();
const parsed = responseSchema.safeParse(raw);
if (!parsed.success) {
  throw new BrandScraperError("Invalid response shape", 502);
}
```

### Zod Schema with safeParse (existing pattern)
```typescript
// Source: src/lib/schemas/fastapi.ts
import { z } from "zod";

export const scrapeJobSubmissionSchema = z.object({
  job_id: z.string(),
  status: z.string(),
});

export type ScrapeJobSubmission = z.infer<typeof scrapeJobSubmissionSchema>;
```

### JSON Error Response (existing pattern)
```typescript
// Source: src/app/api/assistant/chat/route.ts
return new Response(JSON.stringify({ error: "message" }), {
  status: 400,
  headers: { "Content-Type": "application/json" },
});

// Or shorter with Response.json (supported in Next.js 16):
return Response.json({ error: "message" }, { status: 400 });
```

### Next.js 16 Dynamic Route Params
```typescript
// In Next.js 16, params is a Promise
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // use id
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `toDataStreamResponse()` | `toUIMessageStreamResponse()` | AI SDK v5 | Not relevant to this phase (brand scraper uses JSON, not streams) |
| Sync route params `{ params: { id } }` | Async route params `await params` | Next.js 15+ | Must use `Promise<{ id: string }>` type and `await params` |
| `new Response(JSON.stringify(...))` | `Response.json(...)` | Web API standard | Both work; `Response.json()` is shorter but the codebase uses both patterns |
| Zod 3 `z.infer<typeof schema>` | Zod 4 `z.infer<typeof schema>` (same API) | Zod 4 | The `z.object()`, `z.string()`, `z.enum()`, `.safeParse()` API is identical between Zod 3 and 4; this project uses Zod 4.3.6 |

**Deprecated/outdated:**
- Nothing deprecated relevant to this phase. The patterns are stable.

## Open Questions

Things that could not be fully resolved:

1. **Exact BrandTaxonomy response shape**
   - What we know: The API returns `POST /scrape -> { job_id, status }` and `GET /jobs/:id -> { job_id, status, result?, brand_json_url?, assets_zip_url? }`. The `result` field contains a BrandTaxonomy with colors, fonts, logos, assets, and confidence scores.
   - What's unclear: The exact nested structure of BrandTaxonomy (field names, nesting, confidence score format). The planning docs describe it conceptually but the Zod schema needs the actual JSON shape.
   - Recommendation: Use `z.unknown()` or `.passthrough()` for the `result` field initially. During implementation, run a real scrape job, capture the response, and write precise schemas from the actual data. The BrandTaxonomy Zod schema is primarily needed by Phase 21 (UI) anyway; Phase 20 just needs to pass it through.

2. **POST /scrape request body field name**
   - What we know: The ARCHITECTURE.md says `{ site_url }`, but the actual Fastify API may use `{ url }` or `{ site_url }` or something else.
   - What's unclear: The exact field name accepted by the Fastify service.
   - Recommendation: Verify against the Fastify service source code or test with curl. Use a Zod schema for the request body so the field name is defined in one place.

3. **Job status enum values**
   - What we know: Planning docs mention `queued`, `processing`, `succeeded`, `partial`, `failed`. The ARCHITECTURE.md mentions `completed` instead of `succeeded`.
   - What's unclear: The exact set of status values returned by the Fastify service.
   - Recommendation: Start with a broad `z.string()` for status and tighten to `z.enum()` after confirming actual values from the service.

4. **Fastify service authentication**
   - What we know: The proxy pattern keeps `BRAND_SCRAPER_API_URL` server-side. The chatbot proxy (`CHATBOT_API_URL`) does not pass any auth headers to the FastAPI service.
   - What's unclear: Whether the Fastify brand scraper service requires authentication (API key, IAM token, etc.) or is open when called server-to-server.
   - Recommendation: Mirror the chatbot pattern (no auth to external service) initially. If the Fastify service requires auth, add headers in the client module. Cloud Run services can use IAM-based auth with `Authorization: Bearer $(gcloud auth print-identity-token)`, but this is typically configured at the infrastructure level.

## Sources

### Primary (HIGH confidence)
- `src/lib/auth/admin.ts` - verifyAdmin() implementation, AdminAuthResult type, unauthorizedResponse() helper
- `src/lib/assistant/fastapi-client.ts` - Typed HTTP client pattern, FastApiError class, timeout handling, Zod validation
- `src/lib/schemas/fastapi.ts` - Zod schema pattern for external API responses
- `src/app/api/assistant/chat/route.ts` - Complete API route proxy pattern with error handling
- `src/lib/schemas/contact.ts`, `src/lib/schemas/content.ts` - Additional Zod schema examples
- `.planning/research/ARCHITECTURE.md` - Brand scraper proxy architecture, data flow, component structure
- `.planning/research/STACK.md` - Technology decisions and rationale
- `.planning/research/PITFALLS.md` - Pitfalls 4 (client-side auth bypass), 7 (polling leaks), 15 (raw API errors)
- `.planning/research/FEATURES.md` - BrandTaxonomy display requirements, polling patterns
- `.planning/PROJECT.md` - Brand scraper API contract documentation

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md` - Phase ordering rationale, research flags about BrandTaxonomy schema
- `.env.local.example` - Environment variable documentation pattern

### Tertiary (LOW confidence)
- BrandTaxonomy exact response shape - inferred from project context, needs validation against live Fastify service
- Fastify service authentication requirements - assumed no auth (mirroring chatbot pattern), needs confirmation
- Exact field names for POST /scrape request body - `site_url` vs `url` needs confirmation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero new dependencies; all libraries and patterns already exist in the codebase
- Architecture: HIGH - direct carbon copy of the chatbot proxy pattern with minor adaptations for async jobs
- Pitfalls: HIGH - pitfalls derived from direct analysis of existing code patterns and documented in prior research

**Research date:** 2026-02-08
**Valid until:** 30 days (stable patterns, no fast-moving dependencies)
