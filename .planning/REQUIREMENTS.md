# Requirements: Apps Hub Page

**Defined:** 2026-02-10
**Core Value:** Visitors can understand who Dan is and see proof of his work within 60 seconds

## v1.6 Requirements

Requirements for the Apps Hub Page milestone. Single phase.

### Apps Data

- [ ] **APPS-01**: App listing type defined with title, tag, subtitle, description, href, dates, techStack, available flag
- [ ] **APPS-02**: App listings array with Brand Scraper (available) and Dave Ramsey Digital Envelopes (coming soon)

### Apps UI

- [ ] **APPS-03**: AppCard component with topic badge (top-right), subtitle, description, tech stack tags, dates, and action button
- [ ] **APPS-04**: Available apps show "Enter App" button linking to app page; unavailable apps show disabled "Coming Soon" button
- [ ] **APPS-05**: Apps index page at /apps with page metadata, intro text, and 2-across responsive grid (1-col mobile, 2-col desktop)

### Navigation & SEO

- [ ] **APPS-06**: "Apps" link added to main navigation with correct active state on /apps and /apps/*
- [ ] **APPS-07**: Sitemap includes /apps and /apps/brand-scraper

### Quality

- [ ] **APPS-08**: lint, test, and build all pass

## Future Requirements

Deferred to later milestones.

### Additional Apps

- **APPS-F01**: Additional app cards as new tools are built (60-Second Lesson, Bus Text)
- **APPS-F02**: App detail pages with consistent layout (if apps grow beyond current routing)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Billing/credits changes | No paywall logic changes — apps page is discovery only |
| New backend endpoints | Pure frontend/UI milestone |
| Redesign of Projects/Building Blocks pages | Reuse patterns, don't modify existing pages |
| Search or filtering on apps page | Only 2 apps — unnecessary complexity |
| App ratings or reviews | Not relevant for personal site |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| APPS-01 | Phase 26 | Pending |
| APPS-02 | Phase 26 | Pending |
| APPS-03 | Phase 26 | Pending |
| APPS-04 | Phase 26 | Pending |
| APPS-05 | Phase 26 | Pending |
| APPS-06 | Phase 26 | Pending |
| APPS-07 | Phase 26 | Pending |
| APPS-08 | Phase 26 | Pending |

**Coverage:**
- v1.6 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-10 after initial definition*
