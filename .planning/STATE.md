# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** Visitors can understand who Dan is and see proof of his work within 60 seconds
**Current focus:** v1.7 — Phase 30 in progress (2 of 3 plans complete)

## Current Position

Phase: 30 of 30 (Assets Page + User History)
Plan: 02 of 03 complete
Status: In progress
Last activity: 2026-02-11 — Completed 30-02-PLAN.md

Progress: v1.0-v1.6 SHIPPED | v1.7: [████████████░] 12/13 plans (3/4 phases, 30 in progress)

## Performance Metrics

**Cumulative:**
- Total milestones shipped: 7 (v1.0 through v1.6)
- Total phases completed: 29
- Total plans completed: 64
- Timeline: Jan 18 → Feb 11, 2026 (25 days)

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
- [28-02] Events persisted incrementally via jsonb_set SQL during processing (not only at end)
- [28-02] Event persistence failures are non-fatal (logged, not thrown)
- [28-02] Events capped at 200 entries to prevent JSONB bloat
- [28-03] Assets downloaded to buffer (not disk) then uploaded individually to GCS
- [28-03] No automatic zip on job completion; zip is on-demand (Plan 04)
- [28-03] Manifest persisted to DB only when at least one asset uploaded
- [28-04] Assets manifest API uses snake_case fields mapped from camelCase DB columns
- [28-04] Individual asset signed URL failures non-fatal (returned without signed_url)
- [28-04] Zip caching: existing zip gets fresh signed URL, deleted zip triggers recreation
- [28-04] 409 Conflict for zip on non-terminal jobs or jobs with no assets
- [27-03] Used .passthrough() on all Zod schemas for forward-compatibility with scraper service changes
- [27-03] ExtractedField wrapper pattern: access value via entry.value.*, confidence via entry.confidence
- [27-03] Defensive safeParse at UI layer (not just API proxy) with fallback download UI
- [27-02] Inline card rendering in AppsGrid (not reusing AppCard) for different button styling (primary full-width)
- [27-02] Removed stale project references from sitemap.ts (blocking fix after 27-01 deleted routes)
- [27-01] Kept src/lib/github.ts and src/types/project.ts intact (still used by home page FeaturedProjects)
- [29-01] All new jobStatusSchema fields are nullish for backward compat with pre-Phase-28 jobs
- [29-01] Font loading is best-effort (non-fatal) — UI renders fallback if Google Fonts fails
- [29-01] Zip proxy uses 60s timeout for slow GCS operations
- [29-01] Snake_case throughout new schemas per Phase 28-04 API convention
- [29-02] ScrapeProgressPanel uses useMemo to derive page/file lists from events array
- [29-02] BrandCardColors follows admin ColorPaletteCard clipboard pattern for consistency
- [29-02] BrandCardDownloads creates temporary anchor for programmatic zip download
- [29-02] BrandCardDescription finds first source==="google_fonts" entry for primary font
- [29-03] BrandCard is pure composition (~52 lines) with zero business logic
- [29-03] Progress panel gated on events.length > 0 to avoid empty panel flash
- [29-03] BrandCard render requires token (non-null) for authenticated zip downloads
- [30-01] Compound doc ID (uid_jobId) for idempotent history writes
- [30-01] Fire-and-forget pattern for all history writes (non-blocking)
- [30-01] ScrapeHistoryEntry omits uid field (server-internal only)
- [30-02] Fresh token per zip download action (not cached mount token) to prevent expiry
- [30-02] Single category skips section headers for cleaner layout
- [30-02] Non-image file type label derived from content_type subtype with mapping table

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
Stopped at: Completed 30-02-PLAN.md
Resume file: None

## Next Step

Phase 30, Plan 03 (history UI) — final plan of v1.7.
