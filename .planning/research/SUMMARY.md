# Project Research Summary

**Project:** v1.8 -- Tasks App Integration (Effort Scoring, Demo Mode, Help Tips, Weekly Credit Gating)
**Domain:** Multi-repo integration (todoist + personal-brand) with billing, authentication, and feature additions
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

This milestone integrates a standalone Todoist-style task manager (separate PostgreSQL/Prisma repo) with the personal-brand site's billing ecosystem (Firestore/Firebase). The integration follows proven patterns from the existing envelopes app: weekly credit gating with graceful degradation to read-only mode, Firebase Auth for identity, and a billing API that enforces server-side access checks. The key finding is that **zero new dependencies are needed** in either repo — all four features (effort scoring, demo workspace, help tips, weekly gating) can be built with existing stack elements plus native browser APIs.

The critical architectural decision is to keep the two apps as separate deployments rather than embedding one in the other. Different databases (PostgreSQL vs Firestore), different mutation patterns (server actions vs API routes), and independent deployment cadences make separation the clean choice. Personal-brand provides billing and authentication as HTTP APIs; todoist consumes them via fetch calls with Firebase ID tokens.

The main risks are multi-user migration pitfalls (adding userId to a single-user schema without backfilling), missing userId filters in queries (IDOR vulnerabilities), and cross-database billing/data consistency. All are mitigated by following established patterns from the envelopes app and Prisma migration best practices.

## Key Findings

### Recommended Stack

**No new packages needed.** Both repos have everything required for v1.8.

**Todoist repo changes:**
- Prisma schema additions: `effort Int?` on Task, `isDemo Boolean` on Workspace
- Native Popover API + CSS Anchor Positioning for help tips (baseline in all major browsers as of Jan 2026)
- Client-side demo workspace with in-memory static data (no DB writes)
- Firebase Auth client SDK (same project as personal-brand) for user identity

**Personal-brand repo changes:**
- New billing API route (`/api/tasks/billing/access`) reusing existing `checkEnvelopeAccess()` pattern
- New tool pricing entry (`tasks_app: 25 credits/week`)
- Apps hub entry linking to deployed todoist URL

**Critical version note:** Prisma 7.x is available but is a major bump. Stay on Prisma 6.19.2 during v1.8 — it fully supports all schema changes and the app uses `prisma db push` (no complex migrations).

**Native API choice:** Help tips use Popover API + CSS Anchor Positioning instead of Radix/Floating UI libraries. Both APIs achieved Baseline status in Jan 2026 (77-93% browser support). For the ~20% on older browsers, help tips are progressive enhancement — the app works without them. This avoids adding the first UI library dependency to a project that has built everything with vanilla components.

### Expected Features

**Must have (table stakes):**

**From effort scoring:**
- Optional integer effort field (1-13, Fibonacci subset) on tasks
- UI selector for setting effort (small popover with discrete values)
- Section rollup (sum of incomplete tasks' effort)
- Project rollup (sum across all sections)

**From demo workspace:**
- Pre-populated demo data (30-60 tasks across 3-5 realistic projects, showcasing effort scores and all views)
- Client-side only demo (no DB writes, no persistence, no auth)
- Clear "DEMO" banner explaining data is temporary with CTA to sign up

**From help tips:**
- Reusable HelpTip component (gold "?" icon, navy tooltip on hover/focus)
- Content catalog mapping tip IDs to text (centralized for easy updates)
- Accessibility requirements: ARIA tooltip role, keyboard/focus support, mobile tap-to-toggle

**From billing integration:**
- Server-side billing check on every write operation (check Firestore `tasks_billing/{uid}` for active week)
- First week free, then 25 credits/week (configurable via `billing_tool_pricing`)
- Read-only mode enforcement (server-side 402 on mutations, client-side disabled UI)
- ReadOnlyBanner matching envelopes pattern (amber, persistent, "buy credits" CTA)
- Apps hub entry for discoverability

**Should have (competitive):**
- Effort badges in board view cards with column totals (polish, helps with Kanban capacity planning)
- Animated tooltip entry (subtle fade + scale, feels polished)
- Credit balance display in app header (proactive low-balance warning)

**Defer (v2+):**
- Effort distribution visualization (bar chart across sections) — nice-to-have, no user demand yet
- "Keep demo data on payment" option — migration complexity, edge cases
- Guided tour over demo data — requires step management, highlight overlays
- Billing history for users — admin panel covers this, defer until user base grows

### Architecture Approach

**Two-repo integration pattern:** Todoist remains a separate deployment. Personal-brand links to it from the apps hub. Shared concerns (billing, auth) are handled via HTTP APIs with Firebase ID tokens.

**Major components:**

1. **Billing API (personal-brand)** — New route at `/api/tasks/billing/access` verifies Firebase token, checks Firestore `tasks_billing/{uid}` collection for active paid week, returns `readwrite | readonly`. Mirrors `checkEnvelopeAccess()` pattern exactly.

2. **Task CRUD with billing gates (todoist)** — All mutating server actions check billing status before proceeding. Billing check calls personal-brand API, caches result in React context, disables write UI when readonly. Server-side enforcement prevents API bypass.

3. **Demo workspace (todoist)** — Dedicated `/tasks/demo` route renders from hardcoded static fixtures. No auth, no DB, no billing. All mutations are no-ops with toast feedback. DemoBanner with sign-up CTA.

4. **Help tips (todoist)** — Lightweight `<HelpTip>` component using native Popover API. Content stored in `help-tips.ts` catalog. Dismissal state in localStorage (per-user, no server state).

5. **Effort scoring (todoist)** — Pure Prisma schema change (`effort Int?` on Task) + UI selector + rollup display. Rollups computed on-the-fly with indexed queries (or denormalized counters if performance requires).

**Data flow:** User authenticates with Firebase on personal-brand → clicks "Task Manager" in apps hub → redirects to todoist.dan-weinbeck.com → todoist loads, gets Firebase ID token from client SDK → server actions call personal-brand `/api/tasks/billing/access` with token → billing check returns mode → UI shows ReadOnlyBanner or enables write operations.

**Cross-database consistency strategy:** Use weekly gating (charge once per week, cache result) NOT per-operation billing. This decouples the Firestore billing transaction from PostgreSQL data writes. Billing check is a read of cached state (`paidWeeks` map in Firestore), not a debit transaction during task creation. Avoids distributed transaction problem.

### Critical Pitfalls

1. **Missing userId backfill on Prisma migration** — Adding `userId String` to Task/Project models fails if the column is `NOT NULL` and existing data has no userId. Must use `--create-only` to hand-edit migration SQL: add column as nullable, backfill with sentinel value, make NOT NULL, add index. Otherwise: orphaned rows or migration failure.

2. **Cross-database billing creates distributed transaction risk** — Firestore billing + PostgreSQL data = no shared transaction. Solution: weekly gating pattern (charge once, gate all week). Do NOT charge per operation. If billing check passes but Postgres write fails, no money was charged (because check was a read, not a debit). If you invent per-operation billing, you need compensation (refund on failure).

3. **Missing userId filter in ANY query leaks data** — Todoist was single-user. Every existing query like `prisma.task.findMany({ where: { projectId } })` is a data leak in multi-user mode. Must audit every query and add `userId` filter. Use Prisma middleware/extension to enforce this or PostgreSQL RLS. Integration tests: create data for User A and User B, verify queries never cross-contaminate.

4. **Free week timing uses server UTC, not user timezone** — `startOfWeek(new Date())` runs in UTC. A user in UTC-8 signing up at 10 PM Saturday local is actually Sunday UTC — new week starts immediately, "free week" is < 1 day. Solution: document UTC behavior (same as envelopes), or upgrade to generous 7-day trial (from first access timestamp, not week boundary).

5. **Demo data contamination if using DB** — If demo workspace writes to PostgreSQL with a magic userId like `demo`, it pollutes analytics, confuses billing, and risks collision. Solution: client-side only demo (in-memory state, no API calls). If server-side demo is needed, use separate PostgreSQL schema with `@@schema` directive.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Help Tip Component
**Rationale:** Zero dependencies on other features. Small, self-contained deliverable. Needed by all other features for contextual help. Establishes the accessible tooltip pattern early.

**Delivers:** Reusable `<HelpTip>` component with native Popover API, content catalog, localStorage dismissal tracking.

**Addresses:** TS-8, TS-9 from FEATURES.md (Help Tip Component, Content Catalog)

**Avoids:** Pitfall 7 (accessibility failures) by building ARIA-compliant component from the start. Pitfall 13 (tooltip overflow) mitigated with max-width constraint and viewport-aware positioning.

**Complexity:** Low (~100 lines, 2 files)

**Research needed:** NO — native APIs are well-documented, pattern is standard.

---

### Phase 2: Effort Scoring
**Rationale:** Core data model change + UI. Must be done before demo data (demo tasks should showcase effort scoring). Establishes Prisma migration pattern for multi-user userId addition (Pitfall 1).

**Delivers:** `effort Int?` field on Task, EffortPicker UI component, rollup display on sections/projects, effort badges in task cards.

**Addresses:** TS-1, TS-2, TS-3, TS-4 (Effort Field, Selector UI, Section Rollup, Project Rollup)

**Avoids:** Pitfall 6 (expensive rollups) by designing indexed queries or denormalized counters. Pitfall 8 (mutable completed effort) by locking effort on completion or snapshotting at completion time. Pitfall 12 (default value issues) by using NULL default and excluding unscored tasks from rollups.

**Complexity:** Low-Medium (~300 lines, 4-6 files: schema, selector, rollup logic, display)

**Research needed:** NO — Fibonacci estimation is well-documented, Prisma optional Int field is trivial, rollup patterns are standard SQL.

---

### Phase 3: Multi-User Migration + Auth Setup
**Rationale:** Must be done before billing integration (billing requires userId). Adds Firebase Auth to todoist and migrates single-user schema to multi-user. This is the riskiest phase due to Pitfall 1 and Pitfall 3.

**Delivers:** Firebase Auth client SDK in todoist, AuthContext + AuthGuard, userId columns on all relevant models with backfill migration, userId filters in all queries.

**Addresses:** Cross-repo auth foundation (required for billing API calls)

**Avoids:** Pitfall 1 (userId migration) with custom migration SQL. Pitfall 3 (missing filters) with Prisma middleware or comprehensive query audit. Pitfall 9 (auth token forwarding) by using Firebase Admin SDK in personal-brand API routes to verify tokens.

**Complexity:** HIGH (touches every query in todoist, schema migration with backfill, auth setup)

**Research needed:** MINIMAL — pattern exists in personal-brand's `src/lib/auth/user.ts`, copy and adapt.

---

### Phase 4: Weekly Credit Gating
**Rationale:** Depends on auth (Phase 3). Must be done before demo workspace (demo is the pre-payment onboarding experience). Follows proven envelopes pattern exactly.

**Delivers:** Billing API route in personal-brand (`/api/tasks/billing/access`), `checkTasksAccess()` function, billing integration in todoist server actions, ReadOnlyBanner, Apps hub entry.

**Addresses:** TS-10, TS-11, TS-12, TS-13, TS-14 (Billing Access Check, Read-Only Enforcement, Banners, Apps Hub)

**Avoids:** Pitfall 2 (distributed transaction) by using weekly gating, not per-operation billing. Pitfall 10 (client-only gating) with server-side checks in all mutating endpoints. Pitfall 14 (idempotency collision) with unique `tasks_week_` prefix.

**Complexity:** Medium (~400 lines, 5-8 files in todoist + 3 files in personal-brand)

**Research needed:** NO — direct copy of envelopes billing pattern from `src/lib/envelopes/billing.ts`.

---

### Phase 5: Demo Workspace
**Rationale:** Depends on effort scoring (demo tasks need effort values) and billing (demo is the try-before-you-buy flow). Content design quality determines UX quality.

**Delivers:** `/tasks/demo` route with static fixtures, DemoBanner, demo layout provider, 30-60 realistic tasks across 3-5 projects with effort scores.

**Addresses:** TS-5, TS-6, TS-7 (Demo Data Seed, Demo Lifecycle, Demo Banner)

**Avoids:** Pitfall 5 (data contamination) by using client-side only demo. Pitfall 11 (unclear persistence) with persistent "DEMO" banner and clear sign-up messaging.

**Complexity:** Medium (~500 lines, mostly seed data content design)

**Research needed:** NO — static data seed pattern is trivial. Content design is creative work, not research.

---

### Phase Ordering Rationale

- **Phase 1 first:** Help tips have zero dependencies. Small win, establishes accessible component pattern.
- **Phase 2 before Phase 3:** Effort scoring is todoist-only, no cross-repo coordination. Get it working in single-user mode first, then add multi-user.
- **Phase 3 before Phase 4:** Billing requires auth (Firebase ID tokens). Multi-user schema migration must complete before billing integration starts.
- **Phase 4 before Phase 5:** Demo workspace is the pre-payment UX. Users see demo, then billing gate. Order matters for user flow.
- **Phase 5 last:** Depends on everything (effort, auth, billing). Showcases the complete feature set.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Multi-User Migration):** Query audit is manual, time-consuming. May discover edge cases (nested includes, aggregate queries) that need custom solutions. Budget extra time for comprehensive testing.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Help Tips):** Native APIs documented, ARIA patterns established.
- **Phase 2 (Effort Scoring):** Prisma optional field, Fibonacci estimation patterns well-understood.
- **Phase 4 (Billing):** Direct copy of envelopes pattern, fully vetted.
- **Phase 5 (Demo):** Static data, client-side only, zero novelty.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions verified via `npm list`, no new deps needed, native APIs baseline in all major browsers |
| Features | HIGH | Effort scoring matches Linear/ClickUp patterns (official docs), billing mirrors envelopes (codebase analysis), demo workspace follows SaaS onboarding best practices (multiple sources) |
| Architecture | HIGH | Direct codebase analysis of both repos, proven envelopes integration pattern, Firebase Auth pattern already in use |
| Pitfalls | HIGH | Verified via existing codebase patterns (envelopes billing, Prisma schema, auth), Prisma migration pitfalls documented officially, IDOR/userId filter issues are OWASP Top 10 |

**Overall confidence:** HIGH

### Gaps to Address

**Effort rollup performance at scale:** Research assumes < 1000 active tasks per user (personal/small-team tool). If actual usage exceeds this, denormalized counters or materialized views may be needed. Monitor query performance in production, add indexes proactively.

**UTC week boundary UX:** Existing envelopes app has the same UTC-based week calculation. No user complaints yet (low user count). For tasks app, document the UTC behavior initially. If users complain about short free weeks or unexpected charges, upgrade to generous 7-day trial (from first access timestamp) or accept timezone header from client.

**Prisma connection pooling on Cloud Run:** The singleton Prisma Client pattern prevents connection exhaustion in dev/low-traffic scenarios. Under heavy load, may need PgBouncer or Prisma Accelerate. Monitor `pg_stat_activity` connection count post-launch.

**Demo workspace content quality:** Research identifies the pattern (client-side seed data) but content design (which projects, which tasks, how to showcase effort scoring) is creative work. Allocate time for content iteration based on user feedback during testing.

## Sources

### Primary (HIGH confidence)

**Codebase analysis:**
- `/Users/dweinbeck/Documents/personal-brand/src/lib/envelopes/billing.ts` — weekly gating pattern, free week logic, idempotency keys
- `/Users/dweinbeck/Documents/personal-brand/src/lib/billing/firestore.ts` — debitForToolUse, refundUsage, Firestore transactions
- `/Users/dweinbeck/Documents/personal-brand/src/lib/auth/user.ts` — verifyUser(), Firebase token verification
- `/Users/dweinbeck/Documents/personal-brand/src/app/api/envelopes/route.ts` — server-side billing check, 402 on readonly
- `/Users/dweinbeck/Documents/personal-brand/src/components/envelopes/ReadOnlyBanner.tsx` — client-side readonly UX
- `/Users/dweinbeck/Documents/todoist/prisma/schema.prisma` — existing data model, no userId columns, no effort field
- `/Users/dweinbeck/Documents/todoist/src/actions/task.ts` — server actions pattern, no auth checks
- Package versions verified via `npm list --depth=0` on 2026-02-11

**Official documentation:**
- [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) — Baseline Widely Available April 2025, 93% support
- [MDN CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning) — Baseline Newly Available Jan 2026, 77% support
- [Prisma Schema Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference) — optional fields, Boolean defaults, Int fields
- [Prisma Migration Customization](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations) — `--create-only` flag, hand-editing migration SQL
- [MDN ARIA Tooltip Role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role) — complete accessibility requirements

### Secondary (MEDIUM-HIGH confidence)

**Industry patterns:**
- [Linear Estimates Documentation](https://linear.app/docs/estimates) — Fibonacci/exponential/linear scales, per-issue estimation
- [ClickUp Sprint Points](https://help.clickup.com/hc/en-us/articles/6303883602327-Use-Sprint-Points) — aggregate rollups, sprint capacity planning
- [Azure DevOps Rollup](https://learn.microsoft.com/en-us/azure/devops/reference/xml/support-rollup-of-work-and-other-fields) — parent-child effort aggregation
- [Inclusive Components: Tooltips](https://inclusive-components.design/tooltips-toggletips/) — accessible tooltip patterns
- [Lago: Timezone Billing Challenges](https://www.getlago.com/blog/time-zone-nightmares) — UTC week boundary edge cases
- [Prisma Serverless Guide](https://www.prisma.io/docs/guides/multiple-databases) — singleton pattern, connection pooling

**SaaS patterns:**
- SaaS onboarding best practices (Insaim, Sales-Hacking blogs) — demo workspace, first perceived value < 2 minutes
- Tooltip best practices (UserPilot, LogRocket, SetProduct blogs) — 1-2 sentences, 60-130 chars, active voice
- Freemium pricing models (Stripe resources, Monetizely guides) — credit-based vs subscription, weekly gating

### Tertiary (LOW confidence, needs validation)

**Web search results (cross-validated with multiple sources):**
- Fibonacci agile estimation rationale (ProductPlan, Mountain Goat Software, Atlassian) — discourages false precision, industry standard
- SaaS sandbox environments (Reprise blog) — demo data isolation best practices
- PostgreSQL RLS with Prisma (Medium article) — row-level security as alternative to application-layer userId filters
- Denormalization tradeoffs (Medium article) — performance vs consistency

---

**Research completed:** 2026-02-11
**Ready for roadmap:** Yes

**Next step:** Use this summary to create `.planning/ROADMAP.md` with detailed phase plans based on the 5-phase structure above. Each phase should reference specific features from FEATURES.md and pitfalls from PITFALLS.md to avoid.
