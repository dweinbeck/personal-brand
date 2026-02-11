# Roadmap: dan-weinbeck.com

## Milestones

- v1.0 through v1.6: See `.planning/MILESTONES.md`
- **v1.7 Apps-first Home + Brand Scraper Overhaul** - Phases 27-30 (in progress)

## Phases

### v1.7 Apps-first Home + Brand Scraper Overhaul (In Progress)

**Milestone Goal:** Pivot the Home page to showcase apps as the primary content, remove the Projects section, and make Brand Scraper fully functional with real-time progress, proper taxonomy rendering, asset management, and user history. Cross-repo milestone touching both the main site and the brand-scraper Fastify service.

- [x] **Phase 27: Apps-first Home + Schema Alignment** - Remove Projects, update navbar, rebuild Home around apps grid, fix Zod schemas
- [x] **Phase 28: Scraper Service Backend** - Progress events, individual GCS assets, on-demand zip, enriched API response
- [x] **Phase 29: Brand Card + Progress UI** - New Brand Card component, live progress display, proxy routes
- [ ] **Phase 30: Assets Page + User History** - Asset browsing with downloads and user scrape history

## Phase Details

### Phase 27: Apps-first Home + Schema Alignment
**Goal**: Visitors land on a Home page that showcases published apps with clean navigation, no dead links from the removed Projects section, and Brand Scraper Zod schemas aligned with real taxonomy
**Depends on**: Nothing (main-site phase, parallelizable with Phase 28)
**Repo**: Main site (personal-brand)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06, HOME-07, SCHM-01, SCHM-02, SCHM-03
**Success Criteria** (what must be TRUE):
  1. Visiting /projects or /projects/any-slug redirects to / with no 404
  2. Home page displays apps in a 3-wide responsive grid with uniform card heights and blue+gold "Enter App" buttons pinned to the bottom
  3. A "Building Blocks" CTA section appears below the apps grid with title "Want to learn about AI Agent Development?"
  4. Navbar shows Home, About, Building Blocks, Custom GPTs, Apps, Assistant, Contact -- Control Center only visible when signed in as admin
  5. No broken internal links remain anywhere on the site after Projects removal
  6. Zod schemas on the main site parse real scraper service responses without validation errors
  7. UI components read from corrected nested taxonomy paths and render correctly
  8. When a scraper response contains unexpected data, a fallback message appears with a "Download Brand JSON" link
**Plans**: 3 plans
Plans:
- [x] 27-01-PLAN.md — Remove Projects routing, update navbar, clean sitemap and 404 page
- [x] 27-02-PLAN.md — Rebuild Home page with apps grid and Building Blocks CTA
- [x] 27-03-PLAN.md — Align Zod schemas with real scraper taxonomy and update gallery components

### Phase 28: Scraper Service Backend
**Goal**: The scraper service tracks granular pipeline progress, stores each asset individually in GCS, generates zips on demand, and returns enriched job responses with events and asset manifests
**Depends on**: Nothing (scraper-service repo, parallelizable with Phase 27)
**Repo**: Brand scraper service (brand-scraper)
**Requirements**: PROG-01, PROG-02, PROG-03, SAPI-01, SAPI-02, SAPI-03, ASST-01, ASST-02, ASST-03, ASST-04
**Success Criteria** (what must be TRUE):
  1. During a scrape job, the service emits and persists progress events (page_started, page_done, asset_saved, asset_failed) in pipelineMeta JSONB, updated during processing
  2. Each extracted asset is uploaded individually to GCS under jobs/{jobId}/assets/{category}/{filename}
  3. An assets manifest listing all extracted assets with metadata is persisted to the database
  4. DB schema includes new gcsAssetsPrefix and assetsManifest columns via migration
  5. POST /jobs/:id/assets/zip creates a zip of all job assets in GCS and returns a signed download URL
  6. GET /jobs/:id response includes progress events and assets manifest with signed URLs
  7. brand_json_url continues working via signed URL (no regression)
**Plans**: 4 plans
Plans:
- [x] 28-01-PLAN.md — Foundation: DB schema migration, types, PipelineContext.onEvent, GCS helpers
- [x] 28-02-PLAN.md — Wire progress event emission throughout pipeline and persist to DB
- [x] 28-03-PLAN.md — Individual asset uploads to GCS with manifest building
- [x] 28-04-PLAN.md — Enriched GET /jobs/:id response and POST zip endpoint

### Phase 29: Brand Card + Progress UI
**Goal**: Users see live scrape progress and a polished Brand Card displaying the extracted brand identity when the job completes
**Depends on**: Phase 27 (schema alignment), Phase 28 (enriched API response)
**Repo**: Main site (personal-brand)
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, CARD-06, PROG-04, ASST-05
**Success Criteria** (what must be TRUE):
  1. While a scrape job is running, the UI shows live lists of "Pages being scraped" and "Files saved" updating in real time
  2. On completion, a single wide Brand Card shows a browser-tab header with favicon + hostname, logos, color palette swatches, and a description area rendered in the extracted font
  3. The Brand Card has "Download Brand JSON File" and "Download Assets" buttons
  4. Main site proxy route for on-demand zip requires authentication
**Plans**: 3 plans
Plans:
- [x] 29-01-PLAN.md — Extend Zod schemas with pipeline_meta + assets_manifest, create font loading utility, add zip proxy route
- [x] 29-02-PLAN.md — Create ScrapeProgressPanel and Brand Card section components (header, logos, colors, description, downloads)
- [x] 29-03-PLAN.md — Compose BrandCard container and wire progress panel + card into UserBrandScraperPage

### Phase 30: Assets Page + User History
**Goal**: Users can browse individual assets with previews, download them, and revisit previously scraped brands from their history
**Depends on**: Phase 29
**Repo**: Main site (personal-brand)
**Requirements**: APAG-01, APAG-02, APAG-03, HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. Route /apps/brand-scraper/[jobId]/assets displays a list of extracted assets with image previews (when applicable), filenames, categories, and per-asset download buttons via signed URLs
  2. A "Download Zip File" button at the top of the assets page triggers on-demand zip generation and initiates a download
  3. Below the URL input on the Brand Scraper page, authenticated users see a history of previously scraped URLs with dates, sorted newest first
  4. Clicking "View Results" on a history entry opens the Brand Card for that job
  5. Scrape submissions persist a history record in Firestore keyed by uid containing jobId, siteUrl, createdAt, and status
**Plans**: TBD

## Progress

**Execution Order:** (27 + 28 in parallel) -> 29 -> 30

```
Phase 27 (main site)  ──┐
                         ├──> Phase 29 ──> Phase 30
Phase 28 (scraper svc) ─┘
        ↑ TRUE PARALLEL ↑
```

Phases 27 and 28 operate on different repos and can execute concurrently with zero conflicts. Phase 29 depends on both (schema alignment from 27 + backend APIs from 28). Phase 30 depends on 29.

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 27. Apps-first Home + Schema Alignment | 3/3 | Verified | 2026-02-11 |
| 28. Scraper Service Backend | 4/4 | Verified | 2026-02-11 |
| 29. Brand Card + Progress UI | 3/3 | Verified | 2026-02-11 |
| 30. Assets Page + User History | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-10*
*Milestone: v1.7 Apps-first Home + Brand Scraper Overhaul*
