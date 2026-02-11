# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** Visitors can understand who Dan is and see proof of his work within 60 seconds
**Current focus:** v1.7 — Phases 27+28 (parallelizable)

## Current Position

Phase: 27-28 of 30 (executing in parallel)
Plan: 27-01 complete, 27-02 complete, 27-03 complete, 28-01 complete, 28-03 complete
Status: In progress — Phase 27 complete (3/3 plans), Phase 28 in progress (2/4 plans, 28-02 may also be complete)
Last activity: 2026-02-11 — Completed 28-03-PLAN.md (Individual asset uploads + manifest)

Progress: v1.0-v1.6 SHIPPED | v1.7: [█████░░░░░] 5/10 plans

## Performance Metrics

**Cumulative:**
- Total milestones shipped: 7 (v1.0 through v1.6)
- Total phases completed: 26
- Total plans completed: 51
- Timeline: Jan 18 → Feb 10, 2026 (24 days)

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phases 27+28 parallelizable (different repos: main site vs scraper service)
- Phase 29 depends on both 27+28 (schema alignment + backend APIs)
- Phase 30 depends on 29
- Cross-repo milestone: Phase 28 targets brand-scraper repo, all others target main site
- [28-01] Assets uploaded individually to GCS, ZIP created on-demand (not buffered in memory)
- [28-01] PipelineContext.onEvent callback is optional for backward compatibility
- [28-03] Assets downloaded to buffer (not disk) then uploaded individually to GCS
- [28-03] No automatic zip on job completion; zip is on-demand (Plan 04)
- [28-03] Manifest persisted to DB only when at least one asset uploaded
- [27-03] Used .passthrough() on all Zod schemas for forward-compatibility with scraper service changes
- [27-03] ExtractedField wrapper pattern: access value via entry.value.*, confidence via entry.confidence
- [27-03] Defensive safeParse at UI layer (not just API proxy) with fallback download UI
- [27-02] Inline card rendering in AppsGrid (not reusing AppCard) for different button styling (primary full-width)
- [27-02] Removed stale project references from sitemap.ts (blocking fix after 27-01 deleted routes)
- [27-01] Kept src/lib/github.ts and src/types/project.ts intact (still used by home page FeaturedProjects)

### Pending Todos

None.

### Blockers/Concerns

- Brand scraper schema mismatch — RESOLVED by Phase 27-03 (Zod schemas now match real taxonomy)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Fix FRD Interviewer link and lint errors | 2026-02-08 | a0c31f8 | [001-fix-frd-link-and-lint-errors](./quick/001-fix-frd-link-and-lint-errors/) |
| 002 | Fix broken documentation links on project pages | 2026-02-08 | 8377843 | [002-fix-broken-documentation-links-on-projec](./quick/002-fix-broken-documentation-links-on-projec/) |

## Session Continuity

Last session: 2026-02-11
Stopped at: Completed 28-03-PLAN.md (Individual asset uploads + manifest)
Resume file: None

## Next Step

Continue parallel execution:
- Phase 27: COMPLETE (all 3 plans done: 27-01, 27-02, 27-03)
- Phase 28: 28-01 and 28-03 complete. 28-02 likely complete (commits visible). Next: 28-04 (on-demand zip endpoint)
