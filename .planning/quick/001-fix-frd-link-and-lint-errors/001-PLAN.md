---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - src/content/building-blocks/_custom-gpt-fast.mdx
  - src/app/globals.css
  - src/app/control-center/layout.tsx
  - src/app/control-center/page.tsx
  - src/app/control-center/todoist/[projectId]/page.tsx
  - src/app/error.tsx
  - src/app/layout.tsx
  - src/app/not-found.tsx
  - src/app/opengraph-image.tsx
  - src/app/projects/[slug]/page.tsx
  - src/app/projects/page.tsx
  - src/app/sitemap.ts
  - src/components/admin/RepoCard.tsx
  - src/components/admin/TodoistBoard.tsx
  - src/components/admin/TodoistProjectCard.tsx
  - src/components/assistant/ChatInput.tsx
  - src/components/assistant/ChatInterface.tsx
  - src/components/assistant/ChatMessage.tsx
  - src/components/assistant/ConfidenceBadge.tsx
  - src/components/assistant/FeedbackButtons.tsx
  - src/components/assistant/MarkdownRenderer.tsx
  - src/components/assistant/TypingIndicator.tsx
  - src/components/building-blocks/TutorialCard.tsx
  - src/components/contact/ContactForm.tsx
  - src/components/contact/CopyEmailButton.tsx
  - src/components/home/FeaturedProjects.tsx
  - src/components/home/HeroSection.tsx
  - src/components/layout/AuthButton.tsx
  - src/components/layout/Navbar.tsx
  - src/components/projects/DetailedProjectCard.tsx
  - src/components/ui/Button.tsx
  - src/components/ui/Card.tsx
  - src/context/AuthContext.tsx
  - src/lib/firebase.ts
  - src/lib/github.ts
  - src/lib/schemas/assistant.ts
  - src/lib/todoist.ts
  - src/lib/tutorials.ts
  - next.config.ts
autonomous: true

must_haves:
  truths:
    - "FRD Interviewer link in _custom-gpt-fast.mdx renders as a clickable markdown link"
    - "npx biome check reports 0 errors"
    - "npm run build succeeds with no errors"
    - "npm run lint passes clean"
  artifacts:
    - path: "src/content/building-blocks/_custom-gpt-fast.mdx"
      provides: "Proper markdown link for FRD Interviewer"
      contains: "[FRD Interviewer](https://chatgpt.com/g/g-6987d85cd11081918ff321e9dc927966-frd-interviewer)"
  key_links: []
---

<objective>
Fix FRD Interviewer link formatting in _custom-gpt-fast.mdx and resolve all 58 Biome lint errors across the codebase.

Purpose: Clean up lint debt and fix a broken content link before Phase 16 deployment.
Output: Zero Biome errors, proper FRD Interviewer link, all quality gates passing.
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/content/building-blocks/_custom-gpt-fast.mdx
@biome.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix FRD link and run Biome auto-fix</name>
  <files>
    src/content/building-blocks/_custom-gpt-fast.mdx
    (plus ~35 files auto-formatted by Biome)
  </files>
  <action>
    1. Fix the FRD Interviewer link in `src/content/building-blocks/_custom-gpt-fast.mdx`:
       - Replace line 3 `(link text: FRD Interviewer) https://chatgpt.com/g/g-6987d85cd11081918ff321e9dc927966-frd-interviewer`
       - With: `[FRD Interviewer](https://chatgpt.com/g/g-6987d85cd11081918ff321e9dc927966-frd-interviewer)`

    2. Run `npx biome check --write` to auto-fix ~45 of the 58 errors:
       - Formatting issues (hex colors lowercase, line wrapping, CSS formatting, function param formatting)
       - Import ordering (organizeImports) across ~15 files
       - `noNonNullAssertion` in ContactForm.tsx (auto-fixable)
       - `useOptionalChain` in tutorials.ts (auto-fixable)
       - `noRedundantRoles` in ContactForm.tsx (auto-fixable)
       - `useExhaustiveDependencies` in ChatInput.tsx and ChatInterface.tsx (auto-fixable — removes unnecessary deps)

    3. Verify remaining errors with `npx biome check --max-diagnostics=100` to see what needs manual fixing.
  </action>
  <verify>Run `npx biome check --max-diagnostics=100` and confirm the remaining count is only the non-auto-fixable errors (expected: ~7-8 remaining).</verify>
  <done>FRD link is a proper markdown link. Auto-fixable lint errors are resolved.</done>
</task>

<task type="auto">
  <name>Task 2: Manually fix remaining non-auto-fixable lint errors</name>
  <files>
    src/app/error.tsx
    src/app/projects/[slug]/page.tsx
    src/components/assistant/MarkdownRenderer.tsx
    src/components/assistant/TypingIndicator.tsx
    src/components/contact/ContactForm.tsx
    src/components/home/HeroSection.tsx
  </files>
  <action>
    Fix each remaining error manually:

    1. **src/app/error.tsx** — `noShadowRestrictedNames` (line 12):
       The component parameter `error` shadows the global `Error`. Rename the prop destructured parameter from `error` to `errorInfo` or similar. Update all references within the component (the `useEffect` dependency, `error.message`, `error.digest`, `error.stack`). The type annotation `Error & { digest?: string }` stays since that refers to the global type.

    2. **src/app/projects/[slug]/page.tsx** — `noSvgWithoutTitle` (lines 86, 178, 196):
       Three SVG elements need accessible titles. These are decorative SVGs (back arrow, GitHub icon, external link icon) that already have text content next to them or are inside buttons with text. Add `aria-hidden="true"` to each SVG element and add `role="img"` where missing. Specifically:
       - Line 86: back arrow SVG — add `aria-hidden="true"` (the "Back to Projects" text provides context)
       - Line 178: GitHub icon SVG — add `aria-hidden="true"` (the "View on GitHub" button text provides context)
       - Line 196: external link SVG — add `aria-hidden="true"` (the "Visit Website" button text provides context)

    3. **src/components/assistant/MarkdownRenderer.tsx** — `noAssignInExpressions` (line ~94 after formatting):
       The `while ((match = regex.exec(text)) !== null)` pattern uses assignment in expression. Refactor to:
       ```typescript
       let match = regex.exec(text);
       while (match !== null) {
         // ... existing loop body ...
         match = regex.exec(text);
       }
       ```

    4. **src/components/assistant/TypingIndicator.tsx** — `useSemanticElements` (line ~5):
       The `<div role="status">` should use `<output>` element instead. Change the outer `<div>` to `<output>` and remove the `role="status"` attribute (it is implied by `<output>`).

    5. **src/components/contact/ContactForm.tsx** — `useSemanticElements` (line ~111):
       The `<output role="status">` has a redundant `role` attribute. Remove `role="status"` from the `<output>` element since `<output>` implicitly has role="status".

    6. **src/components/home/HeroSection.tsx** — `useAnchorContent` (lines 79, 95, 111):
       Three anchor elements with SVG icons have `aria-label` but Biome still flags them. These anchors already have `aria-label` attributes ("GitHub", "LinkedIn", "Email"). The SVGs inside already have `aria-hidden="true"`. Add a visually-hidden `<span className="sr-only">` inside each anchor with the label text (e.g., "GitHub", "LinkedIn", "Email") to satisfy the rule. The `aria-label` can remain for belt-and-suspenders accessibility.
  </action>
  <verify>
    Run `npx biome check` — must report 0 errors.
    Run `npm run build` — must succeed.
    Run `npm run lint` — must pass clean.
  </verify>
  <done>All 58 Biome lint errors resolved. Zero errors reported by `npx biome check`. Build and lint pass.</done>
</task>

</tasks>

<verification>
1. `npx biome check` reports 0 errors, 0 warnings (or only pre-existing warnings)
2. `npm run lint` passes clean
3. `npm run build` succeeds
4. `src/content/building-blocks/_custom-gpt-fast.mdx` line 3 contains `[FRD Interviewer](https://chatgpt.com/g/g-6987d85cd11081918ff321e9dc927966-frd-interviewer)`
</verification>

<success_criteria>
- FRD Interviewer link is a proper clickable markdown link
- Biome reports 0 errors across all 92 checked files
- Build succeeds, lint passes, no regressions
</success_criteria>

<output>
After completion, create `.planning/quick/001-fix-frd-link-and-lint-errors/001-SUMMARY.md`
</output>
