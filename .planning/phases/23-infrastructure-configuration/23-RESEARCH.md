# Phase 23: Infrastructure Configuration - Research

**Researched:** 2026-02-09
**Domain:** GCP Secret Manager, Stripe Webhooks, Firebase Auth, Firestore Indexes/Rules
**Confidence:** HIGH (gcloud/Firebase CLI commands verified via official docs; Stripe API verified)

## Summary

Phase 23 is a pure infrastructure configuration phase -- no application code changes. The billing code is already committed to master and expects specific external services to be configured: Stripe secrets in GCP Secret Manager, a Stripe webhook endpoint, Firebase Auth with Google Sign-In on the production domain, Firestore composite indexes for billing queries, seed data in Firestore, and security rules denying client-side access to billing collections.

The research found that all nine INFRA requirements break down into three categories: (1) file artifacts Claude can create (indexes JSON, security rules, seed script), (2) CLI commands the user runs with real credentials (gcloud, firebase, stripe), and (3) Dashboard-only tasks requiring manual human interaction. Notably, Stripe webhook creation and Firebase Auth provider/domain configuration have programmatic alternatives (REST API / curl) but require real API keys and secrets the user must supply.

**Primary recommendation:** Claude should create all file artifacts (firestore.indexes.json, updated firestore.rules, seed script) and produce a step-by-step runbook of CLI commands for the user to execute. Dashboard-only tasks should have explicit manual instructions with screenshots/links.

## Standard Stack

This phase uses no new libraries. All tools are infrastructure CLIs already available.

### Core
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `gcloud` CLI | GCP Secret Manager, IAM bindings | Official GCP CLI, already in use for deploys |
| `firebase` CLI | Deploy Firestore indexes and security rules | Official Firebase CLI, project already has `firebase.json` |
| Stripe Dashboard/API | Webhook endpoint registration | Only method for persistent webhook endpoints |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `curl` | REST API calls for Firebase Auth domain config | If automating auth domain setup instead of using Console |
| `npx tsx` | Run TypeScript seed scripts | For seeding Firestore billing data using existing Admin SDK |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual Dashboard for Stripe webhook | Stripe API via curl | API returns signing secret in response (only at creation); more automatable but requires handling secret securely |
| Firebase Console for auth domains | Identity Toolkit REST API | Scriptable but requires `gcloud auth print-access-token` and careful domain list management (PATCH replaces entire list) |
| Firebase Console for Google Sign-In | Identity Platform REST API | Requires OAuth client ID/secret from Google Cloud Console; complex for a one-time setup |

## Architecture Patterns

### Recommended Task Structure

The phase should be organized as a checklist/runbook rather than code implementation phases. Group by dependency order:

```
1. Enable APIs (Secret Manager)
2. Create secrets + grant IAM (depends on API being enabled)
3. Firebase Auth config (independent of secrets)
4. Firestore indexes + rules (file artifacts first, then deploy)
5. Seed data (after indexes exist)
6. Stripe webhook (after deployment URL is confirmed)
7. Verify Cloud Build substitutions (final check before first deploy)
```

### Pattern: Secret-First, Deploy-After

**What:** All secrets and IAM bindings must be configured BEFORE the first deployment with `--set-secrets`. Cloud Run validates secret access at deploy time.
**Why:** The `cloudbuild.yaml` already includes `--set-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest`. If these secrets don't exist or the service account lacks access, the deploy step will fail.
**Implication:** INFRA-01 and INFRA-03 are hard blockers for any deployment.

### Pattern: Stripe Webhook Circular Dependency

**What:** The Stripe webhook needs to point to `https://dan-weinbeck.com/api/billing/webhook`, but the webhook signing secret (`whsec_...`) is only returned when the endpoint is created. This creates a chicken-and-egg: you need the webhook endpoint to get the secret, and you need the secret in Secret Manager to deploy.
**Resolution:** Create webhook endpoint first (get `whsec_...` back), then store it in Secret Manager, then deploy. The webhook will return 404 until deployed, but that's fine -- Stripe retries failed deliveries.

### Anti-Patterns to Avoid
- **Granting project-wide `secretmanager.secretAccessor`:** Grant per-secret instead for least privilege
- **Using test-mode Stripe keys in production Secret Manager:** Test keys (`sk_test_`) are for development; production should use live keys (`sk_live_`) -- but for initial setup, test keys are fine for validation
- **Patching Firebase auth domains without reading current list first:** The PATCH endpoint replaces the entire `authorizedDomains` array; omitting defaults (localhost, *.firebaseapp.com, *.web.app) would break existing auth

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Firestore composite indexes | Manual index creation in Console | `firestore.indexes.json` + `firebase deploy --only firestore:indexes` | Declarative, version-controlled, reproducible |
| Firestore security rules | Console rules editor | `firestore.rules` + `firebase deploy --only firestore:rules` | Version-controlled, auditable, matches existing `firebase.json` config |
| Seed script | Manual Firestore Console document creation | Existing `seedToolPricing()` function in `src/lib/billing/tools.ts` | Already written, idempotent (checks for existing docs), correct data |
| Secret creation | Console UI | `gcloud secrets create` + `echo -n | gcloud secrets versions add` | Scriptable, reproducible |

**Key insight:** The existing codebase already has the seed function built (`src/lib/billing/tools.ts:seedToolPricing()`). A minimal seed script just needs to import and call it.

## Common Pitfalls

### Pitfall 1: Secret Manager API Not Enabled
**What goes wrong:** `gcloud secrets create` fails with "API not enabled" error
**Why it happens:** The `deploy.sh` script only enables `run.googleapis.com`, `artifactregistry.googleapis.com`, and `cloudbuild.googleapis.com`. It does NOT enable `secretmanager.googleapis.com`.
**How to avoid:** Run `gcloud services enable secretmanager.googleapis.com` as the first step
**Warning signs:** Error message "Secret Manager API has not been used in project X before or it is disabled"

### Pitfall 2: IAM Binding on Wrong Principal
**What goes wrong:** Cloud Run deployment fails with "Permission denied on secret"
**Why it happens:** Granting `secretAccessor` to the Cloud Build service account instead of the Cloud Run service account. Cloud Run accesses secrets at RUNTIME via its revision service account, not at build time.
**How to avoid:** Grant to `cloudrun-site@{PROJECT_ID}.iam.gserviceaccount.com` (the `--service-account` in `cloudbuild.yaml`), not to `{PROJECT_NUMBER}@cloudbuild.gserviceaccount.com`
**Warning signs:** Deployment step "Deploy to Cloud Run" fails, not the build step
**Note:** The existing `docs/DEPLOYMENT.md` has an error -- it shows granting to the Cloud Build SA. The correct SA is the Cloud Run runtime SA.

### Pitfall 3: Stripe Webhook Secret Only Returned at Creation
**What goes wrong:** User creates webhook in Dashboard, doesn't copy the signing secret, can't retrieve it later
**Why it happens:** The `secret` field on a Stripe webhook endpoint object is "only returned at creation." Subsequent API calls or Dashboard views may not show it.
**How to avoid:** Copy `whsec_...` immediately when creating the endpoint. If lost, delete and recreate the endpoint.
**Warning signs:** Webhook signature verification fails in production (400 "Invalid signature")

### Pitfall 4: Firebase Auth Domain List Replacement
**What goes wrong:** After adding `dan-weinbeck.com` via REST API, localhost and *.firebaseapp.com are removed
**Why it happens:** The Identity Toolkit REST API PATCH for `authorizedDomains` replaces the entire array, not appending
**How to avoid:** Always GET the current domain list first, append the new domain, then PATCH the full list
**Warning signs:** Auth stops working on all other domains after the update

### Pitfall 5: Composite Index Build Time
**What goes wrong:** Indexes are deployed but queries fail for several minutes
**Why it happens:** Firestore composite index creation is asynchronous. After `firebase deploy --only firestore:indexes`, the indexes enter a "CREATING" state that can take 5-10 minutes for simple indexes.
**How to avoid:** Wait for index status to show "READY" before testing. Check status with `firebase firestore:indexes` or in Firebase Console.
**Warning signs:** Firestore error "The query requires an index" even after deployment

### Pitfall 6: Firestore Rules Must Not Block Admin SDK
**What goes wrong:** Developer worries that `allow read, write: if false` will block server-side code
**Why it happens:** Confusion between client-side security rules and Admin SDK access
**How to avoid:** Understand that Firestore security rules ONLY apply to client-side SDKs (web/mobile). The Firebase Admin SDK (used by Next.js API routes) bypasses all security rules. The current `firestore.rules` with `allow read, write: if false` is already correct for INFRA-09.
**Warning signs:** None -- this is already correctly configured

## Code Examples

### GCP Secret Manager Setup (gcloud commands)
```bash
# Source: https://docs.cloud.google.com/secret-manager/docs/creating-and-accessing-secrets
# Source: https://docs.cloud.google.com/secret-manager/docs/manage-access-to-secrets

PROJECT_ID="your-gcp-project-id"
SA_EMAIL="cloudrun-site@${PROJECT_ID}.iam.gserviceaccount.com"

# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com --project="${PROJECT_ID}"

# 2. Create secrets (pipe real values -- don't put in shell history)
# Use a file or password manager to supply the value
echo -n "sk_test_..." | gcloud secrets create stripe-secret-key \
  --data-file=- \
  --project="${PROJECT_ID}"

echo -n "whsec_..." | gcloud secrets create stripe-webhook-secret \
  --data-file=- \
  --project="${PROJECT_ID}"

# 3. Grant Cloud Run SA access to each secret (least privilege)
gcloud secrets add-iam-policy-binding stripe-secret-key \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}"

gcloud secrets add-iam-policy-binding stripe-webhook-secret \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}"
```

### Stripe Webhook Endpoint (API)
```bash
# Source: https://docs.stripe.com/api/webhook_endpoints/create
# Can also be done via Dashboard: https://dashboard.stripe.com/webhooks

# Create endpoint via API (returns signing secret in response)
curl https://api.stripe.com/v1/webhook_endpoints \
  -u "sk_test_YOUR_SECRET_KEY:" \
  -d "enabled_events[]"="checkout.session.completed" \
  --data-urlencode url="https://dan-weinbeck.com/api/billing/webhook"

# Response includes: { "secret": "whsec_..." }
# Save that whsec_ value -- it's only returned at creation time
```

### Firebase Auth Authorized Domains (REST API)
```bash
# Source: https://pretired.dazwilkin.com/posts/211111/
# Source: https://firebase.google.com/docs/auth/configure-oauth-rest-api

PROJECT_ID="your-firebase-project-id"
TOKEN=$(gcloud auth print-access-token)

# 1. GET current authorized domains
curl --silent --request GET \
  --header "Authorization: Bearer ${TOKEN}" \
  --header "Accept: application/json" \
  "https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/config" \
  | jq '.authorizedDomains'

# 2. PATCH to add new domains (include ALL existing domains + new ones)
curl --request PATCH \
  --header "Authorization: Bearer ${TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{
    "authorizedDomains": [
      "localhost",
      "YOUR_PROJECT.firebaseapp.com",
      "YOUR_PROJECT.web.app",
      "dan-weinbeck.com",
      "personal-brand-HASH.run.app"
    ]
  }' \
  "https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/config?updateMask=authorizedDomains"
```

### Firestore Composite Indexes (firestore.indexes.json)
```json
// Source: https://firebase.google.com/docs/reference/firestore/indexes
// Source: https://firebase.google.com/docs/firestore/query-data/indexing
{
  "indexes": [
    {
      "collectionGroup": "billing_tool_usage",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "billing_tool_usage",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "externalJobId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "billing_purchases",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

These indexes correspond to the queries in `src/lib/billing/firestore.ts`:
- `getUserUsage()`: `.where("uid", "==", uid).orderBy("createdAt", "desc")`
- `findUsageByExternalJobId()`: `.where("uid", "==", uid).where("externalJobId", "==", externalJobId)`
- `getUserPurchases()`: `.where("uid", "==", uid).orderBy("createdAt", "desc")`

### Firestore Security Rules (firestore.rules)
```
// Source: https://firebase.google.com/docs/firestore/security/get-started
// Already correct -- existing rules deny all client access:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

The existing `firestore.rules` already satisfies INFRA-09. The `allow read, write: if false` rule denies ALL client-side access. The Firebase Admin SDK (used by Next.js API routes) bypasses security rules entirely, so server-side billing operations are unaffected.

### Deploy Indexes and Rules
```bash
# Source: https://firebase.google.com/docs/rules/manage-deploy

# Deploy indexes only
firebase deploy --only firestore:indexes --project=YOUR_PROJECT_ID

# Deploy rules only
firebase deploy --only firestore:rules --project=YOUR_PROJECT_ID

# Deploy both
firebase deploy --only firestore --project=YOUR_PROJECT_ID
```

### Seed Script (leveraging existing code)
```typescript
// scripts/seed-billing.ts
// Uses the existing seedToolPricing() function from src/lib/billing/tools.ts

import "@/lib/firebase"; // Initialize Admin SDK
import { seedToolPricing } from "@/lib/billing/tools";

async function main() {
  console.log("Seeding billing tool pricing...");
  await seedToolPricing();
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
```

Alternative: Run seed on first deploy by calling `seedToolPricing()` from an API route or server startup. The function is already idempotent (checks `doc.exists` before writing).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firestore Console for indexes | `firestore.indexes.json` + CLI deploy | Stable since 2019 | Declarative, version-controlled indexes |
| Console-only auth domain management | REST API via Identity Toolkit v2 | 2021+ | Scriptable auth domain configuration |
| Stripe Dashboard-only webhooks | Stripe API `POST /v1/webhook_endpoints` | Stable | Programmatic webhook creation, returns signing secret |
| Project-level IAM for secrets | Per-secret IAM bindings | Best practice, always available | Least-privilege access |

## Open Questions

1. **Firebase Auth: Is Google Sign-In already enabled?**
   - What we know: The project already has admin auth working (AdminGuard uses email check). AuthGuard uses `signInWithPopup` with `GoogleAuthProvider`.
   - What's unclear: Whether Google Sign-In provider is already enabled in Firebase Console from earlier phases
   - Recommendation: Check Firebase Console before attempting to enable. If already enabled, INFRA-05 is already done.

2. **Cloud Run .run.app domain: What is the exact URL?**
   - What we know: The Cloud Run service is named `personal-brand` in `us-central1`. The `.run.app` URL follows the pattern `https://personal-brand-HASH-uc.a.run.app`
   - What's unclear: The exact hash in the URL (generated by GCP)
   - Recommendation: Run `gcloud run services describe personal-brand --region=us-central1 --format="value(status.url)"` to get the exact URL before adding to Firebase Auth authorized domains

3. **Test mode vs Live mode Stripe keys for initial setup?**
   - What we know: The requirement says "test-mode secrets" specifically (INFRA-01 success criterion)
   - What's unclear: Whether to also configure live-mode keys or only test-mode for Phase 23
   - Recommendation: Use test-mode keys (`sk_test_`, `whsec_test_`) for Phase 23 validation. Switching to live requires updating Secret Manager versions later.

4. **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN value: firebaseapp.com or custom?**
   - What we know: The env var supports `project-id.firebaseapp.com` format. Custom auth domains are possible but complex.
   - What's unclear: Whether to use `dan-weinbeck.com` or `project-id.firebaseapp.com` as the auth domain
   - Recommendation: Use `project-id.firebaseapp.com` (the Firebase default). Custom auth domains require Firebase Hosting and additional DNS setup that's out of scope.

5. **firebase.json: Does it need indexes configuration?**
   - What we know: Current `firebase.json` only has `{ "firestore": { "rules": "firestore.rules" } }`
   - What's unclear: Whether `firebase deploy --only firestore:indexes` requires the indexes file to be referenced in `firebase.json`
   - Recommendation: Add `"indexes": "firestore.indexes.json"` to the `firestore` section of `firebase.json` before deploying indexes

## Task Automation Classification

### Claude Can Create (file artifacts)
| Requirement | Artifact | Notes |
|-------------|----------|-------|
| INFRA-07 | `firestore.indexes.json` | Composite index definitions from billing queries |
| INFRA-09 | Verify `firestore.rules` | Already correct (`allow read, write: if false`) |
| INFRA-08 | `scripts/seed-billing.ts` | Wrapper around existing `seedToolPricing()` |
| INFRA-06 | Audit `cloudbuild.yaml` substitutions | Verify all variables are present |
| -- | Update `firebase.json` to reference indexes | Add `"indexes": "firestore.indexes.json"` |

### User Runs CLI Commands (scriptable runbook)
| Requirement | Commands | Notes |
|-------------|----------|-------|
| INFRA-01 | `gcloud services enable`, `gcloud secrets create` | User supplies real Stripe key values |
| INFRA-03 | `gcloud secrets add-iam-policy-binding` | Grant to Cloud Run SA |
| INFRA-07 | `firebase deploy --only firestore:indexes` | After Claude creates the file |
| INFRA-09 | `firebase deploy --only firestore:rules` | Rules already correct, just deploy |
| INFRA-08 | Run seed script | After indexes are deployed |

### Human Manual Action (Dashboard/Console)
| Requirement | Where | Notes |
|-------------|-------|-------|
| INFRA-02 | Stripe Dashboard or Stripe API | Create webhook endpoint, copy `whsec_...` signing secret |
| INFRA-04 | Firebase Console > Authentication > Authorized domains | Add `dan-weinbeck.com` and `.run.app` URL |
| INFRA-05 | Firebase Console > Authentication > Sign-in method | Enable Google provider (may already be done) |
| INFRA-06 | Cloud Build trigger settings in GCP Console | Verify substitution variable values |

**Note:** INFRA-02, INFRA-04, and INFRA-05 have REST API alternatives documented in Code Examples above. The user can choose Dashboard or API.

## Sources

### Primary (HIGH confidence)
- [GCP Secret Manager: Manage Access](https://docs.cloud.google.com/secret-manager/docs/manage-access-to-secrets) - IAM binding commands
- [GCP Secret Manager: Add Version](https://docs.cloud.google.com/secret-manager/docs/add-secret-version) - Secret creation commands
- [Cloud Run: Configure Secrets](https://docs.cloud.google.com/run/docs/configuring/services/secrets) - Runtime SA needs secretAccessor, not build SA
- [Stripe API: Create Webhook Endpoint](https://docs.stripe.com/api/webhook_endpoints/create) - Programmatic webhook creation with signing secret
- [Stripe API: Webhook Endpoint Object](https://docs.stripe.com/api/webhook_endpoints/object) - `secret` field only returned at creation
- [Stripe CLI: Use CLI](https://docs.stripe.com/stripe-cli/use-cli) - CLI is for local dev only, not persistent endpoints
- [Firebase: Cloud Firestore Index Definition](https://firebase.google.com/docs/reference/firestore/indexes) - JSON index format
- [Firebase: Manage Indexes](https://firebase.google.com/docs/firestore/query-data/indexing) - Deploy indexes via CLI
- [Firebase: Manage and Deploy Rules](https://firebase.google.com/docs/rules/manage-deploy) - Deploy rules via CLI
- [Firebase: Configure OAuth REST API](https://firebase.google.com/docs/auth/configure-oauth-rest-api) - Programmatic provider config

### Secondary (MEDIUM confidence)
- [Adding Authorized Domains to Firebase Auth (blog)](https://pretired.dazwilkin.com/posts/211111/) - REST API curl commands for auth domains verified against Firebase docs
- [Stripe Dashboard: Add Webhook Endpoint](https://docs.stripe.com/development/dashboard/webhooks) - Manual Dashboard flow

### Tertiary (LOW confidence)
- None. All findings verified with official documentation.

## Metadata

**Confidence breakdown:**
- GCP Secret Manager commands: HIGH - Official GCP docs, well-documented stable API
- Stripe webhook configuration: HIGH - Official Stripe API docs, verified endpoint and signing secret behavior
- Firebase Auth domain config: HIGH - Official docs + verified REST API approach
- Firestore indexes/rules: HIGH - Official Firebase docs, existing `firebase.json` confirms CLI setup
- Seed data approach: HIGH - Existing `seedToolPricing()` already in codebase, verified idempotent
- Automation classification: HIGH - Based on tool capabilities verified in this research

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days -- all APIs are stable, no fast-moving changes expected)
