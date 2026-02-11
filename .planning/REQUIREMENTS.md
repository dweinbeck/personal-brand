# Requirements: dan-weinbeck.com v1.7

**Defined:** 2026-02-10
**Core Value:** Visitors can understand who Dan is and see proof of his work within 60 seconds

## v1 Requirements

Requirements for v1.7 milestone. Each maps to roadmap phases.

### Navigation & Routing

- [ ] **NAV-01**: Projects pages (/projects, /projects/[slug]) removed with redirect to /
- [ ] **NAV-02**: Navbar displays: Home, About, Building Blocks, Custom GPTs, Apps, Assistant, Contact
- [ ] **NAV-03**: Control Center nav item visible only when signed-in user is admin ("me")
- [ ] **NAV-04**: No broken internal links remain after Projects removal

### Home Page

- [ ] **HOME-01**: Apps grid section with title "Explore my Published Apps" and subtitle "And sign up or sign in to use them"
- [ ] **HOME-02**: Apps rendered in 3-wide grid on desktop (responsive 1/2/3 columns)
- [ ] **HOME-03**: Uniform card height with "Enter App" button pinned to bottom via flex layout
- [ ] **HOME-04**: Button styling: blue fill with thin gold border, full-width within card padding
- [ ] **HOME-05**: Top tag spacing reduced by ~50%
- [ ] **HOME-06**: Building Blocks CTA section below apps: "Want to learn about AI Agent Development?" + subtitle + existing Building Blocks teaser
- [ ] **HOME-07**: Duplicative navigational Home sections removed (navbar covers them)

### Schema Alignment

- [ ] **SCHM-01**: Site Zod schemas match real scraper service taxonomy (color.palette, typography.font_families, assets nested structure, source, meta)
- [ ] **SCHM-02**: UI components read from corrected nested taxonomy paths
- [ ] **SCHM-03**: Zod parsing errors handled defensively with fallback message and "Download Brand JSON" link

### Scraper Progress

- [ ] **PROG-01**: Scraper service emits progress events during pipeline (page_started, page_done, asset_saved, asset_failed)
- [ ] **PROG-02**: Events persisted in job pipelineMeta JSONB, updated during processing (not only at end)
- [ ] **PROG-03**: GET /jobs/:id returns events in response
- [ ] **PROG-04**: Main site UI shows live "Pages being scraped" and "Files saved" lists while job is running

### Asset Storage

- [ ] **ASST-01**: Scraper worker uploads each asset individually to GCS under jobs/{jobId}/assets/{category}/{filename}
- [ ] **ASST-02**: Assets manifest (JSON) with metadata persisted to DB and/or GCS
- [ ] **ASST-03**: No automatic zip on completion; individual objects only
- [ ] **ASST-04**: On-demand zip endpoint (POST /jobs/:id/assets/zip) creates zip, uploads to GCS, returns signed URL
- [ ] **ASST-05**: Main site proxy route for on-demand zip with auth gating

### Brand Card

- [ ] **CARD-01**: Single wide Brand Card replaces old 2x2 results gallery
- [ ] **CARD-02**: Fake browser tab header showing favicon + site hostname
- [ ] **CARD-03**: Multiple logos displayed from taxonomy assets.logos
- [ ] **CARD-04**: Color palette swatches from color.palette with hex values
- [ ] **CARD-05**: Description area rendered in extracted primary font-family (best-effort)
- [ ] **CARD-06**: Buttons bottom-right: "Download Brand JSON File" and "Download Assets"

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

- [ ] **SAPI-01**: GET /jobs/:id response includes events and assets manifest with signed URLs
- [ ] **SAPI-02**: DB schema migration adds gcsAssetsPrefix and assetsManifest columns
- [ ] **SAPI-03**: brand_json_url continues working via signed URL

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
| NAV-01 | TBD | Pending |
| NAV-02 | TBD | Pending |
| NAV-03 | TBD | Pending |
| NAV-04 | TBD | Pending |
| HOME-01 | TBD | Pending |
| HOME-02 | TBD | Pending |
| HOME-03 | TBD | Pending |
| HOME-04 | TBD | Pending |
| HOME-05 | TBD | Pending |
| HOME-06 | TBD | Pending |
| HOME-07 | TBD | Pending |
| SCHM-01 | TBD | Pending |
| SCHM-02 | TBD | Pending |
| SCHM-03 | TBD | Pending |
| PROG-01 | TBD | Pending |
| PROG-02 | TBD | Pending |
| PROG-03 | TBD | Pending |
| PROG-04 | TBD | Pending |
| ASST-01 | TBD | Pending |
| ASST-02 | TBD | Pending |
| ASST-03 | TBD | Pending |
| ASST-04 | TBD | Pending |
| ASST-05 | TBD | Pending |
| CARD-01 | TBD | Pending |
| CARD-02 | TBD | Pending |
| CARD-03 | TBD | Pending |
| CARD-04 | TBD | Pending |
| CARD-05 | TBD | Pending |
| CARD-06 | TBD | Pending |
| APAG-01 | TBD | Pending |
| APAG-02 | TBD | Pending |
| APAG-03 | TBD | Pending |
| HIST-01 | TBD | Pending |
| HIST-02 | TBD | Pending |
| HIST-03 | TBD | Pending |
| HIST-04 | TBD | Pending |
| SAPI-01 | TBD | Pending |
| SAPI-02 | TBD | Pending |
| SAPI-03 | TBD | Pending |

**Coverage:**
- v1.7 requirements: 39 total
- Mapped to phases: 0
- Unmapped: 39

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-10 after initial definition*
