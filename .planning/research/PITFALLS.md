# Domain Pitfalls: Billing System Validation & Production Deployment

**Domain:** Deploying Stripe + Firebase Auth + Firestore billing system to production on GCP Cloud Run
**Researched:** 2026-02-09
**Overall confidence:** HIGH (based on codebase analysis of ~3K LOC billing code + deployment config + training data knowledge)

**Note on sources:** WebSearch was unavailable during this research session. All findings are based on direct codebase analysis of the existing billing code and deployment configuration, combined with training data knowledge of Stripe, Firebase, GCP Cloud Run, and GCS. Stripe API behavior, GCP Secret Manager IAM, and Firebase Auth domain configuration are well-established patterns unlikely to have changed since training cutoff. Confidence levels are assigned accordingly.

---

## Critical Pitfalls

Mistakes that cause payment failures, lost revenue, security vulnerabilities, or require emergency fixes in production.

### Pitfall 1: Stripe Test Keys Deployed to Production (or Live Keys Used in Dev)

**What goes wrong:** The Stripe `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in GCP Secret Manager are still test-mode keys (`sk_test_...`, `whsec_test_...`). The deployment succeeds, the billing UI works, Stripe Checkout opens -- but all payments go to Stripe's test environment. Real credit card charges do not occur. Users see a "payment succeeded" message and receive credits, but no money is collected. Conversely, if live keys are accidentally used in development, real charges are processed during testing.

**Why it happens:** Stripe uses separate API keys for test mode (`sk_test_`) and live mode (`sk_live_`). Developers set up test keys during development and forget to swap them for production. The code works identically with both key types -- there is no runtime error to flag the mismatch. The existing code in `src/lib/billing/stripe.ts` reads `process.env.STRIPE_SECRET_KEY` without checking the key prefix.

**Specific risk in this codebase:**
- `cloudbuild.yaml` line 39 mounts `stripe-secret-key:latest` from Secret Manager. Whatever value was stored there is what gets used.
- `.env.local.example` line 44 shows `sk_test_your_stripe_secret_key` -- if the user copies this pattern to Secret Manager, test keys go to production.
- The webhook secret (`STRIPE_WEBHOOK_SECRET`) must also match: test webhook endpoints use test signing secrets, live endpoints use live signing secrets. Mixing them causes signature verification to fail silently.

**Consequences:**
- Payments appear to work but no real money is collected (test mode in production)
- Real charges on test cards (live mode in development)
- Webhook signature verification fails if keys are mismatched between modes
- Credits are granted without actual payment (financial loss)

**Prevention:**
1. **Create a pre-deploy checklist item:** Verify Secret Manager values start with `sk_live_` (not `sk_test_`) before deploying billing to production.
2. **Add a startup log warning** in the Stripe singleton that detects test keys in production:
   ```typescript
   if (process.env.K_SERVICE && key.startsWith('sk_test_')) {
     console.error('WARNING: Stripe test key detected in production environment');
   }
   ```
3. **Separate Stripe webhook endpoints:** Create a test webhook endpoint (pointed to local/staging) and a live webhook endpoint (pointed to production domain) in the Stripe Dashboard. Each has its own signing secret.
4. **Verify the full flow end-to-end:** After deploying, make a real $5 purchase with a real credit card. Check the Stripe Dashboard (not test mode) to confirm the charge appeared.

**Detection:** Check the Stripe Dashboard. If charges appear only in "Test mode," production is using test keys. Alternatively, inspect the Secret Manager value -- if it starts with `sk_test_`, it is wrong.

**Phase:** Must be verified during the production deployment phase. Add to deployment checklist.

**Confidence:** HIGH -- Stripe's test/live key architecture is well-documented and has not changed.

---

### Pitfall 2: Stripe Webhook Endpoint Not Registered for Production Domain

**What goes wrong:** The Stripe webhook is registered for a test URL (e.g., `https://your-domain.com/api/billing/webhook` or a Stripe CLI local forwarding address) but not for the actual production domain (`https://dan-weinbeck.com/api/billing/webhook`). Stripe sends `checkout.session.completed` events to the wrong URL. The webhook never fires. The user completes payment on Stripe's hosted checkout, gets redirected to `/billing/success`, but their credits are never granted because the webhook event was never delivered.

**Why it happens:** During development, webhooks are typically tested with `stripe listen --forward-to localhost:3000/api/billing/webhook` (Stripe CLI). This creates a temporary webhook endpoint. When deploying to production, a new webhook endpoint must be created in the Stripe Dashboard pointing to the production URL. This step is easy to forget because the checkout flow works without webhooks -- the user is redirected to the success URL regardless.

**Specific risk in this codebase:**
- The checkout route (`src/app/api/billing/checkout/route.ts`, line 31-32) derives `success_url` and `cancel_url` from `new URL(request.url).origin`. On Cloud Run, `request.url` may use the `.run.app` URL or the custom domain, depending on how the request arrives.
- The webhook route (`src/app/api/billing/webhook/route.ts`) is the ONLY mechanism for granting credits. There is no polling fallback. If the webhook does not fire, credits are never granted.
- `docs/DEPLOYMENT.md` lines 172-177 document the webhook setup steps, but these steps must actually be executed.

**Consequences:**
- Users pay real money but never receive credits
- No error is visible to the user -- they see the success page
- The admin has no way to know the webhook failed unless they check Stripe Dashboard event logs
- Manual credit grants via admin panel are required to fix each missed payment

**Prevention:**
1. **Register the production webhook endpoint in Stripe Dashboard** before deploying:
   - URL: `https://dan-weinbeck.com/api/billing/webhook`
   - Events: `checkout.session.completed`
   - Copy the signing secret to `stripe-webhook-secret` in GCP Secret Manager
2. **Test the webhook after deployment:** Make a test purchase and verify the webhook fires by checking Cloud Run logs for the webhook handler's log output.
3. **Add a monitoring/alerting mechanism:** Log every webhook receipt and every credit grant. If a `checkout.session.completed` event is received but `applyPurchaseFromStripe` fails, log an error that can be caught in Cloud Run logs.
4. **Consider adding a success page that polls for credit delivery:** The `/billing/success` page could poll `/api/billing/me` for a few seconds after redirect to confirm credits were granted, showing a warning if they were not.

**Detection:** Complete a purchase in production. If the success page shows but credits do not increase within 30 seconds, the webhook is not firing. Check Stripe Dashboard > Webhooks > Recent events for delivery failures.

**Phase:** Must be done during production deployment. This is a deployment task, not a code task.

**Confidence:** HIGH -- standard Stripe webhook setup requirement.

---

### Pitfall 3: GCP Secret Manager IAM Missing for Cloud Run Service Account

**What goes wrong:** The Cloud Run service (`personal-brand`) uses `--set-secrets` in `cloudbuild.yaml` to mount `stripe-secret-key` and `stripe-webhook-secret` from Secret Manager. This requires the Cloud Run service account (`cloudrun-site@PROJECT_ID.iam.gserviceaccount.com`) to have `roles/secretmanager.secretAccessor` on those secrets. If this IAM binding is missing, the Cloud Run deployment fails or the service starts but secrets are empty/undefined.

**Why it happens -- ACTUAL BUG IN THIS CODEBASE:**
- `scripts/setup-cicd.sh` (lines 52-63) grants `secretmanager.secretAccessor` to the **Cloud Build** service account (`PROJECT_NUMBER@cloudbuild.gserviceaccount.com`) for `github-token` and `todoist-api-token`.
- `scripts/setup-cicd.sh` does NOT grant any Secret Manager access to the **Cloud Run** service account (`cloudrun-site@PROJECT_ID.iam.gserviceaccount.com`).
- `scripts/setup-cicd.sh` does NOT create the Stripe secrets (`stripe-secret-key`, `stripe-webhook-secret`) at all -- it only creates `github-token` and `todoist-api-token`.
- `cloudbuild.yaml` line 39 references `STRIPE_SECRET_KEY=stripe-secret-key:latest` and `STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest` in the `--set-secrets` flag. Cloud Run's `--set-secrets` requires the **Cloud Run service account** (not Cloud Build's) to have access to these secrets at runtime.
- `docs/DEPLOYMENT.md` lines 153-168 document the manual steps to create Stripe secrets and grant Cloud Build access, but they grant access to the Cloud Build SA -- this is correct for the build step but the Cloud Run SA also needs access for runtime.

**The subtle distinction:** `--set-secrets` in Cloud Run works by having Cloud Run resolve the secret value at deploy time (or startup time, depending on mounting mode). The service account that runs the Cloud Run service must have `secretmanager.secretAccessor` on each secret. Cloud Build needs it too (to configure the service), but the runtime SA is the one that actually reads the secret values.

**Consequences:**
- Cloud Run deployment fails with a permissions error during `gcloud run deploy`
- Or: service deploys but environment variables `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are empty
- Stripe client initialization throws `STRIPE_SECRET_KEY environment variable is not set` (line 10 of `stripe.ts`)
- Webhook signature verification fails because `STRIPE_WEBHOOK_SECRET` is empty
- Billing is completely non-functional

**Prevention:**
1. **Create the Stripe secrets in Secret Manager:**
   ```bash
   echo -n "sk_live_..." | gcloud secrets create stripe-secret-key --data-file=-
   echo -n "whsec_..." | gcloud secrets create stripe-webhook-secret --data-file=-
   ```
2. **Grant both Cloud Build AND Cloud Run SAs access:**
   ```bash
   # Cloud Run SA (for runtime secret access)
   for SECRET in stripe-secret-key stripe-webhook-secret; do
     gcloud secrets add-iam-policy-binding "${SECRET}" \
       --member="serviceAccount:cloudrun-site@PROJECT_ID.iam.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor" \
       --quiet
   done

   # Cloud Build SA (for deploy-time secret resolution)
   for SECRET in stripe-secret-key stripe-webhook-secret; do
     gcloud secrets add-iam-policy-binding "${SECRET}" \
       --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor" \
       --quiet
   done
   ```
3. **Update `scripts/setup-cicd.sh`** to include Stripe secrets in its setup flow (currently only handles `github-token` and `todoist-api-token`).

**Detection:** Deploy with `--set-secrets` and check Cloud Run logs. If the service crashes on startup with "STRIPE_SECRET_KEY environment variable is not set," the IAM binding is missing. You can also verify with:
```bash
gcloud secrets get-iam-policy stripe-secret-key
```
Check that the Cloud Run SA appears in the bindings.

**Phase:** Must be done before the first billing-enabled deployment. This is an infrastructure setup task.

**Confidence:** HIGH -- verified by direct reading of `cloudbuild.yaml`, `setup-cicd.sh`, and `deploy.sh`. The IAM gap between Cloud Build SA and Cloud Run SA is confirmed by codebase analysis.

---

### Pitfall 4: Firebase Auth Domain Not Configured for Custom Domain

**What goes wrong:** Firebase Auth (Google Sign-In) is configured with `authDomain: "your-project.firebaseapp.com"` via `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`. When users sign in on `dan-weinbeck.com`, the Google OAuth flow redirects to `your-project.firebaseapp.com` for the sign-in popup/redirect, then back to the app. If `dan-weinbeck.com` is not listed in Firebase Console's authorized domains, the redirect back fails with "auth/unauthorized-domain" error.

**Why it happens:** Firebase Auth maintains a list of authorized domains that can host the sign-in flow. By default, only `localhost` and `your-project.firebaseapp.com` and `your-project.web.app` are authorized. Custom domains must be explicitly added.

**Specific risk in this codebase:**
- `src/lib/firebase-client.ts` reads `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` from environment
- The Cloud Run service has a custom domain `dan-weinbeck.com` mapped to it
- The Cloud Run `.run.app` URL is also accessible (e.g., `personal-brand-HASH.us-central1.run.app`)
- Both domains need to be authorized in Firebase Console if users might access either

**Consequences:**
- Google Sign-In fails with "auth/unauthorized-domain" error
- Users cannot sign in, cannot purchase credits, cannot use any paid tools
- The error message may be cryptic depending on how the AuthButton handles it
- Works on localhost but fails in production (classic "works on my machine")

**Prevention:**
1. **Add the custom domain to Firebase Console:** Go to Firebase Console > Authentication > Settings > Authorized domains > Add domain: `dan-weinbeck.com`
2. **Also add the Cloud Run `.run.app` domain** if users might access the service via that URL
3. **Test sign-in on the production domain** after deployment, not just on localhost
4. **Add to deployment checklist:** "Verify Firebase Auth authorized domains include production URL"

**Detection:** Attempt Google Sign-In on the production site. If it fails with an unauthorized domain error, this domain is not in the authorized list.

**Phase:** Must be done before deploying auth-gated features. One-time Firebase Console configuration.

**Confidence:** HIGH -- standard Firebase Auth requirement, documented in Firebase Auth setup guides.

---

### Pitfall 5: Webhook Body Parsing Destroys Signature Verification

**What goes wrong:** Stripe webhook signature verification requires the RAW request body (as a string or buffer). If a middleware, framework layer, or body parser parses the body as JSON before the webhook handler reads it, the raw bytes are consumed or modified. When `constructWebhookEvent()` tries to verify the signature against the parsed-then-re-stringified body, the bytes do not match and verification fails with "Webhook signature verification failed."

**Why it happens:** Next.js API routes (App Router) use `Request` objects from the Web Fetch API. The route handler calls `request.text()` (line 17 of `webhook/route.ts`) to get the raw body. This SHOULD work correctly because `Request.text()` returns the raw body as a string. However, if any middleware reads the body first (body is a ReadableStream that can only be consumed once), the handler's `request.text()` returns an empty string or throws.

**Specific risk in this codebase:**
- The webhook handler correctly calls `request.text()` before `constructWebhookEvent()` -- this is the right approach.
- HOWEVER: If a global middleware (e.g., in `middleware.ts`) or a route interceptor reads the request body for logging/validation, the body stream is consumed before the webhook handler can read it.
- The route has `export const dynamic = "force-dynamic"` which is correct -- but it does not prevent middleware body consumption.

**Current code is correct but fragile:**
```typescript
// webhook/route.ts -- CORRECT approach
let body: string;
try {
  body = await request.text();
} catch {
  return Response.json({ error: "Failed to read body." }, { status: 400 });
}
event = constructWebhookEvent(body, signature);
```

**Consequences:**
- Every webhook delivery fails with "Invalid signature"
- Stripe shows webhook delivery failures in the Dashboard
- Credits are never granted after payment
- Stripe retries the webhook (up to ~3 days with exponential backoff), generating noise

**Prevention:**
1. **Never add middleware that reads request bodies on the webhook path.** If you add a global middleware (e.g., for auth, logging), explicitly skip `/api/billing/webhook`.
2. **Do not add body-parsing libraries** (like `body-parser` or JSON validation middleware) globally.
3. **Test webhook verification after any middleware changes:** A working webhook can break if new middleware is added that intercepts the body.
4. **Monitor Stripe Dashboard webhook delivery status** after deployment.

**Detection:** Check Stripe Dashboard > Webhooks > endpoint > Recent deliveries. If all deliveries show `400` with "Invalid signature," the body is being consumed before the handler.

**Phase:** The current code is correct. This pitfall is about NOT breaking it during future changes. Add a code comment to the webhook route explaining why the body must be read as raw text.

**Confidence:** HIGH -- well-documented Stripe webhook integration requirement. The current implementation is correct but the pitfall is about maintaining correctness.

---

### Pitfall 6: Firestore Security Rules Block All Client Access (Rules Deny Everything)

**What goes wrong:** The existing `firestore.rules` file (at project root) denies all read and write access:
```
match /{document=**} {
  allow read, write: if false;
}
```
This is correct for the current architecture where ALL Firestore access happens server-side through Firebase Admin SDK (which bypasses security rules). However, if any future code attempts to access Firestore from the client SDK (e.g., real-time balance updates, or if someone adds Firestore to the client bundle), it will be blocked by these rules.

**Why this is NOT currently a problem:**
- All billing operations go through API routes that use Firebase Admin SDK
- Admin SDK bypasses security rules entirely
- The client never directly accesses Firestore

**Why this COULD become a problem:**
- If someone adds real-time Firestore listeners on the client for live balance updates
- If the rules are accidentally deployed with `firebase deploy --only firestore:rules` (which would override any existing rules in production)
- If someone changes the architecture to use client-side Firestore for billing

**When rules SHOULD be updated:**
- If you want defense-in-depth: even though the client does not access Firestore directly, proper rules protect against compromised API keys
- Example rules for billing collections:
  ```
  match /billing_users/{uid} {
    allow read: if request.auth != null && request.auth.uid == uid;
    allow write: if false; // Only server-side writes
  }
  ```

**Prevention:**
1. **Keep the deny-all rules** -- they are correct for the current server-only architecture.
2. **Do NOT deploy these rules to production** unless you verify the production Firestore already has these rules (or stricter).
3. **Document the architecture decision:** "All Firestore access is server-side via Admin SDK. Client SDK does not access Firestore. Security rules deny all client access as defense-in-depth."
4. **If adding client-side Firestore access later:** Update rules to allow specific authenticated reads before deploying the client code.

**Detection:** If a client-side Firestore read fails with "PERMISSION_DENIED," the security rules are blocking it.

**Phase:** No action needed for v1.5 (server-only architecture). Flag for future if architecture changes.

**Confidence:** HIGH -- verified by reading `firestore.rules` file.

---

## Moderate Pitfalls

Mistakes that cause broken features, poor UX, data inconsistencies, or require manual intervention.

### Pitfall 7: `request.url` Origin Mismatch on Cloud Run (Success/Cancel URLs)

**What goes wrong:** The checkout route (`src/app/api/billing/checkout/route.ts`, line 27) derives the success/cancel URLs from `new URL(request.url).origin`. On Cloud Run, the `request.url` may contain the internal `.run.app` URL instead of the custom domain `dan-weinbeck.com`, depending on how the request is proxied.

**Specific scenarios:**
- If the load balancer rewrites the `Host` header, `request.url` may use the `.run.app` origin
- If Cloud Run's URL mapping does not preserve the original host, success URL becomes `https://personal-brand-HASH.run.app/billing/success` instead of `https://dan-weinbeck.com/billing/success`
- The user completes checkout and is redirected to a `.run.app` URL they have never seen -- confusing and potentially breaking auth (Firebase Auth domain mismatch)

**Why it happens:** Cloud Run custom domain mapping works through a Google-managed load balancer. The `Host` header forwarded to the container depends on the configuration. Next.js reads the `Host` header to determine `request.url`.

**Current code:**
```typescript
const origin = new URL(request.url).origin;
const url = await createCheckoutSession({
  // ...
  successUrl: `${origin}/billing/success`,
  cancelUrl: `${origin}/billing/cancel`,
});
```

**Consequences:**
- User redirected to unexpected domain after checkout
- Firebase Auth token may not work on the `.run.app` domain (if not in authorized domains)
- Confusing UX for the user

**Prevention:**
1. **Hardcode the production origin** or use an environment variable:
   ```typescript
   const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
   ```
2. **Or validate the origin** against a whitelist of known domains before using it.
3. **Test by accessing the checkout flow through the production custom domain** and verify the redirect goes back to the same domain.

**Detection:** Complete a checkout on the production site and check the redirect URL. If it points to `.run.app` instead of `dan-weinbeck.com`, this pitfall is active.

**Phase:** Should be verified during the deployment validation phase.

**Confidence:** MEDIUM -- depends on Cloud Run's custom domain mapping behavior, which may handle this correctly. Needs testing.

---

### Pitfall 8: Idempotency Key Collision Across Sessions

**What goes wrong:** The brand scraper debit flow requires an `X-Idempotency-Key` header. If the client generates weak idempotency keys (e.g., timestamp-based, sequential counters, or reuses the same key), a legitimate second purchase could be treated as a duplicate and silently return cached results instead of debiting credits.

**Specific risk in this codebase:**
- `src/lib/billing/firestore.ts` line 149 creates the idempotency document key as `${uid}_${idempotencyKey}`
- If the client sends the same idempotency key for two different scrape jobs (e.g., using a session-scoped counter that resets on page refresh), the second job is silently treated as a duplicate
- The idempotency check returns the CACHED result (line 163-167), not an error -- the user would not know a new debit was skipped

**Consequences:**
- Second tool use appears to succeed but credits are not debited (good for user, bad for operator)
- Or: user retries a failed job with the same idempotency key, gets the old cached failure result instead of a new attempt

**Prevention:**
1. **Use UUIDs (v4) for idempotency keys** -- `crypto.randomUUID()` is available in all modern browsers and Node.js.
2. **Never reuse idempotency keys** across different logical operations.
3. **Document the idempotency key contract** for frontend developers: "Each tool use must have a globally unique idempotency key. Use `crypto.randomUUID()`."
4. **Add TTL to idempotency documents:** Old idempotency records should expire (e.g., after 24 hours) to prevent indefinite accumulation and to allow retries after a reasonable period.

**Detection:** Submit two scrape jobs in quick succession with the same idempotency key. If the second one returns immediately without debiting, idempotency is working but the key generation is too predictable.

**Phase:** Verify during billing code validation that the frontend generates proper UUIDs.

**Confidence:** HIGH -- verified by reading the idempotency logic in `firestore.ts`.

---

### Pitfall 9: GCS Signed URL Expiry Breaks Brand Scraper Results Display

**What goes wrong:** Brand scraper v1.1 returns GCS signed URLs for `brand_json_url` and `assets_zip_url` (and for logo/asset image URLs in the taxonomy). These URLs have a limited TTL (assumed 1 hour). After expiry, all images in the results display break, and download links return `403 Forbidden` or `SignatureDoesNotMatch` errors.

**Specific risk in this codebase:**
- `src/lib/brand-scraper/types.ts` lines 97-98: `brand_json_url` and `assets_zip_url` are strings (GCS signed URLs)
- `src/components/admin/brand-scraper/LogoAssetsCard.tsx` renders logo and asset URLs directly in `<img src={logo.url}>` tags
- The component already has a biome-ignore comment noting "GCS signed URLs have dynamic hostnames incompatible with next/image" (line 34)
- There is no mechanism to detect or recover from expired URLs
- The user-facing brand scraper flow (`/apps/brand-scraper`) polls for job completion, but the signed URLs in the response are generated once and never refreshed

**Consequences:**
- Images break silently after TTL expires -- broken image icons with no error message
- Download links for brand JSON and assets ZIP fail
- If the user's scrape job takes a long time and they view results later, URLs may already be expired
- Admin viewing old brand results sees broken images

**Prevention:**
1. **Re-fetch job status when URLs fail:** Add an `onError` handler to `<img>` tags that triggers a re-fetch of the job status endpoint to get fresh signed URLs.
2. **Display URL expiry time** so users know the results are time-limited.
3. **Cache-bust stale data:** Include a timestamp in the SWR cache key so stale signed URLs are not served from cache.
4. **For the user-facing flow:** Immediately fetch and display results when the job completes (URLs are fresh). Add a notice: "Download links expire in 1 hour."
5. **Long-term:** Consider proxying downloads through a Next.js API route that generates fresh signed URLs server-side.

**Detection:** Complete a brand scrape, wait 1+ hours, return to the results page. If images are broken and downloads fail, this pitfall is active.

**Phase:** Should be addressed when implementing the user-facing brand scraper flow.

**Confidence:** HIGH -- GCS signed URL expiry is documented behavior. The 1-hour TTL is from the project context.

---

### Pitfall 10: Cold Start Timeout on Cloud Run for Webhook Processing

**What goes wrong:** Cloud Run is configured with `min-instances=0` (`cloudbuild.yaml` line 35). When the service scales to zero and a Stripe webhook arrives, Cloud Run must cold-start a new container instance. The cold start includes downloading the container image, starting Node.js, and initializing the Next.js server. If the total cold start time exceeds Stripe's webhook timeout (currently 20 seconds for the initial attempt), Stripe records the delivery as failed and retries later.

**Why it happens:** Stripe webhooks have strict timeout requirements. The initial delivery attempt times out after ~20 seconds. Cloud Run cold starts for a Next.js app can take 3-15 seconds depending on image size, dependencies, and initialization logic (Firebase Admin SDK initialization, etc.).

**Specific risk in this codebase:**
- Container image uses `node:20-alpine` with standalone output -- relatively lean
- Firebase Admin SDK initialization happens on first import (line 39-46 of `firebase.ts`)
- `applicationDefault()` credential resolution on Cloud Run may add latency on first call
- The webhook handler then runs a Firestore transaction (`applyPurchaseFromStripe`) which adds more time
- Total: cold start (5-10s) + Firebase init (1-2s) + Firestore transaction (1-3s) = potentially 7-15s

**Consequences:**
- Stripe records webhook as failed (but retries)
- Stripe retries with exponential backoff (1 min, 5 min, 30 min, etc.) -- credits are eventually granted but delayed
- If ALL retries fail (Stripe retries for ~3 days), credits are never granted
- User experiences a delay between payment and credit delivery

**Prevention:**
1. **Keep `min-instances=0` for cost savings** -- this is a low-traffic personal project. The retry behavior handles cold starts acceptably.
2. **Optimize cold start time:** The standalone Next.js output is already lean. Ensure the Docker image does not include unnecessary files.
3. **Return 200 quickly, process asynchronously:** The webhook handler could acknowledge receipt immediately and process the event asynchronously. However, this adds complexity (need a queue or background job) and is likely overkill for this project.
4. **If cold start becomes a problem:** Set `min-instances=1` in `cloudbuild.yaml`. This keeps one instance warm at all times (~$10-15/month on Cloud Run) and eliminates cold starts for the first request.
5. **Monitor webhook delivery success rate** in Stripe Dashboard after deployment.

**Detection:** Check Stripe Dashboard > Webhooks > endpoint > Recent deliveries. If the first attempt shows timeouts but retries succeed, cold starts are causing delays. If all attempts fail, the issue is more severe.

**Phase:** Monitor after deployment. Only act if webhook failures persist beyond retries.

**Confidence:** MEDIUM -- depends on actual cold start time, which varies. The retry mechanism provides resilience.

---

### Pitfall 11: Firestore Transaction Contention on Rapid Balance Mutations

**What goes wrong:** Firestore transactions use optimistic concurrency control. If two transactions read and write the same document simultaneously, one will be retried (up to a few retries before failing). In the billing system, concurrent operations on the same user's balance could cause transaction failures.

**Specific scenarios in this codebase:**
- User clicks "Buy Credits" and immediately uses a tool -- `applyPurchaseFromStripe` and `debitForToolUse` both read/write the same `billing_users/{uid}` document
- The webhook fires while the user is mid-tool-use
- Admin adjusts credits while the user is making a purchase

**Why this is LOW risk for this project:**
- Single-user personal project with low transaction volume
- Firestore transactions retry automatically (3 retries by default with Admin SDK)
- The operations are fast (single-document reads + writes)
- The idempotency mechanisms prevent double-processing even if retries occur

**Why to be aware of it:**
- If the project scales to multiple users using tools simultaneously, contention increases
- The `debitForToolUse` transaction reads 4 documents (idempotency, user, pricing, plus writes to 4 collections) -- this is a relatively wide transaction that could conflict

**Consequences:**
- Transaction failure after retries -- user sees "Failed to debit credits" error
- The operation is safe to retry (idempotency key prevents double-charging)

**Prevention:**
1. **For MVP:** No action needed. Low traffic means contention is extremely unlikely.
2. **If scaling:** Consider separating read and write paths, or using Firestore increment operations (already used in some places via `FieldValue.increment`) to reduce conflict surface.
3. **Ensure all mutations are idempotent** -- already done via idempotency keys and event ID deduplication.

**Detection:** Intentionally trigger concurrent operations (purchase webhook + tool use) on the same user. If one fails with a transaction error, contention is occurring.

**Phase:** No action for v1.5. Monitor if user base grows.

**Confidence:** HIGH -- Firestore transaction behavior is well-documented. LOW risk due to low traffic.

---

### Pitfall 12: GCS Signed URLs Cached by Browser/CDN Break After Expiry

**What goes wrong:** The browser (or an intermediate CDN/proxy) caches the GCS signed URL response. When the user returns to the page, the browser serves the cached response. But the signed URL in the cached response has expired. The `<img>` tag uses the cached (expired) signed URL, which returns `403` from GCS. Even refreshing the page may serve cached data.

**Why it happens:** SWR (used in `useJobStatus` hook, `src/lib/brand-scraper/hooks.ts`) has a built-in cache. The job status response (containing signed URLs) is cached by SWR's in-memory cache and potentially by the browser's HTTP cache if the API response includes cache headers.

**Specific risk in this codebase:**
- `useJobStatus` uses SWR with `revalidateOnFocus: false` and `revalidateOnReconnect: false` (lines 53-54) -- this means stale data persists in the cache
- When polling stops (terminal state reached), SWR does not re-fetch unless explicitly told to
- If the user navigates away and comes back, SWR serves the cached (potentially expired) response

**Consequences:**
- Stale signed URLs served from SWR cache
- Images break without any network request to detect the failure
- User must hard-refresh or clear cache to get fresh URLs

**Prevention:**
1. **Add cache control headers** to the job status API response: `Cache-Control: no-store` prevents browser HTTP caching.
2. **Use SWR's `revalidateOnFocus: true`** for the job status endpoint -- when the user returns to the tab, SWR re-fetches automatically, getting fresh signed URLs.
3. **Add a manual "Refresh Results" button** that calls SWR's `mutate()` to force re-fetch.
4. **Set a reasonable `dedupingInterval`** in SWR to prevent serving stale data after long pauses.

**Detection:** Complete a scrape, navigate away, wait for URL expiry, navigate back. If images are broken, the cache is serving stale signed URLs.

**Phase:** Should be addressed when implementing the user-facing brand scraper results display.

**Confidence:** HIGH -- verified by reading the SWR configuration in `hooks.ts`.

---

### Pitfall 13: `next/image` Cannot Handle GCS Signed URL Hostnames

**What goes wrong:** If someone tries to use Next.js `<Image>` component instead of raw `<img>` tags for brand scraper results, it will fail because `<Image>` requires whitelisted domains in `next.config.ts` via `images.remotePatterns`. GCS signed URLs use `storage.googleapis.com` as the hostname, which is not in the allowlist. Furthermore, signed URLs include query parameters that change per URL, making pattern matching complex.

**Why this is already handled (but fragile):**
- The existing code in `LogoAssetsCard.tsx` uses raw `<img>` tags with a biome-ignore comment explaining why: "GCS signed URLs have dynamic hostnames incompatible with next/image" (line 34).
- This is the correct approach for signed URLs.

**Why to flag it:**
- A future developer may "fix" the biome lint warning by switching to `<Image>`, breaking the display
- The biome comment explains the reasoning, but not prominently

**Prevention:**
1. **Keep using raw `<img>` tags for GCS signed URLs** -- the biome-ignore comments are correct.
2. **If Next.js `<Image>` is desired:** Add `storage.googleapis.com` to `images.remotePatterns` in `next.config.ts`. But note that signed URL query parameters may cause caching issues with Next.js image optimization.
3. **Add a shared component** (e.g., `SignedUrlImage`) that encapsulates the raw `<img>` tag pattern, making it clear this is intentional.

**Detection:** If someone replaces `<img>` with `<Image>` for brand scraper results and images break with "Invalid src prop" or "hostname not configured," this pitfall is active.

**Phase:** Already handled in current code. Just maintain awareness.

**Confidence:** HIGH -- verified by reading `LogoAssetsCard.tsx` and the existing biome-ignore comments.

---

## Minor Pitfalls

Mistakes that cause annoyance, confusion, or minor bugs but are easily fixable.

### Pitfall 14: Tool Pricing Not Seeded in Production Firestore

**What goes wrong:** The billing system reads tool pricing from the `billing_tool_pricing` Firestore collection. If this collection is empty in production (never seeded), the billing page shows no tools, and tool debit fails with "Unknown tool: brand_scraper" because no pricing document exists.

**Specific risk in this codebase:**
- `src/lib/billing/tools.ts` contains `seedToolPricing()` which creates pricing documents if they do not exist
- This function is NOT automatically called anywhere -- it must be triggered manually or by an API route
- The seed data includes 4 tools with `brand_scraper` as the only active one

**Consequences:**
- Billing page shows empty pricing table
- Brand scraper debit fails with "Unknown tool" error
- Users with credits cannot use any tools

**Prevention:**
1. **Create an admin API route or script** that calls `seedToolPricing()` once after deployment.
2. **Or call `seedToolPricing()` at application startup** (e.g., in a top-level import or middleware). The function is idempotent (checks for existing docs before writing).
3. **Or manually create the documents** in Firestore Console before deploying the billing code.
4. **Verify after deployment:** Check that `billing_tool_pricing/brand_scraper` exists in Firestore.

**Detection:** Visit the billing page. If the pricing table is empty, or if tool use fails with "Unknown tool," pricing was not seeded.

**Phase:** Must be done during or immediately after deployment. Add to deployment checklist.

**Confidence:** HIGH -- verified by reading `tools.ts` and finding no automatic invocation of `seedToolPricing()`.

---

### Pitfall 15: Admin Panel Accessible to Non-Admin Authenticated Users

**What goes wrong:** The admin billing routes (`/api/admin/billing/*`) should only be accessible to the admin user. If they use `verifyUser()` instead of `verifyAdmin()` for auth, any authenticated user could access admin billing functions (view all users, adjust credits, refund usage, edit pricing).

**Specific risk in this codebase:**
- `src/lib/auth/user.ts` provides `verifyUser()` which checks for ANY authenticated Firebase user
- Admin routes need a separate `verifyAdmin()` that also checks the email matches the admin email
- If admin routes accidentally use `verifyUser()`, any Google user who signs in can access admin functions

**Consequences:**
- Any authenticated user can view all billing users' data
- Any authenticated user can grant themselves unlimited credits via admin adjustment
- Any authenticated user can modify tool pricing
- Any authenticated user can refund any usage

**Prevention:**
1. **Create a `verifyAdmin()` function** (may already exist in the admin API routes -- verify during code validation).
2. **Every admin route must use `verifyAdmin()`**, not `verifyUser()`.
3. **Add tests** that verify admin routes reject non-admin authenticated users.
4. **Consider using Firebase custom claims** (`admin: true`) instead of email matching for more robust admin detection.

**Detection:** Sign in as a non-admin Google account and attempt to access `/api/admin/billing/users`. If it returns data instead of 403, admin auth is missing.

**Phase:** Must be verified during billing code validation phase.

**Confidence:** HIGH -- verified by reading `verifyUser()` which only checks "is authenticated," not "is admin."

---

### Pitfall 16: Stripe Checkout Success Page Shows Before Credits Are Granted

**What goes wrong:** After completing Stripe Checkout, the user is redirected to `/billing/success`. This redirect happens immediately via the browser. The webhook that grants credits fires asynchronously (could take seconds due to cold starts, network latency, or Stripe delivery delay). The success page loads and shows a "Payment successful!" message, but if the user immediately checks their balance, credits have not been granted yet.

**Consequences:**
- User sees "Payment successful" but balance has not changed -- confusing
- User may try to use a tool immediately and get "Insufficient credits" error
- Creates distrust in the billing system

**Prevention:**
1. **On the success page, poll the balance API** for a few seconds after redirect:
   ```typescript
   // Poll /api/billing/me every 2 seconds for up to 30 seconds
   // Show "Processing payment..." until credits appear
   // Show "Credits added!" when balance increases
   // Show "Taking longer than expected..." after 30 seconds
   ```
2. **Or display a clear message:** "Your payment is being processed. Credits will appear in your balance within a few minutes."
3. **Do NOT rely on Stripe Checkout's `payment_intent` URL parameter** to determine credit amount -- always verify via your backend.

**Detection:** Complete a purchase and immediately check the balance on the success page. If credits have not increased, there is a delay.

**Phase:** Should be addressed when implementing the success page UI.

**Confidence:** HIGH -- inherent in the async webhook model.

---

### Pitfall 17: Stripe Webhook Returning 500 Causes Infinite Retries

**What goes wrong:** The webhook handler (`src/app/api/billing/webhook/route.ts`, line 55) returns a `500` status when `applyPurchaseFromStripe` throws an error. Stripe interprets 5xx responses as "try again later" and retries the webhook with exponential backoff. If the error is persistent (e.g., a code bug, not a transient failure), Stripe retries for ~3 days, generating repeated errors in Cloud Run logs.

**Current code:**
```typescript
} catch (error) {
  console.error("Failed to apply purchase:", error);
  return Response.json(
    { error: "Failed to process purchase." },
    { status: 500 },  // Causes Stripe to retry
  );
}
```

**When retries are GOOD:** Transient Firestore errors, cold start timeouts, temporary network issues -- retries eventually succeed.

**When retries are BAD:** Code bugs (malformed metadata, type errors), impossible states (unknown credit pack) -- retries will never succeed and just generate noise.

**Consequences:**
- Log pollution from repeated failed webhook deliveries
- Stripe Dashboard shows persistent failures
- Credits may be granted on a later retry after a transient failure (correct behavior), but code bugs cause 3 days of failed retries before Stripe gives up

**Prevention:**
1. **Distinguish transient from permanent errors:**
   - Transient (return 500, let Stripe retry): Firestore unavailable, network error, timeout
   - Permanent (return 200 to stop retries, log alert): Invalid metadata, unknown credit pack, code error
2. **The existing idempotency in `applyPurchaseFromStripe` is correct:** Even if the webhook is retried successfully, the duplicate event is safely ignored via the `stripeEventsCol` check.
3. **Add structured logging** to distinguish between "webhook failed, will retry" and "webhook failed permanently."

**Detection:** Check Stripe Dashboard > Webhooks for repeated delivery failures. If the same event has multiple failed attempts, investigate whether it is transient or permanent.

**Phase:** Consider during code validation. The current behavior is acceptable for MVP.

**Confidence:** HIGH -- standard Stripe webhook retry behavior.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| GCP Secret Manager setup | Pitfall 3 (IAM missing for Cloud Run SA) | Grant `secretmanager.secretAccessor` to BOTH Cloud Build and Cloud Run SAs | CRITICAL |
| Stripe key management | Pitfall 1 (test keys in production) | Verify `sk_live_` prefix in Secret Manager before deploying | CRITICAL |
| Stripe webhook setup | Pitfall 2 (endpoint not registered) | Register `dan-weinbeck.com/api/billing/webhook` in Stripe Dashboard | CRITICAL |
| Firebase Auth configuration | Pitfall 4 (domain not authorized) | Add `dan-weinbeck.com` to Firebase Auth authorized domains | CRITICAL |
| Webhook body handling | Pitfall 5 (middleware destroys body) | Do NOT add middleware that reads body on webhook path | CRITICAL |
| Checkout redirect URLs | Pitfall 7 (origin mismatch) | Test success/cancel redirects on production domain | MODERATE |
| Idempotency key generation | Pitfall 8 (key collision) | Use `crypto.randomUUID()` for all idempotency keys | MODERATE |
| Brand scraper results display | Pitfall 9 + 12 (signed URL expiry + caching) | Add image error handlers, set Cache-Control headers | MODERATE |
| Cold start + webhook timing | Pitfall 10 (timeout) + 16 (delayed credits) | Monitor Stripe webhook delivery; add polling on success page | MODERATE |
| Tool pricing data | Pitfall 14 (not seeded) | Run `seedToolPricing()` after deployment | MINOR |
| Admin auth | Pitfall 15 (non-admin access) | Verify all admin routes use `verifyAdmin()`, not `verifyUser()` | MODERATE |

---

## Pre-Deployment Checklist (Derived from Pitfalls)

This checklist should be completed before billing goes live:

### Stripe Configuration
- [ ] `stripe-secret-key` in Secret Manager contains a `sk_live_` key (not `sk_test_`)
- [ ] `stripe-webhook-secret` in Secret Manager contains the production webhook signing secret
- [ ] Webhook endpoint registered in Stripe Dashboard: `https://dan-weinbeck.com/api/billing/webhook`
- [ ] Webhook endpoint listens for `checkout.session.completed` event
- [ ] Signing secret from the production webhook endpoint (not a test/CLI endpoint) stored in Secret Manager

### GCP IAM
- [ ] `cloudrun-site` service account has `secretmanager.secretAccessor` on `stripe-secret-key`
- [ ] `cloudrun-site` service account has `secretmanager.secretAccessor` on `stripe-webhook-secret`
- [ ] Cloud Build service account has `secretmanager.secretAccessor` on all secrets referenced in `cloudbuild.yaml`
- [ ] `cloudrun-site` service account has `roles/datastore.user` (already granted by `deploy.sh`)

### Firebase Auth
- [ ] `dan-weinbeck.com` added to Firebase Console > Authentication > Settings > Authorized domains
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` set correctly in Cloud Build substitutions
- [ ] Google Sign-In provider enabled in Firebase Console > Authentication > Sign-in method

### Firestore Data
- [ ] `billing_tool_pricing/brand_scraper` document exists with correct pricing (50 credits, active)
- [ ] Verify by reading: `firestore.collection('billing_tool_pricing').doc('brand_scraper').get()`

### End-to-End Validation
- [ ] Sign in with Google on production domain -- succeeds
- [ ] View billing page -- shows balance and pricing
- [ ] Complete a real purchase ($5) -- Stripe charges appear in live Dashboard
- [ ] Webhook fires successfully -- credits granted within seconds
- [ ] Brand scraper debit works -- credits deducted, job submitted
- [ ] Auto-refund works -- trigger a failure, verify credits returned

---

## Sources

- **Codebase analysis (HIGH confidence):**
  - `src/lib/billing/stripe.ts` -- Stripe client singleton, key from env var without prefix check
  - `src/lib/billing/firestore.ts` -- All Firestore billing operations with transactions and idempotency
  - `src/lib/billing/tools.ts` -- Seed data for tool pricing (not auto-invoked)
  - `src/lib/billing/types.ts` -- Credit packs, schemas, Firestore document shapes
  - `src/app/api/billing/webhook/route.ts` -- Webhook handler with raw body read and signature verification
  - `src/app/api/billing/checkout/route.ts` -- Checkout session creation with `request.url` origin derivation
  - `src/lib/auth/user.ts` -- `verifyUser()` checks any authenticated user, not admin specifically
  - `src/lib/firebase.ts` -- Admin SDK initialization with ADC on Cloud Run
  - `src/lib/firebase-client.ts` -- Client SDK with `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `src/lib/brand-scraper/hooks.ts` -- SWR polling with `revalidateOnFocus: false`
  - `src/components/admin/brand-scraper/LogoAssetsCard.tsx` -- Raw `<img>` tags for signed URLs
  - `cloudbuild.yaml` -- `--set-secrets` for Stripe secrets, `min-instances=0`
  - `scripts/deploy.sh` -- Deploy script with Firestore IAM but no Secret Manager IAM
  - `scripts/setup-cicd.sh` -- CI/CD setup grants Secret Manager to Cloud Build SA only, not Cloud Run SA
  - `firestore.rules` -- Deny-all rules (correct for server-only architecture)
  - `docs/DEPLOYMENT.md` -- Stripe setup documentation
  - `.env.local.example` -- Environment variable templates with test key examples

- **Training data knowledge (MEDIUM confidence -- well-established patterns unlikely to have changed):**
  - Stripe test/live mode key architecture and webhook behavior
  - GCP Secret Manager IAM model and Cloud Run `--set-secrets` requirements
  - Firebase Auth authorized domains configuration
  - GCS signed URL expiry behavior and CORS requirements
  - Firestore optimistic concurrency and transaction retry behavior
  - Cloud Run cold start behavior with `min-instances=0`
