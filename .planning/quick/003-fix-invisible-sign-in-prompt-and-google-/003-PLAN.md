---
phase: quick-003
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/auth/AuthGuard.tsx
  - src/app/envelopes/layout.tsx
autonomous: true
must_haves:
  truths:
    - "Unauthenticated user visiting /envelopes sees 'Sign in to access this page.' text and 'Sign in with Google' button"
    - "Sign-in prompt text and button are visually readable (not white-on-white, not zero opacity, not hidden)"
    - "Clicking 'Sign in with Google' opens the Google auth popup"
    - "Other AuthGuard usages (/apps/tasks, /billing, /tools/research-assistant, /apps/brand-scraper) still work correctly"
  artifacts:
    - path: "src/components/auth/AuthGuard.tsx"
      provides: "Visible sign-in prompt for unauthenticated users"
    - path: "src/app/envelopes/layout.tsx"
      provides: "Envelopes layout with working auth gate"
  key_links:
    - from: "src/app/envelopes/layout.tsx"
      to: "src/components/auth/AuthGuard.tsx"
      via: "AuthGuard wrapping layout children"
      pattern: "<AuthGuard>"
---

<objective>
Fix the invisible sign-in prompt and "Sign in with Google" button on the /envelopes page.

Purpose: Unauthenticated users see blank white space instead of the sign-in UI, making /envelopes completely inaccessible. The DOM elements exist but render as invisible.
Output: Visible, functional sign-in prompt on /envelopes for unauthenticated users.
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/auth/AuthGuard.tsx
@src/app/envelopes/layout.tsx
@src/app/envelopes/page.tsx
@src/app/layout.tsx
@src/app/globals.css
@src/app/apps/tasks/page.tsx
@src/components/envelopes/EnvelopesNav.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Diagnose and fix invisible AuthGuard sign-in on /envelopes</name>
  <files>src/components/auth/AuthGuard.tsx, src/app/envelopes/layout.tsx</files>
  <action>
Investigate and fix why the AuthGuard sign-in UI is invisible on /envelopes but works on /apps/tasks.

Key observations from investigation:
- /apps/tasks uses AuthGuard at the PAGE level (src/app/apps/tasks/page.tsx) -- works correctly
- /envelopes uses AuthGuard at the LAYOUT level (src/app/envelopes/layout.tsx) -- invisible
- Both use the exact same AuthGuard component with identical CSS classes
- DOM elements exist (confirmed via accessibility snapshot) but render as blank white space
- Screenshots confirm: tasks page shows "Sign in to access this page." + button; envelopes page shows nothing

Diagnosis steps:
1. Start dev server (`npm run dev`) and navigate to http://localhost:3000/envelopes in Playwright MCP
2. Take a browser snapshot to confirm DOM elements exist
3. Use `browser_evaluate` to inspect the computed styles on the sign-in elements:
   - Check `color` on the paragraph (should be #4a5568 from text-text-secondary)
   - Check `opacity`, `visibility`, `display`, `overflow`, `height` on the container div and its parents
   - Check if any parent has `overflow: hidden` with collapsed height
   - Check if the sign-in div is positioned behind another element (z-index issue)
4. Compare the rendered DOM structure of /envelopes vs /apps/tasks to identify the difference

Likely root causes to check (in order of probability):
a) The envelopes layout.tsx is a Server Component importing a Client Component (AuthGuard). While this is valid in Next.js, the layout nesting may cause the AuthGuard's client-side rendering to produce a hydration mismatch or flash. Check if the container div gets `display: contents` or similar from the framework.
b) The Tailwind CSS 4 `text-text-secondary` class might not be generating correct CSS in the context of a layout (check if the class is in the generated stylesheet).
c) There could be a parent element (injected by Next.js layout nesting) with CSS that hides or collapses the content.
d) The `min-h-[50vh]` flex container may be collapsing in the layout context.

Fix approach (adjust based on diagnosis):
- If it's a text color issue: Replace `text-text-secondary` with explicit color like `text-[#4a5568]` or use `text-foreground` as a fallback, but ONLY in the sign-in UI if the theme color isn't resolving
- If it's a layout/visibility issue: Add explicit styling to ensure visibility (e.g., `relative z-10`, explicit `opacity-100`, or fix the parent container)
- If it's specific to AuthGuard-in-layout pattern: Consider moving AuthGuard from layout.tsx to individual envelopes pages, matching the pattern used by /apps/tasks
- Whatever the fix, ensure it does NOT break the other 4 AuthGuard usages (BillingPage, AssetsPage, UserBrandScraperPage, ResearchAssistantPage, tasks page)

IMPORTANT: Use Playwright MCP browser tools to diagnose before making code changes. Do not guess -- inspect actual computed styles.
  </action>
  <verify>
1. Run `npm run dev` and navigate to http://localhost:3000/envelopes in Playwright MCP
2. Take a screenshot -- "Sign in to access this page." text and "Sign in with Google" button must be visible
3. Navigate to http://localhost:3000/apps/tasks -- confirm sign-in prompt still works there too
4. Run `npm run lint && npm run build` -- zero errors
  </verify>
  <done>
- Unauthenticated user visiting /envelopes sees gray "Sign in to access this page." text and a bordered "Sign in with Google" button, vertically centered in the content area
- The sign-in UI is visually identical to the working /apps/tasks sign-in prompt
- All other AuthGuard usages remain functional
- Build and lint pass cleanly
  </done>
</task>

</tasks>

<verification>
1. Browser verification at http://localhost:3000/envelopes (not logged in) shows sign-in prompt
2. Browser verification at http://localhost:3000/apps/tasks (not logged in) still shows sign-in prompt
3. `npm run lint` passes with zero errors
4. `npm run build` succeeds
</verification>

<success_criteria>
- Sign-in prompt and Google button are visible on /envelopes for unauthenticated users
- No regression on other auth-gated pages
- Build and lint clean
</success_criteria>

<output>
After completion, create `.planning/quick/003-fix-invisible-sign-in-prompt-and-google-/003-SUMMARY.md`
</output>
