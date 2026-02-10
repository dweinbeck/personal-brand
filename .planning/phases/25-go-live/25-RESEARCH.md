# Phase 25: Go Live - Research

**Researched:** 2026-02-09
**Domain:** Stripe live mode activation, GCP Secret Manager versioning, Cloud Run secret resolution
**Confidence:** HIGH

## Summary

Phase 25 is the simplest phase in the project: switch two secrets in GCP Secret Manager from Stripe test-mode values to live-mode values, register a live-mode webhook endpoint in the Stripe Dashboard, and trigger a redeployment. There are zero code changes required.

The research confirmed that the existing codebase is architecturally ideal for this switch. The project uses inline `price_data` in Checkout sessions (not pre-created Stripe Products/Prices), so there are no Stripe objects to recreate in live mode. No Stripe publishable key (`pk_live_*`) is used anywhere -- the entire integration is server-side via `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. The webhook handler at `/api/billing/webhook` reads the signing secret from `process.env` on every request, so it will work immediately with the new live secret after redeployment.

The critical finding is about Cloud Run secret resolution: secrets mounted as environment variables via `--set-secrets` with `:latest` resolve at **instance startup time**, not continuously at runtime. Since the `cloudbuild.yaml` uses `:latest` for all secrets, updating Secret Manager values and triggering a new Cloud Build deployment will cause the new revision to pick up the live keys. No code changes, no config file edits -- just secret updates + redeploy.

**Primary recommendation:** Update two secrets in GCP Secret Manager, register a live webhook in Stripe Dashboard, trigger a Cloud Build deployment, then verify with a real $5 purchase.

## Standard Stack

This phase uses no new libraries or tools. All operations use existing infrastructure.

### Core
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `gcloud` CLI | Update Secret Manager secret versions | Already used in Phase 23 for initial secret creation |
| Stripe Dashboard | Register live-mode webhook endpoint, copy signing secret | Official Stripe interface; live webhook creation is a one-time operation |
| Cloud Build | Deploy new revision that picks up live secrets | Already configured with `deploy-on-push` trigger |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Browser | Real $5 purchase verification | Manual E2E test of the live payment flow |
| Stripe Dashboard (live mode) | Verify payment receipt, webhook delivery | Post-purchase verification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Dashboard for webhook | Stripe API (`POST /v1/webhook_endpoints`) | API returns signing secret in response (convenient), but Dashboard is simpler for one-time setup and allows visual confirmation of live mode |
| Cloud Build trigger | Manual `gcloud run deploy` | Manual deploy bypasses the CI pipeline; use Cloud Build for consistency |

## Architecture Patterns

### The Switch: What Actually Changes

```
BEFORE (test mode):
  Secret Manager: stripe-secret-key     = sk_test_...
  Secret Manager: stripe-webhook-secret  = whsec_... (test endpoint)
  Stripe Dashboard: test-mode webhook endpoint → dan-weinbeck.com/api/billing/webhook

AFTER (live mode):
  Secret Manager: stripe-secret-key     = sk_live_...   (new version)
  Secret Manager: stripe-webhook-secret  = whsec_... (live endpoint, new version)
  Stripe Dashboard: live-mode webhook endpoint → dan-weinbeck.com/api/billing/webhook
  Cloud Run: new revision deployed (picks up new secret versions)
```

### What Does NOT Change

- **No code changes.** Zero files modified.
- **No config file changes.** `cloudbuild.yaml` already uses `:latest` for all secrets.
- **No Stripe objects to recreate.** The project uses inline `price_data` (not pre-created Products/Prices).
- **No publishable key.** No `NEXT_PUBLIC_STRIPE_*` or `pk_live_*` anywhere in the codebase.
- **No webhook URL change.** Same URL (`https://dan-weinbeck.com/api/billing/webhook`) for both test and live.
- **No Firestore changes.** Billing data structure is identical for test and live payments.

### Pattern: Secret Version Update + Redeployment

**What:** Add new secret versions to existing secrets in Secret Manager, then deploy a new Cloud Run revision.
**Why:** Cloud Run resolves environment variable secrets at instance startup time (not continuously). A new revision/instance is needed to pick up the new values.
**Critical detail:** The `cloudbuild.yaml` uses `--set-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest`. The `:latest` alias resolves to the newest version at deploy time.

### Pattern: Live Webhook is Separate from Test Webhook

**What:** Stripe maintains separate webhook endpoint configurations for test mode and live mode. The same URL can be used, but each has a different signing secret.
**Why:** Test-mode events and live-mode events are different Stripe objects. The signing secret ensures the webhook handler verifies events from the correct mode.
**Implication:** You must register a NEW live-mode webhook endpoint in the Stripe Dashboard (even if the URL is the same as the test endpoint). This produces a new `whsec_*` signing secret that must be stored in Secret Manager.

### Execution Order (Dependency Chain)

```
1. Verify Stripe account is activated (prerequisite)
      |
2. Get live secret key from Stripe Dashboard (sk_live_*)
      |
3. Register live webhook endpoint in Stripe Dashboard
   → Returns new whsec_* signing secret
      |
4. Update Secret Manager: stripe-secret-key (new version with sk_live_*)
   Update Secret Manager: stripe-webhook-secret (new version with live whsec_*)
      |
5. Trigger Cloud Build deployment (git push or manual trigger)
   → New revision picks up live secrets via :latest
      |
6. Verify: make a real $5 purchase
   → Checkout page loads → payment succeeds → webhook fires → 500 credits granted
```

### Anti-Patterns to Avoid

- **Updating secrets without redeploying:** Cloud Run environment variable secrets resolve at instance startup. Simply updating Secret Manager without deploying a new revision means existing instances keep the old (test) values until they cold-start. A redeployment guarantees all instances use the new values.
- **Testing with a real card before verifying webhook delivery:** If the webhook secret is wrong, the payment will succeed in Stripe but credits will NOT be granted. Always verify webhook delivery status in the Stripe Dashboard after the first live payment.
- **Forgetting to subscribe the live webhook to `checkout.session.completed`:** The live webhook endpoint must be configured to listen for `checkout.session.completed` events (same as the test endpoint). If you forget this, no webhook fires after payment.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secret rotation | Custom secret-swap script | `gcloud secrets versions add` + Cloud Build trigger | Simple, standard, auditable with version history |
| Payment verification | Custom verification endpoint | Stripe Dashboard + manual browser test | One-time verification; no automation needed for a single go-live event |
| Webhook endpoint management | Stripe API automation | Stripe Dashboard (live mode toggle) | One-time setup; Dashboard provides visual confirmation of live mode |

**Key insight:** This is a one-time operational task, not a code development task. The entire phase is infrastructure operations -- no automation or tooling is needed beyond existing CLI tools.

## Common Pitfalls

### Pitfall 1: Stripe Account Not Activated
**What goes wrong:** Live API key (`sk_live_*`) is rejected by Stripe, or payments fail with "account not activated" error.
**Why it happens:** Stripe requires account activation (KYC: business info, identity verification, bank account) before live payments are accepted. A new Stripe account in test mode cannot process real payments until activated.
**How to avoid:** Before starting this phase, verify that the Stripe account is fully activated in the Dashboard (Settings > Account details should show "Live" status, not "Test only"). Activation requires: business name, address, tax ID/EIN or SSN, bank account for payouts, identity verification.
**Warning signs:** Stripe Dashboard shows "Complete your account setup" banner. API returns errors about restricted functionality.

### Pitfall 2: Wrong Webhook Signing Secret
**What goes wrong:** Real payment succeeds in Stripe, but webhook returns 400 "Invalid signature" and credits are never granted to the user.
**Why it happens:** The live-mode webhook endpoint has a different signing secret than the test-mode endpoint. If the old test-mode `whsec_*` value is left in Secret Manager, signature verification will fail for live events.
**How to avoid:** When registering the live webhook endpoint, immediately copy the new `whsec_*` value and store it in Secret Manager as a new version. Verify by checking the Stripe Dashboard > Webhooks > live endpoint > Recent deliveries after the first payment.
**Warning signs:** Payment completes, redirect to success page works, but balance does not increase. Stripe Dashboard shows webhook delivery failures (HTTP 400).

### Pitfall 3: Not Subscribing Live Webhook to Correct Events
**What goes wrong:** Live webhook endpoint is created but does not receive `checkout.session.completed` events.
**Why it happens:** When creating a new webhook endpoint in the Stripe Dashboard, you must explicitly select which events to listen for. The default is no events.
**How to avoid:** When creating the live webhook, select `checkout.session.completed` under the "Checkout" category. This is the only event the application handles.
**Warning signs:** Payment succeeds, no webhook delivery attempts appear in Stripe Dashboard.

### Pitfall 4: Existing Cloud Run Instances Serving Stale Secrets
**What goes wrong:** After updating secrets but before redeployment, some requests still use test-mode keys.
**Why it happens:** Cloud Run resolves environment variable secrets at instance startup. Existing warm instances retain the old values. With `min-instances=0`, cold-started instances would get new values, but warm instances would not.
**How to avoid:** Always redeploy after updating secrets. A Cloud Build deployment creates a new revision that replaces all existing instances.
**Warning signs:** Intermittent failures where some requests work (new instances) and some fail (old instances).

### Pitfall 5: Stripe Singleton Caching Old Key
**What goes wrong:** After redeployment, the Stripe client still uses the old test key.
**Why it happens:** The `getStripe()` function in `src/lib/billing/stripe.ts` uses a module-level singleton (`let _stripe`). Once initialized, it keeps the same API key for the lifetime of the process.
**How to avoid:** This is actually NOT a problem for Cloud Run redeployments. A new revision creates new container instances with fresh `process.env` values. The singleton initializes with the new key on first use. The singleton pattern only causes issues if you try to change secrets without restarting the process.
**Warning signs:** None expected after proper redeployment.

### Pitfall 6: Making a Real Purchase Without Ability to Refund
**What goes wrong:** The $5 verification purchase succeeds but you cannot refund it.
**Why it happens:** If payout schedule is immediate and bank account is configured, funds may be transferred before you can issue a refund through Stripe.
**How to avoid:** Stripe refunds are available for 180 days regardless of payout status. The $5 test purchase can be refunded through the Stripe Dashboard at any time. Additionally, the admin panel already supports credit adjustments if needed.
**Warning signs:** Not a real concern -- Stripe handles refunds independently of payouts.

## Code Examples

### Step 1: Verify Stripe Account Activation

```bash
# Check in the Stripe Dashboard:
# 1. Go to https://dashboard.stripe.com/settings/account
# 2. Verify account status shows "Activated" or "Live"
# 3. Ensure business details, identity, and bank account are complete
```

### Step 2: Get Live Secret Key

```bash
# In Stripe Dashboard:
# 1. Toggle to "Live mode" (top-right toggle, or ensure URL is dashboard.stripe.com not dashboard.stripe.com/test)
# 2. Go to Developers > API keys
# 3. Reveal the Secret key (sk_live_...)
# 4. Copy it securely (you can only reveal it once; if lost, roll it)
```

### Step 3: Register Live Webhook Endpoint

```bash
# In Stripe Dashboard (live mode):
# 1. Go to Developers > Webhooks (or Workbench > Webhooks)
# 2. Click "Add endpoint"
# 3. Endpoint URL: https://dan-weinbeck.com/api/billing/webhook
# 4. Select events: checkout.session.completed
# 5. Click "Add endpoint"
# 6. IMMEDIATELY copy the Signing secret (whsec_...) — shown only once
#    (Can also be revealed later via "Click to reveal" on the endpoint detail page)
```

### Step 4: Update GCP Secret Manager

```bash
# Source: https://docs.cloud.google.com/secret-manager/docs/add-secret-version

PROJECT_ID="your-gcp-project-id"

# Update stripe-secret-key with live key
echo -n "sk_live_YOUR_LIVE_SECRET_KEY" | \
  gcloud secrets versions add stripe-secret-key \
    --data-file=- \
    --project="${PROJECT_ID}"

# Update stripe-webhook-secret with live webhook signing secret
echo -n "whsec_YOUR_LIVE_WEBHOOK_SECRET" | \
  gcloud secrets versions add stripe-webhook-secret \
    --data-file=- \
    --project="${PROJECT_ID}"

# Verify the new versions are created
gcloud secrets versions list stripe-secret-key --project="${PROJECT_ID}"
gcloud secrets versions list stripe-webhook-secret --project="${PROJECT_ID}"
# Should show a new version (e.g., v3) with state ENABLED
```

### Step 5: Trigger Redeployment

```bash
# Option A: Push any commit to master (triggers Cloud Build automatically)
git commit --allow-empty -m "chore: trigger redeploy for live Stripe keys"
git push origin master

# Option B: Manually trigger the Cloud Build
gcloud builds triggers run deploy-on-push \
  --region=global \
  --branch=master \
  --project="${PROJECT_ID}"

# Monitor the build
gcloud builds list --limit=1 --project="${PROJECT_ID}"
```

### Step 6: Verify Live Payment

```
Manual browser test:
1. Navigate to https://dan-weinbeck.com/billing
2. Sign in with Google
3. Note current credit balance
4. Click "Buy 500 Credits ($5)"
5. In Stripe Checkout (should show LIVE mode — no "test mode" banner):
   - Enter a REAL credit card
   - Complete the payment
6. Should redirect to /billing/success
7. Navigate back to /billing
8. Verify balance increased by 500 credits

Verification in Stripe Dashboard:
1. Go to https://dashboard.stripe.com/payments (live mode)
2. Verify the $5.00 payment appears
3. Go to Developers > Webhooks
4. Select the live endpoint
5. Verify "checkout.session.completed" was delivered successfully (HTTP 200)
```

### Verify Webhook Delivery (if credits not granted)

```bash
# Check Cloud Run logs for webhook processing
gcloud logging read \
  "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"personal-brand\" AND textPayload:\"webhook\"" \
  --limit=10 \
  --project="${PROJECT_ID}" \
  --format="table(timestamp, textPayload)"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded API keys in code | Secret Manager with `:latest` alias | Standard practice | Secrets never in code or build logs |
| Separate test/live code paths | Same code, different secrets | Always (Stripe design) | Zero code changes for go-live |
| Pre-created Stripe Products/Prices | Inline `price_data` in Checkout sessions | Project design choice | No Stripe objects to recreate in live mode |
| Stripe.js client-side (publishable key) | Server-side Checkout redirect only | Project design choice | No client-side key management needed |

**Deprecated/outdated:**
- None. The existing architecture is ideal for a clean test-to-live switch.

## Open Questions

1. **Is the Stripe account fully activated?**
   - What we know: The account has been used for test-mode operations. The project is configured for Stripe Checkout.
   - What's unclear: Whether the account owner has completed KYC (identity verification, business info, bank account for payouts).
   - Recommendation: This is a prerequisite. The user must verify account activation in the Stripe Dashboard before proceeding. If not activated, complete the activation flow first (typically takes minutes to a few business days depending on verification requirements).

2. **Will the $5 verification purchase need to be refunded?**
   - What we know: Stripe supports refunds for 180 days. The admin panel has credit adjustment capabilities.
   - What's unclear: Whether the user wants to keep or refund the verification purchase.
   - Recommendation: The $5 is a real charge. The user can refund it via the Stripe Dashboard if desired, or keep it as the first real transaction. Either way, it validates the full flow.

3. **Should the test-mode webhook endpoint be kept or deleted?**
   - What we know: Test and live webhook endpoints are separate in Stripe. The test endpoint will continue to receive test-mode events.
   - What's unclear: Whether future development will use test-mode webhooks.
   - Recommendation: Keep the test-mode webhook endpoint for future development/debugging. It does not interfere with live operations.

## Sources

### Primary (HIGH confidence)
- [Stripe: Go-live checklist](https://docs.stripe.com/get-started/checklist/go-live) - Official go-live requirements
- [Stripe: API keys](https://docs.stripe.com/keys) - Test vs live key differences
- [Stripe: Receive events in your webhook endpoint](https://docs.stripe.com/webhooks) - Test/live webhook endpoints have separate signing secrets
- [Stripe: Activate your account](https://docs.stripe.com/get-started/account/activate) - KYC and activation requirements
- [GCP: Add a secret version](https://docs.cloud.google.com/secret-manager/docs/add-secret-version) - `gcloud secrets versions add` command
- [GCP: Configure secrets for Cloud Run](https://docs.cloud.google.com/run/docs/configuring/services/secrets) - Env var secrets resolve at instance startup, not runtime

### Secondary (MEDIUM confidence)
- [Stripe: Testing use cases](https://docs.stripe.com/testing-use-cases) - Test vs live mode separation
- Phase 23 Research (`.planning/phases/23-infrastructure-configuration/23-RESEARCH.md`) - Secret Manager setup, IAM bindings, webhook circular dependency
- Phase 24 Verification (`.planning/phases/24-deploy-and-smoke-test/24-VERIFICATION.md`) - Confirmed test-mode billing works end-to-end

### Tertiary (LOW confidence)
- None. All findings verified with official documentation or codebase analysis.

## Metadata

**Confidence breakdown:**
- Secret update procedure: HIGH - Official GCP docs + verified `cloudbuild.yaml` uses `:latest`
- Stripe live mode switch: HIGH - Official Stripe docs confirm same code, different keys
- No code changes needed: HIGH - Codebase analysis confirms no publishable key, inline price_data, env-based secrets
- Cloud Run redeployment requirement: HIGH - Official GCP docs confirm env var secrets resolve at startup
- Stripe account activation prerequisite: MEDIUM - Official docs confirm requirement but cannot verify user's account status

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days -- all patterns are stable infrastructure operations)
