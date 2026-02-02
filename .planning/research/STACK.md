# Stack Research: Personal Portfolio Site

## Core Framework

**Next.js 16 (TypeScript)** — User's choice, validated
- App Router with React Server Components
- Next.js 16 removed built-in `next lint` — need standalone linting setup
- SSG/SSR hybrid for performance
- Confidence: HIGH

## Styling

**Tailwind CSS v4** — Standard for Next.js projects in 2025/2026
- Utility-first, fast iteration
- Excellent Lighthouse scores with minimal CSS bundle
- Confidence: HIGH

## Linting & Formatting

**Biome v2.3** — Replaces ESLint + Prettier
- 10-25x faster than ESLint + Prettier
- Single config file, single binary
- Built-in Next.js domain rules (`"next": "recommended"`)
- Since Next.js 16 removed `next lint`, Biome is the clean choice
- Confidence: HIGH

## Animation

**Motion (formerly Framer Motion) v12** — For subtle micro-animations
- Rebranded from "Framer Motion" to "Motion"
- Requires `"use client"` directive in Next.js
- Good for page transitions, hover effects on project cards
- Confidence: MEDIUM (optional — site could ship without it)

## Data Layer

**Firebase/Firestore + Cloud Storage** — User's choice
- Two-SDK pattern required for Next.js:
  - `firebase` (client SDK) — for client components with `'use client'`
  - `firebase-admin` (admin SDK) — for server components, API routes
- Cloud Storage for image assets (headshot, etc.)
- Confidence: HIGH

## GitHub Integration

**GitHub REST API** — `https://api.github.com/users/{username}/repos`
- No auth needed for public repos (60 requests/hour unauthenticated)
- Personal access token recommended to avoid rate limits
- Key fields: description, homepage, topics, language, stargazers_count
- Can use ISR (Incremental Static Regeneration) to cache and revalidate
- Confidence: HIGH

## Blog (Future)

**MDX with next-mdx-remote** — When blog goes live
- Contentlayer has compatibility issues with newer Next.js versions
- `next-mdx-remote` is actively maintained, works with App Router
- `@next/mdx` is official but less flexible
- For now: stub page only
- Confidence: HIGH (for when needed)

## Deployment

**GCP Cloud Run** — User's choice
- Docker container deployment
- Scales to zero (cost-effective for personal site)
- Need Dockerfile for Next.js standalone output
- Confidence: HIGH

## What NOT to Use

- **ESLint + Prettier** — Biome is faster, simpler, and Next.js 16 dropped built-in lint
- **Contentlayer** — Compatibility issues with modern Next.js
- **CSS Modules / styled-components** — Tailwind is more productive for this scope
- **Vercel** — User chose GCP Cloud Run
- **GSAP** — Overkill for this project; Motion covers needed animations
