# Roadmap: dan-weinbeck.com

## Milestones

- ✅ **v1.0 MVP** — Phases 1-6 (shipped 2026-02-03)
- ✅ **v1.1 Page Buildout & Polish** — Phases 7-10.1 (shipped 2026-02-05)
- ✅ **v1.2 Content & Data Integration** — Phases 11-12 (shipped 2026-02-07)
- ✅ **v1.3 Assistant Backend Integration** — Phases 13-16 (shipped 2026-02-08)
- ✅ **v1.4 Control Center** — Phases 17-21 (shipped 2026-02-09)
- ✅ **v1.5 Billing & Credits System** — Phases 22-25 (shipped 2026-02-10)
- ✅ **v1.6 Apps Hub Page** — Phase 26 (shipped 2026-02-10)
- ✅ **v1.7 Apps-first Home + Brand Scraper Overhaul** — Phases 27-30 (shipped 2026-02-11)
- ✅ **v1.8 Tasks App** — Phases 31-35 (shipped 2026-02-12)
- 🚧 **v1.9 Site Restructure & Polish** — Phases 36-40 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-6) — SHIPPED 2026-02-03</summary>

- [x] Phase 1: Scaffold & Navigation (2/2 plans)
- [x] Phase 2: Home Page (2/2 plans)
- [x] Phase 2.1: Building Blocks (2/2 plans)
- [x] Phase 3: Projects (2/2 plans)
- [x] Phase 4: Contact (2/2 plans)
- [x] Phase 5: SEO, Polish & Stubs (2/2 plans)
- [x] Phase 6: Infrastructure & Deploy (2/2 plans)

</details>

<details>
<summary>✅ v1.1 Page Buildout & Polish (Phases 7-10.1) — SHIPPED 2026-02-05</summary>

- [x] Phase 7-10: Page Redesigns (4 plans)
- [x] Phase 10.1: About Page (2/2 plans)

</details>

<details>
<summary>✅ v1.2 Content & Data Integration (Phases 11-12) — SHIPPED 2026-02-07</summary>

- [x] Phase 11: GitHub API Integration (3/3 plans)
- [x] Phase 12: About Page Logos (1/1 plan)

</details>

<details>
<summary>✅ v1.3 Assistant Backend Integration (Phases 13-16) — SHIPPED 2026-02-08</summary>

- [x] Phase 13: Proxy Integration (2/2 plans)
- [x] Phase 14: Citation & Confidence UI (2/2 plans)
- [x] Phase 15: Dead Code Removal (2/2 plans)
- [x] Phase 16: Dependency & Environment Cleanup (1/1 plan)

</details>

<details>
<summary>✅ v1.4 Control Center (Phases 17-21) — SHIPPED 2026-02-09</summary>

- [x] Phase 17: Control Center Navigation (1/1 plan)
- [x] Phase 18: Content Editor Infrastructure (2/2 plans)
- [x] Phase 19: Content Editor UI (1/1 plan)
- [x] Phase 19.1: Custom GPTs Page (1/1 plan)
- [x] Phase 20: Brand Scraper API Proxy (1/1 plan)
- [x] Phase 21: Brand Scraper UI (2/2 plans)

</details>

<details>
<summary>✅ v1.5 Billing & Credits System (Phases 22-25) — SHIPPED 2026-02-10</summary>

- [x] Phase 22: Code Validation & Commit (1/1 plan)
- [x] Phase 23: Infrastructure Configuration (2/2 plans)
- [x] Phase 24: Deploy & Smoke Test (2/2 plans)
- [x] Phase 25: Go Live (1/1 plan)

</details>

<details>
<summary>✅ v1.6 Apps Hub Page (Phase 26) — SHIPPED 2026-02-10</summary>

- [x] Phase 26: Apps Hub Page (1/1 plan)

</details>

<details>
<summary>✅ v1.7 Apps-first Home + Brand Scraper Overhaul (Phases 27-30) — SHIPPED 2026-02-11</summary>

- [x] Phase 27: Apps-first Home & Schema Alignment (3/3 plans)
- [x] Phase 28: Scraper Service Backend (4/4 plans)
- [x] Phase 29: Brand Card & Progress UI (3/3 plans)
- [x] Phase 30: Assets Page & User History (3/3 plans)

</details>

<details>
<summary>✅ v1.8 Tasks App (Phases 31-35) — SHIPPED 2026-02-12</summary>

- [x] Phase 31: Help Tips (1/1 plan) — completed 2026-02-11
- [x] Phase 32: Effort Scoring (2/2 plans) — completed 2026-02-11
- [x] Phase 33: Multi-User + Auth (3/3 plans) — completed 2026-02-12
- [x] Phase 34: Weekly Credit Gating (3/3 plans) — completed 2026-02-12
- [x] Phase 35: Demo Workspace (2/2 plans) — completed 2026-02-12

</details>

### 🚧 v1.9 Site Restructure & Polish (In Progress)

**Milestone Goal:** Restructure site navigation around Tools and Apps categories, replace standalone assistant page with popup chatbot, enhance home page sections, fix cross-repo bugs, and polish contact page and UI consistency.

- [ ] **Phase 36: Tools Page & Nav Restructure** — Rename Custom GPTs to Tools, reorder navbar, remove brand scraper from Control Center
- [ ] **Phase 37: Chatbot Popup Widget** — Replace /assistant page with persistent bottom-right popup chatbot
- [ ] **Phase 38: Home Page Enhancements** — Hero layout, tech tags, reading time, subtitles, Dev Tools section
- [ ] **Phase 39: Bug Fixes** — Brand scraper bugs, assistant RAG sync, research assistant API fixes
- [ ] **Phase 40: Polish** — Contact page cleanup, button styles, FRD links, scraper button height

## Phase Details

### Phase 36: Tools Page & Nav Restructure
**Goal**: Visitors navigate a clean site hierarchy where Apps are full applications and Tools are single-function dev utilities, with a streamlined navbar and no duplicate access paths
**Depends on**: Phase 35 (v1.8 complete)
**Requirements**: NAV-01, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. Visiting /tools shows a card grid with New Phase Planner, FRD Interviewer, FRD Generator, Research Assistant, and Digital Envelopes — Research and Envelopes no longer appear on /apps
  2. Navbar displays links in order: Home, Apps, Tools, Building Blocks, Contact, Control Center, Ask My Assistant, Sign in/Account
  3. Brand scraper link and page are removed from Control Center — users access brand scraper only via /apps
  4. /custom-gpts redirects to /tools (no broken bookmarks)
**Plans**: 2 plans

Plans:
- [ ] 36-01-PLAN.md — Create /tools page, move items off /apps, redirect /custom-gpts
- [ ] 36-02-PLAN.md — Reorder navbar links, remove brand scraper from Control Center

### Phase 37: Chatbot Popup Widget
**Goal**: Visitors can ask Dan's AI assistant from any page without navigating away, via a persistent popup that survives page navigation
**Depends on**: Phase 36 (navbar includes "Ask My Assistant" trigger)
**Requirements**: NAV-02
**Success Criteria** (what must be TRUE):
  1. Clicking "Ask My Assistant" in the navbar opens a chatbot widget anchored to the bottom-right of the viewport
  2. The widget persists across page navigation within the same session (conversation is not lost when changing pages)
  3. The widget collapses via an X button and can be reopened without losing conversation history
  4. The standalone /assistant page no longer exists (visiting it redirects or 404s)
**Plans**: 2 plans

Plans:
- [ ] 37-01-PLAN.md — Create ChatWidgetContext, popup shell, adapt ChatInterface for popup mode, wire into layout and navbar
- [ ] 37-02-PLAN.md — Replace /assistant page with redirect, human verification of full feature

### Phase 38: Home Page Enhancements
**Goal**: The home page communicates Dan's work more effectively with an improved hero layout, richer card metadata, better section labels, and a new Dev Tools showcase
**Depends on**: Phase 36 (Tools page must exist for HOME-05 to link to)
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05
**Success Criteria** (what must be TRUE):
  1. Hero section has a wider text column with the image aligned to the top of the "Dan Weinbeck" heading and the second paragraph flowing below the image
  2. App cards on both the home page and /apps display technology stack tags (e.g., "Next.js", "Firebase", "Stripe")
  3. Building block cards on both the home page and /building-blocks show reading time (e.g., "5 min read") below the description and above tags
  4. The Apps section subtitle no longer says "Sign Up or Sign in" and the Building Blocks subtitle reads "Learn about AI Development with Building Block Tutorials"
  5. A new "Explore Development Tools" section appears after the Apps grid on the home page, displaying tool cards from the Tools page
**Plans**: 2 plans

Plans:
- [ ] 38-01-PLAN.md — Hero layout redesign, section subtitle updates, tech stack tags on app cards
- [ ] 38-02-PLAN.md — Reading time on building block cards, Dev Tools showcase section

### Phase 39: Bug Fixes
**Goal**: All reported bugs in brand scraper, AI assistant, and research assistant are resolved so users encounter working tools
**Depends on**: Phase 36 (NAV-04 removes CC brand scraper, reducing scope of BUG-02 testing)
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05
**Multi-repo note**: BUG-03 requires work in the chatbot-assistant repo (knowledge base sync). BUG-04 and BUG-05 may require work in the research-assistant backend repo.
**Success Criteria** (what must be TRUE):
  1. On the brand scraper page (/apps/brand-scraper), entering a valid URL enables the Scrape button immediately
  2. Brand scraper in Control Center (if still accessible) no longer returns "invalid or expired token" errors — authenticated users can scrape successfully
  3. The AI assistant returns relevant, contextual responses about Dan's work (not "no repos indexed" errors)
  4. The research assistant chat endpoint returns search results instead of errors
  5. The research assistant conversation history endpoint loads past conversations instead of errors
**Plans**: 2 plans

Plans:
- [ ] 39-01-PLAN.md — Fix brand scraper Scrape button disabled state and replace static auth tokens with fresh-token callbacks
- [ ] 39-02-PLAN.md — Add missing Firestore indexes, improve error handling for assistant and research assistant endpoints

### Phase 40: Polish
**Goal**: Contact page is clean and visually consistent, FRD content links to the real tool, and brand scraper form elements are properly sized
**Depends on**: Phase 36 (POL-03 needs Tools page to exist for FRD Generator listing)
**Requirements**: POL-01, POL-02, POL-03, POL-04
**Success Criteria** (what must be TRUE):
  1. The Contact page no longer has an "Other ways to contact me" section — only the primary contact methods remain
  2. All contact page buttons (Email Dan, Copy Email, LinkedIn, etc.) share the same blue style with a glowing gold hover effect
  3. The FRD building block article links to the actual FRD Generator tool on /tools, and FRD Generator appears as a card on the Tools page
  4. The brand scraper Scrape button is the same height as the URL text input field
**Plans**: 1 plan

Plans:
- [ ] 40-01-PLAN.md — Contact page cleanup, unified button styles, FRD Generator links, scraper button height fix

## Progress

**Execution Order:**
Phases execute in numeric order: 36 -> 37 -> 38 -> 39 -> 40

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 | v1.0 | 14/14 | Complete | 2026-02-03 |
| 7-10.1 | v1.1 | 6/6 | Complete | 2026-02-05 |
| 11-12 | v1.2 | 4/4 | Complete | 2026-02-07 |
| 13-16 | v1.3 | 7/7 | Complete | 2026-02-08 |
| 17-21 | v1.4 | 8/8 | Complete | 2026-02-09 |
| 22-25 | v1.5 | 6/6 | Complete | 2026-02-10 |
| 26 | v1.6 | 1/1 | Complete | 2026-02-10 |
| 27-30 | v1.7 | 13/13 | Complete | 2026-02-11 |
| 31-35 | v1.8 | 11/11 | Complete | 2026-02-12 |
| 36. Tools Page & Nav Restructure | v1.9 | 0/2 | Not started | - |
| 37. Chatbot Popup Widget | v1.9 | 0/2 | Not started | - |
| 38. Home Page Enhancements | v1.9 | 0/2 | Not started | - |
| 39. Bug Fixes | v1.9 | 0/2 | Not started | - |
| 40. Polish | v1.9 | 0/1 | Not started | - |

**Total: 9 milestones shipped, 35 phases complete, 70 plans complete | v1.9: 5 phases planned**

---
*For milestone details, see `.planning/milestones/v[X.Y]-ROADMAP.md`*
*For current requirements, see `.planning/REQUIREMENTS.md`*
