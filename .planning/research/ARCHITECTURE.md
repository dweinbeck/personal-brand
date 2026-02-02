# Architecture Research: Next.js Portfolio on GCP Cloud Run

## System Overview

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  Next.js App (SSR/SSG hybrid)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ Pages    │ │Components│ │ Client Components ││
│  │ (Server) │ │ (Shared) │ │ (use client)     ││
│  └────┬─────┘ └──────────┘ └────────┬─────────┘│
└───────┼──────────────────────────────┼──────────┘
        │                              │
        ▼                              ▼
┌───────────────┐            ┌─────────────────┐
│ API Routes    │            │ GitHub REST API  │
│ (Cloud Run)   │            │ (External)       │
│               │            └─────────────────┘
│ - Contact form│
│ - (Future AI) │
└───────┬───────┘
        │
        ▼
┌───────────────┐   ┌──────────────────┐
│ Firestore     │   │ Cloud Storage     │
│ - Contact msgs│   │ - Headshot        │
│ - (Future)    │   │ - Assets          │
└───────────────┘   └──────────────────┘
```

## Component Architecture

### Pages (App Router)
```
app/
├── layout.tsx          # Root layout (nav, footer, metadata)
├── page.tsx            # Home (hero, featured projects, blog teaser, contact)
├── projects/
│   └── page.tsx        # All projects grid
├── writing/
│   └── page.tsx        # Blog stub / coming soon
├── assistant/
│   └── page.tsx        # AI assistant placeholder
├── contact/
│   └── page.tsx        # Contact form + info
├── not-found.tsx       # Custom 404
└── error.tsx           # Custom error boundary
```

### Shared Components
```
components/
├── layout/
│   ├── Navbar.tsx      # Navigation (server component)
│   ├── Footer.tsx      # Footer with social links
│   └── MobileNav.tsx   # Mobile menu (client component)
├── home/
│   ├── Hero.tsx        # Headshot, tagline, CTAs
│   ├── FeaturedProjects.tsx  # Top project cards
│   ├── BlogTeaser.tsx  # Writing section teaser
│   └── ContactCTA.tsx  # Contact section on home
├── projects/
│   ├── ProjectCard.tsx # Individual project card
│   └── ProjectGrid.tsx # Grid of project cards
├── contact/
│   └── ContactForm.tsx # Form (client component)
└── ui/
    └── ...             # Shared UI primitives
```

## Data Flow

### GitHub Projects
1. **Build time (SSG):** Fetch repos from GitHub API → generate static project pages
2. **Revalidation (ISR):** Revalidate every ~1 hour via `revalidate` option
3. **No client-side fetching needed** — server components handle it

### Contact Form
1. User submits form → client component POSTs to API route
2. API route validates, stores in Firestore, sends notification
3. Returns success/error to client

### Assets (Headshot, etc.)
- Store in Cloud Storage, serve via CDN URL
- Or: commit to repo and use Next.js Image optimization

## Firebase Two-SDK Pattern

**Server-side (firebase-admin):**
- Used in API routes and server components
- Service account credentials (never exposed to client)
- Direct Firestore reads/writes with admin privileges

**Client-side (firebase):**
- Used in client components with `'use client'`
- Public config via `NEXT_PUBLIC_` env vars
- Needed only if real-time features added later

**For v1:** Primarily server-side via `firebase-admin` for contact form storage. Client SDK not needed until AI assistant phase.

## Deployment Architecture

```
GitHub Repo → Cloud Build → Container Registry → Cloud Run
                                                     │
                                                     ├── Next.js standalone server
                                                     ├── API routes (contact form)
                                                     └── Scales to zero when idle
```

### Dockerfile Strategy
- Use Next.js `output: 'standalone'` for minimal container
- Multi-stage build: install deps → build → copy standalone output
- Results in ~100MB image vs ~1GB with full node_modules

## Suggested Build Order

1. **Project scaffold** — Next.js, Tailwind, Biome, basic layout
2. **Static pages** — Home hero, navigation, footer
3. **GitHub integration** — API fetch, project cards
4. **Contact functionality** — Form, API route, Firestore
5. **Polish** — Animations, SEO, error pages, Lighthouse optimization
6. **Deployment** — Docker, Cloud Run, CI/CD
7. **Stub pages** — Blog coming soon, AI assistant placeholder

## Future Extension Points

- **AI Assistant:** Add API route for chat endpoint, client component for chat UI
- **Blog:** Add MDX processing, content directory, blog listing page
- **Control Center:** Add auth layer, Todoist API integration, dashboard page
