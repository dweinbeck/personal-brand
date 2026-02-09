# Technology Stack

**Project:** Personal Brand - Billing & Credits System (Validation + Deployment)
**Researched:** 2026-02-09
**Overall confidence:** HIGH
**Mode:** Ecosystem (focused on stack gaps for deploying existing billing code)

## Executive Summary

The billing system code (~3K LOC across 30+ files) is already written and uses only dependencies that are already installed. **No new npm packages are needed.** The stack gap is not missing libraries -- it is missing infrastructure configuration (Firestore indexes, GCP secrets, Stripe webhook endpoint, Firebase Auth domains) and local development tooling (Stripe CLI). For GCS signed URLs, the brand scraper v1.1 service generates them externally -- the Next.js app just passes them through. `firebase-admin` already bundles `@google-cloud/storage` if server-side signing is ever needed.

---

## Current Stack (Already Installed -- No Changes Needed)

These dependencies are already in `package.json` and used by the billing code.

### Core Application
| Technology | Installed Version | Latest | Purpose | Status |
|------------|-------------------|--------|---------|--------|
| next | 16.1.6 | 16.1.6 | App framework (App Router, RSC, API routes) | Current |
| react / react-dom | 19.2.3 | 19.2.3 | UI framework | Current |
| typescript | ^5 | 5.x | Type safety | Current |
| tailwindcss | ^4 | 4.x | Styling | Current |

### Billing Dependencies (Already Installed)
| Technology | Installed Version | Latest | Purpose | Status |
|------------|-------------------|--------|---------|--------|
| stripe | 20.3.1 | 20.3.1 | Checkout Sessions, webhook signature verification | Current |
| firebase | 12.8.0 | 12.9.0 | Client SDK: Auth (Google Sign-In), `getIdToken()` | Minor behind (patch, not blocking) |
| firebase-admin | 13.6.0 | 13.6.1 | Server SDK: `verifyIdToken()`, Firestore, Storage | Patch behind (not blocking) |
| zod | 4.3.6 | 4.3.6 | Schema validation for API inputs | Current |
| swr | 2.4.0 | 2.4.0 | Client-side polling for brand scraper job status | Current |

### Dev Tools (Already Installed)
| Technology | Installed Version | Latest | Purpose | Status |
|------------|-------------------|--------|---------|--------|
| vitest | 3.2.4 | 4.0.18 | Test runner | Major behind (v4 is major bump; upgrade NOT recommended during billing validation) |
| @biomejs/biome | 2.2.0 | 2.3.14 | Linting and formatting | Minor behind (optional bump, not blocking) |

**All versions verified via `npm view` and `npm list` on 2026-02-09.**

---

## GCS Signed URLs: No New Dependency Needed

### Key Finding

`firebase-admin@13.6.0` already bundles `@google-cloud/storage@7.18.0` as a transitive dependency. The `getSignedUrl()` method is available via `firebase-admin/storage`. Verified locally:

```
$ npm list @google-cloud/storage
personal-brand@0.1.0
  firebase-admin@13.6.0
    @google-cloud/storage@7.18.0

$ node -e "const admin = require('firebase-admin'); console.log(typeof admin.storage)"
function

$ node -e "const { Storage } = require('@google-cloud/storage'); const f = new Storage({projectId:'x'}).bucket('b').file('f'); console.log(typeof f.getSignedUrl)"
function
```

### Brand Scraper v1.1: Pass-Through Pattern (Recommended)

The brand scraper Fastify service generates signed GCS URLs for `brand_json_url` and `assets_zip_url`. These are already typed in `src/lib/brand-scraper/types.ts`:

```typescript
export const jobStatusSchema = z.object({
  job_id: z.string(),
  status: z.string(),
  result: brandTaxonomySchema.optional(),
  error: z.string().optional(),
  brand_json_url: z.string().optional(),   // <-- GCS signed URL from scraper
  assets_zip_url: z.string().optional(),   // <-- GCS signed URL from scraper
}).passthrough();
```

The `DownloadLinks` component in `src/components/admin/brand-scraper/DownloadLinks.tsx` renders these as direct download links. The `UserBrandScraperPage` component already passes them through:

```typescript
<BrandResultsGallery
  result={data.result}
  brandJsonUrl={data.brand_json_url}
  assetsZipUrl={data.assets_zip_url}
/>
```

**No code changes needed for GCS URL handling.** The signed URLs flow from scraper service through the Next.js API proxy to the browser.

### If Server-Side Signing Is Ever Needed

Usage pattern (already available, no install required):

```typescript
import { getStorage } from "firebase-admin/storage";

export async function generateSignedUrl(
  bucketName: string,
  filePath: string,
  expiresInMinutes = 15,
): Promise<string> {
  const bucket = getStorage().bucket(bucketName);
  const file = bucket.file(filePath);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
  return url;
}
```

**Prerequisite for server-side signing:** The Cloud Run service account needs `roles/iam.serviceAccountTokenCreator` to self-sign. This is NOT currently granted and NOT needed for the pass-through pattern.

---

## What Actually Needs to Change (Infrastructure Gaps)

### 1. Stripe CLI (Local Development Tool -- NOT Installed)

**What:** Stripe CLI creates a local tunnel to forward webhook events to `localhost:3000/api/billing/webhook`.

**Why needed:** The `checkout.session.completed` webhook in `src/app/api/billing/webhook/route.ts` cannot be tested without it. Stripe sends webhooks to a public URL -- the CLI creates a tunnel.

**Install and usage:**
```bash
# macOS install
brew install stripe/stripe-cli/stripe

# Authenticate (one-time)
stripe login

# Forward webhooks during local testing
stripe listen --forward-to localhost:3000/api/billing/webhook
# Outputs: whsec_... → use as STRIPE_WEBHOOK_SECRET in .env.local
```

**Confidence:** HIGH -- standard Stripe local development workflow. Verified: `which stripe` returns "not found" on this machine.

### 2. Firestore Composite Indexes (Missing)

**What:** The billing code uses compound Firestore queries that require composite indexes.

**Queries requiring indexes (from `src/lib/billing/firestore.ts`):**

| Collection | Query Fields | Function | Line |
|------------|-------------|----------|------|
| `billing_tool_usage` | `uid` ASC + `createdAt` DESC | `getUserUsage()` | 481-486 |
| `billing_tool_usage` | `uid` + `externalJobId` | `findUsageByExternalJobId()` | 537-543 |
| `billing_purchases` | `uid` ASC + `createdAt` DESC | `getUserPurchases()` | 490-498 |

**Current state:** `firebase.json` only references `firestore.rules`. There is no `firestore.indexes.json`. Without these indexes, queries will throw `FAILED_PRECONDITION` errors at runtime.

**Fix:** Create `firestore.indexes.json` and deploy:
```bash
firebase deploy --only firestore:indexes --project <PROJECT_ID>
```

**Confidence:** HIGH -- verified by reading all `.where()` + `.orderBy()` patterns in `firestore.ts`.

### 3. GCP Secret Manager Entries (Must Exist Before First Deploy)

**What:** Two secrets must exist in GCP Secret Manager before the first billing-enabled deploy.

**Already wired in `cloudbuild.yaml` line 39:**
```yaml
--set-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest
```

**Secrets to create:**

| Secret Name | Value Source | Command |
|-------------|-------------|---------|
| `stripe-secret-key` | Stripe Dashboard > Developers > API Keys > Secret key | `echo -n "sk_live_..." \| gcloud secrets create stripe-secret-key --data-file=-` |
| `stripe-webhook-secret` | Stripe Dashboard > Developers > Webhooks > Signing secret | `echo -n "whsec_..." \| gcloud secrets create stripe-webhook-secret --data-file=-` |

**The Cloud Run service account** (`cloudrun-site`) needs `roles/secretmanager.secretAccessor`. The `--set-secrets` flag in `gcloud run deploy` implicitly grants this if the deploying user has `secretmanager.versions.access` permission.

**Confidence:** HIGH -- the wiring already exists in `cloudbuild.yaml`; only the secret values need to be created.

### 4. Stripe Webhook Endpoint (Production)

**What:** A webhook endpoint must be registered in the Stripe Dashboard pointing to the production URL.

**Steps:**
1. Stripe Dashboard > Developers > Webhooks > Add endpoint
2. URL: `https://<cloud-run-url>/api/billing/webhook`
3. Events to listen: `checkout.session.completed`
4. Copy signing secret to GCP Secret Manager (see above)

**Confidence:** HIGH -- webhook route code is complete in `src/app/api/billing/webhook/route.ts`.

### 5. Firebase Auth Domain Configuration

**What:** Firebase Auth requires authorized domains for Google Sign-In popup to work in production.

**Steps:**
1. Firebase Console > Authentication > Settings > Authorized domains
2. Add: Cloud Run URL (e.g., `personal-brand-xxxxx-uc.a.run.app`)
3. Add: custom domain if applicable
4. Verify `_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` in Cloud Build trigger is set correctly (typically `<project-id>.firebaseapp.com`)

**Already wired:** `cloudbuild.yaml` passes `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` as a build arg. `src/lib/firebase-client.ts` reads it. `src/context/AuthContext.tsx` initializes the auth listener. The plumbing is complete -- only the domain allowlist needs configuration.

**Confidence:** HIGH.

### 6. Cloud Run Service Account Roles

**Currently granted (from `scripts/deploy.sh`):**

| Role | Purpose | Status |
|------|---------|--------|
| `roles/datastore.user` | Firestore read/write for billing collections | Granted |

**Implicitly granted via `--set-secrets`:**

| Role | Purpose | Status |
|------|---------|--------|
| `roles/secretmanager.secretAccessor` | Read Stripe secrets at runtime | Auto-granted by `--set-secrets` |

**NOT needed (for now):**

| Role | Purpose | When Needed |
|------|---------|-------------|
| `roles/iam.serviceAccountTokenCreator` | Self-sign GCS URLs | Only if app generates its own signed URLs (brand scraper does this instead) |
| `roles/storage.objectViewer` | Read GCS objects directly | Only if app reads GCS objects server-side (not needed for pass-through pattern) |

**Confidence:** HIGH.

---

## Testing Stack Assessment

### Current Test Coverage

| File | Tests | What It Covers |
|------|-------|----------------|
| `src/lib/billing/__tests__/types.test.ts` | 11 | Zod schema validation (creditPackSchema, adminAdjustSchema, refundReasonSchema, pricingUpdateSchema) |
| `src/lib/billing/__tests__/credits.test.ts` | 7 | Credit pack economics (1 credit = 1 cent), tool pricing invariants, idempotency key format |

**Total: 18 tests across 2 files.** All are pure unit tests with zero mocking -- they test schemas and constants only.

### What Tests Do NOT Cover

- Firestore transaction logic (debitForToolUse, applyPurchaseFromStripe, refundUsage, etc.)
- Stripe webhook signature verification
- API route handlers (auth checks, error handling, response shapes)
- Auth token verification flow (`verifyUser` / `verifyAdmin`)
- UI component rendering

### Testing Strategy: Do NOT Add Testing Libraries

**Rationale:** The billing code is ~500 LOC of Firestore transactions. Meaningfully unit-testing them requires either:
1. A Firestore emulator (heavy, flaky, painful to set up in CI)
2. Mocking the Firestore SDK (brittle, tests the mock not the code)

For a solo personal brand site, the cost/benefit favors:
1. **Expand pure unit tests** -- more schema tests, edge cases, input validation
2. **Manual E2E via Stripe CLI** -- sign in, buy credits, verify webhook, check balance
3. **Smoke test API routes** -- verify 401 without auth, 400 with invalid body

| Library Considered | Why NOT |
|--------------------|---------|
| `@firebase/rules-unit-testing` | Tests Firestore security rules, not Admin SDK transaction logic |
| Firebase Emulator Suite | Heavyweight for a personal brand site; requires Java runtime |
| `stripe-mock` | The webhook handler is <60 LOC; test with Stripe CLI instead |
| `msw` (Mock Service Worker) | API routes use server-side Firebase Admin SDK, not client fetch |
| `@testing-library/react` | Billing UI is simple forms; manual testing is more cost-effective |
| `supertest` / `next-test-api-route-handler` | Added complexity for testing route handlers that are thin wrappers |

**Confidence:** MEDIUM -- this is an opinionated tradeoff. A team product would benefit from emulator-based tests.

---

## Alternatives Considered

### GCS URL Handling

| Approach | Recommended | Why |
|----------|-------------|-----|
| Pass through signed URLs from brand scraper | **Yes** | Zero code changes. URLs already flow through `jobStatusSchema` to `DownloadLinks`. |
| Proxy GCS downloads through Next.js API route | No | Adds latency, wastes Cloud Run bandwidth/memory. |
| Add `@google-cloud/storage` as direct dependency | No | Already bundled inside `firebase-admin`. Adding directly risks version conflicts. |
| Use public GCS URLs | No | Exposes bucket contents. Signed URLs expire and are scoped per-file. |

### Auth Pattern

| Approach | Recommended | Why |
|----------|-------------|-----|
| Firebase Admin `verifyIdToken()` per-request | **Yes (current)** | Already implemented. Stateless, scales with Cloud Run. |
| Session cookies | No | Adds complexity (cookie management, CSRF). Firebase ID tokens auto-refresh. |
| NextAuth.js / Auth.js | No | Would require rewriting existing auth flow. Firebase Auth already works. |

### Stripe Integration

| Approach | Recommended | Why |
|----------|-------------|-----|
| Stripe Checkout (redirect) | **Yes (current)** | Low PCI scope. Stripe hosts payment form. Already implemented. |
| Stripe Elements (embedded) | No for MVP | Higher PCI requirements. Not worth it for one credit pack. |
| Stripe Payment Links | No | Cannot attach custom metadata (uid, email, credits). |

### Secrets Management

| Approach | Recommended | Why |
|----------|-------------|-----|
| GCP Secret Manager via `--set-secrets` | **Yes (current)** | Already wired in `cloudbuild.yaml`. Secrets injected as env vars at runtime. |
| Build-time env vars | No | Secrets would be baked into the Docker image. Security risk. |
| External vault (HashiCorp Vault, etc.) | No | Overkill. GCP Secret Manager is native to Cloud Run. |

---

## What NOT to Add

| Technology | Why Not |
|------------|---------|
| `@google-cloud/storage` (direct) | Already bundled in `firebase-admin@13.6.0` as `@google-cloud/storage@7.18.0`. Adding directly risks version conflicts and bloats `package.json`. |
| `next-auth` / `auth.js` | Firebase Auth is fully integrated (client + server). Switching would be a rewrite. |
| `prisma` / `drizzle` / any ORM | Firestore is not SQL. Admin SDK with transactions is idiomatic Firestore. |
| `bull` / `bullmq` | No job queuing needed in Next.js. Brand scraper runs on separate Fastify service. |
| `stripe-event-types` | `stripe@20.3.1` already includes full TypeScript types for all event types. |
| `firebase-functions` | Not using Firebase Functions. App runs on Cloud Run with Next.js API routes. |
| React testing library | Billing UI is a balance display + Stripe redirect button. Manual E2E suffices. |
| `vitest@4.x` upgrade | Major version bump during billing validation adds risk with no benefit. Defer. |

---

## Installation Commands

### npm: Nothing to Install

All billing dependencies are already in `package.json`:

```bash
# Verify deps are installed
npm ci

# Run existing billing tests
npm test

# Lint billing code
npm run lint

# Build (includes TypeScript type checking)
npm run build
```

### Local Development Tools (One-Time Setup)

```bash
# Stripe CLI -- required for webhook testing
brew install stripe/stripe-cli/stripe
stripe login

# Firebase CLI -- required for deploying Firestore indexes
npm install -g firebase-tools
firebase login
```

### Production Infrastructure Setup (One-Time)

```bash
# Create Stripe secrets in GCP Secret Manager
echo -n "sk_live_..." | gcloud secrets create stripe-secret-key --data-file=- --project=<PROJECT_ID>
echo -n "whsec_..." | gcloud secrets create stripe-webhook-secret --data-file=- --project=<PROJECT_ID>

# Deploy Firestore composite indexes (after creating firestore.indexes.json)
firebase deploy --only firestore:indexes --project <PROJECT_ID>
```

---

## Environment Variables (Complete Inventory)

### Already Configured in `cloudbuild.yaml`

| Variable | Type | Source | Billing Role |
|----------|------|--------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Build arg | Cloud Build substitution | Client-side Firebase Auth init |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Build arg | Cloud Build substitution | Google Sign-In popup domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Build arg | Cloud Build substitution | Client-side Firebase init |
| `FIREBASE_PROJECT_ID` | Runtime env | Cloud Build substitution | Admin SDK ADC project binding |
| `STRIPE_SECRET_KEY` | Runtime secret | GCP Secret Manager | Stripe API calls (checkout, construct event) |
| `STRIPE_WEBHOOK_SECRET` | Runtime secret | GCP Secret Manager | Webhook signature verification |
| `BRAND_SCRAPER_API_URL` | Runtime env | Cloud Build substitution | Proxy requests to brand scraper Fastify service |

### No New Environment Variables Needed

The existing set covers all billing functionality. No additions to `cloudbuild.yaml`, `.env.local.example`, or `Dockerfile` are needed for the billing system.

---

## Sources

### Verified Locally (HIGH confidence)
- **Package versions:** All verified via `npm view <package> version` and `npm list` on 2026-02-09
- **GCS signed URL capability:** Verified that `firebase-admin@13.6.0` bundles `@google-cloud/storage@7.18.0` with `getSignedUrl()` method available
- **Stripe secret wiring:** Verified in `cloudbuild.yaml` line 39: `--set-secrets=...STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest`
- **Firebase Auth config flow:** Verified in `src/lib/firebase-client.ts` (reads `NEXT_PUBLIC_*` env vars), `src/context/AuthContext.tsx` (initializes auth listener), `cloudbuild.yaml` (passes build args)
- **Firestore query patterns:** All `.where()` + `.orderBy()` patterns analyzed from `src/lib/billing/firestore.ts`
- **Existing test coverage:** Analyzed both test files in `src/lib/billing/__tests__/`
- **Stripe CLI absence:** Verified via `which stripe` returning "not found"
- **Missing Firestore indexes:** Verified `firebase.json` has no index configuration
- **Billing code inventory:** Read all 30+ billing-related source files to confirm dependency usage
