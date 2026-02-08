# dan-weinbeck.com

## What This Is

A clean, minimal personal website for Dan Weinbeck — a self-taught AI developer, analytics professional, and data scientist. The site gives visitors a fast understanding of who Dan is and what he's built, with project cards pulling live data from GitHub's API, individual project detail pages with README rendering, a tutorials section, an About page with career accomplishments and company logos, a working contact form backed by Firestore, and production deployment on GCP Cloud Run.

## Core Value

Visitors can understand who Dan is and see proof of his work within 60 seconds of landing on the site.

## Requirements

### Validated

- ✓ Home page with hero section (headshot, tagline, CTAs) — v1.0
- ✓ Project cards pulled from GitHub API (featured/curated display) — v1.0
- ✓ Projects page with full project listing — v1.0
- ✓ Writing/Blog stub page (coming soon placeholder) — v1.0
- ✓ AI Assistant placeholder page (coming soon) — v1.0
- ✓ Contact page with email, LinkedIn, Instagram, and contact form — v1.0
- ✓ Navigation across all sections (Home, Projects, Building Blocks, Writing, Assistant, Contact) — v1.0
- ✓ Light + clean visual design, professional but approachable — v1.0
- ✓ Mobile responsive, optimized images, fast initial render — v1.0
- ✓ Deployed on GCP Cloud Run — v1.0
- ✓ Firestore for contact form data — v1.0
- ✓ Lighthouse >= 90 for Performance, Accessibility, Best Practices, SEO — v1.0
- ✓ Contact form with spam protection (honeypot + rate limiting) — v1.0
- ✓ Secure-by-default (least privilege, secret management, basic abuse protection) — v1.0
- ✓ Tutorials section with MDX content (Building Blocks) — v1.0
- ✓ Projects page redesign — 2-across cards with descriptions, tags, dates, filtering — v1.1
- ✓ Writing page — article cards with title, date, topic tags — v1.1
- ✓ Contact page redesign — mailto CTA, form UX states, privacy note, analytics stubs — v1.1
- ✓ Branded OG image (1200×630) for social sharing — v1.1
- ✓ DW logo gold underline accent — v1.1
- ✓ DW favicon in browser tab — v1.1
- ✓ About page — accomplishment cards from resume with detail pages — v1.1
- ✓ AI Assistant chatbot with knowledge base and safety guardrails — v1.1
- ✓ Live GitHub API integration replacing placeholder project data — v1.2
- ✓ Individual project detail pages with README rendering — v1.2
- ✓ Homepage featured projects unified with projects page data source — v1.2
- ✓ Company/university logos for About page accomplishments — v1.2

### Active

- [ ] Assistant backend swap to external FastAPI RAG service (chatbot-assistant on Cloud Run)
- [ ] Direct frontend-to-backend connection (CORS, no proxy)
- [ ] Remove old assistant server code (API route, safety pipeline, knowledge base, rate limiting, logging)
- [ ] Render citations from RAG responses in chat UI
- [ ] Clean up dead code and unused dependencies from old assistant

### Deferred

- Real article content with MDX authoring pipeline
- Writing page displays real articles (replaces lorem ipsum)
- Optimized logo assets (SVG preferred, PNG fallback)

### Out of Scope

- Todoist integration / control center — future milestone
- OAuth / magic link login — no auth needed for public site
- Real-time chat — not relevant for personal site
- Video content — unnecessary complexity
- Mobile app — web only
- Google Analytics — can add later if needed
- Tag filtering on projects page — not enough projects yet
- GitHub activity sparklines — adds API complexity for minimal value
- RSS feed — defer until writing content exists
- Dynamic per-page OG images — single branded image sufficient

## Current Milestone: v1.3 Assistant Backend Integration

**Goal:** Replace the curated-knowledge AI assistant with the full RAG backend from chatbot-assistant, connecting the frontend directly to the deployed FastAPI service on Cloud Run.

**Target features:**
- Swap chat API from internal Next.js route to external FastAPI Cloud Run service
- Direct CORS connection (no proxy layer)
- Remove all old assistant server code (API route, safety pipeline, knowledge base, rate limiting)
- Render RAG citations in chat responses
- Clean up unused code and dependencies

## Current State

**Shipped:** v1.2 on 2026-02-07
**Live at:** https://dan-weinbeck.com

Complete personal brand site with live GitHub data, project detail pages, career accomplishments with company logos, AI assistant (curated knowledge base), and production deployment.

## Context

- **Codebase:** ~6,649 LOC TypeScript/TSX/CSS/MDX
- **Tech stack:** Next.js 16, Tailwind v4, Biome v2.3, Motion v12, Firebase Admin SDK, react-markdown
- **Hosting:** GCP Cloud Run with custom domain and auto-provisioned SSL
- **GitHub profile:** https://github.com/dweinbeck
- **LinkedIn:** https://www.linkedin.com/in/dw789/
- **Design inspiration:** connorbutch.com — clean minimal layout, featured tutorial/project cards
- Headshot asset available in repo root (`headshot.jpeg`)
- The chatbot backend (chatbot-assistant) is a separate Python/FastAPI service already deployed on Cloud Run
- chatbot-assistant provides: GitHub webhook ingestion, Postgres FTS + trigram search, Cloud Tasks async indexing, Gemini 2.5 Flash-Lite, mechanical citation verification
- The control center vision is important to Dan but intentionally deferred

## Constraints

- **Tech stack**: Next.js (TypeScript), GCP Cloud Run, Firestore — Dan's explicit preference
- **Hosting**: GCP Cloud Run — already deployed
- **Security**: Secure-by-default with least privilege, secret management, basic abuse protection
- **Performance**: Lighthouse >= 90 across all categories
- **Mobile**: Must be responsive and fast on slow networks

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 16 + TypeScript | Dan's stated preference, good fit for SSR/SSG personal site | ✓ Good |
| GCP Cloud Run hosting | Dan's stated preference, familiar infrastructure | ✓ Good |
| GitHub API for project data | Automatic, always current, no manual curation needed | ✓ Good |
| Tailwind v4 + Biome v2.3 | Modern tooling, Biome replaces ESLint + Prettier | ✓ Good |
| Firebase Admin SDK only | No client SDK needed; server-side Firestore writes only | ✓ Good |
| SSG + ISR rendering strategy | SSG for most pages, ISR (hourly) for GitHub data, SSR for contact action | ✓ Good |
| MDX for tutorial content | Type-safe metadata with exported const objects, filesystem-based discovery | ✓ Good |
| Three-stage Dockerfile | Deps → builder → runner on node:20-alpine with non-root user | ✓ Good |
| Cloud Build for deploys | Serverless Docker builds, no local Docker needed | ✓ Good |
| Curated config + API enrichment | projects.json holds metadata, GitHub API enriches with live data | ✓ Good |
| react-markdown for README rendering | Lightweight, supports GFM via remark-gfm plugin | ✓ Good |
| SVG logos for accomplishment cards | Scalable, small file size, renders cleanly at 32x32px | ✓ Good |
| Max 6 featured projects on homepage | Keeps homepage focused and performant | ✓ Good |
| Chatbot deferred to later milestone | Get the UI foundation right first, then layer on AI features | ✓ Good — now integrating in v1.3 |
| Direct CORS to FastAPI (no proxy) | Cleaner architecture, no middleware to maintain, backend handles its own auth/rate-limiting | — Pending |
| Remove all old assistant server code | Clean break, FastAPI backend replaces everything | — Pending |
| Control center deferred to future milestone | v1 is public-facing site; personal tools come later | — Pending |

---
*Last updated: 2026-02-08 after v1.3 milestone start*
