# Technology Stack

**Project:** v3.0 GSD Builder OS
**Researched:** 2026-02-20
**Overall confidence:** HIGH
**Mode:** Ecosystem (stack additions for Builder OS features: capture API, screenshot ingest, LLM routing, GitHub/Discord integration, admin UI)

## Executive Summary

The v3.0 GSD Builder OS milestone adds six capability areas to the existing personal-brand app: iPhone Action Button capture (API key auth), screenshot ingest (multipart upload to Cloud Storage), LLM-based request routing (structured output), GitHub issue creation with @claude automation, Discord webhook alerts, and a Builder Inbox admin UI. The core finding is that **only one new npm dependency is needed: `@octokit/rest`** for GitHub API integration. Everything else -- multipart uploads, Cloud Storage, Discord webhooks, LLM structured output, API key auth -- is achievable with existing dependencies or zero-dependency patterns (native `fetch` for Discord, `firebase-admin/storage` already bundled, AI SDK `Output.object()` for structured routing).

---

## Existing Stack (No Changes Needed)

These are already installed and current. Listed for context on what Builder OS features leverage.

| Technology | Installed Version | Latest | v3.0 Role | Status |
|------------|-------------------|--------|-----------|--------|
| Next.js | 16.1.6 | 16.1.6 | App Router API routes for capture/upload endpoints | Current |
| React | 19.2.3 | 19.2.3 | Builder Inbox admin UI components | Current |
| firebase-admin | 13.6.0 | 13.6.1 | Auth, Firestore, **Cloud Storage** (new usage) | Patch behind (non-breaking) |
| ai (Vercel AI SDK) | 6.0.71 | ^6.x | `generateText` + `Output.object()` for LLM routing | Current |
| @ai-sdk/google | 3.0.29 | ^3.x | Gemini 2.0 Flash provider for routing | Current |
| Zod | 4.3.6 | 4.3.6 | Schemas for capture requests, routing output, validation | Current |
| Vitest | 3.2.4 | 3.2.4 | Unit tests for routing logic, auth middleware | Current |
| TypeScript | ^5 | ^5 | Type safety across all new modules | Current |
| Biome | 2.2.0 | ^2.3 | Linting | Current |
| swr | 2.4.0 | 2.4.0 | Client-side data fetching for Builder Inbox UI | Current |

**Confidence:** HIGH -- all versions verified via `npm list` and `npm view` on 2026-02-20.

---

## New Dependencies

### 1. @octokit/rest (NEW -- install required)

| Property | Value |
|----------|-------|
| Package | `@octokit/rest` |
| Version | `^22.0.1` |
| Latest | 22.0.1 (published ~4 months ago) |
| Purpose | GitHub REST API client for creating issues and posting @claude comments |
| Why this package | Lightweight REST-only client. The full `octokit` (v5.0.5) bundles GraphQL, App client, and OAuth -- none needed here. `@octokit/rest` is ~40% smaller. |
| Alternative rejected | `octokit` (batteries-included) -- unnecessary weight for REST-only usage |
| Alternative rejected | Raw `fetch` to GitHub API -- would require manual pagination, error handling, type definitions. Octokit provides all of this with full TypeScript types. |

**Usage pattern:**

```typescript
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

// Create issue
const { data: issue } = await octokit.rest.issues.create({
  owner: "dweinbeck",
  repo: "target-repo",
  title: "GSD: Fix login bug",
  body: "Captured via iPhone Action Button.\n\n@claude Please investigate and fix this.",
  labels: ["gsd-capture"],
});

// Add @claude comment to trigger GitHub Action
await octokit.rest.issues.createComment({
  owner: "dweinbeck",
  repo: "target-repo",
  issue_number: issue.number,
  body: "@claude Please investigate this issue and create a PR with the fix.",
});
```

**Confidence:** HIGH -- version verified via `npm view @octokit/rest version` on 2026-02-20. API surface verified against official docs.

---

## Zero-Dependency Capabilities (Already Available)

### 2. Firebase Cloud Storage (firebase-admin/storage)

**No new dependency needed.** The `firebase-admin@13.6.0` package already bundles `@google-cloud/storage@7.18.0` (verified via `npm ls @google-cloud/storage`).

| Property | Value |
|----------|-------|
| Import | `import { getStorage } from "firebase-admin/storage"` |
| Purpose | Store screenshot uploads from iPhone Share Sheet |
| Bucket | Needs `FIREBASE_STORAGE_BUCKET` env var (e.g., `personal-brand-486314.firebasestorage.app`) |
| Why not a separate GCS client | firebase-admin already exposes the full `@google-cloud/storage` API surface. Adding `@google-cloud/storage` separately would be redundant. |

**Integration with existing firebase.ts:**

```typescript
// Add to src/lib/firebase.ts
import { getStorage } from "firebase-admin/storage";

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
export const storage = app && storageBucket
  ? getStorage(app).bucket(storageBucket)
  : undefined;
```

**Upload pattern (Buffer from multipart FormData):**

```typescript
const bucket = storage; // from firebase.ts
const file = bucket.file(`gsd-captures/${requestId}/screenshot.png`);

await file.save(buffer, {
  metadata: { contentType: "image/png" },
});

// Generate signed URL (1 hour expiry)
const [signedUrl] = await file.getSignedUrl({
  version: "v4",
  action: "read",
  expires: Date.now() + 60 * 60 * 1000,
});
```

**New env var required:**
- `FIREBASE_STORAGE_BUCKET` -- the GCS bucket name (e.g., `personal-brand-486314.firebasestorage.app`)
- Add to `.env.example` and `validate-env.ts`

**Confidence:** HIGH -- verified `@google-cloud/storage@7.18.0` is bundled in node_modules, and `firebase-admin/storage` exports `getStorage` with full bucket/file API.

### 3. Discord Webhook Alerts (native fetch)

**No library needed.** Discord webhooks are a simple HTTP POST with JSON body. Node.js 18+ native `fetch` (available in the Next.js runtime) handles this trivially.

| Property | Value |
|----------|-------|
| Library | None (native `fetch`) |
| Purpose | Send notifications to Discord channel when captures are processed |
| Why no library | Discord webhooks are a single POST endpoint. Libraries like `discord-webhook-node` or `discord.js` add unnecessary dependencies for a one-function use case. |
| Alternative rejected | `discord-webhook-node` -- 3 transitive dependencies for what is literally a `fetch()` call |
| Alternative rejected | `discord.js` -- full bot framework, massive overkill for webhooks |

**Implementation pattern:**

```typescript
// src/lib/discord.ts
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function sendDiscordAlert(opts: {
  title: string;
  description: string;
  color?: number; // Decimal color (e.g., 0x00ff00 for green)
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return; // Silent no-op if not configured

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: opts.title,
        description: opts.description,
        color: opts.color ?? 0x5865f2, // Discord blurple
        fields: opts.fields,
        timestamp: new Date().toISOString(),
      }],
    }),
  });
}
```

**New env var required:**
- `DISCORD_WEBHOOK_URL` -- Discord channel webhook URL
- Optional (alerts silently skip if not set), but add to `.env.example`

**Confidence:** HIGH -- Discord webhook API is stable and well-documented. Native `fetch` confirmed available in Next.js 16 server runtime.

### 4. LLM Structured Output for Request Routing (AI SDK Output.object)

**No new dependency needed.** The existing `ai@6.0.71` and `@ai-sdk/google@3.0.29` packages support `generateText` with `Output.object()` for structured JSON generation with Zod schema validation.

| Property | Value |
|----------|-------|
| Import | `import { generateText, Output } from "ai"` |
| Model | Gemini 2.0 Flash (already configured via `@ai-sdk/google`) |
| Purpose | Classify captured requests into routing categories (GitHub Issue, Task, Note, Automation) |
| Why Output.object | AI SDK v6 deprecated `generateObject()`. The current API is `generateText()` with `Output.object({ schema })`. This is the forward-compatible pattern. |

**Important:** The project already uses `streamText` from AI SDK v6 (see `src/lib/research-assistant/model-client.ts`). The `generateText` + `Output.object()` pattern is the same SDK, just synchronous structured output instead of streaming text.

**Routing schema pattern:**

```typescript
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const routingSchema = z.object({
  category: z.enum(["github_issue", "task", "note", "automation"]),
  title: z.string().describe("Short title for the request"),
  body: z.string().describe("Detailed description"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  repo: z.string().optional().describe("Target GitHub repo if category is github_issue"),
  labels: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).describe("Routing confidence score"),
});

const { output } = await generateText({
  model: google("gemini-2.0-flash"),
  output: Output.object({ schema: routingSchema }),
  prompt: `Classify and route this request: "${transcription}"`,
});
```

**Confidence:** HIGH -- AI SDK v6 `Output.object()` pattern verified against official docs (ai-sdk.dev). Gemini 2.0 Flash already configured in the project.

### 5. Multipart File Upload in Next.js App Router

**No new dependency needed.** Next.js App Router Route Handlers natively support `request.formData()` for multipart uploads.

| Property | Value |
|----------|-------|
| API | `request.formData()` in Route Handler |
| Purpose | Receive screenshot uploads from iPhone Share Sheet via Apple Shortcuts |
| File size limit | Default 1MB body limit in Next.js. Need to increase for screenshots. |
| Configuration | `experimental.serverActions.bodySizeLimit` in `next.config.ts` (global setting) |

**Route Handler pattern:**

```typescript
// src/app/api/gsd/capture/screenshot/route.ts
export async function POST(request: Request) {
  // API key auth (see section 6 below)
  const apiKey = request.headers.get("X-API-Key");
  if (apiKey !== process.env.GSD_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("screenshot") as File | null;
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Upload to Cloud Storage (see section 2)
  // ...
}
```

**next.config.ts change needed:**

```typescript
const nextConfig: NextConfig = {
  // ... existing config ...
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Screenshots from iPhone can be 5-8MB
    },
  },
};
```

**Note:** This is a global setting in App Router (no per-route override available). 10MB is safe -- the existing API routes handle JSON payloads well under this limit.

**Confidence:** HIGH -- `request.formData()` is standard Web API, supported in all Next.js App Router versions. Body size limit configuration verified against Next.js docs and GitHub issues.

### 6. API Key Authentication Middleware

**No new dependency needed.** API key auth is a simple header check pattern. The project already has `verifyUser` (Firebase ID token) and `verifyAdmin` patterns in `src/lib/auth/`. API key auth follows the same pattern but checks a static secret instead of a Firebase token.

| Property | Value |
|----------|-------|
| Purpose | Authenticate iPhone Shortcuts requests (no Firebase Auth available from Shortcuts) |
| Pattern | `X-API-Key` header checked against `GSD_API_KEY` env var |
| Why not Firebase Auth | Apple Shortcuts cannot perform OAuth flows. A pre-shared API key is the only viable auth mechanism for automated HTTP requests from Shortcuts. |
| Why not JWT | Unnecessary complexity for a single-user personal tool. A strong random API key provides equivalent security. |

**Implementation pattern:**

```typescript
// src/lib/auth/api-key.ts
export type ApiKeyAuthResult =
  | { authorized: true }
  | { authorized: false; error: string; status: 401 };

export function verifyApiKey(request: Request): ApiKeyAuthResult {
  const apiKey = request.headers.get("X-API-Key");
  const expectedKey = process.env.GSD_API_KEY;

  if (!expectedKey) {
    console.error("GSD_API_KEY not configured");
    return { authorized: false, error: "Server misconfigured.", status: 401 };
  }

  if (!apiKey || apiKey !== expectedKey) {
    return { authorized: false, error: "Invalid API key.", status: 401 };
  }

  return { authorized: true };
}
```

**Follows existing pattern:** This mirrors the `verifyUser` / `verifyAdmin` discriminated union return type pattern already established in `src/lib/auth/user.ts` and `src/lib/auth/admin.ts`.

**New env var required:**
- `GSD_API_KEY` -- strong random string (generate with `openssl rand -hex 32`)
- Add to `.env.example`, `validate-env.ts`, and GCP Secret Manager

**Confidence:** HIGH -- pattern matches existing auth middleware in the codebase. No external dependencies.

---

## GitHub Actions (No npm dependency -- YAML workflow)

### 7. Claude Code Action (anthropics/claude-code-action@v1)

This is a **GitHub Actions workflow**, not an npm dependency. It runs in GitHub's CI infrastructure.

| Property | Value |
|----------|-------|
| Action | `anthropics/claude-code-action@v1` |
| Purpose | Respond to @claude mentions on GitHub issues with AI-powered code changes |
| Trigger | `issue_comment` (created), `issues` (opened, labeled) |
| Required secret | `ANTHROPIC_API_KEY` in GitHub repo secrets |
| Permissions | `contents: read`, `pull-requests: write`, `issues: write` |

**Workflow file: `.github/workflows/claude.yml`**

```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned, labeled]

jobs:
  claude:
    if: contains(github.event.comment.body, '@claude') || contains(github.event.issue.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Setup steps:**
1. Add `ANTHROPIC_API_KEY` to GitHub repo secrets (Settings > Secrets and variables > Actions)
2. Create `.github/workflows/claude.yml` with the workflow above
3. The project's existing `CLAUDE.md` will be automatically used as context

**Confidence:** HIGH -- Claude Code Action is officially maintained by Anthropic. v1 is stable release. Workflow YAML verified against official docs.

---

## New Environment Variables Summary

| Variable | Purpose | Required | Storage |
|----------|---------|----------|---------|
| `FIREBASE_STORAGE_BUCKET` | GCS bucket for screenshot uploads | Yes (for screenshot feature) | `.env` + GCP Secret Manager |
| `GSD_API_KEY` | API key for iPhone Shortcuts auth | Yes (for capture API) | `.env` + GCP Secret Manager |
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications | Optional (alerts skip if unset) | `.env` + GCP Secret Manager |
| `GITHUB_PAT` | GitHub Personal Access Token for Octokit | Yes (for issue creation) | `.env` + GCP Secret Manager |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude Code Action | Yes (GitHub repo secret only) | GitHub Secrets (not app env) |

**All new env vars must be:**
1. Added to `.env.example` with description
2. Added to `validate-env.ts` validation
3. Stored in GCP Secret Manager for production (except `ANTHROPIC_API_KEY` which is GitHub-only)

---

## Installation

```bash
# Single new dependency
npm install @octokit/rest

# No other installs needed. Everything else uses:
# - firebase-admin/storage (already bundled)
# - ai + @ai-sdk/google (already installed)
# - native fetch (built into Node.js 18+)
# - Zod (already installed)
```

---

## What NOT to Install

| Package | Why Not |
|---------|---------|
| `@google-cloud/storage` | Already bundled inside `firebase-admin@13.6.0` |
| `octokit` (full package) | Unnecessary -- includes GraphQL, App client, OAuth. `@octokit/rest` covers REST API needs at ~40% the size |
| `discord.js` | Full bot framework. Discord webhooks are a single `fetch()` call |
| `discord-webhook-node` | 3 transitive deps for a trivial `fetch()` wrapper |
| `multer` / `formidable` | Not needed -- Next.js App Router handles `request.formData()` natively |
| `busboy` | Same as above -- Pages Router pattern, not needed in App Router |
| `jose` / `jsonwebtoken` | API key auth is simpler and more appropriate for Shortcuts integration |
| `uuid` | Already have idempotency key patterns; `crypto.randomUUID()` is built into Node.js |
| `nanoid` | Same as above -- `crypto.randomUUID()` covers ID generation |

---

## next.config.ts Change Required

The only configuration change needed is increasing the body size limit for screenshot uploads:

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

**Rationale:** iPhone screenshots are typically 2-8MB depending on device and content. 10MB provides headroom without being excessive. This is a global setting in App Router (per-route body size limits are not supported).

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| GitHub API | `@octokit/rest` | Raw `fetch` | Would need manual types, pagination, error handling, auth header management |
| GitHub API | `@octokit/rest` | `octokit` (full) | Includes GraphQL, App, OAuth -- none needed. REST-only is lighter. |
| Cloud Storage | `firebase-admin/storage` | `@google-cloud/storage` direct | Already bundled in firebase-admin. Adding separately is redundant. |
| Cloud Storage | `firebase-admin/storage` | AWS S3 | Project is GCP-native. Mixing cloud providers adds complexity. |
| Discord | Native `fetch` | `discord-webhook-node` | 3 deps for a one-liner `fetch`. Not worth the dependency. |
| Discord | Native `fetch` | `discord.js` | Full bot framework (150+ transitive deps). Massive overkill. |
| File upload | `request.formData()` | `multer` | Pages Router pattern. App Router has native FormData support. |
| LLM routing | AI SDK `Output.object()` | Direct Gemini API | Would lose Zod schema integration, provider abstraction, retry logic |
| LLM routing | AI SDK `Output.object()` | `generateObject()` | Deprecated in AI SDK v6. `Output.object()` is the forward-compatible API. |
| Auth (Shortcuts) | API key (`X-API-Key`) | Firebase Auth | Shortcuts cannot perform OAuth. API key is the only viable option. |
| Auth (Shortcuts) | API key (`X-API-Key`) | JWT with shared secret | Unnecessary complexity for single-user tool. API key is simpler and equivalent. |
| IDs | `crypto.randomUUID()` | `uuid` / `nanoid` | Built-in Node.js API. Zero dependencies. |

---

## Version Compatibility Matrix

| New Feature | Depends On | Minimum Version | Installed Version | Compatible |
|-------------|-----------|-----------------|-------------------|------------|
| Cloud Storage upload | firebase-admin | 11.0.0+ | 13.6.0 | Yes |
| Signed URLs | @google-cloud/storage (via firebase-admin) | 6.0.0+ | 7.18.0 | Yes |
| FormData uploads | Next.js App Router | 13.4+ | 16.1.6 | Yes |
| Output.object() | ai (Vercel AI SDK) | 6.0.0+ | 6.0.71 | Yes |
| Gemini 2.0 Flash | @ai-sdk/google | 3.0.0+ | 3.0.29 | Yes |
| GitHub API v3 | @octokit/rest | 22.0.0+ | 22.0.1 (to install) | Yes |
| Claude Code Action | GitHub Actions | N/A (YAML) | v1 | Yes |

---

## Sources

- [@octokit/rest npm](https://www.npmjs.com/package/@octokit/rest) -- version 22.0.1 verified
- [Octokit REST.js documentation](https://octokit.github.io/rest.js/v22/) -- API surface reference
- [Firebase Admin Cloud Storage docs](https://firebase.google.com/docs/storage/admin/start) -- getStorage API
- [AI SDK v6 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0) -- generateObject deprecation, Output.object pattern
- [AI SDK Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) -- Output.object usage
- [Claude Code GitHub Action](https://github.com/anthropics/claude-code-action) -- v1 workflow configuration
- [Claude Code Action usage docs](https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md) -- triggers, secrets, permissions
- [Discord Webhook API](https://discord.com/developers/docs/resources/webhook) -- POST format, embeds structure
- [Discord webhook fetch example](https://gist.github.com/dragonwocky/ea61c8d21db17913a43da92efe0de634) -- native fetch pattern
- [Apple Shortcuts API guide](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios) -- HTTP request capabilities
- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route) -- formData support
- [Next.js body size limit discussion](https://github.com/vercel/next.js/issues/57501) -- App Router global limit configuration
