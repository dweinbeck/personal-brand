# Domain Pitfalls: GSD Builder OS v3.0

**Domain:** iPhone Shortcuts capture, multipart upload, LLM routing, GitHub integration, Discord alerts -- added to existing Next.js 16 / Firebase / Cloud Run app
**Researched:** 2026-02-20
**Confidence:** HIGH (verified against official docs, existing codebase patterns, and community reports)

---

## Critical Pitfalls

Mistakes that cause complete feature failure, data loss, or require rewrites.

---

### Pitfall 1: iPhone Shortcuts 25-Second Timeout vs Cloud Run Cold Start

**What goes wrong:** The "Get Contents of URL" action in iPhone Shortcuts has a hard 25-second timeout. Cloud Run with `min-instances=0` (dev) has cold start times of 3-8 seconds for a Next.js standalone container. Combined with LLM routing (Gemini Flash call takes 1-4 seconds) and GitHub API calls (1-2 seconds), the total round-trip easily exceeds 25 seconds if the container is cold.

**Why it happens:** The existing `cloudbuild.yaml` sets `_MIN_INSTANCES: '0'` by default (overridden to 1 for prod). But even with min-instances=1, the LLM + GitHub API chain is sequential and adds up. If Gemini is slow or GitHub rate-limited, the Shortcut gets a timeout error with no useful feedback.

**Consequences:** The iPhone Shortcut shows a generic "The request timed out" error. The user has no idea if their capture was received. Worse, the request may have partially completed (e.g., Firestore write succeeded but GitHub issue creation didn't), leaving data in an inconsistent state.

**Prevention:**
1. **Respond immediately, process async.** The capture endpoint should write the raw request to Firestore within 2-3 seconds and return `{ "status": "queued", "id": "..." }`. LLM routing, GitHub issue creation, and Discord alerts happen asynchronously.
2. **Target <5 second response time** for the capture endpoint. Budget: 1s body parsing + 1s auth check + 2s Firestore write + 0.5s response serialization = 4.5s.
3. **Prod must have `min-instances=1`** (already the case). Dev can stay at 0 but accept that cold captures will sometimes fail.
4. **Never chain LLM + external API calls synchronously** in the Shortcuts-facing endpoint.

```typescript
// GOOD: Respond fast, process later
export async function POST(request: Request) {
  const body = await parseAndValidate(request);
  const id = await saveToFirestore(body); // 1-2s
  // Trigger async processing (Cloud Tasks, or fire-and-forget)
  processCapture(id).catch(console.error); // don't await
  return Response.json({ status: "queued", id }, { status: 202 });
}

// BAD: Sequential chain that will timeout
export async function POST(request: Request) {
  const body = await parseAndValidate(request);
  const classification = await callGemini(body); // 2-4s
  const issue = await createGitHubIssue(classification); // 1-2s
  await sendDiscordAlert(issue); // 0.5-1s
  await saveToFirestore(body, classification, issue); // 1-2s
  return Response.json({ issue }); // Total: 5-9s, often >25s with cold start
}
```

**Detection:** Test the full flow from an actual iPhone with the Shortcut. Measure end-to-end time. If it's over 10 seconds even once, the architecture is wrong.

**Which phase:** Phase 1 (API foundation) -- this is an architectural decision that must be made before any endpoint code is written.

---

### Pitfall 2: API Key Auth Without Constant-Time Comparison (Timing Attack)

**What goes wrong:** Using `===` to compare API keys leaks information about the key through response timing differences. An attacker can brute-force the key one character at a time by measuring how long the server takes to reject each guess.

**Why it happens:** The natural approach is `if (providedKey !== expectedKey) return 401`. JavaScript's `===` operator short-circuits on the first differing character, making comparison time proportional to how many leading characters match.

**Consequences:** With a 32-character API key and precise timing measurements (feasible over HTTPS), an attacker can crack the key in ~32 * 62 = ~1,984 requests instead of 62^32 brute-force attempts. Cloud Run's consistent latency actually makes this easier than a noisy on-prem server.

**Prevention:** Use Node.js built-in `crypto.timingSafeEqual()` for API key comparison.

```typescript
import { timingSafeEqual, createHash } from "node:crypto";

function verifyApiKey(provided: string, expected: string): boolean {
  // Hash both to normalize length (timingSafeEqual requires equal-length buffers)
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}
```

**Also watch for:**
- Header case sensitivity: `request.headers.get("X-API-Key")` and `request.headers.get("x-api-key")` both work in the Fetch API (headers are case-insensitive per HTTP spec), but document the canonical header name for Shortcuts configuration.
- API key in URL query params: Never. Always use a header (`Authorization: Bearer <key>` or `X-API-Key: <key>`). Query params appear in server logs and browser history.
- API key storage on iPhone: Shortcuts stores text fields in plaintext in iCloud backup. Consider whether this is acceptable for the threat model (it is for a personal-use API key).

**Detection:** Code review. If you see `===` comparing any secret value, it's vulnerable.

**Which phase:** Phase 1 (API foundation) -- the auth middleware must be built correctly from the start.

---

### Pitfall 3: Next.js App Router Body Size Limit for Multipart Uploads

**What goes wrong:** Next.js App Router route handlers have a default 10MB body size limit. Screenshots from an iPhone (especially from newer models with 48MP cameras) can be 5-15MB as HEIC/JPEG. Multiple screenshots in a single upload can exceed 10MB.

**Why it happens:** Next.js buffers the entire request body in memory before passing it to the route handler when middleware is involved. The `proxyClientMaxBodySize` config (experimental) controls this buffer limit but only applies to the proxy layer, not the route handler itself. For standalone output mode (which this project uses), there is no per-route body size configuration for App Router route handlers.

**Consequences:** Uploads silently fail with a 413 error. The Shortcut shows a generic error. No partial upload recovery.

**Prevention:**
1. **Proxy through Next.js to Cloud Storage using signed URLs.** Don't buffer the file in the Next.js route handler at all. Instead: (a) client requests a signed upload URL from the API, (b) client uploads directly to GCS using the signed URL, (c) client notifies the API that upload is complete.
2. **If direct upload to route handler is needed:** Use `request.formData()` (built-in Web API, no external library needed) and enforce a reasonable per-file limit (10MB per screenshot is generous).
3. **Compress on the iPhone side.** Shortcuts can resize images before upload. Add a "Resize Image" action that caps width at 1920px before the upload step. This typically reduces screenshots to 200-500KB.

```typescript
// Pattern: Signed URL approach (preferred)
// Step 1: Generate signed URL
export async function POST(request: Request) {
  // Auth check...
  const { filename, contentType } = await request.json();
  const signedUrl = await generateV4UploadSignedUrl(filename, contentType);
  return Response.json({ uploadUrl: signedUrl, filename });
}

// Pattern: Direct upload (simpler, works for <10MB)
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("screenshot") as File | null;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "File too large (10MB max)" }, { status: 413 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  // Upload buffer to GCS...
}
```

**Detection:** Test uploading a raw 48MP screenshot (no resize) from the Shortcut. If it fails, you've hit the limit.

**Which phase:** Phase 1 (API foundation) for the endpoint design decision; Phase 2 (screenshot ingest) for implementation.

---

### Pitfall 4: Gemini Structured Output Hallucination in Route Classification

**What goes wrong:** The LLM router uses Gemini Flash to classify captured text into categories (GitHub Issue, Task, Note, Automation). Gemini may confidently classify ambiguous input into the wrong category, or return a high confidence score for a clearly wrong classification. "Fix the auth bug" could be classified as a Task (correct for some users) or a GitHub Issue (correct for this project's workflow).

**Why it happens:** LLMs are trained to produce confident outputs. Gemini Flash's structured output mode guarantees valid JSON but does NOT guarantee correct classification. The model will always pick a category even when the input is genuinely ambiguous or nonsensical.

**Consequences:** Requests silently routed to the wrong destination. A bug report becomes a Note instead of a GitHub Issue. An automation request becomes a Task. The user doesn't discover the misroute until they check each system manually, defeating the purpose of the capture system.

**Prevention:**
1. **Always default to Builder Inbox for low-confidence classifications.** Set a confidence threshold (e.g., 0.7) below which the capture goes to the Inbox for manual routing.
2. **Include an "unknown" / "inbox" category in the enum.** Give the model an explicit escape hatch instead of forcing it to pick from the action categories.
3. **Use few-shot examples in the prompt.** Provide 5-10 labeled examples of each category to anchor the model's understanding of YOUR specific routing rules.
4. **Log every classification decision.** Store the full LLM response (category, confidence, reasoning) alongside the capture in Firestore so you can audit and tune.
5. **Make misroutes recoverable.** The Builder Inbox UI should let you re-route any capture to a different destination with one click.

```typescript
// Gemini structured output schema for routing
const routingSchema = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["github_issue", "task", "note", "automation", "unknown"],
    },
    confidence: {
      type: "number",
      description: "0.0 to 1.0 confidence in classification",
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of why this category was chosen",
    },
    title: { type: "string" },
    body: { type: "string" },
  },
  required: ["category", "confidence", "reasoning", "title", "body"],
};

// Route based on confidence
const CONFIDENCE_THRESHOLD = 0.7;
if (result.confidence < CONFIDENCE_THRESHOLD || result.category === "unknown") {
  await routeToInbox(capture, result);
} else {
  await routeToDestination(capture, result);
}
```

**Detection:** Send 20 ambiguous test inputs through the router and review classifications. If more than 3 are clearly wrong with confidence > 0.7, the prompt needs tuning.

**Which phase:** Phase 3 (LLM routing) -- but the Firestore schema for captures must accommodate routing metadata from Phase 1.

---

### Pitfall 5: GitHub Token Scope Insufficient for Issue + Comment Operations

**What goes wrong:** The existing `GITHUB_TOKEN` in the project is used for reading repository data (project cards, READMEs). Creating issues and posting comments requires write permissions that the current token may not have. If using a fine-grained PAT scoped to read-only, all write operations fail with 403.

**Why it happens:** The existing env validation in `src/lib/env.ts` validates the token format (`ghp_` or `github_pat_` prefix) but not its scopes. A token can be valid and properly formatted but lack the `issues:write` permission.

**Consequences:** GitHub issue creation silently fails (or returns 403). The capture appears "processed" in Builder Inbox but no issue exists in GitHub. If the code catches the error but doesn't surface it clearly, the user never knows.

**Prevention:**
1. **Use a separate token for Builder OS write operations** or upgrade the existing token's scopes. Don't reuse the read-only token.
2. **Required scopes for fine-grained PAT:** `Issues: Read and write`, `Contents: Read and write` (for @claude to commit), `Pull requests: Read and write` (for @claude PRs), `Metadata: Read-only` (always required).
3. **Validate token scopes at startup.** Call `GET /user` with the token and check the `X-OAuth-Scopes` header (classic PAT) or make a test API call.
4. **Add the new token to env validation** with its own Zod schema entry and prefix check.
5. **Add the new secret to Cloud Build** in `cloudbuild.yaml` `--set-secrets` and to GCP Secret Manager.

```typescript
// In src/lib/env.ts -- add new token for Builder OS
GSD_GITHUB_TOKEN: z
  .string()
  .min(1)
  .refine(isNotPlaceholder, "GSD_GITHUB_TOKEN looks like a placeholder")
  .refine(
    (val) => val.startsWith("ghp_") || val.startsWith("github_pat_"),
    "GSD_GITHUB_TOKEN must start with 'ghp_' or 'github_pat_'",
  ),
```

**Detection:** Try creating an issue via the API with the token. If you get 403 or "Resource not accessible", the scopes are wrong.

**Which phase:** Phase 1 (API foundation) for token provisioning; Phase 4 (GitHub integration) for implementation.

---

### Pitfall 6: Claude Code GitHub Actions Workflow Missing Required Permissions

**What goes wrong:** The `claude-code-action` workflow requires specific GitHub App installation AND repository secrets. Missing either one causes the workflow to silently fail or never trigger. Common failure: the workflow file exists but the Claude GitHub App isn't installed on the repo, so @claude mentions do nothing.

**Why it happens:** Setup requires THREE separate steps that are easy to skip: (1) Install the Claude GitHub App on the repo, (2) Add `ANTHROPIC_API_KEY` as a repository secret, (3) Create the workflow YAML with correct trigger events. Missing any one step means no response to @claude.

**Consequences:** Developer mentions @claude in an issue expecting automated triage/implementation. Nothing happens. No error message, no notification. The issue sits untouched until someone notices days later.

**Prevention:**
1. **Use `/install-github-app` from the Claude Code CLI** for guided setup (handles all three steps).
2. **Verify all three components exist** before declaring setup complete:
   - `gh api /repos/{owner}/{repo}/installation` returns 200 (app installed)
   - `gh secret list` includes `ANTHROPIC_API_KEY`
   - `.github/workflows/claude.yml` exists with correct triggers
3. **Workflow MUST listen to both `issue_comment` and `pull_request_review_comment`** for full coverage.
4. **Test with a real @claude mention** in a test issue before relying on it.

```yaml
# .github/workflows/claude.yml - Complete working config
name: Claude
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]

jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'issues' && contains(github.event.issue.body, '@claude'))
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Detection:** Mention @claude in a test issue. If no response within 2 minutes, check Actions tab for failed runs or missing workflow.

**Which phase:** Phase 4 (GitHub integration) -- but should be set up early so it's available for all subsequent phases.

---

## Moderate Pitfalls

Mistakes that cause degraded functionality, confusing UX, or require significant debugging.

---

### Pitfall 7: Discord Webhook Rate Limits Causing Dropped Alerts

**What goes wrong:** Discord webhooks are rate-limited to 5 requests per 2 seconds per webhook URL. If multiple captures arrive in quick succession (e.g., batch-processing backlogged captures), alerts are dropped silently (429 response) or the webhook URL gets temporarily blocked.

**Why it happens:** The capture processing pipeline fires a Discord alert for each processed capture. During a burst (or when replaying failed captures), the rate limit is easily exceeded.

**Prevention:**
1. **Implement a simple queue with rate limiting.** Use a debounce/batch approach: collect alerts for 2 seconds, then send up to 5 at once.
2. **Handle 429 responses with retry-after.** Discord returns `X-RateLimit-Reset-After` header. Wait that many seconds before retrying.
3. **Batch multiple captures into a single embed message.** Instead of one message per capture, send a summary embed with multiple fields.
4. **Non-critical path: fire-and-forget with error logging.** Discord alerts are supplementary. Never block capture processing on Discord delivery.

```typescript
async function sendDiscordAlert(webhookUrl: string, payload: object): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("X-RateLimit-Reset-After") ?? "2");
    console.warn(`Discord rate limited. Retry after ${retryAfter}s`);
    // Queue for retry, don't block
    setTimeout(() => sendDiscordAlert(webhookUrl, payload), retryAfter * 1000);
    return;
  }

  if (!response.ok) {
    console.error(`Discord webhook failed: ${response.status}`);
  }
}
```

**Also watch for:**
- **Embed character limits:** Total across all embeds in a message must be <= 6,000 characters. A long dictation transcript could exceed this. Truncate with `"..."` suffix.
- **Content field limit:** 2,000 characters max for the message content (outside embeds).
- **Field value limit:** 1,024 characters per embed field value. Truncate long bodies.

**Which phase:** Phase 5 (Discord integration) -- but the queue pattern should be designed in Phase 1 as a shared utility.

---

### Pitfall 8: Firebase Cloud Storage Bucket CORS Not Configured for Direct Upload

**What goes wrong:** If using signed URLs for direct browser/Shortcuts upload to GCS, the upload fails with a CORS error because the bucket doesn't have CORS headers configured. The default Firebase Storage bucket has no CORS policy.

**Why it happens:** Firebase Storage CORS is configured at the bucket level using `gsutil` or `gcloud storage`, not through the Firebase Console UI. There's no visual indicator that CORS is unconfigured. The project already uses GCS (brand scraper assets), but those uploads go through the brand-scraper service (server-to-server), not directly from a client.

**Consequences:** Direct uploads from Shortcuts fail with an opaque network error. The signed URL is valid, the auth is correct, but the preflight OPTIONS request gets rejected.

**Prevention:**
1. **If uploading through the Next.js API route (proxy pattern):** CORS on the bucket doesn't matter because the upload is server-to-server. This is the simpler path and matches the existing proxy pattern used for chatbot and brand scraper.
2. **If using signed URLs for direct upload:** Configure CORS on the bucket:

```json
[
  {
    "origin": ["https://dan-weinbeck.com", "https://dev.dan-weinbeck.com"],
    "method": ["GET", "PUT", "POST"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Content-Length", "x-goog-resumable"]
  }
]
```

Apply with: `gcloud storage buckets update gs://BUCKET_NAME --cors-file=cors.json`

3. **Recommendation: Use the proxy pattern** (upload to Next.js API route, which uploads to GCS server-side). This avoids CORS entirely, matches existing patterns, and keeps the GCS bucket unexposed to the internet.

**Detection:** Try uploading a file directly to a signed URL from a browser. If you see "No 'Access-Control-Allow-Origin' header", CORS is missing.

**Which phase:** Phase 2 (screenshot ingest) -- but the architectural decision (proxy vs direct) must be made in Phase 1.

---

### Pitfall 9: Existing Env Validation Singleton Breaks When Adding New Required Vars

**What goes wrong:** The existing `src/lib/env.ts` uses a lazy singleton pattern (`_serverEnv` cached on first call). Adding new required env vars (like `GSD_API_KEY`, `GSD_GITHUB_TOKEN`, `DISCORD_WEBHOOK_URL`) to the schema breaks the build for developers who don't have those vars set, even if they're not working on Builder OS features.

**Why it happens:** The `serverEnvSchema` validates ALL vars on first call to `serverEnv()`. If a new required var is missing, the entire app crashes at startup. The current schema uses `.optional()` for most API keys (STRIPE, OPENAI, etc.) specifically to avoid this problem, but a new developer might add Builder OS vars as required.

**Consequences:** `npm run dev` fails for all developers who haven't set the new vars. CI/CD breaks if the secrets aren't added to Cloud Build. The build step in Docker fails if the env vars aren't available (though build-time vs runtime is already handled correctly for `NEXT_PUBLIC_*` vars).

**Prevention:**
1. **All new Builder OS env vars MUST be `.optional()` in the schema** with runtime checks at the point of use (not at startup).
2. **Follow the existing pattern:** `STRIPE_SECRET_KEY`, `OPENAI_API_KEY` etc. are all optional with prefix validation.
3. **Add feature-specific validation functions** that check for required vars only when that feature is used:

```typescript
// In src/lib/env.ts
GSD_API_KEY: z
  .string()
  .min(1)
  .refine(isNotPlaceholder, "GSD_API_KEY looks like a placeholder")
  .optional(),

DISCORD_WEBHOOK_URL: z
  .string()
  .url("DISCORD_WEBHOOK_URL must be a valid URL")
  .refine(
    (val) => val.includes("discord.com/api/webhooks/"),
    "DISCORD_WEBHOOK_URL must be a Discord webhook URL",
  )
  .optional(),

// In the capture route handler
export async function POST(request: Request) {
  const env = serverEnv();
  if (!env.GSD_API_KEY) {
    return Response.json(
      { error: "GSD capture not configured" },
      { status: 503 },
    );
  }
  // ...
}
```

4. **Update `.env.example`** with all new vars (name + description, no real values).
5. **Update `cloudbuild.yaml` `--set-secrets`** with new Secret Manager entries.
6. **Update `docs/DEPLOYMENT.md`** with new env var documentation.

**Detection:** Run `npm run dev` without the new vars set. If it crashes, the vars aren't optional.

**Which phase:** Phase 1 (API foundation) -- must be done before any new env vars are added.

---

### Pitfall 10: In-Memory Rate Limiting Doesn't Work on Cloud Run

**What goes wrong:** The existing rate limiting pattern in `src/lib/actions/contact.ts` uses an in-memory `Map` to track request timestamps per IP. On Cloud Run, each container instance has its own memory space, and instances scale to 0 when idle. Rate limit state is lost on every scale-down and is never shared between instances.

**Why it happens:** Cloud Run is stateless by design. The `rateLimitMap` works in development (single process, persistent) but is ineffective in production (multiple instances, ephemeral).

**Consequences:** For the contact form, this is acceptable (the form has other protections). For the Builder OS capture endpoint with API key auth, the rate limit is the primary abuse protection. Without it, a leaked API key allows unlimited requests.

**Prevention:**
1. **For Builder OS: API key auth IS the primary gate.** Rate limiting is defense-in-depth, not the primary control. A leaked key should be rotated, not rate-limited.
2. **If rate limiting is needed:** Use Firestore (existing) or Redis (new dependency) for shared state. Firestore is simpler given existing infrastructure:

```typescript
// Firestore-based rate limiting (simple, sufficient for personal use)
async function checkRateLimit(apiKey: string, limit: number, windowMs: number): Promise<boolean> {
  const ref = db.collection("rate_limits").doc(apiKey);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const now = Date.now();
    const timestamps: number[] = doc.exists
      ? (doc.data()?.timestamps ?? []).filter((t: number) => now - t < windowMs)
      : [];
    if (timestamps.length >= limit) return false;
    timestamps.push(now);
    tx.set(ref, { timestamps, updatedAt: now });
    return true;
  });
}
```

3. **For the capture endpoint specifically:** Rate limit of 60 requests/minute per API key is generous for personal use and catches accidental loops.

**Detection:** Deploy to Cloud Run with min-instances=0. Make 10 requests. Wait for scale-down (5 minutes). Make 10 more. If all succeed, rate limiting isn't persistent.

**Which phase:** Phase 1 (API foundation) -- design the rate limiting approach before building endpoints.

---

### Pitfall 11: GitHub API Rate Limit Exhaustion from Existing + New Usage

**What goes wrong:** The existing app already uses the GitHub API for project cards and README rendering (ISR, hourly refresh). Adding issue creation, comment posting, and status checking for Builder OS adds more API calls through the same token. The combined usage could approach the 5,000 requests/hour limit during development or burst activity.

**Why it happens:** GitHub rate limits are per-token, not per-feature. The existing ISR-based GitHub calls are invisible (they happen on timer) and could be consuming a significant portion of the budget without anyone noticing.

**Consequences:** Rate limit exhaustion causes 403 responses. Existing features (project cards) and new features (issue creation) both break simultaneously. The error is transient (resets hourly) but confusing.

**Prevention:**
1. **Use separate tokens for read (existing) and write (Builder OS).** Different fine-grained PATs with different scopes. Each gets its own 5,000/hour budget.
2. **Cache GitHub API responses aggressively.** The existing ISR handles this for project data. Builder OS should cache issue metadata similarly.
3. **Monitor rate limit headers.** Every GitHub API response includes `X-RateLimit-Remaining`. Log it when it drops below 1,000.
4. **Implement conditional requests.** Use `If-None-Match` / `If-Modified-Since` headers. 304 responses don't count against the rate limit.

```typescript
// Check remaining rate limit
async function githubApiCall(url: string, token: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const remaining = Number(response.headers.get("X-RateLimit-Remaining"));
  if (remaining < 100) {
    console.warn(`GitHub API rate limit low: ${remaining} remaining`);
  }
  return response;
}
```

**Which phase:** Phase 4 (GitHub integration) -- but token separation should be decided in Phase 1.

---

### Pitfall 12: Shortcuts Multipart Form Body Format Quirks

**What goes wrong:** iPhone Shortcuts' "Get Contents of URL" action with "Form" body type generates multipart/form-data that may have unexpected characteristics: (a) field names are exactly as entered in the Shortcuts UI (case-sensitive), (b) file fields use the original filename from the photo library (e.g., `IMG_1234.HEIC`), (c) the Content-Type for image fields may be `image/heic` which Next.js `request.formData()` handles but downstream code may not expect.

**Why it happens:** Shortcuts' form builder is visual and doesn't expose low-level HTTP details. Developers build the API expecting `application/json` bodies (the default for modern APIs) and only discover the form-data format during integration testing.

**Consequences:** Field name mismatches (`Transcript` vs `transcript`), unexpected content types, or missing fields cause 400 errors that are hard to debug from the Shortcuts side (no detailed error messages shown to user).

**Prevention:**
1. **Design the API to accept BOTH `application/json` and `multipart/form-data`** on the same endpoint. Check `Content-Type` header and parse accordingly.
2. **Use case-insensitive field matching** for form data fields.
3. **Handle HEIC images:** Either accept and store as-is (GCS handles any content type) or convert server-side using Sharp (already in the project's Docker image for Next.js image optimization).
4. **Return simple, short error messages.** Shortcuts shows the response body in alerts. Keep it under 200 characters.

```typescript
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let transcript: string;
  let screenshot: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    // Case-insensitive field lookup
    transcript = String(formData.get("transcript") ?? formData.get("Transcript") ?? "");
    screenshot = (formData.get("screenshot") ?? formData.get("Screenshot")) as File | null;
  } else {
    const json = await request.json();
    transcript = json.transcript ?? "";
  }
  // ...
}
```

**Which phase:** Phase 1-2 (API foundation + screenshot ingest).

---

## Minor Pitfalls

Mistakes that cause minor issues, require debugging, or degrade DX.

---

### Pitfall 13: Discord Webhook URL Leaked in Client Bundle

**What goes wrong:** If the Discord webhook URL is referenced in a client component or accidentally imported, Next.js includes it in the client bundle. Anyone can extract it and spam the Discord channel.

**Prevention:** Store as a server-only env var (no `NEXT_PUBLIC_` prefix). Only reference in API routes or server actions. Add to `src/lib/env.ts` server schema. The existing pattern of server-only env vars handles this correctly -- just follow it.

**Which phase:** Phase 1 (env setup).

---

### Pitfall 14: Cloud Run Request Timeout Misaligned with Async Processing

**What goes wrong:** Cloud Run's default request timeout is 300 seconds (5 minutes). If the async capture processing (LLM + GitHub + Discord) takes longer than the request that triggered it, and the processing is done inside a `fetch()` to an internal endpoint or a background function that depends on the request lifecycle, it gets killed when the request times out.

**Prevention:** Use fire-and-forget patterns (`promise.catch(console.error)` without `await`) for async work triggered by the capture endpoint. The processing function should be self-contained and not depend on the request context. Alternatively, use Cloud Tasks for truly reliable async processing (but adds infrastructure complexity for a personal project).

**Which phase:** Phase 1 (architecture decision).

---

### Pitfall 15: Firestore Document Size Limit for Long Transcripts

**What goes wrong:** Firestore documents have a 1MB size limit. A long voice dictation transcript (unlikely but possible if the user speaks for 10+ minutes) plus metadata, LLM response, and processing history could approach this limit.

**Prevention:** Cap transcript length at 10,000 characters (about 5 minutes of speech). Store full transcripts > 10KB in Cloud Storage with a reference in Firestore. For the Builder Inbox, 10,000 characters is more than enough context.

**Which phase:** Phase 1 (Firestore schema design).

---

### Pitfall 16: GitHub Issue Body Markdown Formatting from LLM Output

**What goes wrong:** The LLM generates the issue body, which may include markdown that looks fine in the LLM response but renders badly on GitHub. Common issues: unescaped HTML in code blocks, excessive heading levels, missing newlines before lists, or generated content that triggers GitHub's autolinker incorrectly.

**Prevention:** Sanitize LLM output before posting to GitHub. Strip or escape HTML tags. Ensure code blocks are properly fenced. Test with GitHub's markdown preview API (`POST /markdown`) before creating the issue.

**Which phase:** Phase 4 (GitHub integration).

---

### Pitfall 17: Shortcut Variables Not Persisting Between Runs

**What goes wrong:** iPhone Shortcuts doesn't have persistent storage. If the Shortcut needs to store the API key, base URL, or last-used settings, these must be hardcoded in the Shortcut or stored in a file (e.g., a JSON file in iCloud Drive). Users expect to "set it up once" but Shortcuts requires explicit persistence mechanisms.

**Prevention:** Hardcode the API endpoint and key in the Shortcut itself (acceptable for personal use). Document the setup steps clearly with screenshots. Provide separate Shortcuts for different capture types (GSD Capture for dictation, Send to GSD for screenshots) rather than one complex Shortcut with branching logic.

**Which phase:** Phase 6 (Shortcuts documentation).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| API Foundation (Phase 1) | Timeout budget, auth security, env var management | Async-first architecture, `timingSafeEqual`, optional env vars |
| Screenshot Ingest (Phase 2) | Body size limits, HEIC handling, CORS | Proxy pattern (not direct upload), accept multiple content types |
| LLM Routing (Phase 3) | Misclassification, hallucinated confidence, prompt drift | Confidence threshold + Inbox fallback, few-shot examples, audit logging |
| GitHub Integration (Phase 4) | Token scopes, rate limits, Actions setup | Separate write token, scope validation, complete 3-step setup |
| Discord Alerts (Phase 5) | Rate limits, embed size, URL leakage | Queue with retry-after, truncation, server-only env var |
| Shortcuts Docs (Phase 6) | 25s timeout, form field naming, persistence | Async capture pattern, case-insensitive parsing, hardcoded config |
| Builder Inbox UI (Phase 7) | N/A (standard React/Next.js patterns) | Follow existing Control Center admin patterns |
| Cloud Build Deploy | Missing secrets, timeout config, env var sprawl | Update `--set-secrets` and `--set-env-vars` in cloudbuild.yaml |

---

## Integration Pitfalls (Cross-Cutting)

### Pitfall I-1: Existing `verifyUser` / `verifyAdmin` Pattern Doesn't Fit API Key Auth

The Builder OS capture endpoint uses API key auth (from Shortcuts), not Firebase ID tokens. The existing `verifyUser()` and `verifyAdmin()` functions expect `Authorization: Bearer <firebase-id-token>`. Using API key auth requires a NEW auth function, not a modification of existing ones.

**Prevention:** Create `src/lib/auth/apikey.ts` with a `verifyApiKey()` function. Keep it separate from Firebase auth. The capture API route uses `verifyApiKey()` while the Builder Inbox admin routes use the existing `verifyAdmin()`.

### Pitfall I-2: New API Routes Must Follow Existing Patterns

The project has established patterns for API routes (Zod validation, auth checks, error response format). New Builder OS routes must follow these patterns for consistency. Check existing routes like `src/app/api/tools/brand-scraper/scrape/route.ts` as templates.

### Pitfall I-3: Adding Cloud SQL Connection for Potential Builder OS Tables

If Builder OS needs its own database tables (captures, routing decisions), they should go in the existing PostgreSQL database (already connected via `--add-cloudsql-instances` in cloudbuild.yaml) using Prisma migrations. Don't create a new Firestore collection structure when relational data (captures with routing decisions, retries, status changes) is better suited to PostgreSQL.

**Counterpoint:** Simple captures without complex relationships are fine in Firestore (matching the existing contact form pattern). The choice depends on query complexity. If you need "show me all captures that were routed to GitHub Issues and had confidence > 0.8", that's a SQL query, not a Firestore query.

### Pitfall I-4: `cloudbuild.yaml` Secret Sprawl

Each new Builder OS env var needs to be added to BOTH the `--set-env-vars` (for non-secret config) AND `--set-secrets` (for secrets from Secret Manager) in `cloudbuild.yaml`. Missing one causes the feature to silently fail in production while working locally.

**New secrets to add:** `GSD_API_KEY`, `GSD_GITHUB_TOKEN` (if separate from existing), `ANTHROPIC_API_KEY` (for Claude Actions -- this one goes in GitHub Secrets, not Cloud Build), `DISCORD_WEBHOOK_URL`.

**New env vars to add:** None expected (all Builder OS config should be secrets).

---

## Sources

- [Apple Community: Get Contents timeout](https://discussions.apple.com/thread/255617611) -- 25-second timeout confirmation
- [Apple Support: API limitations in Shortcuts](https://support.apple.com/guide/shortcuts/api-limitations-apd891a6c84e/ios)
- [Next.js: proxyClientMaxBodySize](https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize)
- [Next.js GitHub Issue #57501: App Router body size limit](https://github.com/vercel/next.js/issues/57501)
- [Cloud Run: Configure request timeout](https://docs.cloud.google.com/run/docs/configuring/request-timeout) -- 300s default, 3600s max
- [Discord Webhooks Guide: Rate Limits](https://birdie0.github.io/discord-webhooks-guide/other/rate_limits.html) -- 5 per 2 seconds
- [Discord Webhooks Guide: Field Limits](https://birdie0.github.io/discord-webhooks-guide/other/field_limits.html) -- 6000 char total, 2000 content
- [GitHub Docs: Rate limits for REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) -- 5000/hour per token
- [GitHub Docs: Fine-grained PAT permissions](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)
- [anthropics/claude-code-action setup](https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md)
- [Claude Code GitHub Actions docs](https://code.claude.com/docs/en/github-actions)
- [Node.js Security Best Practices: Timing attacks](https://nodejs.org/en/learn/getting-started/security-best-practices)
- [Snyk: Node.js timing attack](https://snyk.io/blog/node-js-timing-attack-ccc-ctf/)
- [Google Cloud Storage: CORS configuration](https://cloud.google.com/storage/docs/cross-origin)
- [Gemini API: Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Confidence-Aware Routing paper](https://arxiv.org/html/2510.01237)
