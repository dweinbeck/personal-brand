# Phase 3: Projects - Research

**Researched:** 2026-02-02
**Domain:** GitHub REST API, Next.js ISR, Server Component Data Fetching
**Confidence:** HIGH

## Summary

Phase 3 replaces the hardcoded placeholder project data in `FeaturedProjects.tsx` with live data from the GitHub REST API, and builds out the `/projects` page with a full project grid. The core challenge is straightforward: fetch public repos from `GET /users/dweinbeck/repos`, map the response to the existing `Project` type, and cache the result with ISR so the page is statically generated and revalidates hourly.

The GitHub REST API returns topics in the standard response (the mercy-preview header is no longer required on GitHub.com). Unauthenticated requests are limited to 60/hour, which is fine for ISR with a 3600-second revalidation window (the page rebuilds at most once per hour). No authentication token is needed.

**Primary recommendation:** Create a `src/lib/github.ts` data access module that fetches repos with `fetch()` using `{ next: { revalidate: 3600 } }`, filters out forks and archived repos, sorts by stars descending, and maps to the existing `Project` type. Both the home page `FeaturedProjects` and the `/projects` page consume this single data source.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native `fetch` | Built-in | GitHub API calls | Next.js extends fetch with caching/revalidation; no library needed |
| Next.js App Router ISR | 16.1.6 | Static generation + hourly revalidation | Built-in, no additional deps |

### Supporting

No additional libraries are needed. The GitHub REST API is consumed with native `fetch`. The existing `Project` type already maps cleanly to the API response.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw fetch | Octokit SDK | Adds ~50KB dependency for a single endpoint; overkill for one GET call |
| ISR (time-based) | On-demand revalidation via webhook | More complex, requires a Route Handler + GitHub webhook setup; unnecessary for a personal site |
| No auth token | Personal Access Token | Would raise rate limit from 60 to 5000/hr; unnecessary with hourly ISR |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── github.ts          # GitHub API fetch + transform (NEW)
│   └── tutorials.ts       # Existing pattern to follow
├── types/
│   └── project.ts         # Existing Project interface (extend with homepage)
├── components/
│   ├── home/
│   │   ├── ProjectCard.tsx      # Keep here (home-specific styling)
│   │   └── FeaturedProjects.tsx  # Convert to async server component
│   └── projects/
│       └── ProjectGrid.tsx       # Full grid for /projects page (NEW)
├── app/
│   ├── page.tsx                 # Home page (already composes FeaturedProjects)
│   └── projects/
│       └── page.tsx             # Projects page (currently stub)
```

### Pattern 1: Data Access Layer in `src/lib/github.ts`

**What:** Centralize all GitHub API logic in a single module that both pages import.
**When to use:** Whenever multiple pages consume the same external data.
**Example:**
```typescript
// src/lib/github.ts
import type { Project } from "@/types/project";

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  homepage: string | null;
  fork: boolean;
  archived: boolean;
  topics: string[];
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch(
    "https://api.github.com/users/dweinbeck/repos?per_page=100&sort=pushed&direction=desc",
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    return [];
  }

  const repos: GitHubRepo[] = await response.json();

  return repos
    .filter((repo) => !repo.fork && !repo.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .map((repo) => ({
      name: repo.name,
      description: repo.description ?? "No description provided",
      language: repo.language,
      stars: repo.stargazers_count,
      url: repo.html_url,
      homepage: repo.homepage || null,
      topics: repo.topics,
    }));
}

export async function getFeaturedProjects(count = 6): Promise<Project[]> {
  const projects = await getProjects();
  return projects.slice(0, count);
}
```

### Pattern 2: Async Server Component for FeaturedProjects

**What:** Convert `FeaturedProjects` from a component with hardcoded data to an async server component that fetches live data.
**When to use:** Server components that need data at render time.
**Example:**
```typescript
// src/components/home/FeaturedProjects.tsx
import Link from "next/link";
import { getFeaturedProjects } from "@/lib/github";
import { ProjectCard } from "./ProjectCard";

export async function FeaturedProjects() {
  const projects = await getFeaturedProjects();

  return (
    <section className="py-16 border-t border-gray-200 motion-safe:animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Featured Projects
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/projects"
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          See all projects →
        </Link>
      </div>
    </section>
  );
}
```

### Pattern 3: ISR via fetch-level revalidate

**What:** Use `{ next: { revalidate: 3600 } }` on the fetch call rather than page-level `export const revalidate`.
**When to use:** When the same fetch is used across multiple pages and you want consistent caching behavior.
**Why:** Fetch-level revalidate is more granular. If the fetch is called from both `/` and `/projects`, both pages share the same cached data. Page-level revalidate would need to be set on each page separately.

### Anti-Patterns to Avoid
- **Fetching in each component independently:** Both FeaturedProjects and the Projects page should call the same `getProjects()` function. Next.js deduplicates identical fetch calls within a single render, but a shared data layer is cleaner.
- **Using `"use client"` for data fetching:** The GitHub data does not require client-side interactivity. Keep everything as server components.
- **Storing API responses in state:** No useState/useEffect pattern. Server components fetch at render time with ISR caching.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API response caching | Custom in-memory cache or Redis | Next.js `fetch` with `next.revalidate` | Built into framework, handles invalidation, works with static generation |
| GitHub API client | Wrapper class with retry logic | Plain `fetch` with graceful fallback | Single endpoint, no auth needed, ISR handles retry naturally |
| Rate limiting protection | Custom rate limiter | ISR revalidation interval (3600s) | At most 1 request/hour per page rebuild; well within 60/hr limit |

**Key insight:** Next.js ISR + native fetch handles the entire caching/revalidation concern. The GitHub API is simple enough that no SDK or wrapper is warranted.

## Common Pitfalls

### Pitfall 1: Next.js 15+ Fetch Caching Default Change
**What goes wrong:** In Next.js 14, `fetch()` was cached by default (`force-cache`). In Next.js 15+, fetch is NOT cached by default (effectively `no-store`). If you just call `fetch(url)` without options, the page becomes fully dynamic and hits GitHub on every request.
**Why it happens:** Breaking change in Next.js 15 that carries through to 16.
**How to avoid:** Always pass `{ next: { revalidate: 3600 } }` on the fetch call. This explicitly opts into ISR caching with a 1-hour window.
**Warning signs:** Build output shows the route as "dynamic" (lambda symbol) instead of "static" (circle symbol).

### Pitfall 2: Empty Repo List
**What goes wrong:** The `dweinbeck` GitHub account currently returns an empty array `[]` from the repos endpoint (no public repos visible, or username may differ).
**Why it happens:** User may not have public repos yet, or repos may be private.
**How to avoid:** Always handle the empty array case gracefully. Show a fallback message like "Projects coming soon" when the array is empty. Consider keeping a small hardcoded fallback for the featured projects section until real repos exist.
**Warning signs:** Blank project grid with no user feedback.

### Pitfall 3: GitHub API Response Shape Mismatch
**What goes wrong:** The API returns `description: null` for repos without descriptions, `language: null` for repos with no detected language, and `homepage: ""` (empty string, not null) for repos without a homepage URL.
**Why it happens:** GitHub API uses null for missing optional fields but empty string for homepage.
**How to avoid:** Use nullish coalescing: `repo.description ?? "No description"`. Check `repo.homepage || null` to normalize empty strings to null.
**Warning signs:** "null" rendered as text on project cards.

### Pitfall 4: Alphabetical Import Ordering (Biome)
**What goes wrong:** Biome v2.2.0 enforces alphabetical import ordering. New imports in modified files must be inserted in the correct position.
**Why it happens:** Existing Biome configuration.
**How to avoid:** Keep imports alphabetically ordered. For the data layer: `import { getFeaturedProjects } from "@/lib/github"` comes before `import { ProjectCard } from "./ProjectCard"` (@ aliases sort before relative paths).
**Warning signs:** Biome check fails on CI or during `npm run lint`.

### Pitfall 5: Project Type Needs `homepage` Field
**What goes wrong:** The existing `Project` interface lacks a `homepage` field. The success criteria require linking to a live demo if a homepage URL is set.
**Why it happens:** The original type was designed for placeholder data.
**How to avoid:** Add `homepage: string | null` to the `Project` interface in `src/types/project.ts`. Update `ProjectCard` to conditionally render a demo link.

## Code Examples

### GitHub API Fetch with ISR Caching
```typescript
// Verified against GitHub REST API docs and Next.js ISR guide
const response = await fetch(
  "https://api.github.com/users/dweinbeck/repos?per_page=100&sort=pushed&direction=desc",
  {
    headers: {
      Accept: "application/vnd.github+json",
    },
    next: { revalidate: 3600 }, // ISR: revalidate every hour
  },
);
```

### Graceful Error Handling for API Failures
```typescript
// Next.js ISR automatically serves last successful build on error,
// but we still need to handle the initial build case
export async function getProjects(): Promise<Project[]> {
  try {
    const response = await fetch(/* ... */);
    if (!response.ok) {
      console.error(`GitHub API error: ${response.status}`);
      return [];
    }
    const repos: GitHubRepo[] = await response.json();
    return repos.filter(/* ... */).map(/* ... */);
  } catch (error) {
    console.error("Failed to fetch GitHub repos:", error);
    return [];
  }
}
```

### ProjectCard with Homepage/Demo Link
```typescript
// Extension of existing ProjectCard to support demo links
{project.homepage && (
  <a
    href={project.homepage}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs text-blue-600 hover:text-blue-800"
  >
    Live Demo
  </a>
)}
```

### Empty State for Projects Page
```typescript
{projects.length === 0 ? (
  <p className="text-gray-500">Projects coming soon.</p>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {projects.map((project) => (
      <ProjectCard key={project.name} project={project} />
    ))}
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fetch()` cached by default | `fetch()` uncached by default | Next.js 15 (Oct 2024) | Must explicitly set `next.revalidate` for ISR |
| GitHub topics require `mercy-preview` header | Topics included in standard response | ~2022 | No special header needed on GitHub.com |
| `getStaticProps` + `revalidate` (Pages Router) | `fetch` with `next.revalidate` or page-level `export const revalidate` (App Router) | Next.js 13+ | Use App Router patterns |

**Deprecated/outdated:**
- `getStaticProps` / `getServerSideProps`: Pages Router only; this project uses App Router
- `application/vnd.github.mercy-preview+json` header: No longer needed for topics on GitHub.com
- `unstable_cache`: Being replaced by `"use cache"` directive (experimental in Next.js 15+)

## Open Questions

1. **GitHub username `dweinbeck` has no visible public repos**
   - What we know: `GET /users/dweinbeck/repos` returns `[]` (empty array)
   - What's unclear: Whether the user has not yet pushed public repos or the username differs
   - Recommendation: Build with graceful empty-state handling. The code will work automatically once public repos exist. Keep hardcoded fallback data available as a commented-out option during development.

2. **ProjectCard reuse vs. dedicated component**
   - What we know: The existing `ProjectCard` in `src/components/home/` works well and matches the `Project` type
   - What's unclear: Whether the `/projects` page needs a different card layout (e.g., more detail, different sizing)
   - Recommendation: Reuse the same `ProjectCard` component from `src/components/home/`. If the projects page later needs a different layout, extract to `src/components/shared/` at that point. Do not prematurely abstract.

## Sources

### Primary (HIGH confidence)
- GitHub REST API docs: https://docs.github.com/en/rest/repos/repos - Endpoint shape, parameters, pagination, topics inclusion
- Live API verification: `GET https://api.github.com/users/dweinbeck/repos` returns `[]`, `GET https://api.github.com/rate_limit` confirms 60 req/hr unauthenticated
- Next.js ISR guide: https://nextjs.org/docs/app/guides/incremental-static-regeneration - Revalidate patterns, error handling

### Secondary (MEDIUM confidence)
- Next.js 15 caching change: https://nextjs.org/docs/app/guides/caching - Fetch default changed from cached to uncached
- Next.js fetch API reference: https://nextjs.org/docs/app/api-reference/functions/fetch - `next.revalidate` option

### Tertiary (LOW confidence)
- None. All findings verified with official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native fetch + ISR, no additional libraries, verified with official docs
- Architecture: HIGH - Follows existing codebase patterns (src/lib/ data layer), verified ISR patterns
- Pitfalls: HIGH - Next.js 15 caching change verified, GitHub API response shape verified, empty repos confirmed
- Code examples: HIGH - Based on official Next.js and GitHub API documentation

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (stable APIs, unlikely to change)
