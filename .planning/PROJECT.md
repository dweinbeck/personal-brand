# dan-weinbeck.com

## What This Is

A clean, minimal personal website for Dan Weinbeck — a self-taught AI developer, analytics professional, and data scientist. The site gives visitors a fast understanding of who Dan is and what he's built, with featured project cards pulled from GitHub, clear contact options, and a professional-but-approachable light design. It also serves as the foundation for a future personal control center and AI assistant.

## Core Value

Visitors can understand who Dan is and see proof of his work within 60 seconds of landing on the site.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Home page with hero section (headshot, tagline, CTAs)
- [ ] Project cards pulled from GitHub API (featured/curated display, connorbutch-style)
- [ ] Projects page with full project listing
- [ ] Writing/Blog stub page (coming soon placeholder)
- [ ] AI Assistant placeholder page (coming soon, built in later phase)
- [ ] Contact page with email, LinkedIn, Instagram, and contact form
- [ ] Navigation across all 5 sections (Home, Projects, Writing, Assistant, Contact)
- [ ] Light + clean visual design, professional but approachable
- [ ] Mobile responsive, optimized images, fast initial render
- [ ] Deployed on GCP Cloud Run
- [ ] Firestore + Cloud Storage for data/assets
- [ ] Lighthouse >= 90 for Performance, Accessibility, Best Practices, SEO
- [ ] Custom 404/500 error pages with navigation back home
- [ ] Contact form with spam protection (first-party endpoint on Cloud Run)
- [ ] Secure-by-default (least privilege, secret management, basic abuse protection)

### Out of Scope

- AI chatbot / assistant functionality — deferred to later phase in this milestone
- Todoist integration / control center — future milestone
- OAuth / magic link login — no auth needed for v1 public site
- Real-time chat — not relevant for personal site
- Video content — unnecessary complexity for v1
- Mobile app — web only
- Google Analytics — can add later if needed

## Context

- Dan's site brief (`dan-weinbeck_SITE_BRIEF.md`) contains wireframe, audience details, and success metrics
- YAML version of brief also in repo (`dan-weinbeck_site-brief.yaml`)
- Headshot asset available in repo root (`headshot.jpeg`)
- Resume available as source material (Dan_Weinbeck_Resume.docx — not in repo)
- GitHub profile: https://github.com/dweinbeck
- LinkedIn: https://www.linkedin.com/in/dw789/
- Design inspiration: connorbutch.com — clean minimal layout, featured tutorial/project cards
- The chatbot and control center vision are important to Dan but intentionally deferred to keep v1 focused on the public-facing site

## Constraints

- **Tech stack**: Next.js (TypeScript), GCP Cloud Run, Firestore, Cloud Storage — Dan's explicit preference
- **Hosting**: GCP Cloud Run — already decided
- **Security**: Secure-by-default with least privilege, secret management, basic abuse protection
- **Performance**: Lighthouse >= 90 across all categories
- **Mobile**: Must be responsive and fast on slow networks

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + TypeScript | Dan's stated preference, good fit for SSR/SSG personal site | — Pending |
| GCP Cloud Run hosting | Dan's stated preference, familiar infrastructure | — Pending |
| GitHub API for project data | Automatic, always current, no manual curation needed | — Pending |
| Chatbot deferred to later phase | Get the UI foundation right first, then layer on AI features | — Pending |
| Control center deferred to future milestone | v1 is public-facing site; personal tools come later | — Pending |
| Light + clean design | Professional but approachable aesthetic, Dan's preference | — Pending |
| Blog as stub | Content creation comes after the site is live | — Pending |

---
*Last updated: 2026-02-01 after initialization*
