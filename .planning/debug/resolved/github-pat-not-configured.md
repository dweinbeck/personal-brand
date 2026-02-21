---
status: resolved
trigger: "Builder Inbox shows 'GITHUB_PAT not configured. Cannot create GitHub issues.' when user tries to create a GitHub issue from the Builder Inbox UI."
created: 2026-02-21T00:00:00Z
updated: 2026-02-21T00:00:02Z
---

## Current Focus

hypothesis: CONFIRMED - Naming mismatch between env var and code
test: N/A - fix applied and verified
expecting: N/A
next_action: Archive and commit

## Symptoms

expected: User should be able to create GitHub issues from the Builder Inbox at /control-center/builder-inbox
actual: Error message "GITHUB_PAT not configured. Cannot create GitHub issues." appears when trying to create an issue
errors: "GITHUB_PAT not configured. Cannot create GitHub issues."
reproduction: Go to Builder Inbox, try to create a GitHub issue
started: Currently broken

## Eliminated

## Evidence

- timestamp: 2026-02-21T00:00:01Z
  checked: src/lib/gsd/destinations/github.ts line 9
  found: Code reads `process.env.GITHUB_PAT` directly (bypassing env validation)
  implication: Looks for env var named GITHUB_PAT

- timestamp: 2026-02-21T00:00:01Z
  checked: src/lib/env.ts lines 139-147 and 204-212
  found: TWO separate GitHub token schemas exist - GITHUB_TOKEN (line 139) and GITHUB_PAT (line 204), both optional
  implication: Duplicate/redundant env var definitions for the same purpose

- timestamp: 2026-02-21T00:00:01Z
  checked: .env.local.example line 37
  found: Only GITHUB_TOKEN is listed (not GITHUB_PAT)
  implication: Users are told to set GITHUB_TOKEN, not GITHUB_PAT

- timestamp: 2026-02-21T00:00:01Z
  checked: .env.local line 19
  found: GITHUB_TOKEN=ghp_0Tqw... is set, but GITHUB_PAT is NOT set
  implication: The token exists but under a different name

- timestamp: 2026-02-21T00:00:01Z
  checked: src/lib/github-admin.ts line 23
  found: Uses `serverEnv().GITHUB_TOKEN` (the correct, validated approach)
  implication: github-admin.ts works correctly; github.ts is the outlier

## Resolution

root_cause: Naming mismatch. The GSD github destination (src/lib/gsd/destinations/github.ts) reads `process.env.GITHUB_PAT` directly, but the actual env var set in .env.local is `GITHUB_TOKEN`. The env schema defines both GITHUB_TOKEN and GITHUB_PAT as optional, but only GITHUB_TOKEN is documented in .env.local.example and actually configured. Additionally, github.ts bypasses the centralized env validation by reading process.env directly instead of using serverEnv().
fix: Changed github.ts to use serverEnv().GITHUB_TOKEN (matching the pattern in github-admin.ts), removed the duplicate GITHUB_PAT schema from env.ts, and updated the error message and test assertions accordingly.
verification: All 236 tests pass (17 test files). TypeScript compilation clean. Biome lint clean on changed files.
files_changed:
  - src/lib/gsd/destinations/github.ts
  - src/lib/env.ts
  - src/lib/gsd/__tests__/reroute-route.test.ts
