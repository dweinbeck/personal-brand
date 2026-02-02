# Requirements: dan-weinbeck.com

**Defined:** 2026-02-01
**Core Value:** Visitors can understand who Dan is and see proof of his work within 60 seconds

## v1 Requirements

### Navigation

- [ ] **NAV-01**: Responsive navbar with links to all 5 sections (Home, Projects, Writing, Assistant, Contact)
- [ ] **NAV-02**: Mobile hamburger menu with smooth open/close
- [ ] **NAV-03**: Active page indicator in navigation

### Home

- [ ] **HOME-01**: Hero section with headshot, name, tagline, and short bio
- [ ] **HOME-02**: CTA buttons (View Projects, Contact, GitHub, LinkedIn)
- [ ] **HOME-03**: Featured project cards section on home page (connorbutch-style)
- [ ] **HOME-04**: Blog teaser section with "coming soon" and link to Writing page

### Projects

- [ ] **PROJ-01**: Project cards pulled from GitHub API with repo description, language, and topics
- [ ] **PROJ-02**: Project grid layout responsive across all screen sizes
- [ ] **PROJ-03**: Links to GitHub repo (and live demo if homepage URL set)
- [ ] **PROJ-04**: ISR caching of GitHub data (revalidate hourly)

### Writing

- [ ] **BLOG-01**: Stub page with coming soon message

### AI Assistant

- [ ] **ASST-01**: Placeholder page with coming soon message

### Contact

- [ ] **CONT-01**: Contact form with name, email, and message fields
- [ ] **CONT-02**: Server-side form validation and spam protection (honeypot + rate limiting)
- [ ] **CONT-03**: Form submissions stored in Firestore
- [ ] **CONT-04**: Email address with click-to-copy functionality
- [ ] **CONT-05**: Social links (LinkedIn, Instagram, GitHub)

### Design & Performance

- [ ] **PERF-01**: Lighthouse >= 90 for Performance, Accessibility, Best Practices, SEO
- [ ] **PERF-02**: Mobile responsive across all pages
- [ ] **PERF-03**: Optimized images via Next.js Image component
- [ ] **PERF-04**: Subtle animations (page transitions, card hover effects)

### SEO

- [ ] **SEO-01**: Meta tags and Open Graph tags on all pages
- [ ] **SEO-02**: Generated sitemap.xml and robots.txt
- [ ] **SEO-03**: JSON-LD structured data (Person schema)

### Infrastructure

- [ ] **INFRA-01**: Deployed on GCP Cloud Run
- [ ] **INFRA-02**: Next.js standalone Docker build (< 150MB image)
- [ ] **INFRA-03**: Environment variables via Cloud Run / Secret Manager
- [ ] **INFRA-04**: Secure-by-default (no credential exposure, least privilege)

## v2 Requirements

### Design Enhancements

- **DESIGN-01**: Dark/light mode toggle
- **DESIGN-02**: Custom 404/500 error pages with branded design

### AI Assistant

- **ASST-02**: Conversational AI chatbot for portfolio exploration
- **ASST-03**: Answers questions about Dan's background, skills, and projects
- **ASST-04**: Site navigation assistance via chatbot

### Blog

- **BLOG-02**: MDX-powered blog with content pages
- **BLOG-03**: Blog listing page with post previews

## Out of Scope

| Feature | Reason |
|---------|--------|
| Todoist integration / control center | Future milestone — v1 is public-facing site |
| User authentication / login | No auth needed for public portfolio |
| Comments system | Adds moderation burden, low value |
| Real-time features (WebSockets) | Unnecessary complexity |
| Video hosting | Storage/bandwidth costs; use YouTube embeds if needed |
| Multi-language support | English only, Dan's audience is English-speaking |
| Custom analytics dashboard | Use Google Analytics or Plausible directly |
| OAuth / magic link login | No login needed |
| Mobile app | Web-first, no native app |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | TBD | Pending |
| NAV-02 | TBD | Pending |
| NAV-03 | TBD | Pending |
| HOME-01 | TBD | Pending |
| HOME-02 | TBD | Pending |
| HOME-03 | TBD | Pending |
| HOME-04 | TBD | Pending |
| PROJ-01 | TBD | Pending |
| PROJ-02 | TBD | Pending |
| PROJ-03 | TBD | Pending |
| PROJ-04 | TBD | Pending |
| BLOG-01 | TBD | Pending |
| ASST-01 | TBD | Pending |
| CONT-01 | TBD | Pending |
| CONT-02 | TBD | Pending |
| CONT-03 | TBD | Pending |
| CONT-04 | TBD | Pending |
| CONT-05 | TBD | Pending |
| PERF-01 | TBD | Pending |
| PERF-02 | TBD | Pending |
| PERF-03 | TBD | Pending |
| PERF-04 | TBD | Pending |
| SEO-01 | TBD | Pending |
| SEO-02 | TBD | Pending |
| SEO-03 | TBD | Pending |
| INFRA-01 | TBD | Pending |
| INFRA-02 | TBD | Pending |
| INFRA-03 | TBD | Pending |
| INFRA-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 0
- Unmapped: 29 ⚠️

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after initial definition*
