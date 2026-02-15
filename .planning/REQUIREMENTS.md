# Requirements: dan-weinbeck.com

**Defined:** 2026-02-15
**Core Value:** Visitors can understand who Dan is and see proof of his work within 60 seconds

## v1.9 Requirements

Requirements for v1.9 — Site Restructure & Polish. Each maps to roadmap phases.

### Navigation & Architecture

- [ ] **NAV-01**: Custom GPTs page renamed to "Tools" at /tools with consolidated card grid (New Phase Planner, FRD Interviewer, FRD Generator) plus Research Assistant and Digital Envelopes moved from /apps
- [ ] **NAV-02**: Standalone /assistant page replaced with navbar popup chatbot widget that opens bottom-right, persists during session, and collapses with X button
- [ ] **NAV-03**: Navbar link order updated to: Home, Apps, Tools, Building Blocks, Contact, Control Center, Ask My Assistant, Sign in/Account
- [ ] **NAV-04**: Brand scraper removed from Control Center (link and page deleted; access via /apps only)

### Home Page

- [ ] **HOME-01**: Hero section layout improved — wider text column, image aligned to top of "Dan Weinbeck" text, second paragraph reflowed below image
- [ ] **HOME-02**: Technology stack tags restored on app cards in home AppsGrid and /apps page
- [ ] **HOME-03**: "Sign Up or Sign in" subtitle removed from Apps section; Building Blocks subtitle changed to "Learn about AI Development with Building Block Tutorials"
- [ ] **HOME-04**: Reading time displayed on building block cards below description, above tags (home + /building-blocks listing)
- [ ] **HOME-05**: New "Explore Development Tools" section added after Apps grid, displaying tools from the new Tools page

### Bug Fixes

- [ ] **BUG-01**: Brand scraper URL input enables Scrape button after valid URL is entered
- [ ] **BUG-02**: Brand scraper in Control Center no longer returns "invalid or expired token"
- [ ] **BUG-03**: AI assistant RAG backend returns relevant responses (knowledge base synced, not "no repos indexed")
- [ ] **BUG-04**: Research assistant chat endpoint returns results instead of errors
- [ ] **BUG-05**: Research assistant conversation history endpoint returns data instead of errors

### Polish

- [ ] **POL-01**: "Other ways to contact me" section removed from Contact page
- [ ] **POL-02**: All three contact page buttons (Email Dan, Copy Email, etc.) unified with same blue format and glowing gold hover
- [ ] **POL-03**: FRD building block links to actual FRD Generator tool + listed in Tools page
- [ ] **POL-04**: Brand scraper Scrape button height matches the URL text input height

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content
- **CONT-01**: Real article content with MDX authoring pipeline
- **CONT-02**: Writing page displays real articles (replaces lorem ipsum)

### Tools Enhancement
- **TOOL-01**: 60-Second Lesson tool (pricing entry exists, tool inactive)
- **TOOL-02**: Bus Text tool (pricing entry exists, tool inactive)

### Tasks Enhancement
- **TASK-01**: Effort distribution visualization (bar chart across sections)
- **TASK-02**: Effort badges in board view cards with column totals
- **TASK-03**: Demo workspace data preservation after sign-up
- **TASK-04**: Guided demo tour
- **TASK-05**: Credit balance display in todoist app header
- **TASK-06**: Billing history for tasks app charges

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full /assistant page redesign | Replaced by popup widget — no standalone page needed |
| Moving Apps to /tools | Apps and Tools are distinct categories — Apps are full applications, Tools are single-function utilities |
| New paid tools activation | Pricing entries exist but tools not built; defer to v2+ |
| Todoist feature parity | Not needed for personal productivity tool |
| Writing content creation | Defer until content pipeline is ready |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 36 | Pending |
| NAV-02 | Phase 37 | Pending |
| NAV-03 | Phase 36 | Pending |
| NAV-04 | Phase 36 | Pending |
| HOME-01 | Phase 38 | Pending |
| HOME-02 | Phase 38 | Pending |
| HOME-03 | Phase 38 | Pending |
| HOME-04 | Phase 38 | Pending |
| HOME-05 | Phase 38 | Pending |
| BUG-01 | Phase 39 | Pending |
| BUG-02 | Phase 39 | Pending |
| BUG-03 | Phase 39 | Pending |
| BUG-04 | Phase 39 | Pending |
| BUG-05 | Phase 39 | Pending |
| POL-01 | Phase 40 | Pending |
| POL-02 | Phase 40 | Pending |
| POL-03 | Phase 40 | Pending |
| POL-04 | Phase 40 | Pending |

**Coverage:**
- v1.9 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-02-15*
*Last updated: 2026-02-15 after roadmap creation*
