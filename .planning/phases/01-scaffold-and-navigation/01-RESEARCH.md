# Phase 1: Scaffold and Navigation - Research

**Researched:** 2026-02-01
**Domain:** Next.js 16 project scaffold, Tailwind CSS v4, Biome v2, responsive navigation
**Confidence:** HIGH

## Summary

Phase 1 creates the foundational Next.js 16 project with Tailwind CSS v4 styling, Biome v2 linting/formatting, and a responsive navigation shell with five sections (Home, Projects, Writing, Assistant, Contact). The good news: `create-next-app@16` has a built-in Biome option and ships with Tailwind v4 by default, so scaffolding is straightforward.

The responsive navbar requires a client component for the hamburger menu toggle and the `usePathname` hook for active link highlighting. The layout shell uses the App Router's `layout.tsx` pattern to wrap all pages with persistent navigation. Pages should be minimal stubs at this point -- just enough to verify routing and navigation work.

**Primary recommendation:** Use `npx create-next-app@16 --typescript --tailwind --biome --app --src-dir --turbopack` to scaffold, then build a single `NavLinks` client component for both desktop nav and mobile menu, with `usePathname` for active indicators.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16 (latest) | Framework, App Router, SSG/SSR | User's choice; stable with Turbopack default |
| React | 19.2 | UI library | Ships with Next.js 16 |
| TypeScript | 5.1+ | Type safety | Next.js 16 minimum requirement |
| Tailwind CSS | v4 | Utility-first styling | CSS-first config, 5x faster builds, zero-config scanning |
| @tailwindcss/postcss | v4 | PostCSS plugin for Tailwind v4 | Required for Next.js integration |
| Biome | v2.3 | Linting + formatting | Built into create-next-app, replaces ESLint + Prettier |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.x | Conditional className joining | Active link styling, conditional classes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| clsx | tailwind-merge or cn() | clsx is simpler, no merge conflicts needed at this stage |
| Custom hamburger | Headless UI / Radix | Adds dependencies for something achievable with useState + Tailwind |
| CSS Modules | Tailwind utilities | Tailwind is faster for iteration and produces smaller bundles |

**Installation:**

Scaffolding handles most dependencies. After scaffold:
```bash
npm install clsx
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx           # Root layout: imports globals.css, wraps children with <Navbar> + <Footer>
│   ├── page.tsx             # Home page (stub for now)
│   ├── projects/
│   │   └── page.tsx         # Projects page (stub)
│   ├── writing/
│   │   └── page.tsx         # Writing page (stub)
│   ├── assistant/
│   │   └── page.tsx         # Assistant page (stub)
│   └── contact/
│       └── page.tsx         # Contact page (stub)
├── components/
│   └── layout/
│       ├── Navbar.tsx        # Desktop navbar (server component wrapper)
│       ├── NavLinks.tsx      # Client component: links + active indicator + mobile toggle
│       └── Footer.tsx        # Footer (server component, minimal for now)
└── globals.css              # Tailwind import + theme customization
```

### Pattern 1: Root Layout with Persistent Navigation
**What:** Place `<Navbar>` in `app/layout.tsx` so it persists across all route navigations without re-rendering.
**When to use:** Always -- this is the App Router standard pattern.
**Example:**
```typescript
// src/app/layout.tsx
// Source: https://nextjs.org/docs/app/getting-started/installation
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dan Weinbeck",
  description: "AI developer, analytics professional, and data scientist",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

### Pattern 2: Client Component for Interactive Navigation
**What:** Use `"use client"` only on the component that needs `useState` and `usePathname`, not on the entire layout.
**When to use:** For hamburger menu toggle and active link detection.
**Example:**
```typescript
// src/components/layout/NavLinks.tsx
// Source: https://nextjs.org/learn/dashboard-app/navigating-between-pages
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";

const links = [
  { name: "Home", href: "/" },
  { name: "Projects", href: "/projects" },
  { name: "Writing", href: "/writing" },
  { name: "Assistant", href: "/assistant" },
  { name: "Contact", href: "/contact" },
];

export function NavLinks() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "text-sm font-medium transition-colors",
              isActive(link.href)
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        {/* hamburger/close icon */}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "block px-4 py-3 text-sm font-medium",
                isActive(link.href)
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
```

### Pattern 3: Active Link Helper for Nested Routes
**What:** Special handling for the "/" (home) route vs. nested routes with `startsWith`.
**When to use:** Always. Without this, "/" matches every route.
**Example:**
```typescript
// Source: https://dev.to/nikolasbarwicki/highlight-currently-active-link-in-nextjs-13-with-app-router-1eng
const isActive = (href: string) => {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
};
```

### Anti-Patterns to Avoid
- **Making the entire layout a client component:** Only the NavLinks component needs `"use client"`. The layout, Navbar wrapper, and Footer should remain server components.
- **Using `router.pathname` from `next/router`:** That is the Pages Router API. App Router uses `usePathname()` from `next/navigation`.
- **Creating a complex component library before any pages exist:** Build pages first, extract components when duplication appears.
- **Using `<a>` tags instead of `<Link>`:** Next.js `<Link>` enables client-side navigation, prefetching, and avoids full page reloads.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional CSS classes | String concatenation | `clsx` library | Handles falsy values, arrays, objects cleanly |
| Mobile breakpoint detection | JS resize listeners | Tailwind `md:` / `lg:` prefixes | CSS-only, no JS bundle cost, no hydration mismatch |
| Page routing | Custom route handling | Next.js App Router file conventions | `app/projects/page.tsx` = `/projects` route automatically |
| Active link detection | Manual URL parsing | `usePathname()` from `next/navigation` | Always in sync, handles edge cases |
| Code formatting + linting | ESLint + Prettier setup | Biome (single tool) | 10-25x faster, single config, built into create-next-app |

**Key insight:** Phase 1 is a scaffold. Every piece of infrastructure (routing, styling, linting) is handled by the framework or tooling choices. The custom code is minimal -- just the NavLinks component and page stubs.

## Common Pitfalls

### Pitfall 1: Over-Engineering the Scaffold
**What goes wrong:** Spending time on design systems, abstract component wrappers, or utility libraries before any page content exists.
**Why it happens:** Desire to "do it right" from the start.
**How to avoid:** Page stubs should be 5-10 lines each. The only real component is NavLinks. Everything else can be refined in later phases.
**Warning signs:** More than 2 components in `components/ui/`, any "design system" folder, more than 30 minutes on folder structure.

### Pitfall 2: Forgetting Tailwind v4's CSS-First Config
**What goes wrong:** Creating a `tailwind.config.js` file (v3 pattern) instead of configuring in CSS with `@theme` directive.
**Why it happens:** Most tutorials and training data reference Tailwind v3.
**How to avoid:** Use only `globals.css` with `@import "tailwindcss"` and `@theme` for customization. No `tailwind.config.js` needed.
**Warning signs:** A `tailwind.config.js` file in the project root.

### Pitfall 3: Making the Whole Layout a Client Component
**What goes wrong:** Adding `"use client"` to `layout.tsx` to use `usePathname`, which forces the entire component tree to be client-rendered.
**Why it happens:** `usePathname` is a client-only hook, and developers put it in the layout instead of extracting a child component.
**How to avoid:** Extract `NavLinks` as a separate `"use client"` component. The layout, Navbar wrapper, and page components remain server components.
**Warning signs:** `"use client"` at the top of `layout.tsx`.

### Pitfall 4: Not Closing Mobile Menu on Navigation
**What goes wrong:** User taps a link in the mobile menu, navigates to the new page, but the menu stays open.
**Why it happens:** State persists across client-side navigations because the layout doesn't re-mount.
**How to avoid:** Call `setMobileOpen(false)` in the `onClick` handler of each mobile nav link.
**Warning signs:** Menu stays open after clicking a link on mobile.

### Pitfall 5: Missing Accessibility on Hamburger Button
**What goes wrong:** Hamburger button has no `aria-label`, `aria-expanded`, or keyboard support. Lighthouse accessibility score drops.
**Why it happens:** Visual-first development without considering screen readers.
**How to avoid:** Add `aria-label="Open menu"` / `"Close menu"`, `aria-expanded={mobileOpen}`, and ensure the button is focusable (native `<button>` element).
**Warning signs:** Lighthouse accessibility audit flags "Buttons do not have an accessible name."

### Pitfall 6: Next.js 16 Breaking Changes
**What goes wrong:** Using patterns from Next.js 14/15 that are removed or changed in 16.
**Why it happens:** Most tutorials target older versions.
**How to avoid:** Key changes to watch:
  - `params` and `searchParams` are now async (must `await` them)
  - `next lint` is removed -- use Biome directly
  - `middleware.ts` is deprecated in favor of `proxy.ts` (not needed for Phase 1)
  - Turbopack is the default bundler
  - Node.js 20.9+ required
**Warning signs:** Build errors about sync access to params, or trying to run `next lint`.

## Code Examples

Verified patterns from official sources:

### Scaffold Command
```bash
# Source: https://nextjs.org/docs/app/api-reference/cli/create-next-app
npx create-next-app@16 . --typescript --tailwind --biome --app --src-dir --turbopack --import-alias "@/*"
```

Note: Running with `.` scaffolds into the current directory. The `--biome` flag installs `@biomejs/biome` and creates `biome.json` with Next.js + React domain rules auto-detected from `package.json`.

### Tailwind v4 CSS Setup
```css
/* src/app/globals.css */
/* Source: https://tailwindcss.com/docs/guides/nextjs */
@import "tailwindcss";

/* Custom theme overrides (optional, add as needed in later phases) */
@theme {
  --color-primary: #2563eb;
  --font-sans: "Inter", sans-serif;
}
```

### PostCSS Config (generated by create-next-app)
```javascript
// postcss.config.mjs
// Source: https://tailwindcss.com/docs/guides/nextjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### Biome Configuration
```json
// biome.json (generated by create-next-app, may need minor tweaks)
// Source: https://biomejs.dev/guides/configure-biome/
{
  "$schema": "https://biomejs.dev/schemas/2.3.11/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  },
  "files": {
    "includes": ["src/**"]
  }
}
```

Biome v2 auto-detects `next` and `react` domains from `package.json` dependencies, so explicit domain configuration is typically unnecessary. If needed:

```json
{
  "linter": {
    "domains": {
      "next": "recommended",
      "react": "recommended"
    }
  }
}
```

### next.config.ts (for Biome projects)
```typescript
// Source: https://nextjs.org/docs/app/guides/upgrading/version-16
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Biome handles linting -- disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
```

### Stub Page Template
```typescript
// src/app/projects/page.tsx
export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold">Projects</h1>
      <p className="mt-4 text-gray-600">Coming soon.</p>
    </div>
  );
}
```

### Package.json Scripts (expected from scaffold)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check",
    "format": "biome format --write"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` | CSS-first `@import "tailwindcss"` + `@theme` | Tailwind v4 (Jan 2025) | No JS config file needed; faster builds |
| ESLint + Prettier | Biome v2 | Biome 2.0 (2025), Next.js 16 built-in | Single tool, 10-25x faster |
| `next lint` | `biome check` / `eslint` directly | Next.js 16 (removed `next lint`) | Must run linter via npm scripts |
| `middleware.ts` | `proxy.ts` | Next.js 16 | Renamed; runs on Node.js, not Edge |
| Sync `params`/`searchParams` | `await params` / `await searchParams` | Next.js 16 | Breaking -- must use async access |
| Webpack | Turbopack (default) | Next.js 16 | 2-5x faster builds, opt-out with `--webpack` |
| `@tailwind base/components/utilities` directives | `@import "tailwindcss"` | Tailwind v4 | Single import replaces three directives |
| PostCSS `tailwindcss` plugin | `@tailwindcss/postcss` plugin | Tailwind v4 | New package name |

**Deprecated/outdated:**
- `next lint` command: Removed in Next.js 16
- `tailwind.config.js`: Not needed in Tailwind v4 (CSS-first config)
- `middleware.ts`: Deprecated in favor of `proxy.ts` (still works but will be removed)
- Sync `params` access: Will error in Next.js 16

## Open Questions

1. **Exact `biome.json` generated by `create-next-app@16 --biome`**
   - What we know: It generates a `biome.json` with recommended rules and auto-detects Next.js + React domains
   - What's unclear: The exact default formatter settings (tabs vs spaces, line width)
   - Recommendation: Accept the generated config and adjust after scaffold if needed. The planner should include a verification step to review the generated `biome.json`.

2. **`output: 'standalone'` in Phase 1?**
   - What we know: Needed for Docker/Cloud Run deployment in Phase 6
   - What's unclear: Whether to add it now or defer
   - Recommendation: Defer to Phase 6. Adding it in `next.config.ts` later is a one-line change and avoids premature optimization.

3. **React Compiler flag**
   - What we know: Next.js 16 supports it via `--react-compiler` flag or `reactCompiler: true` in config
   - What's unclear: Whether it provides meaningful benefit for this project's scope
   - Recommendation: Skip for now. It auto-memoizes components, but the site is small enough that manual optimization is unnecessary. Can enable later if performance warrants it.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) - Breaking changes, new features, removal of `next lint`
- [Next.js Installation Docs](https://nextjs.org/docs/app/getting-started/installation) - `create-next-app` prompts and defaults
- [Next.js create-next-app CLI Reference](https://nextjs.org/docs/app/api-reference/cli/create-next-app) - All CLI flags including `--biome`
- [Tailwind CSS v4 Next.js Guide](https://tailwindcss.com/docs/guides/nextjs) - Official setup steps
- [Biome Getting Started](https://biomejs.dev/guides/getting-started/) - Installation and init commands
- [Biome Configure Guide](https://biomejs.dev/guides/configure-biome/) - Configuration file structure
- [Biome Domains](https://biomejs.dev/linter/domains/) - Next.js and React domain configuration
- [Next.js usePathname](https://nextjs.org/docs/app/api-reference/functions/use-pathname) - Active link hook
- [Next.js Active Links Tutorial](https://nextjs.org/learn/dashboard-app/navigating-between-pages) - Official active link pattern

### Secondary (MEDIUM confidence)
- [DEV Community: Husky + Biome in Next.js 2026](https://dev.to/imkarmakar/how-to-set-up-husky-biome-in-a-nextjs-project-2026-guide-9jh) - Biome setup patterns verified against official docs
- [DEV Community: Active Links in Next.js 13+ App Router](https://dev.to/nikolasbarwicki/highlight-currently-active-link-in-nextjs-13-with-app-router-1eng) - usePathname patterns verified against official tutorial

### Tertiary (LOW confidence)
- None. All findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools verified via official docs; `create-next-app` handles most setup
- Architecture: HIGH - App Router layout pattern is well-documented; active link pattern from official tutorial
- Pitfalls: HIGH - Based on documented breaking changes (Next.js 16 blog) and established community patterns

**Research date:** 2026-02-01
**Valid until:** 2026-03-03 (stable stack, low churn expected)
