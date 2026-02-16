---
phase: quick-006
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/data/apps.ts
  - src/data/tools.ts
autonomous: false

must_haves:
  truths:
    - "Envelopes appears in apps grid with title 'Envelopes' (not 'Digital Envelopes')"
    - "Research appears in apps grid with title 'Research' (not 'Research Assistant')"
    - "Envelopes does not appear in tools showcase"
    - "Research does not appear in tools showcase"
    - "Apps listing page shows 4 apps (was 2)"
    - "Tools listing page shows 3 tools (was 5)"
  artifacts:
    - path: "src/data/apps.ts"
      provides: "Apps data with Envelopes and Research entries"
      exports: ["getApps"]
      min_lines: 50
    - path: "src/data/tools.ts"
      provides: "Tools data without Envelopes and Research entries"
      exports: ["getTools"]
      min_lines: 40
  key_links:
    - from: "src/components/home/AppsGrid.tsx"
      to: "getApps()"
      via: "data import"
      pattern: "import.*getApps.*from.*data/apps"
    - from: "src/components/home/ToolsShowcase.tsx"
      to: "getTools()"
      via: "data import"
      pattern: "import.*getTools.*from.*data/tools"
---

<objective>
Move Envelopes and Research from tools section to apps section with updated names.

Purpose: Correctly categorize Envelopes and Research as full applications (not tools), and update their display names to be concise ("Envelopes" instead of "Digital Envelopes", "Research" instead of "Research Assistant").

Output: Updated apps.ts and tools.ts data files with correct categorization and naming.
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@src/data/apps.ts
@src/data/tools.ts
</context>

<tasks>

<task type="auto">
  <name>Move Envelopes and Research to apps.ts with updated names and tech stacks</name>
  <files>
    src/data/apps.ts
    src/data/tools.ts
  </files>
  <action>
Update src/data/apps.ts:
- Add "Envelopes" app entry with:
  - slug: "envelopes"
  - title: "Envelopes" (NOT "Digital Envelopes")
  - tag: "Finance"
  - subtitle: "Zero-based budgeting with digital envelopes"
  - description: "Manage your monthly budget using the envelope budgeting method. Allocate income to categories and track spending in real time."
  - href: "/envelopes"
  - techStack: ["Next.js", "Firebase", "Tailwind CSS"]

- Add "Research" app entry with:
  - slug: "research"
  - title: "Research" (NOT "Research Assistant")
  - tag: "AI"
  - subtitle: "Compare AI models side-by-side in real time"
  - description: "Send a prompt to two AI models simultaneously and see their responses stream side-by-side. Choose between Standard and Expert tiers for different model combinations."
  - href: "/tools/research-assistant" (keep existing route path)
  - techStack: ["Next.js", "Vercel AI SDK", "Streaming"]

Update src/data/tools.ts:
- Remove "digital-envelopes" entry (slug: "digital-envelopes")
- Remove "research-assistant" entry (slug: "research-assistant")
- Keep only the 3 external tools (new-phase-planner, frd-interviewer, frd-generator)

Note: The href paths stay as-is (internal routes not being moved). The billing labels in src/lib/billing/tools.ts are internal and unaffected by this display categorization change.
  </action>
  <verify>
- Run: `npm run lint` (should pass with no errors)
- Run: `npm run build` (should pass with no errors)
- Grep check: `grep -n "Envelopes" src/data/apps.ts` (should show "Envelopes" NOT "Digital Envelopes")
- Grep check: `grep -n "Research" src/data/apps.ts` (should show "Research" NOT "Research Assistant")
- Count check: `grep -c "slug:" src/data/apps.ts` (should be 4 — was 2)
- Count check: `grep -c "slug:" src/data/tools.ts` (should be 3 — was 5)
  </verify>
  <done>
- apps.ts contains 4 entries: Brands, Tasks, Envelopes, Research
- tools.ts contains 3 entries: New Phase Planner, FRD Interviewer, FRD Generator
- All entries have correct titles ("Envelopes" and "Research" not verbose versions)
- Both new app entries include techStack arrays
- Build and lint pass
  </done>
</task>

<task name="Verify apps categorization visually" type="checkpoint:human-verify" gate="blocking">
  <what-built>Moved Envelopes and Research from tools to apps section with updated names</what-built>
  <how-to-verify>
1. Start dev server: `npm run dev`
2. Visit http://localhost:3000
3. Scroll to "Apps I've Built" section:
   - Should show 4 apps: Brands, Tasks, Envelopes, Research
   - Envelopes should say "Envelopes" (not "Digital Envelopes")
   - Research should say "Research" (not "Research Assistant")
   - Both should show tech stack tags below the description
4. Scroll to "Tools for Builders" section:
   - Should show 3 tools (all external GPTs)
   - Should NOT show Envelopes or Research
5. Visit http://localhost:3000/apps
   - Should list 4 apps with correct names
6. Visit http://localhost:3000/tools
   - Should list 3 tools (no Envelopes or Research)
7. Click "Envelopes" card — should navigate to /envelopes (working app)
8. Click "Research" card — should navigate to /tools/research-assistant (working app)
  </how-to-verify>
  <resume-signal>Type "approved" if categorization and naming look correct, or describe any issues</resume-signal>
</task>

</tasks>

<verification>
- Apps grid shows 4 apps with correct titles
- Tools showcase shows 3 tools (all external GPTs)
- Envelopes and Research are in apps, not tools
- Names are concise ("Envelopes" and "Research" not verbose versions)
- Tech stack tags visible on both new app cards
- All links navigate correctly
</verification>

<success_criteria>
- apps.ts exports 4 apps including Envelopes and Research
- tools.ts exports 3 tools (external GPTs only)
- Display names are "Envelopes" and "Research" (not verbose versions)
- Both new apps include techStack arrays
- Home page renders correctly with updated categorization
- Build, lint, and tests pass
- User confirms visual layout is correct
</success_criteria>

<output>
After completion, create `.planning/quick/6-move-envelopes-and-research-to-apps-sect/6-SUMMARY.md`
</output>
