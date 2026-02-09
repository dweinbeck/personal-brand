---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/projects/ReadmeRenderer.tsx
  - src/app/projects/[slug]/page.tsx
autonomous: true

must_haves:
  truths:
    - "Relative links in rendered README markdown resolve to GitHub blob URLs, not broken site-local paths"
    - "External (absolute) links in README markdown are unaffected and still work normally"
    - "Relative image src attributes in README markdown resolve to GitHub raw content URLs"
  artifacts:
    - path: "src/components/projects/ReadmeRenderer.tsx"
      provides: "Custom link and image component overrides for react-markdown"
      contains: "github.com"
    - path: "src/app/projects/[slug]/page.tsx"
      provides: "Passes repo owner/name to ReadmeRenderer"
      contains: "repoSlug"
  key_links:
    - from: "src/app/projects/[slug]/page.tsx"
      to: "src/components/projects/ReadmeRenderer.tsx"
      via: "repoSlug prop"
      pattern: "repoSlug.*project\\.repo"
---

<objective>
Fix broken relative links in README content rendered on project detail pages.

Purpose: When a GitHub README contains relative links (e.g., `docs/FRD.md`, `docs/TECHNICAL_DESIGN.md`), the ReadmeRenderer currently renders them as-is, causing them to resolve against the site URL (e.g., `/projects/personal-brand/docs/FRD.md`) instead of the GitHub repository. The personal-brand project README has three such broken links in its Documentation section.

Output: Updated ReadmeRenderer that rewrites relative URLs to absolute GitHub URLs, and updated project detail page that passes the repo identifier to the renderer.
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/projects/ReadmeRenderer.tsx
@src/app/projects/[slug]/page.tsx
@src/lib/github.ts
@src/types/project.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add relative URL rewriting to ReadmeRenderer</name>
  <files>src/components/projects/ReadmeRenderer.tsx, src/app/projects/[slug]/page.tsx</files>
  <action>
1. Update `ReadmeRendererProps` in `src/components/projects/ReadmeRenderer.tsx` to accept an optional `repoSlug` prop (string, format `"owner/repo"`).

2. Add a `components` prop to the `<Markdown>` element with custom `a` and `img` overrides:

   For `a` (links):
   - If `href` starts with `http://` or `https://` or `#`, render a normal `<a>` with `target="_blank"` and `rel="noopener noreferrer"` for external links (keep anchor links as-is).
   - If `href` is relative AND `repoSlug` is provided, rewrite to `https://github.com/${repoSlug}/blob/master/${href}` (strip leading `./` if present).
   - If `href` is relative but no `repoSlug`, render as-is (graceful fallback).

   For `img` (images):
   - If `src` is relative AND `repoSlug` is provided, rewrite to `https://raw.githubusercontent.com/${repoSlug}/master/${src}` (strip leading `./` if present).
   - Absolute `src` values pass through unchanged.

3. In `src/app/projects/[slug]/page.tsx`, update the `<ReadmeRenderer>` call (line ~224) to pass:
   ```tsx
   <ReadmeRenderer content={readme} repoSlug={project.repo ?? undefined} />
   ```

Important notes:
- Do NOT convert ReadmeRenderer to a client component. The `components` prop on `react-markdown` works fine in server components via the `Markdown` component from `react-markdown`.
- Use the default branch name `master` for GitHub URLs (this project uses master, as confirmed by git log).
- Keep existing Tailwind prose classes untouched.
- Handle edge cases: `href` could be `undefined` or empty string.
  </action>
  <verify>
Run `npm run build` to confirm no type errors or build failures. Manually verify by checking that the ReadmeRenderer component accepts the repoSlug prop and constructs correct GitHub URLs.
  </verify>
  <done>
- ReadmeRenderer rewrites relative `href` values to `https://github.com/{owner}/{repo}/blob/master/{path}`
- ReadmeRenderer rewrites relative `src` values on images to `https://raw.githubusercontent.com/{owner}/{repo}/master/{path}`
- External/absolute links remain unchanged
- Anchor links (`#section`) remain unchanged
- Project detail page passes `project.repo` to ReadmeRenderer
- `npm run build` passes cleanly
  </done>
</task>

</tasks>

<verification>
1. `npm run build` passes with no errors
2. `npm run lint` passes with no errors
3. Review the rendered output conceptually: the personal-brand README links to `docs/FRD.md`, `docs/TECHNICAL_DESIGN.md`, and `docs/DEPLOYMENT.md` — these should now resolve to `https://github.com/dweinbeck/personal-brand/blob/master/docs/FRD.md` etc.
</verification>

<success_criteria>
- All relative links in README content rendered on `/projects/[slug]` pages point to the correct GitHub blob URLs
- All relative image sources point to the correct GitHub raw content URLs
- External links and anchor links are not modified
- Build and lint pass cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/002-fix-broken-documentation-links-on-projec/002-SUMMARY.md`
</output>
