# dan-weinbeck.com

A personal website for Dan Weinbeck — self-taught AI developer, analytics professional, and data scientist.

## Purpose

Give visitors a fast, clear understanding of who Dan is and what he's built. The site showcases real projects pulled from GitHub, provides contact options, and serves as the foundation for a future AI assistant. Includes an authenticated admin control center for managing GitHub repos and Todoist tasks.

## Problem Solved

Replaces the need for a static resume or scattered online presence with a single, always-current hub. Project data updates automatically via the GitHub API, so the portfolio never goes stale.

## Who Uses It

- Recruiters and hiring managers evaluating Dan's skills
- Collaborators and peers exploring his open-source work
- Anyone who wants to get in touch

## How It Works

1. Visitor lands on the home page and sees Dan's headshot, tagline, and featured projects
2. Visitor browses the full project listing (live data from GitHub, cached via ISR)
3. Visitor reads step-by-step tutorials in the Building Blocks section
4. Visitor reaches out via the contact form (stored in Firestore) or direct social links
5. Stub pages for Writing and AI Assistant signal future content
6. Admin signs in via Google Auth to access the Control Center (all GitHub repos + Todoist boards)

## Success Metrics

- Visitor understands who Dan is within 60 seconds of landing
- Lighthouse scores >= 90 across Performance, Accessibility, Best Practices, and SEO
- Contact form submissions stored reliably in Firestore
- Project data stays current without manual updates

## Tech Stack

- **Framework:** Next.js 16 (TypeScript, App Router, React Server Components)
- **Styling:** Tailwind CSS v4
- **Linting:** Biome v2.3
- **Animation:** Motion v12
- **Auth:** Firebase Client SDK (Google Sign-In)
- **Data:** GitHub REST API (ISR), Firebase Admin SDK (Firestore), Todoist REST API
- **Content:** MDX for tutorials
- **Hosting:** GCP Cloud Run (Docker standalone build)

## Documentation

- [Functional Requirements](docs/FRD.md) — goals, personas, scenarios, and requirement tracking
- [Technical Design](docs/TECHNICAL_DESIGN.md) — architecture, data flows, APIs, and ADRs

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
