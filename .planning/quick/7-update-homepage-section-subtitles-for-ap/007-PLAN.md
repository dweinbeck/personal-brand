---
phase: quick-007
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/home/AppsGrid.tsx
  - src/components/home/ToolsShowcase.tsx
  - src/components/home/FeaturedBuildingBlocks.tsx
autonomous: true
must_haves:
  truths:
    - "Apps section subtitle reads 'Web-based Tools for Planning and Efficiency'"
    - "Tools section subtitle reads 'Single-function AI Development Utilities'"
    - "Building Blocks section title reads 'Want to Learn About AI Development?'"
    - "Building Blocks section has a subtitle reading 'Start with These Building Blocks'"
  artifacts:
    - path: "src/components/home/AppsGrid.tsx"
      provides: "Updated Apps section subtitle"
      contains: "Web-based Tools for Planning and Efficiency"
    - path: "src/components/home/ToolsShowcase.tsx"
      provides: "Updated Tools section subtitle"
      contains: "Single-function AI Development Utilities"
    - path: "src/components/home/FeaturedBuildingBlocks.tsx"
      provides: "Updated Building Blocks title and new subtitle"
      contains: "Want to Learn About AI Development?"
  key_links: []
---

<objective>
Update the homepage section subtitles for Apps, Tools, and Building Blocks to use improved, more descriptive copy.

Purpose: Better communicate the purpose of each section to visitors.
Output: Three updated component files with new subtitle text.
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/home/AppsGrid.tsx
@src/components/home/ToolsShowcase.tsx
@src/components/home/FeaturedBuildingBlocks.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update section subtitles across all three homepage components</name>
  <files>
    src/components/home/AppsGrid.tsx
    src/components/home/ToolsShowcase.tsx
    src/components/home/FeaturedBuildingBlocks.tsx
  </files>
  <action>
    Make these three text changes:

    1. **AppsGrid.tsx** (line 13): Change the `<p>` subtitle text from "Web-based tools built for real-world use" to "Web-based Tools for Planning and Efficiency"

    2. **ToolsShowcase.tsx** (line 17): Change the `<p>` subtitle text from "Single-function dev utilities and AI-powered tools" to "Single-function AI Development Utilities"

    3. **FeaturedBuildingBlocks.tsx** (lines 10-12):
       - Change the `<h2>` text from "Building Blocks" to "Want to Learn About AI Development?"
       - Change the `mb-10` class on the `<h2>` to just leave normal spacing (no large bottom margin since a subtitle paragraph will follow)
       - Add a new `<p>` tag directly after the `<h2>`, following the same pattern used in AppsGrid and ToolsShowcase:
         ```
         <p className="text-text-secondary text-center mt-2 mb-10">
           Start with These Building Blocks
         </p>
         ```
       - This ensures the `mb-10` spacing before the grid is preserved via the new `<p>` tag.
  </action>
  <verify>
    Run `npm run lint && npm run build` to confirm no syntax or type errors.
    Then run `npm run dev` and visually confirm the homepage shows the updated text for all three sections.
  </verify>
  <done>
    All three homepage sections display their new subtitle copy:
    - Apps: "Web-based Tools for Planning and Efficiency"
    - Tools: "Single-function AI Development Utilities"
    - Building Blocks title: "Want to Learn About AI Development?" with subtitle: "Start with These Building Blocks"
  </done>
</task>

</tasks>

<verification>
- `npm run lint` passes with no errors
- `npm run build` succeeds
- Homepage renders all three sections with updated text
</verification>

<success_criteria>
All three section subtitles on the homepage are updated to the new copy. Build and lint pass cleanly.
</success_criteria>

<output>
After completion, create `.planning/quick/7-update-homepage-section-subtitles-for-ap/007-SUMMARY.md`
</output>
