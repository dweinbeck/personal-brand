# Roadmap: dan-weinbeck.com

## Milestones

- v1.0 MVP - Phases 1-6 + 2.1 (shipped 2026-02-03)
- v1.1 Page Buildout & Polish - Phases 7-10.1 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-6 + 2.1) - SHIPPED 2026-02-03</summary>

See .planning/MILESTONES.md for v1.0 details.

14 plans across 7 phases. Delivered complete personal brand site with GitHub-integrated project cards, contact form, tutorials, SEO, and Cloud Run deployment.

</details>

### v1.1 Page Buildout & Polish (In Progress)

**Milestone Goal:** Flesh out Projects and Writing pages from stubs to full content, redesign Contact with better UX, and polish branding (OG image, favicon, logo accent).

- [x] **Phase 7: Branding Assets** - Favicon, OG image, and logo accent for immediate visual polish
- [x] **Phase 8: Projects Page** - 2-across detailed cards with tags, dates, filtering
- [x] **Phase 9: Writing Page** - Article cards with lorem ipsum content
- [x] **Phase 10: Contact Page Redesign** - Hero, CTAs, form UX states, privacy, analytics stubs
- [ ] **Phase 10.1: About Page** - Accomplishments cards with detail pages, populated from resume (INSERTED)

## Phase Details

### Phase 7: Branding Assets
**Goal**: Site has professional branding across browser tabs, social shares, and navbar
**Depends on**: Nothing (independent of other v1.1 work)
**Requirements**: BRAND-01, BRAND-02, BRAND-03
**Success Criteria** (what must be TRUE):
  1. Browser tab shows a custom DW favicon instead of the Next.js default
  2. Sharing the site URL on LinkedIn/Twitter shows a branded 1200x630 navy/gold image with Dan's name
  3. Navbar "DW" logo displays a persistent gold underline accent
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: Projects Page
**Goal**: Visitors can browse all projects with rich detail in a professional card layout
**Depends on**: Phase 7 (deploy pipeline validated)
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-06, PROJ-07, PROJ-08
**Success Criteria** (what must be TRUE):
  1. Projects page displays cards in a 2-across responsive grid with headline "Current and Past Projects" and matching background
  2. Each card shows project name, description paragraph, topic tags, date range, and public/private designation
  3. Each card has a prominent button linking to a project-specific page (placeholder for now)
  4. Visitor can filter or sort projects by tag or date
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Writing Page
**Goal**: Visitors can see Dan writes and explore article listings in a consistent card format
**Depends on**: Phase 8 (card layout patterns established)
**Requirements**: WRIT-01, WRIT-02, WRIT-03, WRIT-04
**Success Criteria** (what must be TRUE):
  1. Writing page displays with title "Writing" and subtitle "Articles and Blog Posts by Dan"
  2. Article cards match the Projects page card style and show title, publish date, and topic tag
  3. Page renders with lorem ipsum placeholder articles that demonstrate the content format
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Contact Page Redesign
**Goal**: Visitors have a frictionless, trust-building experience reaching Dan through multiple channels
**Depends on**: Phase 9 (layout patterns solidified, deploy confidence high)
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08, CONT-09, CONT-10, CONT-11, CONT-12, CONT-13, CONT-14, CONT-15, CONT-16, CONT-17
**Success Criteria** (what must be TRUE):
  1. Page opens with hero headline, subhead, and primary CTA buttons (mailto, copy email, LinkedIn) above the fold
  2. Contact form shows inline validation, loading state, clear success message, and failure state with email fallback
  3. Page works without JavaScript enabled (email-only fallback visible in noscript)
  4. Privacy/retention disclosure and "Other Ways to Reach Me" section are visible below the form
  5. Analytics event stubs fire for copy, mailto click, form start, submit, and error actions (console.log for now)
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

### Phase 10.1: About Page (INSERTED)
**Goal**: Visitors can explore Dan's career accomplishments in an interactive card format
**Depends on**: Phase 10 (card layout patterns established, site deployed)
**Requirements**: ABOUT-01, ABOUT-02, ABOUT-03, ABOUT-04, ABOUT-05, ABOUT-06
**Success Criteria** (what must be TRUE):
  1. About page displays accomplishment cards in 2-across grid matching Projects/Building Blocks style
  2. Each card shows: Company/Organization (with logo placeholder), Title, Role/Year(s) subtitle, description, and skill tags (e.g., Change Management, Strategy, Scrum)
  3. Each card links to a detail page with Setup, Work Completed, Results, and Skills Unlocked sections
  4. Cards populated from resume data (including Grad School, leadership/strategy work, and technical skills: R, PowerBI, Tableau, Azure)
  5. Logo placeholders ready for company/university logos (to be uploaded later)
**Plans**: 2 plans

Plans:
- [ ] 10.1-01-PLAN.md — Data foundation + navigation (accomplishments.json, types, NavLinks update)
- [ ] 10.1-02-PLAN.md — AccomplishmentCard component, About page, detail pages

## Progress

**Execution Order:** Phase 7 > Phase 8 > Phase 9 > Phase 10 > Phase 10.1

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 7. Branding Assets | v1.1 | 1/1 | ✓ Complete | 2026-02-04 |
| 8. Projects Page | v1.1 | 1/1 | ✓ Complete | 2026-02-04 |
| 9. Writing Page | v1.1 | 1/1 | ✓ Complete | 2026-02-04 |
| 10. Contact Page Redesign | v1.1 | 1/1 | ✓ Complete | 2026-02-04 |
| 10.1 About Page | v1.1 | 0/2 | Planned | — |

---
*Roadmap created: 2026-02-04*
*Last updated: 2026-02-05 — Phase 10.1 planned with 2 plans in 2 waves*
