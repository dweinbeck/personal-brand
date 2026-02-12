---
phase: 34-weekly-credit-gating
verified: 2026-02-12T08:45:00Z
status: passed
score: 5/5
---

# Phase 34: Weekly Credit Gating Verification Report

**Phase Goal:** Tasks app access is gated by weekly credits with graceful degradation to read-only mode
**Verified:** 2026-02-12T08:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User's first week of tasks access is free from their first access timestamp | ✓ VERIFIED | checkTasksAccess() returns `{mode: "readwrite", reason: "free_week"}` when `firstAccessWeekStart === currentWeekStart` (tasks.ts:113-119); unit test "returns readwrite with free_week reason for first-ever access" passes |
| 2 | After the free week, user is charged 100 credits/week and retains read-write access while credits remain | ✓ VERIFIED | checkTasksAccess() calls debitForToolUse with `tasks_app` tool (100 credits) after free week (tasks.ts:128-144); unit test "returns readwrite after successful charge" passes; TOOL_PRICING_SEED has `tasks_app` at 100 credits, active: true (tools.ts:35) |
| 3 | When credits are insufficient, user sees all data but cannot create, edit, or delete anything -- a ReadOnlyBanner with "Buy Credits" CTA is shown | ✓ VERIFIED | checkTasksAccess() returns `{mode: "readonly", reason: "unpaid"}` on 402 error (tasks.ts:150-158); ReadOnlyBanner component exists with amber styling and "Buy Credits" external link (ReadOnlyBanner.tsx); layout conditionally renders ReadOnlyBanner when `billing.mode === "readonly"` (layout.tsx:62-68) |
| 4 | Server returns 402 on all mutation endpoints when user is in read-only mode (client-side bypass is impossible) | ✓ VERIFIED | All 17 mutation actions (5 task, 3 project, 3 section, 3 workspace, 3 tag) call `checkBillingAccess(idToken)` → `billingGuard(billing)` → return `{error, code: 402}` before business logic (billing.ts:37-47, task.ts:31-33); 17 mutation functions confirmed with exports grep; 5 billing checks in task.ts confirmed |
| 5 | Tasks app appears on the /apps page with correct metadata and links to the deployed todoist URL | ✓ VERIFIED | getApps() includes entry with `slug: "tasks"`, title "Task Manager", tag "Productivity", techStack ["Next.js", "PostgreSQL", "Prisma", "Firebase Auth"], `available: true`, href using TASKS_APP_URL env var (apps.ts:43-53) |

**Score:** 5/5 truths verified

### Required Artifacts

#### Plan 01: Billing API (personal-brand repo)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/billing/tasks.ts` | checkTasksAccess() function mirroring checkEnvelopeAccess() | ✓ VERIFIED | 179 lines; exports TasksBilling, TasksAccessResult types; checkTasksAccess() with 7-step logic (get-or-create doc, free week check, already-paid check, charge attempt, 402 handling, tool config error handling, re-throw); imports debitForToolUse, db, date-fns |
| `src/app/api/billing/tasks/access/route.ts` | GET endpoint for cross-service billing check | ✓ VERIFIED | 26 lines; exports GET handler; calls verifyUser(), checkTasksAccess(), returns JSON `{mode, reason, weekStart}`; error handling with 500 response |
| `src/lib/billing/tools.ts` | tasks_app tool pricing seed entry | ✓ VERIFIED | TOOL_PRICING_SEED contains `{toolKey: "tasks_app", label: "Task Manager (Weekly)", active: true, creditsPerUse: 100, costToUsCentsEstimate: 0}` at line 35 |

#### Plan 02: Billing Guards and UI (todoist repo)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `todoist:src/lib/billing.ts` | checkBillingAccess() server-only function | ✓ VERIFIED | 48 lines; exports BillingStatus type, checkBillingAccess() (fetches personal-brand API with Bearer token), billingGuard() (returns 402 error on readonly); graceful degradation on fetch error or missing BILLING_API_URL |
| `todoist:src/components/billing/ReadOnlyBanner.tsx` | Amber banner with Buy Credits link | ✓ VERIFIED | 22 lines; "use client"; amber-50 bg, amber-800 text, "Read-Only Mode" header, "Purchase credits to continue" message, external link with amber-900 underline |
| `todoist:src/components/billing/FreeWeekBanner.tsx` | Emerald banner explaining free week | ✓ VERIFIED | 14 lines; "use client"; emerald-50 bg, emerald-800 text, "Free Trial Week" header, "100 credits/week ($1/week)" messaging |
| `todoist:src/components/billing/BillingProvider.tsx` | Client-side context for billing status | ✓ VERIFIED | 27 lines; "use client"; exports BillingContext, BillingProvider, useBilling() hook; BillingContextValue type with mode/reason |
| `todoist:src/actions/task.ts` | 5 billing guards on mutations | ✓ VERIFIED | 5 billing checks confirmed (createTaskAction, updateTaskAction, deleteTaskAction, toggleTaskAction, assignTaskToSectionAction); billingGuard call between verifyUser and business logic in all 5 |
| `todoist:src/actions/project.ts` | 3 billing guards on mutations | ✓ VERIFIED | 4 billingGuard calls detected (includes multiple code paths) |
| `todoist:src/actions/section.ts` | 3 billing guards on mutations | ✓ VERIFIED | 4 billingGuard calls detected |
| `todoist:src/actions/workspace.ts` | 3 billing guards on mutations | ✓ VERIFIED | 4 billingGuard calls detected |
| `todoist:src/actions/tag.ts` | 3 billing guards on mutations | ✓ VERIFIED | 4 billingGuard calls detected |
| `todoist:src/app/tasks/layout.tsx` | Billing fetch and banner rendering | ✓ VERIFIED | 77 lines; imports checkBillingAccess, BillingProvider, banners; Promise.all fetches billing with token; BillingProvider wraps layout; conditional ReadOnlyBanner (line 62-68) and FreeWeekBanner (line 69) |

#### Plan 03: Apps Hub and Tests (personal-brand repo)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/data/apps.ts` | Tasks app listing entry | ✓ VERIFIED | Entry at line 43-53 with slug "tasks", title "Task Manager", tag "Productivity", subtitle, description, href (TASKS_APP_URL env var), launchedAt/updatedAt 2026-02-12, techStack array, available: true |
| `src/lib/billing/__tests__/tasks-access.test.ts` | Unit tests for checkTasksAccess logic | ✓ VERIFIED | 6 test cases: free week, already paid, successful charge, insufficient credits (402), tool config error, idempotency key format; uses Firestore mocks; all tests pass |
| `src/lib/billing/__tests__/credits.test.ts` | Updated tool pricing tests including tasks_app | ✓ VERIFIED | Updated activeKeys array to include "tasks_app"; new test "tasks_app is priced at 100 credits (weekly)" verifies active, 100 credits, 0 cost; all 11 tests pass |

### Key Link Verification

#### Cross-Repo Links

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `todoist:src/lib/billing.ts` | `personal-brand:GET /api/billing/tasks/access` | fetch with Bearer token | ✓ WIRED | Line 20: `fetch(\`${billingApiUrl}/api/billing/tasks/access\`, {headers: {Authorization: \`Bearer ${idToken}\`}})` |
| `personal-brand:src/app/api/billing/tasks/access/route.ts` | `src/lib/billing/tasks.ts` | import checkTasksAccess | ✓ WIRED | Line 2: `import { checkTasksAccess } from "@/lib/billing/tasks"`; line 9 calls it |
| `personal-brand:src/lib/billing/tasks.ts` | `src/lib/billing/firestore.ts` | debitForToolUse | ✓ WIRED | Line 3: `import { debitForToolUse } from "@/lib/billing/firestore"`; line 128 calls it with tasks_app tool key and idempotency key |

#### Todoist Internal Links

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `todoist:src/actions/task.ts` | `src/lib/billing.ts` | import checkBillingAccess, billingGuard | ✓ WIRED | Line 5: import; 5 actions call checkBillingAccess → billingGuard |
| `todoist:src/actions/project.ts` | `src/lib/billing.ts` | import checkBillingAccess, billingGuard | ✓ WIRED | Import + 3 mutation guards |
| `todoist:src/actions/section.ts` | `src/lib/billing.ts` | import checkBillingAccess, billingGuard | ✓ WIRED | Import + 3 mutation guards |
| `todoist:src/actions/workspace.ts` | `src/lib/billing.ts` | import checkBillingAccess, billingGuard | ✓ WIRED | Import + 3 mutation guards |
| `todoist:src/actions/tag.ts` | `src/lib/billing.ts` | import checkBillingAccess, billingGuard | ✓ WIRED | Import + 3 mutation guards |
| `todoist:src/app/tasks/layout.tsx` | `src/components/billing/BillingProvider.tsx` | wraps children with BillingProvider | ✓ WIRED | Line 3: import; line 52-74: BillingProvider wraps layout with billing status |
| `todoist:src/app/tasks/layout.tsx` | `src/components/billing/ReadOnlyBanner.tsx` | conditional render | ✓ WIRED | Line 4: import; line 62-68: renders when `billing.mode === "readonly"` |
| `todoist:src/app/tasks/layout.tsx` | `src/components/billing/FreeWeekBanner.tsx` | conditional render | ✓ WIRED | Line 4: import; line 69: renders when `billing.reason === "free_week"` |

#### Personal-Brand Internal Links

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/data/apps.ts` | `/apps page` | getApps() includes tasks entry | ✓ WIRED | getApps() returns array with tasks entry; /apps page imports and maps over getApps() |

### Requirements Coverage

From ROADMAP.md Phase 34, requirements: BILL-01 through BILL-08, APPS-01 through APPS-03, TEST-01.

| Requirement | Description | Status | Blocking Issue |
|-------------|-------------|--------|----------------|
| BILL-01 | First week free trial | ✓ SATISFIED | Truth 1 verified |
| BILL-02 | 100 credits/week charge after trial | ✓ SATISFIED | Truth 2 verified |
| BILL-03 | Read-only mode on insufficient credits | ✓ SATISFIED | Truth 3 verified |
| BILL-04 | Server-enforced 402 on mutations | ✓ SATISFIED | Truth 4 verified |
| BILL-05 | ReadOnlyBanner with Buy Credits CTA | ✓ SATISFIED | Truth 3 verified |
| BILL-06 | FreeWeekBanner during trial | ✓ SATISFIED | Artifact verified; layout conditional render |
| BILL-07 | Billing context shared via BillingProvider | ✓ SATISFIED | BillingProvider artifact verified; layout wiring confirmed |
| BILL-08 | Graceful degradation if billing API unreachable | ✓ SATISFIED | billing.ts:14-17, 25-34 defaults to readwrite on error |
| APPS-01 | Tasks app listing on /apps page | ✓ SATISFIED | Truth 5 verified |
| APPS-02 | Correct metadata and tech stack | ✓ SATISFIED | apps.ts entry verified |
| APPS-03 | Links to deployed todoist URL | ✓ SATISFIED | href uses TASKS_APP_URL env var with fallback |
| TEST-01 | Unit tests for billing logic | ✓ SATISFIED | 33 tests pass (6 new tasks-access tests + updated credits tests) |

### Anti-Patterns Found

None found. Scanned for TODO/FIXME/placeholder/console.log/return null in all billing artifacts. Zero matches.

### Human Verification Required

#### 1. End-to-End Free Week Flow

**Test:** Sign in with a new account. Verify FreeWeekBanner appears. Create, edit, delete tasks. Wait 7+ days. Sign in again. Verify ReadOnlyBanner appears. Attempt to create a task (should see toast error or silent failure).

**Expected:** FreeWeekBanner shows first week. Full CRUD access during free week. After 7 days, ReadOnlyBanner shows. All mutation buttons disabled or show 402 error response.

**Why human:** Requires real user session spanning multiple days, real Firestore writes, and visual banner verification.

#### 2. Credit Purchase Flow

**Test:** In read-only mode, click "Buy Credits" link in ReadOnlyBanner. Purchase credits on personal-brand billing page. Return to tasks app. Verify read-write access restored.

**Expected:** Link opens personal-brand billing page in new tab. After purchase, tasks app allows mutations again.

**Why human:** Requires Stripe payment flow and cross-service state verification.

#### 3. Server-Side 402 Enforcement

**Test:** In read-only mode, use browser dev tools to bypass client-side UI and directly call a mutation server action (e.g., createTaskAction) with a valid idToken.

**Expected:** Server returns `{error: "Insufficient credits. Purchase credits to continue.", code: 402}`. No task is created in the database.

**Why human:** Requires authenticated API testing with intentional client-side bypass.

#### 4. Billing API Graceful Degradation

**Test:** In todoist deployment, temporarily unset BILLING_API_URL env var or point it to an unreachable endpoint. Sign in to tasks app.

**Expected:** Tasks app logs "BILLING_API_URL not set -- defaulting to readwrite" or "Billing check failed: [status]" and allows full CRUD access (degrades to readwrite).

**Why human:** Requires deployment environment manipulation and log inspection.

### Gaps Summary

No gaps found. All 5 success criteria from ROADMAP.md are verified:

1. ✓ First week free from first access timestamp
2. ✓ 100 credits/week charge after free week
3. ✓ Read-only mode with ReadOnlyBanner when credits insufficient
4. ✓ Server returns 402 on all mutations in read-only mode
5. ✓ Tasks app appears on /apps page with correct metadata

All 3 plans executed successfully:
- Plan 01: Billing API in personal-brand (checkTasksAccess, GET endpoint, tasks_app pricing)
- Plan 02: Billing guards and UI in todoist (17 mutation guards, 4 banner/provider components, layout wiring)
- Plan 03: Apps hub entry and tests (tasks entry, 6 unit tests, tool pricing tests)

All artifacts exist and are substantive (no stubs). All key links are wired (cross-repo API call, action guards, layout providers, banner conditionals). All tests pass (33 tests in personal-brand, lint + build pass in both repos). No anti-patterns detected.

The phase goal is achieved. Tasks app access is gated by weekly credits with graceful degradation to read-only mode.

---

_Verified: 2026-02-12T08:45:00Z_
_Verifier: Claude (gsd-verifier)_
