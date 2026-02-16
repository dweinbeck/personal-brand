---
phase: quick-005
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/home/HeroSection.tsx
autonomous: true
must_haves:
  truths:
    - "Contact icons (GitHub, LinkedIn, Email) appear below the 'This site is designed to...' paragraph"
    - "Contact icons are centered horizontally on the page"
    - "Text content in the right column still aligns properly next to the headshot"
  artifacts:
    - path: "src/components/home/HeroSection.tsx"
      provides: "Hero section with repositioned contact icons"
      contains: "justify-center"
  key_links: []
---

<objective>
Move contact icons from inside the text content column to below both paragraphs, centered on the page.

Purpose: The contact icons are currently tucked inside the right-side text column. They should be a full-width centered element below all paragraph content, before the horizontal rule.
Output: Updated HeroSection.tsx with corrected layout.
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/home/HeroSection.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move contact icons below both paragraphs and center them</name>
  <files>src/components/home/HeroSection.tsx</files>
  <action>
In `src/components/home/HeroSection.tsx`, make these two changes:

1. **Remove the contact icons div from the text content column.** Cut the entire `<div className="mt-4 flex justify-center md:justify-start gap-4">` block (lines 75-126) — the div containing the GitHub, LinkedIn, and Email anchor/SVG elements. This div is currently the last child inside the `<div className="md:flex-1 text-center md:text-left">` text content wrapper.

2. **Paste the contact icons div after the second paragraph, before the `<hr>`.** Insert it between the "This site is designed to..." `<p>` tag (line 131-137) and the `<hr>` tag (line 138). Change the className from `"mt-4 flex justify-center md:justify-start gap-4"` to `"mt-6 flex justify-center gap-4"` so that:
   - `mt-6` provides consistent vertical spacing matching the paragraph above
   - `justify-center` centers the icons at all breakpoints (remove the `md:justify-start` responsive override — icons should always be centered)
   - `gap-4` keeps the existing spacing between icons

The resulting structure inside `<section>` should be:
```
<div> (background gradient)
<div flex-row> (hero flex: headshot + text column)
  <div> headshot </div>
  <div> text content (h1, taglines, job title, MBA, experience paragraph — NO icons) </div>
</div>
<p> "This site is designed to..." </p>
<div> contact icons (centered) </div>
<hr>
```

Do NOT change any other classes, content, or structure.
  </action>
  <verify>
1. Run `npm run lint` — no errors
2. Run `npm run build` — builds successfully
3. Browser verify: navigate to http://localhost:3000, confirm icons appear below both paragraphs and are centered
  </verify>
  <done>Contact icons render centered below the "This site is designed to..." paragraph and above the horizontal rule. No layout regressions on mobile or desktop viewports.</done>
</task>

</tasks>

<verification>
- `npm run lint` passes with zero errors
- `npm run build` succeeds
- Visual inspection: icons are centered below all text content, before the `<hr>`
- Visual inspection on mobile: icons remain centered (no left-align breakpoint)
</verification>

<success_criteria>
Contact icons (GitHub, LinkedIn, Email) are visually centered below all paragraph content and above the horizontal rule in HeroSection, at all viewport sizes.
</success_criteria>

<output>
After completion, create `.planning/quick/5-fix-herosection-layout-move-contact-icon/005-SUMMARY.md`
</output>
