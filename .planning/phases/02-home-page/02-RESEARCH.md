# Phase 2: Home Page - Research

**Researched:** 2026-02-02
**Domain:** Next.js 16 home page with Image component, Tailwind CSS v4 animations, card grid layout
**Confidence:** HIGH

## Summary

This phase builds the home page for dan-weinbeck.com: a hero section with headshot/bio/CTAs, a featured projects card grid (placeholder data until Phase 3), and a blog teaser section. The site already uses Next.js 16.1.6, React 19, Tailwind CSS v4 (CSS-first config), and has an established layout with Navbar, Footer, and a `max-w-5xl` container pattern.

Key findings: Next.js 16 changed the Image component (`preload` replaces deprecated `priority`, `qualities` config is now required in next.config.ts). Tailwind v4 CSS-first mode supports custom animations via `@theme` blocks with `@keyframes` -- no animation library needed for subtle hover/entrance effects. The existing codebase already uses `transition-colors` and `clsx` patterns that should be continued.

**Primary recommendation:** Use pure Tailwind CSS v4 transitions and custom `@theme` animations for all effects. Do not add framer-motion/Motion -- the required effects (card hover scale, fade-in on load) are trivially achievable with Tailwind utilities and CSS keyframes.

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | Framework, Image component, routing | Already in project |
| react | 19.2.3 | UI rendering | Already in project |
| tailwindcss | ^4 | Styling, transitions, animations | Already in project, CSS-first config |
| clsx | ^2.1.1 | Conditional class merging | Already used in NavLinks.tsx |

### Supporting (no new installs needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/image | built-in | Optimized image loading | Headshot in hero section |
| next/link | built-in | Client-side navigation | CTA buttons linking to internal pages |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind CSS animations | framer-motion / Motion | Overkill for subtle hover/fade effects; adds 30KB+ bundle; not needed |
| Inline SVG icons | lucide-react or heroicons | Could add later, but for 4 icons (GitHub, LinkedIn, Email, Arrow) inline SVGs keep bundle small |

**Installation:**
```bash
# No new packages needed. Only next.config.ts needs updating for images.qualities.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── page.tsx              # Home page (compose sections as server components)
├── components/
│   ├── layout/               # Navbar, Footer (already exists)
│   └── home/                 # New: home page section components
│       ├── HeroSection.tsx   # Headshot + bio + CTAs
│       ├── FeaturedProjects.tsx  # Project card grid
│       ├── ProjectCard.tsx   # Individual project card
│       └── BlogTeaser.tsx    # Writing section teaser
├── types/
│   └── project.ts            # Project type definition (placeholder-ready)
```

### Pattern 1: Section Components as Server Components
**What:** Each home page section is a separate server component, composed in page.tsx.
**When to use:** Always for this page -- no interactivity needed in sections themselves.
**Example:**
```typescript
// src/app/page.tsx
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { BlogTeaser } from "@/components/home/BlogTeaser";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <HeroSection />
      <FeaturedProjects />
      <BlogTeaser />
    </div>
  );
}
```

### Pattern 2: Typed Placeholder Data
**What:** Define a Project type and use hardcoded placeholder data that matches the shape GitHub API will return later.
**When to use:** Phase 2 (placeholder) through Phase 3 (API integration).
**Example:**
```typescript
// src/types/project.ts
export interface Project {
  name: string;
  description: string;
  language: string | null;
  stars: number;
  url: string;
  topics: string[];
}

// In FeaturedProjects.tsx - placeholder data
const FEATURED_PROJECTS: Project[] = [
  {
    name: "personal-brand",
    description: "My personal website built with Next.js and AI",
    language: "TypeScript",
    stars: 0,
    url: "https://github.com/dweinbeck/personal-brand",
    topics: ["nextjs", "typescript", "ai"],
  },
  // ... more placeholders
];
```

### Pattern 3: Container Consistency
**What:** Match the existing `max-w-5xl px-4 sm:px-6 lg:px-8` container pattern used in Navbar, Footer, and current page.tsx.
**When to use:** Always -- every section wrapper.

### Anti-Patterns to Avoid
- **"use client" on section components:** These sections have no interactivity (no useState, no event handlers beyond links). Keep them as server components. Only add "use client" if actual client-side state is needed.
- **Importing headshot as static import from src/:** The headshot is in `public/headshot.jpeg`. Use the string path `/headshot.jpeg` with next/image, not a static import.
- **Using deprecated `priority` prop:** Next.js 16 deprecated `priority` in favor of `preload`. Use `preload` for the hero headshot.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Manual srcset, lazy loading, format conversion | `next/image` component | Handles WebP/AVIF, responsive srcset, lazy loading, blur placeholder automatically |
| Responsive grid | Custom media query CSS | Tailwind `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` | Battle-tested responsive grid in one line |
| Hover animations | JavaScript-based animation | Tailwind `transition-transform duration-200 hover:scale-[1.02]` | CSS transitions are more performant than JS |
| Entrance animations | JS intersection observer + manual animation | CSS `@keyframes` via Tailwind `@theme` + `animate-*` | Simpler, no JS overhead, respects `prefers-reduced-motion` |
| External link security | Manual rel attributes | Always use `target="_blank" rel="noopener noreferrer"` pattern | Prevents tabnapping; Next.js Link does NOT add these automatically for external URLs |
| Conditional classes | String concatenation | `clsx()` (already installed) | Cleaner, handles falsy values |

**Key insight:** Every visual effect needed for this phase (card hover lift, fade-in on load, button hover color changes) is achievable with Tailwind CSS utilities and custom `@theme` animations. Adding a JS animation library would be premature optimization of DX at the cost of bundle size.

## Common Pitfalls

### Pitfall 1: Missing `qualities` in next.config.ts (Next.js 16 breaking change)
**What goes wrong:** Next.js 16 requires `images.qualities` in config. Without it, the default is `[75]` only. If you pass a `quality` prop value not in the array, you get a 400 error in production.
**Why it happens:** This is new in Next.js 16 (was unrestricted before).
**How to avoid:** Add `images: { qualities: [25, 50, 75, 100] }` to next.config.ts before using the Image component.
**Warning signs:** Image loads fail with 400 status, or images look worse than expected at default quality.

### Pitfall 2: Using deprecated `priority` prop on next/image
**What goes wrong:** `priority` still works but triggers deprecation warnings. Will be removed in future versions.
**Why it happens:** Muscle memory from Next.js 13-15 docs.
**How to avoid:** Use `preload` instead of `priority` for above-the-fold images.
**Warning signs:** Console deprecation warnings during development.

### Pitfall 3: Headshot not optimized for circular crop
**What goes wrong:** The headshot.jpeg may be rectangular. Applying `rounded-full` with `overflow-hidden` clips it, but if the image is not square the crop looks wrong.
**Why it happens:** Original photo aspect ratio doesn't match the circular display.
**How to avoid:** Use `next/image` with explicit square `width` and `height` (e.g., 160x160) plus `className="rounded-full object-cover"`. The `object-cover` ensures the image fills the circle and crops from center.
**Warning signs:** Headshot appears stretched or shows unexpected parts of the photo.

### Pitfall 4: External links missing security attributes
**What goes wrong:** GitHub and LinkedIn links open in new tabs without `rel="noopener noreferrer"`, enabling tabnapping attacks.
**Why it happens:** Developers use `<a target="_blank">` without the security attributes. Note: `next/link` is for internal navigation -- use `<a>` tags for external URLs.
**How to avoid:** Always pair `target="_blank"` with `rel="noopener noreferrer"` on external links. Use plain `<a>` elements, not `next/link`, for external URLs.
**Warning signs:** Lighthouse accessibility/best-practices audit flags.

### Pitfall 5: Animation without reduced-motion support
**What goes wrong:** Users with vestibular disorders or motion sensitivity experience discomfort.
**Why it happens:** Developer forgets `motion-reduce:` variant.
**How to avoid:** Use `motion-safe:animate-*` or `motion-reduce:animate-none` on all animated elements.
**Warning signs:** Lighthouse accessibility audit, user complaints.

### Pitfall 6: Dark mode CSS variables exist but page uses hardcoded colors
**What goes wrong:** The globals.css has `prefers-color-scheme: dark` variables, but components use hardcoded `text-gray-600`, `bg-white`, etc. This creates inconsistency in dark mode.
**Why it happens:** The existing Navbar and Footer already use hardcoded light-mode colors. This is a known issue.
**How to avoid:** For now, continue the existing pattern (light-mode only with hardcoded colors). Dark mode is not a Phase 2 requirement. Do NOT try to fix this -- it would require refactoring Navbar and Footer too.
**Warning signs:** Components look broken in dark mode on macOS/mobile.

## Code Examples

### Hero Section with next/image (Next.js 16)
```typescript
// Source: Next.js 16 Image docs (nextjs.org/docs/app/api-reference/components/image)
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <Image
          src="/headshot.jpeg"
          alt="Dan Weinbeck"
          width={160}
          height={160}
          preload
          className="rounded-full object-cover"
        />
        <div className="text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Dan Weinbeck
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Self-taught AI developer, analytics professional, and data scientist
          </p>
          <p className="mt-4 max-w-lg text-gray-600">
            I build practical AI agents and data products that ship. Interests
            in experimentation, UX, automation, and side projects.
          </p>
          <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
            {/* Primary CTA */}
            <a href="/projects"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
              View Projects
            </a>
            {/* Secondary CTA */}
            <a href="/contact"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
              Contact
            </a>
            {/* Icon links */}
            <a href="https://github.com/dweinbeck"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
              aria-label="GitHub">
              {/* SVG icon */}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### Project Card with Hover Animation
```typescript
// Source: Tailwind CSS v4 transition utilities
import Link from "next/link";
import type { Project } from "@/types/project";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300 motion-safe:hover:-translate-y-0.5"
    >
      <h3 className="font-semibold text-gray-900">{project.name}</h3>
      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
        {project.description}
      </p>
      <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
        {project.language && (
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            {project.language}
          </span>
        )}
      </div>
    </a>
  );
}
```

### Responsive Card Grid
```typescript
// Source: Tailwind CSS grid utilities
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {projects.map((project) => (
    <ProjectCard key={project.name} project={project} />
  ))}
</div>
```

### Custom Entrance Animation (Tailwind v4 CSS-first)
```css
/* Add to globals.css -- Source: Tailwind CSS v4 animation docs */
@theme {
  --animate-fade-in-up: fade-in-up 0.5s ease-out both;

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```
Usage: `<section className="motion-safe:animate-fade-in-up">`

### next.config.ts with Image Qualities (Next.js 16 requirement)
```typescript
// Source: Next.js 16 upgrade guide
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 50, 75, 100],
  },
};

export default nextConfig;
```

### Button Patterns (Primary + Secondary + Icon)
```typescript
// Primary button (filled)
<Link href="/projects"
  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
  View Projects
</Link>

// Secondary button (outlined)
<Link href="/contact"
  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
  Contact
</Link>

// Icon button (external link)
<a href="https://github.com/dweinbeck"
  target="_blank" rel="noopener noreferrer"
  aria-label="GitHub"
  className="inline-flex items-center justify-center h-10 w-10 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors">
  <svg className="h-5 w-5" /* ... */ />
</a>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `priority` prop on next/image | `preload` prop | Next.js 16 | Must use `preload` for above-the-fold images |
| Unrestricted image qualities | `images.qualities` allowlist required | Next.js 16 | Must configure in next.config.ts |
| tailwind.config.js animations | `@theme` + `@keyframes` in CSS | Tailwind v4 | Define custom animations in globals.css, not config file |
| framer-motion for page transitions | CSS animations + Tailwind utilities | 2024+ trend | Lighter bundle, sufficient for subtle effects |

**Deprecated/outdated:**
- `priority` prop on `next/image`: Use `preload` instead (Next.js 16)
- `tailwind.config.js` for custom animations: Use `@theme` in CSS (Tailwind v4)

## Open Questions

1. **Headshot aspect ratio**
   - What we know: `headshot.jpeg` exists in `public/`. It will be displayed as a circle.
   - What's unclear: The original image dimensions and whether center-crop looks good.
   - Recommendation: Use `object-cover` with fixed square dimensions. Verify visually during implementation.

2. **Blog teaser content**
   - What we know: Writing section is a stub ("Coming soon"). Site brief shows "Coming soon... (Ask Dan what I'm working on)" with an Ask Dan button.
   - What's unclear: Whether the blog teaser should link to the Assistant page or Writing page.
   - Recommendation: Link to `/writing` page (keep it simple), with secondary "Ask Dan" link to `/assistant`.

3. **Number of featured project cards**
   - What we know: Site brief wireframe shows 6 cards (2 rows of 3). Phase says placeholder data is acceptable.
   - What's unclear: Whether 6 is the right number or if 3 (one row) is better for MVP.
   - Recommendation: Use 6 placeholder cards to match the wireframe. They can be trimmed later.

## Sources

### Primary (HIGH confidence)
- [Next.js Image Component docs](https://nextjs.org/docs/app/api-reference/components/image) - preload prop, qualities config, width/height, placeholder blur
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) - breaking changes for images
- [Tailwind CSS animation docs](https://tailwindcss.com/docs/animation) - @theme keyframes, built-in utilities
- [Tailwind CSS transition-property docs](https://tailwindcss.com/docs/transition-property) - transition utilities
- [Tailwind CSS hover states docs](https://tailwindcss.com/docs/hover-focus-and-other-states) - variant stacking

### Secondary (MEDIUM confidence)
- [Next.js image unconfigured qualities error](https://nextjs.org/docs/messages/next-image-unconfigured-qualities) - qualities requirement confirmation

### Tertiary (LOW confidence)
- connorbutch.com design reference - could not fully fetch page content, relied on site brief wireframe instead

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and verified in package.json
- Architecture: HIGH - follows established patterns in existing codebase (server components, container widths, clsx usage)
- Image component (Next.js 16): HIGH - verified via official docs; `preload` replaces `priority`, `qualities` required
- Animations: HIGH - verified via official Tailwind CSS v4 docs; `@theme` syntax confirmed
- Pitfalls: HIGH - all sourced from official documentation or verified behavior

**Research date:** 2026-02-02
**Valid until:** 2026-03-04 (stable stack, no fast-moving dependencies)
