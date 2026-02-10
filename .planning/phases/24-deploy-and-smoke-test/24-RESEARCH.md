# Phase 24: Deploy & Smoke Test - Research

**Researched:** 2026-02-09
**Domain:** GCP Cloud Build/Run deployment, Stripe test-mode integration, Firebase Auth, end-to-end validation
**Confidence:** HIGH

## Summary

Phase 24 is a deployment and manual validation phase. The codebase is fully implemented -- billing system (~3K LOC), brand scraper integration, admin panel, Stripe checkout, Firebase Auth -- and Phase 23 confirmed all infrastructure (secrets, webhook, indexes, seed data, IAM) is configured. This phase triggers a Cloud Build deployment and then systematically walks through every user flow to confirm it works end-to-end on production.

The primary technical risk is that this is largely a **human-action phase**: pushing code to trigger Cloud Build, then manually testing each user flow in the browser with real (test-mode) Stripe cards. There is no new application code to write. The work is: (1) trigger the deployment, (2) verify it succeeds, (3) smoke test each requirement, (4) update the `BRAND_SCRAPER_API_URL` once that service is deployed.

**Primary recommendation:** Structure this as a checkpoint-based plan where each task is a manual verification step with clear pass/fail criteria. The planner should NOT create code-writing tasks -- everything is already committed to master. The only potential code change is updating the `_BRAND_SCRAPER_API_URL` Cloud Build substitution variable once the brand-scraper v1.1 service URL is known.

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `gcloud` CLI | latest | Trigger Cloud Build, verify Cloud Run deployment | GCP's official CLI; already used throughout project |
| `stripe` CLI | latest | Trigger test webhook events, verify endpoint | Stripe's official testing tool |
| `firebase` CLI (via `npx firebase-tools`) | latest | Already deployed indexes/rules in Phase 23 | Firebase's official CLI |
| Chrome DevTools / Browser | N/A | Manual E2E testing | Standard for smoke testing web flows |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `curl` | system | Hit API endpoints directly for verification | When testing webhook delivery or API responses |
| Stripe Dashboard (test mode) | N/A | View payment events, webhook delivery status | Verifying webhook delivery after test purchase |

### Alternatives Considered

None -- this phase uses only existing tools. No new dependencies are needed.

**Installation:** No new packages to install. All tools are already available or installable via system package managers.

## Architecture Patterns

### Recommended Deployment Flow

```
1. Push to master (or trigger manually)
       │
       ▼
2. Cloud Build runs (3-stage Dockerfile)
   - Stage 1: npm ci (install deps)
   - Stage 2: npm run build (Next.js standalone)
   - Stage 3: Minimal production runner
       │
       ▼
3. Image pushed to Artifact Registry
       │
       ▼
4. gcloud run deploy with:
   - --set-env-vars (Firebase, chatbot URL, brand scraper URL)
   - --set-secrets (GitHub token, Todoist, Stripe keys)
       │
       ▼
5. Cloud Run serves at dan-weinbeck.com
```

### Existing cloudbuild.yaml Structure (Already Correct)

The `cloudbuild.yaml` at project root already contains all three steps (build, push, deploy) with correct substitution variables and secret mounts. Key substitution variables that must be verified:

| Variable | Purpose | Set In |
|----------|---------|--------|
| `_NEXT_PUBLIC_FIREBASE_API_KEY` | Client-side Firebase config | Cloud Build trigger |
| `_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | Cloud Build trigger |
| `_NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Cloud Build trigger |
| `_CHATBOT_API_URL` | FastAPI RAG backend URL | Cloud Build trigger |
| `_BRAND_SCRAPER_API_URL` | Brand scraper service URL | Cloud Build trigger |

### Secrets Mounted at Runtime (via --set-secrets)

| Secret Name | Env Var | Source |
|-------------|---------|--------|
| `github-token` | `GITHUB_TOKEN` | Secret Manager |
| `todoist-api-token` | `TODOIST_API_TOKEN` | Secret Manager |
| `stripe-secret-key` | `STRIPE_SECRET_KEY` | Secret Manager (v2, test-mode) |
| `stripe-webhook-secret` | `STRIPE_WEBHOOK_SECRET` | Secret Manager (v2, test-mode) |

### Smoke Test Flow (Ordered by Dependency)

```
1. Deployment verification
   - Cloud Build succeeds
   - Cloud Run revision is live
   - Site loads at dan-weinbeck.com

2. Authentication (prerequisite for all billing)
   - Google Sign-In works (E2E-01)
   - New user gets signup grant (E2E-02)

3. Billing purchase flow
   - User sees billing page with balance (100 credits)
   - User can initiate Stripe Checkout (E2E-03)
   - Stripe test card 4242 completes payment
   - Webhook fires and credits appear (E2E-04)

4. Brand scraper flow (depends on external service)
   - User can submit brand scrape (E2E-05)
   - Credits debited (50 credits)
   - Failed scrape auto-refunds (E2E-06)
   - [If brand-scraper v1.1 is live]: Results display with download URLs (BSINT-02)

5. Admin panel verification
   - Admin sees billing users (E2E-07)
   - Admin can adjust credits (E2E-08)
   - Admin can edit pricing (E2E-09)
```

### Anti-Patterns to Avoid

- **Deploying without verifying substitution variables first:** Always run `gcloud builds triggers describe TRIGGER_NAME` to confirm all 5 substitution variables are populated before triggering a build.
- **Testing webhook with `stripe trigger` against production:** The `stripe trigger` CLI command sends synthetic events. For a real smoke test, use the actual Stripe Checkout flow in the browser with test card `4242 4242 4242 4242`.
- **Skipping the signup grant test:** The first sign-in triggers `ensureBillingUser()` which creates the billing user with 100 credits. If this fails silently, all subsequent billing tests will have confusing results.
- **Testing brand scraper without verifying the URL:** If `BRAND_SCRAPER_API_URL` is empty or points to a non-existent service, the scrape submission will return a 503. This is expected behavior if the brand-scraper v1.1 service is not yet deployed -- but should be explicitly documented as a known blocker.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Automated E2E testing | Cypress/Playwright test suite | Manual browser testing | Phase scope is smoke testing, not test automation; full E2E suite would be a separate phase |
| Deployment monitoring | Custom health check scripts | Cloud Run console + `gcloud run services describe` | Built-in health checks are sufficient for smoke testing |
| Stripe webhook testing | Custom webhook replay tool | Stripe Dashboard "Send test webhook" or actual test purchase | Stripe's built-in tools are purpose-built for this |

**Key insight:** This phase is about verifying existing code works in production, not building new code. The temptation to automate the testing should be resisted -- the value is in manual verification of the real production environment.

## Common Pitfalls

### Pitfall 1: Cloud Build Fails Due to Missing Substitution Variables

**What goes wrong:** Build triggers with empty substitution variables result in build-time errors (empty Firebase config) or runtime errors (empty env vars).
**Why it happens:** Cloud Build trigger substitution variables are set in the GCP Console, not in code. They can be accidentally cleared or never set.
**How to avoid:** Before triggering the build, run `gcloud builds triggers describe TRIGGER_NAME --region=REGION --format="value(substitutions)"` to verify all variables are populated.
**Warning signs:** Build succeeds but site shows blank Firebase config in client JS, or API routes return 500 errors.

### Pitfall 2: Stripe Webhook Signature Mismatch

**What goes wrong:** Webhook returns 400 "Invalid signature" even though the webhook endpoint URL is correct.
**Why it happens:** The `STRIPE_WEBHOOK_SECRET` in Secret Manager (v2) might not match the signing secret for the registered webhook endpoint (`we_1Sz3MfFRUqcoojOa4nyfmBan`).
**How to avoid:** Verify the webhook secret matches by checking the Stripe Dashboard -> Webhooks -> Signing secret. Compare it to the Secret Manager value: `gcloud secrets versions access latest --secret=stripe-webhook-secret`.
**Warning signs:** Test purchase completes in Stripe but credits never appear in user's balance.

### Pitfall 3: Firebase Auth Domain Mismatch

**What goes wrong:** Google Sign-In popup opens but closes immediately or shows "auth/unauthorized-domain" error.
**Why it happens:** The domain serving the page (dan-weinbeck.com) must be in Firebase Auth's authorized domains list, AND the `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` env var must match the Firebase project's auth domain.
**How to avoid:** Phase 23 already added dan-weinbeck.com and the Cloud Run .run.app domain. Verify in Firebase Console -> Authentication -> Settings -> Authorized domains.
**Warning signs:** Sign-in button shows error in browser console mentioning "unauthorized domain".

### Pitfall 4: Brand Scraper Service Not Yet Deployed

**What goes wrong:** Submitting a brand scrape returns a 503 "BRAND_SCRAPER_API_URL not configured" error or connection refused.
**Why it happens:** The brand-scraper v1.1 is a separate Cloud Run service that has its own deployment timeline. Phase 24 depends on it being live.
**How to avoid:** Test the brand scraper URL separately first with `curl $BRAND_SCRAPER_API_URL/health`. If not yet deployed, document the E2E-05/E2E-06/BSINT-01/BSINT-02 requirements as "blocked on external dependency" rather than failing the phase.
**Warning signs:** The `_BRAND_SCRAPER_API_URL` substitution variable in Cloud Build is empty or points to a placeholder.

### Pitfall 5: Cold Start Timeout on First Request

**What goes wrong:** First request to the newly deployed Cloud Run service times out because Firebase Admin SDK initialization takes several seconds during cold start.
**Why it happens:** Cloud Run min-instances is 0, so the first request must cold-start the container, load Node.js, initialize Firebase Admin SDK, and connect to Firestore.
**How to avoid:** After deployment, make a simple GET request to the site (homepage, which does not require Firebase) to warm up the container. Then proceed to auth/billing tests.
**Warning signs:** First API call returns 504 Gateway Timeout or takes >10 seconds.

### Pitfall 6: Signed URL CORS Issues for Brand Scraper Downloads

**What goes wrong:** Download buttons for brand JSON and assets ZIP fail with CORS errors when clicked.
**Why it happens:** GCS signed URLs require the source bucket to have CORS configured to allow the requesting domain. If the brand-scraper service generates signed URLs from a GCS bucket without proper CORS settings, browser downloads will fail.
**How to avoid:** This is a configuration issue on the brand-scraper service side. If download buttons fail, check the GCS bucket's CORS configuration: `gcloud storage buckets describe gs://BUCKET_NAME --format="json(cors_config)"`.
**Warning signs:** Network tab shows CORS preflight failure on the signed URL domain.

## Code Examples

### Triggering Cloud Build Manually

```bash
# Option 1: Push to master (automatic trigger)
git push origin master

# Option 2: Manually run the trigger
gcloud builds triggers run TRIGGER_NAME \
  --region=us-central1 \
  --branch=master

# Monitor the build
gcloud builds list --limit=1 --region=us-central1
gcloud builds log BUILD_ID --region=us-central1
```
Source: [GCP Cloud Build docs](https://docs.google.com/build/docs/automating-builds/create-manage-triggers)

### Verifying Cloud Run Deployment

```bash
# Check service status
gcloud run services describe personal-brand \
  --region=us-central1 \
  --format="table(status.url, status.conditions.status)"

# Check latest revision
gcloud run revisions list \
  --service=personal-brand \
  --region=us-central1 \
  --limit=3

# Verify environment variables are set
gcloud run services describe personal-brand \
  --region=us-central1 \
  --format="yaml(spec.template.spec.containers[0].env)"
```

### Verifying Stripe Webhook Delivery

```bash
# Check webhook events in Stripe Dashboard or via API
# After making a test purchase, check webhook delivery:
stripe events list --limit=5

# Or trigger a synthetic event for quick check
stripe trigger checkout.session.completed
```
Source: [Stripe CLI docs](https://docs.stripe.com/stripe-cli/use-cli)

### Smoke Test: Checkout Flow (Manual Browser Steps)

```
1. Navigate to dan-weinbeck.com
2. Click Sign In (Google Sign-In)
3. Complete OAuth flow
4. Navigate to /billing
5. Verify balance shows 100 credits (signup grant)
6. Click "Buy 500 Credits ($5)"
7. In Stripe Checkout:
   - Card: 4242 4242 4242 4242
   - Exp: any future date
   - CVC: any 3 digits
   - ZIP: any 5 digits
8. Complete payment
9. Should redirect to /billing/success
10. Navigate to /billing
11. Verify balance shows 600 credits (100 + 500)
```
Source: [Stripe Testing docs](https://docs.stripe.com/testing-use-cases)

### Verifying Brand Scraper URL

```bash
# Check if the brand scraper service is reachable
curl -s "${BRAND_SCRAPER_API_URL}/health" || echo "Service not reachable"

# If not yet deployed, update the substitution variable when ready:
gcloud builds triggers update TRIGGER_NAME \
  --region=us-central1 \
  --update-substitutions=_BRAND_SCRAPER_API_URL=https://brand-scraper-HASH-uc.a.run.app
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `gcloud run deploy` | Cloud Build trigger on push to master | Already configured | Deployment is automatic on push |
| Environment variables in Cloud Run console | `--set-env-vars` in cloudbuild.yaml | Already configured | Env vars are version-controlled |
| Stripe secret keys as env vars | Secret Manager with `--set-secrets` | Phase 23 | Secrets never appear in build logs |
| Firebase Admin SDK with explicit credentials | ADC (Application Default Credentials) on Cloud Run | Already configured | No credential files needed in container |

**Deprecated/outdated:**
- None relevant. All infrastructure patterns in use are current.

## Existing Codebase Inventory (Relevant to Phase 24)

Everything needed for Phase 24 is already built and committed. Here is the complete inventory:

### Billing System
- `src/lib/billing/types.ts` - Credit pack definitions, Zod schemas, Firestore document types
- `src/lib/billing/stripe.ts` - Stripe client singleton, checkout session creation, webhook event construction
- `src/lib/billing/firestore.ts` - All billing Firestore operations (ensureBillingUser, debit, refund, purchase, admin ops, queries)
- `src/lib/billing/tools.ts` - Tool pricing seed data and seedToolPricing() function

### API Routes
- `src/app/api/billing/me/route.ts` - GET: returns user balance + active pricing (creates billing user on first call)
- `src/app/api/billing/checkout/route.ts` - POST: creates Stripe Checkout session, returns redirect URL
- `src/app/api/billing/webhook/route.ts` - POST: handles `checkout.session.completed`, applies purchase credits
- `src/app/api/tools/brand-scraper/scrape/route.ts` - POST: debits credits, submits to external brand scraper, auto-refunds on failure
- `src/app/api/tools/brand-scraper/jobs/[id]/route.ts` - GET: polls job status, auto-refunds on failure, marks succeeded

### Admin API Routes
- `src/app/api/admin/billing/users/route.ts` - GET: list all billing users
- `src/app/api/admin/billing/users/[uid]/route.ts` - GET: user detail (user + ledger + usage + purchases)
- `src/app/api/admin/billing/users/[uid]/adjust/route.ts` - POST: admin credit adjustment
- `src/app/api/admin/billing/pricing/route.ts` - GET: all pricing; POST: update tool pricing
- `src/app/api/admin/billing/usage/[usageId]/refund/route.ts` - POST: admin usage refund

### User-Facing Pages
- `src/app/billing/page.tsx` - Billing page (balance, buy credits button)
- `src/app/billing/success/page.tsx` - Post-purchase success page
- `src/app/billing/cancel/page.tsx` - Purchase cancelled page
- `src/app/apps/brand-scraper/page.tsx` - Brand scraper user page

### Admin Pages
- `src/app/control-center/billing/page.tsx` - Admin billing dashboard (users table + pricing table)
- `src/app/control-center/billing/[uid]/page.tsx` - Admin user detail (ledger, usage, purchases, adjust credits, refund)

### Brand Scraper Client
- `src/lib/brand-scraper/client.ts` - submitScrapeJob(), getScrapeJobStatus() - calls external brand scraper API
- `src/lib/brand-scraper/types.ts` - Zod schemas for scrape request, job submission, job status (including brand_json_url, assets_zip_url)
- `src/lib/brand-scraper/hooks.ts` - useJobStatus() SWR polling hook

### Auth
- `src/lib/auth/user.ts` - verifyUser() for any authenticated Firebase user
- `src/lib/auth/admin.ts` - verifyAdmin() for admin email check
- `src/lib/firebase.ts` - Firebase Admin SDK singleton (ADC on Cloud Run, cert from env locally)

### Infrastructure Config
- `cloudbuild.yaml` - 3-step build/push/deploy with substitutions and secret mounts
- `Dockerfile` - 3-stage build (deps, builder, runner)
- `firestore.indexes.json` - 3 composite indexes for billing queries
- `firestore.rules` - Deny all client-side access
- `firebase.json` - References indexes and rules files
- `scripts/seed-billing.ts` - Seed script for billing_tool_pricing collection

### UI Components
- `src/components/billing/BillingPage.tsx` - User billing page with balance card and buy button
- `src/components/tools/brand-scraper/UserBrandScraperPage.tsx` - Brand scraper with credits integration
- `src/components/admin/billing/AdminBillingPage.tsx` - Admin billing dashboard (users + pricing tabs)
- `src/components/admin/billing/AdminBillingUserDetail.tsx` - Admin user detail with adjust/refund
- `src/components/admin/brand-scraper/DownloadLinks.tsx` - GCS signed URL download buttons
- `src/components/admin/brand-scraper/BrandResultsGallery.tsx` - Results display with download links

## Open Questions

1. **Brand Scraper v1.1 Deployment Status**
   - What we know: The brand-scraper is a separate Cloud Run service. `_BRAND_SCRAPER_API_URL` substitution variable exists in cloudbuild.yaml. The client code in `src/lib/brand-scraper/client.ts` reads `BRAND_SCRAPER_API_URL` from env.
   - What's unclear: Whether the brand-scraper v1.1 service is deployed and what its Cloud Run URL is. The `_BRAND_SCRAPER_API_URL` substitution variable may be empty.
   - Recommendation: Phase 24 should treat BSINT-01/BSINT-02 as conditionally testable. If the service is not yet deployed, document those requirements as "blocked on external dependency" and test the debit/refund flow by verifying that submission returns a 503 (which triggers auto-refund). Update the URL when the service is available.

2. **Cloud Build Trigger Name**
   - What we know: The trigger exists (Phase 23-02 summary confirmed all substitution variables are set). The `cloudbuild.yaml` is at project root.
   - What's unclear: The exact trigger name needed for `gcloud builds triggers run` or `gcloud builds triggers describe` commands.
   - Recommendation: List triggers with `gcloud builds triggers list --region=us-central1` at the start of the phase.

3. **Stripe Test Mode vs Live Mode Transition**
   - What we know: Phase 24 uses Stripe test mode (sk_test_ keys). The webhook ID `we_1Sz3MfFRUqcoojOa4nyfmBan` is registered.
   - What's unclear: Whether a separate phase is planned for switching to Stripe live mode.
   - Recommendation: Not a Phase 24 concern. Document that all testing is in test mode. Live mode switch is a separate task.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `cloudbuild.yaml`, `Dockerfile`, all `src/lib/billing/` files, all `src/app/api/billing/` routes, all admin billing components
- Phase 23 verification report: `.planning/phases/23-infrastructure-configuration/23-VERIFICATION.md` -- confirmed all 9 INFRA requirements satisfied
- Phase 23 summaries: `23-01-SUMMARY.md` (artifacts), `23-02-SUMMARY.md` (infrastructure execution)
- [GCP Cloud Build: Create and manage build triggers](https://docs.google.com/build/docs/automating-builds/create-manage-triggers)
- [GCP Cloud Build: Substitution variables](https://cloud.google.com/build/docs/configuring-builds/substitute-variable-values)
- [Stripe CLI: Use the CLI](https://docs.stripe.com/stripe-cli/use-cli)
- [Stripe: Receive events in your webhook endpoint](https://docs.stripe.com/webhooks)
- [Stripe: Testing use cases](https://docs.stripe.com/testing-use-cases)

### Secondary (MEDIUM confidence)
- [GCS CORS configuration](https://docs.cloud.google.com/storage/docs/cors-configurations) -- relevant if brand scraper download URLs have CORS issues
- [Firebase Admin SDK cold start issues](https://github.com/firebase/firebase-admin-node/issues/2195) -- known issue, mitigated by min-instances=0 + warm-up request

### Tertiary (LOW confidence)
- None. All findings are backed by codebase analysis or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools are already in use; no new dependencies
- Architecture: HIGH - Deployment pipeline is fully configured; patterns are well-established
- Pitfalls: HIGH - All pitfalls identified from codebase analysis and prior phase summaries

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days -- stable deployment infrastructure)
