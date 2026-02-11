# dan-weinbeck.com

## What This Is

A clean, minimal personal website for Dan Weinbeck — a self-taught AI developer, analytics professional, and data scientist. The site gives visitors a fast understanding of who Dan is and what he's built, with project cards pulling live data from GitHub's API, individual project detail pages with README rendering, a tutorials section, an About page with career accomplishments and company logos, an AI assistant powered by an external FastAPI RAG backend with citation and confidence UI, a working contact form backed by Firestore, a billing/credits system with Stripe payments for paid tools, and production deployment on GCP Cloud Run.

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
- ✓ Assistant backend swap to external FastAPI RAG service (proxy to Cloud Run) — v1.3
- ✓ Remove old assistant server code (API route, safety pipeline, knowledge base, rate limiting, logging, admin panel) — v1.3
- ✓ Render citations from RAG responses in chat UI with confidence badges — v1.3
- ✓ Clean up dead code and unused dependencies from old assistant — v1.3
- ✓ Building Blocks content editor with form-guided inputs and live preview tab — v1.4
- ✓ Editor writes MDX files directly to filesystem (matching published output format) — v1.4
- ✓ Optional fast companion content support in editor — v1.4
- ✓ Brand Scraper URL collector (submits to deployed Cloud Run API) — v1.4
- ✓ Brand Scraper results gallery — 2-wide cards showing colors, fonts, logos, assets with confidence — v1.4
- ✓ Brand Scraper component cleanly separated for potential reuse — v1.4
- ✓ Control Center navigation to switch between features (repos, todoist, editor, brand scraper) — v1.4
- ✓ Custom GPTs public page with responsive card grid — v1.4
- ✓ Billing/credits system validated and committed (~2,810 LOC) — v1.5
- ✓ Firebase Auth (Google Sign-In) for end users with AuthGuard and AuthButton — v1.5
- ✓ Stripe Checkout integration with webhook processing and GCP Secret Manager — v1.5
- ✓ Brand Scraper tool integration with billing (debit credits, auto-refund on failure) — v1.5
- ✓ Update brand-scraper integration for v1.1 deployment (real Cloud Run URL, GCS signed URLs) — v1.5
- ✓ Admin billing panel (user management, credit adjustments, usage refunds, pricing editor) — v1.5
- ✓ Deploy billing system to production on Cloud Run with live Stripe payments — v1.5
- ✓ Apps hub page at /apps with 2-across grid displaying available tools — v1.6
- ✓ AppCard component with topic badge, tech stack tags, dates, and conditional action button — v1.6
- ✓ "Apps" navigation link with correct active state on /apps and /apps/* — v1.6
- ✓ Sitemap includes /apps and /apps/brand-scraper — v1.6

### Active

**v1.7 — Apps-first Home + Brand Scraper Overhaul:**

- [ ] Remove Projects pages/routes with redirect to /
- [ ] Navbar: Home, About, Building Blocks, Custom GPTs, Apps, Assistant, Contact + conditional Control Center
- [ ] Home page: Apps grid section (3-wide, uniform cards, blue fill + gold border buttons)
- [ ] Home page: Building Blocks CTA section below apps
- [ ] Remove duplicative navigational Home sections
- [ ] Fix taxonomy schema mismatch between scraper service and main site
- [ ] Live progress UI during active scrape (pages scraped + files saved)
- [ ] Individual GCS asset storage in scraper service (no auto-zip on completion)
- [ ] On-demand zip generation endpoint in scraper service
- [ ] Brand Card UI (single wide card with favicon tab, logos, palette, extracted font)
- [ ] Assets page with previews and per-file downloads
- [ ] User history for Brand Scraper (previously scraped URLs with View Results)
- [ ] Defensive error handling for schema parsing failures

### Deferred

- Real article content with MDX authoring pipeline
- Writing page displays real articles (replaces lorem ipsum)
- Optimized logo assets (SVG preferred, PNG fallback)
- Additional paid tools: 60-Second Lesson, Bus Text, Dave Ramsey App (pricing entries exist, tools inactive)

### Out of Scope

- Todoist integration / control center — partially delivered v1.4 (editor + brand scraper)
- OAuth / magic link login — Firebase Auth (Google Sign-In) covers user auth needs
- Real-time chat — not relevant for personal site
- Video content — unnecessary complexity
- Mobile app — web only
- Google Analytics — can add later if needed
- Tag filtering on projects page — not enough projects yet
- GitHub activity sparklines — adds API complexity for minimal value
- RSS feed — defer until writing content exists
- Dynamic per-page OG images — single branded image sufficient
- Subscription / recurring billing — pre-paid credits model is intentional
- Custom Stripe payment page (Elements) — Checkout redirect is PCI-compliant out of the box

## Current Milestone: v1.7 Apps-first Home + Brand Scraper Overhaul

**Goal:** Pivot Home page to showcase apps as the primary content, remove Projects section, and make Brand Scraper fully functional with real-time progress, proper taxonomy rendering, asset management, and user history.

**Target features:**
- Apps-first Home page with 3-wide grid replacing Projects section
- Updated navbar with conditional Control Center visibility
- Brand Scraper end-to-end fix (schema alignment, progress events, Brand Card, assets page, history)
- Cross-repo changes (main site + brand-scraper Fastify service)

## Current State

**Shipped:** v1.6 on 2026-02-10
**Live at:** https://dan-weinbeck.com

Complete personal brand site with live GitHub data, project detail pages, career accomplishments with company logos, AI assistant powered by external FastAPI RAG backend with citation and confidence UI, Control Center with content editor and brand scraper admin tools, Custom GPTs public page, billing/credits system with live Stripe payments (ledger-based Firestore credits, Firebase Auth, admin billing panel), Apps hub page for tool discovery, and production deployment on GCP Cloud Run.

## Context

- **Codebase:** ~9,200 LOC TypeScript/TSX/CSS/MDX (estimated after v1.6 additions)
- **Tech stack:** Next.js 16, Tailwind v4, Biome v2.3, Motion v12, Firebase Admin SDK + Auth, Stripe, react-markdown, Vitest
- **Hosting:** GCP Cloud Run with custom domain and auto-provisioned SSL
- **GitHub profile:** https://github.com/dweinbeck
- **LinkedIn:** https://www.linkedin.com/in/dw789/
- **Design inspiration:** connorbutch.com — clean minimal layout, featured tutorial/project cards
- Headshot asset available in repo root (`headshot.jpeg`)
- The chatbot backend (chatbot-assistant) is a separate Python/FastAPI service already deployed on Cloud Run
- chatbot-assistant provides: GitHub webhook ingestion, Postgres FTS + trigram search, Cloud Tasks async indexing, Gemini 2.5 Flash-Lite, mechanical citation verification
- Control center shipped in v1.4 with content editor and brand scraper admin tools
- Brand scraper API (brand-scraper) is a separate Fastify/Cloud Run service with async job processing, Playwright extraction, and GCS storage
- Brand scraper worker not processing jobs — BSINT-02 and E2E-06 will resolve when worker is deployed
- Billing system live: ledger-based Firestore credits (1 credit = 1 cent), 100 free on signup, 500 for $5 via Stripe Checkout
- Firebase Auth (Google Sign-In) for public users with AuthGuard/AuthButton components
- Stripe webhook at /api/billing/webhook — signature-verified, idempotent on event ID + session ID
- Admin billing panel at /control-center/billing — user list, detail, adjust credits, refund usage, edit pricing
- 4 tool pricing entries: brand_scraper (active, 50 credits), lesson_60s, bus_text, dave_ramsey (inactive)
- Stripe secrets via GCP Secret Manager: stripe-secret-key (v4, live), stripe-webhook-secret (v3, live)

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
| Chatbot deferred to later milestone | Get the UI foundation right first, then layer on AI features | ✓ Good — integrated in v1.3 |
| Proxy to FastAPI (not direct CORS) | Cloud Run IAM incompatible with browser preflight; proxy eliminates CORS entirely | ✓ Good — simpler than original CORS plan |
| Remove all old assistant server code | Clean break, FastAPI backend replaces everything | ✓ Good — 32 files, ~875 lines removed |
| Control center deferred to future milestone | v1 is public-facing site; personal tools come later | ✓ Good — building in v1.4 |
| Direct filesystem MDX writes for editor | Simple, git-native; rebuild required to publish — acceptable for single-user admin tool | ✓ Good |
| Proxy brand-scraper API through Next.js route | Same pattern as chatbot proxy; keeps API URL server-side, avoids CORS | ✓ Good |
| AdminGuard for Control Center auth | Existing pattern sufficient for personal admin tools; no new auth system needed | ✓ Good |
| Brand Scraper as cleanly separated component | Well-organized code with clear boundaries, but no special packaging — extractable later if needed | ✓ Good |
| Ledger-based Firestore credits | Transaction-safe, idempotent, audit trail for all balance mutations | ✓ Good — live with real payments |
| Firebase Auth for end users | Google Sign-In enables public tool access without building custom auth | ✓ Good — seamless sign-in experience |
| Stripe Checkout (not embedded) | Simplest integration, hosted payment page, webhook for fulfillment | ✓ Good — PCI-compliant, zero payment UI code |
| Keep inactive tool pricing entries | Real tools planned (60-Second Lesson, Bus Text, Dave Ramsey App); entries ready for future milestones | ✓ Good — ready for activation |

| Apps hub page for tool discovery | Visitors can browse available tools from a single page; matches existing card patterns | ✓ Good |
| Remove Projects pages, pivot Home to apps-first | Projects section served its purpose; apps are the primary user-facing content now | — Pending |
| Both-repo milestone (main site + scraper service) | Brand Scraper fixes require coordinated changes across service boundary | — Pending |

---
*Last updated: 2026-02-10 after v1.7 milestone started*
