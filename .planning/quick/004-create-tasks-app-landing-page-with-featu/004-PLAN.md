---
phase: quick-004
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/apps/tasks/page.tsx
  - src/components/apps/TasksLandingPage.tsx
autonomous: true

must_haves:
  truths:
    - "Unauthenticated users see feature highlights, description, and demo CTA instead of generic sign-in prompt"
    - "Authenticated users see the existing Launch App content"
    - "Try Demo link points to the external todoist demo workspace"
    - "Sign-in CTA is visible for unauthenticated users"
  artifacts:
    - path: "src/components/apps/TasksLandingPage.tsx"
      provides: "Tasks landing page with auth-aware rendering"
      min_lines: 80
    - path: "src/app/apps/tasks/page.tsx"
      provides: "Server page rendering TasksLandingPage component"
  key_links:
    - from: "src/app/apps/tasks/page.tsx"
      to: "src/components/apps/TasksLandingPage.tsx"
      via: "component import"
      pattern: "TasksLandingPage"
    - from: "src/components/apps/TasksLandingPage.tsx"
      to: "useAuth"
      via: "auth context hook"
      pattern: "useAuth"
---

<objective>
Replace the bare AuthGuard-only Tasks page with a proper landing page that shows feature highlights, a "Try Demo" link, and sign-in CTA for unauthenticated users, while preserving the existing Launch App experience for authenticated users.

Purpose: Unauthenticated visitors to /apps/tasks currently see only "Sign in to access this page" with no context about what the app does. This gives them zero reason to sign in.
Output: A polished landing page component at src/components/apps/TasksLandingPage.tsx and an updated page.tsx that uses it.
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/apps/tasks/page.tsx
@src/components/auth/AuthGuard.tsx
@src/components/ui/Button.tsx
@src/components/ui/Card.tsx
@src/data/apps.ts
@src/components/layout/AuthButton.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create TasksLandingPage component with auth-aware rendering</name>
  <files>src/components/apps/TasksLandingPage.tsx</files>
  <action>
Create a "use client" component `TasksLandingPage` that uses `useAuth()` from `@/context/AuthContext` to render different content based on auth state.

**When NOT authenticated (the main deliverable):**

Layout: `mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8` (matches existing page container).

1. **Header section:**
   - Title: "Tasks" — use `text-2xl font-bold text-primary font-display` (matches current)
   - Subtitle: "Full-featured task management with workspaces, projects, sections, tags, subtasks, effort scoring, and board views." — use `text-text-secondary text-sm mb-8`

2. **Feature highlights grid** — 2-column grid on md+, 1-column on mobile (`grid grid-cols-1 md:grid-cols-2 gap-4 mb-10`). Each feature is a `Card` component (variant="default") with:
   - A small icon (use inline SVG, keep simple — checkmark, folder, gauge, calendar)
   - Feature name (bold, `text-sm font-semibold text-text-primary`)
   - One-line description (`text-xs text-text-secondary`)

   Features to highlight:
   - **Effort Scoring** — "Prioritize tasks with 1-5 effort points and sort by what matters"
   - **Projects & Sections** — "Organize work into projects with collapsible sections"
   - **Board & List Views** — "Switch between Kanban board and list views for any project"
   - **Weekly Credits** — "100 free credits per week with first week on the house"

3. **CTA section** — flex row with gap-3, two buttons:
   - "Try Demo" — `Button` component with `variant="primary"`, `href` set to `${TASKS_URL}/demo` (the external demo workspace). This opens in a new tab (Button already handles external hrefs with target="_blank").
   - "Sign in for Full Access" — a `button` element styled like AuthGuard's sign-in button (`px-5 py-2.5 text-sm font-medium rounded-full border border-gold/40 text-text-secondary hover:bg-gold-light hover:text-primary transition-all`). onClick triggers `signInWithPopup(getFirebaseAuth(), provider)` using the same GoogleAuthProvider pattern from AuthGuard.

Use `const TASKS_URL = process.env.NEXT_PUBLIC_TASKS_APP_URL || process.env.TASKS_APP_URL || "https://tasks.dan-weinbeck.com";` — note: since this is a client component, the env var must be NEXT_PUBLIC_ prefixed to be available. Fall back to the hardcoded URL.

**When authenticated:**
Render the existing Launch App content (title, subtitle, Launch App link) exactly as it currently appears in page.tsx. Use the same `TASKS_URL` for the launch link. Use the `Button` component with `variant="primary"` and an external arrow SVG icon (same as current page).

**Loading state:** Show a centered "Loading..." text matching AuthGuard's loading state (`flex items-center justify-center min-h-[50vh]`, `text-text-tertiary text-sm`).

Do NOT import or use `AuthGuard` — this component replaces the AuthGuard wrapper entirely, using `useAuth()` directly.
  </action>
  <verify>Run `npm run lint && npm run build` — no errors. Verify the file exports TasksLandingPage.</verify>
  <done>TasksLandingPage.tsx exists with auth-aware rendering: feature grid + demo CTA for unauthenticated, Launch App for authenticated, loading state for pending auth.</done>
</task>

<task type="auto">
  <name>Task 2: Update tasks page.tsx to use TasksLandingPage</name>
  <files>src/app/apps/tasks/page.tsx</files>
  <action>
Replace the current page content:
1. Remove the `AuthGuard` import and wrapping
2. Remove the inline JSX content (title, subtitle, launch link)
3. Remove the `TASKS_URL` constant (it now lives in the component)
4. Import and render `TasksLandingPage` from `@/components/apps/TasksLandingPage`
5. Keep the `metadata` export unchanged (title, description)

The page becomes a thin server component wrapper (similar to how brand-scraper/page.tsx wraps UserBrandScraperPage):

```tsx
import type { Metadata } from "next";
import { TasksLandingPage } from "@/components/apps/TasksLandingPage";

export const metadata: Metadata = {
  title: "Tasks | Daniel Weinbeck",
  description: "Full-featured task management with workspaces, projects, sections, tags, subtasks, and board views.",
};

export default function Page() {
  return <TasksLandingPage />;
}
```
  </action>
  <verify>Run `npm run lint && npm run build` — no errors. The page.tsx should be ~12 lines, importing only Metadata and TasksLandingPage.</verify>
  <done>page.tsx is a thin server wrapper rendering TasksLandingPage. No AuthGuard import. Build passes.</done>
</task>

</tasks>

<verification>
1. `npm run lint` passes with zero errors
2. `npm run build` succeeds with zero errors
3. Browser verification: navigate to /apps/tasks while NOT signed in — should see feature highlights grid, "Try Demo" button, and "Sign in for Full Access" button instead of generic "Sign in to access this page"
4. Browser verification: navigate to /apps/tasks while signed in — should see title, description, and "Launch App" button linking to the external tasks app
5. "Try Demo" link points to https://tasks.dan-weinbeck.com/demo (or NEXT_PUBLIC_TASKS_APP_URL/demo)
</verification>

<success_criteria>
- Unauthenticated users see 4 feature cards, a "Try Demo" CTA, and a "Sign in for Full Access" button
- Authenticated users see the Launch App experience (unchanged from current behavior)
- All quality gates pass (lint, build)
- Visual style matches the rest of the site (uses Card, Button, existing Tailwind classes)
</success_criteria>

<output>
After completion, create `.planning/quick/004-create-tasks-app-landing-page-with-featu/004-SUMMARY.md`
</output>
