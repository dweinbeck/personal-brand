---
status: resolved
trigger: "Brand scraper page shows 'could not load billing info' error. Two API endpoints failing: /api/billing/me and /api/tools/brand-scraper/history."
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED -- Firebase Admin SDK project ID mismatch
test: Build, lint, and tests all pass. Deployment needed to verify on Cloud Run.
expecting: After redeployment, authenticated API calls will succeed
next_action: Archive session

## Symptoms

expected: Brand scraper page should load billing info and scraping history successfully
actual: Error message "could not load billing info" appears on the brand-scraper home page
errors: Two network requests fail: GET /api/billing/me and GET /api/tools/brand-scraper/history (both authenticated with Bearer token)
reproduction: Navigate to https://dev.dan-weinbeck.com/apps/brand-scraper while logged in
started: After recent changes (commits include homepage updates, envelopes card fixes, subtitle updates, brand-scraper URL normalization)

## Eliminated

- hypothesis: Recent commits changed API route code
  evidence: git log shows API route files (billing/me/route.ts, brand-scraper/history/route.ts) haven't been modified in any recent dev commits. Only UserBrandScraperPage.tsx was changed.
  timestamp: 2026-02-16T00:00:30Z

- hypothesis: Next.js middleware or config is blocking API routes
  evidence: No custom middleware.ts exists. next.config.ts only has redirects for /tutorials and /projects. curl to unauthenticated endpoints returns proper 401 JSON.
  timestamp: 2026-02-16T00:00:45Z

- hypothesis: Server-side Firestore error (500)
  evidence: Cloud Run logs show ALL billing/me requests return 401 (not 500). No billing-related stderr logs exist. No console.error from the catch block in the route handler was ever triggered.
  timestamp: 2026-02-16T00:02:00Z

## Evidence

- timestamp: 2026-02-16T00:00:20Z
  checked: API routes for billing/me and brand-scraper/history
  found: Both routes use identical auth pattern (verifyUser). Code is unchanged since initial creation.
  implication: The route code itself is not the problem

- timestamp: 2026-02-16T00:00:30Z
  checked: Commit 50e45d9 diff
  found: Only changed UserBrandScraperPage.tsx - added billingError state, error UI, URL normalization. PREVIOUSLY the catch block silently ignored errors. NOW it sets billingError=true and shows error banner.
  implication: The error was always happening but was invisible. The commit made it visible.

- timestamp: 2026-02-16T00:00:40Z
  checked: ScrapeHistory component error handling
  found: SWR fetcher returns null on !res.ok, entries=[], component returns null (hidden). History errors also silently swallowed.
  implication: Both endpoints have been failing since deployment.

- timestamp: 2026-02-16T00:01:00Z
  checked: Cloud Run logs - all /api/billing/me requests
  found: ZERO 200 responses ever. ALL browser requests return 401. Only /api/assistant/chat (which has NO auth) returns 200.
  implication: verifyUser auth check fails for every request, even authenticated ones.

- timestamp: 2026-02-16T00:02:30Z
  checked: Cloud Run environment variables
  found: FIREBASE_PROJECT_ID=personal-brand-dev-487114 (GCP project), NEXT_PUBLIC_FIREBASE_PROJECT_ID=personal-brand-486314 (Firebase project). DIFFERENT IDs.
  implication: Client SDK generates tokens with aud=personal-brand-486314, but Admin SDK on Cloud Run auto-detects project as personal-brand-dev-487114.

- timestamp: 2026-02-16T00:02:45Z
  checked: firebase.ts initializeApp call
  found: On Cloud Run, calls initializeApp({ credential }) WITHOUT projectId. Admin SDK auto-detects project from Cloud Run metadata server (GCP project ID). Token verification checks aud claim against this project ID.
  implication: verifyIdToken fails because token.aud (Firebase project) != detected project (GCP project). This is the root cause.

- timestamp: 2026-02-16T00:03:00Z
  checked: Service account IAM roles
  found: cloudrun-site@personal-brand-dev-487114.iam.gserviceaccount.com has roles/datastore.user and roles/secretmanager.secretAccessor
  implication: Firestore access is fine. The issue is purely the project ID mismatch in token verification.

## Resolution

root_cause: Firebase Admin SDK project ID mismatch. The Cloud Run GCP project (personal-brand-dev-487114) differs from the Firebase project (personal-brand-486314). The cloudbuild.yaml was setting FIREBASE_PROJECT_ID=${PROJECT_ID} (GCP project), and firebase.ts was not passing projectId to initializeApp() on Cloud Run. This caused the Admin SDK to auto-detect the GCP project ID from the metadata server. When verifyIdToken() checked the token's audience claim, it expected "personal-brand-dev-487114" but found "personal-brand-486314" (the Firebase project the token was issued for). ALL authenticated API calls have been failing since the billing system was deployed -- the error was previously silently swallowed until commit 50e45d9 surfaced it.

fix: |
  1. cloudbuild.yaml: Changed FIREBASE_PROJECT_ID from ${PROJECT_ID} (GCP) to ${_NEXT_PUBLIC_FIREBASE_PROJECT_ID} (Firebase) so the env var contains the correct Firebase project ID.
  2. src/lib/firebase.ts: Added explicit projectId to initializeApp() call so the Admin SDK uses FIREBASE_PROJECT_ID rather than auto-detecting from the GCP metadata server.
  3. .env.local.example: Updated comments to clarify that FIREBASE_PROJECT_ID must be the Firebase project ID, not the GCP project ID.

verification: |
  - npm run lint: 0 issues (Biome check, 249 files)
  - npm run build: Success (Next.js 16.1.6 Turbopack)
  - npm test: 156 tests passed, 0 failed
  - TypeScript: No errors in modified files (pre-existing errors in unrelated research-assistant tests)
  - Deployment verification: Requires redeployment to Cloud Run to confirm fix on live environment

files_changed:
  - cloudbuild.yaml
  - src/lib/firebase.ts
  - .env.local.example
