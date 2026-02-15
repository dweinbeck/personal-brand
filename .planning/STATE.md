# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-15)

**Core value:** Visitors can understand who Dan is and see proof of his work within 60 seconds
**Current focus:** v1.9 Phase 37 — Chatbot Popup Widget

## Current Position

Phase: 37 of 40 (Chatbot Popup Widget)
Plan: 1 of 2 in current phase
Status: Plan 01 Complete
Last activity: 2026-02-15 — Completed 37-01 (Popup widget core)

Progress: [#####.....] 50%

## Performance Metrics

**Cumulative:**
- Total milestones shipped: 9 (v1.0 through v1.8)
- Total phases completed: 36
- Total plans completed: 93
- Timeline: Jan 18 -> Feb 12, 2026 (26 days)

**v1.8 Velocity:**
- Plans completed: 11
- Average duration: 4 min
- Total execution time: 46 min

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 31-help-tips | 01 | 4 min | 2 | 9 |
| 32-effort-scoring | 01 | 4 min | 2 | 7 |
| 32-effort-scoring | 02 | 3 min | 2 | 7 |
| 33-multi-user-auth | 01 | 4 min | 2 | 7 |
| 33-multi-user-auth | 02 | 4 min | 2 | 10 |
| 33-multi-user-auth | 03 | 6 min | 2 | 28 |
| 34-weekly-credit-gating | 01 | 6 min | 2 | 4 |
| 34-weekly-credit-gating | 02 | 4 min | 2 | 10 |
| 34-weekly-credit-gating | 03 | 4 min | 2 | 3 |
| 35-demo-workspace | 01 | 4 min | 2 | 8 |
| 35-demo-workspace | 02 | 3 min | 2 | 6 |
| 36-tools-page-and-nav-restructure | 01 | 10 min | 2 | 4 |
| 36-tools-page-and-nav-restructure | 02 | 8 min | 2 | 3 |
| 37-chatbot-popup-widget | 01 | 10 min | 2 | 6 |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
- [Phase 36]: Reused Card + CardButtonLabel + gold-light tag badge pattern from AppCard for tool cards
- [Phase 36]: Ask My Assistant link added for all users, pointing to /assistant until Phase 37 popup conversion
- [Phase 36]: About, Custom GPTs, Assistant removed from navbar; replaced by new hierarchy (Home, Apps, Tools, Building Blocks, Contact)
- [Phase 37]: ChatWidgetProvider wraps inside AuthProvider for auth access in popup
- [Phase 37]: Ask My Assistant converted from Link to button toggle, no longer navigates to /assistant
- [Phase 37]: Popup mode hides ExitRamps and PrivacyDisclosure for space efficiency

### Pending Todos

None.

### Blockers/Concerns

- Phase 39 (Bug Fixes): BUG-03 requires chatbot-assistant repo access for knowledge base sync
- Phase 39 (Bug Fixes): BUG-04/BUG-05 may require research-assistant backend repo access

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Fix FRD Interviewer link and lint errors | 2026-02-08 | a0c31f8 | [001-fix-frd-link-and-lint-errors](./quick/001-fix-frd-link-and-lint-errors/) |
| 002 | Fix broken documentation links on project pages | 2026-02-08 | 8377843 | [002-fix-broken-documentation-links-on-projec](./quick/002-fix-broken-documentation-links-on-projec/) |
| 003 | Fix invisible sign-in prompt on /envelopes | 2026-02-15 | d290ffd | [003-fix-invisible-sign-in-prompt-and-google-](./quick/003-fix-invisible-sign-in-prompt-and-google-/) |
| 004 | Create Tasks app landing page with feature highlights | 2026-02-15 | 477b93c | [004-create-tasks-app-landing-page-with-featu](./quick/004-create-tasks-app-landing-page-with-featu/) |

## Session Continuity

Last session: 2026-02-15
Stopped at: Completed 37-01-PLAN.md
Resume file: None

## Next Step

Ready for 37-02-PLAN.md.
