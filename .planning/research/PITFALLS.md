# Domain Pitfalls: Control Center Content Editor + Brand Scraper UI

**Domain:** Adding MDX content editor and async job-based brand scraper UI to existing Next.js personal site
**Researched:** 2026-02-08
**Overall confidence:** HIGH (based on codebase analysis + verified documentation + web research)

---

## Critical Pitfalls

Mistakes that cause data loss, security vulnerabilities, or require architectural rework.

### Pitfall 1: Filesystem Writes on Cloud Run Are Ephemeral -- Content Vanishes on Redeploy

**What goes wrong:** The content editor writes `.mdx` files to `src/content/building-blocks/` on the local filesystem. On Cloud Run, the container filesystem is ephemeral -- every new deployment, every scale-to-zero event, and every instance restart wipes all written files. An admin writes a new building block article, it appears to work, but the next deployment erases it. Even worse, if Cloud Run scales to multiple instances, each instance has its own filesystem -- content written on instance A is invisible to instance B.

**Why it happens:** Developers test locally where `fs.writeFileSync()` works perfectly and persists across restarts. The Cloud Run environment looks identical at runtime but has fundamentally different persistence guarantees.

**Consequences:**
- Content created via the editor is silently lost on next deploy or scale event
- Multi-instance deployments serve inconsistent content (some instances have the file, others do not)
- Admin believes content was published successfully -- no error is shown
- The site may break if ISR/build cached a reference to a page that no longer exists

**Why this is critical FOR THIS PROJECT specifically:**
- The existing Dockerfile uses `output: "standalone"` and copies only `.next/standalone` and `.next/static` to the runner stage -- source content files are not even in the production container
- Building blocks pages use `generateStaticParams()` with `dynamicParams = false` (line 36 of `[slug]/page.tsx`), meaning pages not generated at build time return 404 -- writing a new `.mdx` file at runtime would never be accessible
- MDX files are compiled by `@next/mdx` at BUILD time via webpack, not at runtime -- a new `.mdx` file written at runtime cannot be imported via `await import()` because it was never compiled

**Prevention -- the fundamental architecture decision:**
The content editor CANNOT write files to the Cloud Run filesystem and expect them to persist or be served. The workflow must be one of:

1. **RECOMMENDED: Git-commit workflow.** The editor composes MDX content, validates it, then commits the file to the GitHub repo via the GitHub API. This triggers a Cloud Build redeploy, and the new content is included in the next build. This matches how the site already works (MDX files compiled at build time).

2. **Alternative: Store content in Firestore/GCS, render with `next-mdx-remote` at runtime.** This requires abandoning `@next/mdx` for building blocks pages and switching to runtime MDX compilation. It is a larger architectural change but enables instant publishing without redeploy.

3. **Alternative: Local-only editor.** The editor works only in `npm run dev` mode for local authoring. Content is committed via normal git workflow. The editor is a DX tool, not a production CMS.

**Detection:** Write content via the editor, wait for a new deploy or scale event, check if the content still exists. If it is gone, this pitfall was not addressed.

**Phase:** Must be the FIRST architecture decision. Every other content editor decision flows from this.

**Confidence:** HIGH -- verified by reading the Dockerfile (standalone output, no source files copied to runner), `next.config.ts` (build-time MDX compilation), and `[slug]/page.tsx` (`dynamicParams = false`).

---

### Pitfall 2: Invalid MDX Breaks the Entire Site Build

**What goes wrong:** The admin writes MDX content with a syntax error -- an unclosed JSX tag, a curly brace without a matching close, or an `import` statement with a typo. If the content editor commits this to the repo (per the git-commit workflow), the next `npm run build` fails because `@next/mdx` compiles ALL `.mdx` files at build time. A single invalid MDX file prevents the entire site from deploying.

**Specific error patterns in MDX that cause build failures:**
- Unclosed JSX tags: `<div>content` without `</div>`
- Bare curly braces: `The price is {expensive}` (MDX interprets `{expensive}` as a JS expression)
- Invalid imports: `import Foo from './Foo'` where `Foo` does not exist
- HTML comments: `<!-- comment -->` (MDX does not support HTML comments, use `{/* comment */}`)
- Indented code blocks following JSX (indentation ambiguity)

**Why it happens:** MDX looks like Markdown but is actually a strict superset with JSX compilation semantics. Authors who know Markdown but not JSX will produce invalid MDX frequently.

**Consequences:**
- Cloud Build fails, no new version deploys
- ALL site content (not just the bad article) becomes un-deployable
- If the broken commit reaches `master`, the site cannot be updated until the MDX error is fixed
- The admin may not know the build broke until someone notices the deploy failed

**Prevention:**
- **Validate MDX before committing.** Use `@mdx-js/mdx` `compile()` in a server action to attempt compilation before the content is committed to git. If compilation fails, show the error to the admin and block the commit.
- **Form-guided editor reduces syntax errors.** If the editor uses structured form fields (title, description, tags, body) and assembles the MDX file from those fields, the metadata export is always valid. Only the body content can have MDX errors.
- **Live preview catches errors visually.** Use `@mdx-js/mdx` `evaluate()` for client-side preview. If the preview shows an error boundary instead of rendered content, the admin knows something is wrong before saving.
- **Branch-based commits.** Commit to a feature branch, not `master`. Trigger a preview build. Only merge to `master` after the build succeeds.

**Detection:** `npm run build` fails with `Error: [MDX compilation error]` referencing the new file.

**Phase:** Must be implemented alongside the editor -- validation is not optional.

**Confidence:** HIGH -- verified by [MDX troubleshooting docs](https://mdxjs.com/docs/troubleshooting-mdx/) and direct testing of `@next/mdx` build behavior.

---

### Pitfall 3: Path Traversal in Slug/Filename Generation

**What goes wrong:** The admin enters a slug like `../../lib/firebase` or `../../../etc/passwd`. If the server action naively constructs a file path with `path.join(CONTENT_DIR, slug + '.mdx')`, the resulting path escapes the content directory. In a git-commit workflow, a malicious slug could overwrite arbitrary files in the repository. In a filesystem-write workflow, it could overwrite application code.

**Why it happens:** The existing `[slug]/page.tsx` already uses `path.join(CONTENT_DIR, slug + '.mdx')` for reading (line 18). Developers copy this pattern for writing without adding path validation.

**Consequences:**
- Repository files overwritten via git commit (e.g., `package.json`, `next.config.ts`)
- Application code modified at runtime (in filesystem-write scenarios)
- Build broken by overwriting critical files

**Prevention:**
- **Sanitize the slug BEFORE any filesystem or git operation:**
  ```typescript
  function sanitizeSlug(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')  // Only allow alphanumeric and hyphens
      .replace(/-+/g, '-')           // Collapse multiple hyphens
      .replace(/^-|-$/g, '');        // Trim leading/trailing hyphens
  }
  ```
- **Validate the resolved path stays within the content directory:**
  ```typescript
  const resolved = path.resolve(CONTENT_DIR, sanitizedSlug + '.mdx');
  if (!resolved.startsWith(path.resolve(CONTENT_DIR))) {
    throw new Error('Invalid slug: path traversal detected');
  }
  ```
- **Use Zod schema validation** on the slug field with a regex pattern: `z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)`
- **Server-side validation is mandatory** -- do NOT rely on client-side slug sanitization alone

**Detection:** Test with slugs containing `../`, `/`, `\`, null bytes, and URL-encoded path separators.

**Phase:** Must be implemented in the server action that processes editor submissions.

**Confidence:** HIGH -- standard web security concern, verified by [Next.js security best practices](https://blog.arcjet.com/next-js-security-checklist/) and the existing code pattern in `[slug]/page.tsx`.

---

### Pitfall 4: Client-Side AdminGuard Does Not Protect Server Actions

**What goes wrong:** The existing `AdminGuard` component (in `src/components/admin/AdminGuard.tsx`) only checks auth on the client side by comparing `user.email` to `ADMIN_EMAIL`. Any server action that writes content or triggers jobs is callable by anyone who knows the API endpoint -- they just need to send a POST request directly, bypassing the React UI entirely.

**Existing code that demonstrates the vulnerability:**
```typescript
// AdminGuard.tsx -- client-side only
if (!user || user.email !== ADMIN_EMAIL) {
  router.replace("/");  // Redirects in browser, but server action is still callable
}
```

The control center layout wraps children in `AdminGuard`, but this only prevents rendering the UI -- it does not prevent direct HTTP requests to server actions or API routes.

**Consequences:**
- Anyone can call the content creation server action and commit arbitrary MDX to the repository
- Anyone can trigger brand scraper jobs
- Anyone can modify or delete content through direct API calls
- Client-side auth is trivially bypassed by sending requests via `curl`, Postman, or any HTTP client

**Prevention:**
- **Every server action must verify the Firebase ID token server-side** before performing any write operation:
  ```typescript
  import { getAuth } from 'firebase-admin/auth';

  async function verifyAdmin(request: Request): Promise<boolean> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return false;
    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await getAuth().verifyIdToken(token);
      return decoded.email === ADMIN_EMAIL;
    } catch {
      return false;
    }
  }
  ```
- **For Server Actions specifically:** Extract the ID token from cookies or headers and validate with Firebase Admin SDK
- The existing `firebase-admin` dependency already supports `verifyIdToken()` -- no new packages needed
- Consider adding Firebase custom claims (`admin: true`) instead of hardcoding email comparison

**Detection:** Use `curl` to call a server action endpoint without any auth headers. If it succeeds, server-side auth is missing.

**Phase:** Must be implemented for EVERY write-operation server action (content creation, content deletion, job triggering).

**Confidence:** HIGH -- verified by reading `AdminGuard.tsx` (client-side only) and `firebase.ts` (Admin SDK already available). This is a [well-documented security anti-pattern](https://nextjs.org/blog/security-nextjs-server-components-actions).

---

### Pitfall 5: Slug Collision with Existing Content

**What goes wrong:** The admin creates a new building block with slug `setting-up-a-repo`. This slug already exists as `src/content/building-blocks/setting-up-a-repo.mdx`. In a git-commit workflow, the commit overwrites the existing file, destroying the original content. In a filesystem-write workflow, `fs.writeFileSync` silently overwrites.

**Why it happens:** The editor does not check for existing content before writing. The admin may not remember what slugs are already in use, especially as the content library grows.

**Consequences:**
- Existing content permanently overwritten (in git workflow, recoverable from git history but disruptive)
- No warning to the admin
- If the overwritten content was significantly different, published links may lead to confusing content

**Prevention:**
- **Check for existing files before creating:**
  ```typescript
  const existingFiles = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.mdx') && !f.startsWith('_'));
  const existingSlugs = existingFiles.map(f => f.replace('.mdx', ''));
  if (existingSlugs.includes(sanitizedSlug)) {
    return { error: 'A building block with this slug already exists' };
  }
  ```
- **In the git-commit workflow:** Check the GitHub API for existing file at the path before creating
- **Show existing slugs in the editor UI** so the admin can see what is taken
- **Separate create vs. edit flows:** If editing existing content, load it first and use the update (not create) path

**Detection:** Try creating content with a slug that matches an existing article. If no warning appears, this pitfall exists.

**Phase:** Must be implemented in the server action alongside slug sanitization.

**Confidence:** HIGH -- the existing content directory has files that could be collided with.

---

## Moderate Pitfalls

Mistakes that cause broken features, poor UX, or technical debt.

### Pitfall 6: Live MDX Preview Requires Runtime Compilation (Bundle Size Impact)

**What goes wrong:** The content editor needs a live preview showing how the MDX will render. But the site currently uses `@next/mdx` which compiles MDX at build time via webpack. There is no runtime MDX compiler in the current bundle. Adding one (`@mdx-js/mdx` `evaluate()` or `next-mdx-remote`) pulls in the entire MDX compiler into the client bundle -- approximately 200-400KB gzipped depending on plugins.

**Why it happens:** Developers assume MDX preview "just works" because the site already renders MDX. But the existing rendering happens at build time, not runtime.

**Consequences:**
- Client bundle size increases significantly (matters for the entire site if not code-split properly)
- Preview may not match build output exactly (different remark/rehype plugin configurations)
- Preview crashes on invalid MDX with unhelpful error messages

**Prevention:**
- **Use `@mdx-js/mdx` `compile()` + `evaluate()` on the SERVER** via a server action, returning rendered HTML to the client for preview. This keeps the MDX compiler out of the client bundle entirely.
- **Code-split aggressively.** If runtime compilation must be client-side, use `next/dynamic` with `{ ssr: false }` to load the compiler only on the editor page, not site-wide.
- **Match plugin configuration exactly.** The preview server action must use the same `remarkPlugins` and `rehypePlugins` as `next.config.ts` (remark-gfm, rehype-slug, rehype-pretty-code with github-light theme). Mismatched plugins cause "looks different in preview vs. published" bugs.
- **Wrap preview rendering in an error boundary** to catch MDX compilation errors gracefully instead of crashing the editor.

**Detection:** Check the client bundle size before and after adding the editor. If it increased by more than 50KB, the MDX compiler leaked into the client bundle.

**Phase:** Implement alongside the editor form -- preview is a core editor feature.

**Confidence:** HIGH -- verified by reading `next.config.ts` plugin configuration and MDX documentation on [MDX on-demand compilation](https://mdxjs.com/guides/mdx-on-demand/).

---

### Pitfall 7: Brand Scraper Polling Interval Too Aggressive / Memory Leaks

**What goes wrong:** The brand scraper UI polls the Fastify API for job status. Common mistakes:
1. **Polling too fast** (every 500ms) creates unnecessary load on the API and may trigger rate limiting
2. **Not clearing intervals on unmount** causes memory leaks -- the polling continues after the user navigates away, accumulating stale closures
3. **Not stopping polling when job completes** wastes resources and can cause stale state bugs when a new job starts

**Specific React pattern that leaks:**
```typescript
// BAD: leaks if component unmounts
useEffect(() => {
  setInterval(() => fetchJobStatus(jobId), 1000);
}, [jobId]);

// BAD: stale closure - always polls with initial jobId
useEffect(() => {
  const id = setInterval(() => fetchJobStatus(jobId), 1000);
  return () => clearInterval(id);
}, []); // Missing jobId dependency
```

**Prevention:**
- **Use a proper polling hook with cleanup:**
  ```typescript
  function usePolling(jobId: string | null, enabled: boolean) {
    const [data, setData] = useState(null);

    useEffect(() => {
      if (!jobId || !enabled) return;

      let cancelled = false;
      const poll = async () => {
        try {
          const res = await fetch(`/api/brand-scraper/jobs/${jobId}`);
          const json = await res.json();
          if (!cancelled) {
            setData(json);
            if (json.status === 'completed' || json.status === 'failed') {
              return; // Stop polling
            }
          }
        } catch (err) {
          if (!cancelled) console.error(err);
        }
        if (!cancelled) {
          timeoutId = setTimeout(poll, 3000); // 3s interval
        }
      };

      let timeoutId = setTimeout(poll, 0);
      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
      };
    }, [jobId, enabled]);

    return data;
  }
  ```
- **Use `setTimeout` chains instead of `setInterval`** -- this prevents overlapping requests if one takes longer than the interval
- **3-5 second polling interval** is appropriate for scraper jobs that take 10-60 seconds
- **Exponential backoff** for very long jobs: start at 2s, increase to 5s after 30s, 10s after 60s

**Detection:** Navigate away from the scraper page while a job is running, then check the Network tab -- if requests continue, there is a leak. Also check the browser Memory profiler for growing heap.

**Phase:** Must be built correctly from the start -- retrofitting proper cleanup into broken polling code is error-prone.

**Confidence:** HIGH -- well-documented React pattern, verified by [React useEffect cleanup docs](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development).

---

### Pitfall 8: GCS Signed URL Expiration Breaks Image Display

**What goes wrong:** The brand scraper API returns GCS signed URLs for scraped logos and screenshots with a 1-hour TTL. If the admin views brand data, leaves the tab open for an hour, and then tries to download or interact with the images, all signed URLs have expired and return `403 Forbidden`. The images appear broken with no indication of why.

**Why it happens:** Signed URLs are designed for temporary access. The UI treats them as permanent image sources.

**Consequences:**
- Broken image placeholders after 1 hour
- Admin refreshes the page but gets the SAME expired URLs from cached API response
- No user-facing error message -- just broken images
- If the admin tries to share a brand report link, the images are broken for the recipient

**Prevention:**
- **Display a timestamp showing when URLs expire** so the admin knows to refresh
- **Auto-refresh signed URLs:** When the component detects an image load error, re-fetch the job data from the API to get fresh signed URLs
- **Cache job results with TTL in the UI:** Store the fetch timestamp and automatically refetch after 45 minutes (before the 1-hour expiration)
- **Consider proxying images through a Next.js API route** that fetches from GCS server-side (no signed URL needed if using service account credentials), but this adds load to the Next.js server
- **For sharing/persistence:** Download images to a permanent location when the admin explicitly "saves" a brand analysis

**Detection:** View brand data, wait 1+ hours, check if images still load.

**Phase:** Should be addressed in the brand scraper UI implementation, not deferred.

**Confidence:** HIGH -- GCS signed URL expiration is [documented behavior](https://cloud.google.com/storage/docs/access-control/signed-urls). The 1-hour TTL is specified in the project context.

---

### Pitfall 9: CORS When Loading GCS Signed URL Images in the Browser

**What goes wrong:** The brand scraper API returns signed URLs pointing to `storage.googleapis.com`. When the Next.js frontend tries to load these images in `<img>` tags, basic image loading works fine (no CORS for `<img src>`). BUT if the frontend uses `fetch()` to download images, draws them on a `<canvas>` for processing, or applies CSS `filter` operations that require pixel access, CORS will block the request because the GCS bucket does not have CORS configured for the Next.js domain.

**Why it happens:** `<img>` tags are exempt from CORS (they load cross-origin images natively). But any JavaScript-based image access requires CORS headers. Developers test with `<img>` tags, everything works, then add a "download" button using `fetch()` and it fails.

**Consequences:**
- Image display works but "Download" or "Copy" buttons fail with CORS errors
- Canvas-based image manipulation (color extraction, thumbnail generation) fails
- The error message in the console is confusing: the signed URL works in a new tab but fails in JavaScript

**Prevention:**
- **For display-only:** Use `<img>` or Next.js `<Image>` tags with signed URLs -- no CORS needed
- **For download:** Use a Next.js API route that fetches the image server-side and streams it to the client. The server-to-server request has no CORS.
- **If client-side access is needed:** Configure CORS on the GCS bucket:
  ```json
  [
    {
      "origin": ["https://your-site.run.app"],
      "method": ["GET"],
      "responseHeader": ["Content-Type"],
      "maxAgeSeconds": 3600
    }
  ]
  ```
  Apply with: `gsutil cors set cors.json gs://your-bucket`
- **For the `<Image>` component:** Add the GCS hostname to `images.remotePatterns` in `next.config.ts`

**Detection:** Images display fine but any JavaScript-based image operation (fetch, canvas, download) fails with CORS errors.

**Phase:** Should be addressed when implementing the brand data display cards.

**Confidence:** HIGH -- standard CORS behavior, verified by [GCS CORS documentation](https://cloud.google.com/storage/docs/cross-origin).

---

### Pitfall 10: Unsaved Editor Changes Lost on Navigation

**What goes wrong:** The admin spends 20 minutes writing a building block article in the editor. They accidentally click a navigation link, press the browser back button, or close the tab. All unsaved content is lost instantly with no warning.

**Why it happens:** Next.js App Router does not have built-in "unsaved changes" protection. The `beforeunload` event handles tab close/refresh, but client-side navigation via `<Link>` or `router.push()` does not trigger `beforeunload`.

**Consequences:**
- Complete loss of in-progress content (could be significant for long articles)
- Admin frustration and distrust of the editor
- May cause the admin to avoid the editor entirely and revert to manual file editing

**Prevention:**
- **Handle `beforeunload` for tab close/refresh:**
  ```typescript
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
  ```
- **Intercept client-side navigation:** Override `router.push` / `router.back` to check for unsaved changes. This is notoriously difficult in the App Router -- see the [community gist](https://gist.github.com/icewind/71d31b2984948271db33784bb0df8393) for a working approach.
- **Auto-save to localStorage** as a fallback: save editor state to `localStorage` every 30 seconds. On editor mount, check for recovered content and offer to restore it.
- **"Save Draft" functionality:** Allow saving incomplete content as a draft (either in localStorage or Firestore) before the full commit workflow.

**Detection:** Start editing, type content, then click a navigation link. If no warning appears and content is lost, this pitfall exists.

**Phase:** Should be implemented alongside the editor form for a minimum viable experience. Auto-save can be added in a later iteration.

**Confidence:** HIGH -- well-documented Next.js App Router limitation, verified by [community discussions](https://github.com/vercel/next.js/discussions/50700).

---

### Pitfall 11: Large BrandTaxonomy Response Overwhelms the UI

**What goes wrong:** The brand scraper returns a `BrandTaxonomy` object that can contain dozens of colors, multiple font families, many logo variations, and full-page screenshots. If rendered naively in a card gallery, the page becomes a wall of unsorted data that is hard to navigate and slow to render.

**Specific scale concerns:**
- A brand may have 20+ colors (primary, secondary, accent, background, text, gradient stops)
- Logo variations: SVG, PNG, favicon, Apple touch icon, Open Graph image -- each in multiple sizes
- Screenshots may be several MB each
- Typography data may include system font stacks with 10+ fallback fonts

**Why it happens:** Developers render the API response directly into UI components without data reduction or categorization.

**Consequences:**
- Slow page rendering (many large images loading simultaneously)
- Overwhelming UI that does not surface the most important brand elements
- Browser memory issues if many large screenshots are loaded at once

**Prevention:**
- **Categorize and summarize on the server** before rendering: group colors by role (primary, secondary, neutral), limit logo display to the 3-4 most important variants
- **Lazy-load images:** Use `loading="lazy"` on all brand images, or use Intersection Observer to load images only when they scroll into view
- **Paginate or collapse sections:** Show primary colors by default, put full palette behind an expandable section
- **Limit screenshot display:** Show thumbnail previews, load full screenshots on click
- **Set `sizes` and `quality` on Next.js `<Image>` components** to avoid loading full-resolution images

**Detection:** Load a brand with many colors and logos. If the page takes more than 2 seconds to become interactive, or if scrolling is janky, the response is too large for the current rendering approach.

**Phase:** Should be considered during brand card gallery design.

**Confidence:** MEDIUM -- depends on actual BrandTaxonomy response size, which varies by target site.

---

### Pitfall 12: Race Condition in Content File Writes (Git-Commit Workflow)

**What goes wrong:** The admin creates two articles in quick succession. Both trigger GitHub API commits to the same branch. If the second commit starts before the first completes, it may be based on a stale tree SHA, causing the GitHub API to reject it with a `409 Conflict` or silently overwrite the first commit.

**Why it happens:** The GitHub Contents API `PUT /repos/{owner}/{repo}/contents/{path}` requires the current file's SHA for updates, but for new file creation it does not. However, if two commits happen near-simultaneously, the branch HEAD moves between the first commit and the second commit's push, potentially causing a conflict.

**Consequences:**
- Second article creation fails with an opaque error
- Or worse: second commit force-pushes and loses the first article
- Admin sees success for both but only one article actually exists

**Prevention:**
- **Serialize git operations:** Use a queue (even a simple in-memory lock) to ensure only one git operation happens at a time
- **Use the GitHub API's `sha` parameter** for all operations and handle 409 Conflict responses with a retry
- **Show a "publishing" state** that prevents the admin from creating another article while one is in progress
- **For the MVP:** This is unlikely to be a real problem since there is only one admin user. Add the serialization lock if it becomes an issue.

**Detection:** Rapidly create two articles in succession. If one fails or is lost, this race condition exists.

**Phase:** Can be deferred past MVP since single-admin usage makes this rare.

**Confidence:** MEDIUM -- depends on GitHub API behavior with concurrent commits, which is well-documented but the exact conflict resolution depends on timing.

---

### Pitfall 13: MDX Preview Does Not Match Published Output

**What goes wrong:** The live preview in the editor renders MDX with a basic configuration, but the published site uses specific remark/rehype plugins (remark-gfm, rehype-slug, rehype-pretty-code with github-light theme). The preview shows raw code blocks, missing GFM tables, or unstyled headings, while the published version looks correct. Or vice versa -- preview looks great but the published version is different.

**Why it happens:** The preview compilation uses different (or no) plugins compared to the build-time compilation in `next.config.ts`.

**Specific plugin mismatches to watch for:**
- `remark-gfm`: Without it, tables, strikethrough, and task lists do not render in preview
- `rehype-pretty-code`: Without it, code blocks show as plain `<pre>` instead of syntax-highlighted
- `rehype-slug`: Without it, headings do not get anchor IDs in preview
- Prose styling: Preview may not have `@tailwindcss/typography` prose classes applied

**Prevention:**
- **Extract plugin configuration to a shared constant** used by both `next.config.ts` and the preview server action:
  ```typescript
  // src/lib/mdx-config.ts
  export const remarkPlugins = ['remark-gfm'];
  export const rehypePlugins = [
    'rehype-slug',
    ['rehype-pretty-code', { theme: 'github-light' }],
  ];
  ```
- **Wrap preview output in the same prose classes** used by the building blocks page: `prose prose-neutral max-w-none`
- **Test preview parity** by comparing the preview of an existing article against its published version

**Detection:** Preview an existing article in the editor and compare side-by-side with the published page. Any visual differences indicate a plugin mismatch.

**Phase:** Must be addressed when building the preview feature.

**Confidence:** HIGH -- verified by reading the specific plugin configuration in `next.config.ts` lines 34-42.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 14: Build Size Increase from Editor Libraries

**What goes wrong:** Adding a rich MDX editor component (like MDXEditor at 851KB gzipped) to the admin pages bloats the client bundle for ALL pages if not properly code-split. Even visitors who never access `/control-center` download editor code.

**Prevention:**
- **Use `next/dynamic` with `ssr: false`** for editor components -- they are admin-only and do not need SSR
- **Keep the editor on a dedicated route** (`/control-center/content/new`) that is code-split from the rest of the site
- **Prefer lighter alternatives:** A plain `<textarea>` with a server-side preview action is much smaller than a rich editor component. For a single-admin personal site, a textarea may be sufficient.
- **Monitor bundle size:** Run `npm run build` and check `.next/analyze` (if configured) or the build output for page sizes

**Detection:** Check the build output for page sizes. If the homepage or other public pages increased in size, editor code leaked into shared chunks.

**Phase:** Design decision during editor implementation.

**Confidence:** HIGH -- standard Next.js code-splitting concern.

---

### Pitfall 15: Brand Scraper Job Errors Show Raw API Responses

**What goes wrong:** The Fastify brand scraper API returns error responses with internal details (stack traces, internal URLs, database errors). If the frontend renders these directly, the admin sees confusing technical error messages instead of actionable descriptions.

**Prevention:**
- **Map API error codes to user-friendly messages** in the frontend:
  ```typescript
  const ERROR_MESSAGES: Record<string, string> = {
    'INVALID_URL': 'The URL you entered is not valid.',
    'SCRAPE_TIMEOUT': 'The website took too long to respond. Try again later.',
    'RATE_LIMITED': 'Too many requests. Please wait a moment.',
    'UNKNOWN': 'Something went wrong. Please try again.',
  };
  ```
- **Never render raw error response bodies** in the UI
- **Log the full error to the console** for debugging, show the friendly message to the user

**Detection:** Trigger a scraper job with an invalid URL or unreachable domain. If the error message contains technical details (stack traces, internal paths), this pitfall exists.

**Phase:** Implement during brand scraper UI error handling.

**Confidence:** MEDIUM -- depends on the Fastify API's actual error response format.

---

### Pitfall 16: Control Center Tab/Route State Lost on Refresh

**What goes wrong:** The control center currently has a flat structure (repos and todoist lists on one page). Adding content editor and brand scraper creates a need for tabs or sub-routes. If implemented as client-side tabs (e.g., React state), refreshing the page always returns to the first tab. The URL does not reflect which section the admin is viewing.

**Prevention:**
- **Use Next.js routes instead of client-side tabs:** `/control-center/content`, `/control-center/brands`, `/control-center/repos`. Each section is a proper route with its own URL.
- **If using tabs within a section:** Sync the active tab to a URL search parameter (`?tab=drafts`) so it survives refresh
- The existing control center already uses routes for sub-pages (`/control-center/todoist/[projectId]`), so this pattern is established

**Detection:** Navigate to a specific control center section, refresh the page. If you are returned to the default view instead of the section you were on, route state is not persisted.

**Phase:** Architecture decision when adding new control center sections.

**Confidence:** HIGH -- follows from the existing routing pattern in the codebase.

---

### Pitfall 17: Mobile Responsiveness for Admin Tools

**What goes wrong:** Admin tools (content editor with live preview, brand data card gallery) are designed for desktop but accessed on mobile. A side-by-side editor+preview layout is unusable on a phone screen. Color swatches and font previews are too small to be useful on mobile.

**Prevention:**
- **Stack editor and preview vertically on mobile** (editor above, preview below with a toggle)
- **Do not block mobile access entirely** -- the admin may want to review content or check brand data on the go
- **But do not prioritize mobile editor experience** for MVP -- writing long-form MDX on a phone is not a realistic workflow
- **Brand cards should be responsive** -- they are read-only and should work well at any screen size

**Detection:** View the control center on a phone-width viewport (375px). If content overflows or controls are unreachable, responsive design is missing.

**Phase:** Can be addressed incrementally -- start with desktop, add responsive breakpoints.

**Confidence:** HIGH -- standard responsive design concern.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| Architecture decision: how content is persisted | Pitfall 1 (ephemeral filesystem) | Choose git-commit or CMS workflow FIRST | CRITICAL |
| Content editor server action | Pitfall 3 (path traversal), Pitfall 5 (slug collision) | Sanitize slug, check for existing files | CRITICAL |
| Content editor server action | Pitfall 4 (auth bypass) | Verify Firebase ID token server-side | CRITICAL |
| MDX validation | Pitfall 2 (invalid MDX breaks build) | Compile before committing, use error boundary | CRITICAL |
| Live preview | Pitfall 6 (bundle size), Pitfall 13 (plugin mismatch) | Server-side compilation, shared plugin config | MODERATE |
| Brand scraper polling | Pitfall 7 (memory leaks) | setTimeout chains with cleanup, not setInterval | MODERATE |
| Brand data display | Pitfall 8 (expired URLs), Pitfall 9 (CORS) | Auto-refresh URLs, configure GCS CORS or proxy | MODERATE |
| Brand data display | Pitfall 11 (large responses) | Categorize data, lazy-load images | MODERATE |
| Editor UX | Pitfall 10 (unsaved changes) | beforeunload + localStorage auto-save | MODERATE |
| Control center navigation | Pitfall 16 (route state) | Use Next.js routes, not client-side tabs | MINOR |
| Bundle optimization | Pitfall 14 (editor bundle size) | Dynamic imports, code-split editor | MINOR |
| Error handling | Pitfall 15 (raw errors) | Map API errors to user-friendly messages | MINOR |

---

## Decision Matrix: Content Persistence Architecture

This is the most consequential architectural decision for the content editor. Every other editor decision cascades from it.

| Approach | Pros | Cons | Recommended? |
|----------|------|------|-------------|
| **Git-commit via GitHub API** | Matches existing workflow; content is version-controlled; triggers rebuild automatically; no new infrastructure | Requires rebuild to publish (minutes, not seconds); admin must wait for deploy; needs MDX validation before commit | **YES -- best fit for this project** |
| **Firestore/GCS + runtime MDX** | Instant publishing; no rebuild needed; content editable without git | Requires abandoning @next/mdx for runtime compilation; significant architecture change; must replicate all remark/rehype plugins at runtime; content not in git | NO -- too much rearchitecting |
| **Local-only editor (dev mode)** | Simplest; no security concerns; normal git workflow | Only works locally; cannot edit from any device; not a "control center" feature | MAYBE -- as a v0 stepping stone |
| **Headless CMS (Contentful, Sanity)** | Built-in editor, preview, publishing workflow; scales well | External dependency; monthly cost; overkill for single-admin personal site; must migrate existing MDX files | NO -- overengineered for use case |

**Recommendation:** Git-commit via GitHub API. The site already uses build-time MDX compilation with `@next/mdx`. The editor is a nicer interface for the same workflow: write MDX, commit to repo, deploy. The admin accepts a 2-3 minute delay between "save" and "published" because this is a personal site, not a breaking-news platform.

---

## Sources

- [MDX Troubleshooting](https://mdxjs.com/docs/troubleshooting-mdx/) -- HIGH confidence (official MDX docs)
- [MDX On-Demand Compilation](https://mdxjs.com/guides/mdx-on-demand/) -- HIGH confidence (official MDX docs)
- [Next.js Security: Server Components and Actions](https://nextjs.org/blog/security-nextjs-server-components-actions) -- HIGH confidence (official Next.js blog)
- [Next.js Security Checklist](https://blog.arcjet.com/next-js-security-checklist/) -- MEDIUM confidence (third-party but well-researched)
- [Cloud Run Ephemeral Filesystem](https://docs.google.com/run/docs/configuring/services/in-memory-volume-mounts) -- HIGH confidence (official GCP docs)
- [Cloud Run Volume Mounts with Cloud Storage](https://medium.com/google-cloud/step-by-step-guide-to-cloud-run-volume-mounts-with-cloud-storage-137937e15765) -- MEDIUM confidence (community guide)
- [GCS Signed URLs](https://cloud.google.com/storage/docs/access-control/signed-urls) -- HIGH confidence (official GCP docs)
- [GCS CORS Configuration](https://cloud.google.com/storage/docs/cross-origin) -- HIGH confidence (official GCP docs)
- [Next.js App Router Unsaved Changes](https://github.com/vercel/next.js/discussions/50700) -- MEDIUM confidence (community discussion)
- [React useEffect Cleanup](https://react.dev/learn/synchronizing-with-effects) -- HIGH confidence (official React docs)
- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) -- HIGH confidence (official Next.js docs)
- [Firebase Admin Auth](https://firebase.google.com/docs/auth/admin/) -- HIGH confidence (official Firebase docs)
- Codebase analysis: `Dockerfile`, `next.config.ts`, `[slug]/page.tsx`, `tutorials.ts`, `AdminGuard.tsx`, `firebase.ts`, `AuthContext.tsx`, control center pages -- HIGH confidence (direct file reads)
