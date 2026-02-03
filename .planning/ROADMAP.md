# Roadmap: dan-weinbeck.com

## Overview

This roadmap delivers Dan's personal website in six phases, progressing from a navigable shell through content pages, dynamic GitHub integration, contact functionality, SEO polish, and finally production deployment on GCP Cloud Run. Each phase builds on the last and delivers a coherent, verifiable capability. The site's core value -- visitors understand who Dan is within 60 seconds -- is fully realized when all phases complete.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold and Navigation** - Project setup, layout shell, and responsive navigation ✓
- [x] **Phase 2: Home Page** - Hero section, CTAs, featured projects preview, and visual polish ✓
- [x] **Phase 2.1: Building Blocks** - Tutorials section with concrete, simple guides for common dev tasks (INSERTED) ✓
- [x] **Phase 3: Projects** - GitHub API integration with project cards and ISR caching ✓
- [x] **Phase 4: Contact** - Contact form with validation, Firestore storage, and social links ✓
- [ ] **Phase 5: SEO, Polish, and Stubs** - Meta tags, Lighthouse optimization, and placeholder pages
- [ ] **Phase 6: Infrastructure and Deploy** - Docker build, Cloud Run deployment, and security hardening

## Phase Details

### Phase 1: Scaffold and Navigation
**Goal**: Visitors can navigate a responsive site shell across all sections
**Depends on**: Nothing (first phase)
**Requirements**: NAV-01, NAV-02, NAV-03, PERF-02
**Success Criteria** (what must be TRUE):
  1. Visitor sees a navbar with links to Home, Projects, Writing, Assistant, and Contact
  2. On mobile, visitor can open and close a hamburger menu smoothly
  3. Visitor can identify which page they are on from the active navigation indicator
  4. All pages render correctly on mobile, tablet, and desktop viewports
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md -- Next.js 16 project scaffold with Tailwind v4, Biome v2, and clsx
- [ ] 01-02-PLAN.md -- Layout shell with responsive navbar, mobile menu, active indicator, and page stubs

### Phase 2: Home Page
**Goal**: Visitors immediately understand who Dan is and what he builds
**Depends on**: Phase 1
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. Visitor sees Dan's headshot, name, tagline, and short bio above the fold
  2. Visitor can click CTA buttons to reach Projects, Contact, GitHub, and LinkedIn
  3. Visitor sees featured project cards on the home page (placeholder data acceptable until Phase 3 wires up API)
  4. Visitor sees a blog teaser section linking to the Writing page
  5. Images load optimized (Next.js Image component) and subtle animations are visible on page transitions and card hovers
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Hero section with headshot, bio, CTA buttons, and animation/config foundations
- [ ] 02-02-PLAN.md -- Featured projects grid, blog teaser, and final page composition

### Phase 2.1: Building Blocks (INSERTED)
**Goal**: Visitors can browse and read practical, step-by-step tutorials on common development tasks
**Depends on**: Phase 2
**Requirements**: N/A (urgent insertion -- no pre-existing requirements)
**Success Criteria** (what must be TRUE):
  1. Visitor can navigate to a "Building Blocks" section from the site navigation
  2. Visitor sees a list of available tutorials with titles and short descriptions
  3. Visitor can read a full tutorial page with clear, step-by-step instructions
  4. First tutorial ("Setting up a repo for a new project") is published and readable
**Plans**: 2 plans

Plans:
- [ ] 02.1-01-PLAN.md -- MDX infrastructure, typography plugin, and navigation update
- [ ] 02.1-02-PLAN.md -- Tutorial listing page, detail page, and first tutorial content

### Phase 3: Projects
**Goal**: Visitors can browse Dan's real GitHub projects with live data
**Depends on**: Phase 2
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04
**Success Criteria** (what must be TRUE):
  1. Projects page displays cards pulled from the GitHub API showing repo description, language, and topics
  2. Project grid is responsive across mobile, tablet, and desktop
  3. Each project card links to its GitHub repo (and live demo if a homepage URL is set)
  4. GitHub data is cached via ISR and revalidates hourly (not fetched on every request)
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md -- GitHub API data layer, ProjectCard homepage link, and full Projects page
- [ ] 03-02-PLAN.md -- Wire home page featured projects to live GitHub API data

### Phase 4: Contact
**Goal**: Visitors can reach Dan through a working contact form or direct channels
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05
**Success Criteria** (what must be TRUE):
  1. Visitor can fill out and submit a contact form with name, email, and message
  2. Invalid submissions are rejected with clear error messages; spam is blocked by honeypot and rate limiting
  3. Successful form submissions are stored in Firestore
  4. Visitor can click Dan's email address to copy it to clipboard
  5. Visitor can click social links to reach Dan's LinkedIn, Instagram, and GitHub profiles
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md -- Contact form with Zod validation, Server Action, honeypot, rate limiting, and Firestore storage
- [ ] 04-02-PLAN.md -- CopyEmailButton, social links, and full contact page composition

### Phase 5: SEO, Polish, and Stubs
**Goal**: The site is discoverable by search engines, scores well on Lighthouse, and has placeholder pages for future features
**Depends on**: Phase 2, Phase 3, Phase 4
**Requirements**: SEO-01, SEO-02, SEO-03, PERF-01, BLOG-01, ASST-01
**Success Criteria** (what must be TRUE):
  1. Every page has appropriate meta tags and Open Graph tags (testable by sharing a URL and seeing a rich preview)
  2. sitemap.xml and robots.txt are generated and accessible
  3. JSON-LD Person schema is present on the home page
  4. Lighthouse scores are 90+ across Performance, Accessibility, Best Practices, and SEO
  5. Writing and AI Assistant pages show clear "coming soon" messages
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md -- Meta tags, Open Graph, JSON-LD structured data, and polished stub pages
- [ ] 05-02-PLAN.md -- Sitemap, robots.txt convention files, and Lighthouse audit

### Phase 6: Infrastructure and Deploy
**Goal**: The site is live on GCP Cloud Run with secure, reproducible deployments
**Depends on**: Phase 5
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. The site is accessible at its public URL on GCP Cloud Run
  2. Docker image uses Next.js standalone output and is under 150MB
  3. Environment variables and secrets are managed via Cloud Run / Secret Manager (no credentials in code)
  4. Service runs with least-privilege permissions and no credential exposure
**Plans**: TBD

Plans:
- [ ] 06-01: Dockerfile with standalone build and multi-stage optimization
- [ ] 06-02: Cloud Run deployment with env vars and Secret Manager
- [ ] 06-03: Security audit and least-privilege verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 2.1 -> 3 -> 4 -> 5 -> 6
(Phase 4 can run in parallel with Phase 3 since both depend on Phase 1)

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Scaffold and Navigation | 2/2 | ✓ Complete | 2026-02-02 |
| 2. Home Page | 2/2 | ✓ Complete | 2026-02-02 |
| 2.1. Building Blocks (INSERTED) | 2/2 | ✓ Complete | 2026-02-02 |
| 3. Projects | 2/2 | ✓ Complete | 2026-02-02 |
| 4. Contact | 2/2 | ✓ Complete | 2026-02-02 |
| 5. SEO, Polish, and Stubs | 0/2 | Not started | - |
| 6. Infrastructure and Deploy | 0/3 | Not started | - |
