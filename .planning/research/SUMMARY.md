# Research Summary: dan-weinbeck.com

## Stack Recommendations

**Validated choices:** Next.js 16 (TypeScript), GCP Cloud Run, Firestore, Cloud Storage
**Recommended additions:**
- Tailwind CSS v4 for styling
- Biome v2.3 for linting/formatting (Next.js 16 dropped built-in lint)
- Motion (formerly Framer Motion) v12 for subtle animations
- Firebase Admin SDK only for v1 (client SDK not needed until AI phase)
- ISR for GitHub API data (revalidate hourly)

## Table Stakes Features

- Clear navigation, mobile responsive, fast load
- Hero with headshot, tagline, CTAs
- Project cards with GitHub API integration
- Contact form with spam protection
- SEO fundamentals (meta tags, Open Graph, sitemap)
- Accessibility (WCAG 2.1 AA)

## Key Differentiators

- Auto-updating project cards from GitHub (vs. static portfolios)
- AI Assistant (later phase) — conversational portfolio exploration
- Clean, minimal design inspired by connorbutch.com

## Architecture Highlights

- SSG for most pages, ISR for GitHub data, SSR only for contact API
- Firebase two-SDK pattern (admin only for v1)
- Next.js standalone output for minimal Docker image (~100MB)
- Cloud Run with min-instances=1 to avoid cold starts

## Critical Pitfalls to Avoid

1. **Cold starts** — Set Cloud Run min-instances=1 or rely heavily on SSG
2. **GitHub API rate limits** — Use ISR caching, not per-request fetching
3. **Firebase credential exposure** — Never prefix admin creds with NEXT_PUBLIC_
4. **Contact form spam** — Honeypot + rate limiting + server-side validation
5. **Over-engineering** — Start with pages, not abstractions
6. **Docker image bloat** — Use standalone output + multi-stage build

## Build Order Recommendation

1. Scaffold (Next.js + Tailwind + Biome + layout)
2. Static pages (Home hero, nav, footer)
3. GitHub integration (API + project cards)
4. Contact functionality (form + API route + Firestore)
5. Polish (animations, SEO, error pages, Lighthouse)
6. Deployment (Docker + Cloud Run + CI/CD)
7. Stub pages (blog, AI assistant placeholders)
