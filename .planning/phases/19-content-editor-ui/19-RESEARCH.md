# Phase 19: Content Editor UI - Research

**Researched:** 2026-02-09
**Domain:** Client-side form editor with live markdown preview, unsaved changes warning, and optional fast companion support
**Confidence:** HIGH

## Summary

This phase builds the front-end UI for the Building Blocks content editor at `/control-center/content/new`. The editor is a client-side form that collects tutorial metadata (title, description, published date, tags), a markdown body, and optionally a "fast companion" body. It has two tabs -- Edit and Preview. The Preview tab renders the markdown body using `react-markdown` with the same `prose prose-neutral` styling used on published tutorials. Clicking Save calls the existing `saveTutorial` Server Action from Phase 18. Navigating away with unsaved changes triggers a browser `beforeunload` warning.

The project already has every dependency needed. `react-markdown` v10.1.0 is installed and used in `ReadmeRenderer.tsx` with `remarkGfm`. The `prose prose-neutral max-w-none` class pattern is used on the published tutorial page (`[slug]/page.tsx`) and the ReadmeRenderer. The `saveTutorial` Server Action, Zod schemas, and admin auth are all in place from Phase 18. The `AdminGuard` + `ControlCenterNav` layout already wraps all `/control-center/**` pages. The `useAuth()` hook provides `user.getIdToken()` for passing to the Server Action.

Two pieces of Phase 18 infrastructure need extension: the `saveTutorialSchema` needs an optional `fastBody` field, and the `saveTutorial` action needs to write the companion `_slug-fast.mdx` file when `fastBody` is provided. These are small, additive changes to existing files.

**Primary recommendation:** Build a single `"use client"` form component at `src/components/admin/TutorialEditor.tsx` that manages all form state, tab switching, preview rendering, and save submission. Wire it into a thin page at `src/app/control-center/content/new/page.tsx`. Extend the existing schema and action for fast companion support. Add a "New Tutorial" link to the content listing page.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-markdown` | 10.1.0 | Render markdown body as React elements for live preview | Already installed; already used in `ReadmeRenderer.tsx` |
| `remark-gfm` | 4.0.1 | GFM support (tables, strikethrough, tasklists) in preview | Already installed; used in `ReadmeRenderer.tsx` and `next.config.ts` MDX pipeline |
| `@tailwindcss/typography` | 0.5.19 | `prose` classes for styled markdown output | Already installed; `@plugin` in `globals.css` |
| `clsx` | 2.1.1 | Conditional class name composition | Already installed; used throughout project |
| `zod` | ^4.3.6 | Form validation (extends existing `saveTutorialSchema`) | Already installed; schemas in `src/lib/schemas/content.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `firebase` (client) | ^12.8.0 | `user.getIdToken()` to obtain ID token for server action | Used in save handler before calling `saveTutorial` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-markdown` for preview | MDX runtime compilation (`@mdx-js/mdx`) | MDX runtime would match published output exactly (including custom components), but is significantly heavier, async, and overkill for a dev tool with no custom MDX components |
| Plain `<textarea>` for markdown input | CodeMirror / Monaco editor | Full code editors add significant bundle weight and complexity; a plain textarea with monospace font is sufficient for a dev-only admin tool |
| `rehype-pretty-code` in preview | No syntax highlighting in preview | Preview should match published appearance; however, `rehype-pretty-code` is async (loads shiki themes) which requires `MarkdownHooks` and adds latency. Skip syntax highlighting in preview since the primary visual match is `prose` typography, not code coloring. The admin user understands code blocks will be styled differently in the published version. |
| `useActionState` (React 19 form pattern) | Direct async function call | `useActionState` is designed for `<form action>` pattern but the editor has complex state (tabs, toggle, multiple textareas) that doesn't fit a single FormData submission. Direct async call to `saveTutorial(token, data)` is simpler and matches the existing pattern from Phase 18 research. |

**Installation:** No new packages needed. Everything is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── admin/
│       └── TutorialEditor.tsx   # NEW: Main editor form component ("use client")
├── app/
│   └── control-center/
│       └── content/
│           ├── page.tsx          # EXISTING: Tutorial list (add "New Tutorial" link)
│           └── new/
│               └── page.tsx      # NEW: Thin page wrapper for TutorialEditor
├── lib/
│   ├── schemas/
│   │   └── content.ts           # MODIFY: Add optional fastBody to saveTutorialSchema
│   └── actions/
│       └── content.ts           # MODIFY: Write _slug-fast.mdx when fastBody provided
```

### Pattern 1: Client-Side Tab Switching (Edit/Preview)
**What:** Two-tab interface where Edit shows form fields + textarea, Preview renders markdown via `react-markdown`
**When to use:** Any editor with a live preview mode
**Why:** Matches the existing `ArticleTabs` pattern in `src/components/building-blocks/ArticleTabs.tsx` -- the project already has this exact UI pattern
**Example:**
```typescript
// Source: src/components/building-blocks/ArticleTabs.tsx (adapted for editor)
const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

return (
  <>
    <nav className="flex items-center gap-3 text-sm mb-6">
      <button
        type="button"
        onClick={() => setActiveTab("edit")}
        className={activeTab === "edit"
          ? "font-semibold text-text-primary cursor-default"
          : "text-text-tertiary hover:text-gold transition-colors cursor-pointer"
        }
      >
        Edit
      </button>
      <span className="text-border select-none">|</span>
      <button
        type="button"
        onClick={() => setActiveTab("preview")}
        className={/* ... */}
      >
        Preview
      </button>
    </nav>
    <div className={activeTab === "edit" ? "" : "hidden"}>
      {/* Form fields + textarea */}
    </div>
    <div className={activeTab === "preview" ? "" : "hidden"}>
      {/* react-markdown preview */}
    </div>
  </>
);
```

### Pattern 2: Markdown Preview with Prose Styling
**What:** Render markdown body using `react-markdown` with the same `prose` classes as published tutorials
**When to use:** Live preview of markdown content
**Why:** Success criteria #2 requires prose styling that "matches the published tutorial appearance"
**Example:**
```typescript
// Source: Adapted from src/components/projects/ReadmeRenderer.tsx and
//         src/app/building-blocks/[slug]/page.tsx (line 125-126, 136)
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

<div className="prose prose-neutral max-w-none">
  <Markdown remarkPlugins={[remarkGfm]}>
    {body}
  </Markdown>
</div>
```
The `prose prose-neutral max-w-none` classes are the exact same classes used on the published tutorial page (`src/app/building-blocks/[slug]/page.tsx`, line 125/136).

### Pattern 3: Unsaved Changes Warning via `beforeunload`
**What:** Register a `beforeunload` event listener when the form has unsaved changes, triggering the native browser confirmation dialog
**When to use:** Any form where data loss on navigation is unacceptable
**Why:** Success criteria #4 requires "Navigating away from the editor with unsaved changes triggers a browser warning"
**Example:**
```typescript
// Standard React pattern for beforeunload
const [isDirty, setIsDirty] = useState(false);

useEffect(() => {
  if (!isDirty) return;

  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    // Modern browsers ignore custom messages; setting returnValue is required
    e.returnValue = "";
  };

  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [isDirty]);
```
**Scope limitation:** This handles browser close, refresh, and address bar navigation. It does NOT intercept Next.js client-side navigation (`<Link>`, `router.push()`). For this admin editor, that's acceptable because:
1. The ControlCenterNav links are the only in-page navigation
2. The success criteria specifically says "browser warning" not "route change interception"
3. Full route interception requires complex history state manipulation and is fragile in Next.js App Router

### Pattern 4: Token-Based Server Action Call from Client
**What:** Get Firebase ID token from auth context and pass it as the first argument to the server action
**When to use:** Any client component calling a server action that requires admin auth
**Why:** Established pattern from Phase 18; `saveTutorial(idToken, data)` signature already in place
**Example:**
```typescript
// Source: Phase 18 research, src/lib/actions/content.ts signature
import { useAuth } from "@/context/AuthContext";
import { saveTutorial } from "@/lib/actions/content";

const { user } = useAuth();

async function handleSave() {
  const token = await user?.getIdToken();
  if (!token) return;
  const result = await saveTutorial(token, {
    slug,
    metadata: { title, description, publishedAt, tags },
    body,
    fastBody: includeFast ? fastBody : undefined,
  });
}
```

### Pattern 5: Form Input Styling (from ContactForm)
**What:** Reuse the input styling pattern from the existing ContactForm
**When to use:** Any admin form inputs
**Why:** Consistency with existing project patterns
**Example:**
```typescript
// Source: src/components/contact/ContactForm.tsx (line 18)
const inputBase =
  "mt-1 block w-full rounded-lg border border-border px-3 py-2 shadow-sm transition-colors focus:border-gold focus:ring-1 focus:ring-gold min-h-[44px]";
```

### Anti-Patterns to Avoid
- **MDX runtime compilation for preview:** Do NOT use `@mdx-js/mdx` evaluate/compile for preview. It's async, heavy, and the project has no custom MDX components to render. `react-markdown` is synchronous and sufficient.
- **Full code editor (CodeMirror/Monaco) for textarea:** Massive bundle for a dev-only tool. A plain `<textarea>` with monospace font and sufficient height is adequate.
- **`useActionState` with `<form action>`:** The editor has complex multi-field state (title, description, date, tags array, body, fast toggle, fast body) that doesn't map cleanly to a single `FormData` submission. A direct async call to the server action is simpler.
- **Intercepting App Router navigation:** Full route interception via history manipulation is fragile. The `beforeunload` event covers the success criteria. The admin user can be trusted to use the Save button.
- **Duplicating prose styling classes:** Do NOT create custom preview styles. Use the exact same `prose prose-neutral max-w-none` classes as the published tutorial page.
- **Creating the page as a Server Component:** The editor must be `"use client"` (needs `useState`, `useEffect`, `useAuth`, event handlers). The page file can be a thin wrapper, but the form component must be client-side.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering | Custom markdown parser | `react-markdown` with `remarkGfm` | Already installed and used in `ReadmeRenderer.tsx`; handles GFM, XSS-safe by default |
| Prose/typography styling | Custom CSS for markdown output | `prose prose-neutral max-w-none` (Tailwind Typography) | Already configured in `globals.css`; matches published tutorial appearance |
| Tab switching UI | Custom tab library | Local state `useState<"edit" \| "preview">` with button toggles | Same pattern as `ArticleTabs.tsx`; no library needed for two tabs |
| Form validation | Custom validation logic | Zod schemas from `src/lib/schemas/content.ts` | Client-side validation should mirror server-side; use same schemas |
| Admin auth token | Custom token management | `useAuth().user.getIdToken()` from `AuthContext` | Already provides Firebase User object with token method |
| Unsaved changes warning | Custom dialog system | Native `beforeunload` event | Browser-native; no library needed; meets success criteria |
| Date input | Custom date picker | `<input type="date">` | HTML5 date input is sufficient for YYYY-MM-DD format; matches schema regex |

**Key insight:** This phase is primarily a UI composition task. Every backend piece (server action, schema, auth, file writing) is already built. Every UI pattern (tabs, prose styling, form inputs, react-markdown usage) has a direct precedent in the codebase. The work is assembling these existing pieces into a new page.

## Common Pitfalls

### Pitfall 1: Mismatched Preview Styling
**What goes wrong:** Preview renders markdown with different typography than the published tutorial page, leading the admin to think the content looks wrong
**Why it happens:** Using different CSS classes for the preview container than what the published page uses
**How to avoid:** Use the exact same classes: `prose prose-neutral max-w-none`. Verify by comparing with `src/app/building-blocks/[slug]/page.tsx` lines 125-126 and 136.
**Warning signs:** Preview looks noticeably different from published tutorials (font size, spacing, heading styles)

### Pitfall 2: Forgetting to Mark Form as Dirty
**What goes wrong:** The `beforeunload` warning never fires because `isDirty` is never set to `true`
**Why it happens:** Only setting dirty on some fields, or resetting dirty state at the wrong time
**How to avoid:** Set `isDirty = true` in every `onChange` handler (or use a single handler that marks dirty). Reset to `false` only after a successful save.
**Warning signs:** Can navigate away from a half-filled form without any warning

### Pitfall 3: Fast Companion File Not Following Naming Convention
**What goes wrong:** Fast companion file is created with wrong name, so the published page doesn't detect it
**Why it happens:** Using wrong prefix or separator (e.g., `_slug_fast.mdx` instead of `_slug-fast.mdx`)
**How to avoid:** The convention is `_${slug}-fast.mdx` (underscore prefix, hyphen before "fast"). Verify against existing files: `_setting-up-a-repo-fast.mdx`, `_custom-gpt-fast.mdx`. The detection logic in `[slug]/page.tsx` (line 28) is: `existsSync(join(CONTENT_DIR, \`_${slug}-fast.mdx\`))`.
**Warning signs:** Fast companion toggle is used, file is saved, but published page shows no tabs

### Pitfall 4: Schema Extension Breaking Existing Functionality
**What goes wrong:** Adding `fastBody` to `saveTutorialSchema` as required breaks existing save calls that don't include it
**Why it happens:** Making the field required instead of optional
**How to avoid:** Add `fastBody` as `z.string().min(1).optional()` -- optional but non-empty when provided. The `saveTutorial` action should only write the companion file when `fastBody` is provided and non-empty.
**Warning signs:** TypeScript errors on existing test calls or save invocations

### Pitfall 5: Tags Input UX
**What goes wrong:** Tags field is confusing to use because there's no clear way to add/remove individual tags
**Why it happens:** Implementing tags as a single text input (comma-separated string) without clear affordances
**How to avoid:** Use a simple comma-separated input with a helper message like "Separate tags with commas". Parse on save: `tagsInput.split(",").map(t => t.trim()).filter(Boolean)`. This is a dev-only tool, so a simple approach is fine.
**Warning signs:** Admin accidentally submits tags with leading/trailing whitespace or empty strings

### Pitfall 6: Missing Slug Auto-Generation
**What goes wrong:** Admin has to manually create a slug for every tutorial, which is tedious and error-prone
**Why it happens:** Not providing an auto-slug feature from the title
**How to avoid:** Auto-generate slug from title on blur (lowercase, replace spaces/special chars with hyphens, remove consecutive hyphens). Allow manual override. This is a UX nicety, not a hard requirement.
**Warning signs:** Slug field is always manually filled; typos in slugs

### Pitfall 7: `getIdToken()` Returning Expired Token
**What goes wrong:** Save fails with "Unauthorized" because the cached Firebase token expired
**Why it happens:** Firebase tokens expire after 1 hour. If the admin leaves the editor open and comes back, the cached token may be stale.
**How to avoid:** `user.getIdToken()` without arguments returns a cached token. Passing `true` forces a refresh: `user.getIdToken(true)`. For a save action, force-refreshing is safer. Alternatively, just call `user.getIdToken()` (no arg) -- Firebase's client SDK auto-refreshes expired tokens.
**Warning signs:** Save works initially but fails after leaving the page idle for over an hour

## Code Examples

### react-markdown Preview (from existing codebase)
```typescript
// Source: src/components/projects/ReadmeRenderer.tsx (lines 85-96)
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ReadmeRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral max-w-none">
      <Markdown remarkPlugins={[remarkGfm]}>
        {content}
      </Markdown>
    </div>
  );
}
```

### Tab Switching Pattern (from existing codebase)
```typescript
// Source: src/components/building-blocks/ArticleTabs.tsx (lines 1-47)
"use client";
import { useState } from "react";

const [activeTab, setActiveTab] = useState<"manual" | "fast">("manual");

<nav className="flex items-center gap-3 text-sm mb-10">
  <button
    type="button"
    onClick={() => setActiveTab("manual")}
    className={activeTab === "manual"
      ? "font-semibold text-text-primary cursor-default"
      : "text-text-tertiary hover:text-gold transition-colors cursor-pointer"
    }
  >
    Manual Configuration + Fundamentals
  </button>
  <span className="text-border select-none">|</span>
  {/* ... fast tab button ... */}
</nav>
```

### Admin Auth Token Pattern (from existing codebase)
```typescript
// Source: src/context/AuthContext.tsx (useAuth hook) + Phase 18 pattern
const { user } = useAuth();
const token = await user?.getIdToken();
const result = await saveTutorial(token, data);
```

### Input Styling (from existing codebase)
```typescript
// Source: src/components/contact/ContactForm.tsx (line 18)
const inputBase =
  "mt-1 block w-full rounded-lg border border-border px-3 py-2 shadow-sm transition-colors focus:border-gold focus:ring-1 focus:ring-gold min-h-[44px]";
```

### Published Tutorial Prose Container (from existing codebase)
```typescript
// Source: src/app/building-blocks/[slug]/page.tsx (lines 125-126, 136)
<div className="prose prose-neutral max-w-none">
  <Content />
</div>
```

### Fast Companion Detection (from existing codebase)
```typescript
// Source: src/app/building-blocks/[slug]/page.tsx (lines 27-29)
function hasFastCompanion(slug: string): boolean {
  return existsSync(join(CONTENT_DIR, `_${slug}-fast.mdx`));
}
```

### Schema Extension for Fast Companion (to be created)
```typescript
// Extend src/lib/schemas/content.ts
export const saveTutorialSchema = z.object({
  slug: tutorialSlugSchema,
  metadata: tutorialMetaSchema,
  body: z.string().min(1, "Content body is required"),
  fastBody: z.string().min(1, "Fast companion body is required").optional(),
});
```

### Server Action Extension for Fast Companion (to be added to src/lib/actions/content.ts)
```typescript
// After writing the main file, write companion if fastBody provided
if (parsed.data.fastBody) {
  const fastPath = path.resolve(CONTENT_DIR, `_${parsed.data.slug}-fast.mdx`);
  if (!fastPath.startsWith(CONTENT_DIR + path.sep)) {
    return { success: false, error: "Invalid slug." };
  }
  await writeFile(fastPath, parsed.data.fastBody, "utf-8");
}
```
Note: Fast companion files contain only markdown body (no metadata export). This matches the existing `_custom-gpt-fast.mdx` and `_setting-up-a-repo-fast.mdx` files, which have no `export const metadata` block.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-markdown` default import | Named `Markdown` export | react-markdown v9+ | Import as `import Markdown from "react-markdown"` or `import { Markdown }` -- both work |
| `Markdown` component only (sync) | `Markdown`, `MarkdownAsync`, `MarkdownHooks` | react-markdown v9.1+ | `MarkdownHooks` enables async plugins on client; not needed here since we skip `rehype-pretty-code` in preview |
| `onBeforeUnload` with custom message | `e.preventDefault()` + `e.returnValue = ""` | Chrome 51+, Firefox 44+ | Custom messages are ignored by modern browsers; the standard confirmation dialog is shown instead |

**Deprecated/outdated:**
- Custom `beforeunload` messages: Browsers no longer display custom text in the confirmation dialog. Just set `e.preventDefault()` and `e.returnValue = ""`.
- `router.events` (Next.js Pages Router): Not available in App Router. Use `beforeunload` event directly.

## Open Questions

1. **Should the editor support editing existing tutorials?**
   - What we know: Success criteria only mention creating new tutorials. The `saveTutorial` action rejects slug collisions.
   - What's unclear: Whether an "edit" feature should be included in this phase
   - Recommendation: Out of scope for Phase 19. The success criteria is clear: "new" editor only. Edit functionality would require loading existing content, updating the action to support overwrites, and a different route pattern.

2. **Should the preview include syntax highlighting for code blocks?**
   - What we know: Published tutorials use `rehype-pretty-code` with shiki for syntax highlighting. The preview uses `react-markdown` which can accept rehype plugins.
   - What's unclear: Whether "matches the published tutorial appearance" requires syntax highlighting in preview
   - Recommendation: Skip syntax highlighting in preview. `rehype-pretty-code` is async (requires `MarkdownHooks` + shiki loading), adds latency to the live preview, and increases bundle size. The `prose` typography styling provides the primary visual match. Code blocks will render as styled `<pre><code>` blocks without color, which is acceptable for a dev-only preview. The admin understands code will be colored on the published page.

3. **Should the "New Tutorial" button appear on the content listing page?**
   - What we know: Success criteria #1 says the editor is at `/control-center/content/new`. The listing page exists at `/control-center/content`.
   - What's unclear: Whether a link should be added to navigate between them
   - Recommendation: Yes, add a "New Tutorial" link/button to the content listing page. It's a natural navigation flow and trivial to implement.

## Sources

### Primary (HIGH confidence)
- `src/components/projects/ReadmeRenderer.tsx` -- Existing `react-markdown` + `remarkGfm` usage pattern, `prose` styling
- `src/app/building-blocks/[slug]/page.tsx` -- Published tutorial prose classes (`prose prose-neutral max-w-none`), fast companion detection (`hasFastCompanion`), `ArticleTabs` usage
- `src/components/building-blocks/ArticleTabs.tsx` -- Existing tab switching pattern
- `src/components/contact/ContactForm.tsx` -- Existing form input styling pattern (`inputBase` class)
- `src/lib/actions/content.ts` -- `saveTutorial` Server Action (Phase 18 output)
- `src/lib/schemas/content.ts` -- `saveTutorialSchema`, `tutorialMetaSchema`, `tutorialSlugSchema` (Phase 18 output)
- `src/context/AuthContext.tsx` -- `useAuth()` hook providing `user.getIdToken()`
- `src/content/building-blocks/_setting-up-a-repo-fast.mdx` -- Fast companion file format (body only, no metadata)
- `src/content/building-blocks/_custom-gpt-fast.mdx` -- Second example of fast companion format
- `node_modules/react-markdown/lib/index.d.ts` -- react-markdown v10.1.0 API (Options type, Markdown/MarkdownAsync/MarkdownHooks exports)

### Secondary (MEDIUM confidence)
- [rehype-pretty-code docs](https://rehype-pretty.pages.dev/) -- Confirmed async nature (loads shiki); justification for skipping in preview
- [Next.js App Router unsaved changes gist](https://gist.github.com/icewind/71d31b2984948271db33784bb0df8393) -- `beforeunload` + history state pattern for unsaved changes protection
- [ClarityDev unsaved changes article](https://claritydev.net/blog/display-warning-for-unsaved-form-data-on-page-exit) -- `beforeunload` event best practices
- [GitHub remarkjs/react-markdown](https://github.com/remarkjs/react-markdown) -- react-markdown v10 API and async plugin support

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and used in the project; no new dependencies
- Architecture: HIGH -- Every pattern (tabs, prose styling, react-markdown, form inputs, server action calls) has a direct precedent in the existing codebase
- Pitfalls: HIGH -- File naming convention verified against existing files; `beforeunload` API is well-documented web standard; schema extension pattern is straightforward Zod

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (stable domain; no fast-moving dependencies)
