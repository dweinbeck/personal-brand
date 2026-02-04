# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Visitors can understand who Dan is and see proof of his work within 60 seconds
**Current focus:** Phase 6 in progress -- Docker and deploy infrastructure

## Current Position

Phase: 6 of 6 (Infrastructure & Deploy)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-02-03 -- Completed 06-02-PLAN.md

Progress: [██████████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: ~3.0 min
- Total execution time: ~42 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-scaffold | 2/2 | ~5 min | ~2.5 min |
| 02-home-page | 2/2 | ~6 min | ~3 min |
| 02.1-building-blocks | 2/2 | ~5 min | ~2.5 min |
| 03-projects | 2/2 | ~4 min | ~2 min |
| 04-contact | 2/2 | ~4 min | ~2 min |
| 05-seo-polish-and-stubs | 2/2 | ~8 min | ~4 min |
| 06-infrastructure-and-deploy | 2/2 | ~10 min | ~5 min |

**Recent Trend:**
- Last 5 plans: 05-01 (~3 min), 05-02 (~5 min), 06-01 (~2 min), 06-02 (~8 min)
- Trend: increasing (deployment complexity)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 6 phases derived from 29 requirements; research recommends Next.js 16 + Tailwind v4 + Biome v2.3 + Motion v12
- [Roadmap]: SSG for most pages, ISR for GitHub data, SSR only for contact API route
- [Roadmap]: Firebase Admin SDK only for v1 (no client SDK needed)
- [01-01]: Next.js 16 removed eslint config option; Biome handles all linting natively
- [01-02]: NavLinks is the only "use client" component; server/client split pattern established
- [01-02]: Active link uses exact match for "/" and startsWith for other routes
- [02-01]: Use preload (not priority) for Next.js 16 Image component
- [02-01]: Icon-only buttons need sr-only spans for Biome's useAnchorContent rule and WCAG compliance
- [02-01]: External links use anchor tags with target="_blank" rel="noopener noreferrer", NOT next/link
- [02-02]: Biome enforces alphabetical import ordering; use biome check --write to auto-fix
- [02.1-01]: Use string plugin names in createMDX for Turbopack serialization compatibility (not imports)
- [02.1-01]: Desktop nav padding reduced from px-3 to px-2 to accommodate 6 links without wrapping
- [02.1-02]: Dynamic MDX import lives in [slug]/page.tsx for Next.js static analysis compatibility
- [02.1-02]: Tutorial metadata uses exported const objects (not YAML frontmatter) for type-safe extraction
- [02.1-02]: Content pattern: MDX files in src/content/{section}/ with exported metadata objects
- [03-01]: ProjectCard restructured from single <a> to <div> with separate GitHub + Live Demo links
- [03-01]: ISR data fetching pattern: { next: { revalidate: 3600 } } on fetch for hourly cache
- [03-01]: External API layer pattern: src/lib/{service}.ts exports typed async functions
- [03-02]: FeaturedProjects converted to async server component; all placeholder data removed
- [04-01]: Firebase Admin gracefully handles missing env vars (warns at import, throws at write)
- [04-01]: In-memory rate limiting (3/15min/IP) sufficient for single-server personal site
- [04-01]: Server Action pattern: useActionState + Zod safeParse + flatten for field-level errors
- [04-01]: Use <output> element for status messages per Biome useSemanticElements rule
- [04-02]: Whitelist .env.local.example in .gitignore (negation rule for .env* pattern)
- [05-01]: Child pages omit openGraph to inherit from root layout (avoids Next.js shallow merge pitfall)
- [05-01]: Biome-ignore inline comment for dangerouslySetInnerHTML on JSON-LD script (standard Next.js pattern)
- [05-01]: Placeholder OG image needs replacement with proper 1200x630 branded image before production
- [05-02]: Added priority prop to headshot Image for LCP optimization (fetchpriority=high)
- [05-02]: Added underline to inline text links for WCAG link-in-text-block compliance
- [06-01]: ADC detection via K_SERVICE env var for Cloud Run; cert() fallback for local dev
- [06-01]: Three-stage Dockerfile (deps, builder, runner) on node:20-alpine with non-root user
- [06-02]: Cloud Build pattern (gcloud builds submit) for serverless Docker builds (no local Docker needed)
- [06-02]: Dedicated service account per Cloud Run service with least-privilege IAM (roles/datastore.user only)
- [06-02]: Custom domain mapping via Cloud Run with auto-provisioned SSL certificates

### Roadmap Evolution

- Phase 2.1 inserted after Phase 2: Building Blocks — tutorials section with concrete, simple guides (URGENT)

### Pending Todos

None.

### Blockers/Concerns

- OG image is a 1x1 placeholder -- replace with branded 1200x630 image for better social media sharing

## Session Continuity

Last session: 2026-02-03
Stopped at: Completed 06-02-PLAN.md. Phase 6 complete - site live at https://dan-weinbeck.com
Resume file: None

## Project Status

**All phases complete!** Personal brand site is built and deployed.

**Live site:** https://dan-weinbeck.com

**What was delivered:**
- Home page with hero, about, skills, and CTA sections
- Projects page with GitHub integration and live project cards
- Tutorials section with MDX content
- Contact page with Firestore-backed form and rate limiting
- Full SEO optimization (metadata, OG tags, sitemap, robots.txt)
- Responsive design with Tailwind v4
- Docker containerization with non-root user
- GCP Cloud Run deployment with custom domain and SSL
- Least-privilege service account with ADC authentication

**Future enhancements (not in scope):**
- Replace placeholder OG image with branded 1200x630 image
- Add CI/CD pipeline for automated deployments
- Add more tutorial content
- Add blog section
