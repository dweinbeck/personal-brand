# Phase 11: GitHub API Integration - Research

**Researched:** 2026-02-06
**Domain:** GitHub REST API, Next.js ISR, Markdown Rendering
**Confidence:** HIGH

## Summary

This phase integrates live GitHub repository data into the projects page and homepage, replacing placeholder data with real API responses. The existing codebase already has a foundation in `src/lib/github.ts` with ISR caching (1-hour revalidation), but needs expansion for additional fields and README fetching.

The standard approach combines:
1. **Curated project configuration** - A JSON file mapping GitHub repos to display metadata (status, featured flag, custom descriptions)
2. **GitHub API enrichment** - Fetching live data (dates, stars, README) to augment curated metadata
3. **ISR caching** - Using Next.js fetch caching with 1-hour revalidation to stay within rate limits
4. **react-markdown** - Safe rendering of README content from the GitHub API

**Primary recommendation:** Use a hybrid approach where curated project metadata in `src/data/projects.json` is enriched with live GitHub API data, enabling manual curation of which repos to show while automatically pulling dates, README content, and stats.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native fetch | Built-in | GitHub API requests | Next.js extends fetch with caching; no HTTP library needed |
| react-markdown | 10.x | README rendering | Safe by default (no XSS), supports GFM via plugins |
| remark-gfm | 4.x | GitHub Flavored Markdown | Tables, task lists, strikethrough - essential for README rendering |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rehype-sanitize | 6.x | Extra security | If accepting untrusted markdown (not needed for own READMEs) |
| rehype-raw | 7.x | Raw HTML in markdown | Only if READMEs contain HTML that must render |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-markdown | next-mdx-remote | next-mdx-remote compiles to JS, security risk for API content; use only for trusted local MDX |
| react-markdown | @mdx-js/mdx | Same as above; overkill for pure markdown rendering |
| Unauthenticated API | GitHub PAT | Increases rate limit from 60 to 5000/hr but adds token management; ISR caching makes this unnecessary for this use case |

**Installation:**
```bash
npm install react-markdown remark-gfm
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── github.ts           # Expanded: fetchProjects(), fetchReadme(), types
├── data/
│   └── projects.json       # Curated: which repos to show, display metadata
├── types/
│   └── project.ts          # Expanded: GitHubProject interface
├── app/
│   └── projects/
│       ├── page.tsx        # Projects list (server component)
│       └── [slug]/
│           └── page.tsx    # Project detail with README (server component)
└── components/
    └── projects/
        ├── ProjectCard.tsx         # Unified card for homepage + projects
        ├── DetailedProjectCard.tsx # Enhanced card for projects page
        └── ReadmeRenderer.tsx      # react-markdown wrapper
```

### Pattern 1: Curated + Live Data Hybrid
**What:** Maintain a curated list of projects with display metadata, enrich with live GitHub data
**When to use:** When you want editorial control over which projects appear and how they're presented
**Example:**
```typescript
// src/data/projects.json - Curated project config
[
  {
    "slug": "personal-brand",           // URL slug
    "repo": "dweinbeck/personal-brand", // GitHub owner/repo
    "featured": true,                   // Show on homepage
    "status": "Live",                   // Manual status override
    "customDescription": null           // Optional override
  }
]

// src/lib/github.ts - Enrichment function
export interface GitHubProject {
  // From curated config
  slug: string;
  featured: boolean;
  status: "Live" | "In Development" | "Planning";

  // From GitHub API
  name: string;
  description: string;
  language: string | null;
  stars: number;
  url: string;
  homepage: string | null;
  topics: string[];
  createdAt: string;      // ISO date
  pushedAt: string;       // ISO date (last commit)
  visibility: "public" | "private";
}

export async function fetchProjectBySlug(slug: string): Promise<GitHubProject | null> {
  // 1. Get curated config
  // 2. Fetch from GitHub API with ISR caching
  // 3. Merge and return
}
```

### Pattern 2: README Fetching with Media Type
**What:** Use GitHub's README endpoint with HTML media type for pre-rendered content, or raw for markdown
**When to use:** Project detail pages
**Example:**
```typescript
// Source: https://docs.github.com/en/rest/repos/contents

// Option A: Raw markdown (use with react-markdown)
export async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    {
      headers: {
        Accept: "application/vnd.github.raw+json",
      },
      next: { revalidate: 3600 }, // 1 hour ISR
    }
  );

  if (!res.ok) return null;
  return res.text();
}

// Option B: Pre-rendered HTML (if not using react-markdown)
// Accept: "application/vnd.github.html+json"
```

### Pattern 3: Dynamic Routes with generateStaticParams
**What:** Pre-render project detail pages at build time, revalidate with ISR
**When to use:** All dynamic route pages fetching from API
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-static-params

// src/app/projects/[slug]/page.tsx
export const revalidate = 3600; // 1 hour ISR

export async function generateStaticParams() {
  const projects = await fetchAllProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = true; // Allow ISR for unlisted projects

export default async function ProjectPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);

  if (!project) notFound();

  const readme = await fetchReadme(project.repo.split("/")[0], project.repo.split("/")[1]);

  return (
    <article>
      <h1>{project.name}</h1>
      {readme && <ReadmeRenderer content={readme} />}
    </article>
  );
}
```

### Anti-Patterns to Avoid
- **Client-side GitHub API calls:** Exposes rate limits to individual users; always fetch server-side with ISR
- **Fetching all repos then filtering:** Wasteful; curate the list and fetch only needed repos
- **Parsing dates client-side:** Server components can parse ISO dates; avoid hydration mismatches
- **Using next-mdx-remote for API markdown:** Security risk; MDX compiles to JS and executes

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering | Custom parser | react-markdown | Edge cases: GFM tables, task lists, code blocks, security |
| GitHub Flavored Markdown | Custom extensions | remark-gfm plugin | Tables, strikethrough, autolinks, footnotes |
| Rate limit handling | Retry logic | Next.js ISR caching | Eliminates redundant requests; cache serves stale while revalidating |
| Slug generation | Custom function | Repo name (lowercase, hyphenated) | GitHub repo names are already URL-safe |
| Date formatting | Manual parsing | Intl.DateTimeFormat or date-fns | i18n, timezone handling |

**Key insight:** GitHub already provides URL-safe repo names. The existing codebase pattern (accomplishments, tutorials) of using pre-defined slugs in JSON can be applied directly with repo names as slugs.

## Common Pitfalls

### Pitfall 1: Rate Limit Exhaustion
**What goes wrong:** 60 requests/hour limit hit during development or high traffic
**Why it happens:** Unauthenticated API calls without caching; multiple fetches per page load
**How to avoid:**
- Use ISR caching (`next: { revalidate: 3600 }`)
- Batch requests where possible (list repos, not individual)
- Consider GitHub PAT only if rate limits still an issue
**Warning signs:** 403/429 responses, empty project lists in production

### Pitfall 2: README Size Limits
**What goes wrong:** Large READMEs (>1MB) fail to fetch or render slowly
**Why it happens:** GitHub API rejects files over 100MB; 1-100MB only supports raw/object types
**How to avoid:**
- Check `size` field before fetching content
- Truncate or show "View on GitHub" for large READMEs
- Most READMEs are <50KB; this is rare but handle gracefully
**Warning signs:** Empty README sections, slow page loads

### Pitfall 3: Stale Data Perception
**What goes wrong:** Users see outdated project info after pushing changes
**Why it happens:** ISR serves cached version for up to revalidate period
**How to avoid:**
- Set reasonable revalidate (1 hour is good balance)
- Show "Last synced" timestamp in UI
- Document that changes reflect within 1 hour
**Warning signs:** User complaints about outdated info

### Pitfall 4: Missing Repos (Private/Deleted)
**What goes wrong:** Curated list references repo that doesn't exist or is private
**Why it happens:** Repo deleted, made private, or typo in config
**How to avoid:**
- Graceful fallback in `fetchProjectBySlug` returning null
- Filter out failed fetches from list
- Log warnings for debugging
**Warning signs:** Empty project cards, broken detail pages

### Pitfall 5: Markdown XSS (Unlikely but Possible)
**What goes wrong:** Malicious content in README executes scripts
**Why it happens:** Only if using raw HTML rendering without sanitization
**How to avoid:**
- Use react-markdown (safe by default)
- Don't use rehype-raw unless needed
- If needed, add rehype-sanitize
**Warning signs:** N/A - prevented by default with react-markdown

## Code Examples

Verified patterns from official sources:

### GitHub API Repository Fetch with ISR
```typescript
// Source: GitHub API docs + Next.js ISR docs

interface GitHubRepoResponse {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  homepage: string | null;
  topics: string[];
  created_at: string;
  pushed_at: string;
  visibility: string;
  private: boolean;
}

export async function fetchGitHubRepo(
  owner: string,
  repo: string
): Promise<GitHubRepoResponse | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    console.error(`GitHub API error for ${owner}/${repo}: ${res.status}`);
    return null;
  }

  return res.json();
}
```

### README Rendering Component
```typescript
// Source: https://github.com/remarkjs/react-markdown

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReadmeRendererProps {
  content: string;
}

export function ReadmeRenderer({ content }: ReadmeRendererProps) {
  return (
    <div className="prose prose-neutral max-w-none">
      <Markdown remarkPlugins={[remarkGfm]}>
        {content}
      </Markdown>
    </div>
  );
}
```

### Unified Project Interface
```typescript
// Combines curated config with live GitHub data

export interface ProjectConfig {
  slug: string;
  repo: string;  // "owner/repo" format
  featured: boolean;
  status: "Live" | "In Development" | "Planning";
  customDescription?: string;
  customTags?: string[];
}

export interface EnrichedProject extends ProjectConfig {
  name: string;
  description: string;
  language: string | null;
  stars: number;
  url: string;
  homepage: string | null;
  topics: string[];
  createdAt: string;
  pushedAt: string;
  visibility: "public" | "private";
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side GitHub fetch | Server Components + ISR | Next.js 13+ (2023) | Better performance, no rate limit exposure |
| getStaticProps/getServerSideProps | Server Components with fetch cache | Next.js 13+ App Router | Simplified data fetching |
| marked/showdown | react-markdown 10.x | 2024 | Better security, React 19 support |
| Manual caching | Next.js fetch `next.revalidate` | Next.js 13+ | Built-in ISR, no cache library needed |

**Deprecated/outdated:**
- `getStaticProps`/`getStaticPaths`: Pages Router pattern; use App Router with `generateStaticParams`
- Octokit SDK: Overkill for simple REST calls; adds bundle size unnecessarily

## Open Questions

Things that couldn't be fully resolved:

1. **Status field source**
   - What we know: Current projects.json has manual `status` field
   - What's unclear: Should status be derived from GitHub (archived = "Complete", recently pushed = "Active")?
   - Recommendation: Keep manual curation for status; automated inference is unreliable

2. **Private repo handling**
   - What we know: Unauthenticated API can't access private repos
   - What's unclear: Should private projects show with curated-only data, or be hidden?
   - Recommendation: Show curated metadata only, mark as "Private", hide GitHub link

3. **Homepage vs Projects page data unification**
   - What we know: Requirement PROJ-04 specifies same data source
   - What's unclear: Should homepage show subset (featured only) or different presentation?
   - Recommendation: Single data source with `featured: true` filter for homepage

## Sources

### Primary (HIGH confidence)
- [GitHub REST API - Repos](https://docs.github.com/en/rest/repos/repos) - Repository fields, timestamps
- [GitHub REST API - Contents](https://docs.github.com/en/rest/repos/contents) - README fetching, media types
- [GitHub REST API - Rate Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) - 60/5000 limits, headers
- [Next.js ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration) - revalidate, fetch caching
- [Next.js generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) - dynamicParams, ISR relationship
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) - Version 10, plugin usage, security

### Secondary (MEDIUM confidence)
- [GitHub API Best Practices](https://docs.github.com/rest/guides/best-practices-for-using-the-rest-api) - Conditional requests, efficiency
- [remark-gfm GitHub](https://github.com/remarkjs/remark-gfm) - GFM support for tables, tasks

### Tertiary (LOW confidence)
- None - all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified with official docs, existing codebase patterns
- Architecture: HIGH - Matches existing codebase patterns (accomplishments, tutorials)
- Pitfalls: HIGH - Documented in GitHub and Next.js official sources
- Markdown rendering: HIGH - react-markdown is well-documented, security claims verified

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (30 days - stable APIs and patterns)
