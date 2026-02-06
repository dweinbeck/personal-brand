# Roadmap: dan-weinbeck.com

## Milestones

- v1.0 MVP - Phases 1-6 + 2.1 (shipped 2026-02-03)
- v1.1 Page Buildout & Polish - Phases 7-10.1 (shipped 2026-02-05)
- v1.2 Content & Data Integration - Phases 11-12 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-6 + 2.1) - SHIPPED 2026-02-03</summary>

See .planning/MILESTONES.md for v1.0 details.

14 plans across 7 phases. Delivered complete personal brand site with GitHub-integrated project cards, contact form, tutorials, SEO, and Cloud Run deployment.

</details>

<details>
<summary>v1.1 Page Buildout & Polish (Phases 7-10.1) - SHIPPED 2026-02-05</summary>

See .planning/milestones/v1.1-ROADMAP.md for full details.

6 plans across 5 phases. Enhanced Projects, Writing, Contact pages with detailed cards and better UX. Added About page with accomplishment cards from resume. Polished branding with favicon, OG image, logo accent. AI Assistant chatbot with knowledge base.

</details>

### v1.2 Content & Data Integration (In Progress)

**Milestone Goal:** Replace placeholder project data with live GitHub API across the site, add project detail pages, and polish the About page with company/university logos.

#### Phase 11: GitHub API Integration
**Goal**: Projects page and homepage display live data from GitHub API with individual project detail pages
**Depends on**: Phase 10.1 (About Page)
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04
**Success Criteria** (what must be TRUE):
  1. Projects page displays live repository data from GitHub API (not placeholder data)
  2. Each project card links to its own detail page at `/projects/[slug]`
  3. Project detail page shows full README content rendered as markdown
  4. Project detail page displays tech stack, creation date, last update date, and links (GitHub, live site)
  5. Homepage featured projects pull from the same GitHub data source as projects page
**Plans**: 3 plans in 2 waves

Plans:
- [x] 11-01-PLAN.md — Data layer: project config, types, GitHub API functions
- [x] 11-02-PLAN.md — Projects page with live data + detail pages with README rendering
- [x] 11-03-PLAN.md — Homepage featured projects unification + sitemap update

#### Phase 12: About Page Logos
**Goal**: Accomplishment cards display company and university logos for visual recognition
**Depends on**: Phase 11
**Requirements**: ABOU-01
**Success Criteria** (what must be TRUE):
  1. Each accomplishment card displays the relevant company or university logo
  2. Logos are appropriately sized and positioned on cards
  3. Logos work on both light backgrounds and maintain brand recognition
**Plans**: 1 plan in 1 wave

Plans:
- [ ] 12-01-PLAN.md — Add logo files and update accomplishment data with logo paths

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 + 2.1 | v1.0 | 14/14 | Complete | 2026-02-03 |
| 7-10.1 | v1.1 | 6/6 | Complete | 2026-02-05 |
| 11. GitHub API Integration | v1.2 | 3/3 | Complete | 2026-02-06 |
| 12. About Page Logos | v1.2 | 0/1 | Not started | - |

---
*Roadmap created: 2026-02-04*
*Last updated: 2026-02-06 — Phase 12 planned (1 plan)*
