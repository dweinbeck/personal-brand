# Feature Landscape: Tasks App Integration (v1.8)

**Domain:** Task management app integration with personal-brand site ecosystem (effort scoring, demo workspace, help tips, weekly credit gating)
**Researched:** 2026-02-11
**Overall confidence:** HIGH (well-established patterns across Linear/ClickUp/Asana for effort scoring; existing billing pattern in envelopes app for credit gating; standard tooltip/onboarding UX patterns)

---

## Context

The Todoist-style task management app already has core CRUD: workspaces, projects, sections, tasks, subtasks, tags, list/board/today/completed views, search, and manual ordering. This research covers four new feature areas needed to integrate it into the personal-brand site as a paid app:

1. **Effort scoring** -- optional per-task complexity/effort field with rollups
2. **Demo workspace** -- pre-populated sample data for try-before-you-pay onboarding
3. **HelpTip component** -- contextual help tooltips throughout the UI
4. **Weekly credit gating** -- billing integration with read-only degradation

---

## Feature 1: Effort Scoring

### Overview

An optional numeric effort field per task, using a modified Fibonacci scale (1-13), with computed rollups at the section and project level. This is the pattern used by Linear, ClickUp, Jira, and Azure DevOps for sprint planning and workload estimation.

**Industry standard:** Linear offers four scales (Exponential, Fibonacci, Linear, T-shirt). ClickUp calls them "Sprint Points." Jira calls them "Story Points." All use the same core pattern: an optional integer field on each issue with aggregate rollups to parent containers.

**Recommendation:** Use a simple Fibonacci-subset scale (1, 2, 3, 5, 8, 13) because it matches the most common agile estimation convention and the project spec already calls for integers 1-13. The Fibonacci spacing naturally discourages false precision -- the jump from 8 to 13 forces users to think "is this really that much bigger?" rather than quibbling between 9, 10, 11.

---

### Table Stakes

Features that must exist for effort scoring to be useful. Without these, effort is just a decoration.

#### TS-1: Effort Field on Tasks

| Aspect | Detail |
|--------|--------|
| **Feature** | Optional integer effort field on each task, values 1/2/3/5/8/13 |
| **Why Expected** | The core data model. Without it, nothing else works. Linear, ClickUp, and Jira all store effort as a nullable integer on the issue/task entity |
| **Complexity** | Low |
| **Dependencies** | Task data model in todoist app |

**Data model addition:**
```typescript
// Add to Task type
effort: number | null; // null = unset, valid values: 1, 2, 3, 5, 8, 13
```

**Validation:** Accept only values in the set `[1, 2, 3, 5, 8, 13]` or `null`. Reject other integers. This is a whitelist, not a range.

**API behavior:**
- Create task: `effort` defaults to `null` (unset)
- Update task: accept `effort` field, validate against whitelist
- Existing tasks: no migration needed -- `null` means unset, which is the correct default

**Confidence:** HIGH -- this is the standard pattern across all task management tools researched.

#### TS-2: Effort Selector UI

| Aspect | Detail |
|--------|--------|
| **Feature** | UI control for setting effort on a task |
| **Why Expected** | Users need a way to set the value. Every tool with effort scoring provides an inline selector |
| **Complexity** | Low |
| **Dependencies** | TS-1 |

**UI pattern options evaluated:**

| Pattern | Used By | Pros | Cons |
|---------|---------|------|------|
| Dropdown/select | ClickUp | Familiar, compact | Extra click to open |
| Inline button row | Linear (keyboard shortcut Shift+E) | Fast, visible options | Takes horizontal space |
| Badge that opens popover | Jira | Compact when collapsed | Extra click |

**Recommendation:** Small clickable badge that opens a compact popover with the 6 values (1, 2, 3, 5, 8, 13) arranged horizontally. When no effort is set, show a subtle "+" or blank space. When set, show the number in a small badge (styled like the existing tag badges). This matches the compact UI of a Todoist-style app where tasks are dense rows.

**Placement:**
- **Task detail view:** Dedicated field in the task properties area (alongside due date, tags, etc.)
- **List view:** Optional column or inline badge next to the task title
- **Board view:** Small badge on the card (bottom-right corner, similar to how tags appear)

**Confidence:** HIGH -- popover with discrete values is the standard pattern.

#### TS-3: Section Effort Rollup

| Aspect | Detail |
|--------|--------|
| **Feature** | Show total effort points for all tasks within a section |
| **Why Expected** | The primary purpose of effort scoring is workload visibility. ClickUp shows rollup sprint points on lists. Azure DevOps rolls up effort to parent work items. Without rollups, effort is just metadata with no analytical value |
| **Complexity** | Low-Medium |
| **Dependencies** | TS-1 |

**Computation:**
- Sum all non-null `effort` values for incomplete tasks in the section
- Display as "X pts" next to the section header
- Exclude completed tasks from the rollup (completed work is done, not remaining effort)
- If all tasks have null effort, show nothing (not "0 pts" -- that implies everything was estimated at zero)

**Display pattern:**
```
Section Name (3 tasks)                    21 pts
├── Task A                                  5
├── Task B                                  8
└── Task C                                  8
```

**Confidence:** HIGH -- sum rollup is the universal pattern (ClickUp, Azure DevOps, Zoho Projects all use it).

#### TS-4: Project Effort Rollup

| Aspect | Detail |
|--------|--------|
| **Feature** | Show total effort points across all sections in a project |
| **Why Expected** | Same rationale as TS-3 but at the project level. Project managers need to see total workload. Linear shows estimates on projects and cycles |
| **Complexity** | Low |
| **Dependencies** | TS-1, TS-3 |

**Computation:**
- Sum all section rollups (equivalent to summing all non-null effort values across all incomplete tasks in the project)
- Display in the project header or summary area
- Format: "X pts total" or "X effort points"

**Additional stat (recommended):** Show "X of Y tasks estimated" to highlight estimation coverage. If 3 of 10 tasks have effort, the rollup is incomplete and the user should know.

**Confidence:** HIGH -- direct extension of TS-3.

---

### Differentiators

Features that add polish beyond minimum effort scoring functionality.

#### D-1: Effort Distribution Visualization

| Aspect | Detail |
|--------|--------|
| **Feature** | Visual bar or mini-chart showing effort distribution across sections |
| **Value** | Helps identify overloaded sections at a glance. Useful for rebalancing work |
| **Complexity** | Medium |

**Simplest version:** Horizontal stacked bar in the project header where each segment represents a section's share of total effort, colored distinctly. No charting library needed -- CSS flexbox with percentage widths.

**Confidence:** MEDIUM -- useful but not essential for first implementation.

#### D-2: Effort in Board View Cards

| Aspect | Detail |
|--------|--------|
| **Feature** | Show effort points on Kanban board cards with column totals |
| **Value** | Board view is a primary view in the todoist app. Column totals help with capacity planning (common in sprint boards) |
| **Complexity** | Low |

**Implementation:** Add effort badge to card component. Show column total in the column header next to the task count.

**Confidence:** HIGH -- standard Kanban board pattern (Jira, Linear both do this).

---

### Anti-Features

#### AF-1: T-shirt Sizing / Multiple Scales

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Supporting multiple effort scales (T-shirt, linear, exponential) like Linear does | Over-engineered for a personal/small-team tool. Multiple scales require settings UI, scale conversion logic, and per-workspace configuration. Linear does it because they serve thousands of teams with different preferences | Ship one scale (Fibonacci subset 1-13). If there is ever demand for alternatives, add later. One scale means zero configuration |

#### AF-2: Planning Poker / Collaborative Estimation

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Multi-user estimation with voting rounds, convergence detection, reveal mechanics | This is a team ceremony feature. The todoist app is a personal/small-team tool. Planning poker requires real-time collaboration infrastructure (WebSockets), multi-user sessions, and a facilitation UX | Direct assignment: the task creator or assignee picks the effort value. No ceremony |

#### AF-3: Velocity Tracking / Burn-down Charts

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Historical velocity charts, sprint burn-down, completion rate trends | Requires time-series data collection (when tasks were completed, effort over time), chart rendering, and sprint/iteration concepts that don't exist in the todoist app | Show current rollup totals only (TS-3, TS-4). Historical tracking is a V2+ feature that requires sprint/iteration concepts first |

---

## Feature 2: Demo Workspace

### Overview

A pre-populated workspace with 30-60 realistic tasks across 3-5 projects that new users see before enabling credits. The purpose is to let users experience the app's features (filtering, board view, effort scoring, search) with real-feeling data before committing to payment.

**Industry patterns:**
- TalentLMS creates a demo sandbox pre-filled with demo users, courses, and data with all external communications turned off
- Google Analytics shows a sample dashboard during setup with a "Generate dummy data" option
- Many SaaS products show "Start with a template" options during onboarding

**Key insight from research:** The ideal SaaS onboarding flow should deliver first perceived value in under 2 minutes. An empty task manager with no data provides zero value -- users cannot evaluate filtering, board layout, or search without content to interact with.

---

### Table Stakes

#### TS-5: Demo Data Seed

| Aspect | Detail |
|--------|--------|
| **Feature** | A static JSON/TypeScript seed file containing 30-60 realistic tasks across 3-5 projects with sections, tags, subtasks, and effort scores |
| **Why Expected** | The raw data that powers the demo. Without a well-crafted seed, the demo feels fake and teaches nothing about the app |
| **Complexity** | Medium (content design, not code) |
| **Dependencies** | None |

**Recommended demo projects (3-5):**

| Project | Theme | Tasks | Why This Theme |
|---------|-------|-------|----------------|
| Website Redesign | Web development | 12-15 | Relatable to the target audience (developers), has clear sections (Design, Frontend, Backend, QA) |
| Q1 Marketing Launch | Marketing/planning | 10-12 | Shows cross-functional use, different task types (write copy, design assets, schedule posts) |
| Apartment Move | Personal/life | 8-10 | Demonstrates personal use case, relatable to everyone |
| App MVP | Product development | 10-15 | Shows technical project management with effort scoring |

**Data requirements per task:**
- Title (realistic, specific -- "Set up CI/CD pipeline" not "Task 1")
- Project and section assignment
- Some with subtasks (2-3 subtasks each, on ~30% of tasks)
- Some with tags (mix of 2-4 tags)
- Some with effort scores (mix -- ~60% estimated, ~40% null to show the "unestimated" state)
- Some marked complete (~20%) to show completed view
- Due dates spanning past, today, and future to populate the Today view

**Confidence:** HIGH -- seed data is a well-understood pattern. The content design is the hard part, not the code.

#### TS-6: Demo Workspace Lifecycle

| Aspect | Detail |
|--------|--------|
| **Feature** | The demo workspace is visible before credits are enabled, read-only or limited-write, and replaced/supplemented by real workspaces after payment |
| **Why Expected** | Users need a clear transition from "trying" to "using." Without lifecycle management, demo data pollutes real workspaces |
| **Complexity** | Medium |
| **Dependencies** | TS-5, billing integration |

**Lifecycle options evaluated:**

| Approach | Pros | Cons |
|----------|------|------|
| Static read-only demo (no persistence) | Zero cleanup, simple | Users cannot try editing, limits evaluation |
| Persisted demo workspace, deleted on first real use | Users can try everything | Deletion timing is complex, risk of data loss confusion |
| Persisted demo workspace, kept alongside real data with a "Demo" badge | No confusion about deletion | Clutters the workspace list |
| **Client-side only demo (recommended)** | No server state, instant load, no cleanup | Cannot test API-dependent features |

**Recommendation:** Client-side only demo workspace loaded from static seed data, with a prominent banner explaining it is demo data and a CTA to "Enable credits to create your own workspace." The demo workspace appears in the sidebar with a "Demo" label. All CRUD operations work in-memory during the session but are not persisted. This approach:
1. Requires zero server-side changes
2. Has no cleanup/migration complexity
3. Loads instantly (no API call)
4. Lets users try all UI interactions (drag, edit, complete)
5. Clearly separates from real data

**Confidence:** HIGH -- client-side demo is the simplest approach that still provides full interactivity.

#### TS-7: Demo Banner / CTA

| Aspect | Detail |
|--------|--------|
| **Feature** | A persistent banner in demo mode explaining the state and linking to credit purchase |
| **Why Expected** | Users must understand they are in demo mode. Without clear signaling, they may think the app is broken (data they add disappears) or already paid for |
| **Complexity** | Low |
| **Dependencies** | TS-6 |

**Banner content:**
```
[Demo Mode] You're exploring with sample data. Purchase credits to create your own workspace.
[Buy Credits] [Dismiss]
```

**Design:** Match the existing ReadOnlyBanner from the envelopes app (amber border, amber background, amber text). Use the same visual language for consistency across apps.

**Placement:** Top of the main content area, above tasks. Sticky or dismissible (dismissible is better UX -- once the user understands they are in demo mode, the banner is noise).

**Confidence:** HIGH -- directly reuse the existing ReadOnlyBanner pattern from envelopes.

---

### Differentiators

#### D-3: "Start Fresh" vs "Keep Demo Data" Choice

| Aspect | Detail |
|--------|--------|
| **Feature** | After purchasing credits, ask if user wants to start with an empty workspace or import the demo data as their own |
| **Value** | Some users will have customized the demo data during exploration. Importing it saves rework |
| **Complexity** | Medium |

**Recommendation:** Defer to post-MVP. The MVP should start fresh after payment. Importing demo data adds a migration step and edge cases (what if they already have data?).

**Confidence:** HIGH that this should be deferred.

#### D-4: Guided Tour Over Demo Data

| Aspect | Detail |
|--------|--------|
| **Feature** | Step-by-step tooltip tour pointing out key features while browsing demo data |
| **Value** | Combines demo data with guided discovery. More effective than either alone |
| **Complexity** | High |

**Recommendation:** Defer. HelpTips (Feature 3) provide static contextual help. A sequential tour requires step management, highlight overlays, and scroll-to-element behavior. Build this only if user feedback indicates the demo + HelpTips are insufficient.

**Confidence:** HIGH that this should be deferred.

---

### Anti-Features

#### AF-4: Server-Persisted Demo Data Per User

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Creating actual Firestore documents for each new user's demo workspace | Creates real data that must be cleaned up. Adds storage costs. Complicates the "is this demo or real?" distinction. Requires a migration/deletion flow | Client-side only demo (TS-6). Zero server cost, zero cleanup, instant |

#### AF-5: Multiple Demo Templates

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| "Choose your demo: Developer, Marketer, Student, Personal" with different seed data per persona | Multiplies content creation effort by 4x. The target audience for this personal-brand site is narrow enough that one well-crafted demo serves everyone | One demo seed file with a mix of project types (TS-5) |

---

## Feature 3: HelpTip Component

### Overview

A reusable tooltip component that appears as a small gold circle with a navy "?" mark. On hover (desktop) or tap (mobile), it displays a brief contextual help message. Used throughout the todoist app to explain features like effort scoring, board view, and keyboard shortcuts.

**Industry patterns:**
- Tooltips should be 1-2 sentences max, with a header of 60 characters max and body of 130 characters max
- Tooltips should be the exception, not the rule -- each one creates friction
- Must be keyboard-accessible and screen-reader compatible (ARIA tooltip role)
- Placement should not block the element being described

---

### Table Stakes

#### TS-8: HelpTip Component

| Aspect | Detail |
|--------|--------|
| **Feature** | A reusable `<HelpTip text="..." />` component rendering a "?" icon that shows a tooltip on hover/focus |
| **Why Expected** | The core building block. Every occurrence of contextual help in the app uses this component |
| **Complexity** | Low-Medium |
| **Dependencies** | None |

**Visual design (from spec):**
- Trigger: 16-20px gold (#C8A55A) circle with navy (#063970) "?" centered
- Tooltip: Navy background, white text, rounded corners, 8px padding
- Arrow/caret pointing to the trigger element
- Max width: 240px
- Font: Inter, 13px

**Behavior:**
- Desktop: Show on hover (mouseenter), hide on mouseleave. Also show on focus for keyboard users.
- Mobile: Show on tap, hide on tap-outside or second tap.
- Delay: 200ms hover delay before showing (prevents flicker on accidental hover).
- Dismiss: Hide on Escape key press.
- Positioning: Auto-position above/below/left/right based on available viewport space.

**Accessibility requirements:**
- Trigger button has `aria-describedby` pointing to the tooltip element
- Tooltip element has `role="tooltip"`
- Trigger is a `<button>` (not a `<span>`) so it is focusable and announced by screen readers
- Tooltip text is accessible to screen readers via the aria relationship

**Implementation approach:**

| Option | Size | Pros | Cons |
|--------|------|------|------|
| CSS-only (`::after` pseudo-element) | 0 KB | No JS, smallest | No auto-positioning, no delay, no keyboard support, poor accessibility |
| Custom React component with Floating UI | ~5-10 KB | Full control, lightweight, auto-positioning | Must build from scratch |
| Radix Tooltip primitive | ~3 KB | Accessible by default, tested, positioning handled | Adds dependency |

**Recommendation:** Build a custom lightweight component using CSS positioning with a simple above/below preference. The tooltip content is short (1-2 sentences), the trigger is always an inline element next to a label, and the positioning needs are simple. Avoid adding Radix or Floating UI as dependencies for this single use case -- the existing codebase has no headless UI library and adding one for tooltips alone is overkill.

If positioning proves problematic (tooltip clipped by viewport edges), upgrade to Floating UI later. Start simple.

**Confidence:** HIGH for the component design. MEDIUM for the CSS-only positioning approach -- may need Floating UI if edge cases arise.

#### TS-9: HelpTip Content Catalog

| Aspect | Detail |
|--------|--------|
| **Feature** | A centralized content file mapping placement IDs to tooltip text |
| **Why Expected** | Decoupling content from component placement makes it easy to update text without editing component files. Standard i18n/content pattern |
| **Complexity** | Low |
| **Dependencies** | TS-8 |

**Structure:**
```typescript
// src/data/help-tips.ts
export const helpTips = {
  "effort-field": "Estimate task complexity using Fibonacci points (1-13). Higher = more effort.",
  "board-view": "Drag tasks between sections to reorganize. Each column is a section.",
  "today-view": "Shows tasks due today or overdue. Complete them to clear your day.",
  "demo-mode": "This is sample data. Purchase credits to create your own workspace.",
  "search": "Search by task title, tag, or project name.",
  // ...
} as const;
```

**Usage:**
```tsx
<label>Effort <HelpTip text={helpTips["effort-field"]} /></label>
```

**Content guidelines (from research):**
- Max 2 sentences per tooltip
- Header: 60 chars max (optional -- most tooltips won't need a header)
- Body: 130 chars max
- Active voice, present tense
- Start with a verb when describing an action: "Drag tasks..." / "Estimate complexity..."
- Never repeat the label text the tooltip is attached to

**Confidence:** HIGH -- standard content management pattern.

---

### Differentiators

#### D-5: Animated Entry

| Aspect | Detail |
|--------|--------|
| **Feature** | Subtle fade-in + scale animation when tooltip appears |
| **Value** | Feels polished, draws attention without being jarring |
| **Complexity** | Low |

**Implementation:** CSS transition: `opacity 0 -> 1` and `transform: scale(0.95) -> scale(1)` over 150ms. No animation library needed.

**Confidence:** HIGH -- trivial CSS addition.

#### D-6: "Learn More" Link in Tooltips

| Aspect | Detail |
|--------|--------|
| **Feature** | Optional link at the bottom of a tooltip pointing to documentation or a longer explanation |
| **Value** | For complex features, a tooltip is too short. A "Learn more" link bridges to full documentation |
| **Complexity** | Low |

**Recommendation:** Defer. The app's features are simple enough that 1-2 sentence tooltips suffice. No documentation site exists to link to.

**Confidence:** HIGH that this should be deferred.

---

### Anti-Features

#### AF-6: Interactive/Rich Tooltips

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Tooltips with images, videos, multi-step content, or form elements inside | Tooltips should be quick glances. Rich content belongs in modals, popovers, or documentation pages. Interactive tooltips trap focus and create accessibility nightmares | Keep tooltips text-only, max 2 sentences. Use the existing Modal component for anything requiring more content |

#### AF-7: Dismissable "First-Time" Tips (Coachmarks)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| One-time tips that appear on first visit and are dismissed permanently (stored in localStorage or DB) | Requires per-user state tracking, dismissal persistence, and "have they seen this?" checks on every render. Adds complexity for a small-scope app | Static HelpTips that are always available. Users who know the feature ignore the "?" icon. Users who need help hover over it. No state management needed |

#### AF-8: Tooltip Analytics / A/B Testing

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Tracking which tooltips users hover over, click-through rates, or A/B testing different text | Over-instrumented for a personal-brand app. No product team analyzing tooltip engagement | Write good tooltip text once. Iterate based on personal use |

---

## Feature 4: Weekly Credit Gating

### Overview

Integrate the todoist app with the personal-brand site's existing billing/credits system. Users get their first week free, then pay 100 credits/week (configurable via `billing_tool_pricing` collection). When unpaid, the app degrades to read-only mode.

**This is NOT a new pattern.** The envelopes app already implements this exact flow in `src/lib/envelopes/billing.ts`. The todoist app should replicate the same pattern with a different tool key.

---

### Table Stakes

#### TS-10: Billing Access Check (Server-Side)

| Aspect | Detail |
|--------|--------|
| **Feature** | Server-side function that checks if a user has paid for the current week, charges if not, and returns readwrite/readonly status |
| **Why Expected** | The billing gate. Without this, the app is either always free or always blocked |
| **Complexity** | Low (copy and adapt from envelopes) |
| **Dependencies** | Existing billing system (`debitForToolUse`), Firebase Auth |

**Implementation:** Clone `checkEnvelopeAccess()` from `src/lib/envelopes/billing.ts` with these changes:

| Parameter | Envelopes | Todoist |
|-----------|-----------|---------|
| Tool key | `dave_ramsey` | `todoist` (new entry in `billing_tool_pricing`) |
| Billing collection | `envelope_billing` | `todoist_billing` |
| Idempotency prefix | `envelope_week_` | `todoist_week_` |

The logic is identical:
1. Get-or-create billing doc in transaction
2. First week free (compare `firstAccessWeekStart` to current week)
3. Already paid this week? Return readwrite
4. Attempt `debitForToolUse()` -- success = readwrite, 402 = readonly
5. Record paid week in billing doc

**Firestore seed data needed:**
```json
// billing_tool_pricing/todoist
{
  "toolKey": "todoist",
  "displayName": "Tasks",
  "creditCost": 100,
  "active": true,
  "description": "Weekly access to task management"
}
```

**Confidence:** HIGH -- exact replication of a proven, tested pattern.

#### TS-11: Read-Only Mode Enforcement

| Aspect | Detail |
|--------|--------|
| **Feature** | When billing returns `readonly`, disable all write operations while preserving read access |
| **Why Expected** | The graceful degradation UX. Users should still see their data but cannot modify it. This is the same pattern as envelopes' ReadOnlyBanner |
| **Complexity** | Medium |
| **Dependencies** | TS-10, all CRUD endpoints/UI |

**Server-side enforcement (non-negotiable):**
- Every mutating API endpoint (POST, PUT, PATCH, DELETE for tasks, projects, sections) must check billing status
- If `readonly`, return 403 with `{ error: "Weekly access expired. Purchase credits to continue editing." }`
- Read endpoints (GET) always work regardless of billing status

**Client-side UX (recommended approach):**
- Pass billing status from API responses to the UI (same pattern as envelopes: include `billing: { mode, reason }` in GET responses)
- When `readonly`:
  - Disable all "Add" buttons (new task, new project, new section)
  - Disable task editing (effort, title, completion toggle, drag-and-drop reorder)
  - Disable delete buttons
  - Show ReadOnlyBanner (TS-12)
  - Tasks and projects remain visible and navigable
  - Search still works
  - Board and list views still render

**What NOT to disable in read-only:**
- View switching (list/board/today/completed)
- Search and filtering
- Navigation between projects
- Collapsing/expanding sections (visual-only, no state change)

**Confidence:** HIGH -- envelopes app has proven this pattern works.

#### TS-12: Read-Only Banner

| Aspect | Detail |
|--------|--------|
| **Feature** | Persistent banner at the top of the app when in read-only mode |
| **Why Expected** | Users must understand WHY editing is disabled. Without explanation, disabled buttons appear broken |
| **Complexity** | Low |
| **Dependencies** | TS-10, TS-11 |

**Reuse the envelopes ReadOnlyBanner pattern:**
```
[Read-Only Mode]
Your free week has ended. Purchase credits to continue managing tasks.
[Buy Credits ->]
```

**Design:** Match `src/components/envelopes/ReadOnlyBanner.tsx` -- amber border, amber-50 bg, amber-800 text, link to `/billing`. Adapt the text for the tasks context.

**Confidence:** HIGH -- direct component reuse/adaptation.

#### TS-13: First Week Free Banner

| Aspect | Detail |
|--------|--------|
| **Feature** | Banner during the free trial week indicating the user has free access |
| **Why Expected** | Users should know they are on a free week so they are not surprised by the charge next week. The envelopes billing already returns `reason: "free_week"` which can drive this |
| **Complexity** | Low |
| **Dependencies** | TS-10 |

**Banner content:**
```
[Free Week] You have free access this week. After this week, task management costs 100 credits/week.
[Buy Credits] [Learn About Credits]
```

**Design:** Use a softer variant -- blue or green tint instead of amber (amber signals a problem; free week is a positive state).

**Confidence:** HIGH -- simple conditional banner based on billing response.

#### TS-14: Apps Hub Integration

| Aspect | Detail |
|--------|--------|
| **Feature** | Add the todoist app to the Apps hub page at `/apps` and create a route for it |
| **Why Expected** | Every app on the personal-brand site appears in the Apps hub. Without this, users cannot discover the task management tool |
| **Complexity** | Low |
| **Dependencies** | Existing apps data source (`src/data/apps.ts`) |

**Implementation:**
- Add entry to `getApps()` in `src/data/apps.ts`:
```typescript
{
  slug: "tasks",
  title: "Tasks",
  tag: "Productivity",
  subtitle: "Todoist-style task management with effort scoring",
  description: "Manage projects, tasks, and subtasks with board and list views. Track effort with Fibonacci points. First week free.",
  href: "/apps/tasks",
  launchedAt: "2026-02-11",
  updatedAt: "2026-02-11",
  techStack: ["React", "Firebase", "Tailwind"],
  available: true,
}
```

- Create route at `/apps/tasks` that either embeds the todoist app or links to it
- Add sitemap entry

**Cross-repo decision:** The todoist app is a separate repo. Integration options:
1. **Embed as a subroute** -- copy/build todoist into the personal-brand Next.js app under `/apps/tasks/`
2. **Link to external URL** -- todoist runs on its own domain/port, apps page links out
3. **Iframe embed** -- mount the todoist app in an iframe within the personal-brand shell

**Recommendation:** Option 1 (embed as subroute) is the cleanest user experience but requires the todoist code to be compatible with the personal-brand Next.js app structure. This is an architecture decision that should be confirmed before implementation.

**Confidence:** MEDIUM -- the integration approach depends on how the two repos will be combined.

---

### Differentiators

#### D-7: Credit Balance Display in App Header

| Aspect | Detail |
|--------|--------|
| **Feature** | Show current credit balance in the todoist app header |
| **Value** | Users can see when they are running low and proactively buy credits before losing access |
| **Complexity** | Low |

**Implementation:** API endpoint already exists (`/api/billing/me` returns balance). Show "X credits" in the header with a warning color when below the weekly cost (100 credits).

**Confidence:** HIGH -- the API already exists.

#### D-8: Billing History / Usage Tracking

| Aspect | Detail |
|--------|--------|
| **Feature** | Show when each week was charged and how many credits were deducted |
| **Value** | Transparency about billing. Users can verify they were not double-charged |
| **Complexity** | Low-Medium |

**Recommendation:** Defer to post-MVP. The admin billing panel already provides this visibility. User-facing billing history is a nice-to-have.

**Confidence:** HIGH that this should be deferred.

---

### Anti-Features

#### AF-9: Per-Task Billing

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Charging credits per task created instead of weekly flat rate | Creates anxiety about creating tasks ("is this one worth a credit?"). Discourages the natural task management behavior of breaking work into small tasks. Violates the principle that productivity tools should never penalize detailed planning | Weekly flat rate (TS-10). Unlimited tasks within the paid week. Zero friction for task creation |

#### AF-10: Feature-Tiered Access

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Free tier with basic tasks, paid tier adds effort scoring / board view / tags | Complicates the UI with "upgrade to use this feature" gates on individual features. The app is simple enough that partial access would feel broken | All-or-nothing access: free first week with full features, then weekly credit charge for full access, then read-only. No partial feature gating |

#### AF-11: Monthly Subscription Instead of Weekly Credits

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Monthly Stripe subscription replacing the credit-based model | The personal-brand site already has a working credit-based billing system with Stripe Checkout. Adding subscription management (Stripe Billing, cancellation flows, proration, failed payment retries) is a major new infrastructure investment | Use the existing credit system with weekly debit (TS-10). Consistent with brand scraper and envelopes billing |

---

## Feature Dependencies

```
EFFORT SCORING CHAIN:
  Task data model update (TS-1)
    |
    +---> Effort Selector UI (TS-2)
    |
    +---> Section Rollup (TS-3)
    |       |
    |       +---> Project Rollup (TS-4)
    |
    +---> [D-1] Distribution Visualization
    +---> [D-2] Board View Effort Badges

DEMO WORKSPACE CHAIN:
  Demo Data Seed (TS-5)
    |
    +---> Demo Workspace Lifecycle (TS-6)
    |       |
    |       +---> Demo Banner/CTA (TS-7)
    |
    +---> [D-3] Keep Demo Data (requires TS-6 + billing)

HELP TIP CHAIN:
  HelpTip Component (TS-8)
    |
    +---> Content Catalog (TS-9)
    |
    +---> [D-5] Animated Entry
    +---> [D-6] Learn More Links

BILLING CHAIN:
  Billing Access Check (TS-10) -- depends on existing billing system
    |
    +---> Read-Only Enforcement (TS-11)
    |       |
    |       +---> Read-Only Banner (TS-12)
    |
    +---> Free Week Banner (TS-13)
    |
    +---> Apps Hub Integration (TS-14)
    |
    +---> [D-7] Credit Balance Display

CROSS-FEATURE DEPENDENCIES:
  Demo Workspace (TS-6) should show effort scores on demo tasks -> depends on TS-1
  Demo Banner (TS-7) uses HelpTip styling conventions -> soft dependency on TS-8
  Effort HelpTip content (TS-9) requires effort field to exist -> depends on TS-1
  Read-Only mode (TS-11) must disable effort editing -> depends on TS-2
```

---

## MVP Recommendation

### Build Order (recommended phase sequence)

**Phase 1: HelpTip Component** (TS-8, TS-9)
- Zero dependencies on other features
- Small, self-contained deliverable
- Needed by all other features for contextual help
- Complexity: Low
- Estimated scope: 2 files, ~100 lines

**Phase 2: Effort Scoring** (TS-1, TS-2, TS-3, TS-4)
- Core data model change + UI
- Must be done before demo data (demo tasks should have effort scores)
- Complexity: Low-Medium
- Estimated scope: 4-6 files, ~300 lines (data model + selector + rollup display)

**Phase 3: Weekly Credit Gating** (TS-10, TS-11, TS-12, TS-13, TS-14)
- Depends on the billing system existing (it does)
- Must be done before demo workspace (demo exists to preview before paying)
- Complexity: Medium
- Estimated scope: 5-8 files, ~400 lines (billing logic + read-only enforcement + banners + apps integration)

**Phase 4: Demo Workspace** (TS-5, TS-6, TS-7)
- Depends on effort scoring (demo tasks need effort values)
- Depends on billing (demo is the pre-payment experience)
- Complexity: Medium (mostly content design)
- Estimated scope: 3-5 files, ~500 lines (seed data is the bulk)

### Defer

| Feature | Reason | When to Revisit |
|---------|--------|-----------------|
| D-1: Effort distribution visualization | Nice-to-have, no user demand yet | After effort scoring has been used for 2+ weeks |
| D-3: Keep demo data on payment | Edge case, adds migration complexity | If users complain about losing demo customizations |
| D-4: Guided tour | HelpTips provide basic guidance first | If onboarding metrics show low activation |
| D-7: Credit balance in header | Low urgency, admin panel shows this | When more than one user is active |
| D-8: Billing history for users | Admin panel covers this | When user base grows |
| AF-1 through AF-11 | Explicitly rejected features | Only if core assumptions change |

---

## Complexity Summary

| Feature Area | Table Stakes Count | Total Complexity | Key Risk |
|--------------|-------------------|------------------|----------|
| Effort Scoring | 4 (TS-1 to TS-4) | Low-Medium | Data model change touches many views |
| Demo Workspace | 3 (TS-5 to TS-7) | Medium | Content design quality determines UX quality |
| HelpTip Component | 2 (TS-8 to TS-9) | Low | Positioning edge cases on small viewports |
| Weekly Credit Gating | 5 (TS-10 to TS-14) | Medium | Cross-repo integration approach is TBD |

**Total table stakes features:** 14
**Overall complexity:** Medium (most patterns are proven in the existing codebase)

---

## Sources

- Linear Estimates documentation: [Estimates -- Linear Docs](https://linear.app/docs/estimates) (HIGH confidence -- official docs, verified via WebFetch)
- ClickUp Sprint Points: [Use Sprint Points -- ClickUp Help](https://help.clickup.com/hc/en-us/articles/6303883602327-Use-Sprint-Points) (MEDIUM confidence -- WebSearch result)
- Azure DevOps rollup: [Support rollup of work and other fields](https://learn.microsoft.com/en-us/azure/devops/reference/xml/support-rollup-of-work-and-other-fields) (HIGH confidence -- official Microsoft docs)
- Fibonacci estimation: [Fibonacci Agile Estimation -- ProductPlan](https://www.productplan.com/glossary/fibonacci-agile-estimation/), [Why the Fibonacci Sequence Works -- Mountain Goat Software](https://www.mountaingoatsoftware.com/blog/why-the-fibonacci-sequence-works-well-for-estimating), [Fibonacci Story Points -- Atlassian](https://www.atlassian.com/agile/project-management/fibonacci-story-points) (HIGH confidence -- multiple authoritative sources)
- SaaS onboarding demo patterns: [SaaS Onboarding Best Practices 2025 -- Insaim](https://www.insaim.design/blog/saas-onboarding-best-practices-for-2025-examples), [SaaS Onboarding 2026 -- Sales-Hacking](https://www.sales-hacking.com/en/post/best-practices-onboarding-saas) (MEDIUM confidence -- WebSearch)
- Tooltip best practices: [Tooltip Best Practices -- UserPilot](https://userpilot.com/blog/tooltip-best-practices/), [Designing Better Tooltips -- LogRocket](https://blog.logrocket.com/ux-design/designing-better-tooltips-improved-ux/), [Tooltip Design -- SetProduct](https://www.setproduct.com/blog/tooltip-ui-design) (HIGH confidence -- multiple sources agree)
- Tooltip accessibility: [ARIA tooltip role -- MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role), [React Aria Tooltip](https://react-spectrum.adobe.com/react-aria/Tooltip.html), [Accessible Tooltips -- ustwo](https://engineering.ustwo.com/articles/creating-an-accessible-tooltip/) (HIGH confidence -- official specs)
- Freemium/credit gating: [Freemium Pricing -- Stripe](https://stripe.com/resources/more/freemium-pricing-explained), [SaaS Pricing Models 2025-2026 -- Monetizely](https://www.getmonetizely.com/blogs/complete-guide-to-saas-pricing-models-for-2025-2026) (MEDIUM confidence)
- Existing codebase: `src/lib/envelopes/billing.ts`, `src/components/envelopes/ReadOnlyBanner.tsx`, `src/lib/envelopes/types.ts`, `src/data/apps.ts`, `src/components/ui/Button.tsx`, `src/components/ui/Modal.tsx`, `src/lib/billing/firestore.ts` (HIGH confidence -- direct file inspection)
