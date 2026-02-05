# dan-weinbeck.com

A personal website for Dan Weinbeck — self-taught AI developer, analytics professional, and data scientist.

## Purpose

Give visitors a fast, clear understanding of who Dan is and what he's built. The site showcases curated project cards with status badges, provides contact options, and serves as the foundation for a future AI assistant. Includes an authenticated admin control center for managing GitHub repos and Todoist tasks. Designed with a refined "Founder" aesthetic — deep navy (#063970) + gold (#C8A55A) palette with Playfair Display, Inter, and JetBrains Mono typography.

## Problem Solved

Replaces the need for a static resume or scattered online presence with a single, polished hub. Project cards display curated descriptions and development status (Live, In Development, Planning).

## Who Uses It

- Recruiters and hiring managers evaluating Dan's skills
- Collaborators and peers exploring his open-source work
- Anyone who wants to get in touch

## How It Works

1. Visitor lands on the home page and sees Dan's headshot, name in Playfair Display serif, tagline pills, and social links
2. Visitor browses 6 curated project cards with status badges and tech tags
3. Visitor reads step-by-step tutorials in the Building Blocks section
4. Visitor reaches out via the contact form (stored in Firestore) or direct social links
5. Visitor browses article cards on the Writing page (placeholder content for now)
6. Stub page for AI Assistant signals future content
7. Admin signs in via Google Auth to access the Control Center (all GitHub repos + Todoist boards)

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
