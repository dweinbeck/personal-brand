# Project Research Summary

**Project:** dan-weinbeck.com -- Billing/Credits System Validation & Deployment (v1.5)
**Domain:** Stripe billing + Firebase Auth deployment on GCP Cloud Run
**Researched:** 2026-02-09
**Confidence:** HIGH

## Executive Summary

Milestone v1.5 is a **configuration and deployment milestone, not a coding milestone**. The billing/credits system (~3K LOC across 30+ files) is fully implemented but uncommitted. It spans a ledger-based credits system (Firestore transactions, Stripe Checkout, webhook processing, idempotent debit/refund), Firebase Auth (Google Sign-In with `verifyUser()`/`verifyAdmin()` guards), a user-facing billing page, a brand-scraper-with-billing flow, and a full admin panel for user/credit/pricing management. All npm dependencies are already installed and current. No new packages are needed. No new code needs to be written. The work is: commit the code, configure infrastructure, deploy, and validate end-to-end.

The recommended approach is a strict sequence: (1) validate the code locally (build, lint, test), (2) configure all infrastructure (GCP Secret Manager secrets, IAM bindings, Firebase Auth domains, Firestore indexes, Stripe webhook endpoint, tool pricing seed data), (3) deploy to Cloud Run, and (4) run manual E2E smoke tests across all critical flows (signup, purchase, tool usage, failure refund, admin panel). The infrastructure dependencies form a serial chain -- Firebase Auth must work before Stripe can be tested, Stripe secrets must exist before checkout works, and tool pricing must be seeded before debit works. Skipping or misordering any step results in cryptic runtime failures.

The top risks are all infrastructure configuration errors, not code bugs: deploying Stripe test keys to production (payments appear to work but no money is collected), forgetting to register the Stripe webhook endpoint (users pay but credits are never granted), and missing IAM bindings on the Cloud Run service account for Secret Manager (service crashes on startup). Each of these has been identified with specific verification commands in the research. The existing code already handles the hard parts correctly -- the webhook has dual idempotency, the debit flow has transactional safety with auto-refund, and the admin routes use `verifyAdmin()`. The risk is purely in the deployment plumbing.

## Key Findings

### Stack Assessment

See full details: [STACK.md](STACK.md)

**No new npm dependencies needed.** Every package used by the billing code is already installed: `stripe@20.3.1`, `firebase@12.8.0`, `firebase-admin@13.6.0`, `zod@4.3.6`, `swr@2.4.0`. All are at or near latest versions.

- **GCS signed URLs require no new package:** `firebase-admin@13.6.0` bundles `@google-cloud/storage@7.18.0` as a transitive dependency. The brand scraper service generates signed URLs externally and passes them through -- the Next.js app just renders them as download links. Zero code changes needed.
- **Stripe CLI is the only new local tool:** Required for webhook testing (`stripe listen --forward-to localhost:3000/api/billing/webhook`). Install with `brew install stripe/stripe-cli/stripe`.
- **Do not upgrade Vitest to v4 during this milestone.** Major version bump adds risk with no benefit to billing validation.

### Feature Landscape

See full details: [FEATURES-billing-validation.md](FEATURES-billing-validation.md)

**Must have -- code validation (Priority 1):**
- V-1 through V-3: Build passes, lint passes, all 41 tests pass -- the first gate before anything else
- D-1 through D-8: All infrastructure prerequisites (Stripe secrets, webhook, Firebase Auth domains, Firestore indexes, security rules, tool pricing seed, service account permissions)

**Must have -- E2E smoke tests (Priority 2):**
- V-4 through V-9: Manual smoke tests covering signup (100 free credits), Stripe purchase ($5 for 500 credits), tool usage (50 credit debit), failure refund, admin panel, and insufficient-credits UX

**Must validate -- brand scraper signed URL integration (Priority 3):**
- S-1 through S-4: GCS signed URL passthrough is already fully wired; just needs end-to-end verification with a real scrape

**Defer to future milestones:**
- Customer portal, multiple credit packs, balance notifications, user usage history, automated E2E tests, rate limiting, revenue dashboard -- none are needed for launch

**Explicitly never build:**
- Subscriptions, embedded payment form, webhook retry queue, credit expiration, multi-currency, client-side balance caching, Stripe monetary refunds from admin panel

### Architecture

See full details: [ARCHITECTURE-billing-deploy.md](ARCHITECTURE-billing-deploy.md)

The architecture is fully implemented. No code files need modification. The milestone is 100% infrastructure configuration.

**Seven integration points, all requiring zero code changes:**
1. **GCP Secret Manager** -- `cloudbuild.yaml` already references `stripe-secret-key:latest` and `stripe-webhook-secret:latest` via `--set-secrets`. The secrets just need to be created and IAM granted.
2. **Firebase Auth** -- Client SDK config is already baked into Docker images via Cloud Build substitution variables. The custom domain needs to be added to Firebase Console's authorized domains list.
3. **Stripe Webhook** -- Handler at `/api/billing/webhook` is complete with raw body reading, signature verification, and dual idempotency. The endpoint just needs to be registered in Stripe Dashboard.
4. **Brand Scraper URL** -- `BRAND_SCRAPER_API_URL` is already wired in `cloudbuild.yaml`. Just needs the actual URL set in the Cloud Build trigger.
5. **GCS Signed URLs** -- Already flow from Fastify service through API proxy to download buttons. No changes needed.
6. **Firestore Indexes** -- Three composite indexes required for billing queries. Must be created before admin panel queries will work.
7. **Checkout URL derivation** -- Uses `request.url` origin, which automatically picks up the custom domain. No changes needed.

### Critical Pitfalls

See full details: [PITFALLS.md](PITFALLS.md)

1. **Stripe test keys in production (P1)** -- Keys in Secret Manager must start with `sk_live_`, not `sk_test_`. The code works identically with both, so there is no runtime error to catch the mistake. Verify with `gcloud secrets versions access latest --secret=stripe-secret-key | head -c 10`.

2. **Webhook endpoint not registered (P2)** -- The webhook is the ONLY mechanism for granting credits after purchase. There is no polling fallback. If the endpoint is not registered in Stripe Dashboard, users pay but credits are never granted. No visible error to the user.

3. **Cloud Run SA missing Secret Manager IAM (P3)** -- The `setup-cicd.sh` script grants `secretmanager.secretAccessor` to the Cloud Build SA but NOT to the Cloud Run SA. Both need it. Without it, the service either fails to deploy or starts with empty Stripe env vars.

4. **Firebase Auth domain not authorized (P4)** -- `dan-weinbeck.com` must be added to Firebase Console authorized domains. Without it, Google Sign-In fails with `auth/unauthorized-domain`, blocking all billing features.

5. **Webhook body parsing fragility (P5)** -- The current code correctly reads raw body via `request.text()`. If any future middleware reads the body first, signature verification breaks permanently. Document this constraint and never add body-reading middleware on the webhook path.

## Implications for Roadmap

Based on the strict dependency chain in the infrastructure and the serial nature of the validation flow, the research suggests **4 phases**.

### Phase 1: Code Validation & Commit

**Rationale:** The ~3K LOC billing code has never been build-checked, linted, or committed as a unit. This must happen first because all subsequent phases depend on working code. Local-only, no external dependencies.
**Delivers:** Clean build, clean lint, 41 passing tests, all billing code committed to master
**Addresses:** V-1 (build), V-2 (lint), V-3 (tests)
**Avoids:** Deploying code that does not compile (the most basic failure mode)
**Key tasks:** `npm run build`, `npm run lint`, `npm run test`, fix any issues, `git add` + `git commit` all billing/auth files
**Estimated scope:** Small. Fix lint issues (likely unused imports, missing `type` keywords), verify client/server boundaries, commit.

### Phase 2: Infrastructure Configuration

**Rationale:** All infrastructure must be configured before deployment. The dependency chain is: Stripe secrets must exist before webhook can be configured, Firebase Auth must be configured before sign-in works, Firestore indexes must exist before admin queries work, and tool pricing must be seeded before debit works. This is a serial chain of GCP/Firebase/Stripe console operations.
**Delivers:** Complete infrastructure ready for deployment -- all secrets, IAM bindings, webhook endpoint, Firebase Auth domains, Firestore indexes, and seed data in place
**Addresses:** D-1 (Stripe secrets), D-2 (webhook registration), D-3 (live vs test keys), D-4 (Firebase Auth domains), D-5 (Firestore indexes), D-6 (Firestore security rules), D-7 (tool pricing seed), D-8 (service account permissions)
**Avoids:** P1 (test keys in prod), P2 (webhook not registered), P3 (IAM missing), P4 (domain not authorized), P14 (pricing not seeded)
**Key tasks:** (1) Create Stripe secrets in Secret Manager, (2) Grant IAM to Cloud Run SA, (3) Register Stripe webhook endpoint, (4) Add custom domain to Firebase Auth authorized domains, (5) Create Firestore composite indexes, (6) Seed tool pricing data, (7) Verify Cloud Build trigger substitution variables
**Estimated scope:** Medium. All manual console/CLI operations, no code changes.

### Phase 3: Deploy & Smoke Test (Test Mode)

**Rationale:** Deploy with Stripe test keys first to validate the full flow end-to-end without real money. Test mode is identical to live mode in behavior -- it uses test cards (`4242 4242 4242 4242`) and test webhooks. This catches all integration issues before any real payment is processed.
**Delivers:** Working billing system on production Cloud Run, validated with Stripe test payments
**Addresses:** V-4 (signup flow), V-5 (purchase flow), V-6 (tool usage), V-7 (failure refund), V-8 (admin panel), V-9 (insufficient credits UX), S-1 through S-4 (signed URL integration)
**Avoids:** P7 (checkout redirect origin mismatch -- test on production domain), P10 (cold start webhook timeout -- monitor delivery), P16 (success page before credits granted -- verify timing)
**Key tasks:** (1) Deploy via Cloud Build or `scripts/deploy.sh`, (2) Test sign-in on custom domain, (3) Test full purchase flow with test card, (4) Test brand scraper debit/refund, (5) Test admin panel, (6) Verify Firestore documents, (7) Check Stripe Dashboard webhook delivery logs
**Estimated scope:** Medium. One deployment plus thorough manual testing.

### Phase 4: Go Live (Switch to Live Keys)

**Rationale:** After full validation in test mode, switch to live Stripe keys and make a real $5 purchase to verify the complete production flow. This is a small, focused phase -- just swap secret values and redeploy.
**Delivers:** Live billing system accepting real payments
**Addresses:** D-3 (live vs test keys verified)
**Avoids:** P1 (test keys in production -- the entire point of this phase)
**Key tasks:** (1) Update `stripe-secret-key` to `sk_live_*` in Secret Manager, (2) Create production webhook endpoint in Stripe Dashboard, (3) Update `stripe-webhook-secret` in Secret Manager, (4) Redeploy or restart Cloud Run, (5) Make a real $5 purchase, (6) Verify charge in Stripe live Dashboard, (7) Verify credits granted
**Estimated scope:** Small. Secret swap, redeploy, one real purchase test.

### Phase Ordering Rationale

- **Phase 1 first:** Code must compile before it can be deployed. Committing first also enables git-based rollback for subsequent phases.
- **Phase 2 before 3:** Infrastructure must exist before deployment. A deployment without secrets will crash. A deployment without Firebase Auth domains will block sign-in. A deployment without Firestore indexes will break admin queries.
- **Phase 3 before 4:** Test mode validation catches integration bugs without financial consequences. Every issue found in test mode would be worse in live mode.
- **Phase 4 last:** The only change is secret values. This is the smallest phase with the highest consequence, so it comes last when everything else is verified.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Infrastructure Configuration):** The IAM binding requirements for Cloud Run SA vs Cloud Build SA need careful verification. The `setup-cicd.sh` script does not handle Stripe secrets. A phase research spike should verify the exact `gcloud` commands needed and whether the existing SA already has project-wide `secretmanager.secretAccessor`.

**Phases with standard patterns (skip deep research):**
- **Phase 1 (Code Validation):** Standard `npm run build && npm run lint && npm run test`. Well-understood.
- **Phase 3 (Deploy & Smoke Test):** Standard Cloud Build deployment + manual testing. The deployment pipeline is already proven for the existing site.
- **Phase 4 (Go Live):** Secret swap + redeploy. Trivial.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All dependencies verified via `npm list` and `npm view` on 2026-02-09. No new packages needed. Versions current. |
| Features | HIGH | Feature landscape derived from direct analysis of all 30+ billing source files. Table stakes are infrastructure config tasks, not code features. Clear priority ordering. |
| Architecture | HIGH | All 7 integration points verified by reading `cloudbuild.yaml`, `deploy.sh`, and every billing source file. Zero code changes needed -- pure configuration. |
| Pitfalls | HIGH | 6 critical + 6 moderate + 4 minor pitfalls identified with prevention strategies and detection commands. Key finding: IAM gap in `setup-cicd.sh` confirmed by direct code reading. |

**Overall confidence:** HIGH

### Gaps to Address

1. **Cloud Build trigger substitution variables:** Whether `_NEXT_PUBLIC_FIREBASE_API_KEY`, `_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `_NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `_BRAND_SCRAPER_API_URL` are currently populated with real values cannot be verified from the codebase. If any are empty, the corresponding features will fail silently at runtime. Verify in GCP Console during Phase 2.

2. **Brand scraper service-to-service auth:** The brand scraper client uses plain `fetch()` without an Authorization header. If the brand scraper Cloud Run service requires IAM auth (not `--allow-unauthenticated`), a minor code change is needed in `client.ts` to add an ID token header. Determine during Phase 2 based on the brand scraper's deployment configuration.

3. **Signed URL TTL:** Assumed 1 hour based on project context. If the brand scraper uses a shorter TTL, download links could expire before users click them. Confirm during Phase 3 smoke testing. Acceptable risk for MVP either way.

4. **Existing SA secret access:** The Cloud Run SA may already have project-wide `secretmanager.secretAccessor` from the existing `github-token` and `todoist-api-token` setup. Verify with `gcloud secrets get-iam-policy stripe-secret-key` during Phase 2 before adding redundant bindings.

## Sources

### Primary (HIGH confidence -- direct codebase analysis)
- All 30+ billing source files in `src/lib/billing/`, `src/lib/auth/`, `src/app/api/billing/`, `src/app/api/tools/`, `src/app/api/admin/billing/`, `src/components/billing/`, `src/components/tools/`, `src/components/auth/`
- `cloudbuild.yaml` -- Stripe secrets wiring (line 39), env vars (line 38), min-instances (line 35)
- `scripts/deploy.sh` -- Service account setup, IAM roles
- `scripts/setup-cicd.sh` -- Secret Manager IAM bindings (Cloud Build SA only, NOT Cloud Run SA)
- `firebase.json` -- No index configuration present
- `firestore.rules` -- Deny-all rules confirmed
- `.env.local.example` -- All required env vars documented
- `docs/DEPLOYMENT.md` -- Stripe setup steps documented
- Package versions verified via `npm list` and `npm view` on 2026-02-09

### Secondary (MEDIUM confidence -- training data, well-established patterns)
- Stripe test/live mode key architecture and webhook retry behavior
- GCP Secret Manager IAM model and Cloud Run `--set-secrets` requirements
- Firebase Auth authorized domain configuration
- GCS signed URL expiry behavior
- Firestore composite index requirements and transaction retry behavior
- Cloud Run cold start behavior with `min-instances=0`

---
*Research completed: 2026-02-09*
*Ready for roadmap: yes*
