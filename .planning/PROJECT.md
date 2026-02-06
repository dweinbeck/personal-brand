# dan-weinbeck.com

## What This Is

A clean, minimal personal website for Dan Weinbeck — a self-taught AI developer, analytics professional, and data scientist. The site gives visitors a fast understanding of who Dan is and what he's built, with featured project cards pulled live from GitHub, a tutorials section, a working contact form backed by Firestore, and production deployment on GCP Cloud Run. It also serves as the foundation for a future personal control center and AI assistant.

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

### Active

- [ ] Live GitHub API integration replacing placeholder project data
- [ ] Individual project detail pages
- [ ] Real article content with MDX authoring pipeline
- [ ] Company/university logos for About page accomplishments

## Current Milestone: v1.2 Content & Data Integration

**Goal:** Replace placeholder data with live sources and real content across the site.

**Target features:**
- Live GitHub API integration replacing placeholder project data
- Individual project detail pages
- Real article content with MDX authoring pipeline
- Company/university logos for About page accomplishments

## Current State

**Shipped:** v1.1 on 2026-02-05
**Live at:** https://personal-brand-130830385601.us-central1.run.app

Building v1.2.

### Out of Scope

- AI chatbot / assistant functionality — deferred to future milestone
- Todoist integration / control center — future milestone
- OAuth / magic link login — no auth needed for public site
- Real-time chat — not relevant for personal site
- Video content — unnecessary complexity
- Mobile app — web only
- Google Analytics — can add later if needed

## Context

- **Live site:** https://dan-weinbeck.com
- **Shipped:** v1.0 MVP on 2026-02-03
- **Codebase:** ~1,638 LOC TypeScript/TSX/CSS/MDX across 105 files
- **Tech stack:** Next.js 16, Tailwind v4, Biome v2.3, Motion v12, Firebase Admin SDK
- **Hosting:** GCP Cloud Run with custom domain and auto-provisioned SSL
- **GitHub profile:** https://github.com/dweinbeck
- **LinkedIn:** https://www.linkedin.com/in/dw789/
- **Design inspiration:** connorbutch.com — clean minimal layout, featured tutorial/project cards
- Headshot asset available in repo root (`headshot.jpeg`)
- The chatbot and control center vision are important to Dan but intentionally deferred

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
| Firebase Admin SDK only | No client SDK needed for v1; server-side Firestore writes only | ✓ Good |
| SSG + ISR rendering strategy | SSG for most pages, ISR (hourly) for GitHub data, SSR for contact action | ✓ Good |
| MDX for tutorial content | Type-safe metadata with exported const objects, filesystem-based discovery | ✓ Good |
| Three-stage Dockerfile | Deps → builder → runner on node:20-alpine with non-root user | ✓ Good |
| Cloud Build for deploys | Serverless Docker builds, no local Docker needed | ✓ Good |
| Chatbot deferred to later milestone | Get the UI foundation right first, then layer on AI features | — Pending |
| Control center deferred to future milestone | v1 is public-facing site; personal tools come later | — Pending |
| Blog as stub | Content creation comes after the site is live | — Pending |

---
*Last updated: 2026-02-06 after v1.2 milestone started*
