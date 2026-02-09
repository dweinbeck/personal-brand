# Technology Stack: Control Center Content Editor + Brand Scraper UI

**Project:** dan-weinbeck.com -- Control Center Expansion (Milestone 2)
**Researched:** 2026-02-08
**Overall confidence:** HIGH

## Executive Summary

This milestone adds two admin tools to the existing Control Center at `/control-center/`: a Building Blocks content editor (form-guided MDX authoring with live preview) and a Brand Scraper UI (async job submission + polling + rich brand taxonomy display). After researching the ecosystem, the recommendation is to add **zero heavy editor libraries** and instead build on what already exists in the codebase. The project already has `react-markdown@10.1.0` for preview rendering, `@mdx-js/mdx@3.1.1` (transitive via `@mdx-js/loader`) for MDX compilation, and `zod@4.3.6` for form validation. The only new dependency recommended is `swr@2.4.0` for the brand scraper polling pattern.

**Critical architectural finding:** The site deploys to Cloud Run with `output: "standalone"`. The container filesystem is ephemeral -- files written at runtime are lost on container restart or redeploy. The content editor CANNOT write `.mdx` files to the filesystem in production. The recommended approach is **local-development-only filesystem writes** via a Server Action that detects `process.env.NODE_ENV === "development"` and refuses writes in production. Content authored locally is committed to git and deployed via Cloud Build like all other content.

---

## Recommended Stack Additions

### New Dependencies

| Package | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| `swr` | `^2.4.0` | Brand scraper job polling | Vercel's data-fetching library with built-in `refreshInterval` for polling. Supports dynamic interval (set to `0` when job completes). Tiny (~4.5 kB gzipped). Already part of the Vercel/Next.js ecosystem. |

### Already Installed (Use As-Is)

| Package | Version | Purpose for This Milestone |
|---------|---------|----------------------------|
| `react-markdown` | `10.1.0` | Live preview of markdown content in the editor |
| `@mdx-js/mdx` | `3.1.1` | Runtime MDX compilation for preview (validate `export const metadata` syntax) |
| `remark-gfm` | `4.0.1` | GFM support in live preview (tables, strikethrough, task lists) |
| `rehype-slug` | `6.0.0` | Heading IDs in preview |
| `rehype-pretty-code` | `0.14.1` | Code block syntax highlighting in preview |
| `zod` | `4.3.6` | Form validation for content editor metadata fields |
| `clsx` | `2.1.1` | Conditional class composition for UI components |
| `sharp` | `0.34.3` | Image processing for brand scraper asset thumbnails |

### Installation

```bash
npm install swr
```

One package. That is it.

---

## Technology Decisions with Rationale

### 1. Content Editor: Plain Textarea + react-markdown (NOT a Rich Editor Library)

**Decision:** Use a standard HTML `<textarea>` for markdown input with `react-markdown` for split-pane live preview. Do NOT install MDXEditor, `@uiw/react-md-editor`, CodeMirror, or Monaco.

**Why:**

| Factor | Rich Editor Library | Textarea + react-markdown |
|--------|--------------------|-----------------------------|
| Bundle size | MDXEditor: ~851 kB gzipped; `@uiw/react-md-editor`: ~200 kB minified | 0 KB added (react-markdown already installed) |
| Learning curve | Plugin APIs, custom toolbar configs, theme systems | Standard HTML/React patterns |
| MDX compatibility | MDXEditor supports MDX but has complex plugin setup | User writes raw MDX directly -- what they see is what gets saved |
| Maintenance burden | External dependency with breaking changes | No external dependency |
| Admin-only usage | Overkill for a single admin user | Right-sized for the use case |

**The content author is the site owner** -- a developer comfortable writing markdown. A WYSIWYG editor adds complexity without proportional value. The form-guided approach (structured metadata fields + freeform markdown body) means the editor only needs to handle the body content, which is straightforward markdown with code blocks.

**Implementation pattern:**
```
+------------------------------------------+
| [Metadata Form Fields]                   |
| Title: [_______________________]         |
| Description: [_________________]         |
| Tags: [tag1] [tag2] [+ add]             |
| Published: [2026-02-08]                 |
+------------------------------------------+
| [Markdown Body]        | [Live Preview]  |
| <textarea>             | <react-markdown>|
| # My heading           | My heading      |
| Some text...           | Some text...    |
+------------------------------------------+
| [Save Draft] [Publish]                   |
+------------------------------------------+
```

**Confidence:** HIGH -- react-markdown@10.1.0 is already proven in this codebase (used in assistant chat), and the textarea approach avoids all editor library compatibility issues.

### 2. MDX Preview Validation: @mdx-js/mdx evaluate()

**Decision:** Use `@mdx-js/mdx`'s `evaluate()` function on the server to validate that authored content compiles as valid MDX before saving. Use `react-markdown` for the live preview (not full MDX rendering), since the content is primarily markdown with an `export const metadata` header.

**Why:**
- `@mdx-js/mdx@3.1.1` is already installed as a transitive dependency of `@mdx-js/loader`
- The `evaluate()` function compiles and runs MDX in one step, returning a React component
- This lets us validate that the metadata export + markdown body will compile without errors
- For the live preview, `react-markdown` is sufficient since the body content is standard markdown
- The metadata export line is handled by the structured form fields, not typed by hand

**Usage pattern (server-side validation):**
```typescript
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";

// Validate that the full MDX file compiles
const mdxString = `export const metadata = ${JSON.stringify(metadata)};\n\n${body}`;
await evaluate(mdxString, { ...runtime }); // Throws if invalid
```

**Confidence:** HIGH -- verified via official MDX documentation at mdxjs.com/packages/mdx/.

### 3. Filesystem Writes: Development-Only Server Action

**Decision:** Write `.mdx` files via a Next.js Server Action that uses `fs.writeFile()` but ONLY in development mode. In production (Cloud Run), the action returns an error instructing the user to use the local dev server.

**Why this is the right constraint:**
- Cloud Run containers are ephemeral. Files written to the filesystem are lost on restart/redeploy.
- The standalone output (`output: "standalone"` in next.config.ts) does not even include the `src/content/` directory in the production image.
- Content changes require a `git commit` + Cloud Build deploy anyway to appear on the live site.
- The content is baked into the Docker image at build time via `@next/mdx` imports.
- Adding GCS FUSE volume mounts or GitHub API commits would be overengineering for a single-author blog.

**Implementation pattern:**
```typescript
"use server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export async function saveContent(slug: string, content: string) {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Content editing requires the local dev server." };
  }
  const dir = join(process.cwd(), "src/content/building-blocks");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${slug}.mdx`), content, "utf-8");
  return { success: true };
}
```

**Alternative considered and rejected:**

| Approach | Why Rejected |
|----------|-------------|
| GitHub API commits from production | Over-complex; requires GitHub API integration, branch management, PR workflow. The GITHUB_TOKEN in Cloud Run has repo access, but this creates a "CMS-via-API" system that is overkill. |
| GCS FUSE volume mount | Content must be in the git repo for `@next/mdx` to compile it at build time. GCS storage doesn't solve the build pipeline requirement. |
| Firestore-backed content | Would require rewriting the entire MDX rendering pipeline to load content from a database instead of the filesystem. Massive scope creep. |
| TinaCMS / Decap CMS | External CMS systems add operational complexity. The site already has a custom admin panel. |

**Confidence:** HIGH -- confirmed by examining the Dockerfile (standalone output with no src/ directory) and Cloud Run's documented ephemeral filesystem behavior.

### 4. Brand Scraper Polling: SWR with Dynamic refreshInterval

**Decision:** Use `swr@2.4.0` for polling the brand scraper job status endpoint. SWR's `refreshInterval` option supports dynamic values, allowing polling to stop automatically when the job completes.

**Why SWR over alternatives:**

| Option | Verdict |
|--------|---------|
| `swr` | RECOMMENDED. Tiny (~4.5 kB gzip). Built-in `refreshInterval` with dynamic control. Stale-while-revalidate caching. Made by Vercel (same ecosystem as Next.js). |
| `@tanstack/react-query` | Overkill. Much larger bundle. More powerful, but polling a single endpoint doesn't need query invalidation, infinite queries, etc. |
| `useEffect` + `setInterval` | Works but requires manual cleanup, stale closure management, and error retry logic. SWR handles all of this out of the box. |
| `useEffect` + `setTimeout` recursive | Same issues as setInterval but even more boilerplate. |

**Implementation pattern:**
```typescript
"use client";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function useJobStatus(jobId: string | null) {
  const [pollInterval, setPollInterval] = useState(2000);

  const { data, error } = useSWR(
    jobId ? `/api/brand-scraper/jobs/${jobId}` : null,
    fetcher,
    {
      refreshInterval: pollInterval,
      onSuccess: (data) => {
        if (data.status === "complete" || data.status === "failed") {
          setPollInterval(0); // Stop polling
        }
      },
    }
  );

  return { data, error, isPolling: pollInterval > 0 };
}
```

**Confidence:** HIGH -- SWR v2.4.0 confirmed published 8 days ago on npm. `refreshInterval` with dynamic values is documented in SWR's official API docs at swr.vercel.app/docs/api.

### 5. Brand Scraper API Proxy: Next.js API Route

**Decision:** Proxy brand scraper requests through a Next.js API route at `/api/brand-scraper/` rather than calling the Fastify Cloud Run service directly from the browser.

**Why:**
- Keeps the brand scraper service private (no `--allow-unauthenticated` needed)
- Follows the same pattern established for the chatbot API proxy
- Admin auth check can happen at the proxy layer (verify Firebase auth token)
- Brand scraper URL configured via server-only env var (not `NEXT_PUBLIC_`)
- Avoids CORS configuration on the Fastify service

**Routes:**
```
POST /api/brand-scraper/scrape   → proxy to Fastify POST /scrape
GET  /api/brand-scraper/jobs/[id] → proxy to Fastify GET /jobs/:id
```

**Confidence:** HIGH -- this pattern already exists in the codebase for the chatbot API (see `CHATBOT_API_URL` env var in cloudbuild.yaml).

### 6. Color/Font/Asset Display: Custom Tailwind Components (No Library)

**Decision:** Build color swatches, font previews, and asset galleries as custom React components using Tailwind CSS. Do NOT install a component library (shadcn/ui, Radix, etc.).

**Why:**
- The display requirements are straightforward: color squares with hex labels, font specimen text, image thumbnails
- The project already has a mature component system (Button, Card) with consistent design tokens
- Adding a component library for a few display components is disproportionate overhead
- Tailwind's inline `style={{ backgroundColor: hex }}` handles dynamic color display perfectly
- Google Fonts can be loaded dynamically via a `<link>` tag for font preview -- no library needed

**Component patterns:**

```typescript
// Color swatch (inline style for dynamic hex values)
function ColorSwatch({ hex, name, confidence }: ColorProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 rounded-lg border border-border shadow-sm"
        style={{ backgroundColor: hex }}
      />
      <div>
        <p className="text-sm font-mono">{hex}</p>
        <p className="text-xs text-text-secondary">{name}</p>
      </div>
    </div>
  );
}

// Font preview (dynamic Google Fonts loading)
function FontPreview({ fontFamily }: { fontFamily: string }) {
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}&display=swap`;
  return (
    <>
      <link rel="stylesheet" href={fontUrl} />
      <p style={{ fontFamily }}>{fontFamily}</p>
    </>
  );
}
```

**Confidence:** HIGH -- these are standard CSS/HTML patterns with no library dependencies.

### 7. Form State Management: React 19 useActionState

**Decision:** Use React 19's `useActionState` hook (already available via React 19.2.3) for the content editor form, paired with Zod validation in the Server Action.

**Why:**
- The project already uses this pattern in the contact form (`submitContact` action with Zod schema validation)
- React 19's `useActionState` replaces the old `useFormState` and handles pending states
- No need for react-hook-form, formik, or any form library
- The content editor form has simple fields (title, description, tags, date, body) that don't need complex field arrays or nested validation

**Confidence:** HIGH -- pattern already proven in `src/lib/actions/contact.ts`.

---

## What NOT to Add (and Why)

| Library | Why NOT |
|---------|---------|
| `@mdxeditor/editor` | 851 kB gzipped. Overkill for a single admin user writing markdown. |
| `@uiw/react-md-editor` | ~200 kB minified. Adds textarea encapsulation + toolbar that isn't needed. |
| `@uiw/react-codemirror` | Brings in CodeMirror 6 (~250+ kB). The content is markdown, not code. |
| `monaco-editor` | VS Code's editor. Megabytes of bundle. Absurd for a content form. |
| `@tanstack/react-query` | Heavier than SWR, more features than needed for polling one endpoint. |
| `react-hook-form` | The form has 5 flat fields. React 19's `useActionState` is sufficient. |
| `shadcn/ui` or `radix-ui` | The project has its own design system (Button, Card). Adding a component library mid-project creates inconsistency. |
| `next-mdx-remote` | For loading MDX from remote sources. Content here is local filesystem. Not maintained well. |
| `tina` / `decap-cms` | External CMS. The site already has a custom admin panel. |
| `react-colorful` / `react-color` | For color PICKERS (letting users choose colors). We need color DISPLAY (showing scraped colors). Plain CSS. |
| `google-fonts` / `use-googlefonts` | Dynamic font preview can be done with a `<link>` tag. No library needed. |

---

## Integration Points with Existing Stack

### AdminGuard Protection
Both new features live under `/control-center/` which already has `AdminGuard` in the layout. No auth changes needed.

### Existing UI Components
- `Card` component (default/clickable/featured variants) can be used for brand scraper job cards and result display
- `Button` component (primary/secondary/ghost variants) for form actions

### Existing Patterns to Reuse
| Pattern | Location | Reuse For |
|---------|----------|-----------|
| Server Action + Zod validation | `src/lib/actions/contact.ts` | Content editor save action |
| Rate limiting (in-memory Map) | `src/lib/actions/contact.ts` | Brand scraper submission throttling |
| API proxy to external service | `CHATBOT_API_URL` pattern | Brand scraper API proxy |
| Content directory scanning | `src/lib/tutorials.ts` | Listing existing content for editing |
| MDX metadata extraction | `src/lib/tutorials.ts` | Pre-populating editor form for edits |

### Environment Variables (New)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `BRAND_SCRAPER_API_URL` | Server-only | URL of the Fastify brand scraper Cloud Run service |

Added to `cloudbuild.yaml` deploy step alongside existing `CHATBOT_API_URL`.

---

## Deployment Considerations

### Content Editor Workflow
```
1. Developer runs `npm run dev` locally
2. Opens /control-center/content-editor
3. Fills in metadata form + writes markdown body
4. Live preview shows rendered output
5. Clicks "Save" → Server Action writes .mdx file to src/content/building-blocks/
6. Developer reviews file, commits to git
7. Cloud Build triggers → deploys new container with content baked in
```

This is NOT a "publish from production" CMS. It is a local authoring tool.

### Brand Scraper Workflow
```
1. Admin opens /control-center/brand-scraper (works in dev and production)
2. Enters URL, clicks "Scrape"
3. Next.js API route proxies POST /scrape to Fastify service
4. Returns job_id, UI starts SWR polling
5. Polling hits GET /api/brand-scraper/jobs/:id every 2s
6. When status === "complete", polling stops, UI renders BrandTaxonomy
7. Results displayed: color palette, typography, logos, assets
```

This works in both development and production.

---

## Version Compatibility Matrix

| Package | Version | React 19 | Next.js 16 | Notes |
|---------|---------|----------|------------|-------|
| `swr` | 2.4.0 | Yes | Yes | Peer dep: react >=16.11.0 |
| `react-markdown` | 10.1.0 | Yes | Yes | Already installed, working |
| `@mdx-js/mdx` | 3.1.1 | Yes | Yes | Already installed (transitive) |
| `zod` | 4.3.6 | N/A | N/A | Schema library, no React dep |

No version conflicts. SWR is the only new install and has minimal peer dependencies.

---

## Sources

### Verified (HIGH confidence)
- [MDX on-demand compilation docs](https://mdxjs.com/guides/mdx-on-demand/) -- evaluate() function for runtime MDX validation
- [@mdx-js/mdx API reference](https://mdxjs.com/packages/mdx/) -- compile and evaluate functions
- [SWR official docs](https://swr.vercel.app/) -- refreshInterval API for polling
- [SWR API reference](https://swr.vercel.app/docs/api) -- dynamic refreshInterval, onSuccess callback
- [Cloud Run container contract](https://docs.cloud.google.com/run/docs/container-contract) -- ephemeral filesystem documentation
- [Cloud Run volume mounts](https://docs.cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts) -- GCS FUSE option (considered, rejected)
- Existing codebase: `Dockerfile`, `cloudbuild.yaml`, `src/lib/actions/contact.ts`, `src/lib/tutorials.ts`

### Consulted (MEDIUM confidence)
- [MDXEditor](https://mdxeditor.dev/) -- evaluated, rejected due to bundle size (~851 kB gzipped)
- [@uiw/react-md-editor](https://www.npmjs.com/package/@uiw/react-md-editor) -- evaluated, rejected (unnecessary dependency)
- [@uiw/react-codemirror](https://github.com/uiwjs/react-codemirror) -- evaluated, rejected (CodeMirror overhead)
- [Next.js fonts documentation](https://nextjs.org/docs/app/getting-started/fonts) -- dynamic font loading patterns
- [React useInterval pattern](https://overreacted.io/making-setinterval-declarative-with-react-hooks/) -- considered, SWR chosen instead
- [Strapi: 5 Best Markdown Editors for React](https://strapi.io/blog/top-5-markdown-editors-for-react) -- editor comparison reference
