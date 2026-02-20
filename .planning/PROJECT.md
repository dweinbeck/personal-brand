# dan-weinbeck.com

## What This Is

A clean, minimal personal website for Dan Weinbeck — a self-taught AI developer, analytics professional, and data scientist. The site gives visitors a fast understanding of who Dan is and what he's built, with an apps-first Home page showcasing published tools, a fully functional Brand Scraper with live progress tracking and Brand Card UI, individual asset management, user scrape history, a Tasks App with effort scoring and demo workspace integrated via weekly credit gating, a tutorials section, an About page with career accomplishments and company logos, an AI assistant powered by an external FastAPI RAG backend with citation and confidence UI, a working contact form backed by Firestore, a billing/credits system with Stripe payments for paid tools, and production deployment on GCP Cloud Run.

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
- ✓ Apps-first Home page with 3-wide grid replacing Projects section — v1.7
- ✓ Updated navbar (Home, About, Building Blocks, Custom GPTs, Apps, Assistant, Contact + conditional Control Center) — v1.7
- ✓ Building Blocks CTA section below apps grid on Home — v1.7
- ✓ Projects pages removed with permanent redirects to / — v1.7
- ✓ Zod schemas aligned with real scraper service taxonomy (ExtractedField wrapper, .passthrough()) — v1.7
- ✓ Defensive safeParse with fallback UI and Download Brand JSON link — v1.7
- ✓ Scraper service pipeline progress events with incremental JSONB persistence — v1.7
- ✓ Live progress UI during scrape (pages scraped + files saved lists) — v1.7
- ✓ Individual GCS asset storage with on-demand zip generation and caching — v1.7
- ✓ Brand Card UI (browser-tab chrome, logos, color palette, extracted font, download buttons) — v1.7
- ✓ Assets page with category grouping, image previews, and per-asset downloads — v1.7
- ✓ User scrape history with Firestore persistence and View Results navigation — v1.7
- ✓ Authenticated zip proxy route with 60s timeout — v1.7
- ✓ Accessible HelpTip tooltip component with centralized content catalog and viewport-aware positioning — v1.8
- ✓ Fibonacci effort scoring (1-13) on tasks with section and project rollup totals — v1.8
- ✓ Firebase Auth integration in todoist app with complete userId scoping across all data — v1.8
- ✓ Cross-service weekly credit gating (100 credits/week, first week free, server-enforced read-only) — v1.8
- ✓ Tasks app listed on /apps hub with link to deployed todoist service — v1.8
- ✓ Client-side demo workspace with ~40 realistic tasks and sign-up CTA — v1.8
- ✓ Billing access check and effort rollup unit tests — v1.8
- ✓ Prisma 6 + Cloud SQL PostgreSQL polyglot persistence (Firestore + PostgreSQL) — v2.0
- ✓ Tasks server actions, Zod schemas, and service layer migrated to personal-brand codebase — v2.0
- ✓ Tasks UI components and sidebar at /apps/tasks with all sub-routes — v2.0
- ✓ Tasks landing page with "Your Tasks at a Glance" KPI dashboard — v2.0
- ✓ Full Tasks feature parity at /apps/tasks (list, board, today, completed, search, tags, subtasks, effort) — v2.0
- ✓ Demo mode at /apps/tasks/demo with ~40 sample tasks (client-side only) — v2.0
- ✓ Tasks billing via direct function import (no external HTTP) — v2.0
- ✓ Apps hub listing uses internal /apps/tasks route — v2.0
- ✓ Standalone Tasks Cloud Run service decommissioned — v2.0
- ✓ Effort scoring accepts any positive integer with subtask budgeting — v2.0
- ✓ Drag-and-drop task reordering between sections (native HTML5 DnD) — v2.0
- ✓ Dismissible free trial banner with dynamic countdown — v2.0
- ✓ Bulk sprint plan data import from JSON — v2.0

### Active

#### Current Milestone: v3.0 GSD Builder OS

**Goal:** Turn the iPhone Action Button into a universal capture device that routes dictated requests and screenshots into GitHub Issues, Tasks, or a Builder Inbox — with LLM-powered routing, Discord alerts, and an admin UI to audit everything.

**Target features:**
- iPhone Action Button dictation capture (API key auth, <10s response)
- Screenshot ingest via Share Sheet (multipart upload to Cloud Storage)
- LLM-based request router (GitHub Issue / Task / Note / Automation)
- GitHub issue creation with automatic @claude comments on every issue
- Tasks creation via existing Tasks service (default project: "Inbox")
- Builder Inbox admin UI in Control Center (list, detail, retry, convert)
- Discord webhook alerts for async notifications
- GitHub Actions workflow for Claude Code (@claude trigger)
- iPhone Shortcuts documentation (GSD Capture + Send to GSD)

### Deferred

- Real article content with MDX authoring pipeline
- Writing page displays real articles (replaces lorem ipsum)
- Optimized logo assets (SVG preferred, PNG fallback)
- Additional paid tools: 60-Second Lesson, Bus Text (pricing entries exist, tools inactive)
- Effort distribution visualization (bar chart across sections)
- Effort badges in board view cards with column totals
- Demo workspace data preservation after sign-up
- Guided demo tour
- Credit balance display in tasks app header
- Billing history for tasks app charges
- Tools page & nav restructure (from v1.9 — rename Custom GPTs to Tools, reorder navbar)
- Chatbot popup widget (from v1.9 — replace /assistant with persistent popup)
- Home page enhancements (from v1.9 — hero layout, tech tags, reading time, dev tools section)
- Contact page polish (from v1.9 — remove extra sections, unify button styles)

### Out of Scope

- Todoist parity (filters, labels, NLP dates, reminders, collaboration) — not needed for personal productivity tool
- Stripe subscriptions for tasks — pre-paid credits model is intentional
- OAuth / magic link login — Firebase Auth (Google Sign-In) covers user auth needs
- Real-time chat — not relevant for personal site
- Video content — unnecessary complexity
- Mobile app — web only
- Google Analytics — can add later if needed
- Tag filtering on projects page — Projects section removed in v1.7; apps grid is primary
- GitHub activity sparklines — adds API complexity for minimal value
- RSS feed — defer until writing content exists
- Dynamic per-page OG images — single branded image sufficient
- Subscription / recurring billing — pre-paid credits model is intentional
- Custom Stripe payment page (Elements) — Checkout redirect is PCI-compliant out of the box
- Brand scraper UI redesign beyond Brand Card + Assets — current UX is complete for v1.7
- Per-task billing — discourages natural task creation; weekly flat rate is better UX
- Feature-tiered access — app is simple enough that partial access feels broken
- Real-time WebSocket updates for tasks — single-user app, page revalidation sufficient
- Rewriting Tasks from PostgreSQL to Firestore — PostgreSQL is the right database for relational task data

## Current State

**Shipped:** v2.0 on 2026-02-19
**Live at:** https://dan-weinbeck.com
**Current milestone:** v3.0 GSD Builder OS

Complete personal brand site with apps-first Home page, fully functional Brand Scraper (live progress, Brand Card, assets page, user history), Tasks App fully integrated at /apps/tasks with KPI dashboard, effort scoring with subtask budgeting, drag-and-drop between sections, demo mode, and bulk data import, career accomplishments with company logos, AI assistant powered by external FastAPI RAG backend with citation and confidence UI, Control Center with content editor and brand scraper admin tools, Custom GPTs public page, billing/credits system with live Stripe payments (ledger-based Firestore credits, Firebase Auth, admin billing panel), and production deployment on GCP Cloud Run.

## Context

- **Codebase:** ~48,400 LOC TypeScript/TSX/CSS/MDX (after v2.0 — +15,900 net lines from Tasks integration)
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
- Brand scraper v1.7: individual GCS assets, on-demand zip, progress events, enriched API response with signed URLs
- Billing system live: ledger-based Firestore credits (1 credit = 1 cent), 100 free on signup, 500 for $5 via Stripe Checkout
- Firebase Auth (Google Sign-In) for public users with AuthGuard/AuthButton components
- Stripe webhook at /api/billing/webhook — signature-verified, idempotent on event ID + session ID
- Admin billing panel at /control-center/billing — user list, detail, adjust credits, refund usage, edit pricing
- 5 tool pricing entries: brand_scraper (active, 50 credits), tasks_app (active, 100 credits/week), lesson_60s, bus_text, dave_ramsey (inactive)
- Tasks app: fully integrated into personal-brand at /apps/tasks (merged from standalone todoist in v2.0) — Prisma/PostgreSQL for task data, Firestore for everything else
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
| Proxy to FastAPI (not direct CORS) | Cloud Run IAM incompatible with browser preflight; proxy eliminates CORS entirely | ✓ Good |
| Remove all old assistant server code | Clean break, FastAPI backend replaces everything | ✓ Good |
| Direct filesystem MDX writes for editor | Simple, git-native; rebuild required to publish — acceptable for single-user admin tool | ✓ Good |
| Proxy brand-scraper API through Next.js route | Same pattern as chatbot proxy; keeps API URL server-side, avoids CORS | ✓ Good |
| AdminGuard for Control Center auth | Existing pattern sufficient for personal admin tools; no new auth system needed | ✓ Good |
| Brand Scraper as cleanly separated component | Well-organized code with clear boundaries, extractable later if needed | ✓ Good |
| Ledger-based Firestore credits | Transaction-safe, idempotent, audit trail for all balance mutations | ✓ Good |
| Firebase Auth for end users | Google Sign-In enables public tool access without building custom auth | ✓ Good |
| Stripe Checkout (not embedded) | Simplest integration, hosted payment page, webhook for fulfillment | ✓ Good |
| Keep inactive tool pricing entries | Real tools planned (60-Second Lesson, Bus Text, Dave Ramsey App); entries ready for activation | ✓ Good |
| Apps hub page for tool discovery | Visitors browse available tools from a single page; matches existing card patterns | ✓ Good |
| Remove Projects pages, pivot Home to apps-first | Projects served their purpose; apps are the primary user-facing content | ✓ Good |
| ExtractedField wrapper with .passthrough() Zod schemas | Forward-compatible with scraper service taxonomy changes | ✓ Good |
| Individual GCS assets + on-demand zip | Memory-efficient, fast delivery; zip only created when requested | ✓ Good |
| Incremental JSONB event persistence | Events persisted during processing; 200-entry cap prevents bloat | ✓ Good |
| Fire-and-forget Firestore history writes | Non-blocking scrape flow; history is supplementary | ✓ Good |
| Dynamic Google Font loading via CSS Font Loading API | Brand Card renders in extracted font; best-effort with system fallback | ✓ Good |
| Tasks app merged into personal-brand (v2.0) | Unified deployment eliminates separate Cloud Run service; shared auth/billing via direct imports | ✓ Good — single deploy, no cross-service auth |
| Polyglot persistence (Firestore + PostgreSQL) | Tasks needs relational queries (joins, self-ref FKs, float ordering); Firestore for everything else | ✓ Good — clean separation of concerns |
| Toggletip interaction for HelpTip | Click pins tooltip, hover opens with delay; centralized catalog for content | ✓ Good — accessible and maintainable |
| Nullable Int for effort field | null = unscored (not 0); distinguishes unscored from scored in rollups | ✓ Good — clean semantics |
| onIdTokenChanged for auth cookie sync | Automatic refresh on token rotation; __session cookie name matches Cloud Run convention | ✓ Good — seamless token lifecycle |
| Server actions accept idToken as first param | Explicit client-to-server token flow; verifyUser() on every mutation | ✓ Good — secure by design |
| Section/Project ownership via workspace chain | No direct userId column needed; ownership verified through workspace hierarchy | ✓ Good — normalized schema |
| Mirror checkEnvelopeAccess pattern for tasks billing | Same free-week → paid-week → debit flow; proven pattern from brand scraper | ✓ Good — consistent billing UX |
| Read-only demo components (not shared mutation components) | Demo route is fully client-side with zero server dependencies | ✓ Good — clean isolation |
| useDemoMode() defaults to false | Guards are no-ops outside /demo tree; zero impact on production /tasks routes | ✓ Good — safe by default |

---
*Last updated: 2026-02-20 after v3.0 milestone start*
