---
phase: quick-9
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/tools/research-assistant/ResponseDisplay.tsx
  - src/components/tools/research-assistant/ReconsiderDisplay.tsx
autonomous: true

must_haves:
  truths:
    - "Research Assistant responses render with formatted HTML (headings, lists, code blocks, tables)"
    - "Dark theme styling is respected in rendered markdown"
    - "User can see formatted markdown in both initial responses and reconsider responses"
  artifacts:
    - path: "src/components/tools/research-assistant/ResponseDisplay.tsx"
      provides: "Markdown rendering for initial model responses"
      min_lines: 170
    - path: "src/components/tools/research-assistant/ReconsiderDisplay.tsx"
      provides: "Markdown rendering for reconsider responses"
      min_lines: 165
  key_links:
    - from: "src/components/tools/research-assistant/ResponseDisplay.tsx"
      to: "react-markdown"
      via: "Markdown component with remarkGfm"
      pattern: "<Markdown.*remarkGfm"
    - from: "src/components/tools/research-assistant/ReconsiderDisplay.tsx"
      to: "react-markdown"
      via: "Markdown component with remarkGfm"
      pattern: "<Markdown.*remarkGfm"
---

<objective>
Replace raw text rendering with formatted markdown in Research Assistant response displays.

Purpose: Improve readability by rendering AI-generated markdown (headings, lists, code blocks, tables) as formatted HTML instead of plain text
Output: Both ResponseDisplay and ReconsiderDisplay components render responses using react-markdown with Tailwind typography
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/dweinbeck/ai/personal-brand/.planning/PROJECT.md
@/Users/dweinbeck/ai/personal-brand/.planning/STATE.md
@/Users/dweinbeck/ai/personal-brand/src/components/tools/research-assistant/ResponseDisplay.tsx
@/Users/dweinbeck/ai/personal-brand/src/components/tools/research-assistant/ReconsiderDisplay.tsx
@/Users/dweinbeck/ai/personal-brand/src/components/admin/TutorialEditor.tsx
</context>

<tasks>

<task type="auto">
  <name>Replace raw text with markdown rendering in both response components</name>
  <files>
    src/components/tools/research-assistant/ResponseDisplay.tsx
    src/components/tools/research-assistant/ReconsiderDisplay.tsx
  </files>
  <action>
In both ResponseDisplay.tsx and ReconsiderDisplay.tsx:

1. Add imports at top:
   ```tsx
   import Markdown from "react-markdown";
   import remarkGfm from "remark-gfm";
   ```

2. Replace the whitespace-pre-wrap div (lines 107-109 in ResponseDisplay, lines 110-112 in ReconsiderDisplay) with markdown rendering:
   ```tsx
   <div className="prose prose-invert max-w-none text-sm">
     <Markdown remarkPlugins={[remarkGfm]}>{response.text}</Markdown>
   </div>
   ```

Key details:
- Use `prose prose-invert` for dark theme compatibility (site uses dark mode)
- Keep `max-w-none` to prevent prose from constraining width
- Add `text-sm` to match existing text sizing
- Follow TutorialEditor.tsx pattern (line 330-331) for remarkGfm usage
- Do NOT modify any other functionality (status badges, auto-scroll, copy button, token usage)

Why this approach:
- `prose-invert` provides proper dark theme colors for markdown elements
- `remarkGfm` enables GitHub Flavored Markdown (tables, strikethrough, task lists)
- `max-w-none` prevents prose's default 65ch max-width from breaking the panel layout
  </action>
  <verify>
    npm run lint && npm run build
  </verify>
  <done>
    - Both response components import react-markdown and remark-gfm
    - Response text rendered via Markdown component with prose prose-invert styling
    - Build succeeds with no TypeScript or lint errors
    - Markdown formatting (headings, lists, code blocks, tables) will render as formatted HTML
  </done>
</task>

</tasks>

<verification>
After implementation:
1. Quality gates pass: `npm run lint && npm run build`
2. Manual visual check: Visit /apps/research, submit a prompt with markdown (e.g., "List 3 benefits of TDD with code example"), verify responses show formatted HTML not raw markdown text
3. Dark theme check: Verify prose-invert styling makes text/headings/links readable in dark mode
</verification>

<success_criteria>
- Research Assistant responses render markdown as formatted HTML
- Headings, lists, code blocks, and tables display with proper styling
- Dark theme colors applied via prose-invert
- No regression in existing functionality (status badges, streaming, copy button, token usage)
- Build and lint pass with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/9-render-research-assistant-results-as-for/9-SUMMARY.md`
</output>
