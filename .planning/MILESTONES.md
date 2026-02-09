# Project Milestones: dan-weinbeck.com

## v1.3 Assistant Backend Integration (Shipped: 2026-02-08)

**Delivered:** Replaced internal Gemini-powered assistant with an external FastAPI RAG service proxy, added citation and confidence UI, removed 32 files of dead code, and cleaned up orphaned dependencies.

**Phases completed:** 13-16 (7 plans total)

**Key accomplishments:**

- FastAPI proxy route replacing Gemini direct calls — Next.js API route proxies to external RAG backend on Cloud Run
- Citation and confidence UI — collapsible source list with GitHub permalink URLs and color-coded confidence badges
- Dead code removal — 32 files deleted (~875 lines), including old safety pipeline, knowledge base, admin panel, and data files
- Dependency cleanup — @ai-sdk/google uninstalled, CI/CD config updated for CHATBOT_API_URL, stale env vars and secrets removed
- Zero frontend transport changes — existing useChat hook and DefaultChatTransport preserved throughout migration

**Stats:**

- 153 files changed
- +10,195 / -3,213 lines
- 4 phases, 7 plans
- 1 day (Feb 8, 2026)

**Git range:** `40747ab` → `8377843`

**What's next:** Real writing content, article authoring pipeline, control center vision

---

## v1.2 Content & Data Integration (Shipped: 2026-02-07)

**Delivered:** Live GitHub API integration replacing placeholder project data, individual project detail pages with README rendering, and company/university logos on About page accomplishment cards.

**Phases completed:** 11-12 (4 plans total)

**Key accomplishments:**

- Live GitHub API integration with ISR caching — projects page fetches real repository data
- Individual project detail pages at `/projects/[slug]` with full README rendering via react-markdown
- Homepage featured projects unified with projects page data source (eliminated duplicate hardcoded data)
- SEO sitemap expansion with dynamic project detail page URLs and GitHub API dates
- Company/university SVG logos (3M, Darden, Disney, Iowa, Tufts) on About page accomplishment cards

**Stats:**

- 29 files changed
- +1,256 / -425 lines (net +831)
- 2 phases, 4 plans, 8 tasks
- 2 days (Feb 6-7, 2026)

**Git range:** `e85fefc` → `599f9b9`

**What's next:** Real writing content, article authoring pipeline, further site polish

---

## v1.1 Page Buildout & Polish (Shipped: 2026-02-05)

**Delivered:** Enhanced page content across Projects, Writing, Contact, and a new About page with accomplishment cards and detail pages. Polished branding with custom favicon, OG image, and logo accent.

**Phases completed:** 7-10.1 (6 plans total)

**Key accomplishments:**

- Branded favicon (DW in gold), dynamic OG image, navbar logo accent
- Projects page with detailed 2-across cards, tags, dates, filtering
- Writing page with article cards and lorem ipsum placeholders
- Contact page redesign with mailto CTA, form UX states, privacy disclosure
- About page with 7 accomplishment cards from resume (5 professional + 2 education)
- Accomplishment detail pages with Setup, Work Completed, Results, Skills Unlocked sections
- AI Assistant chatbot with knowledge base and safety guardrails

**Stats:**

- 100 files changed
- ~6,400 lines added
- 5 phases, 6 plans
- 2 days (Feb 4-5, 2026)

**Git range:** `4d8f0e7` → `05bf49f`

**What's next:** Real content population, GitHub API integration for live project data

---

## v1.0 MVP (Shipped: 2026-02-03)

**Delivered:** A complete personal brand website with GitHub-integrated project cards, contact form with Firestore storage, tutorials section, full SEO optimization, and production deployment on GCP Cloud Run at dan-weinbeck.com.

**Phases completed:** 1-6 + 2.1 (14 plans total)

**Key accomplishments:**

- Responsive site shell with navbar, mobile menu, and active page indicator
- Home page with hero section, featured projects grid, and blog teaser with animations
- Tutorial browsing system with MDX content and filesystem-based content discovery
- Live GitHub API integration with ISR caching for automatic project data
- Contact form with Firestore storage, honeypot spam protection, and rate limiting
- SEO metadata, JSON-LD, sitemap/robots.txt — Lighthouse scores 95/100/100/100
- One-command Cloud Run deployment with custom domain and auto-provisioned SSL

**Stats:**

- 105 files created/modified
- 1,638 lines of TypeScript/TSX/CSS/MDX
- 7 phases, 14 plans
- 16 days from project start to ship (Jan 18 → Feb 3, 2026)

**Git range:** initial commit → `ae3ee4a`

**What's next:** UI design refresh and new feature development (v1.1+)

---
