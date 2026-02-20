# Phase 2: Capture API & Storage Foundation - Research

**Researched:** 2026-02-20
**Domain:** API key authentication, multipart file upload, Cloud Storage integration, Firestore persistence, async processing patterns
**Confidence:** HIGH

## Summary

Phase 2 builds the data ingestion layer for GSD Builder OS: two API endpoints (dictation capture and screenshot upload) with API key authentication, Cloud Storage for screenshot persistence, and Firestore for capture metadata. The key architectural constraint is response time -- iPhone Shortcuts has a 25-second hard timeout, so the endpoints must respond in under 5 seconds by writing to Firestore immediately and deferring all downstream processing (LLM routing, GitHub issue creation, Discord alerts) to fire-and-forget background work.

All three plans in this phase use existing dependencies and patterns. The API key auth middleware follows the established `verifyUser`/`verifyAdmin` discriminated union pattern in `src/lib/auth/`. Cloud Storage is available through the already-installed `firebase-admin@13.6.0` package (which bundles `@google-cloud/storage@7.18.0`). Multipart file upload uses the built-in `request.formData()` Web API in Next.js App Router route handlers. The only configuration change needed is a body size limit increase in `next.config.ts` for screenshot uploads. All new environment variables must be `.optional()` in the Zod schema to avoid breaking existing developer workflows.

**Primary recommendation:** Build Plan 02-01 (auth middleware + env vars + Firestore schema + Cloud Storage setup) first, as both capture endpoints depend on it. Plans 02-02 and 02-03 can then be built in either order since they are independent of each other.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `firebase-admin` | 13.6.0 (installed) | Firestore persistence + Cloud Storage uploads | Already powers contact form, billing, scrape history; Cloud Storage bundled via `@google-cloud/storage@7.18.0` |
| `firebase-admin/storage` | via 13.6.0 | `getStorage()` for bucket access and file operations | Zero new dependency; import path already available |
| `zod` | 4.3.6 (installed) | Request validation schemas for capture endpoints | Project standard; used in all API routes and schemas |
| `node:crypto` | built-in | `timingSafeEqual` for API key comparison, `randomUUID` for capture IDs | Node.js built-in; zero dependencies |
| Next.js App Router | 16.1.6 (installed) | Route handlers with `request.formData()` for multipart uploads | Native Web API support; no middleware libraries needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `firebase-admin/firestore` `FieldValue` | via 13.6.0 | `serverTimestamp()` for consistent timestamp handling | All Firestore writes (capture creation, status updates) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `firebase-admin/storage` | `@google-cloud/storage` direct install | Redundant -- already bundled inside firebase-admin. Would add a duplicate dependency. |
| `request.formData()` | `multer` / `busboy` / `formidable` | Pages Router patterns; App Router handles FormData natively. Adding these would be unnecessary complexity. |
| `crypto.timingSafeEqual` | Simple `===` comparison | `===` is vulnerable to timing attacks (short-circuits on first differing character). `timingSafeEqual` is constant-time. |
| `crypto.randomUUID()` | `uuid` / `nanoid` packages | Built-in Node.js API (Node 19+, stable). Zero dependencies needed. |
| Firestore for captures | PostgreSQL via Prisma | Captures are document-oriented (flexible metadata, no joins needed). Firestore matches existing contact/billing patterns. PostgreSQL would be over-engineering for simple document storage. |

**Installation:**
```bash
# No new npm dependencies needed for Phase 2.
# All functionality uses existing packages and built-ins.
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── admin.ts          # Existing - Firebase ID token admin auth
│   │   ├── user.ts           # Existing - Firebase ID token user auth
│   │   └── api-key.ts        # NEW - API key auth for Shortcuts
│   ├── gsd/
│   │   ├── capture.ts        # NEW - Firestore capture persistence
│   │   ├── schemas.ts        # NEW - Zod schemas for capture requests/documents
│   │   └── storage.ts        # NEW - Cloud Storage upload utility
│   ├── firebase.ts           # MODIFY - Add getStorage() export
│   └── env.ts                # MODIFY - Add GSD_API_KEY, FIREBASE_STORAGE_BUCKET, GITHUB_PAT, DISCORD_WEBHOOK_URL
├── app/
│   └── api/
│       └── gsd/
│           ├── capture/
│           │   └── route.ts           # NEW - Dictation capture endpoint
│           └── capture/
│               └── screenshot/
│                   └── route.ts       # NEW - Screenshot capture endpoint
└── next.config.ts                     # MODIFY - Add experimental.serverActions.bodySizeLimit
```

### Pattern 1: API Key Auth Middleware (Discriminated Union)

**What:** A `verifyApiKey()` function that checks the `X-API-Key` header against a hashed env var using constant-time comparison. Returns a discriminated union matching the existing `verifyUser`/`verifyAdmin` pattern.

**When to use:** All `/api/gsd/*` routes. iPhone Shortcuts cannot perform OAuth, so API key auth is the only viable mechanism.

**Example:**
```typescript
// src/lib/auth/api-key.ts
// Follows established pattern from src/lib/auth/admin.ts
import { timingSafeEqual, createHash } from "node:crypto";

export type ApiKeyAuthResult =
  | { authorized: true }
  | { authorized: false; error: string; status: 401 | 503 };

export function verifyApiKey(request: Request): ApiKeyAuthResult {
  const expectedKey = process.env.GSD_API_KEY;
  if (!expectedKey) {
    return { authorized: false, error: "GSD capture not configured.", status: 503 };
  }

  const providedKey = request.headers.get("X-API-Key");
  if (!providedKey) {
    return { authorized: false, error: "Missing X-API-Key header.", status: 401 };
  }

  // Constant-time comparison via SHA-256 hash (normalizes length for timingSafeEqual)
  const providedHash = createHash("sha256").update(providedKey).digest();
  const expectedHash = createHash("sha256").update(expectedKey).digest();

  if (!timingSafeEqual(providedHash, expectedHash)) {
    return { authorized: false, error: "Invalid API key.", status: 401 };
  }

  return { authorized: true };
}

export function apiKeyUnauthorizedResponse(
  result: Extract<ApiKeyAuthResult, { authorized: false }>,
) {
  return Response.json({ error: result.error }, { status: result.status });
}
```

**Key insight:** Hashing both keys before comparison normalizes length, which is required by `timingSafeEqual` (it throws if buffers have different lengths). This avoids leaking whether the provided key has the correct length.

### Pattern 2: Fire-and-Forget Async Processing

**What:** The capture endpoint writes to Firestore and returns `202 Accepted` immediately. Downstream processing (LLM routing, GitHub issue creation, Discord alerts) runs as a fire-and-forget promise.

**When to use:** All capture endpoints. iPhone Shortcuts has a 25-second timeout; Gemini + GitHub API calls can take 5-10+ seconds.

**Example:**
```typescript
// In the capture route handler
export async function POST(request: Request) {
  // Auth + validation (fast: <1s)
  const auth = verifyApiKey(request);
  if (!auth.authorized) return apiKeyUnauthorizedResponse(auth);

  const body = await request.json();
  const parsed = captureSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Persist to Firestore (fast: 1-2s)
  const captureId = crypto.randomUUID();
  await saveCapture({ id: captureId, ...parsed.data, status: "pending" });

  // Trigger async processing -- DO NOT await
  processCapture(captureId).catch((err) =>
    console.error(`Failed to process capture ${captureId}:`, err),
  );

  // Respond immediately (total: <3s)
  return Response.json({ status: "queued", id: captureId }, { status: 202 });
}
```

**Critical constraint:** The `processCapture()` function must be fully self-contained. It cannot rely on the request object, response lifecycle, or any request-scoped state. On Cloud Run, the request handler may complete before the async processing finishes, but the container stays alive for up to 300 seconds (default timeout) as long as there's active work.

### Pattern 3: Proxy Upload to Cloud Storage

**What:** Screenshots are uploaded to the Next.js API route as multipart form data, buffered in memory, then uploaded server-side to Cloud Storage. No direct client-to-GCS upload.

**When to use:** Screenshot capture endpoint.

**Why proxy (not direct upload):**
1. Avoids CORS configuration on the GCS bucket (no direct browser/Shortcuts access)
2. Matches existing patterns (chatbot proxy, brand scraper proxy)
3. Keeps the GCS bucket unexposed to the internet
4. iPhone Shortcuts does not support the two-step signed URL flow well

**Example:**
```typescript
// Screenshot upload via proxy
export async function POST(request: Request) {
  const auth = verifyApiKey(request);
  if (!auth.authorized) return apiKeyUnauthorizedResponse(auth);

  const formData = await request.formData();
  const file = formData.get("screenshot") as File | null;
  if (!file) {
    return Response.json({ error: "No screenshot provided." }, { status: 400 });
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "File too large (10MB max)." }, { status: 413 });
  }

  const captureId = crypto.randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Cloud Storage
  const screenshotUrl = await uploadScreenshot(captureId, buffer, file.type);

  // Persist capture with screenshot reference
  await saveCapture({
    id: captureId,
    type: "screenshot",
    screenshotUrl,
    status: "pending",
  });

  // Trigger async processing
  processCapture(captureId).catch((err) =>
    console.error(`Failed to process capture ${captureId}:`, err),
  );

  return Response.json({ status: "queued", id: captureId }, { status: 202 });
}
```

### Pattern 4: Firestore Capture Document Schema

**What:** A single `gsd_captures` collection in Firestore stores all captures (dictation and screenshots) with a status field for processing state tracking.

**When to use:** All capture persistence.

**Example document structure:**
```typescript
// Capture document in Firestore gsd_captures collection
{
  id: "uuid",                         // crypto.randomUUID()
  type: "dictation" | "screenshot",   // Capture source
  transcript: "Fix the login bug",    // For dictation captures
  screenshotUrl: "gs://...",          // For screenshot captures (Cloud Storage path)
  context: "...",                     // Optional additional context from Shortcuts
  status: "pending",                  // pending | processing | routed | failed
  routingResult: null,                // Populated by Phase 3 LLM router
  destination: null,                  // github_issue | task | inbox | null
  destinationRef: null,               // GitHub issue URL, task ID, etc.
  error: null,                        // Error message if processing failed
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
}
```

**Collection name:** `gsd_captures` (namespaced to avoid collision with existing collections: `contact_submissions`, `scrape_history`, `billing_*`, etc.)

### Anti-Patterns to Avoid

- **Sequential processing in capture endpoint:** Never chain Gemini + GitHub + Discord calls synchronously. The iPhone Shortcut will timeout. Always write to Firestore first, then process async.
- **Shared rate limit state in memory:** Cloud Run instances are ephemeral. In-memory rate limiting (like `src/lib/actions/contact.ts`) doesn't persist across scale-down. For the capture API, the API key itself is the primary gate; rate limiting is defense-in-depth, not primary protection.
- **Required env vars in schema:** Adding `GSD_API_KEY` as `.required()` in the Zod env schema would break `npm run dev` for all developers who haven't set it. Must be `.optional()`.
- **`===` for API key comparison:** Vulnerable to timing attacks. Always use `crypto.timingSafeEqual` via SHA-256 hash normalization.
- **`Buffer.from(file.stream())` for large files:** Buffers the entire file into memory. Acceptable for screenshots (<10MB) but would be wrong for larger files. For this use case, `Buffer.from(await file.arrayBuffer())` is the correct pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Constant-time string comparison | Custom loop with XOR | `crypto.timingSafeEqual` + SHA-256 hash | Node.js built-in, tested, audited; hand-rolled versions often have subtle timing leaks |
| UUID generation | Custom random string function | `crypto.randomUUID()` | Built-in, RFC 4122 compliant, cryptographically random |
| Multipart parsing | Custom body parser | `request.formData()` Web API | Built into Next.js App Router; handles boundary detection, encoding, etc. |
| Cloud Storage upload | Raw HTTP to GCS JSON API | `firebase-admin/storage` `bucket.file().save()` | Handles auth, retries, content-type, metadata automatically |
| Server timestamps | `new Date().toISOString()` for Firestore | `FieldValue.serverTimestamp()` | Server-authoritative; avoids clock skew between client and server |
| File type detection | Custom magic byte checks | Trust `Content-Type` from FormData + validate allowed types | Shortcuts sends correct content types; server-side validation of allowed types is sufficient |

**Key insight:** Every capability needed for Phase 2 is available through existing dependencies or Node.js built-ins. Zero new npm packages are required.

## Common Pitfalls

### Pitfall 1: Body Size Limit for Screenshot Uploads

**What goes wrong:** Next.js App Router route handlers have a body size limit. iPhone screenshots (especially from newer models) can be 2-8MB. The default may reject large uploads silently.

**Why it happens:** Next.js does not have a per-route body size configuration for App Router route handlers in standalone output mode. The `experimental.serverActions.bodySizeLimit` is a global setting.

**How to avoid:** Add `experimental.serverActions.bodySizeLimit: "10mb"` to `next.config.ts`. This is a global setting but is safe -- existing API routes handle JSON payloads well under 1MB. Additionally, validate file size in the route handler itself (defense-in-depth).

**Warning signs:** Screenshot uploads return 413 or a generic error. Test with actual iPhone screenshots (not small test images).

**Configuration change:**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
  // ... existing config ...
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};
```

### Pitfall 2: Env Var Schema Breaking Existing Dev Workflows

**What goes wrong:** Adding new env vars as required in `src/lib/env.ts` causes `npm run dev` to fail for developers who don't have Builder OS credentials.

**Why it happens:** The `serverEnvSchema` validates ALL vars on first call to `serverEnv()`. New required vars that are missing crash the entire app at startup.

**How to avoid:** All new Builder OS env vars MUST be `.optional()` with runtime checks at the point of use. Follow the existing pattern for `STRIPE_SECRET_KEY`, `GITHUB_TOKEN`, etc.

**Warning signs:** `npm run dev` crashes with "GSD_API_KEY is required" -- means the var was added as required instead of optional.

**Correct pattern:**
```typescript
// In src/lib/env.ts
GSD_API_KEY: z
  .string()
  .min(1)
  .refine(isNotPlaceholder, "GSD_API_KEY looks like a placeholder")
  .optional(),

// In the capture route handler -- check at point of use
const env = serverEnv();
if (!env.GSD_API_KEY) {
  return Response.json({ error: "GSD capture not configured." }, { status: 503 });
}
```

### Pitfall 3: Cloud Storage Bucket Not Initialized Correctly

**What goes wrong:** `getStorage(app).bucket()` without a bucket name argument returns the default bucket, which may not be what's expected. The default bucket for a Firebase project is `<project-id>.appspot.com` (or `.firebasestorage.app` for newer projects), but you must specify it explicitly if using a custom bucket.

**Why it happens:** Firebase Storage requires knowing the bucket name. Unlike Firestore (which defaults to the project's default database), Cloud Storage has no "automatic" bucket selection when using the Admin SDK.

**How to avoid:** Always pass the bucket name explicitly via `FIREBASE_STORAGE_BUCKET` env var. Initialize conditionally (like the Firestore `db` export).

**Correct pattern:**
```typescript
// In src/lib/firebase.ts
import { getStorage } from "firebase-admin/storage";

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
export const storage = app && storageBucket
  ? getStorage(app).bucket(storageBucket)
  : undefined;
```

### Pitfall 4: iPhone Shortcuts FormData Field Naming

**What goes wrong:** iPhone Shortcuts' "Get Contents of URL" action with "Form" body type generates multipart/form-data with case-sensitive field names matching exactly what's entered in the Shortcuts UI. If the API expects `transcript` but Shortcuts sends `Transcript`, the field is not found.

**Why it happens:** Shortcuts' form builder is visual and doesn't expose HTTP details. Developers may not test with actual Shortcuts requests.

**How to avoid:** Document the exact field names required. Consider case-insensitive field lookup as a fallback. Keep error messages short (Shortcuts shows response body in alerts, max ~200 characters useful).

**Warning signs:** Captures arrive with null/empty transcript despite the user speaking. Check field name casing.

### Pitfall 5: Fire-and-Forget Processing Silently Failing

**What goes wrong:** The `processCapture(id).catch(console.error)` pattern means processing failures are only visible in server logs. The user (who sent the capture from their iPhone) has no way to know if processing succeeded or failed.

**Why it happens:** The 202 response is already sent. The async processing has no way to communicate back to the Shortcuts client.

**How to avoid:** Always update the Firestore capture document's `status` field (to `routed` or `failed`) so the Builder Inbox (Phase 4) can display processing results. Log errors with the capture ID for debugging. The Phase 4 Discord alert layer will provide push notifications for failures.

**Warning signs:** Captures stuck in `pending` status in Firestore for more than 60 seconds.

## Code Examples

### Cloud Storage Upload Utility

```typescript
// src/lib/gsd/storage.ts
import { storage } from "@/lib/firebase";

export async function uploadScreenshot(
  captureId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!storage) {
    throw new Error("Cloud Storage not configured. Set FIREBASE_STORAGE_BUCKET.");
  }

  const extension = contentType.includes("png") ? "png"
    : contentType.includes("heic") ? "heic"
    : "jpg";
  const filePath = `gsd-captures/${captureId}/screenshot.${extension}`;
  const file = storage.file(filePath);

  await file.save(buffer, {
    metadata: { contentType },
  });

  // Return the GCS path (not a signed URL -- signed URLs are generated on demand)
  return `gs://${storage.name}/${filePath}`;
}
```

### Firestore Capture Persistence

```typescript
// src/lib/gsd/capture.ts
// Follows pattern from src/lib/brand-scraper/history.ts
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";

function requireDb() {
  if (!db) throw new Error("Firestore not available.");
  return db;
}

function capturesCol() {
  return requireDb().collection("gsd_captures");
}

export interface CaptureInput {
  id: string;
  type: "dictation" | "screenshot";
  transcript?: string;
  screenshotUrl?: string;
  context?: string;
}

export async function saveCapture(input: CaptureInput): Promise<void> {
  const now = FieldValue.serverTimestamp();
  await capturesCol().doc(input.id).set({
    ...input,
    status: "pending",
    routingResult: null,
    destination: null,
    destinationRef: null,
    error: null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateCaptureStatus(
  id: string,
  update: {
    status: "processing" | "routed" | "failed";
    routingResult?: Record<string, unknown>;
    destination?: string;
    destinationRef?: string;
    error?: string;
  },
): Promise<void> {
  await capturesCol().doc(id).update({
    ...update,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
```

### Zod Validation Schema for Captures

```typescript
// src/lib/gsd/schemas.ts
import { z } from "zod";

/** Dictation capture request body */
export const dictationCaptureSchema = z.object({
  transcript: z
    .string()
    .min(1, "Transcript is required")
    .max(10_000, "Transcript too long (10,000 char max)"),
  context: z
    .string()
    .max(2_000, "Context too long")
    .optional(),
});

export type DictationCaptureRequest = z.infer<typeof dictationCaptureSchema>;

/** Capture document as stored in Firestore */
export const captureStatusSchema = z.enum([
  "pending",
  "processing",
  "routed",
  "failed",
]);

export const captureDestinationSchema = z.enum([
  "github_issue",
  "task",
  "inbox",
]);
```

### Env Var Additions

```typescript
// Additions to src/lib/env.ts serverEnvBaseSchema
GSD_API_KEY: z
  .string()
  .min(1)
  .refine(isNotPlaceholder, "GSD_API_KEY looks like a placeholder")
  .optional(),

FIREBASE_STORAGE_BUCKET: z
  .string()
  .min(1)
  .refine(isNotPlaceholder, "FIREBASE_STORAGE_BUCKET looks like a placeholder")
  .optional(),

GITHUB_PAT: z
  .string()
  .min(1)
  .refine(isNotPlaceholder, "GITHUB_PAT looks like a placeholder")
  .refine(
    (val) => val.startsWith("ghp_") || val.startsWith("github_pat_"),
    "GITHUB_PAT must start with 'ghp_' or 'github_pat_'",
  )
  .optional(),

DISCORD_WEBHOOK_URL: z
  .string()
  .url("DISCORD_WEBHOOK_URL must be a valid URL")
  .refine(
    (val) => val.includes("discord.com/api/webhooks/"),
    "DISCORD_WEBHOOK_URL must be a Discord webhook URL",
  )
  .optional(),
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `multer` / `busboy` for file uploads | `request.formData()` Web API | Next.js 13.4+ (App Router) | No upload middleware needed |
| `generateObject()` for structured LLM output | `generateText()` + `Output.object()` | AI SDK v6.0 (2025) | `generateObject()` is deprecated |
| `@google-cloud/storage` separate install | `firebase-admin/storage` (bundled) | firebase-admin 11.0+ | No separate storage dependency |
| `uuid` package for ID generation | `crypto.randomUUID()` | Node.js 19+ (stable) | Built-in, zero dependencies |
| Simple `===` for secret comparison | `crypto.timingSafeEqual()` + SHA-256 | Best practice | Prevents timing attacks |

**Deprecated/outdated:**
- `multer`: Pages Router pattern. Do not use in App Router route handlers.
- `busboy`: Same -- Pages Router only.
- `generateObject()` in AI SDK: Deprecated in v6.0. Use `generateText()` + `Output.object()`.
- `formidable`: Legacy Node.js file upload library. Not needed in App Router.

## Open Questions

1. **HEIC image handling for screenshots**
   - What we know: iPhone can send screenshots as HEIC (High Efficiency Image Container) instead of JPEG/PNG. Cloud Storage accepts any content type.
   - What's unclear: Whether the Shortcuts "Resize Image" action converts HEIC to JPEG automatically, or if the API needs to handle HEIC.
   - Recommendation: Accept any image/* content type and store as-is in Cloud Storage. If vision-based processing is needed later (Phase 3 OCR), Gemini supports HEIC input natively. No conversion needed on the server.

2. **Exact Firebase Storage bucket name format**
   - What we know: The prod Firebase project is `personal-brand-486314`. Newer projects use `.firebasestorage.app` suffix, older ones use `.appspot.com`.
   - What's unclear: Whether this project has a default Storage bucket already provisioned, and what its exact name is.
   - Recommendation: Check Firebase Console > Storage to confirm the bucket name. If none exists, create one. Use the exact bucket name as the `FIREBASE_STORAGE_BUCKET` env var value.

3. **Cloud Storage path structure for captures**
   - What we know: Screenshots need organized storage. The brand scraper uses `gcs_object_path` with job-specific prefixes.
   - What's unclear: Whether captures should be organized by date, by capture ID, or both.
   - Recommendation: Use `gsd-captures/{captureId}/screenshot.{ext}` for simplicity. The capture ID provides uniqueness. Date-based organization adds complexity without benefit for a single-user tool with low volume (<20 captures/day).

4. **`next.config.ts` body size limit scope**
   - What we know: `experimental.serverActions.bodySizeLimit` is documented for Server Actions. Route handlers may have a separate or shared limit mechanism.
   - What's unclear: Whether this setting affects API route handlers or only Server Actions.
   - Recommendation: Set the limit and test with a real 5MB screenshot upload. If it doesn't work for route handlers, explore the `proxyClientMaxBodySize` experimental option or configure at the Cloud Run level (Cloud Run has a 32MB default request body limit, so the constraint is at the Next.js layer).

## Existing Codebase Patterns to Follow

### Auth Middleware Pattern (from `src/lib/auth/admin.ts`)
- Discriminated union return type: `{ authorized: true; ... } | { authorized: false; error: string; status: number }`
- Companion `unauthorizedResponse()` helper for creating Response objects
- Auth check is the first line of every route handler

### Firestore Persistence Pattern (from `src/lib/brand-scraper/history.ts`)
- `requireDb()` helper throws if Firestore unavailable
- Collection accessor function (`historyCol()`) for DRY collection references
- `FieldValue.serverTimestamp()` for all timestamps
- Document IDs are deterministic when idempotency is needed, or `crypto.randomUUID()` when not
- Timestamps converted to ISO strings for JSON serialization in GET responses

### API Route Pattern (from `src/app/api/tools/brand-scraper/scrape/route.ts`)
- Auth check first, then validation, then business logic
- Zod `safeParse` for request body validation
- Fire-and-forget for non-critical side effects (`.catch(console.error)`)
- Structured JSON error responses with appropriate HTTP status codes

### Env Var Pattern (from `src/lib/env.ts`)
- All optional service-specific vars use `.optional()` with prefix/format validation
- `isNotPlaceholder()` refinement on all secret values
- Cross-field validation via `.refine()` on the full schema
- Runtime check at point of use, not at startup

### Zod Import Pattern
- Application schemas (in `src/lib/schemas/`): `import { z } from "zod"`
- Env validation schema (in `src/lib/env.ts`): `import { z } from "zod/v4"`
- New schemas should follow the application pattern: `import { z } from "zod"`

## Infrastructure Changes Required

### `next.config.ts` (Modify)
Add body size limit for screenshot uploads:
```typescript
experimental: {
  serverActions: {
    bodySizeLimit: "10mb",
  },
},
```

### `src/lib/firebase.ts` (Modify)
Add Cloud Storage export:
```typescript
import { getStorage } from "firebase-admin/storage";

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
export const storage = app && storageBucket
  ? getStorage(app).bucket(storageBucket)
  : undefined;
```

### `src/lib/env.ts` (Modify)
Add four new optional env vars: `GSD_API_KEY`, `FIREBASE_STORAGE_BUCKET`, `GITHUB_PAT`, `DISCORD_WEBHOOK_URL`.

### `.env.local` (Modify)
Add new env var entries with descriptions.

### `cloudbuild.yaml` (Modify -- Phase 2 or later)
Add new secrets to `--set-secrets`:
```
GSD_API_KEY=gsd-api-key:latest
FIREBASE_STORAGE_BUCKET=firebase-storage-bucket:latest
GITHUB_PAT=github-pat:latest
DISCORD_WEBHOOK_URL=discord-webhook-url:latest
```

And `FIREBASE_STORAGE_BUCKET` to `--set-env-vars` if it's not treated as a secret.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/auth/admin.ts`, `src/lib/auth/user.ts` -- auth middleware discriminated union pattern
- Existing codebase: `src/lib/brand-scraper/history.ts` -- Firestore persistence pattern with `FieldValue.serverTimestamp()`
- Existing codebase: `src/lib/env.ts` -- env var validation with optional schemas and placeholder detection
- Existing codebase: `src/app/api/tools/brand-scraper/scrape/route.ts` -- API route pattern with auth, validation, fire-and-forget
- Existing codebase: `src/lib/firebase.ts` -- Firebase Admin initialization pattern
- Existing codebase: `next.config.ts` -- current config structure (no experimental section yet)
- Existing codebase: `cloudbuild.yaml` -- current Cloud Run deployment secrets and env vars
- `npm ls @google-cloud/storage` -- confirmed `@google-cloud/storage@7.18.0` bundled in firebase-admin
- Node.js `crypto` module docs -- `timingSafeEqual`, `randomUUID` APIs

### Secondary (MEDIUM confidence)
- STACK.md research (2026-02-20) -- version compatibility matrix, Cloud Storage integration patterns
- PITFALLS-builder-os.md research (2026-02-20) -- timing attack prevention, body size limits, async processing
- FEATURES.md research (2026-02-20) -- feature dependencies and MVP ordering

### Tertiary (LOW confidence)
- `experimental.serverActions.bodySizeLimit` effect on route handlers (not just Server Actions) -- needs validation by testing with actual upload

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, patterns verified against existing codebase
- Architecture: HIGH -- extends established patterns (auth middleware, Firestore persistence, proxy uploads)
- Pitfalls: HIGH -- timing attacks, body size limits, env var management are well-documented with existing mitigations in the codebase

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable domain; no fast-moving dependencies)
