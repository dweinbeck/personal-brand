# Requirements: dan-weinbeck.com v1.1

**Defined:** 2026-02-04
**Core Value:** Visitors can understand who Dan is and see proof of his work within 60 seconds

## v1.1 Requirements

Requirements for v1.1 Page Buildout & Polish. Each maps to roadmap phases.

### Projects Page

- [ ] **PROJ-01**: Projects page displays cards in a 2-across grid layout with more detail than home page
- [ ] **PROJ-02**: Each project card shows project name and one-paragraph description
- [ ] **PROJ-03**: Each project card shows topic/software/platform tags
- [ ] **PROJ-04**: Each project card shows date initiated and last commit date
- [ ] **PROJ-05**: Each project card shows public or private designation
- [ ] **PROJ-06**: Each project card has a large button linking to a project-specific page (placeholder/dead link for now)
- [ ] **PROJ-07**: Page has headline "Current and Past Projects" with same background as home page
- [ ] **PROJ-08**: User can filter or sort projects by tag or date

### Writing Page

- [ ] **WRIT-01**: Writing page displays with title "Writing" and subtitle "Articles and Blog Posts by Dan"
- [ ] **WRIT-02**: Article cards display in same format/style as Projects page cards
- [ ] **WRIT-03**: Each article card shows article title, publish date, and topic tag
- [ ] **WRIT-04**: Page renders with lorem ipsum placeholder articles (real content deferred)

### Contact Page

- [ ] **CONT-01**: Hero section with headline "Contact Dan" and subhead "Fastest is email. Form works too — I read everything."
- [ ] **CONT-02**: Primary CTA button opens mailto link (Email Dan)
- [ ] **CONT-03**: Copy Email button copies address to clipboard with confirmation feedback
- [ ] **CONT-04**: LinkedIn message button links to Dan's LinkedIn profile
- [ ] **CONT-05**: Microcopy displays "Typical reply: 1-2 business days" and urgent-subject tip
- [ ] **CONT-06**: Form has inline validation for email format and message minimum length
- [ ] **CONT-07**: Clear success state: "Sent -- thanks. I'll reply within X."
- [ ] **CONT-08**: Failure state with direct email fallback: "Couldn't send right now. Please email me at ..."
- [ ] **CONT-09**: Loading state with disabled submit button
- [ ] **CONT-10**: JS-disabled fallback (email-only fallback or basic HTML form post)
- [ ] **CONT-11**: Honeypot field for spam protection (existing -- preserve)
- [ ] **CONT-12**: Rate limiting by IP (existing -- preserve)
- [ ] **CONT-13**: Server-side validation with length limits (existing -- preserve)
- [ ] **CONT-14**: "Other Ways to Reach Me" section with LinkedIn and GitHub links
- [ ] **CONT-15**: Privacy/retention disclosure: messages used only to respond, stored up to 90 days, no sensitive info
- [ ] **CONT-16**: Analytics event stubs for copy, click, form start, submit, error (no-op trackEvent function)
- [ ] **CONT-17**: Works on mobile -- single-column layout with large tap targets

### Branding & Polish

- [ ] **BRAND-01**: Branded OG image (1200x630) replacing 1x1 placeholder for social sharing
- [ ] **BRAND-02**: Favicon showing "DW" text inside a gold rounded-corner square
- [ ] **BRAND-03**: Gold underline accent on the "DW" logo in the navbar

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Projects

- **PROJ-F01**: Live GitHub API integration replacing placeholder data
- **PROJ-F02**: Individual project detail pages (linked from card buttons)
- **PROJ-F03**: Private repo display with authenticated GitHub API

### Writing

- **WRIT-F01**: Real article content with MDX authoring pipeline
- **WRIT-F02**: Per-article OG images for social sharing
- **WRIT-F03**: Reading time estimates on cards

### Contact

- **CONT-F01**: Real analytics provider integration (Plausible/Umami) replacing stubs
- **CONT-F02**: Prompt-injection content blocking in form submissions

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI chatbot / assistant | Deferred to future milestone |
| Todoist integration / control center | Future milestone |
| Real analytics dashboards | Stub events now; wire provider when volume justifies it |
| CMS for project/article data | Filesystem and hardcoded data sufficient for v1.1 |
| OAuth / user accounts | No auth needed for public site |
| Per-article OG images | Defer until real articles exist |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 7 | Pending |
| BRAND-02 | Phase 7 | Pending |
| BRAND-03 | Phase 7 | Pending |
| PROJ-01 | Phase 8 | Pending |
| PROJ-02 | Phase 8 | Pending |
| PROJ-03 | Phase 8 | Pending |
| PROJ-04 | Phase 8 | Pending |
| PROJ-05 | Phase 8 | Pending |
| PROJ-06 | Phase 8 | Pending |
| PROJ-07 | Phase 8 | Pending |
| PROJ-08 | Phase 8 | Pending |
| WRIT-01 | Phase 9 | Pending |
| WRIT-02 | Phase 9 | Pending |
| WRIT-03 | Phase 9 | Pending |
| WRIT-04 | Phase 9 | Pending |
| CONT-01 | Phase 10 | Pending |
| CONT-02 | Phase 10 | Pending |
| CONT-03 | Phase 10 | Pending |
| CONT-04 | Phase 10 | Pending |
| CONT-05 | Phase 10 | Pending |
| CONT-06 | Phase 10 | Pending |
| CONT-07 | Phase 10 | Pending |
| CONT-08 | Phase 10 | Pending |
| CONT-09 | Phase 10 | Pending |
| CONT-10 | Phase 10 | Pending |
| CONT-11 | Phase 10 | Pending |
| CONT-12 | Phase 10 | Pending |
| CONT-13 | Phase 10 | Pending |
| CONT-14 | Phase 10 | Pending |
| CONT-15 | Phase 10 | Pending |
| CONT-16 | Phase 10 | Pending |
| CONT-17 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-04 after roadmap creation*
