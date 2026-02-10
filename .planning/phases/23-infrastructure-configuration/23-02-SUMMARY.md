---
phase: 23-infrastructure-configuration
plan: 02
subsystem: infra
tags: [gcp-secret-manager, stripe-webhook, firebase-auth, firestore-indexes, firestore-rules, cloud-build, iam]

# Dependency graph
requires:
  - phase: 23-01-infrastructure-config-artifacts
    provides: firestore.indexes.json, firebase.json, scripts/seed-billing.ts, corrected DEPLOYMENT.md
provides:
  - Stripe test-mode secrets in GCP Secret Manager with Cloud Run SA access
  - Stripe webhook endpoint for checkout.session.completed
  - Firebase Auth authorized domains (dan-weinbeck.com + Cloud Run .run.app)
  - Google Sign-In provider enabled
  - 3 Firestore composite indexes deployed and active
  - Billing tool pricing seed data (4 tools, brand_scraper active at 50 credits)
  - Firestore security rules deployed (deny all client access)
  - Cloud Build substitution variables verified
affects: [24-deploy-smoke-test]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Firestore REST API for seeding when Admin SDK credentials unavailable locally"

key-files:
  created: []
  modified: []

key-decisions:
  - "Used Stripe API (not Dashboard) to create webhook — returns signing secret programmatically"
  - "Updated Secret Manager secrets to v2 (v1 had placeholder values from earlier setup)"
  - "Seeded Firestore via REST API instead of seed script due to local credential limitations"
  - "Firebase Auth domain uses *.firebaseapp.com (not custom domain) — custom auth domains require Firebase Hosting"

patterns-established:
  - "Infrastructure configuration: automate via CLI/API, minimize Dashboard-only steps"

# Metrics
duration: 8min
completed: 2026-02-09
---

# Phase 23 Plan 02: Infrastructure Configuration Execution Summary

**GCP Secret Manager secrets, Stripe webhook, Firebase Auth domains, Firestore indexes/rules/seed data, and Cloud Build substitutions — all 9 INFRA requirements verified**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-09T22:37:00Z
- **Completed:** 2026-02-09T22:45:00Z
- **Tasks:** 4 (all checkpoint:human-action, executed via CLI/API automation)
- **Files modified:** 0 (pure infrastructure execution)

## Accomplishments

- Configured Stripe test-mode secrets in GCP Secret Manager (v2) with Cloud Run SA IAM bindings
- Created Stripe webhook endpoint at `https://dan-weinbeck.com/api/billing/webhook` for `checkout.session.completed`
- Added `personal-brand-pcyrow43pa-uc.a.run.app` to Firebase Auth authorized domains (dan-weinbeck.com was already present)
- Confirmed Google Sign-In provider already enabled from earlier phase
- Deployed 3 Firestore composite indexes and security rules via Firebase CLI
- Seeded `billing_tool_pricing` collection with 4 tools (brand_scraper active at 50 credits)
- Verified all 5 Cloud Build substitution variables are set with correct values

## Task Commits

No code commits — this was a pure infrastructure execution plan with no file changes.

## Files Created/Modified

None — all changes were external service configurations.

## Decisions Made

- **Stripe webhook via API:** Used `curl` to Stripe API instead of Dashboard to programmatically capture the `whsec_` signing secret
- **Secret Manager versioning:** Secrets already existed at v1 (placeholders). Added v2 with real test-mode values rather than deleting/recreating
- **Firestore seeding via REST API:** Local Firebase Admin SDK had invalid credentials (placeholder private key). Used Firestore REST API with gcloud token instead of seed script
- **Firebase auth domain:** Confirmed `_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` should be `personal-brand-486314.firebaseapp.com` (Firebase default), not custom domain

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Firebase CLI not installed**
- **Found during:** Task 3 (Firestore deployment)
- **Issue:** `firebase` command not found globally
- **Fix:** Used `npx firebase-tools` instead
- **Verification:** Deployment succeeded

**2. [Rule 3 - Blocking] Firebase CLI auth with wrong account**
- **Found during:** Task 3 (Firestore deployment)
- **Issue:** Firebase CLI was logged in as `dweinbeck.dev@gmail.com` which had no Firebase projects
- **Fix:** User re-authenticated with `daniel.weinbeck@gmail.com` (project owner)
- **Verification:** `projects:list` showed `personal-brand-486314`

**3. [Rule 3 - Blocking] Seed script couldn't connect to Firestore locally**
- **Found during:** Task 3 (seed data)
- **Issue:** `FIREBASE_PRIVATE_KEY` in `.env.local` is a placeholder, causing Admin SDK init to fail
- **Fix:** Seeded data directly via Firestore REST API using gcloud access token
- **Verification:** All 4 documents created in `billing_tool_pricing` collection

---

**Total deviations:** 3 auto-fixed (all blocking issues)
**Impact on plan:** All fixes were alternative approaches to achieve the same outcome. No scope creep.

## Issues Encountered

- Secret Manager secrets already existed at v1 from a previous setup attempt — updated to v2 with correct values
- `.env.local` has a placeholder `FIREBASE_PRIVATE_KEY` that prevents local Admin SDK usage — not blocking for production (Cloud Run uses ADC)

## Authentication Gates

1. **Firebase CLI login:** Required browser-based OAuth login with project owner account
2. **Stripe account creation:** User needed to create a Stripe account (first-time setup)

## INFRA Requirements Verification

| Req | Status | Evidence |
|-----|--------|----------|
| INFRA-01 | ✓ | `gcloud secrets list` shows stripe-secret-key and stripe-webhook-secret |
| INFRA-02 | ✓ | Stripe API returned webhook ID `we_1Sz3MfFRUqcoojOa4nyfmBan` |
| INFRA-03 | ✓ | IAM policy shows `cloudrun-site@` has `secretAccessor` on both secrets |
| INFRA-04 | ✓ | Authorized domains include `dan-weinbeck.com` and `personal-brand-pcyrow43pa-uc.a.run.app` |
| INFRA-05 | ✓ | Google Sign-In provider `enabled: true` |
| INFRA-06 | ✓ | All 5 substitution variables set, auth domain uses `*.firebaseapp.com` |
| INFRA-07 | ✓ | 3 composite indexes deployed via `firebase deploy --only firestore` |
| INFRA-08 | ✓ | 4 documents in `billing_tool_pricing` (brand_scraper active at 50 credits) |
| INFRA-09 | ✓ | Security rules deployed: `allow read, write: if false` |

## Next Phase Readiness

- All external services configured and ready for billing-enabled deployment
- Phase 24 (Deploy & Smoke Test) can proceed immediately
- No blockers remaining for deployment

---
*Phase: 23-infrastructure-configuration*
*Completed: 2026-02-09*
