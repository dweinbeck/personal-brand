---
status: resolved
trigger: "GET /api/envelopes/transfers?weekStart=2026-02-15&weekEnd=2026-02-21 returns empty/no data on dev"
created: 2026-02-21T00:00:00Z
updated: 2026-02-21T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED
test: Build and test pass. Query no longer requires missing composite index.
expecting: Transfers endpoint returns data for matching week.
next_action: Archive session.

## Symptoms

expected: Endpoint should return all transactions for the specified week (Feb 15-21, 2026). Transfers are important to see within the card itself.
actual: Returns 200 but with empty array or no data (likely 500 with error being swallowed by frontend on detail page).
errors: No explicit error — just empty response.
reproduction: curl to https://dev.dan-weinbeck.com/api/envelopes/transfers?weekStart=2026-02-15&weekEnd=2026-02-21 with valid auth token returns empty.
started: Currently broken on dev environment.

## Eliminated

- hypothesis: Date format/parsing mismatch between stored weekStart and query params
  evidence: Both use format(startOfWeek(...), "yyyy-MM-dd"), producing identical strings like "2026-02-15"
  timestamp: 2026-02-21

- hypothesis: Wrong Firestore collection path
  evidence: transfersCol() correctly returns db.collection("envelope_transfers"), same as createTransfer uses
  timestamp: 2026-02-21

- hypothesis: Query filter range semantics wrong (weekStart range wouldn't match)
  evidence: Stored weekStart "2026-02-15" satisfies both >= "2026-02-15" and <= "2026-02-21"
  timestamp: 2026-02-21

## Evidence

- timestamp: 2026-02-21
  checked: API route handler at src/app/api/envelopes/transfers/route.ts
  found: GET handler passes weekStart/weekEnd query params directly to listTransfersForWeek(userId, weekStart, weekEnd)
  implication: No transformation of params before query

- timestamp: 2026-02-21
  checked: listTransfersForWeek in src/lib/envelopes/firestore.ts (line 854-870)
  found: Query uses .where("weekStart", ">=", weekStart).where("weekStart", "<=", weekEnd).orderBy("createdAt", "desc")
  implication: Range filter on weekStart + orderBy on different field (createdAt) requires 3-field composite index

- timestamp: 2026-02-21
  checked: firestore.indexes.json - envelope_transfers index
  found: Only has userId ASC + weekStart ASC (2 fields). Missing createdAt DESC as 3rd field.
  implication: Firestore rejects query with "requires an index" error

- timestamp: 2026-02-21
  checked: listEnvelopesWithRemaining (line 1120-1123) - how home page queries transfers
  found: Uses .where("weekStart", "==", weekStartStr) with equality, no orderBy on createdAt. Works with existing index.
  implication: Home page transfers work fine; only listTransfersForWeek is broken due to orderBy

- timestamp: 2026-02-21
  checked: EnvelopeDetailPage.tsx line 48 - how transfer errors are handled
  found: Destructures only { data: transferData }, does NOT check transferError. Error check at line 130 only checks envError || txError.
  implication: Transfer fetch failure is silently ignored on detail page, showing empty transfers list

## Resolution

root_cause: listTransfersForWeek adds .orderBy("createdAt", "desc") to a query that already has range filters on weekStart. This requires a composite index (userId ASC, weekStart ASC, createdAt DESC) that doesn't exist in firestore.indexes.json or deployed to Firestore. The Firestore Admin SDK throws a "requires an index" error, which is caught by the API route's try/catch and returns a 500 { error: "Failed to fetch transfers." }. The EnvelopeDetailPage silently ignores transfer errors (only checks envError || txError), showing an empty transfers list instead of an error.
fix: Removed .orderBy("createdAt", "desc") from the Firestore query in listTransfersForWeek and moved the sort to JavaScript (sorting the returned documents by createdAt descending after fetching). The query now uses only .where("userId", "==", userId).where("weekStart", ">=", weekStart).where("weekStart", "<=", weekEnd) which works with the existing 2-field composite index (userId ASC, weekStart ASC).
verification: Build passes (npm run build), all 242 tests pass (npm test), changed file is lint-clean (biome check).
files_changed: [src/lib/envelopes/firestore.ts]
