# Roadmap: dan-weinbeck.com

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-02-03)
- ✅ **v1.1 Page Buildout & Polish** - Phases 7-10.1 (shipped 2026-02-05)
- ✅ **v1.2 Content & Data Integration** - Phases 11-12 (shipped 2026-02-07)
- ✅ **v1.3 Assistant Backend Integration** - Phases 13-16 (shipped 2026-02-08)
- 🚧 **v1.4 Control Center: Content Editor & Brand Scraper** - Phases 17-21 (in progress)

## Phases

<details>
<summary>✅ v1.0 through v1.3 (Phases 1-16) - SHIPPED</summary>

See .planning/MILESTONES.md for full history.

</details>

### 🚧 v1.4 Control Center: Content Editor & Brand Scraper (In Progress)

**Milestone Goal:** Expand the Control Center with two new admin tools: a form-guided Building Blocks content editor with live preview that writes MDX directly to the filesystem, and a Brand Scraper frontend that submits URLs to the deployed Cloud Run API and displays extracted brand data (colors, fonts, logos, assets) in a card gallery.

**Requirements:**

| ID | Requirement | Phase |
|----|-------------|-------|
| CC-01 | Building Blocks content editor with form-guided inputs and live preview tab | 19 |
| CC-02 | Editor writes MDX files directly to filesystem (matching published output format) | 18 |
| CC-03 | Optional fast companion content support in editor | 19 |
| CC-04 | Brand Scraper URL collector (submits to deployed Cloud Run API) | 21 |
| CC-05 | Brand Scraper results gallery -- 2-wide cards showing colors, fonts, logos, assets with confidence | 21 |
| CC-06 | Brand Scraper component cleanly separated for potential reuse | 20 |
| CC-07 | Control Center navigation to switch between features (repos, todoist, editor, brand scraper) | 17 |

- [x] **Phase 17: Control Center Navigation** - Horizontal nav bar linking all Control Center sections
- [x] **Phase 18: Content Editor Infrastructure** - Listing page, Zod schemas, Server Action with filesystem writes, slug validation
- [ ] **Phase 19: Content Editor UI** - Form-guided editor with metadata fields, markdown textarea, live preview, and fast companion support
- [ ] **Phase 20: Brand Scraper API Proxy** - Next.js API routes proxying to deployed Fastify service with typed client and Zod schemas
- [ ] **Phase 21: Brand Scraper UI** - URL submission form, SWR-based job polling, and brand data results gallery with confidence indicators

## Phase Details

### Phase 17: Control Center Navigation
**Goal**: Admin can navigate between all Control Center sections from any page within the Control Center
**Depends on**: Nothing (first phase of v1.4)
**Requirements**: CC-07
**Success Criteria** (what must be TRUE):
  1. A horizontal nav bar appears on every Control Center page with links to Dashboard, Content Editor, and Brand Scraper
  2. The nav bar highlights the currently active section based on the URL path
  3. Navigating to `/control-center/content` and `/control-center/brand-scraper` renders placeholder pages without errors
  4. The existing Dashboard page (`/control-center/`) continues to work with repos and Todoist content unchanged
**Plans**: 1 plan
Plans:
- [x] 17-01-PLAN.md -- ControlCenterNav component, layout wiring, and placeholder pages

### Phase 18: Content Editor Infrastructure
**Goal**: The server-side plumbing for content authoring is complete -- MDX files can be listed, validated, and written to the filesystem
**Depends on**: Phase 17 (navigation provides access to content pages)
**Requirements**: CC-02
**Success Criteria** (what must be TRUE):
  1. Visiting `/control-center/content` shows a list of all existing Building Blocks tutorials with their title, slug, date, and tags
  2. The save Server Action writes a valid MDX file to `src/content/building-blocks/` with the correct `export const metadata` format when running locally
  3. The save Server Action rejects writes in production (non-development) environments with a clear error message
  4. Slug validation prevents path traversal attacks and slug collisions with existing content
  5. Server-side admin auth verification (Firebase ID token) is enforced on the save action -- unauthenticated requests are rejected
**Plans**: 2 plans
Plans:
- [x] 18-01-PLAN.md -- Zod schemas, shared verifyAdminToken, and saveTutorial Server Action
- [x] 18-02-PLAN.md -- Replace content page placeholder with tutorial list table

### Phase 19: Content Editor UI
**Goal**: Admin can author new Building Blocks tutorials through a form-guided editor with live preview, without manually writing MDX boilerplate
**Depends on**: Phase 18 (schemas, Server Action, and listing page)
**Requirements**: CC-01, CC-03
**Success Criteria** (what must be TRUE):
  1. The editor at `/control-center/content/new` presents form fields for title, description, published date, and tags, plus a markdown textarea for the article body
  2. Switching to the Preview tab renders the markdown body via react-markdown with prose styling that matches the published tutorial appearance
  3. Clicking Save produces an MDX file on disk that appears in the Building Blocks listing and renders correctly at its public URL after a dev server restart
  4. Navigating away from the editor with unsaved changes triggers a browser warning
  5. A toggle for "Include fast companion" shows a second textarea, and saving produces both the main MDX file and the `_slug-fast.mdx` companion file
**Plans**: 1 plan
Plans:
- [ ] 19-01-PLAN.md -- Full editor UI: schema extension, TutorialEditor component, page wiring, and listing link

### Phase 20: Brand Scraper API Proxy
**Goal**: The Next.js server can submit scrape jobs and poll results from the deployed Brand Scraper Fastify service, with typed responses and admin auth
**Depends on**: Phase 17 (navigation provides access to brand scraper page)
**Requirements**: CC-06
**Success Criteria** (what must be TRUE):
  1. `POST /api/admin/brand-scraper/scrape` proxies a URL submission to the Fastify service and returns a job ID
  2. `GET /api/admin/brand-scraper/jobs/[id]` proxies a status poll and returns typed job status with BrandTaxonomy data when complete
  3. Both API routes verify the Firebase ID token via `verifyAdmin()` and reject unauthenticated requests
  4. Brand scraper code is organized in `src/lib/brand-scraper/` (client, types) and `src/components/admin/brand-scraper/` (UI), cleanly separated from other admin features
  5. Zod schemas validate API responses and surface clear errors when the external service returns unexpected data
**Plans**: TBD

### Phase 21: Brand Scraper UI
**Goal**: Admin can submit a URL, watch the scrape job progress, and browse the extracted brand data in a visual gallery
**Depends on**: Phase 20 (API proxy routes and types)
**Requirements**: CC-04, CC-05
**Success Criteria** (what must be TRUE):
  1. The brand scraper page at `/control-center/brand-scraper` has a URL input form that submits to the API proxy and shows a job ID upon submission
  2. After submission, the UI polls for job status using SWR, displaying queued/processing/succeeded/failed states with appropriate visual indicators
  3. When a job completes, a 2-wide card gallery displays extracted colors (swatches with hex codes), fonts (family names with specimens), logos (image thumbnails), and assets -- each with confidence badges
  4. Download links for `brand.json` and `assets.zip` are displayed when the job succeeds
  5. Polling stops automatically when the job reaches a terminal state and does not leak memory on page navigation
**Plans**: TBD

## Progress

**Execution Order:** 17 -> 18 -> 19 -> 20 -> 21

Note: Phases 18-19 (content editor) and 20-21 (brand scraper) are independent after Phase 17. They are sequenced content-first because the editor has more architectural novelty (filesystem writes, MDX validation). The brand scraper follows proven proxy patterns from v1.3.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 17. Control Center Navigation | v1.4 | 1/1 | Complete | 2026-02-08 |
| 18. Content Editor Infrastructure | v1.4 | 2/2 | Complete | 2026-02-08 |
| 19. Content Editor UI | v1.4 | 0/1 | Not started | - |
| 20. Brand Scraper API Proxy | v1.4 | 0/TBD | Not started | - |
| 21. Brand Scraper UI | v1.4 | 0/TBD | Not started | - |
