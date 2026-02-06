# dan-weinbeck.com

> A personal website showcasing Dan Weinbeck's work as a self-taught AI developer, analytics professional, and data scientist.

## Description

This site replaces the need for a static resume or scattered online presence with a single, polished hub. Visitors get a fast, clear understanding of who Dan is through curated project cards, an AI-powered assistant chatbot, and multiple contact options.

The home page features Dan's headshot, tagline pills, and social links alongside 6 curated project cards with status badges (Live, In Development, Planning). The dedicated Projects page offers rich detail with paragraph descriptions, date ranges, visibility badges, and client-side filtering. An AI assistant enables conversational discovery—visitors can ask questions and get instant, contextual answers about Dan's work, projects, and skills.

The site serves recruiters and hiring managers evaluating Dan's skills, collaborators exploring his open-source work, and anyone who prefers conversational discovery over browsing. An authenticated admin control center provides management of GitHub repos, Todoist tasks, and AI assistant analytics/configuration.

## Tech Stack

| Category | Technology |
|----------|------------|
| Cloud | GCP Cloud Run (Docker) |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Motion v12 |
| Backend | Next.js API Routes (App Router, RSC) |
| Database | Firebase Firestore |
| AI/LLM | Gemini 2.0 Flash (Vercel AI SDK) |
| Auth | Firebase Auth (Google Sign-In) |
| Data Sources | GitHub REST API (ISR), Todoist REST API, MDX |
| Linting | Biome v2.3 |

## Documentation

- [Functional Requirements (FRD)](docs/FRD.md) — goals, personas, scenarios, requirement tracking
- [Technical Design](docs/TECHNICAL_DESIGN.md) — architecture, data flows, APIs, ADRs
- [Deployment Guide](docs/DEPLOYMENT.md) — build process, env vars, Cloud Run setup

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Run tests
npm run lint    # Biome linting
npm run build   # Production build
```

## License

MIT
