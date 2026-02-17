# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-15)

**Core value:** Visitors can understand who Dan is and see proof of his work within 60 seconds
**Current focus:** Phase 41 — Envelopes Enhancements (Fund Transfers, Analytics Redesign, Weekly Rollover)

## Current Position

Phase: 41 (Envelopes Enhancements)
Plan: 1 of 4 complete in current phase
Status: Executing Phase 41
Last activity: 2026-02-17 - Completed 41-01: Fund transfer backend (types, Firestore ops, API route)

Progress: [##--------] 25% — Phase 41 in progress

## Performance Metrics

**Cumulative:**
- Total milestones shipped: 9 (v1.0 through v1.8)
- Total phases completed: 38
- Total plans completed: 104
- Timeline: Jan 18 -> Feb 15, 2026 (29 days)

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
| 37-chatbot-popup-widget | 02 | 7 min | 2 | 1 |
| 38-home-page-enhancements | 01 | 18 min | 2 | 5 |
| 38-home-page-enhancements | 02 | 20 min | 2 | 4 |
| 39-bug-fixes | 01 | 12 min | 2 | 5 |
| 39-bug-fixes | 02 | 12 min | 2 | 9 |
| 40-polish | 01 | 4 min | 2 | 5 |
| quick-006 | 01 | 2 min | 1 | 2 |
| quick-007 | 01 | 2 min | 1 | 3 |
| 40.1-testing-feedback-fixes | 01 | 2 min | 1 | 2 |
| 40.1-testing-feedback-fixes | 02 | 13 min | 1 | 2 |
| 40.1-testing-feedback-fixes | 03 | 12 min | 2 | 3 |
| 40.1-testing-feedback-fixes | 04 | 12 min | 2 | 3 |
| 41-envelopes-enhancements | 01 | 6 min | 2 | 4 |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
- [Phase 36]: Reused Card + CardButtonLabel + gold-light tag badge pattern from AppCard for tool cards
- [Phase 36]: Ask My Assistant link added for all users, pointing to /assistant until Phase 37 popup conversion
- [Phase 36]: About, Custom GPTs, Assistant removed from navbar; replaced by new hierarchy (Home, Apps, Tools, Building Blocks, Contact)
- [Phase 37]: ChatWidgetProvider wraps inside AuthProvider for auth access in popup
- [Phase 37]: Ask My Assistant converted from Link to button toggle, no longer navigates to /assistant
- [Phase 37]: Popup mode hides ExitRamps and PrivacyDisclosure for space efficiency
- [Phase 37]: Keep assistant/page.tsx as redirect rather than deleting, so bookmarks get 307 not 404
- [Phase 38]: Used items-start with self-center on mobile for hero image top-alignment on desktop
- [Phase 38]: Tech stack tag styling reuses TutorialCard additional tag pattern for visual consistency
- [Phase 38]: Reading time uses 200 wpm average with Math.ceil rounding
- [Phase 38]: ToolsShowcase placed between AppsGrid and BuildingBlocksCta in render order
- [Phase 39]: Used getIdToken callback pattern instead of static token state for fresh auth on every brand scraper API request
- [Phase 39]: URL validation uses URL constructor with protocol check for http/https
- [Phase 39]: Map FastAPI 500 errors to knowledge-base re-sync message to surface BUG-03 root cause
- [Phase 39]: Return 503 for Firestore index errors to signal temporary unavailability
- [Phase 39]: Extract error detail from FastAPI response body by checking detail/error/message fields
- [Phase 40]: Unified CTA button style: blue gradient with gold glow hover for all prominent action buttons
- [Phase 40]: Added Try the Tools section at end of frd.mdx for FRD Generator discoverability
- [Phase quick-006]: Moved Envelopes and Research from tools to apps section with concise display names
- [Phase quick-007]: Moved mb-10 from Building Blocks h2 to new subtitle p tag for consistent title/subtitle spacing pattern
- [Phase 40.1-01]: Reused existing EnvelopeForm edit mode for in-place budget editing
- [Phase 40.1-01]: Pencil icon uses gold/primary styling to distinguish from red delete button
- [Phase 40.1-03]: Email dedup query runs outside transaction; stub doc with canonicalUid for duplicate prevention
- [Phase 40.1-03]: Consolidation keeps user with more credits; merges all lifetime stats atomically with audit ledger entry
- [Phase 40.1-04]: Client-side transaction filtering for detail page rather than new API endpoint
- [Phase 40.1-04]: Conditional Link wrapper pattern for clickable/non-clickable card states
- [Phase 40.1-04]: Simplified 4-column transaction table on detail page (no envelope or actions columns)
- [Phase 40.1-02]: Keep last known balance on Firestore permission errors instead of clearing to null
- [Phase 40.1-02]: Use nullish coalescing (0 fallback) for undefined token counts rather than optional chaining
- [Phase 41-01]: Compute source remaining outside transaction, use runTransaction only for ownership check + write
- [Phase 41-01]: Return validation errors (insufficient balance, self-transfer, not found) as 400 not 500

### Roadmap Evolution

- Phase 41 added: Envelopes Enhancements — Fund transfers, analytics redesign, and weekly rollover workflow

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
| 005 | Fix HeroSection layout - move contact icons below both paragraphs, center justified | 2026-02-16 | 95ba586 | [5-fix-herosection-layout-move-contact-icon](./quick/5-fix-herosection-layout-move-contact-icon/) |
| 006 | Move Envelopes and Research to apps section with concise display names | 2026-02-16 | 2e33227 | [6-move-envelopes-and-research-to-apps-sect](./quick/6-move-envelopes-and-research-to-apps-sect/) |
| 007 | Update homepage section subtitles for better clarity | 2026-02-16 | 9263fea | [7-update-homepage-section-subtitles-for-ap](./quick/7-update-homepage-section-subtitles-for-ap/) |
| 008 | Fix strange characters on Envelopes card | 2026-02-16 | fe6f337 | [8-fix-strange-characters-on-envelopes-card](./quick/8-fix-strange-characters-on-envelopes-card/) |
| 009 | Render Research Assistant results as formatted markdown | 2026-02-17 | dc2fcc9 | [9-render-research-assistant-results-as-for](./quick/9-render-research-assistant-results-as-for/) |

## Session Continuity

Last session: 2026-02-17
Stopped at: Completed 41-01-PLAN.md
Resume file: None

## Next Step

Execute 41-02-PLAN.md (Fund Transfer UI components).
