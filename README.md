# dan-weinbeck.com

A personal website for Dan Weinbeck — self-taught AI developer, analytics professional, and data scientist.

## Purpose

Give visitors a fast, clear understanding of who Dan is and what he's built. The site showcases curated project cards with status badges, provides contact options, and features an AI-powered assistant chatbot for exploring Dan's work and expertise. Includes an authenticated admin control center for managing GitHub repos, Todoist tasks, and AI assistant analytics/configuration. Designed with a refined "Founder" aesthetic — deep navy (#063970) + gold (#C8A55A) palette with Playfair Display, Inter, and JetBrains Mono typography.

## Problem Solved

Replaces the need for a static resume or scattered online presence with a single, polished hub. Project cards display curated descriptions and development status (Live, In Development, Planning). The dedicated Projects page offers rich detail with paragraph descriptions, date ranges, public/private visibility, and client-side filtering by tag or date. The AI assistant enables visitors to ask questions and get instant, contextual answers about Dan's work, projects, and skills.

## Who Uses It

- Recruiters and hiring managers evaluating Dan's skills
- Collaborators and peers exploring his open-source work
- Anyone who wants to get in touch
- Visitors who prefer conversational discovery over browsing

## How It Works

1. Visitor lands on the home page and sees Dan's headshot, name in Playfair Display serif, tagline pills, and social links
2. Visitor browses 6 curated project cards with status badges and tech tags on the home page
3. Visitor navigates to the Projects page for detailed cards with descriptions, date ranges, visibility badges, and filtering/sorting by tag or date
4. Visitor reads step-by-step tutorials in the Building Blocks section
5. Visitor reaches out via hero CTAs (mailto, copy email, LinkedIn) or the enhanced contact form (stored in Firestore)
6. Visitor browses article cards on the Writing page (placeholder content for now)
7. Visitor opens the AI Assistant and asks questions about Dan's work, projects, skills, and availability
8. AI streams contextual, markdown-formatted responses with citations to site pages
9. Visitor uses suggested prompts, provides feedback on answers, and can hand off to Dan directly via email
10. Admin signs in via Google Auth to access the Control Center (GitHub repos, Todoist boards, AI assistant analytics/facts)

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
- **AI:** Gemini 2.0 Flash via Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/react`)
- **Data:** GitHub REST API (ISR), Firebase Admin SDK (Firestore), Todoist REST API
- **Content:** MDX for tutorials, curated JSON/MD knowledge base for AI assistant
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
