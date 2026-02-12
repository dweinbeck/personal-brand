# Phase 34: Weekly Credit Gating - Research

**Researched:** 2026-02-12
**Domain:** Cross-repo billing integration (personal-brand + todoist), weekly credit gating, read-only degradation
**Confidence:** HIGH

## Summary

Phase 34 integrates weekly credit gating into the todoist task management app, following the exact same pattern already proven by the Digital Envelopes app (Phase 6 billing, `src/lib/envelopes/billing.ts`). The envelopes billing implementation is a near-perfect template: it uses `checkEnvelopeAccess()` with free week detection, idempotent weekly charging via `debitForToolUse()`, 402 responses on mutations when in read-only mode, and a `ReadOnlyBanner` component with a "Buy Credits" CTA.

The key architectural difference is that envelopes lives inside personal-brand (uses API routes with `verifyUser(request)` from Authorization headers), while todoist is a separate Next.js service that uses server actions with `verifyUser(idToken)` where the token is passed explicitly as the first parameter. The billing check for todoist needs a new API route in personal-brand (`/api/billing/tasks/access`) that the todoist server actions can call cross-origin, plus a billing guard within todoist's server actions that returns `{ error: "...", code: 402 }` when the user is in read-only mode.

**Primary recommendation:** Create a `checkTasksAccess()` function in personal-brand (mirroring `checkEnvelopeAccess()`) exposed via a new API route, then add a billing guard helper in todoist that all mutation server actions call. Use the existing `tasks_billing` Firestore collection pattern (parallel to `envelope_billing`).

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase-admin | existing | Firestore billing docs, server-side token verification | Already used in both repos |
| date-fns | existing | `startOfWeek()`, `format()` for week boundary calculations | Already used in envelopes billing |
| zod | v4 | Schema validation for billing API request/response | Already used throughout |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| swr | existing | Client-side billing status caching in todoist | For billing status polling |

### No New Dependencies Required
This phase requires zero new npm packages. Everything needed is already installed in both repos.

## Architecture Patterns

### Recommended Structure -- personal-brand repo

```
src/
  lib/
    billing/
      tasks.ts                    # checkTasksAccess() -- mirrors envelopes/billing.ts
      tools.ts                    # Add tasks_app to TOOL_PRICING_SEED
  app/
    api/
      billing/
        tasks/
          access/
            route.ts              # GET /api/billing/tasks/access -- returns access mode
  data/
    apps.ts                       # Add tasks app entry
  app/
    sitemap.ts                    # Add tasks app URL
```

### Recommended Structure -- todoist repo

```
src/
  lib/
    billing.ts                    # checkBillingAccess() -- calls personal-brand API
  components/
    billing/
      ReadOnlyBanner.tsx          # "Buy Credits" CTA banner
      FreeWeekBanner.tsx          # Free trial week info banner
  actions/
    task.ts                       # Add billing guard to all mutation actions
    project.ts                    # Add billing guard to all mutation actions
    section.ts                    # Add billing guard to all mutation actions
    workspace.ts                  # Add billing guard to all mutation actions
    tag.ts                        # Add billing guard to all mutation actions
```

### Pattern 1: Weekly Access Check (from envelopes -- proven pattern)
**What:** A function that determines read-write or read-only access based on billing state
**When to use:** On every request that returns data (GET) or mutates data (POST/PUT/DELETE)
**Example:**
```typescript
// Source: src/lib/envelopes/billing.ts (existing implementation)
export async function checkTasksAccess(
  uid: string,
  email: string,
): Promise<TasksAccessResult> {
  const currentWeekStart = format(
    startOfWeek(new Date(), { weekStartsOn: 0 }),
    "yyyy-MM-dd",
  );

  // 1. Get-or-create billing doc in tasks_billing/{uid}
  // 2. If firstAccessWeekStart === currentWeekStart -> readwrite (free_week)
  // 3. If paidWeeks[currentWeekStart] exists -> readwrite (already_paid)
  // 4. Attempt debitForToolUse({ toolKey: "tasks_app", idempotencyKey: `tasks_week_${currentWeekStart}` })
  //    - Success -> record in paidWeeks, return readwrite
  //    - 402 -> return readonly
  //    - Tool config error -> return readonly (graceful degradation)
}
```

### Pattern 2: Server Action Billing Guard (new pattern for todoist)
**What:** A helper that mutation server actions call to check billing before proceeding
**When to use:** At the top of every mutation action (create, update, delete) in todoist
**Example:**
```typescript
// todoist: src/lib/billing.ts
const BILLING_API_URL = process.env.BILLING_API_URL; // e.g., https://dan-weinbeck.com

export async function checkBillingAccess(idToken: string): Promise<{
  mode: "readwrite" | "readonly";
  reason?: "free_week" | "unpaid";
}> {
  const res = await fetch(`${BILLING_API_URL}/api/billing/tasks/access`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error("Billing check failed");
  return res.json();
}

// todoist: src/actions/task.ts
export async function createTaskAction(idToken: string, data: {...}) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  if (billing.mode === "readonly") {
    return { error: "Insufficient credits", code: 402 };
  }

  // ... proceed with task creation
}
```

### Pattern 3: Billing Status in Layout/Page Data (envelopes pattern)
**What:** Every data-fetching response includes `billing: { mode, reason }` so the UI can conditionally render
**When to use:** In the todoist tasks layout to determine whether to show banners and disable mutations
**Example:**
```typescript
// The tasks layout or a client-side hook fetches billing status
// Then passes it down via context or props
const isReadOnly = billingStatus?.mode === "readonly";
const isFreeWeek = billingStatus?.reason === "free_week";
```

### Pattern 4: Idempotent Weekly Charging
**What:** Use `tasks_week_<weekStart>` as the idempotency key so a user is never double-charged for the same week
**When to use:** In `checkTasksAccess()` when calling `debitForToolUse()`
**Example:**
```typescript
// Source: src/lib/envelopes/billing.ts line 111
const result = await debitForToolUse({
  uid,
  email,
  toolKey: "tasks_app",
  idempotencyKey: `tasks_week_${currentWeekStart}`,
});
```

### Anti-Patterns to Avoid
- **Client-side billing enforcement only:** NEVER rely solely on `isReadOnly` in React to disable mutations. The server MUST return 402 for all mutation endpoints when in read-only mode. Client-side is UX polish; server-side is the security gate.
- **Checking billing per-action instead of per-week:** The check should happen once per week and cache the result in Firestore. Do not debit on every single API call.
- **Sharing the envelopes billing collection:** Create a separate `tasks_billing` collection, not reusing `envelope_billing`. Each app tracks its own billing lifecycle.
- **Hard-coding the personal-brand URL:** Use an environment variable (`BILLING_API_URL`) in the todoist repo so it works in dev and production.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Week boundary calculation | Custom date math | `date-fns` `startOfWeek()` + `format()` | Timezone edge cases, DST handling |
| Idempotent charging | Custom dedup logic | Existing `debitForToolUse()` with idempotency key | Already handles Firestore transactions, race conditions |
| Credit balance checking | Direct Firestore reads | Existing `debitForToolUse()` 402 error path | Atomic balance check + debit in single transaction |
| Token verification in API route | Custom JWT parsing | Existing `verifyUser(request)` from `@/lib/auth/user` | Already handles all edge cases |
| Billing status caching | Custom cache | `paidWeeks` map in Firestore billing doc | Already proven pattern in envelopes |

**Key insight:** The entire billing infrastructure exists. This phase is integration work, not infrastructure work. The only new logic is the `checkTasksAccess()` function (which is 95% identical to `checkEnvelopeAccess()`) and the billing guard in todoist's server actions.

## Common Pitfalls

### Pitfall 1: Cross-Origin Server-to-Server Calls
**What goes wrong:** todoist server actions call personal-brand billing API, but CORS blocks the request
**Why it happens:** Server actions run on the server, so CORS is irrelevant. But if someone tries to call the billing API from the client side, CORS will block it.
**How to avoid:** Always call the billing API from server actions (server-to-server), never from the browser. The todoist `checkBillingAccess()` must be a server-only function.
**Warning signs:** CORS errors in browser console, or `"use server"` directive missing.

### Pitfall 2: Week Boundary Mismatch
**What goes wrong:** personal-brand and todoist calculate week boundaries differently, leading to billing desync
**Why it happens:** Different `weekStartsOn` values or timezone handling between repos
**How to avoid:** Use `weekStartsOn: 0` (Sunday) consistently. The billing API in personal-brand is the single source of truth -- todoist should never calculate week boundaries for billing purposes.
**Warning signs:** User gets charged twice in one week, or free week doesn't work.

### Pitfall 3: Server Action Error Format Mismatch
**What goes wrong:** Todoist server actions currently return `{ error: "Unauthorized" }` for auth failures but need a new pattern for 402 billing failures
**Why it happens:** The existing `{ error: string }` return type doesn't distinguish auth failures from billing failures
**How to avoid:** Add a `code` field to the error response: `{ error: "Insufficient credits", code: 402 }`. The client can then check `result.code === 402` to show the ReadOnlyBanner.
**Warning signs:** Client can't distinguish "not logged in" from "no credits".

### Pitfall 4: Billing Check Performance
**What goes wrong:** Every server action makes a cross-service HTTP call to check billing, adding latency
**Why it happens:** The todoist server action calls personal-brand API on every mutation
**How to avoid:** The billing check is inherently fast because `checkTasksAccess()` short-circuits on: (a) free week match, or (b) `paidWeeks` cache hit. Only the first mutation of the week incurs a debit transaction. Subsequent calls just read the Firestore doc. Consider caching the billing status in the todoist layout server component and passing it to client components.
**Warning signs:** Noticeable delay on every task create/update/delete.

### Pitfall 5: Token Forwarding
**What goes wrong:** The todoist server action has the user's Firebase ID token, but it expires or isn't properly forwarded to the personal-brand billing API
**Why it happens:** ID tokens expire after 1 hour; the server action receives the token from the client
**How to avoid:** The token received by the server action is fresh (client refreshes it automatically via `onIdTokenChanged`). Forward it directly in the `Authorization: Bearer <token>` header to the billing API. The personal-brand API uses `verifyUser(request)` which validates the token.
**Warning signs:** 401 errors from billing API, especially after user has been idle.

### Pitfall 6: Missing Tool Pricing Entry
**What goes wrong:** `checkTasksAccess()` tries to debit for `tasks_app` but the pricing entry doesn't exist in Firestore
**Why it happens:** The `TOOL_PRICING_SEED` is updated in code but not seeded to production Firestore
**How to avoid:** Add `tasks_app` to `TOOL_PRICING_SEED` in `src/lib/billing/tools.ts` AND manually seed production via the admin pricing API, or ensure `seedToolPricing()` runs on deploy. The `checkTasksAccess()` function should gracefully degrade to readonly if the tool is unknown (just like envelopes does).
**Warning signs:** All users get read-only mode even with credits.

## Code Examples

### Example 1: tasks_billing Firestore Document Shape
```typescript
// Source: Modeled after src/lib/envelopes/types.ts EnvelopeBilling
type TasksBilling = {
  uid: string;
  firstAccessWeekStart: string; // "2026-02-09" (YYYY-MM-DD, Sunday)
  paidWeeks: Record<string, {
    usageId: string;
    creditsCharged: number;
    chargedAt: Timestamp;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type TasksAccessResult =
  | { mode: "readwrite"; weekStart: string; reason?: "free_week" }
  | { mode: "readonly"; weekStart: string; reason: "unpaid" };
```

### Example 2: Billing API Route (personal-brand)
```typescript
// Source: Modeled after src/app/api/envelopes/route.ts GET handler
// GET /api/billing/tasks/access
export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const access = await checkTasksAccess(auth.uid, auth.email);
    return Response.json({
      mode: access.mode,
      reason: "reason" in access ? access.reason : undefined,
      weekStart: access.weekStart,
    });
  } catch (error) {
    console.error("GET /api/billing/tasks/access error:", error);
    return Response.json(
      { error: "Failed to check tasks access." },
      { status: 500 },
    );
  }
}
```

### Example 3: Billing Guard Helper (todoist)
```typescript
// todoist: src/lib/billing.ts
import "server-only";

const BILLING_API_URL = process.env.BILLING_API_URL;

export type BillingStatus = {
  mode: "readwrite" | "readonly";
  reason?: "free_week" | "unpaid";
  weekStart: string;
};

export async function checkBillingAccess(
  idToken: string,
): Promise<BillingStatus> {
  if (!BILLING_API_URL) {
    console.warn("BILLING_API_URL not set -- defaulting to readwrite");
    return { mode: "readwrite", weekStart: "" };
  }

  const res = await fetch(`${BILLING_API_URL}/api/billing/tasks/access`, {
    headers: { Authorization: `Bearer ${idToken}` },
    next: { revalidate: 0 }, // no cache -- billing must be fresh
  });

  if (!res.ok) {
    console.error(`Billing check failed: ${res.status}`);
    // Graceful degradation: allow access if billing service is down
    return { mode: "readwrite", weekStart: "" };
  }

  return res.json();
}
```

### Example 4: Mutation Action with Billing Guard (todoist)
```typescript
// todoist: src/actions/task.ts (modified)
export async function createTaskAction(idToken: string, data: {...}) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  if (billing.mode === "readonly") {
    return { error: "Insufficient credits. Purchase credits to continue.", code: 402 };
  }

  // ... existing logic unchanged
}
```

### Example 5: ReadOnlyBanner (todoist)
```typescript
// Source: Modeled after src/components/envelopes/ReadOnlyBanner.tsx
"use client";

export function ReadOnlyBanner({ buyCreditsUrl }: { buyCreditsUrl: string }) {
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <p className="font-semibold">Read-Only Mode</p>
      <p className="mt-1">
        Your free week has ended. Purchase credits to continue creating, editing,
        and deleting tasks.
      </p>
      <a
        href={buyCreditsUrl}
        className="mt-2 inline-block font-medium text-amber-900 underline hover:no-underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Buy Credits
      </a>
    </div>
  );
}
```

### Example 6: FreeWeekBanner (todoist)
```typescript
"use client";

export function FreeWeekBanner() {
  return (
    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      <p className="font-semibold">Free Trial Week</p>
      <p className="mt-1">
        Welcome! You have free access this week. After your free week ends,
        task management costs 100 credits/week ($1/week).
      </p>
    </div>
  );
}
```

### Example 7: Apps Hub Entry
```typescript
// Source: src/data/apps.ts (add to getApps array)
{
  slug: "tasks",
  title: "Task Manager",
  tag: "Productivity",
  subtitle: "Organize projects, tasks, and tags",
  description:
    "Full-featured task management with workspaces, projects, sections, tags, subtasks, and board views. Built with a standalone PostgreSQL backend.",
  href: "https://todoist-<hash>.run.app", // deployed todoist URL (env var or hardcoded)
  launchedAt: "2026-02-12",
  updatedAt: "2026-02-12",
  techStack: ["Next.js", "PostgreSQL", "Prisma", "Firebase Auth"],
  available: true,
},
```

### Example 8: Tool Pricing Seed Entry
```typescript
// Source: src/lib/billing/tools.ts (add to TOOL_PRICING_SEED)
{
  toolKey: "tasks_app",
  label: "Task Manager (Weekly)",
  active: true,
  creditsPerUse: 100,
  costToUsCentsEstimate: 0, // no external API cost, just hosting
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Envelopes billing inside personal-brand | Cross-repo billing via API route | Phase 34 (now) | First cross-service billing integration |
| Server actions without billing guard | Server actions with billing guard | Phase 34 (now) | All todoist mutations gated by credits |

**Key difference from envelopes:** Envelopes API routes call `checkEnvelopeAccess()` directly (same process). Todoist server actions must call personal-brand via HTTP. This is the first cross-service billing integration in the project.

## Open Questions

1. **Todoist Deployed URL**
   - What we know: The todoist app needs to be deployed to Cloud Run (or similar) before it can be linked from the /apps page.
   - What's unclear: Whether the todoist app is already deployed or needs deployment as part of this phase.
   - Recommendation: Use a placeholder URL or environment variable for the href. The apps entry can be added with `available: false` if not yet deployed.

2. **Graceful Degradation When Billing Service Is Down**
   - What we know: The envelopes app falls back to readonly when tool config is missing. The todoist billing check could also fail if personal-brand is unreachable.
   - What's unclear: Should todoist default to readwrite or readonly when the billing API is unreachable?
   - Recommendation: Default to **readwrite** when billing is unreachable (favor user experience over revenue protection). Log warnings. This matches the envelopes pattern for tool config errors but is more permissive since it's a network failure, not a config error.

3. **Billing Status Caching in todoist Layout**
   - What we know: The todoist tasks layout is a server component that fetches workspaces/tags. It could also fetch billing status and pass it down.
   - What's unclear: Whether to fetch billing status in the layout (server component) or in each page (client component).
   - Recommendation: Fetch billing status in the layout server component using `getUserIdFromCookie()` token, pass it via a BillingProvider context. This avoids duplicate billing checks and ensures the banner shows immediately on page load.

4. **Where "Buy Credits" Links To**
   - What we know: The envelopes ReadOnlyBanner links to `/billing` which is a page on personal-brand.
   - What's unclear: Since todoist is a separate domain, the "Buy Credits" link needs to cross domains.
   - Recommendation: Link to `https://dan-weinbeck.com/billing` (the personal-brand billing page). Use `target="_blank"` since it's a different origin. Set the URL via `BILLING_URL` environment variable.

## Sources

### Primary (HIGH confidence)
- `src/lib/envelopes/billing.ts` -- Complete reference implementation of weekly credit gating with free week, idempotent charging, and graceful degradation
- `src/lib/billing/firestore.ts` -- Core billing functions: `debitForToolUse()`, `ensureBillingUser()`, `getBalance()`
- `src/lib/billing/tools.ts` -- Tool pricing seed data with `TOOL_PRICING_SEED` array
- `src/lib/billing/types.ts` -- All billing type definitions, Zod schemas
- `src/lib/envelopes/types.ts` -- `EnvelopeBilling`, `EnvelopeAccessResult`, `BillingStatus` types
- `src/app/api/envelopes/route.ts` -- Reference for how GET returns billing status and POST checks readonly
- `src/app/api/envelopes/[envelopeId]/route.ts` -- Reference for PUT/DELETE 402 pattern
- `src/components/envelopes/ReadOnlyBanner.tsx` -- Reference UI component
- `src/components/envelopes/EnvelopesHomePage.tsx` -- Reference for `isReadOnly` UI gating pattern
- `src/data/apps.ts` -- `AppListing` type and existing app entries
- `src/app/sitemap.ts` -- Current sitemap structure

### Todoist Repo (HIGH confidence)
- `src/actions/task.ts` -- All 5 mutation actions: create, update, delete, toggle, assignToSection
- `src/actions/project.ts` -- 3 mutation actions: create, update, delete
- `src/actions/section.ts` -- 3 mutation actions: create, update, delete
- `src/actions/workspace.ts` -- 3 mutation actions: create, update, delete
- `src/actions/tag.ts` -- 3 mutation actions: create, update, delete
- `src/lib/auth.ts` -- `verifyUser(idToken)` returns `string | null` (uid)
- `src/context/AuthContext.tsx` -- Client auth provider with `useAuth()` hook
- `src/app/tasks/layout.tsx` -- Server component layout using `getUserIdFromCookie()`

### Test References (HIGH confidence)
- `src/lib/billing/__tests__/credits.test.ts` -- Tool pricing seed tests, idempotency key format tests
- `src/lib/billing/__tests__/types.test.ts` -- Billing schema validation tests

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already in use, no new dependencies
- Architecture: HIGH -- Exact reference implementation exists in envelopes billing
- Pitfalls: HIGH -- Identified from analyzing real code differences between repos
- Cross-repo integration: MEDIUM -- First time doing cross-service billing, some unknowns around deployment URL and degradation behavior

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (stable -- billing infrastructure is mature)

---

## Appendix: Complete Inventory of Todoist Mutation Actions

All server actions that need billing guards (17 total):

| File | Action | Mutation Type |
|------|--------|---------------|
| `src/actions/task.ts` | `createTaskAction` | Create |
| `src/actions/task.ts` | `updateTaskAction` | Update |
| `src/actions/task.ts` | `deleteTaskAction` | Delete |
| `src/actions/task.ts` | `toggleTaskAction` | Update (status toggle) |
| `src/actions/task.ts` | `assignTaskToSectionAction` | Update |
| `src/actions/project.ts` | `createProjectAction` | Create |
| `src/actions/project.ts` | `updateProjectAction` | Update |
| `src/actions/project.ts` | `deleteProjectAction` | Delete |
| `src/actions/section.ts` | `createSectionAction` | Create |
| `src/actions/section.ts` | `updateSectionAction` | Update |
| `src/actions/section.ts` | `deleteSectionAction` | Delete |
| `src/actions/workspace.ts` | `createWorkspaceAction` | Create |
| `src/actions/workspace.ts` | `updateWorkspaceAction` | Update |
| `src/actions/workspace.ts` | `deleteWorkspaceAction` | Delete |
| `src/actions/tag.ts` | `createTagAction` | Create |
| `src/actions/tag.ts` | `updateTagAction` | Update |
| `src/actions/tag.ts` | `deleteTagAction` | Delete |

All follow the same pattern: `verifyUser(idToken)` then proceed. The billing guard inserts between auth check and business logic.
