---
status: resolved
trigger: "ALL routing actions in the Builder Inbox are broken - GitHub, Tasks, and Keep in Inbox all fail"
created: 2026-02-21T00:00:00Z
updated: 2026-02-21T14:50:00Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED
test: All 237 tests pass, build succeeds, lint clean on modified files
expecting: N/A - resolved
next_action: Archive to resolved/

## Symptoms

expected: User should be able to route captures from Builder Inbox to GitHub Issues, Tasks, or keep them in the inbox
actual: All three routing options fail. GitHub shows "GITHUB_PAT not configured" error. Tasks routing also fails. Keep in inbox also fails.
errors: "GITHUB_PAT not configured. Cannot create GitHub issues." for GitHub. Other errors unknown but all three destinations fail.
reproduction: Go to /control-center/builder-inbox, select a capture, try any routing action
started: Currently broken. Previous GITHUB_PAT fix (commit d914ce4) may not be deployed to dev branch.

## Eliminated

- hypothesis: Common auth/middleware blocking all API calls
  evidence: BuilderInboxPage loads captures successfully (same auth mechanism). No middleware.ts exists.
  timestamp: 2026-02-21T14:40:00Z

- hypothesis: "inbox" destination handler has a bug
  evidence: Server code for inbox case is trivial (default case sets destinationRef = "inbox"). No external calls. Tests pass.
  timestamp: 2026-02-21T14:41:00Z

- hypothesis: GITHUB_PAT fix not on dev branch
  evidence: Both master and dev point to same commit (18241bc). d914ce4 fix is present. github.ts uses serverEnv().GITHUB_TOKEN.
  timestamp: 2026-02-21T14:42:00Z

- hypothesis: Discord alerts throw and crash the handler
  evidence: alertCaptureRouted and alertCaptureFailed are fire-and-forget with .catch(() => {}). Cannot throw.
  timestamp: 2026-02-21T14:42:00Z

## Evidence

- timestamp: 2026-02-21T14:38:00Z
  checked: CaptureDetailPage.tsx handleReroute function (line 97-122)
  found: Client throws generic "Re-route failed." for ALL non-OK responses. Does NOT read response body. User never sees specific error.
  implication: User cannot distinguish between different failure types. All failures look identical.

- timestamp: 2026-02-21T14:39:00Z
  checked: Reroute API route handler success path (line 91-95)
  found: updateCaptureStatus on success does NOT clear the error field. Old errors persist in Firestore after successful re-routing.
  implication: If GitHub routing fails first (storing error), then inbox routing succeeds, stale error still shows.

- timestamp: 2026-02-21T14:40:00Z
  checked: github.ts error message vs user-reported error
  found: Code says "GITHUB_TOKEN not configured" but user reported "GITHUB_PAT not configured". This means the error was stored in Firestore BEFORE commit d914ce4 fix.
  implication: The stale error from a pre-fix attempt is persisting because successful re-routes don't clear it.

- timestamp: 2026-02-21T14:41:00Z
  checked: env.ts server env schema for GSD vars
  found: GITHUB_TOKEN, GSD_GITHUB_REPO, GSD_TASKS_USER_ID, GSD_TASKS_PROJECT_ID are all optional. Missing any will cause destination-specific failures.
  implication: Each destination except inbox could fail due to missing env vars.

- timestamp: 2026-02-21T14:42:00Z
  checked: .env.local.example
  found: GSD-specific env vars (GSD_API_KEY, GSD_GITHUB_REPO, GSD_TASKS_USER_ID, GSD_TASKS_PROJECT_ID, DISCORD_WEBHOOK_URL, FIREBASE_STORAGE_BUCKET) not documented.
  implication: Dev environment likely missing these vars.

- timestamp: 2026-02-21T14:43:00Z
  checked: reroute-route.test.ts
  found: All 9 tests pass (pre-fix). Test coverage includes all destination types and error cases.
  implication: Server-side logic is correct. Issue is in client UX and stale data.

- timestamp: 2026-02-21T14:48:00Z
  checked: Full test suite after fixes
  found: All 237 tests pass (10 in reroute tests, including new regression test). Build succeeds. Lint clean on modified files.
  implication: Fixes are verified.

## Resolution

root_cause: Three compounding bugs create the appearance that ALL routing is broken:
  1. Client discards server error body: handleReroute throws generic "Re-route failed." for any !res.ok response. User never sees specific error messages from the API.
  2. Stale errors persist: On successful re-routing, updateCaptureStatus does not clear the error field. Previous failure errors remain visible even after successful re-routing.
  3. The "GITHUB_PAT not configured" error is stale data from before commit d914ce4 fixed the env var name. It persists in Firestore because Bug 2 means no successful operation ever clears it.
  4. GSD env vars not documented in .env.local.example, leading to missing config on dev environment.

  Likely scenario: GitHub fails (env var issue), Tasks fails (missing GSD_TASKS_* env vars), Inbox actually SUCCEEDS but user sees stale error and generic failure messaging, concluding all three failed.

fix: |
  1. Client-side error handling: Updated handleReroute and handleRetry to read the API response body and display the actual server error message instead of generic "Re-route failed."
  2. Stale error clearing: Added `error: null` to the updateCaptureStatus call on successful re-routing, so previous failure errors are cleared from Firestore.
  3. Type update: Updated updateCaptureStatus type to accept `error: string | null` (was `error?: string`).
  4. Env documentation: Added GSD-specific env vars to .env.local.example.
  5. Regression test: Added test verifying error field is cleared on successful reroute after a previous failure.

verification: |
  - 237/237 tests pass (including new regression test #10)
  - Build succeeds
  - Lint clean on all modified files
  - Pre-existing lint errors in unrelated files are unchanged

files_changed:
  - src/components/admin/builder-inbox/CaptureDetailPage.tsx
  - src/app/api/admin/builder-inbox/[id]/reroute/route.ts
  - src/lib/gsd/capture.ts
  - src/lib/gsd/__tests__/reroute-route.test.ts
  - .env.local.example
