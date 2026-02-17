---
status: resolved
trigger: "GET /api/envelopes returns 500 (Internal Server Error) when navigating to Envelopes app from home page on dev.dan-weinbeck.com"
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T23:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - Missing Firestore composite indexes on dev project
test: Created indexes via gcloud, verified no more FAILED_PRECONDITION errors
expecting: N/A - resolved
next_action: Archive session

## Symptoms

expected: Should show a Home page for unauthenticated users, or the envelopes home for signed in users
actual: GET https://dev.dan-weinbeck.com/api/envelopes returns 500 (Internal Server Error)
errors: 8b610ba418ddbadc.js:1  GET https://dev.dan-weinbeck.com/api/envelopes 500 (Internal Server Error)
reproduction: Navigate to the Envelopes app from the home page on dev.dan-weinbeck.com
started: Unknown - user not sure if it ever worked on this domain

## Eliminated

- hypothesis: Code bug in API route handler or auth verification
  evidence: Route handler code is correct; unauthenticated requests return 401 as expected; error only occurs after auth succeeds during Firestore query
  timestamp: 2026-02-16T23:05:00Z

- hypothesis: Missing environment variables or Firebase config issue
  evidence: Firebase Admin SDK initializes correctly on Cloud Run (ADC works); auth verification succeeds; the error is specifically a Firestore query error, not an initialization error
  timestamp: 2026-02-16T23:05:00Z

## Evidence

- timestamp: 2026-02-16T23:04:00Z
  checked: Cloud Run logs via gcloud logging read
  found: "GET /api/envelopes error: 9 FAILED_PRECONDITION: The query requires an index." with link to create composite index for envelopes collection (userId ASC, sortOrder ASC)
  implication: Root cause is a missing Firestore composite index, not a code bug

- timestamp: 2026-02-16T23:06:00Z
  checked: firestore.indexes.json in repo
  found: No entries for "envelopes" or "envelope_transactions" collections; only billing, scrape_history, and research_conversations indexes defined
  implication: The envelope indexes were never defined in the index file

- timestamp: 2026-02-16T23:07:00Z
  checked: gcloud firestore indexes composite list on personal-brand-dev-487114
  found: Only 5 indexes exist (billing_tool_usage x2, billing_purchases, scrape_history, research_conversations); none for envelopes or envelope_transactions
  implication: Indexes were never deployed to the dev project

- timestamp: 2026-02-16T23:08:00Z
  checked: Firestore queries in src/lib/envelopes/firestore.ts
  found: Three composite queries need indexes: (1) envelopes: userId+sortOrder, (2) envelope_transactions: userId+date ASC, (3) envelope_transactions: userId+date DESC
  implication: All three indexes must be created to prevent 500s across all envelopes API routes

- timestamp: 2026-02-16T23:12:00Z
  checked: Index creation status after gcloud firestore indexes composite create
  found: envelopes (userId+sortOrder) = READY; envelope_transactions (userId+date ASC) = CREATING; envelope_transactions (userId+date DESC) = CREATING
  implication: Primary blocking index is ready; transaction indexes building in background

- timestamp: 2026-02-16T23:13:00Z
  checked: Cloud Run logs for FAILED_PRECONDITION errors in last 5 minutes
  found: Empty result (no more errors)
  implication: The fix resolved the immediate 500 error

## Resolution

root_cause: Missing Firestore composite indexes on the dev project (personal-brand-dev-487114). The envelopesForUser() query uses .where("userId", "==", userId).orderBy("sortOrder", "asc") which requires a composite index (userId ASC, sortOrder ASC) that was never created on the dev project. The firestore.indexes.json file was also missing these index definitions entirely.

fix: (1) Added three composite index definitions to firestore.indexes.json: envelopes (userId+sortOrder), envelope_transactions (userId+date ASC), envelope_transactions (userId+date DESC). (2) Created all three indexes on the dev Firebase project via gcloud firestore indexes composite create.

verification: (1) gcloud logging read shows no FAILED_PRECONDITION errors after index creation. (2) envelopes userId+sortOrder index confirmed READY. (3) All quality gates pass: lint clean, build succeeds, 156/156 tests pass.

files_changed:
- firestore.indexes.json (added 3 composite index definitions for envelopes and envelope_transactions)
