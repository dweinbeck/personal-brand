# Architecture Patterns: Billing System Production Deployment

**Project:** personal-brand -- Billing validation and production deployment
**Researched:** 2026-02-09
**Confidence:** HIGH (direct codebase analysis of all integration points)

---

## Current Architecture Snapshot

The billing system is fully implemented in code but has never been deployed to production. All components exist and are wired together. The gap is deployment configuration, not code.

### Existing Code Inventory

```
BILLING LIBRARY (server-side, all implemented):
  src/lib/billing/
    types.ts          -- Zod schemas, TypeScript types, CREDIT_PACKS
    stripe.ts         -- Stripe SDK singleton, createCheckoutSession, constructWebhookEvent
    firestore.ts      -- All Firestore operations (ensureUser, debit, refund, purchase, admin)
    tools.ts          -- Tool pricing seed data

AUTH LIBRARY (server-side, all implemented):
  src/lib/auth/
    user.ts           -- verifyUser(): any authenticated Firebase user
    admin.ts          -- verifyAdmin(): admin-only (email check)

BILLING API ROUTES (all implemented):
  src/app/api/billing/
    me/route.ts       -- GET: balance + active pricing (verifyUser)
    checkout/route.ts -- POST: create Stripe Checkout session (verifyUser)
    webhook/route.ts  -- POST: Stripe webhook (signature-verified, no auth)

TOOL API ROUTES (all implemented):
  src/app/api/tools/brand-scraper/
    scrape/route.ts   -- POST: debit credits + submit job (verifyUser + idempotency)
    jobs/[id]/route.ts -- GET: poll job status + auto-refund/mark succeeded (verifyUser)

ADMIN BILLING ROUTES (all implemented):
  src/app/api/admin/billing/
    users/route.ts            -- GET: list all billing users (verifyAdmin)
    users/[uid]/route.ts      -- GET: user detail + ledger + usage (verifyAdmin)
    users/[uid]/adjust/route.ts -- POST: manual credit adjustment (verifyAdmin)
    pricing/route.ts          -- GET/POST: tool pricing CRUD (verifyAdmin)
    usage/[usageId]/refund/route.ts -- POST: manual refund (verifyAdmin)

CLIENT COMPONENTS (all implemented):
  src/components/billing/BillingPage.tsx        -- Balance display + buy button
  src/components/tools/brand-scraper/
    UserBrandScraperPage.tsx                    -- Full user-facing scraper with billing
  src/components/admin/brand-scraper/
    BrandResultsGallery.tsx                     -- Results with download links
    DownloadLinks.tsx                           -- GCS signed URL download buttons

CLIENT AUTH (all implemented):
  src/lib/firebase-client.ts   -- Firebase Client SDK singleton (NEXT_PUBLIC_* vars)
  src/context/AuthContext.tsx   -- Auth state provider (user, loading)
  src/components/auth/AuthGuard.tsx -- Sign-in gate for user-facing pages
  src/components/layout/AuthButton.tsx -- Nav sign-in / user menu

BRAND SCRAPER CLIENT (all implemented):
  src/lib/brand-scraper/
    client.ts   -- HTTP client for external brand scraper service
    hooks.ts    -- SWR-based polling hook for job status
    types.ts    -- Zod schemas with .passthrough() for forward compatibility

PAGES (all implemented):
  src/app/billing/page.tsx          -- User billing page
  src/app/billing/success/page.tsx  -- Post-checkout success
  src/app/billing/cancel/page.tsx   -- Post-checkout cancel
  src/app/apps/brand-scraper/page.tsx -- User-facing brand scraper
```

### What is Already Deployed (Production)

```
DEPLOYED AND WORKING:
  - Cloud Run service: personal-brand (us-central1)
  - Custom domain: dan-weinbeck.com
  - Artifact Registry: personal-brand/site
  - Service account: cloudrun-site@personal-brand-486314.iam.gserviceaccount.com
  - Firebase Admin SDK (ADC on Cloud Run)
  - Firestore (datastore.user role granted)
  - Cloud Build (cloudbuild.yaml)
  - Secret Manager secrets: github-token, todoist-api-token

DEPLOYED BUT NOT YET CONFIGURED:
  - Firebase Auth client SDK (NEXT_PUBLIC_* vars passed as build args)
  - No: Firebase Console authorized domains includes custom domain

NOT YET DEPLOYED:
  - Stripe secrets in Secret Manager
  - Stripe webhook endpoint registered in Stripe Dashboard
  - Brand scraper URL (BRAND_SCRAPER_API_URL) pointing to production service
  - Tool pricing seed data in Firestore
  - Service account IAM for Secret Manager access to new secrets
```

---

## Integration Architecture: What Needs to Change

### Overview: Zero Code Changes Required

The billing system code is complete. Deployment requires only infrastructure configuration and environment variable wiring. This is a configuration milestone, not a coding milestone.

```
                    BROWSER
                      |
          +-----------+-----------+
          |                       |
     Firebase Auth           Stripe Checkout
     (Google Sign-in)        (Redirect flow)
          |                       |
          v                       v
    +--Cloud Run--+        +--Stripe---+
    | Next.js     |        | Dashboard |
    | API Routes  |<-------| Webhook   |
    +------+------+        +-----------+
           |
    +------+------+
    |             |
    v             v
 Firestore   Brand Scraper
 (billing    (Cloud Run
  ledger)     external svc)
                  |
                  v
              GCS Buckets
              (signed URLs)
```

---

## Integration Point 1: GCP Secret Manager for Stripe Keys

### Current State

The `cloudbuild.yaml` already references Stripe secrets:

```yaml
# Line 39 of cloudbuild.yaml (ALREADY PRESENT)
- '--set-secrets=GITHUB_TOKEN=github-token:latest,TODOIST_API_TOKEN=todoist-api-token:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest'
```

This means the Cloud Run deploy step already mounts the secrets. The secrets just need to exist in Secret Manager.

### Required Actions

**Step 1: Create secrets in GCP Secret Manager**

```bash
# Create Stripe secret key
echo -n "sk_live_..." | gcloud secrets create stripe-secret-key \
  --data-file=- \
  --project=personal-brand-486314

# Create Stripe webhook signing secret (created AFTER registering webhook endpoint)
echo -n "whsec_..." | gcloud secrets create stripe-webhook-secret \
  --data-file=- \
  --project=personal-brand-486314
```

**Step 2: Grant service account access**

The Cloud Run service account needs `secretAccessor` role on the new secrets. The existing secrets (github-token, todoist-api-token) already have this, so the pattern is established.

```bash
SA="cloudrun-site@personal-brand-486314.iam.gserviceaccount.com"

gcloud secrets add-iam-policy-binding stripe-secret-key \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=personal-brand-486314

gcloud secrets add-iam-policy-binding stripe-webhook-secret \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=personal-brand-486314
```

**Step 3: Also grant Cloud Build service account access**

Cloud Build uses `--set-secrets` at deploy time, which requires the Cloud Build service account (or the compute default SA) to have permission to reference the secrets. This is already working for github-token and todoist-api-token, so the same pattern applies -- but the new secrets need explicit binding.

### Code Impact: None

The billing code already reads `process.env.STRIPE_SECRET_KEY` and `process.env.STRIPE_WEBHOOK_SECRET` as plain environment variables. Cloud Run's `--set-secrets` flag mounts Secret Manager values as environment variables transparently. No code changes needed.

### Confidence: HIGH

Direct observation of `cloudbuild.yaml` line 39 shows Stripe secrets are already wired. The only missing piece is creating the actual secret values in Secret Manager and granting IAM access.

---

## Integration Point 2: Firebase Auth Production Configuration

### Current State

Firebase Auth client SDK configuration is already baked into the Docker image at build time via `cloudbuild.yaml`:

```yaml
# Build args (lines 6-8)
- '--build-arg=NEXT_PUBLIC_FIREBASE_API_KEY=${_NEXT_PUBLIC_FIREBASE_API_KEY}'
- '--build-arg=NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}'
- '--build-arg=NEXT_PUBLIC_FIREBASE_PROJECT_ID=${_NEXT_PUBLIC_FIREBASE_PROJECT_ID}'

# Runtime env vars (line 38)
- '--set-env-vars=...NEXT_PUBLIC_FIREBASE_API_KEY=${_NEXT_PUBLIC_FIREBASE_API_KEY},NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},NEXT_PUBLIC_FIREBASE_PROJECT_ID=${_NEXT_PUBLIC_FIREBASE_PROJECT_ID}...'
```

These are passed as Cloud Build substitution variables (`_NEXT_PUBLIC_FIREBASE_*`), which are configured in the Cloud Build trigger settings in GCP Console.

### Required Actions

**Step 1: Verify Cloud Build trigger substitution variables**

In the GCP Console Cloud Build trigger, ensure these substitution variables are set:

| Variable | Value |
|----------|-------|
| `_NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase Console > Project Settings > General > Your Apps |
| `_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `personal-brand-486314.firebaseapp.com` |
| `_NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `personal-brand-486314` |

These may already be configured if the site is already deployed with Firebase Admin SDK working.

**Step 2: Add custom domain to Firebase Auth authorized domains**

This is the most commonly missed step. Firebase Auth's `signInWithPopup` will fail if the domain is not authorized.

In Firebase Console > Authentication > Settings > Authorized domains, add:
- `dan-weinbeck.com` (custom domain)
- `www.dan-weinbeck.com` (if applicable)
- `personal-brand-XXXXXXXXXX.run.app` (Cloud Run default URL, for testing)

The following are authorized by default:
- `localhost` (already there)
- `personal-brand-486314.firebaseapp.com` (already there)
- `personal-brand-486314.web.app` (already there)

**Step 3: Verify authDomain setting**

The `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` should be `personal-brand-486314.firebaseapp.com` (the Firebase-provided domain), NOT the custom domain. Firebase uses this domain for the OAuth popup redirect. Using the custom domain as authDomain requires additional configuration (custom domain in Firebase Hosting) and is not necessary.

### Server-Side Auth: Already Working

The Firebase Admin SDK on Cloud Run uses Application Default Credentials (ADC). This is already working for the existing deployment (contact form, chatbot). The `verifyUser()` and `verifyAdmin()` functions use `getAuth().verifyIdToken()`, which validates tokens against Firebase's public keys -- no additional configuration needed.

### Code Impact: None

All auth code is implemented. The only changes are configuration in Firebase Console and GCP Console.

### Confidence: HIGH

Direct observation of `firebase-client.ts`, `AuthContext.tsx`, `AuthButton.tsx`, and `AuthGuard.tsx` shows a complete Firebase Auth client implementation. The `cloudbuild.yaml` already passes the required environment variables.

**Medium confidence caveat:** Whether the Cloud Build trigger substitutions are currently populated with real values or empty strings cannot be verified from the codebase alone. If they are empty, sign-in will throw "Firebase config missing required environment variables" at runtime.

---

## Integration Point 3: Stripe Webhook URL Configuration

### Current State

The webhook handler at `/api/billing/webhook` is fully implemented:
- Reads raw body via `request.text()` (required for Stripe signature verification)
- Verifies signature with `constructWebhookEvent(body, signature)`
- Handles `checkout.session.completed` event
- Applies purchase via `applyPurchaseFromStripe()` with dual idempotency (event ID + session ID)
- Marked `force-dynamic` to prevent Next.js from statically optimizing the route

### Required Actions

**Step 1: Register webhook endpoint in Stripe Dashboard**

Stripe Dashboard > Developers > Webhooks > Add endpoint:

| Setting | Value |
|---------|-------|
| Endpoint URL | `https://dan-weinbeck.com/api/billing/webhook` |
| Events | `checkout.session.completed` |
| API version | Use Stripe account default |

**Step 2: Copy webhook signing secret**

After creating the endpoint, Stripe provides a signing secret (`whsec_...`). This must be stored in GCP Secret Manager as `stripe-webhook-secret` (Step 1 of Integration Point 1).

**Step 3: Switch from test to live keys**

For production:
- Use `sk_live_*` (not `sk_test_*`) for `stripe-secret-key` in Secret Manager
- Use the production webhook endpoint's signing secret for `stripe-webhook-secret`
- Ensure the Stripe account is activated for live payments

### Webhook Security Model

The webhook endpoint does NOT use Firebase Auth. Instead, it relies on Stripe signature verification:

```
Stripe -> POST /api/billing/webhook
  |-- stripe-signature header contains HMAC signature
  |-- constructWebhookEvent() verifies body against STRIPE_WEBHOOK_SECRET
  |-- If verification fails: 400 response, request rejected
  |-- If verification passes: event is authentic, process it
```

This is the correct pattern. No `verifyUser()` or `verifyAdmin()` needed because:
1. Stripe is the caller, not a browser user
2. The signature proves the request came from Stripe
3. Adding auth would prevent Stripe from reaching the endpoint

### Idempotency Model

The webhook handler has two layers of idempotency:

1. **Stripe event ID:** `billing_stripe_events/{eventId}` -- prevents replayed events
2. **Stripe session ID:** `billing_purchases/{sessionId}` -- prevents duplicate purchases

Both checks happen inside a Firestore transaction. This means even if Stripe retries the webhook (which it does on 5xx responses), credits are only granted once.

### Code Impact: None

The webhook handler is complete. Only Stripe Dashboard configuration and Secret Manager setup are needed.

### Confidence: HIGH

Direct code review of `/api/billing/webhook/route.ts` and `billing/stripe.ts` confirms correct implementation. The `stripe` npm package (v20.3.1) handles signature verification.

---

## Integration Point 4: Brand Scraper URL Configuration

### Current State

The brand scraper client reads `BRAND_SCRAPER_API_URL` from the environment:

```typescript
// src/lib/brand-scraper/client.ts line 8
const BRAND_SCRAPER_API_URL = process.env.BRAND_SCRAPER_API_URL;
```

The `cloudbuild.yaml` passes this as an environment variable:

```yaml
# Line 38 (already present)
- '--set-env-vars=...BRAND_SCRAPER_API_URL=${_BRAND_SCRAPER_API_URL}'
```

### Required Actions

**Step 1: Deploy brand scraper service to Cloud Run**

The brand scraper is a separate service. Once deployed, it will have a Cloud Run URL like:
`https://brand-scraper-XXXXXXXXXX.run.app`

**Step 2: Set substitution variable in Cloud Build trigger**

Set `_BRAND_SCRAPER_API_URL` to the brand scraper's Cloud Run URL.

**Step 3: Service-to-service authentication (if required)**

If the brand scraper service requires authentication (not `--allow-unauthenticated`), the personal-brand service account needs `roles/run.invoker` on the brand scraper service. The client code currently does NOT send an auth header to the brand scraper -- it uses a plain `fetch()`:

```typescript
// client.ts lines 54-58
res = await fetch(`${BRAND_SCRAPER_API_URL}/scrape`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ site_url: url }),
  signal: AbortSignal.timeout(30_000),
});
```

If the brand scraper requires Cloud Run IAM auth, the client needs to add an `Authorization: Bearer <id-token>` header using the metadata server. This would be a code change. However, if the brand scraper uses `--allow-unauthenticated`, no changes are needed.

**Recommendation:** Start with `--allow-unauthenticated` on the brand scraper for simplicity, since it is only called from the personal-brand API routes (not exposed to users directly). The brand scraper URL is a server-side secret. Add IAM auth as a hardening step later if desired.

### Code Impact: Likely none

If brand scraper uses `--allow-unauthenticated`: no code changes.
If brand scraper requires IAM auth: minor code change to add ID token header in `client.ts`.

### Confidence: HIGH for URL wiring, MEDIUM for auth requirements

The brand scraper service's auth configuration is an external decision. The code is ready for the unauthenticated case.

---

## Integration Point 5: GCS Signed URL Handling

### Current State

The brand scraper service returns GCS signed URLs in the job status response:

```typescript
// src/lib/brand-scraper/types.ts lines 97-98
brand_json_url: z.string().optional(),
assets_zip_url: z.string().optional(),
```

These are passed through the API proxy to the frontend and rendered by `DownloadLinks.tsx` as direct anchor links:

```tsx
// src/components/admin/brand-scraper/DownloadLinks.tsx
<Button href={brandJsonUrl} variant="secondary" size="sm" download="brand.json">
  Download Brand Data (JSON)
</Button>
```

The user-facing `UserBrandScraperPage.tsx` also passes these to `BrandResultsGallery`:

```tsx
// src/components/tools/brand-scraper/UserBrandScraperPage.tsx line 203-206
<BrandResultsGallery
  result={data.result}
  brandJsonUrl={data.brand_json_url}
  assetsZipUrl={data.assets_zip_url}
/>
```

### GCS Signed URL Characteristics

GCS signed URLs have a configurable expiry (the brand scraper uses 1-hour expiry per the milestone context). Key behaviors:

- **Before expiry:** URL works as a direct download link. No auth, no CORS issues. The browser downloads the file directly from GCS.
- **After expiry:** URL returns HTTP 403 with an XML error body. The download silently fails or shows an error.
- **No refresh mechanism:** The signed URL is generated once when the job completes. To get a fresh URL, the user must re-poll the job status endpoint.

### UX Implications and Handling Pattern

**Problem:** If a user completes a scrape, leaves the tab open for > 1 hour, then clicks "Download," the link is dead.

**Current code has no expiry handling.** The download buttons render the URL as-is. If expired, the user sees a browser error.

**Recommended UX pattern (no code changes required for MVP):**

1. The `UserBrandScraperPage` can simply re-poll the job status when the user clicks download. The brand scraper service generates fresh signed URLs on each GET /jobs/:id response (confirmed by milestone context: "GCS signed URLs added to job response").
2. The 1-hour window is generous for the expected use case (scrape completes, user downloads immediately).
3. For MVP, the current implementation is acceptable. If a user hits an expired link, they can click "Scrape Another URL" to re-scrape, or the page can be refreshed.

**Future enhancement (post-MVP, if needed):**

```
DownloadLinks component:
  |-- Track URL generation timestamp (when job poll returned the URL)
  |-- On click, check if > 50 minutes have passed
  |-- If stale: re-fetch job status to get fresh URLs, then trigger download
  |-- If fresh: use existing URL directly
```

This would require adding a `lastPolledAt` timestamp to the job status state and a click handler that conditionally re-fetches. It is a minor enhancement, not a structural change.

### Code Impact: None for MVP

The current implementation works correctly for the common case. The `DownloadLinks` component renders buttons only when URLs are present (null check on line 14). GCS signed URLs work as plain HTTPS links -- no CORS, no auth headers needed from the browser.

### Confidence: HIGH

Direct code observation of the types, client, and UI components confirms the flow. GCS signed URL behavior is well-established GCP infrastructure.

---

## Integration Point 6: Firestore Indexes and Data Seeding

### Current State

The billing system uses several Firestore queries that may require composite indexes:

```typescript
// firestore.ts -- queries that might need indexes:

// 1. toolPricingCol().where("active", "==", true) -- single field, auto-indexed
// 2. toolUsageCol().where("uid", "==", uid).orderBy("createdAt", "desc") -- composite
// 3. purchasesCol().where("uid", "==", uid).orderBy("createdAt", "desc") -- composite
// 4. toolUsageCol().where("uid", "==", uid).where("externalJobId", "==", externalJobId) -- composite
```

### Required Actions

**Step 1: Deploy and trigger index creation**

Firestore automatically suggests composite indexes when a query fails. The first request to each query will fail with an error containing a direct link to create the index. This is the standard Firestore workflow.

Alternatively, create indexes proactively via `firestore.indexes.json` or gcloud CLI:

```bash
# Index for billing_tool_usage (uid + createdAt)
gcloud firestore indexes composite create \
  --collection-group=billing_tool_usage \
  --field-config=field-path=uid,order=ASCENDING \
  --field-config=field-path=createdAt,order=DESCENDING \
  --project=personal-brand-486314

# Index for billing_purchases (uid + createdAt)
gcloud firestore indexes composite create \
  --collection-group=billing_purchases \
  --field-config=field-path=uid,order=ASCENDING \
  --field-config=field-path=createdAt,order=DESCENDING \
  --project=personal-brand-486314

# Index for billing_tool_usage (uid + externalJobId)
gcloud firestore indexes composite create \
  --collection-group=billing_tool_usage \
  --field-config=field-path=uid,order=ASCENDING \
  --field-config=field-path=externalJobId,order=ASCENDING \
  --project=personal-brand-486314
```

**Step 2: Seed tool pricing data**

The `tools.ts` file contains a `seedToolPricing()` function that creates initial pricing documents if they do not exist. This needs to be called once in production.

Options:
1. **Manual seed via admin API:** Add a one-time call in the admin pricing route, or create a simple script
2. **Seed on first request:** Call `seedToolPricing()` from the `/api/billing/me` route handler (lazy initialization)
3. **Cloud Run startup:** Not recommended -- the standalone server does not have a startup hook

**Recommendation:** Seed via the admin panel. The admin pricing page (`/api/admin/billing/pricing`) already has GET and POST handlers. After deployment, navigate to the admin billing panel and use it to create pricing entries manually, or add a "seed defaults" button. Alternatively, use a one-off `curl` command:

```bash
# Seed brand_scraper pricing via admin API
TOKEN="..." # Firebase ID token for admin user
curl -X POST https://dan-weinbeck.com/api/admin/billing/pricing \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"toolKey":"brand_scraper","creditsPerUse":50,"costToUsCentsEstimate":30,"active":true}'
```

### Code Impact: None

Seeding and index creation are operational tasks, not code changes.

### Confidence: HIGH

Direct observation of Firestore queries confirms index requirements. Seeding function exists in `tools.ts`.

---

## Integration Point 7: Checkout URL Configuration

### Current State

The checkout route constructs success/cancel URLs from the request origin:

```typescript
// src/app/api/billing/checkout/route.ts lines 27-31
const origin = new URL(request.url).origin;
const url = await createCheckoutSession({
  ...
  successUrl: `${origin}/billing/success`,
  cancelUrl: `${origin}/billing/cancel`,
});
```

### Behavior on Cloud Run

When running on Cloud Run behind a custom domain:
- `request.url` origin will be `https://dan-weinbeck.com` (if the request comes through the custom domain)
- Stripe will redirect back to `https://dan-weinbeck.com/billing/success`

This is correct behavior. The `successUrl` and `cancelUrl` are dynamically derived from the incoming request, so they automatically match whatever domain the user is on.

### Potential Issue: Cloud Run Default URL

If someone accesses the site via the Cloud Run default URL (`https://personal-brand-XXXXXXXXXX.run.app`), the checkout redirect will go back to that URL instead of the custom domain. This is generally fine but could be confusing.

**Recommendation:** No change needed. The custom domain is the public URL. The Cloud Run default URL is for internal testing only.

### Code Impact: None

### Confidence: HIGH

---

## Component Boundary Map

### New vs Modified Components

| Component | Status | What Changes |
|-----------|--------|-------------|
| `cloudbuild.yaml` | **Verify** | Already has Stripe secrets; verify substitution vars are populated |
| `scripts/deploy.sh` | **Verify** | Already has BRAND_SCRAPER_API_URL; verify it passes through |
| `.env.local.example` | **Already updated** | Already documents all required env vars |
| `src/lib/billing/*` | **No changes** | All billing code is complete |
| `src/lib/auth/*` | **No changes** | All auth code is complete |
| `src/app/api/billing/*` | **No changes** | All API routes are complete |
| `src/app/api/tools/*` | **No changes** | All tool routes are complete |
| `src/app/api/admin/billing/*` | **No changes** | All admin routes are complete |
| `src/components/billing/*` | **No changes** | BillingPage is complete |
| `src/components/tools/*` | **No changes** | UserBrandScraperPage is complete |
| `src/lib/brand-scraper/*` | **No changes** | Client, hooks, types are complete |
| Firebase Console | **Configure** | Add authorized domains |
| Stripe Dashboard | **Configure** | Create webhook endpoint, get signing secret |
| GCP Secret Manager | **Configure** | Create stripe-secret-key, stripe-webhook-secret |
| GCP IAM | **Configure** | Grant secretAccessor to service account |
| Firestore | **Configure** | Create composite indexes, seed pricing data |
| Cloud Build Trigger | **Configure** | Verify all substitution variables are populated |

### No Code Files Need Modification

This is a pure deployment/configuration milestone. Every source file is already written and wired.

---

## Deployment Validation Flow

### Recommended Build Order

The validation and deployment should follow this sequence, with each step verifiable before proceeding:

```
Step 1: Local Validation (npm test && npm run lint && npm run build)
  |-- Verifies all billing code compiles and passes tests
  |-- No external dependencies needed
  |
Step 2: Stripe Setup (Stripe Dashboard)
  |-- Create webhook endpoint -> get whsec_...
  |-- Note: use test mode first for validation
  |
Step 3: GCP Secret Manager Setup
  |-- Create stripe-secret-key (use test key initially)
  |-- Create stripe-webhook-secret
  |-- Grant IAM access to cloudrun-site SA
  |
Step 4: Firebase Console Configuration
  |-- Add dan-weinbeck.com to authorized domains
  |-- Verify NEXT_PUBLIC_* values in Cloud Build trigger
  |
Step 5: Deploy to Cloud Run
  |-- scripts/deploy.sh personal-brand-486314
  |-- Or trigger Cloud Build via git push
  |
Step 6: Smoke Test (Test Mode)
  |-- Visit /billing -> verify sign-in works
  |-- Sign in -> verify balance displays (100 credits from signup grant)
  |-- Click "Buy Credits" -> verify Stripe Checkout redirect
  |-- Complete test purchase -> verify webhook fires and credits are granted
  |-- Visit /apps/brand-scraper -> verify scrape works and debits credits
  |-- Visit /control-center/billing -> verify admin panel works
  |
Step 7: Switch to Live Mode
  |-- Update stripe-secret-key in Secret Manager to sk_live_*
  |-- Create production webhook endpoint in Stripe (same URL)
  |-- Update stripe-webhook-secret in Secret Manager to production whsec_*
  |-- Redeploy (or restart Cloud Run service to pick up new secrets)
  |
Step 8: Production Smoke Test
  |-- Same as Step 6 but with real payment
  |-- Verify Firestore has correct billing_users, ledger, purchases documents
```

### Why This Order

1. **Local validation first:** Catches compilation errors and test failures before any infrastructure work.
2. **Stripe before secrets:** You need the webhook signing secret from Stripe before you can store it in Secret Manager.
3. **Firebase before deploy:** If authorized domains are not configured, sign-in will fail immediately after deploy, making all billing features untestable.
4. **Test mode before live:** Stripe test mode allows end-to-end validation without real money. Test webhook events behave identically to live events.
5. **Live mode last:** Only switch after the full flow is verified in test mode.

---

## Stripe Test Mode vs Live Mode Architecture

### How Stripe Modes Work

Stripe provides separate API keys and webhook secrets for test vs live mode:

| Resource | Test Mode | Live Mode |
|----------|-----------|-----------|
| Secret key | `sk_test_*` | `sk_live_*` |
| Webhook secret | `whsec_*` (test endpoint) | `whsec_*` (live endpoint) |
| Test cards | `4242 4242 4242 4242` | Real cards only |
| Dashboard | Stripe Dashboard > Test Mode toggle | Stripe Dashboard > Live Mode |

### Recommended Approach

Use Stripe test mode for the initial deployment and all validation. The code handles both modes identically -- the only difference is the API key.

**Do NOT create separate "staging" and "production" deployments.** The personal-brand site is a single Cloud Run service. Switch between test and live by updating the Secret Manager values and redeploying (or restarting the service).

To switch modes:
```bash
# Update secret to live key
echo -n "sk_live_..." | gcloud secrets versions add stripe-secret-key \
  --data-file=- --project=personal-brand-486314

# Update webhook secret to live endpoint's secret
echo -n "whsec_..." | gcloud secrets versions add stripe-webhook-secret \
  --data-file=- --project=personal-brand-486314

# Restart Cloud Run to pick up new secret versions
gcloud run services update personal-brand \
  --region=us-central1 \
  --project=personal-brand-486314 \
  --update-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest
```

### Code Impact: None

Both modes use the same code paths. The only difference is the secret values.

---

## Service Account IAM Requirements

### Current Roles

The `cloudrun-site` service account currently has:

| Role | Purpose | Granted By |
|------|---------|-----------|
| `roles/datastore.user` | Firestore read/write | `scripts/deploy.sh` line 59 |

### Additional Roles Needed

| Role | Purpose | How to Grant |
|------|---------|-------------|
| `roles/secretmanager.secretAccessor` | Access Stripe secrets | Per-secret IAM binding (see Integration Point 1) |

**Note:** The `secretAccessor` role should be granted per-secret (not project-wide) for least privilege. The service account only needs access to `stripe-secret-key` and `stripe-webhook-secret`, not all secrets.

However, since `github-token` and `todoist-api-token` are already mounted via `--set-secrets`, the SA likely already has broad secret access. Verify with:

```bash
gcloud secrets get-iam-policy stripe-secret-key --project=personal-brand-486314
```

### Code Impact: None

---

## Risks and Mitigations

### Risk 1: Firebase Auth Popup Blocked by Custom Domain

**Risk:** `signInWithPopup` may fail on the custom domain if it is not in Firebase Auth's authorized domains list.

**Symptoms:** `auth/unauthorized-domain` error in browser console when clicking "Sign in with Google."

**Mitigation:** Add `dan-weinbeck.com` to Firebase Console > Authentication > Settings > Authorized domains. This is a one-time manual step.

**Verification:** After deployment, test sign-in on the custom domain before testing billing.

### Risk 2: Stripe Webhook Timeout on Cold Start

**Risk:** Cloud Run may cold-start when Stripe sends a webhook. If the cold start + request processing exceeds 10 seconds, Stripe considers the webhook failed and retries.

**Symptoms:** Duplicate webhook deliveries (handled by idempotency), delayed credit granting, Stripe Dashboard showing webhook failures.

**Mitigation:** The idempotency in `applyPurchaseFromStripe()` handles retries safely. Cloud Run cold starts for this service should be under 5 seconds (512Mi memory, Node.js standalone). Stripe retries with exponential backoff, so credits will be granted eventually.

**If problematic:** Set Cloud Run `min-instances=1` to avoid cold starts entirely. Currently set to `min-instances=0` for cost savings.

### Risk 3: Missing Firestore Composite Indexes

**Risk:** Queries in `getUserUsage()`, `getUserPurchases()`, and `findUsageByExternalJobId()` will fail with index errors on first invocation.

**Symptoms:** 500 errors from admin billing detail page and job status polling.

**Mitigation:** Either create indexes proactively (see Integration Point 6) or deploy and follow the error links in Cloud Run logs to create indexes on-demand. Indexes take 1-5 minutes to build.

### Risk 4: Brand Scraper Service Not Yet Deployed

**Risk:** If the brand scraper service is not deployed when the billing system goes live, scrape attempts will fail with 503 errors.

**Symptoms:** "BRAND_SCRAPER_API_URL not configured" or "Network error" when submitting a scrape.

**Mitigation:** The billing code handles this gracefully -- the `refundUsage()` call on submission failure (line 74 of `scrape/route.ts`) automatically refunds credits if the external service is unreachable. Users see an error message but are not charged.

---

## Sources

- Direct codebase analysis of all files listed above (HIGH confidence)
- `cloudbuild.yaml` lines 39, 38: Stripe secrets and env vars already wired (HIGH confidence, direct observation)
- `scripts/deploy.sh` lines 56-61: Service account and IAM setup (HIGH confidence, direct observation)
- Firebase Auth authorized domains: standard Firebase configuration requirement (HIGH confidence, well-known)
- Stripe webhook signature verification: `stripe` npm package v20.3.1 (HIGH confidence, direct observation of `stripe.ts`)
- GCS signed URL expiry behavior: standard GCP behavior, 1-hour expiry per milestone context (HIGH confidence)
- Firestore composite index requirements: inferred from query patterns in `firestore.ts` (HIGH confidence, standard Firestore behavior)
- Cloud Run cold start behavior: standard GCP Cloud Run behavior (HIGH confidence)
- GCP Secret Manager `--set-secrets` flag: already used in `cloudbuild.yaml` for existing secrets (HIGH confidence, direct observation)
