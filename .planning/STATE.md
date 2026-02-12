# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** Visitors can understand who Dan is and see proof of his work within 60 seconds
**Current focus:** v1.8 Tasks App -- Phase 34 (Weekly Credit Gating) in progress

## Current Position

Phase: 34 of 35 (Weekly Credit Gating) -- in progress
Plan: 1 of 3 in current phase (34-01 complete)
Status: 34-01 complete -- billing API for tasks app weekly credit gating
Last activity: 2026-02-12 -- Completed 34-01 billing API

Progress: [######░░░░] 64% (7/11 plans)

## Performance Metrics

**Cumulative:**
- Total milestones shipped: 8 (v1.0 through v1.7)
- Total phases completed: 33
- Total plans completed: 84
- Timeline: Jan 18 -> Feb 12, 2026 (26 days)

**v1.8 Velocity:**
- Plans completed: 7
- Average duration: 4 min
- Total execution time: 31 min

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 31-help-tips | 01 | 4 min | 2 | 9 |
| 32-effort-scoring | 01 | 4 min | 2 | 7 |
| 32-effort-scoring | 02 | 3 min | 2 | 7 |
| 33-multi-user-auth | 01 | 4 min | 2 | 7 |
| 33-multi-user-auth | 02 | 4 min | 2 | 10 |
| 33-multi-user-auth | 03 | 6 min | 2 | 28 |
| 34-weekly-credit-gating | 01 | 6 min | 2 | 4 |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Recent:
- Tasks app as separate standalone service (same multi-repo pattern as brand-scraper)
- Toggletip interaction model for help tips: click pins, hover opens with delay, centralized catalog pattern
- Effort field is nullable Int (null = unscored, not 0) to distinguish unscored from scored tasks
- EFFORT_VALUES extracted to src/lib/effort.ts as shared constant with EffortValue type
- computeEffortSum is a pure function; caller responsible for excluding subtasks to avoid double-counting
- Use onIdTokenChanged (not onAuthStateChanged) for automatic cookie refresh on token rotation
- Cookie name __session matches Cloud Run convention for single-cookie passthrough
- Server-side auth.ts uses server-only package to prevent client import
- Exclude scripts/ from tsconfig after schema contraction (one-time utils, not app code)
- Wire userId into create actions during schema contraction (blocking build fix, not Plan 03 scope creep)
- Server actions accept idToken as first param (explicit client-to-server token flow, not cookie-based)
- getProject strips workspace from return to avoid leaking ownership structure
- Section/Project ownership via workspace chain (no direct userId column needed)
- Mirror checkEnvelopeAccess pattern exactly for tasks billing (same free-week, paid-week, debit flow)
- Inline types in tasks.ts rather than separate types file (simplicity for single-function module)

### Pending Todos

None.

### Blockers/Concerns

- Two-repo coordination in Phase 34: billing API in personal-brand, integration in todoist

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Fix FRD Interviewer link and lint errors | 2026-02-08 | a0c31f8 | [001-fix-frd-link-and-lint-errors](./quick/001-fix-frd-link-and-lint-errors/) |
| 002 | Fix broken documentation links on project pages | 2026-02-08 | 8377843 | [002-fix-broken-documentation-links-on-projec](./quick/002-fix-broken-documentation-links-on-projec/) |

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 34-01-PLAN.md (Billing API)
Resume file: None

## Next Step

Continue Phase 34 -- execute 34-02-PLAN.md
