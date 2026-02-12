# Architecture Patterns: Tasks App Integration

**Domain:** Multi-repo app integration (Todoist + Personal-Brand)
**Researched:** 2026-02-11
**Confidence:** HIGH (based on direct codebase analysis of both repos)

---

## Current State Analysis

### Two-Repo Architecture

```
personal-brand (dan-weinbeck.com)          todoist (standalone)
================================          ====================
Next.js 16 App Router                     Next.js 16 App Router
Firebase/Firestore                        PostgreSQL/Prisma
Firebase Auth (Google Sign-In)            No auth (single-user)
Billing system (credits/ledger)           Server actions for mutations
GCP Cloud Run                             Not yet deployed
Apps hub (/apps)                          Routes: /tasks/**
Envelopes app (/envelopes)                Workspaces > Projects > Tasks
```

### Key Observations from Codebase

1. **Todoist has no auth or user scoping.** All Prisma queries are global -- no `userId` filter anywhere. The `Workspace` model has no user association.

2. **Todoist uses server actions** (not API routes) for mutations. This is fundamentally different from envelopes, which uses API routes with `verifyUser()` + Bearer token auth.

3. **Envelopes is embedded** in personal-brand as client-rendered pages calling API routes. Todoist is a **standalone Next.js app** with RSC data fetching and server actions.

4. **The billing integration pattern** (envelopes) uses:
   - `checkEnvelopeAccess()` in billing.ts returns `readwrite | readonly`
   - API routes check access on every write endpoint (402 on readonly)
   - Client reads `billing.mode` from GET responses, conditionally shows `ReadOnlyBanner` and disables write UI
   - `envelope_billing` Firestore collection tracks per-user week payments

5. **The Apps hub** is a static listing in `src/data/apps.ts` with `AppCard` linking to either internal routes (`/envelopes`, `/apps/brand-scraper`) or could link to external URLs.

---

## Recommended Architecture

### Architecture Decision: Todoist stays as a separate deployment

Todoist should NOT be embedded into the personal-brand repo.

**Rationale:**

- **Different databases** -- Todoist uses PostgreSQL/Prisma, personal-brand uses Firestore. Merging them would require either migrating Todoist to Firestore (massive rewrite) or running both databases from one app (complexity explosion).
- **Different mutation patterns** -- Todoist uses server actions; personal-brand uses API routes. Mixing patterns in one codebase creates confusion.
- **Deployment independence** -- Todoist can be deployed and iterated on without touching the personal-brand deploy pipeline.

**Integration approach:**

1. Apps hub entry linking to Todoist's deployed URL
2. Todoist calls personal-brand's billing API routes for credit gating
3. Shared Firebase Auth (same Firebase project) for user identity

### Component Boundaries

| Component | Repo | Responsibility | Communicates With |
|-----------|------|---------------|-------------------|
| Apps Hub | personal-brand | Lists all apps, links to them | Static data, no runtime deps |
| Billing API | personal-brand | Credit balance, debit, access check | Todoist calls via HTTP |
| Firebase Auth | personal-brand (config) | User identity (Google Sign-In) | Todoist uses same Firebase project |
| Task CRUD | todoist | Create/read/update/delete tasks | PostgreSQL via Prisma |
| Effort Scoring | todoist | Score tasks 1-5, display in UI | PostgreSQL (new column) |
| Demo Workspace | todoist | Static read-only sample data | In-memory/hardcoded, no DB |
| Help Tips | todoist | Contextual onboarding tooltips | Client-side only |
| Weekly Billing | todoist (calls p-b) | Gate writes behind credit check | personal-brand billing API |
| ReadOnlyBanner | todoist | Shows "buy credits" when readonly | Billing state from API |

### Data Flow

```
User Browser
    |
    +---> dan-weinbeck.com/apps ----------> Apps listing (static)
    |         |
    |         +---> "Open Task Manager" --> todoist.dan-weinbeck.com
    |
    +---> todoist app (Next.js)
              |
              +---> Firebase Auth SDK (client) -- shared Firebase project
              |     |
              |     +---> Gets ID token
              |
              +---> Server Actions (task/project/section CRUD)
              |     |
              |     +---> [Billing check layer]
              |     |     |
              |     |     +---> Calls personal-brand billing API
              |     |           GET dan-weinbeck.com/api/tasks/billing/access
              |     |           Authorization: Bearer <firebase-id-token>
              |     |
              |     +---> PostgreSQL via Prisma
              |
              +---> Demo mode (no auth, no DB, static data)
```

---

## Integration Approach: Billing Gating

### Todoist calls personal-brand billing API

Todoist adds a billing check that calls personal-brand's billing API. This mirrors how the envelopes app integrates with the shared billing system.

**How it works:**

1. Todoist adds Firebase Auth (client SDK) for user identity -- same Firebase project as personal-brand
2. Todoist adds a server-side billing check function that:
   - Takes the user's Firebase ID token
   - Calls `GET https://dan-weinbeck.com/api/tasks/billing/access` (new endpoint in personal-brand)
   - Returns `readwrite | readonly`
3. Personal-brand adds a new billing API route that reuses `checkEnvelopeAccess()` pattern but for the `todoist` tool key
4. Todoist's server actions or API routes check billing before allowing mutations

**New endpoint in personal-brand:**

```
GET /api/tasks/billing/access
  Headers: Authorization: Bearer <firebase-id-token>
  Response: { mode: "readwrite" | "readonly", reason?: "free_week" | "unpaid" }
```

This endpoint:
- Verifies the Firebase ID token (existing `verifyUser()`)
- Calls a new `checkTasksAccess()` (modeled on `checkEnvelopeAccess()`)
- Returns billing status

**New files in personal-brand:**
- `src/app/api/tasks/billing/access/route.ts` -- new API route
- `src/lib/tasks/billing.ts` -- `checkTasksAccess()` (copy pattern from envelopes)
- `src/lib/tasks/types.ts` -- `TasksBilling`, `TasksAccessResult` types

**New files in todoist:**
- `src/lib/billing.ts` -- calls personal-brand billing API, caches result per-request
- `src/context/BillingContext.tsx` -- provides billing state to components

### Why NOT embed billing directly in todoist

Having todoist import Firebase Admin SDK and access Firestore billing collections directly would create tight coupling between repos at the database level. Both repos would need Firebase Admin credentials. Schema changes in billing would break both apps simultaneously. The HTTP API boundary keeps the repos decoupled.

---

## Feature Integration Details

### 1. Effort Scoring (todoist-only, no cross-repo impact)

**Schema change:**
```prisma
model Task {
  // ... existing fields ...
  effortScore  Int?      // 1-5 scale, null = unscored
}
```

**Modified files in todoist:**

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `effortScore Int?` column |
| `src/lib/schemas/task.ts` | Add `effortScore` to create/update schemas |
| `src/services/task.service.ts` | Pass through effortScore in create/update |
| `src/actions/task.ts` | Accept effortScore in action params |
| `src/components/tasks/task-form.tsx` | Add effort picker UI (1-5 dots/circles) |
| `src/components/tasks/task-card.tsx` | Display effort badge |

**New files in todoist:**

| File | Purpose |
|------|---------|
| `src/components/tasks/effort-picker.tsx` | Reusable 1-5 scale selector component |

**No cross-repo impact.** Pure Prisma schema + UI change.

### 2. Demo Workspace (todoist-only, architectural complexity)

**Architecture decision:** Demo mode uses hardcoded static data, not the database.

**How it works:**
1. A `/tasks/demo` route triggers demo mode
2. In demo mode, the sidebar and task views render from static JSON fixtures
3. All mutations are no-ops (with toast feedback: "Sign in to save changes")
4. No auth required, no database queries

**Key design choice:** Use `/tasks/demo` route rather than `?demo=true` query param. Query params get lost when navigating between pages with `<Link>` in the todoist app. A dedicated route with its own layout wrapper provides reliable demo context.

**New files in todoist:**

| File | Purpose |
|------|---------|
| `src/lib/demo-data.ts` | Static fixtures (workspace, projects, sections, tasks with effort scores, tags) |
| `src/app/tasks/demo/layout.tsx` | Demo layout provider, injects demo context |
| `src/app/tasks/demo/page.tsx` | Demo landing page |
| `src/app/tasks/demo/[projectId]/page.tsx` | Demo project view |
| `src/components/tasks/demo-banner.tsx` | "You're in demo mode" banner with CTA to sign up |

**Modified files in todoist:**

| File | Change |
|------|--------|
| `src/components/tasks/sidebar.tsx` | Accept optional `isDemo` prop, disable mutations |
| `src/components/tasks/task-card.tsx` | Accept optional `isDemo` prop, disable mutations |
| `src/components/tasks/task-form.tsx` | Accept optional `isDemo` prop, show toast on submit |

### 3. Help Tips (todoist-only, UI layer)

**Architecture:** Client-side tooltips/popovers triggered on first visit or via help icon. Dismissal state stored in `localStorage` (no server state needed).

**New files in todoist:**

| File | Purpose |
|------|---------|
| `src/components/ui/help-tip.tsx` | Tooltip/popover component with dismiss button |
| `src/lib/help-tips.ts` | Tip definitions (id, title, body, placement) |
| `src/hooks/use-dismissed-tips.ts` | localStorage hook for tracking dismissals |

**Modified files in todoist:**

| File | Change |
|------|--------|
| `src/components/tasks/sidebar.tsx` | Wrap "Add Workspace" button with help tip |
| `src/components/tasks/task-form.tsx` | Wrap effort picker with help tip |
| `src/components/tasks/task-card.tsx` | Wrap subtask area with help tip |

**No cross-repo impact.** Purely client-side UI enhancement.

### 4. Weekly Credit Gating (cross-repo, most complex)

**Architecture:** Mirror the envelopes billing pattern exactly.

#### In personal-brand (billing provider)

**New files:**

| File | Purpose |
|------|---------|
| `src/app/api/tasks/billing/access/route.ts` | GET endpoint, verifies auth, checks billing |
| `src/lib/tasks/billing.ts` | `checkTasksAccess(uid, email)` function (copy envelopes pattern) |
| `src/lib/tasks/types.ts` | `TasksBilling`, `TasksAccessResult` types |

**Modified files:**

| File | Change |
|------|--------|
| `src/lib/billing/tools.ts` | Add `todoist` to `TOOL_PRICING_SEED` |
| `src/data/apps.ts` | Add Todoist entry to apps listing |

**New Firestore collection:** `tasks_billing/{uid}` -- mirrors `envelope_billing/{uid}` structure:
```typescript
type TasksBilling = {
  uid: string;
  firstAccessWeekStart: string; // YYYY-MM-DD (Sunday of first-ever access)
  paidWeeks: Record<string, {
    usageId: string;
    creditsCharged: number;
    chargedAt: Timestamp;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

#### In todoist (billing consumer)

**New files:**

| File | Purpose |
|------|---------|
| `src/lib/billing.ts` | `checkBillingAccess(idToken)` calls personal-brand API |
| `src/lib/auth.ts` | Firebase Auth helpers (get current user, get ID token) |
| `src/lib/firebase-client.ts` | Firebase client SDK init (shared Firebase project config) |
| `src/context/AuthContext.tsx` | Auth context provider (same pattern as personal-brand) |
| `src/context/BillingContext.tsx` | Billing state context (mode, loading) |
| `src/components/auth/AuthGuard.tsx` | Sign-in gate (copy pattern from personal-brand) |
| `src/components/tasks/read-only-banner.tsx` | "Buy credits" banner (copy pattern from envelopes) |

**Modified files:**

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Wrap with auth provider |
| `src/app/tasks/layout.tsx` | Wrap with billing context, conditionally show ReadOnlyBanner |
| `src/actions/task.ts` | Add billing check before mutations |
| `src/actions/project.ts` | Add billing check |
| `src/actions/section.ts` | Add billing check |
| `src/actions/workspace.ts` | Add billing check |
| `src/components/tasks/task-form.tsx` | Disable submit when readonly |
| `src/components/tasks/sidebar.tsx` | Disable add workspace/project buttons when readonly |
| `src/components/tasks/add-task-button.tsx` | Disable when readonly |
| `src/components/tasks/add-section-button.tsx` | Disable when readonly |

#### Billing check in server actions: The auth token challenge

Server actions don't receive HTTP headers -- they get `(prevState, formData)`. The current todoist server actions have no access to the Firebase ID token.

**Solution: Billing check in the layout, not per-action**

Rather than checking billing on every server action call, check billing status once in the layout and pass it to components via context. The `BillingContext` provides `mode: "readwrite" | "readonly"` to all child components. Components disable their write UI when readonly.

**Server-side enforcement:** For true server-side write prevention, add a cookie-based approach:

1. Client sets an HTTP-only `__billing_token` cookie with the Firebase ID token on auth
2. Server actions read the cookie via `cookies()` from `next/headers`
3. Server actions call the billing check API with the token
4. If readonly, the server action returns `{ error: "Insufficient credits" }`

This keeps the server action pattern while enabling server-side auth/billing verification. The cookie approach avoids converting server actions to API routes.

---

## Patterns to Follow

### Pattern 1: Billing Access Check (from Envelopes)
**What:** Every write endpoint checks billing status before proceeding
**When:** Any mutation (create, update, delete) on todoist data
**Example:**
```typescript
// In todoist: src/lib/billing.ts
const PERSONAL_BRAND_URL = process.env.PERSONAL_BRAND_API_URL;

export async function checkTasksBillingAccess(
  idToken: string
): Promise<{ mode: "readwrite" | "readonly"; reason?: string }> {
  const res = await fetch(`${PERSONAL_BRAND_URL}/api/tasks/billing/access`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error("Billing check failed");
  return res.json();
}
```

### Pattern 2: ReadOnly UI Degradation (from Envelopes)
**What:** When billing returns `readonly`, disable all write UI but keep read access
**When:** User's free week is over and they have insufficient credits
**Example:**
```typescript
// In component:
const { billingMode } = useBilling();
const isReadOnly = billingMode === "readonly";

return (
  <>
    {isReadOnly && <ReadOnlyBanner />}
    <Button disabled={isReadOnly} onClick={handleCreate}>Add Task</Button>
  </>
);
```

### Pattern 3: Demo Data Provider
**What:** Dedicated route with static data, preventing any DB calls
**When:** User visits demo route without auth
**Example:**
```typescript
// src/app/tasks/demo/layout.tsx
import { DEMO_WORKSPACES, DEMO_TAGS } from "@/lib/demo-data";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar workspaces={DEMO_WORKSPACES} allTags={DEMO_TAGS} isDemo />
      <main className="flex-1 overflow-y-auto">
        <DemoBanner />
        {children}
      </main>
    </div>
  );
}
```

### Pattern 4: Apps Hub Entry (Static Data)
**What:** Add todoist to the apps listing in personal-brand
**When:** Todoist is deployed and accessible
**Example:**
```typescript
// In src/data/apps.ts
{
  slug: "todoist",
  title: "Task Manager",
  tag: "Productivity",
  subtitle: "Organize tasks with workspaces, projects, and effort scoring",
  description: "A Todoist-style task manager with workspaces, projects, sections, subtasks, tags, and effort scoring. Manage your work with board and list views.",
  href: "https://todoist.dan-weinbeck.com",
  launchedAt: "2026-02-XX",
  updatedAt: "2026-02-XX",
  techStack: ["Next.js", "PostgreSQL", "Prisma"],
  available: true,
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct Firestore Access from Todoist
**What:** Todoist importing Firebase Admin SDK and reading/writing billing collections directly
**Why bad:** Creates tight coupling between repos at the database level. Both repos would need Firebase Admin credentials. Schema changes in billing would break both apps simultaneously.
**Instead:** Todoist calls personal-brand's billing API via HTTP. Personal-brand owns the billing data exclusively.

### Anti-Pattern 2: Embedding Todoist as Pages in Personal-Brand
**What:** Moving todoist's pages/components into the personal-brand repo
**Why bad:** Different databases (PostgreSQL vs Firestore), different mutation patterns (server actions vs API routes), massive merge effort with high risk of breakage.
**Instead:** Keep as separate deployments. Link from Apps hub. Share auth via Firebase.

### Anti-Pattern 3: Demo Mode with Database Seed
**What:** Creating real database records for demo, then cleaning them up
**Why bad:** Cleanup complexity, orphaned data risk, requires database access in demo mode, security concerns with unauthenticated DB access.
**Instead:** Use purely in-memory/hardcoded demo data with zero database interaction.

### Anti-Pattern 4: Billing Check on Every Render
**What:** Calling the billing API on every page load or component render
**Why bad:** Adds latency to every navigation, unnecessary API calls (billing state changes at most once per week).
**Instead:** Check billing once in the layout, cache the result in React context for the session. The `checkTasksAccess()` function uses idempotency keys (weekly), so repeated calls within the same week are fast (Firestore cache hit), but avoiding the call entirely is better for UX.

---

## New vs Modified Components Summary

### personal-brand repo (5 files touched)

| Type | File | Status |
|------|------|--------|
| API Route | `src/app/api/tasks/billing/access/route.ts` | NEW |
| Lib | `src/lib/tasks/billing.ts` | NEW |
| Lib | `src/lib/tasks/types.ts` | NEW |
| Data | `src/data/apps.ts` | MODIFIED (add todoist entry) |
| Lib | `src/lib/billing/tools.ts` | MODIFIED (add todoist pricing seed) |

### todoist repo (30+ files touched)

| Type | File | Status |
|------|------|--------|
| Schema | `prisma/schema.prisma` | MODIFIED (add effortScore) |
| Lib | `src/lib/billing.ts` | NEW |
| Lib | `src/lib/auth.ts` | NEW |
| Lib | `src/lib/firebase-client.ts` | NEW |
| Lib | `src/lib/demo-data.ts` | NEW |
| Lib | `src/lib/help-tips.ts` | NEW |
| Context | `src/context/AuthContext.tsx` | NEW |
| Context | `src/context/BillingContext.tsx` | NEW |
| Hook | `src/hooks/use-dismissed-tips.ts` | NEW |
| Component | `src/components/auth/AuthGuard.tsx` | NEW |
| Component | `src/components/tasks/effort-picker.tsx` | NEW |
| Component | `src/components/tasks/read-only-banner.tsx` | NEW |
| Component | `src/components/tasks/demo-banner.tsx` | NEW |
| Component | `src/components/ui/help-tip.tsx` | NEW |
| Page | `src/app/tasks/demo/layout.tsx` | NEW |
| Page | `src/app/tasks/demo/page.tsx` | NEW |
| Page | `src/app/tasks/demo/[projectId]/page.tsx` | NEW |
| Layout | `src/app/layout.tsx` | MODIFIED (auth provider) |
| Layout | `src/app/tasks/layout.tsx` | MODIFIED (billing context, ReadOnlyBanner) |
| Service | `src/services/task.service.ts` | MODIFIED (effortScore in queries) |
| Schema | `src/lib/schemas/task.ts` | MODIFIED (effortScore field) |
| Action | `src/actions/task.ts` | MODIFIED (effortScore + billing check) |
| Action | `src/actions/project.ts` | MODIFIED (billing check) |
| Action | `src/actions/section.ts` | MODIFIED (billing check) |
| Action | `src/actions/workspace.ts` | MODIFIED (billing check) |
| Component | `src/components/tasks/task-form.tsx` | MODIFIED (effort picker, readonly, help tips) |
| Component | `src/components/tasks/task-card.tsx` | MODIFIED (effort display, readonly, help tips) |
| Component | `src/components/tasks/sidebar.tsx` | MODIFIED (readonly, demo, help tips) |
| Component | `src/components/tasks/add-task-button.tsx` | MODIFIED (readonly) |
| Component | `src/components/tasks/add-section-button.tsx` | MODIFIED (readonly) |

---

## Suggested Build Order

The build order is driven by dependency chains. Some features are independent; others depend on foundational work.

### Phase 1: Effort Scoring (todoist-only, zero dependencies)

**Rationale:** Pure schema + UI change. No cross-repo work. No auth required. Can be built and tested independently. Establishes the pattern for schema migrations.

Build steps:
1. Add `effortScore Int?` to Prisma schema, run migration
2. Update task schemas, services, and actions
3. Build `effort-picker.tsx` component
4. Integrate into `task-form.tsx` (create + edit)
5. Display effort badge in `task-card.tsx`

### Phase 2: Demo Workspace (todoist-only, depends on Phase 1)

**Rationale:** Depends on Phase 1 because demo data should showcase effort scoring. No auth or billing needed. Builds the demo infrastructure that helps users discover the app before signing up.

Build steps:
1. Create `demo-data.ts` with realistic fixtures (including effort scores)
2. Create demo route structure under `/tasks/demo`
3. Create `demo-banner.tsx` with sign-up CTA
4. Modify sidebar and components to accept demo props
5. Disable all mutations in demo mode

### Phase 3: Help Tips (todoist-only, depends on Phase 1)

**Rationale:** Can run in parallel with Phase 2. Depends on Phase 1 because effort picker needs a help tip. Pure client-side, no server changes.

Build steps:
1. Build `help-tip.tsx` component (tooltip with dismiss)
2. Define tip content in `help-tips.ts`
3. Build `use-dismissed-tips.ts` hook (localStorage)
4. Integrate tips into sidebar, task form, effort picker

### Phase 4: Auth + Billing Integration (cross-repo, most complex)

**Rationale:** Depends on Phases 1-3 being stable because this phase touches nearly every component. The app needs to be feature-complete before adding the billing gate.

**Sub-phase 4a: Auth setup (todoist)**
1. Add Firebase client SDK to todoist (same Firebase project)
2. Create `firebase-client.ts`, `AuthContext.tsx`, `AuthGuard.tsx`
3. Wrap todoist layout with auth provider

**Sub-phase 4b: Billing API (personal-brand)**
1. Add `todoist` to tool pricing seed
2. Create `tasks/billing.ts` with `checkTasksAccess()`
3. Create `tasks/types.ts` with billing types
4. Create API route `GET /api/tasks/billing/access`

**Sub-phase 4c: Billing integration (todoist)**
1. Create `billing.ts` that calls personal-brand API
2. Create `BillingContext.tsx`
3. Add billing check to server actions (cookie-based token)
4. Add `ReadOnlyBanner` component
5. Disable write UI when readonly

### Phase 5: Apps Hub Entry (personal-brand, trivial)

**Rationale:** Last because the todoist app needs to be deployed and fully functional before listing it.

Build steps:
1. Add todoist entry to `src/data/apps.ts`
2. Add "Productivity" tag color to `AppCard.tsx` tagColors map

### Phase Ordering Rationale

- **Phase 1 first:** Zero dependencies, establishes the Prisma migration pattern, and creates the effort scoring feature that Phase 2 needs in demo data.
- **Phases 2 and 3 in parallel:** Both depend only on Phase 1. Demo workspace and help tips are independent of each other.
- **Phase 4 last (before hub entry):** Auth and billing touch nearly every file. Building on a stable, feature-complete app reduces integration risk. Also, billing is the most complex feature requiring cross-repo coordination.
- **Phase 5 after Phase 4:** Cannot list the app until it is deployed with auth and billing.

---

## Scalability Considerations

| Concern | Current Scale | At 100 Users | Notes |
|---------|--------------|--------------|-------|
| Billing API calls | 0 | ~100/week | One debit per user per week (idempotent). Cached in Firestore after first check. |
| PostgreSQL connections | 1 user | 100 users | Prisma connection pool handles this. Add PgBouncer if needed later. |
| Cross-origin latency | N/A | ~50-100ms per billing check | Only on first access each week. Subsequent checks hit Firestore cache. |
| Demo mode | No DB load | No DB load | Static data, zero database impact regardless of traffic. |
| Help tips | localStorage | localStorage | No server cost. Works offline. |

---

## Sources

- Direct codebase analysis of `/Users/dweinbeck/Documents/personal-brand/` (HIGH confidence)
- Direct codebase analysis of `/Users/dweinbeck/Documents/todoist/` (HIGH confidence)
- Envelopes billing pattern: `src/lib/envelopes/billing.ts`, `src/app/api/envelopes/route.ts` (HIGH confidence)
- Auth pattern: `src/lib/auth/user.ts`, `src/components/auth/AuthGuard.tsx` (HIGH confidence)
- Apps hub: `src/data/apps.ts`, `src/components/apps/AppCard.tsx` (HIGH confidence)
- Todoist task service: `src/services/task.service.ts` (HIGH confidence)
- Todoist Prisma schema: `prisma/schema.prisma` (HIGH confidence)
- Todoist server actions: `src/actions/task.ts`, `src/actions/workspace.ts` (HIGH confidence)
