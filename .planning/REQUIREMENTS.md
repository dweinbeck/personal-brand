# Requirements: dan-weinbeck.com v1.7

**Defined:** 2026-02-10
**Core Value:** Visitors can understand who Dan is and see proof of his work within 60 seconds

## v1 Requirements

Requirements for v1.7 milestone. Each maps to roadmap phases.

### Navigation & Routing

- [x] **NAV-01**: Projects pages (/projects, /projects/[slug]) removed with redirect to /
- [x] **NAV-02**: Navbar displays: Home, About, Building Blocks, Custom GPTs, Apps, Assistant, Contact
- [x] **NAV-03**: Control Center nav item visible only when signed-in user is admin ("me")
- [x] **NAV-04**: No broken internal links remain after Projects removal

### Home Page

- [x] **HOME-01**: Apps grid section with title "Explore my Published Apps" and subtitle "And sign up or sign in to use them"
- [x] **HOME-02**: Apps rendered in 3-wide grid on desktop (responsive 1/2/3 columns)
- [x] **HOME-03**: Uniform card height with "Enter App" button pinned to bottom via flex layout
- [x] **HOME-04**: Button styling: blue fill with thin gold border, full-width within card padding
- [x] **HOME-05**: Top tag spacing reduced by ~50%
- [x] **HOME-06**: Building Blocks CTA section below apps: "Want to learn about AI Agent Development?" + subtitle + existing Building Blocks teaser
- [x] **HOME-07**: Duplicative navigational Home sections removed (navbar covers them)

### Schema Alignment

- [x] **SCHM-01**: Site Zod schemas match real scraper service taxonomy (color.palette, typography.font_families, assets nested structure, source, meta)
- [x] **SCHM-02**: UI components read from corrected nested taxonomy paths
- [x] **SCHM-03**: Zod parsing errors handled defensively with fallback message and "Download Brand JSON" link

### Scraper Progress

- [x] **PROG-01**: Scraper service emits progress events during pipeline (page_started, page_done, asset_saved, asset_failed)
- [x] **PROG-02**: Events persisted in job pipelineMeta JSONB, updated during processing (not only at end)
- [x] **PROG-03**: GET /jobs/:id returns events in response
- [x] **PROG-04**: Main site UI shows live "Pages being scraped" and "Files saved" lists while job is running

### Asset Storage

- [x] **ASST-01**: Scraper worker uploads each asset individually to GCS under jobs/{jobId}/assets/{category}/{filename}
- [x] **ASST-02**: Assets manifest (JSON) with metadata persisted to DB and/or GCS
- [x] **ASST-03**: No automatic zip on completion; individual objects only
- [x] **ASST-04**: On-demand zip endpoint (POST /jobs/:id/assets/zip) creates zip, uploads to GCS, returns signed URL
- [x] **ASST-05**: Main site proxy route for on-demand zip with auth gating

### Brand Card

- [x] **CARD-01**: Single wide Brand Card replaces old 2x2 results gallery
- [x] **CARD-02**: Fake browser tab header showing favicon + site hostname
- [x] **CARD-03**: Multiple logos displayed from taxonomy assets.logos
- [x] **CARD-04**: Color palette swatches from color.palette with hex values
- [x] **CARD-05**: Description area rendered in extracted primary font-family (best-effort)
- [x] **CARD-06**: Buttons bottom-right: "Download Brand JSON File" and "Download Assets"

### Assets Page

- [ ] **APAG-01**: Route at /apps/brand-scraper/[jobId]/assets with asset list and previews
- [ ] **APAG-02**: "Download Zip File" button at top triggers on-demand zip generation and download
- [ ] **APAG-03**: Per-asset preview (image when possible) with filename/category and download button via signed URL

### User History

- [ ] **HIST-01**: Scrape submissions persist history record in Firestore keyed by uid (jobId, siteUrl, createdAt, status)
- [ ] **HIST-02**: Authenticated history fetch API route returns list sorted by createdAt desc
- [ ] **HIST-03**: History section below URL input showing previously scraped URLs + dates + "View Results"
- [ ] **HIST-04**: "View Results" opens Brand Card for that job

### Scraper Service API

- [x] **SAPI-01**: GET /jobs/:id response includes events and assets manifest with signed URLs
- [x] **SAPI-02**: DB schema migration adds gcsAssetsPrefix and assetsManifest columns
- [x] **SAPI-03**: brand_json_url continues working via signed URL

## Future Requirements

Deferred to later milestones.

### Content

- **CONT-01**: Real article content with MDX authoring pipeline
- **CONT-02**: Writing page displays real articles (replaces lorem ipsum)

### Additional Tools

- **TOOL-01**: 60-Second Lesson paid tool (pricing entry exists, inactive)
- **TOOL-02**: Bus Text paid tool (pricing entry exists, inactive)
- **TOOL-03**: Dave Ramsey App paid tool (pricing entry exists, inactive)

### Polish

- **PLSH-01**: Optimized logo assets (SVG preferred, PNG fallback)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Brand scraper UI redesign beyond Brand Card + Assets | Phase 2 scoped to specific components only |
| Global theme/typography redesign | Not in this milestone; keep existing dan-weinbeck.com look |
| New auth providers | Firebase Auth (Google Sign-In) already covers needs |
| Billing logic changes | Existing billing system works; only adding history metadata |
| Full brand library admin dashboard | Only user-facing history + view results |
| Subscription/recurring billing | Pre-paid credits model is intentional |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 27 | Complete |
| NAV-02 | Phase 27 | Complete |
| NAV-03 | Phase 27 | Complete |
| NAV-04 | Phase 27 | Complete |
| HOME-01 | Phase 27 | Complete |
| HOME-02 | Phase 27 | Complete |
| HOME-03 | Phase 27 | Complete |
| HOME-04 | Phase 27 | Complete |
| HOME-05 | Phase 27 | Complete |
| HOME-06 | Phase 27 | Complete |
| HOME-07 | Phase 27 | Complete |
| SCHM-01 | Phase 27 | Complete |
| SCHM-02 | Phase 27 | Complete |
| SCHM-03 | Phase 27 | Complete |
| PROG-01 | Phase 28 | Complete |
| PROG-02 | Phase 28 | Complete |
| PROG-03 | Phase 28 | Complete |
| PROG-04 | Phase 29 | Complete |
| ASST-01 | Phase 28 | Complete |
| ASST-02 | Phase 28 | Complete |
| ASST-03 | Phase 28 | Complete |
| ASST-04 | Phase 28 | Complete |
| ASST-05 | Phase 29 | Complete |
| CARD-01 | Phase 29 | Complete |
| CARD-02 | Phase 29 | Complete |
| CARD-03 | Phase 29 | Complete |
| CARD-04 | Phase 29 | Complete |
| CARD-05 | Phase 29 | Complete |
| CARD-06 | Phase 29 | Complete |
| APAG-01 | Phase 30 | Pending |
| APAG-02 | Phase 30 | Pending |
| APAG-03 | Phase 30 | Pending |
| HIST-01 | Phase 30 | Pending |
| HIST-02 | Phase 30 | Pending |
| HIST-03 | Phase 30 | Pending |
| HIST-04 | Phase 30 | Pending |
| SAPI-01 | Phase 28 | Complete |
| SAPI-02 | Phase 28 | Complete |
| SAPI-03 | Phase 28 | Complete |

**Coverage:**
- v1.7 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-11 — Phase 29 requirements marked Complete*
