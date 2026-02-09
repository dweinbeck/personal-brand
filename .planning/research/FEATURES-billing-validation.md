# Feature Landscape: Billing/Credits Validation & Deployment

**Domain:** Credits-based billing system for developer tools (validation, deployment, brand-scraper v1.1 integration)
**Researched:** 2026-02-09
**Overall confidence:** HIGH (codebase fully read; established Stripe + Firebase patterns; GCS signed URLs are well-documented)

---

## Current State Summary

The billing/credits system is fully built (~3K LOC, uncommitted) but has never been validated end-to-end or deployed to production. The code includes:

- **16 source files** spanning lib/, API routes, and UI components
- **41 test cases** covering Zod schemas, economics invariants, and edge cases (all unit tests -- no integration tests)
- **7 Firestore collections** for billing state
- **2 Stripe secrets** (already in Secret Manager, already wired in `cloudbuild.yaml`)
- **1 Stripe webhook endpoint** at `/api/billing/webhook`
- **Full admin panel** at `/control-center/billing` with user management, credit adjustment, refund, and pricing controls

The brand-scraper v1.1 integration is partially complete: the `JobStatus` type already defines `brand_json_url` and `assets_zip_url` optional fields, and the `DownloadLinks` component and `BrandResultsGallery` already render download buttons when these URLs are present. The GCS signed URLs will come from the external Fastify brand-scraper service -- they just need to flow through correctly.

**What remains:** Validation that all pieces work together (build, lint, E2E flows), deployment configuration for Stripe secrets, Firebase Auth domain configuration for production, and manual smoke testing of the critical purchase-to-usage flow.

---

## Category 1: Table Stakes for VALIDATING Existing Code

Features that verify the ~3K LOC works correctly before shipping. Missing any of these risks deploying broken code.

### V-1: Build Passes with All New Files

| Aspect | Detail |
|--------|--------|
| **Feature** | All 16 billing/auth files compile without TypeScript errors |
| **Why Expected** | Code has been written but never committed or build-checked as a unit; Next.js App Router is strict about server/client boundaries |
| **Complexity** | Low |
| **Dependencies** | None -- this is the first gate |
| **Notes** | Key risk: `"use client"` boundaries. `BillingPage`, `AdminBillingPage`, `AdminBillingUserDetail`, `AuthGuard`, `AuthButton`, `UserBrandScraperPage` are client components. API routes are server-only. Ensure no server imports leak into client bundles. |

### V-2: Lint Passes (Biome v2.3)

| Aspect | Detail |
|--------|--------|
| **Feature** | All new files pass `npm run lint` with zero errors |
| **Why Expected** | Project uses Biome v2.3 (not ESLint); all existing committed code is lint-clean |
| **Complexity** | Low |
| **Dependencies** | V-1 (build must pass first or lint results are misleading) |
| **Notes** | Likely issues: unused imports from incremental development, missing `type` keyword on type-only imports (Biome enforces this). |

### V-3: Existing 41 Tests Pass

| Aspect | Detail |
|--------|--------|
| **Feature** | `npm run test` passes all 41 existing test cases in `src/lib/billing/__tests__/` |
| **Why Expected** | Tests cover Zod schema validation, credit pack economics (1 credit = 1 cent invariant), tool pricing seed correctness, idempotency key format |
| **Complexity** | Low |
| **Dependencies** | V-1 |
| **Notes** | Tests are pure unit tests -- no Firebase/Stripe mocking. They test schemas and constants, not Firestore operations. They should pass without any external services. |

### V-4: Manual E2E Smoke Test -- Signup Flow

| Aspect | Detail |
|--------|--------|
| **Feature** | New user signs in with Google -> gets 100 free credits -> sees balance on `/billing` page |
| **Why Expected** | This is the first-user experience. If `ensureBillingUser()` fails, every subsequent feature is broken. |
| **Complexity** | Low (manual test, not automated) |
| **Dependencies** | V-1, working Firebase Auth with Google provider, Firestore access |
| **Notes** | Exercises: `AuthGuard` -> `AuthButton` sign-in popup -> `GET /api/billing/me` -> `ensureBillingUser()` -> Firestore transaction (create user + signup_grant ledger entry). Check Firestore console to verify `billing_users/{uid}` and `billing_users/{uid}/ledger/{id}` documents exist with correct shapes. |

### V-5: Manual E2E Smoke Test -- Stripe Purchase Flow

| Aspect | Detail |
|--------|--------|
| **Feature** | User clicks "Buy 500 Credits ($5)" -> redirected to Stripe Checkout -> completes payment -> credits added to balance |
| **Why Expected** | This is the monetization path. Stripe Checkout + webhook is the most failure-prone integration (signature verification, metadata passing, idempotent credit application). |
| **Complexity** | Medium (requires Stripe test mode + webhook forwarding) |
| **Dependencies** | V-4 (user must exist first), Stripe test API keys, `stripe listen --forward-to localhost:3000/api/billing/webhook` (Stripe CLI) |
| **Notes** | Critical path: `POST /api/billing/checkout` -> Stripe Checkout session (with uid/email/credits in metadata) -> `checkout.session.completed` webhook -> `applyPurchaseFromStripe()` -> Firestore transaction (update balance + create purchase + create ledger entry + store event for idempotency). Verify: balance increases by 500, `billing_purchases/{sessionId}` exists, `billing_stripe_events/{eventId}` exists, ledger shows "purchase" entry. |

### V-6: Manual E2E Smoke Test -- Tool Usage Flow (Brand Scraper)

| Aspect | Detail |
|--------|--------|
| **Feature** | User submits URL in brand scraper -> 50 credits deducted -> job completes -> results displayed |
| **Why Expected** | This is the primary revenue-generating interaction. Debit + idempotency + external service call + status polling is the most complex transaction chain. |
| **Complexity** | Medium (requires brand-scraper service running or mocked) |
| **Dependencies** | V-5 (user needs credits), brand-scraper Fastify service accessible at `BRAND_SCRAPER_API_URL` |
| **Notes** | Critical path: form submit -> `POST /api/tools/brand-scraper/scrape` -> `debitForToolUse()` (Firestore transaction with idempotency check + balance check + pricing lookup + debit + usage record + idempotency record) -> `submitScrapeJob()` (HTTP to Fastify) -> `markUsageSucceeded()`. If Fastify call fails: `refundUsage()` auto-refunds credits. Verify: balance decreases by 50, `billing_tool_usage/{id}` shows status "succeeded", ledger shows "debit" entry with toolKey "brand_scraper". |

### V-7: Manual E2E Smoke Test -- Failure Refund

| Aspect | Detail |
|--------|--------|
| **Feature** | When brand-scraper job fails, credits are automatically refunded |
| **Why Expected** | Users paying for a service that fails must get their money back. This is trust-critical. |
| **Complexity** | Medium (need to trigger a failure -- submit invalid URL or unreachable domain) |
| **Dependencies** | V-6 |
| **Notes** | Two refund paths exist: (1) `submitScrapeJob()` throws -> immediate refund in the scrape route handler, (2) polling detects `status: "failed"` -> `refundUsage()` in the jobs/[id] route handler. Both should be tested. Verify: balance restored, usage status changes to "refunded", ledger shows "refund" entry. |

### V-8: Manual E2E Smoke Test -- Admin Panel

| Aspect | Detail |
|--------|--------|
| **Feature** | Admin navigates to `/control-center/billing` -> sees user list -> clicks user -> sees detail with ledger/usage/purchases -> can adjust credits and refund usage |
| **Why Expected** | Admin must be able to manage users and resolve billing disputes. This is the operations backbone. |
| **Complexity** | Low (manual walkthrough) |
| **Dependencies** | V-4, V-5, V-6 (need at least one user with activity) |
| **Notes** | Exercises: `GET /api/admin/billing/users` (list), `GET /api/admin/billing/users/{uid}` (detail), `POST /api/admin/billing/users/{uid}/adjust` (credit adjustment), `POST /api/admin/billing/usage/{usageId}/refund` (manual refund), `GET /api/admin/billing/pricing` + `POST /api/admin/billing/pricing` (pricing management). All admin routes use `verifyAdmin()` which checks email === "daniel.weinbeck@gmail.com". |

### V-9: Manual E2E Smoke Test -- Insufficient Credits UX

| Aspect | Detail |
|--------|--------|
| **Feature** | User with 0 credits sees "Insufficient credits" warning + disabled scrape button + link to buy credits |
| **Why Expected** | The 402 Payment Required error path must be handled gracefully. Users should never see a raw error. |
| **Complexity** | Low |
| **Dependencies** | V-4 (need a user whose credits have been spent) |
| **Notes** | `UserBrandScraperPage` already has this UI: checks `hasEnough` (balance >= creditCost) and shows amber warning box with link to `/billing`. The scrape button is disabled. Also verify that `POST /api/tools/brand-scraper/scrape` returns 402 with `{ error: "Insufficient credits." }` if called directly. |

---

## Category 2: Table Stakes for DEPLOYING to Production

Configuration and infrastructure that must be correct for billing to work in the Cloud Run production environment.

### D-1: Stripe Secrets in GCP Secret Manager

| Aspect | Detail |
|--------|--------|
| **Feature** | `stripe-secret-key` and `stripe-webhook-secret` secrets exist in Secret Manager and are accessible to the Cloud Run service account |
| **Why Expected** | Without these, Stripe Checkout and webhook verification will throw `STRIPE_SECRET_KEY environment variable is not set` / `STRIPE_WEBHOOK_SECRET environment variable is not set` |
| **Complexity** | Low |
| **Dependencies** | GCP project access |
| **Notes** | Already wired in `cloudbuild.yaml` line 39: `--set-secrets=...STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest`. The `DEPLOYMENT.md` already documents the `gcloud secrets create` commands. Need to also grant `roles/secretmanager.secretAccessor` to the Cloud Run service account (`cloudrun-site@PROJECT.iam.gserviceaccount.com`), not just the Cloud Build service account. |

### D-2: Stripe Webhook Endpoint Registration

| Aspect | Detail |
|--------|--------|
| **Feature** | Stripe webhook configured to send `checkout.session.completed` events to `https://dan-weinbeck.com/api/billing/webhook` |
| **Why Expected** | Without this, purchases complete on Stripe's side but credits are never applied |
| **Complexity** | Low (Stripe dashboard config) |
| **Dependencies** | D-1 (need webhook signing secret from the endpoint) |
| **Notes** | Steps: Stripe Dashboard -> Webhooks -> Add endpoint -> URL: `https://dan-weinbeck.com/api/billing/webhook` -> Events: `checkout.session.completed` -> Copy signing secret -> Update `stripe-webhook-secret` in Secret Manager. Must use the LIVE webhook secret, not the test one. |

### D-3: Stripe Live vs Test Mode Keys

| Aspect | Detail |
|--------|--------|
| **Feature** | Production deployment uses Stripe LIVE keys (sk_live_...), development uses test keys (sk_test_...) |
| **Why Expected** | Mixing modes causes cryptic failures: test checkout sessions won't trigger live webhooks and vice versa |
| **Complexity** | Low |
| **Dependencies** | D-1 |
| **Notes** | Current `.env.local.example` shows `sk_test_...` which is correct for local dev. Secret Manager must have the `sk_live_...` key. Verify by checking the first few characters of the secret: `gcloud secrets versions access latest --secret=stripe-secret-key | head -c 10`. Should start with `sk_live_` for production. |

### D-4: Firebase Auth Authorized Domains

| Aspect | Detail |
|--------|--------|
| **Feature** | `dan-weinbeck.com` and `*.run.app` are listed as authorized domains in Firebase Auth settings |
| **Why Expected** | Google Sign-In popup will fail with "auth/unauthorized-domain" if the domain is not authorized in Firebase Console |
| **Complexity** | Low (Firebase console config) |
| **Dependencies** | Firebase project access |
| **Notes** | Firebase Console -> Authentication -> Settings -> Authorized domains. Must include: `dan-weinbeck.com`, `localhost` (for dev), and the Cloud Run `.run.app` domain. The `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` env var must match what is configured. |

### D-5: Firestore Indexes for Billing Queries

| Aspect | Detail |
|--------|--------|
| **Feature** | Composite indexes exist for billing queries that use `where()` + `orderBy()` |
| **Why Expected** | Firestore requires composite indexes for queries with inequality filters or multiple orderBy clauses. Without them, queries throw `FAILED_PRECONDITION` errors. |
| **Complexity** | Low-Medium (Firestore will tell you exactly what index to create via error message link) |
| **Dependencies** | Firestore access |
| **Notes** | Queries that likely need indexes: `toolUsageCol().where("uid", "==", uid).orderBy("createdAt", "desc")` in `getUserUsage()`, `purchasesCol().where("uid", "==", uid).orderBy("createdAt", "desc")` in `getUserPurchases()`, `toolUsageCol().where("uid", "==", uid).where("externalJobId", "==", id)` in `findUsageByExternalJobId()`. Strategy: run each query once, note the index-creation links in the error messages, create them. Or proactively define in `firestore.indexes.json`. |

### D-6: Firestore Security Rules for Billing Collections

| Aspect | Detail |
|--------|--------|
| **Feature** | Billing collections are server-only (no direct client read/write) -- security rules should deny all client access |
| **Why Expected** | All billing operations go through API routes that use Firebase Admin SDK (which bypasses security rules). But if security rules allow client reads, a malicious user could read other users' billing data. |
| **Complexity** | Low |
| **Dependencies** | Firestore access |
| **Notes** | Recommended rules: deny all reads/writes on `billing_users`, `billing_tool_pricing`, `billing_tool_usage`, `billing_purchases`, `billing_stripe_events`, `billing_idempotency`. The Admin SDK bypasses rules, so server-side operations are unaffected. If no custom rules exist (default deny), this is already handled. |

### D-7: Tool Pricing Seed Data in Firestore

| Aspect | Detail |
|--------|--------|
| **Feature** | `billing_tool_pricing` collection has the 4 tool documents (brand_scraper active, others inactive) |
| **Why Expected** | Without pricing docs, `debitForToolUse()` throws `Unknown tool: brand_scraper`. The seed function exists in `src/lib/billing/tools.ts` but is never called automatically. |
| **Complexity** | Low |
| **Dependencies** | Firestore access |
| **Notes** | Options: (1) call `seedToolPricing()` once manually (add a temporary admin API route or run from Firebase Functions shell), (2) add it to application startup (risky -- runs on every cold start), (3) manually create docs in Firestore console using the TOOL_PRICING_SEED values. Option 3 is most reliable for a one-time operation. Alternatively, have the first admin pricing panel visit trigger seeding. |

### D-8: Cloud Run Service Account Permissions

| Aspect | Detail |
|--------|--------|
| **Feature** | The `cloudrun-site` service account has `roles/datastore.user` (for Firestore) and `roles/secretmanager.secretAccessor` (for Stripe secrets) |
| **Why Expected** | Without `datastore.user`, all Firestore operations fail. Without `secretmanager.secretAccessor`, Stripe keys cannot be read at runtime. |
| **Complexity** | Low |
| **Dependencies** | GCP IAM access |
| **Notes** | The deploy script already grants `roles/datastore.user`. But `roles/secretmanager.secretAccessor` must also be granted to the Cloud Run service account (not just Cloud Build). The `cloudbuild.yaml` uses `--set-secrets` which requires the runtime service account to have secret access. Verify: `gcloud projects get-iam-policy PROJECT_ID --filter="bindings.members:cloudrun-site"`. |

---

## Category 3: Table Stakes for Brand-Scraper v1.1 Integration (Signed URLs)

Features needed to serve GCS signed URLs for brand data downloads.

### S-1: Signed URL Passthrough from Fastify Service

| Aspect | Detail |
|--------|--------|
| **Feature** | `brand_json_url` and `assets_zip_url` fields flow from Fastify -> Next.js API route -> frontend poll response -> download buttons |
| **Why Expected** | The brand-scraper Fastify service generates GCS signed URLs. The Next.js app just passes them through. |
| **Complexity** | Low (already wired) |
| **Dependencies** | Brand-scraper Fastify service must return these fields in job status response |
| **Notes** | Already implemented: `jobStatusSchema` defines `brand_json_url: z.string().optional()` and `assets_zip_url: z.string().optional()`. The `GET /api/tools/brand-scraper/jobs/[id]` route passes through the full job response via `Response.json({ ...job, usageId })`. `UserBrandScraperPage` passes these to `BrandResultsGallery`. `BrandResultsGallery` passes them to `DownloadLinks`. `DownloadLinks` renders `<Button>` links with `download` attribute. **This is already fully wired.** Validation: just needs an E2E test with a real scrape that produces GCS URLs. |

### S-2: Signed URL Expiration Handling

| Aspect | Detail |
|--------|--------|
| **Feature** | User must be able to download files before the signed URL expires. If expired, the UI should not show broken links. |
| **Why Expected** | GCS signed URLs have a finite TTL (commonly 15 minutes to 7 days). If a user leaves the results page open and comes back later, the download links may 404. |
| **Complexity** | Low (for MVP: do nothing special; Medium for a better UX) |
| **Dependencies** | S-1, knowledge of the Fastify service's signed URL TTL |
| **Notes** | **MVP approach (recommended for this milestone):** Do nothing special. GCS signed URLs from the Fastify service likely have a generous TTL (1-7 days). The user sees results immediately after scrape completes and can download right away. If the URL expires, the download simply fails with a GCS error -- this is acceptable for v1.1. **Better approach (defer):** Store the GCS object path in Firestore alongside the signed URL, and have a "regenerate download link" button that requests a fresh signed URL. This adds complexity (new API route, GCS credentials in Next.js) and is not needed for MVP. |

### S-3: Download Button UX for Large Files

| Aspect | Detail |
|--------|--------|
| **Feature** | Download buttons clearly indicate what the user is downloading (JSON vs ZIP), file type, and ideally file size |
| **Why Expected** | Users downloading ZIP archives of brand assets should know what they are getting. Unexpected large downloads frustrate users. |
| **Complexity** | Low (labels already exist) |
| **Dependencies** | S-1 |
| **Notes** | Already implemented: `DownloadLinks` renders two buttons -- "Download Brand Data (JSON)" and "Download Assets (ZIP)". The `download` attribute suggests filenames (`brand.json`, `assets.zip`). This is sufficient for v1.1. File size display would require a HEAD request to the signed URL, which adds complexity for marginal value. Defer. |

### S-4: Signed URL Security -- No Auth Bypass

| Aspect | Detail |
|--------|--------|
| **Feature** | GCS signed URLs do not bypass the billing/auth model -- they are only accessible to users who paid for the scrape |
| **Why Expected** | If signed URLs are guessable or shared, users could access results without paying |
| **Complexity** | Already handled (by GCS signed URLs themselves) |
| **Dependencies** | Fastify service generates URLs with proper expiration |
| **Notes** | GCS signed URLs are inherently secure: they encode the object path, expiration, and a cryptographic signature. They cannot be guessed. They can be shared (anyone with the URL can download), but this is acceptable for this use case -- the URLs expire, and the data is the user's own brand analysis. No action needed beyond what the Fastify service already provides. |

---

## Category 4: Differentiators (Nice-to-Have Improvements)

Features that would improve the billing system but are NOT required for this validation/deployment milestone. Explicitly deferred.

### DIFF-1: Stripe Customer Portal for Self-Service

| Aspect | Detail |
|--------|--------|
| **Feature** | Users can view purchase history and manage payment methods via Stripe's hosted Customer Portal |
| **Why Expected** | Not expected for MVP. One credit pack ($5) with no subscriptions means there is nothing to "manage." |
| **Complexity** | Low (Stripe provides hosted UI) |
| **Defer reason** | Single credit pack, no subscriptions, no recurring billing. Admin can handle disputes manually. |

### DIFF-2: Multiple Credit Pack Tiers

| Aspect | Detail |
|--------|--------|
| **Feature** | Offer multiple packs (e.g., 100 for $1, 500 for $5, 2000 for $15 with volume discount) |
| **Why Expected** | Common in credit-based systems. Not needed for launch with one tool at 50 credits/use. |
| **Complexity** | Low (add entries to `CREDIT_PACKS`, update `creditPackSchema` from `z.literal("500")` to `z.enum(["100", "500", "2000"])`, add pack selector UI) |
| **Defer reason** | Premature optimization. Need real usage data to determine if users want smaller/larger packs. |

### DIFF-3: Balance Warning Notifications

| Aspect | Detail |
|--------|--------|
| **Feature** | Notify user when balance drops below a threshold (e.g., "You have enough for 1 more scrape") |
| **Why Expected** | Nice for retention. Not critical. |
| **Complexity** | Low (add threshold check after debit, show toast or banner) |
| **Defer reason** | The brand scraper page already shows balance and cost. Users can see when they are running low. |

### DIFF-4: Usage History Page for Users

| Aspect | Detail |
|--------|--------|
| **Feature** | User-facing page showing their transaction history, past scrapes, and download links |
| **Why Expected** | Users may want to re-download past results. Currently only admin can see usage history. |
| **Complexity** | Medium (new page, new API route `GET /api/billing/history`, re-download requires stored GCS paths) |
| **Defer reason** | Significant scope increase. The admin panel already serves this function for the single-admin use case. |

### DIFF-5: Automated E2E Tests with Stripe Test Mode

| Aspect | Detail |
|--------|--------|
| **Feature** | Playwright/Cypress tests that automate the full purchase + usage flow using Stripe test cards |
| **Why Expected** | Would prevent regressions. Not required for initial deployment. |
| **Complexity** | High (requires Stripe CLI webhook forwarding, test account seeding, Firebase Auth emulator or test tokens) |
| **Defer reason** | Manual E2E testing is sufficient for initial deployment of a single-user billing system. Automate after patterns stabilize. |

### DIFF-6: Rate Limiting on Billing API Routes

| Aspect | Detail |
|--------|--------|
| **Feature** | Rate limit `POST /api/billing/checkout` and `POST /api/tools/brand-scraper/scrape` to prevent abuse |
| **Why Expected** | Good practice, but the site already requires Firebase Auth (Google Sign-In), which provides natural rate limiting. |
| **Complexity** | Low (in-memory Map pattern already exists in `src/lib/actions/contact.ts` -- can be reused) |
| **Defer reason** | Auth requirement + idempotency keys + Stripe's own fraud detection provide sufficient protection for a low-traffic site. |

### DIFF-7: Revenue Dashboard / Analytics

| Aspect | Detail |
|--------|--------|
| **Feature** | Admin dashboard showing total revenue, costs, margins, usage trends over time |
| **Why Expected** | Useful for business decisions. The admin user detail page already shows per-user margins. |
| **Complexity** | Medium (aggregate queries, charting library) |
| **Defer reason** | With expected low volume at launch, Firestore console + the existing per-user margin display is sufficient. |

---

## Category 5: Anti-Features (Things to Deliberately NOT Build)

Features to explicitly avoid in this milestone. Building these would add complexity without value.

### AF-1: Subscription / Recurring Billing

| Anti-Feature | Subscription plans (monthly credits, auto-renewal) |
|--------------|-----------------------------------------------------|
| **Why Avoid** | The system is intentionally pre-paid credits. Subscriptions add massive complexity: proration, dunning, plan upgrades/downgrades, Stripe subscription lifecycle events. The user base is expected to be small and intermittent. |
| **What to Do Instead** | Keep the one-time purchase model. If demand justifies it later, add more credit packs. |

### AF-2: Custom Stripe Payment Page (Embedded)

| Anti-Feature | Building a custom payment form with Stripe Elements instead of Stripe Checkout |
|--------------|---------------------------------------------------------------------------------|
| **Why Avoid** | Stripe Checkout is PCI-compliant out of the box, handles 3D Secure, supports Apple/Google Pay, and requires zero custom UI. Embedded payment forms require PCI SAQ A-EP compliance, custom error handling, and significantly more code. |
| **What to Do Instead** | Continue using `stripe.checkout.sessions.create()` with redirect. It works. |

### AF-3: Webhook Retry Queue / Dead Letter Queue

| Anti-Feature | Building a custom retry mechanism for failed webhook processing |
|--------------|----------------------------------------------------------------|
| **Why Avoid** | Stripe already retries webhooks automatically (up to 3 days with exponential backoff). The webhook handler is idempotent (checks `billing_stripe_events` before processing). If a webhook fails, Stripe will retry. |
| **What to Do Instead** | Rely on Stripe's built-in retry mechanism. Monitor webhook delivery in Stripe Dashboard. |

### AF-4: Credit Expiration / Time-Based Credits

| Anti-Feature | Credits that expire after a certain period |
|--------------|---------------------------------------------|
| **Why Avoid** | Adds significant complexity (scheduled jobs to check expiration, user notifications, partial-use edge cases). Creates user frustration. No business justification for a small-scale tool platform. |
| **What to Do Instead** | Credits never expire. Simple, user-friendly. |

### AF-5: Multi-Currency Support

| Anti-Feature | Supporting currencies other than USD |
|--------------|---------------------------------------|
| **Why Avoid** | The 1 credit = 1 cent model is USD-native. Multi-currency requires exchange rate management, Stripe currency configuration per customer, and UI localization. The user base does not justify this complexity. |
| **What to Do Instead** | USD only. Stripe Checkout handles international cards natively. |

### AF-6: Client-Side Balance Caching / Optimistic Updates Beyond Current Scope

| Anti-Feature | Building a sophisticated client-side balance cache with offline support |
|--------------|-------------------------------------------------------------------------|
| **Why Avoid** | The current approach (fetch balance on page load, update after debit response) is correct and simple. Over-engineering client caching risks showing stale balances, which in a billing context is worse than a brief loading state. |
| **What to Do Instead** | Keep the current `useCallback`/`useEffect` fetch pattern. Balance is always fresh from server. |

### AF-7: Refund to Stripe (Monetary Refund)

| Anti-Feature | Issuing Stripe refunds (actual money back to card) from the admin panel |
|--------------|-------------------------------------------------------------------------|
| **Why Avoid** | The current system refunds credits, not money. Stripe monetary refunds require additional API calls, a different mental model (partial vs full), and have different compliance requirements. At $5 per purchase with tiny volumes, handle monetary refunds manually via Stripe Dashboard if ever needed. |
| **What to Do Instead** | Admin can add credits back via the "Adjust Credits" feature. Monetary refunds (rare) happen directly in Stripe Dashboard. |

---

## Feature Dependencies

```
[Firebase Auth Config] ──> [Auth works in production]
        │
        v
[Stripe Secrets in SM] ──> [Checkout works] ──> [Webhook works] ──> [Credits applied]
        │
        v
[Tool Pricing Seed] ──> [Debit works] ──> [Brand Scraper charges credits]
        │
        v
[Firestore Indexes] ──> [Admin queries work] ──> [Admin panel functional]
        │
        v
[Brand-scraper Fastify returns signed URLs] ──> [Downloads work]
```

Key insight: The dependency chain is strictly serial for the purchase flow but has parallel paths for admin features and download functionality. The critical path is:

1. Firebase Auth config (D-4)
2. Stripe secrets (D-1) + webhook (D-2)
3. Tool pricing seed (D-7)
4. Firestore indexes (D-5)

All four must be done before any E2E smoke testing is possible.

---

## MVP Recommendation (This Milestone)

**Priority 1 -- Must complete (validation gates):**
1. V-1: Build passes
2. V-2: Lint passes
3. V-3: Tests pass
4. D-1 through D-8: All deployment prerequisites

**Priority 2 -- Must complete (E2E smoke tests):**
5. V-4: Signup flow
6. V-5: Purchase flow (Stripe test mode first, then verify production config)
7. V-6: Tool usage flow
8. V-7: Failure refund
9. V-8: Admin panel walkthrough
10. V-9: Insufficient credits UX

**Priority 3 -- Must validate (signed URL integration):**
11. S-1: Signed URL passthrough (already wired -- just needs verification)
12. S-2: Acknowledge expiration limitation, document for users if needed
13. S-3: Download UX (already implemented)
14. S-4: Security (already handled by GCS)

**Defer to future milestones:**
- All DIFF items (1-7)
- All AF items (1-7) -- explicitly never build most of these

---

## Complexity Summary

| ID | Feature | Complexity | Status |
|----|---------|------------|--------|
| V-1 | Build passes | Low | Not yet verified |
| V-2 | Lint passes | Low | Not yet verified |
| V-3 | Tests pass | Low | Not yet verified |
| V-4 | Signup E2E | Low | Manual test needed |
| V-5 | Purchase E2E | Medium | Manual test needed (Stripe CLI) |
| V-6 | Tool usage E2E | Medium | Manual test needed |
| V-7 | Failure refund E2E | Medium | Manual test needed |
| V-8 | Admin panel E2E | Low | Manual test needed |
| V-9 | Insufficient credits UX | Low | Manual test needed |
| D-1 | Stripe secrets | Low | Config task |
| D-2 | Webhook registration | Low | Config task |
| D-3 | Live vs test keys | Low | Verification task |
| D-4 | Firebase Auth domains | Low | Config task |
| D-5 | Firestore indexes | Low-Med | May need to discover via errors |
| D-6 | Firestore security rules | Low | Config task |
| D-7 | Tool pricing seed | Low | One-time data task |
| D-8 | Service account permissions | Low | Config task |
| S-1 | Signed URL passthrough | Low | Already wired, needs verification |
| S-2 | Expiration handling | Low | Accept limitation for v1.1 |
| S-3 | Download UX | Low | Already implemented |
| S-4 | Signed URL security | N/A | Already handled by GCS |

**Total new code needed:** Minimal. The feature code is written. This milestone is primarily about validation, configuration, and deployment.

---

## Sources

- Direct codebase analysis of all 16 billing-related files (HIGH confidence)
- `cloudbuild.yaml` and `scripts/deploy.sh` for deployment configuration (HIGH confidence)
- `.env.local.example` and `docs/DEPLOYMENT.md` for environment variable documentation (HIGH confidence)
- Stripe Checkout and webhook patterns based on current Stripe documentation patterns (MEDIUM confidence -- training data, not freshly verified against latest Stripe docs)
- GCS signed URL behavior based on established GCP documentation patterns (MEDIUM confidence -- training data)
- Firestore composite index requirements based on established Firebase documentation (HIGH confidence -- this behavior is stable and well-documented)
