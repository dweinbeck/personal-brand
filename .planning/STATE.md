# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Visitors can understand who Dan is and see proof of his work within 60 seconds
**Current focus:** Phase 3 in progress -- Projects page with live GitHub data

## Current Position

Phase: 3 of 6 (Projects)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-02 -- Completed 03-01-PLAN.md

Progress: [███████░░░] ~54%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: ~2.6 min
- Total execution time: ~18 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-scaffold | 2/2 | ~5 min | ~2.5 min |
| 02-home-page | 2/2 | ~6 min | ~3 min |
| 02.1-building-blocks | 2/2 | ~5 min | ~2.5 min |
| 03-projects | 1/2 | ~2 min | ~2 min |

**Recent Trend:**
- Last 5 plans: 02-02 (~3 min), 02.1-01 (~3 min), 02.1-02 (~2 min), 03-01 (~2 min)
- Trend: consistent

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

### Roadmap Evolution

- Phase 2.1 inserted after Phase 2: Building Blocks — tutorials section with concrete, simple guides (URGENT)

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-02
Stopped at: Completed 03-01-PLAN.md. Next: 03-02 (FeaturedProjects live data)
Resume file: None
