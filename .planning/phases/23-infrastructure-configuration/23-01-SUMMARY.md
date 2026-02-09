---
phase: 23-infrastructure-configuration
plan: 01
subsystem: infra
tags: [firestore, firebase, composite-indexes, stripe, iam, seed-script, deployment]

# Dependency graph
requires:
  - phase: 22-code-validation-commit
    provides: Billing code (firestore.ts queries, tools.ts seedToolPricing)
provides:
  - Firestore composite index definitions for billing queries
  - Updated firebase.json referencing indexes and rules
  - Billing seed script for CLI execution
  - Corrected DEPLOYMENT.md with Cloud Run SA IAM and Firestore setup instructions
affects: [23-02-infrastructure-deploy, 24-integration-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Infrastructure-as-code: Firestore indexes defined in firestore.indexes.json"
    - "Seed scripts in scripts/ directory using tsx for TypeScript execution"

key-files:
  created:
    - firestore.indexes.json
    - scripts/seed-billing.ts
  modified:
    - firebase.json
    - docs/DEPLOYMENT.md

key-decisions:
  - "Composite indexes for three billing queries (getUserUsage, findUsageByExternalJobId, getUserPurchases)"
  - "Seed script uses @/ path alias resolved by tsx via tsconfig.json paths"
  - "IAM binding corrected to Cloud Run SA (cloudrun-site@) for runtime secret access"

patterns-established:
  - "Firestore indexes: all composite indexes declared in firestore.indexes.json at project root"
  - "Seed scripts: standalone TypeScript scripts in scripts/ run via npx tsx"

# Metrics
duration: 2min
completed: 2026-02-09
---

# Phase 23 Plan 01: Infrastructure Configuration Artifacts Summary

**Firestore composite indexes for billing queries, seed script wrapping seedToolPricing(), and corrected DEPLOYMENT.md with Cloud Run SA IAM bindings**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-09T22:33:52Z
- **Completed:** 2026-02-09T22:36:17Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `firestore.indexes.json` with 3 composite indexes matching billing Firestore queries
- Updated `firebase.json` to reference both `firestore.rules` and `firestore.indexes.json`
- Created `scripts/seed-billing.ts` wrapping existing `seedToolPricing()` for CLI execution
- Fixed DEPLOYMENT.md IAM instructions from Cloud Build SA to Cloud Run SA (`cloudrun-site@`)
- Added Firestore Setup section to DEPLOYMENT.md with deploy and seed commands
- Confirmed `firestore.rules` denies all client access (INFRA-09 satisfied)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Firestore indexes and update firebase.json** - `6bb86f9` (chore)
2. **Task 2: Create seed script and fix DEPLOYMENT.md IAM instructions** - `95127fe` (chore)

## Files Created/Modified

- `firestore.indexes.json` - 3 composite index definitions for billing_tool_usage and billing_purchases
- `firebase.json` - Added indexes field referencing firestore.indexes.json
- `scripts/seed-billing.ts` - CLI seed script importing and calling seedToolPricing()
- `docs/DEPLOYMENT.md` - Fixed IAM SA, added Firestore Setup section

## Decisions Made

- **Composite index structure:** Used standard Firebase index format with `collectionGroup`, `queryScope: COLLECTION`, and ordered fields matching the actual query patterns in `src/lib/billing/firestore.ts`
- **Seed script approach:** Import-and-call wrapper using `@/` path aliases resolved by tsx via tsconfig.json, keeping logic in the existing `seedToolPricing()` function
- **IAM correction:** Changed from `PROJECT_NUMBER@cloudbuild.gserviceaccount.com` to `cloudrun-site@PROJECT_ID.iam.gserviceaccount.com` because Cloud Run reads secrets at runtime via its service account, not Cloud Build
- **Test-mode placeholders:** Used `sk_test_` prefix in Stripe secret creation commands to match Phase 23 scope

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Plan 02 will handle the actual CLI deployment steps.

## Next Phase Readiness

- All infrastructure-as-code artifacts are created and version-controlled
- Ready for Plan 02: CLI deployment of indexes, rules, secrets, and seed data
- Blockers: Firebase CLI and GCP CLI authentication needed for Plan 02 execution

---
*Phase: 23-infrastructure-configuration*
*Completed: 2026-02-09*
