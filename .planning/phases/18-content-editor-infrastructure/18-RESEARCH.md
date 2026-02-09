# Phase 18: Content Editor Infrastructure - Research

**Researched:** 2026-02-08
**Domain:** Server-side content management (filesystem MDX read/write, auth, validation)
**Confidence:** HIGH

## Summary

This phase adds the server-side plumbing for a content authoring workflow: listing existing Building Blocks tutorials, validating new content metadata/slugs, and writing MDX files to the filesystem. All write operations are dev-only (gated on `NODE_ENV`).

The project already has strong patterns for every piece of this phase. Content discovery exists in `src/lib/tutorials.ts` (via `getAllTutorials()`), server-side admin auth exists in `src/lib/auth/admin.ts` (via `verifyAdmin()` with Firebase ID token verification), Server Actions exist in `src/lib/actions/contact.ts`, Zod validation exists in `src/lib/schemas/contact.ts`, and the MDX metadata format is established (`export const metadata = { ... }`). The work is extending existing patterns, not inventing new ones.

**Primary recommendation:** Build a single Server Action file (`src/lib/actions/content.ts`) that reuses `getAllTutorials()` for listing and adds a `saveTutorial()` action with Zod validation, slug sanitization, environment gating, and Firebase ID token verification. Pass the token as a parameter from the client component (obtained via `user.getIdToken()`).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `fs/promises` | built-in | Async file write | Standard Node.js API, already used (sync version) in `src/lib/tutorials.ts` |
| `path` | built-in | Path resolution and sanitization | Already used in `src/lib/tutorials.ts` and `src/app/building-blocks/[slug]/page.tsx` |
| Zod | ^4.3.6 | Schema validation for metadata + slug | Already installed and used throughout project |
| Firebase Admin SDK | ^13.6.0 | ID token verification | Already installed; `verifyIdToken` used in `src/lib/auth/admin.ts` |
| Next.js Server Actions | built-in | `"use server"` directive | Already used in `src/lib/actions/contact.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `firebase` (client) | ^12.8.0 | `user.getIdToken()` to obtain ID token on client | Already installed; used in `AuthContext` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Action with token param | API Route (`/api/content`) with `verifyAdmin(request)` | API route gets headers natively but requires `fetch()` calls from client; Server Action is more idiomatic for form submissions in Next.js App Router |
| `fs.writeFileSync` | `fs/promises.writeFile` | Async is better for server actions; use async |
| Token as parameter | Cookie-based session | Would require adding `next-firebase-auth-edge` or custom cookie management; the project does not currently store auth tokens in cookies |

**Installation:** No new packages needed. Everything is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── actions/
│   │   ├── contact.ts          # Existing server action (pattern reference)
│   │   └── content.ts          # NEW: saveTutorial server action
│   ├── schemas/
│   │   ├── contact.ts          # Existing schema (pattern reference)
│   │   └── content.ts          # NEW: tutorial metadata + slug schemas
│   ├── auth/
│   │   └── admin.ts            # Existing: verifyAdmin, verifyIdToken
│   └── tutorials.ts            # Existing: getAllTutorials (reuse for listing)
├── app/
│   └── control-center/
│       └── content/
│           └── page.tsx         # REPLACE placeholder with tutorial list
└── content/
    └── building-blocks/        # Target directory for MDX writes
        ├── setting-up-a-repo.mdx
        ├── custom-gpt.mdx
        └── [new-tutorials].mdx
```

### Pattern 1: Server Action with Token Parameter Auth
**What:** Pass Firebase ID token as a parameter to the server action, verify server-side
**When to use:** Server Actions that need authenticated admin access
**Why:** Server Actions are invoked via POST by Next.js runtime, not via `fetch()` with custom headers. The `headers()` function from `next/headers` does NOT expose the `Authorization` header for Server Action calls because the browser does not add custom headers to the RPC call. The token must be passed as a data parameter.
**Example:**
```typescript
// src/lib/actions/content.ts
"use server";

import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ADMIN_EMAIL } from "@/lib/constants";

async function verifyAdminToken(idToken: string): Promise<boolean> {
  if (getApps().length === 0) return false;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded.email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export async function saveTutorial(idToken: string, data: TutorialFormData) {
  const isAdmin = await verifyAdminToken(idToken);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }
  // ... proceed with save
}
```

```typescript
// Client component calling the action
"use client";
import { useAuth } from "@/context/AuthContext";
import { saveTutorial } from "@/lib/actions/content";

function ContentEditor() {
  const { user } = useAuth();

  async function handleSave(formData: TutorialFormData) {
    const token = await user?.getIdToken();
    if (!token) return;
    const result = await saveTutorial(token, formData);
  }
}
```

### Pattern 2: Environment Gate for Dev-Only Writes
**What:** Check `process.env.NODE_ENV !== "development"` to block writes in production
**When to use:** Any filesystem write operation
**Why:** The MDX editor is a dev-only tool; production builds on Cloud Run should never write to the filesystem
**Example:**
```typescript
if (process.env.NODE_ENV !== "development") {
  return {
    success: false,
    error: "Content editing is only available in development mode.",
  };
}
```

### Pattern 3: Slug Validation (Allowlist, Not Blocklist)
**What:** Validate slugs with a strict allowlist regex, then verify resolved path is within content directory
**When to use:** Any user-supplied slug used in filesystem paths
**Why:** Blocklists (`../` stripping) are bypassable. Allowlists are not.
**Example:**
```typescript
// Strict allowlist: lowercase letters, numbers, hyphens only
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateSlug(slug: string): boolean {
  if (!SLUG_REGEX.test(slug)) return false;
  if (slug.length > 100) return false;

  // Belt-and-suspenders: verify resolved path is within content dir
  const resolved = path.resolve(CONTENT_DIR, `${slug}.mdx`);
  return resolved.startsWith(CONTENT_DIR + path.sep);
}
```

### Pattern 4: MDX File Template with Exported Metadata
**What:** Generate MDX files matching the exact `export const metadata` format used by existing content
**When to use:** Writing new tutorial files
**Why:** Must match the format that `getAllTutorials()` and the `[slug]/page.tsx` dynamic route expect
**Example:**
```typescript
function buildMdxContent(meta: TutorialMeta, body: string): string {
  return `export const metadata = {
  title: ${JSON.stringify(meta.title)},
  description: ${JSON.stringify(meta.description)},
  publishedAt: ${JSON.stringify(meta.publishedAt)},
  tags: ${JSON.stringify(meta.tags)},
};

${body}
`;
}
```

### Anti-Patterns to Avoid
- **Blocklist slug validation:** Do NOT strip `../` or specific characters. Use an allowlist regex instead. Attackers can use URL encoding, null bytes, and other bypass techniques.
- **Sync filesystem operations:** Do NOT use `writeFileSync` in server actions. Use `fs/promises.writeFile` for non-blocking writes.
- **Cookie-based auth tokens:** The project currently does NOT store Firebase tokens in cookies. Adding cookie management is unnecessary complexity for a dev-only feature. Pass the token as a parameter.
- **Writing in production:** Never allow filesystem writes when `NODE_ENV !== "development"`. Cloud Run's filesystem is ephemeral anyway, so writes would be lost.
- **Trusting AdminGuard alone:** AdminGuard is client-side only (checks `user.email` in the browser). The server action MUST independently verify the token server-side. AdminGuard is a UX guard, not a security gate.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Content listing | Custom filesystem scanner | `getAllTutorials()` from `src/lib/tutorials.ts` | Already handles `.mdx` filtering, `_`-prefix exclusion, metadata extraction, date sorting |
| Admin token verification | New verification logic | Adapt pattern from `src/lib/auth/admin.ts` (`verifyIdToken` + email check) | Already proven, handles edge cases (missing Firebase config, expired tokens, wrong email) |
| Zod schema validation | Manual validation | Zod schema in `src/lib/schemas/content.ts` | Project-standard pattern; provides type inference |
| Server action structure | API route | `"use server"` action in `src/lib/actions/content.ts` | Matches existing `contact.ts` pattern; simpler client integration |
| MDX metadata format | Custom format | Match exact `export const metadata = {...}` pattern from existing `.mdx` files | `getAllTutorials()` already knows how to parse this format |

**Key insight:** This phase is 90% composition of existing patterns. The tutorials library, admin auth, Zod schemas, and server action patterns all already exist. The new work is wiring them together in a new action file and replacing the placeholder page.

## Common Pitfalls

### Pitfall 1: Server Action Auth via Headers
**What goes wrong:** Attempting to read `Authorization` header via `headers()` from `next/headers` inside a Server Action, then finding it's undefined
**Why it happens:** Server Actions are invoked by Next.js via an internal POST mechanism, not a standard `fetch()` with custom headers. The browser does not attach an `Authorization` header to Server Action calls.
**How to avoid:** Pass the Firebase ID token as a parameter to the server action. The client component calls `user.getIdToken()` and passes the result.
**Warning signs:** `authorization` being `null` in server action logs

### Pitfall 2: Blocklist Slug Sanitization
**What goes wrong:** Using `slug.replace(/\.\./g, '')` or similar blocklist approaches, which are bypassed by encoded sequences
**Why it happens:** Path traversal attacks have many encoding variants (`%2e%2e`, `..%2f`, null bytes)
**How to avoid:** Use a strict allowlist regex (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`) that only permits known-safe characters. Add a belt-and-suspenders `path.resolve()` check.
**Warning signs:** Slug contains any character not in `[a-z0-9-]`

### Pitfall 3: Forgetting the Environment Gate
**What goes wrong:** The save action works in production, writing to Cloud Run's ephemeral filesystem (data lost on restart) or worse, opening a write attack surface
**Why it happens:** Developer forgets to add the `NODE_ENV` check, or checks for `=== "production"` (which misses `"test"` and other environments)
**How to avoid:** Check `!== "development"` (safer default: block everything except explicitly development). Place this check FIRST in the action, before any validation.
**Warning signs:** No early return for non-development environments

### Pitfall 4: Slug Collision Not Checked
**What goes wrong:** New tutorial overwrites an existing one without warning
**Why it happens:** `fs.writeFile` overwrites by default
**How to avoid:** Check if the file already exists with `fs.existsSync()` before writing. Return an error if the slug is taken. Optionally add an `overwrite` flag for explicit updates.
**Warning signs:** Existing tutorials disappearing after saves

### Pitfall 5: JSON.stringify for Metadata Template
**What goes wrong:** Using template literals directly for strings in the metadata object, producing malformed JavaScript when titles contain quotes or special characters
**Why it happens:** Content titles can contain apostrophes, quotes, backslashes
**How to avoid:** Use `JSON.stringify()` for all string values in the generated `export const metadata` block. This handles escaping correctly.
**Warning signs:** Build failures after saving tutorials with titles containing quotes

### Pitfall 6: Missing `_`-Prefix File Convention
**What goes wrong:** Draft or fast-companion files get listed as published tutorials
**Why it happens:** `getAllTutorials()` filters out files starting with `_`. If the editor creates files without understanding this convention, unexpected behavior occurs.
**How to avoid:** Only write files without the `_` prefix (published tutorials). Document the `_` prefix convention clearly.
**Warning signs:** Fast-companion or draft files appearing in the tutorial listing

## Code Examples

Verified patterns from the existing codebase:

### Existing: getAllTutorials() (reuse for listing)
```typescript
// Source: src/lib/tutorials.ts (lines 38-69)
export async function getAllTutorials(): Promise<Tutorial[]> {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"));

  const tutorials: Tutorial[] = [];
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    // ... metadata extraction via import or fallback regex
    if (metadata?.title) {
      tutorials.push({ slug, metadata });
    }
  }
  return tutorials.sort(/* by date descending */);
}
```

### Existing: Server Action Pattern (reuse structure)
```typescript
// Source: src/lib/actions/contact.ts (lines 1-6, 47-94)
"use server";
import { headers } from "next/headers";
import { contactSchema } from "@/lib/schemas/contact";

export async function submitContact(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // 1. Validate with Zod
  // 2. Business logic
  // 3. Return typed result
}
```

### Existing: Admin Token Verification (reuse logic)
```typescript
// Source: src/lib/auth/admin.ts (lines 13-53)
export async function verifyAdmin(request: Request): Promise<AdminAuthResult> {
  // Extracts Bearer token from Authorization header
  // Verifies with getAuth().verifyIdToken(idToken)
  // Checks email against ADMIN_EMAIL
  // Returns typed union result
}
```

### Existing: Zod Schema Pattern
```typescript
// Source: src/lib/schemas/contact.ts
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10).max(2000),
});

export type ContactFormData = z.infer<typeof contactSchema>;
```

### New: Tutorial Metadata Schema (to be created)
```typescript
// src/lib/schemas/content.ts
import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const tutorialSlugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(100, "Slug must be at most 100 characters")
  .regex(SLUG_REGEX, "Slug must contain only lowercase letters, numbers, and hyphens");

export const tutorialMetaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(500),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  tags: z.array(z.string().min(1).max(50)).min(1, "At least one tag required").max(10),
});

export const saveTutorialSchema = z.object({
  slug: tutorialSlugSchema,
  metadata: tutorialMetaSchema,
  body: z.string().min(1, "Content body is required"),
});

export type SaveTutorialData = z.infer<typeof saveTutorialSchema>;
```

### New: Save Tutorial Server Action (to be created)
```typescript
// src/lib/actions/content.ts
"use server";

import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ADMIN_EMAIL } from "@/lib/constants";
import { saveTutorialSchema, type SaveTutorialData } from "@/lib/schemas/content";

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "building-blocks");

export type SaveResult =
  | { success: true; slug: string }
  | { success: false; error: string };

async function verifyAdminToken(idToken: string): Promise<boolean> {
  if (getApps().length === 0) return false;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded.email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export async function saveTutorial(
  idToken: string,
  data: SaveTutorialData,
): Promise<SaveResult> {
  // 1. Environment gate (FIRST check)
  if (process.env.NODE_ENV !== "development") {
    return { success: false, error: "Content editing is only available in development mode." };
  }

  // 2. Auth verification
  const isAdmin = await verifyAdminToken(idToken);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized." };
  }

  // 3. Validate input
  const parsed = saveTutorialSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  // 4. Path traversal prevention (belt-and-suspenders)
  const filePath = path.resolve(CONTENT_DIR, `${parsed.data.slug}.mdx`);
  if (!filePath.startsWith(CONTENT_DIR + path.sep)) {
    return { success: false, error: "Invalid slug." };
  }

  // 5. Collision check
  if (existsSync(filePath)) {
    return { success: false, error: `A tutorial with slug "${parsed.data.slug}" already exists.` };
  }

  // 6. Build and write MDX
  const content = buildMdxContent(parsed.data.metadata, parsed.data.body);
  await writeFile(filePath, content, "utf-8");

  return { success: true, slug: parsed.data.slug };
}
```

### New: Content List Page (replace placeholder)
```typescript
// src/app/control-center/content/page.tsx
import { getAllTutorials } from "@/lib/tutorials";

export default async function ContentPage() {
  const tutorials = await getAllTutorials();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Building Blocks</h1>
      <table>
        {/* title, slug, date, tags for each tutorial */}
      </table>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `zod` v3 `.email()` | `zod` v4 `z.email()` (top-level) | Zod 4.0 (2025) | Old `.email()` still works but deprecated; this project uses Zod 4 |
| Sync `fs.writeFileSync` | `fs/promises.writeFile` | Node.js 10+ | Async is preferred in server contexts |
| `verifyAdmin(request)` with Request object | Token-as-parameter for Server Actions | N/A (project-specific) | Server Actions don't receive Request objects; must adapt the existing pattern |

**Deprecated/outdated:**
- Zod v3 method-style string validators (`.email()`, `.url()`) are deprecated in Zod v4 in favor of top-level functions, but still work. The project already uses Zod v4 with the old API style in existing schemas -- maintain consistency.

## Open Questions

1. **Should the save action support updating existing tutorials?**
   - What we know: Success criteria #5 mentions "slug collisions with existing content", implying new content only. But an editor typically needs update capability too.
   - What's unclear: Whether this phase should include an update/overwrite mode
   - Recommendation: For this phase, reject collisions (new content only). Add an `overwrite` flag in a future phase when the editor UI supports editing existing content.

2. **Should `_`-prefixed (draft/fast) files appear in the content list?**
   - What we know: `getAllTutorials()` filters out `_`-prefixed files. The content page says "list of all existing Building Blocks tutorials."
   - What's unclear: Whether "all" means published only or drafts too
   - Recommendation: Show published tutorials only (reuse `getAllTutorials()` as-is). Draft management can come later.

3. **How should the `verifyAdminToken` function relate to existing `verifyAdmin`?**
   - What we know: `verifyAdmin()` in `src/lib/auth/admin.ts` expects a `Request` object and extracts the Bearer token from the Authorization header. Server Actions don't have a Request object.
   - What's unclear: Whether to extract a shared `verifyToken(idToken)` function or duplicate the logic
   - Recommendation: Extract a shared `verifyAdminToken(idToken: string)` function in `src/lib/auth/admin.ts` and refactor the existing `verifyAdmin(request)` to call it. This avoids duplication while keeping both patterns working.

## Sources

### Primary (HIGH confidence)
- `src/lib/tutorials.ts` -- Existing content discovery pattern (`getAllTutorials`, `TutorialMeta`, `CONTENT_DIR`)
- `src/lib/auth/admin.ts` -- Existing admin token verification pattern (`verifyAdmin`, `verifyIdToken`, `ADMIN_EMAIL` check)
- `src/lib/actions/contact.ts` -- Existing server action pattern (`"use server"`, Zod validation, typed result)
- `src/lib/schemas/contact.ts` -- Existing Zod schema pattern
- `src/content/building-blocks/setting-up-a-repo.mdx` -- Existing MDX metadata format (`export const metadata = {...}`)
- `src/content/building-blocks/custom-gpt.mdx` -- Second example of metadata format
- `src/app/control-center/content/page.tsx` -- Existing placeholder page (to be replaced)
- `src/app/control-center/layout.tsx` -- AdminGuard + ControlCenterNav layout (already wraps content page)
- `src/context/AuthContext.tsx` -- Firebase `User` object available via `useAuth()` (has `getIdToken()` method)
- [Next.js headers() docs](https://nextjs.org/docs/app/api-reference/functions/headers) -- headers() API reference
- [Next.js Server Actions docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) -- Server Action invocation patterns

### Secondary (MEDIUM confidence)
- [Next.js Server Actions GitHub discussion #74255](https://github.com/vercel/next.js/discussions/74255) -- Confirms custom headers not available in Server Action calls
- [StackHawk Path Traversal Guide](https://www.stackhawk.com/blog/node-js-path-traversal-guide-examples-and-prevention/) -- Allowlist regex approach for path traversal prevention
- [Zod v4 release notes](https://zod.dev/v4) -- Zod v4 API changes and migration

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and used in the project
- Architecture: HIGH -- Every pattern is directly modeled on existing project code
- Pitfalls: HIGH -- Path traversal and auth pitfalls are well-documented; Server Action header limitation confirmed via multiple sources

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (stable domain; no fast-moving dependencies)
