---
status: resolved
trigger: "The /envelopes page on dev.dan-weinbeck.com shows 'Something went wrong. Please try again.' for both authenticated and unauthenticated users."
created: 2026-02-16T12:00:00Z
updated: 2026-02-16T12:35:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED - Missing Firestore composite indexes in dev project
test: Deployed indexes via firebase CLI, verified all indexes READY
expecting: /envelopes page loads correctly for authenticated users
next_action: Archive session

## Symptoms

expected: /envelopes page loads normally - shows landing page for unauthenticated users, envelope dashboard for authenticated users
actual: Shows "Something went wrong. Please try again." error message for authenticated users
errors: "9 FAILED_PRECONDITION: The query requires an index" in Cloud Run logs
reproduction: Navigate to https://dev.dan-weinbeck.com/envelopes while logged in
started: The indexes were never deployed to the dev Firebase project (personal-brand-dev-487114)

## Eliminated

- hypothesis: Text rename (Stash -> Envelopes) introduced a syntax or import error
  evidence: Build succeeds locally, all files syntactically correct, page renders correctly locally
  timestamp: 2026-02-16T12:10:00Z

- hypothesis: Client-side rendering error in EnvelopesLandingPage or EnvelopesNav
  evidence: Deployed SSR HTML renders correctly (curl confirms "Envelopes | Envelope Budgeting" in title, nav renders, Loading... state shows). The error message "Something went wrong. Please try again." only exists in EnvelopesHomePage (authenticated view), not in landing page
  timestamp: 2026-02-16T12:15:00Z

- hypothesis: Firebase auth verification failure on Cloud Run
  evidence: The API correctly returns 401 for unauthenticated requests; the error is AFTER auth verification succeeds, during the Firestore query
  timestamp: 2026-02-16T12:20:00Z

## Evidence

- timestamp: 2026-02-16T12:05:00Z
  checked: npm run build
  found: Build succeeds with zero errors
  implication: Not a compile-time issue

- timestamp: 2026-02-16T12:10:00Z
  checked: Local dev server and production server at localhost:3000/envelopes
  found: Page loads correctly locally - shows "Envelopes", "Envelope Budgeting Made Simple", "Loading..."
  implication: Code is correct; issue is environment-specific

- timestamp: 2026-02-16T12:15:00Z
  checked: curl https://dev.dan-weinbeck.com/envelopes
  found: SSR HTML contains correct content (title, nav, loading state). "error" strings in page are from serialized error boundary component, not actual errors.
  implication: Server-side rendering works; issue is client-side API call

- timestamp: 2026-02-16T12:20:00Z
  checked: Cloud Run error logs (gcloud logging read)
  found: Multiple "GET /api/envelopes error: 9 FAILED_PRECONDITION: The query requires an index" errors. Required indexes: envelopes(userId+sortOrder) and envelope_transactions(userId+date). Project: personal-brand-dev-487114.
  implication: ROOT CAUSE IDENTIFIED - Firestore composite indexes not deployed to dev project

- timestamp: 2026-02-16T12:22:00Z
  checked: firestore.indexes.json
  found: Indexes ARE defined in the file (lines 28-50) but need to be deployed via firebase CLI
  implication: Fix is to deploy indexes to the dev Firebase project

- timestamp: 2026-02-16T12:30:00Z
  checked: firebase deploy --only firestore:indexes --project personal-brand-dev-487114
  found: Deployment succeeded. All 8 composite indexes deployed and confirmed READY via gcloud firestore indexes composite list.
  implication: Fix applied successfully

- timestamp: 2026-02-16T12:33:00Z
  checked: Cloud Run logs for last 5 minutes after fix
  found: Zero envelope-related errors
  implication: No new FAILED_PRECONDITION errors after index deployment

## Resolution

root_cause: Missing Firestore composite indexes in the dev Firebase project (personal-brand-dev-487114). The envelopes Firestore queries require composite indexes on envelopes(userId, sortOrder) and envelope_transactions(userId, date). These are defined in firestore.indexes.json but were never deployed to the dev project. Every GET /api/envelopes call fails with FAILED_PRECONDITION, causing SWR to return an error, which renders the "Something went wrong. Please try again." message. Note: The error only affects AUTHENTICATED users (the "Something went wrong" text is in EnvelopesHomePage, which renders for authenticated users). Unauthenticated users see the EnvelopesLandingPage which has no data fetching and should work fine.
fix: Deployed Firestore composite indexes to the dev project via `firebase deploy --only firestore:indexes --project personal-brand-dev-487114`. All 8 indexes confirmed READY.
verification: All composite indexes confirmed READY state via `gcloud firestore indexes composite list`. No new envelope errors in Cloud Run logs after deployment. User should verify by visiting https://dev.dan-weinbeck.com/envelopes while logged in.
files_changed: []
