# Domain Pitfalls: Tasks App Integration Features

**Domain:** Adding weekly credit gating, effort scoring, demo workspaces, and help tips to a single-user Todoist-style app being integrated into a billing-enabled multi-user platform
**Researched:** 2026-02-11
**Overall confidence:** HIGH (based on direct codebase analysis of existing billing/auth patterns in personal-brand, plus verified web research)

**Two repos involved:**
- `personal-brand`: Firebase Auth, Firestore billing/credits, weekly gating pattern (envelopes app)
- `todoist`: Standalone single-user app, PostgreSQL/Prisma, no auth, no billing

---

## Critical Pitfalls

Mistakes that cause data leaks between users, billing bypass, data corruption, or require rewrites.

### Pitfall 1: Adding userId to Prisma Schema Without Backfilling Existing Data

**What goes wrong:** The todoist app's Prisma schema has no `userId` column on any table -- it was designed for a single anonymous user. When you add `userId String` to the Task, Project, and related models, Prisma generates a migration that adds the column. If the column is `NOT NULL` (which it should be for data isolation), the migration fails because existing rows have no userId value. If you make it nullable to work around this, you create a permanent data isolation hole where tasks with `NULL` userId are visible to no one -- or worse, visible to everyone if your query forgets to filter.

**Why it happens:** Prisma's `migrate dev` generates DDL based on schema diff. Adding a required field to a table with existing data produces an `ALTER TABLE ADD COLUMN ... NOT NULL` without a default, which PostgreSQL rejects. Developers work around this by making the column optional, intending to "fix it later" -- but "later" never comes, and `WHERE userId = ?` queries silently exclude orphaned rows.

**Consequences:**
- Migration fails on any database with existing data (dev or production)
- If made nullable: orphaned rows with `NULL` userId become invisible ghost data
- If a query accidentally omits the userId filter, all users see each other's tasks
- Row-level security is impossible to enforce consistently with nullable userId

**Prevention:**
1. **Use Prisma's `--create-only` flag** to generate the migration without applying it, then hand-edit the SQL:
   ```sql
   -- Step 1: Add column as nullable
   ALTER TABLE "Task" ADD COLUMN "userId" TEXT;

   -- Step 2: Backfill all existing rows with a sentinel value (e.g., 'legacy-single-user')
   UPDATE "Task" SET "userId" = 'legacy-single-user' WHERE "userId" IS NULL;

   -- Step 3: Make column NOT NULL
   ALTER TABLE "Task" ALTER COLUMN "userId" SET NOT NULL;

   -- Step 4: Add index for query performance
   CREATE INDEX "Task_userId_idx" ON "Task"("userId");
   ```
2. **Apply the same pattern to ALL tables** that need user scoping (projects, labels, etc.).
3. **In the Prisma schema, mark userId as required** (`String`, not `String?`) so all future code is forced to provide it.
4. **Add a compound index** on `(userId, projectId)` or `(userId, status)` for common query patterns.

**Detection:** Run `npx prisma migrate dev` after adding userId. If it fails with "column cannot be null," you need the manual migration approach. If it succeeds silently (nullable column), check for orphaned rows.

**Phase:** Must be the FIRST thing done when adding multi-user support. All subsequent features depend on userId being present and required.

**Confidence:** HIGH -- standard Prisma migration behavior, verified via [Prisma migration customization docs](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations).

---

### Pitfall 2: Cross-Database Billing Check Creates a Distributed Transaction Problem

**What goes wrong:** The billing system lives in Firestore (personal-brand), but task data lives in PostgreSQL (todoist). When a user performs a write operation (create task, update task), the server must: (1) check billing access in Firestore, (2) if authorized, write to PostgreSQL. These are two separate databases with no shared transaction. If step 1 succeeds (charges credits or confirms paid week) but step 2 fails (Postgres error), the user is charged but gets no result. If step 2 succeeds but the billing state is stale (checked seconds ago), you might allow a write that should have been gated.

**Why it happens:** The existing envelopes app avoids this because BOTH billing and data live in Firestore -- `checkEnvelopeAccess()` and `createEnvelope()` both hit the same Firestore instance. The tasks app breaks this pattern by splitting across Firestore (billing) and PostgreSQL (data). There is no distributed transaction coordinator between them.

**Specific risk in this codebase:**
- `checkEnvelopeAccess()` in `src/lib/envelopes/billing.ts` calls `debitForToolUse()` which runs a Firestore transaction to charge credits
- The equivalent for tasks would need to charge in Firestore, then write to Postgres -- two separate operations
- If the Postgres write fails after billing succeeds, the user loses credits with no task created

**Consequences:**
- User charged for a week but task write fails -- credits lost, no service delivered
- Race condition: billing check passes, but by the time Postgres write completes, the week has rolled over
- No automatic rollback across databases -- manual intervention required
- Retry logic becomes complex: must check idempotency in Firestore AND handle Postgres retries separately

**Prevention:**
1. **Use the weekly gating pattern from envelopes, NOT per-operation charging.** The envelopes billing model charges once per week and caches the result in `envelope_billing/{uid}.paidWeeks`. This means the Postgres write is not coupled to a billing transaction -- the billing check is a simple read of cached state.
2. **Check billing access (Firestore read) before Postgres write, but do NOT charge during the write operation.** The charge happens once when the user first accesses the app that week. All subsequent writes within that week are free.
3. **If the billing check indicates readonly, reject the Postgres write before it starts** -- no need to touch Postgres at all.
4. **Cache the billing access result in the API response** (as envelopes does with `billing: { mode, reason }`) so the client can optimistically disable write UI without waiting for the server check.
5. **If you must do per-operation billing** (not recommended): implement a compensation pattern -- if Postgres write fails after debit, call `refundUsage()` to reverse the charge.

**Detection:** Intentionally kill the Postgres connection after billing check passes. If credits are deducted but no task is created, the distributed transaction problem is active.

**Phase:** Must be designed in the architecture phase BEFORE implementing any billing integration. The weekly gating model (charge once, gate all week) is the correct pattern -- do not invent per-operation billing for tasks.

**Confidence:** HIGH -- verified by analyzing the existing `checkEnvelopeAccess()` pattern in `src/lib/envelopes/billing.ts` and the separation of concerns it establishes. Cross-database consistency pitfalls are [well-documented](https://firebase.google.com/docs/firestore/manage-data/transactions).

---

### Pitfall 3: Missing userId Filter in ANY Prisma Query Leaks Data Between Users

**What goes wrong:** After adding multi-user support, every single Prisma query that reads or writes task data must include `WHERE userId = ?`. If even one query forgets this filter, users can see, modify, or delete each other's tasks. This is especially dangerous in the todoist app because it was built as single-user -- NONE of its existing queries have userId filters. Every existing query is a potential data leak.

**Why it happens:** The todoist app was designed for one user. Queries like `prisma.task.findMany({ where: { projectId } })` are correct in single-user mode but catastrophically wrong in multi-user mode because they return ALL users' tasks for that project. The developer adds userId to the schema but forgets to update every query, or misses a deeply nested include/relation.

**Specific scenarios:**
- `findMany` without userId returns tasks from all users
- `update` or `delete` without userId allows modifying other users' tasks (IDOR vulnerability)
- Nested `include: { tasks: true }` on a project fetches all tasks for that project regardless of user
- Aggregate queries (`count`, `groupBy`) without userId return cross-user totals
- Effort scoring rollups that aggregate across all tasks instead of per-user

**Consequences:**
- User A sees User B's tasks (privacy violation)
- User A can delete User B's tasks (data destruction)
- Effort rollups show incorrect totals (mixing users' data)
- Potential legal liability depending on task content

**Prevention:**
1. **Create a Prisma middleware or extension** that automatically injects userId into every query:
   ```typescript
   // prisma-user-scope.ts
   const prisma = new PrismaClient().$extends({
     query: {
       task: {
         async $allOperations({ args, query, operation }) {
           if (!args.where?.userId && operation !== 'create') {
             throw new Error('userId filter required on all task queries');
           }
           return query(args);
         }
       }
     }
   });
   ```
2. **Or use Prisma's Row Level Security** -- create PostgreSQL RLS policies that enforce `userId = current_setting('app.current_user_id')` at the database level, so even if the application forgets the filter, the database rejects the query.
3. **Audit every existing query** in the todoist codebase. Search for all `prisma.task.`, `prisma.project.`, etc. calls and add userId filters.
4. **Write integration tests** that create data for User A and User B, then verify User A's queries never return User B's data.
5. **Never trust client-provided IDs alone** -- always pair `{ id: taskId, userId: authedUserId }` in `where` clauses.

**Detection:** Create tasks as two different users. Query tasks for User A. If User B's tasks appear, the filter is missing. Automated: add a test that asserts `findMany({ where: { userId: 'A' } }).length` equals the number of tasks created by User A only.

**Phase:** Must be completed as part of the multi-user migration, before ANY user-facing deployment. This is a security-critical change.

**Confidence:** HIGH -- IDOR (Insecure Direct Object Reference) via missing userId filters is one of the OWASP Top 10 and the most common multi-tenant data leak pattern.

---

### Pitfall 4: Free Week Timing Uses Server UTC But User Thinks in Local Time

**What goes wrong:** The existing envelopes billing in `src/lib/envelopes/billing.ts` computes `currentWeekStart` using `startOfWeek(new Date(), { weekStartsOn: 0 })` which runs on the server in UTC. A user in UTC-8 (Pacific) who starts using the app at 10 PM Saturday local time is actually in Sunday UTC -- they get charged for the new week. The user sees "Week of 2/8/2026 - 2/14/2026" but their local Saturday evening activity triggered the new week's charge. Their "free first week" might be only a few hours if they signed up late Saturday night local time.

**Why it happens:** `new Date()` on a Cloud Run server returns UTC time. `startOfWeek()` from date-fns computes the week boundary in the server's timezone (UTC). The existing `week-math.ts` in `src/lib/envelopes/week-math.ts` explicitly uses `{ weekStartsOn: 0 }` (Sunday) but does not account for user timezone. The `firstAccessWeekStart` is stored as a UTC-based date string.

**Specific risk in the existing codebase:**
- `billing.ts` line 52-55: `format(startOfWeek(new Date(), WEEK_OPTIONS), "yyyy-MM-dd")` -- pure UTC
- A user in UTC+12 (New Zealand) experiences the week boundary 12 hours earlier than expected
- A user in UTC-12 experiences it 12 hours later
- The "free week" could be as short as ~5 days or as long as ~9 days depending on timezone

**Consequences:**
- User's "free week" is shorter than 7 days (feels unfair, causes complaints)
- Week boundary charges happen at unexpected times (11 PM Saturday for East Coast US users)
- User sees "new week" banner while their local calendar still shows the previous week
- Confusing UX: "Why was I charged on Saturday?"

**Prevention:**
1. **For MVP: document the behavior** -- "Weeks reset Sunday at midnight UTC." This is the simplest approach and matches the existing envelopes app behavior.
2. **For better UX: accept a timezone header** from the client (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and compute week boundaries in the user's local timezone on the server.
3. **For the free week specifically: be generous** -- give "7 full days from first access" instead of "until the next UTC Sunday." This avoids the shortest-free-week problem:
   ```typescript
   const firstAccess = billingDoc.firstAccessDate; // ISO timestamp, not week start
   const daysSinceFirstAccess = differenceInDays(new Date(), firstAccess);
   if (daysSinceFirstAccess < 7) return { mode: "readwrite", reason: "free_week" };
   ```
4. **Store the user's timezone in their billing doc** on first access so all future week boundary calculations are consistent for that user.

**Detection:** Sign up at 11 PM Saturday in a US timezone. Check whether the "free week" ends the following Saturday or Sunday. If it ends Sunday (< 24 hours later), the UTC week boundary is cutting the free week short.

**Phase:** Should be decided during the billing integration design phase. The existing envelopes app has this same issue but it has not been reported as a problem (likely low user count). For the tasks app, the same pattern can be reused initially with documentation, then improved if user feedback warrants it.

**Confidence:** HIGH -- verified by reading `billing.ts` lines 52-55 and `week-math.ts`. UTC week boundary behavior is deterministic. The [Lago blog on timezone billing challenges](https://www.getlago.com/blog/time-zone-nightmares) confirms this is a widespread issue.

---

### Pitfall 5: Demo Data Contaminates Real User Data (or Vice Versa)

**What goes wrong:** A demo workspace lets unauthenticated visitors try the app with sample data. If demo data shares the same database tables as real user data with only a "magic" userId like `demo` or `__demo__`, several things can go wrong: (1) demo data appears in admin analytics, (2) a bug in userId filtering shows demo tasks to real users, (3) demo data consumes database resources and affects query performance, (4) if the demo userId collides with a real Firebase UID (unlikely but possible), the demo user overwrites real data.

**Why it happens:** The simplest demo implementation creates a fake user record and seeds tasks under that userId in the same tables. This is fast to build but creates a permanent pollution vector. Cleanup becomes complex: "delete all demo data" must enumerate every table, handle foreign keys, and avoid accidentally deleting real data that was somehow associated with the demo user.

**Specific risk in this architecture:**
- Firebase UIDs are 28-character strings like `aBcDeFgHiJkLmNoPqRsTuVwXyZ01`. A hardcoded demo userId like `demo-user` is distinguishable, but any logic that assumes "all userIds are Firebase UIDs" will break on the demo user.
- If the demo workspace writes to Firestore billing collections (to simulate the billing flow), demo records pollute `billing_users`, `billing_tool_usage`, and `billing_stripe_events`.
- If demo data is client-side only (localStorage/in-memory), it cannot demonstrate server features like effort rollups or billing gating.

**Consequences:**
- Admin billing dashboard shows demo user in user list
- Analytics (total users, total credits spent) are inflated by demo data
- Demo user's "billing" records confuse the Stripe revenue picture
- If demo cleanup fails silently, demo data accumulates indefinitely
- If demo userId collides with a real UID, catastrophic data merge

**Prevention:**
1. **Client-side demo with in-memory state** (recommended for this project). The demo workspace should use React state or a client-side store (not the real API) to hold demo tasks. No server calls, no database writes, no billing interaction. This completely eliminates contamination:
   ```typescript
   // DemoProvider wraps the app with fake data in React context
   // All CRUD operations modify local state, not the API
   const [tasks, setTasks] = useState(DEMO_SEED_DATA);
   ```
2. **If server-side demo is required:** Use a completely separate PostgreSQL schema or database for demo data. Prisma supports [multiple schemas](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema) via the `@@schema` directive.
3. **Never write demo data to Firestore billing collections.** The demo should simulate billing UI (show a fake "readwrite" mode) without actually calling `checkEnvelopeAccess()` or `debitForToolUse()`.
4. **If using a magic userId:** Prefix it with a namespace that cannot collide with Firebase UIDs, e.g., `__demo__`. Add a guard in all admin/analytics queries: `WHERE userId NOT LIKE '__demo__%'`.
5. **Add a TTL/cleanup job** that deletes demo data older than 24 hours from the database.

**Detection:** Create demo data, then log in as a real user. If demo tasks appear in the real user's view, contamination is active. Check the admin billing dashboard -- if a "demo" user appears, billing contamination is active.

**Phase:** Must be designed before implementation begins. The client-side-only approach eliminates the entire category of contamination bugs and should be the default choice.

**Confidence:** HIGH -- data isolation between demo and production is a [well-documented SaaS concern](https://www.reprise.com/resources/blog/what-is-sandbox-environment). The client-side approach is the industry standard for demo modes in apps with server-side billing.

---

## Moderate Pitfalls

Mistakes that cause broken features, poor UX, incorrect calculations, or require significant rework.

### Pitfall 6: Effort Rollup Becomes Expensive With Many Tasks

**What goes wrong:** Effort scoring requires aggregating effort points across tasks within a project, or across all projects for a user. If effort rollups are computed on-the-fly (e.g., `SELECT SUM(effort_points) FROM tasks WHERE userId = ? AND projectId = ?`), this works fine with 50 tasks but degrades with thousands. More critically, if rollups are computed in the API response for every list view, every page load triggers aggregate queries.

**Why it happens:** In a Todoist-style app, users accumulate tasks over time. Active tasks might number 50-200, but completed tasks can reach thousands over months. If rollups include completed tasks (for weekly/monthly effort tracking), the query scans all historical tasks.

**Specific performance scenarios:**
- Dashboard showing "total effort this week" across all projects: one query per project, or a `GROUP BY projectId` over all tasks
- Project view showing "effort remaining" vs "effort completed": two aggregates per project
- Weekly effort chart: aggregate per day for 7 days across all tasks
- All of these computed on every page load without caching

**Consequences:**
- Page load time increases linearly with task count
- Database CPU spikes during peak usage (Monday mornings when everyone opens their task list)
- If using Prisma's `aggregate()` without proper indexes, PostgreSQL does full table scans
- Cold start + aggregate query = multi-second API response

**Prevention:**
1. **Add database indexes for effort rollups:**
   ```sql
   CREATE INDEX "Task_userId_status_effort_idx"
     ON "Task"("userId", "status", "effortPoints");
   CREATE INDEX "Task_userId_completedAt_idx"
     ON "Task"("userId", "completedAt")
     WHERE "completedAt" IS NOT NULL;
   ```
2. **Compute rollups incrementally, not on every request.** Store denormalized effort totals on the Project model:
   ```prisma
   model Project {
     totalEffortPoints     Int @default(0)
     completedEffortPoints Int @default(0)
   }
   ```
   Update these counters atomically when a task is created, updated, completed, or deleted. This turns the rollup read into a single-row lookup.
3. **If using denormalized counters:** Update them in the same Prisma transaction as the task mutation to prevent drift:
   ```typescript
   await prisma.$transaction([
     prisma.task.update({ where: { id, userId }, data: { status: 'DONE', effortPoints: 3 } }),
     prisma.project.update({ where: { id: projectId }, data: { completedEffortPoints: { increment: 3 } } }),
   ]);
   ```
4. **For time-based rollups (weekly effort chart):** Use a materialized view or a periodic aggregation job, not real-time computation. At the scale of a personal/small-user app, a simple `GROUP BY DATE(completedAt)` with an index is sufficient.
5. **Set a reasonable scope:** Only aggregate active tasks + tasks completed in the last 90 days. Do not scan the entire task history for every rollup.

**Detection:** Create 1000+ tasks with effort scores. Load the dashboard. If response time exceeds 500ms, the aggregate queries need optimization. Check PostgreSQL query plans with `EXPLAIN ANALYZE` on the rollup queries.

**Phase:** Design denormalized counters in the schema phase. Implement atomic counter updates alongside task CRUD operations. Do not defer this to "optimization later" -- retroactively adding counters requires a backfill migration.

**Confidence:** MEDIUM -- depends on actual task volume. For a personal app with < 1000 tasks, on-the-fly aggregation is fine. Denormalization is a precaution that [pays off as data grows](https://rafaelrampineli.medium.com/denormalization-a-solution-for-performance-or-a-long-term-trap-6b9af5b5b831).

---

### Pitfall 7: Help Tips Fail Accessibility Requirements (Screen Readers, Keyboard, Mobile)

**What goes wrong:** Help tips implemented as hover-only tooltips are invisible to keyboard users, screen reader users, and mobile users. The app appears to have contextual help when tested with a mouse, but three entire user populations get no help at all. This is both a usability failure and a WCAG 2.1 Level AA compliance issue.

**Why it happens:** The default developer instinct is `onMouseEnter` -> show tooltip, `onMouseLeave` -> hide tooltip. This works for mouse users but excludes:
- **Keyboard users:** Cannot hover; need focus-triggered tooltips
- **Screen readers:** Need `role="tooltip"` and `aria-describedby` to announce tooltip content
- **Mobile users:** No hover state on touchscreens; need tap-to-toggle or always-visible alternatives
- **Low vision users:** Tooltip must remain visible while the user moves their cursor to read it (WCAG 1.4.13)

**Specific ARIA requirements (verified via [MDN tooltip role docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role)):**
- Tooltip container: `role="tooltip"` and a unique `id`
- Trigger element: `aria-describedby="[tooltip-id]"`
- Show on: hover AND focus (both required)
- Hide on: mouse leave, blur, AND Escape key (all three required)
- Tooltip must NEVER receive focus (no interactive elements inside)
- Tooltip must remain visible when cursor moves from trigger to tooltip (WCAG 1.4.13)
- Content must persist long enough to be read

**Common mistakes to avoid:**
- Using `title` attribute instead of ARIA tooltip -- not keyboard accessible, not styleable, unreliable in screen readers
- Using `aria-labelledby` instead of `aria-describedby` -- tooltips provide descriptions, not labels
- Putting `aria-describedby` on the tooltip instead of the trigger element
- Making tooltip focusable or containing links/buttons inside it
- Gap between trigger and tooltip causes tooltip to disappear when cursor crosses the gap

**Consequences:**
- Keyboard-only users cannot access any help content
- Screen reader users do not hear tooltip text
- Mobile users see no tooltips at all
- WCAG non-compliance (Level AA failure on 1.4.13 Content on Hover or Focus)

**Prevention:**
1. **Build a reusable `HelpTip` component** that handles all accessibility requirements:
   ```typescript
   function HelpTip({ content, children }: { content: string; children: ReactNode }) {
     const id = useId();
     const [open, setOpen] = useState(false);

     return (
       <span
         aria-describedby={open ? id : undefined}
         onMouseEnter={() => setOpen(true)}
         onMouseLeave={() => setOpen(false)}
         onFocus={() => setOpen(true)}
         onBlur={() => setOpen(false)}
         onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
         tabIndex={0}
       >
         {children}
         {open && (
           <span role="tooltip" id={id}>
             {content}
           </span>
         )}
       </span>
     );
   }
   ```
2. **Add a CSS transition delay** on hide (0.3-0.5s) so the tooltip persists while the cursor moves from trigger to tooltip.
3. **On mobile: use a toggletip pattern** (tap to show, tap again to hide) instead of hover.
4. **For critical information: do not use tooltips at all.** If the help text is important enough that users need it, display it inline or in a help panel. Tooltips are for supplementary hints only.
5. **Test with keyboard navigation** (Tab to trigger, verify tooltip appears, Escape to dismiss).
6. **Test with a screen reader** (VoiceOver on macOS: verify tooltip text is announced as the element's description).

**Detection:** Tab through the app using only keyboard. If help tips never appear, keyboard accessibility is broken. Enable VoiceOver and navigate to a help-tipped element. If the tooltip content is not announced, ARIA markup is wrong.

**Phase:** Build the `HelpTip` component early (during UI component phase) and reuse it everywhere. Do not build individual tooltip implementations per feature -- that guarantees inconsistency.

**Confidence:** HIGH -- verified via [MDN ARIA tooltip role reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role) and [inclusive-components.design tooltip guidance](https://inclusive-components.design/tooltips-toggletips/).

---

### Pitfall 8: Effort Score Changes on Completed Tasks Break Historical Accuracy

**What goes wrong:** A user completes a task with effort score 3 on Monday. On Wednesday, they edit the task and change the effort to 5. The weekly effort chart now shows 5 for Monday, even though the user only did 3 points of effort that day. If denormalized counters are used, the rollup incremented by 3 on completion but the edit changes the score without updating the rollup delta -- the counter is now wrong by 2.

**Why it happens:** Effort scoring is a property of the task, but effort tracking is a function of time. When the effort score is mutable after completion, historical accuracy becomes a moving target. The denormalized counter pattern (Pitfall 6 prevention) makes this worse because the counter was updated at completion time with the old value.

**Consequences:**
- Weekly/daily effort charts are inaccurate
- Denormalized counters drift from actual values over time
- User cannot trust "I did 25 effort points this week" because past completions can be retroactively inflated
- If effort is used for billing or productivity metrics, the data is unreliable

**Prevention:**
1. **Lock effort scores on completed tasks** (recommended). Once a task is marked done, the effort score becomes read-only. To change it, the user must reopen the task, edit the score, then re-complete it. This naturally triggers the counter update.
2. **If mutable effort on completed tasks is required:** Store effort at completion time separately:
   ```prisma
   model Task {
     effortPoints          Int @default(1)
     completedEffortPoints Int? // Snapshot at completion time, null if not done
     completedAt           DateTime?
   }
   ```
   Use `completedEffortPoints` for all historical rollups. `effortPoints` reflects the current/editable value.
3. **If using denormalized counters:** The update handler must compute the delta (`newEffort - oldEffort`) and adjust the counter:
   ```typescript
   const oldTask = await prisma.task.findUnique({ where: { id, userId } });
   const delta = newEffortPoints - oldTask.effortPoints;
   await prisma.$transaction([
     prisma.task.update({ where: { id }, data: { effortPoints: newEffortPoints } }),
     prisma.project.update({ where: { id: projectId }, data: {
       completedEffortPoints: { increment: delta }
     } }),
   ]);
   ```
4. **Add a reconciliation check** that periodically recomputes counters from source data to detect and fix drift.

**Detection:** Complete a task with effort 3. Check the project's total effort. Edit the completed task to effort 5. Check the total again. If it still shows the old total (or shows an incorrect total), the counter update is broken.

**Phase:** Design the effort immutability/snapshot strategy during schema design. This is a data model decision that affects all downstream features.

**Confidence:** HIGH -- this is a fundamental issue with mutable historical data. Any system that tracks "effort over time" must decide whether effort is a point-in-time snapshot or a mutable current value.

---

### Pitfall 9: Auth Token Forwarding Between Personal-Brand and Todoist Services

**What goes wrong:** The personal-brand site authenticates users via Firebase Auth (Google Sign-In) and passes Firebase ID tokens in `Authorization: Bearer <token>` headers to its own API routes. For the tasks app integration, these tokens must also be forwarded to the todoist service's API. If the todoist app does not validate Firebase tokens (it currently has no auth), or if the token is not forwarded correctly (e.g., the tasks API is called from a server component without the original request's auth header), the auth chain breaks.

**Specific integration scenarios:**
- **Embedded iframe:** Tasks app runs in an iframe on the personal-brand site. The iframe is a different origin, so cookies and auth headers do not automatically propagate. The parent must postMessage the token to the iframe, which is complex and fragile.
- **API proxy:** Personal-brand's Next.js API routes proxy requests to the todoist API, forwarding the auth header. This is simpler but adds latency (request goes: client -> personal-brand API -> todoist API -> Postgres).
- **Direct API calls from client:** The client calls the todoist API directly with the Firebase token. This requires the todoist service to import Firebase Admin SDK for token verification, adding a dependency and cold start time.

**Consequences:**
- If token is not forwarded: todoist API has no idea who the user is, cannot scope data by userId
- If token validation is wrong: any string is accepted as a "user," bypassing auth entirely
- If the todoist app validates tokens differently than personal-brand: some tokens work in one but not the other

**Prevention:**
1. **For the integration approach: host tasks as a route within personal-brand** (e.g., `/apps/tasks`), NOT as a separate service. This eliminates cross-origin auth entirely -- the tasks API routes live in the same Next.js app and use the same `verifyUser()` function. The todoist app's Prisma schema and business logic are imported as a package, but there is no separate deployment.
2. **If separate services are required:** Use the API proxy pattern. Personal-brand API routes at `/api/tasks/*` verify the Firebase token with `verifyUser()`, extract `uid` and `email`, then call the todoist API as an internal service with a service-to-service auth header (not the user's Firebase token).
3. **If the todoist app must verify Firebase tokens directly:** Add Firebase Admin SDK as a dependency and use the same `verifyUser()` pattern from `src/lib/auth/user.ts`. Ensure the same Firebase project credentials are used.
4. **Never pass userId as a query parameter or request body from the client.** Always derive it server-side from the verified token.

**Detection:** Call a tasks API endpoint without an auth header. If it returns data instead of 401, auth is missing. Call it with an invalid token. If it returns data, token validation is broken.

**Phase:** Must be decided in the architecture phase. The "host within personal-brand" approach is strongly recommended for this project's scale and eliminates an entire class of auth forwarding bugs.

**Confidence:** HIGH -- verified by analyzing the existing auth pattern in `src/lib/auth/user.ts` and the integration patterns used by envelopes and brand-scraper (both hosted within personal-brand).

---

### Pitfall 10: Billing Gating Does Not Protect Server-Side Mutations

**What goes wrong:** The billing check is implemented only on the client side (disable buttons, show ReadOnlyBanner) but not enforced on the server. A user in readonly mode can still call the API directly (via curl, browser devtools, or a modified client) and create/update/delete tasks because the server does not check billing status before processing mutations.

**Why it happens in practice:** The developer sees the ReadOnlyBanner component, disables the "Add Task" button client-side, and assumes the feature is gated. They forget (or defer) the server-side check. The existing envelopes app does this correctly -- `POST /api/envelopes` checks `checkEnvelopeAccess()` and returns 402 if readonly (line 43-49 of `src/app/api/envelopes/route.ts`). But a new developer might not follow this pattern for the tasks API.

**Specific risk in the existing envelopes code that proves the pattern:**
```typescript
// src/app/api/envelopes/route.ts lines 42-49
const access = await checkEnvelopeAccess(auth.uid, auth.email);
if (access.mode === "readonly") {
  return Response.json(
    { error: "Insufficient credits. Purchase credits to continue editing." },
    { status: 402 },
  );
}
```
This pattern must be replicated in EVERY mutating tasks API route.

**Consequences:**
- Users bypass billing by calling the API directly
- Free-tier abuse: users never pay but create unlimited tasks
- Revenue loss with no detection mechanism
- If discovered, requires adding billing checks to every route retroactively

**Prevention:**
1. **Create a middleware or wrapper function** that enforces billing on all mutating routes:
   ```typescript
   async function requireTasksWriteAccess(uid: string, email: string) {
     const access = await checkTasksAccess(uid, email);
     if (access.mode === "readonly") {
       throw new BillingError("Insufficient credits");
     }
     return access;
   }
   ```
2. **Apply it to ALL POST, PUT, PATCH, DELETE routes** for tasks, projects, and labels.
3. **GET routes should return billing status** (as envelopes does) but should NOT block reads -- users should always be able to view their existing data.
4. **Add integration tests** that verify: (1) authenticated user in readonly mode gets 402 on POST, (2) authenticated user with active billing gets 201 on POST.

**Detection:** Set a user to readonly (exhaust credits, do not pay for the week). Attempt a POST to the tasks API with a valid auth token. If it succeeds (201), server-side gating is missing.

**Phase:** Must be implemented alongside the API routes, not as an afterthought. Copy the exact pattern from the envelopes route.

**Confidence:** HIGH -- verified by reading the existing server-side billing check in `src/app/api/envelopes/route.ts`.

---

## Minor Pitfalls

Mistakes that cause annoyance, confusion, or minor bugs but are easily fixable.

### Pitfall 11: Demo Workspace "Try It" Button Unclear About Data Persistence

**What goes wrong:** A visitor clicks "Try the Demo" and creates several tasks, organizes projects, and assigns effort scores. They then sign up expecting their demo work to be saved. But the demo was client-side only -- all their work is lost on page refresh or sign-up. The user feels tricked and abandons the app.

**Prevention:**
1. **Display a persistent banner** in demo mode: "This is a demo workspace. Your changes are not saved. Sign up to create a real workspace."
2. **On sign-up, offer to seed real workspace with demo-like starter data** (not the user's demo modifications, which are lost, but a similar set of example tasks).
3. **Use a visually distinct style** for demo mode (e.g., watermark, different background color, "DEMO" badge) so the user never forgets they are in a sandbox.
4. **Disable features that imply persistence** in demo mode: no export, no sharing, no "syncing" indicators.

**Detection:** Complete the demo flow as a new visitor. Sign up. Check if any demo data persisted. Check if the UX clearly communicates that demo data is temporary.

**Phase:** Implement as part of the demo workspace UI phase.

**Confidence:** HIGH -- standard UX pattern for demo modes.

---

### Pitfall 12: Effort Score Default Value Causes Silent Data Quality Issues

**What goes wrong:** When effort scoring is added, all existing tasks need a default effort value. If the default is 0, rollups show 0 total effort for projects full of completed tasks -- misleading. If the default is 1 (every task = 1 point), the rollups show artificially inflated effort that the user never assigned. If the field is nullable, every rollup query must handle NULL, and the UI must decide whether to show "unscored" or treat it as 0.

**Prevention:**
1. **Default to `null` (unscored)** and display unscored tasks distinctly in the UI (e.g., "?" icon instead of a number).
2. **Exclude unscored tasks from effort rollups** -- only aggregate tasks where `effortPoints IS NOT NULL`.
3. **Add a migration step** that does NOT backfill effort scores. Instead, show a prompt: "You have 47 unscored tasks. Would you like to assign effort scores?"
4. **For new tasks:** Default to `null` in the database but require effort selection in the UI (or make it easy to skip). Do not silently assign a number.

**Detection:** Add effort scoring to a database with existing tasks. Check the rollup totals. If they show 0 or an arbitrary number for tasks that were never scored, the default value is misleading.

**Phase:** Schema design phase -- the default value choice cascades through all rollup logic.

**Confidence:** HIGH -- data default values are a common schema design decision with well-understood tradeoffs.

---

### Pitfall 13: Tooltip Content Overflows on Small Screens

**What goes wrong:** Help tip tooltips are designed for desktop widths. On mobile (320-375px screens), the tooltip extends beyond the viewport, gets clipped by `overflow: hidden` on a parent, or overlaps other interactive elements making them untappable.

**Prevention:**
1. **Use a positioning library** (e.g., Floating UI / Popper.js) that automatically flips and shifts tooltips to stay within the viewport.
2. **Set a max-width** on tooltips (e.g., `max-width: min(280px, 90vw)`).
3. **On mobile: convert tooltips to bottom sheets or inline expandable text** instead of floating overlays.
4. **Test on 320px viewport width** (smallest common mobile width).

**Detection:** Open the app on a 320px-wide viewport. Trigger a tooltip near the edge of the screen. If it overflows or is clipped, positioning is broken.

**Phase:** Part of the HelpTip component implementation.

**Confidence:** HIGH -- tooltip overflow on mobile is one of the most common responsive design issues.

---

### Pitfall 14: Weekly Gating Idempotency Key Reuse Across Apps

**What goes wrong:** The envelopes app uses `envelope_week_${currentWeekStart}` as the idempotency key for weekly billing (line 112 of `src/lib/envelopes/billing.ts`). If the tasks app uses a similar pattern like `tasks_week_${currentWeekStart}`, the idempotency keys are distinct and this works fine. But if someone copies the envelopes billing code and forgets to change the prefix, the tasks app's weekly charge collides with the envelopes app's charge -- one of them silently returns the cached result of the other, and the user is only charged once for two apps.

**Prevention:**
1. **Use a unique, app-specific prefix** for idempotency keys: `tasks_week_${currentWeekStart}` (not `envelope_week_...`).
2. **Create a constant** for the tool key and idempotency prefix near each other so the relationship is obvious:
   ```typescript
   const TASKS_TOOL_KEY = "tasks_app";
   const TASKS_IDEM_PREFIX = "tasks_week_";
   ```
3. **Add a unique `toolKey` to `billing_tool_pricing`** for the tasks app (e.g., `tasks_app`), separate from `dave_ramsey` (envelopes).
4. **Verify with a test:** Trigger billing for both envelopes and tasks in the same week. Confirm two separate debit ledger entries exist (one per tool).

**Detection:** Use both the envelopes and tasks apps in the same week. Check the billing ledger for two separate debit entries. If only one appears, the idempotency keys collided.

**Phase:** During billing integration setup -- when creating the tool pricing record and writing the billing access check function.

**Confidence:** HIGH -- verified by reading the idempotency key format in `src/lib/envelopes/billing.ts` line 112.

---

### Pitfall 15: Prisma Client Connection Exhaustion on Serverless

**What goes wrong:** Each Next.js API route invocation on Cloud Run (or any serverless platform) may create a new Prisma Client instance, each opening its own database connection pool. Under load, this exhausts PostgreSQL's `max_connections` limit. The app works fine in development (one process) but crashes in production with "too many connections" errors.

**Prevention:**
1. **Use the singleton Prisma Client pattern:**
   ```typescript
   // src/lib/prisma.ts
   import { PrismaClient } from '@prisma/client';

   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
   export const prisma = globalForPrisma.prisma ?? new PrismaClient();
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
   ```
2. **Configure connection pool size** in the Prisma connection string: `?connection_limit=5` (appropriate for serverless).
3. **Use Prisma Accelerate or PgBouncer** for connection pooling in production if connection exhaustion occurs.
4. **Monitor active connections** with `SELECT count(*) FROM pg_stat_activity;`.

**Detection:** Under load testing, check for "too many clients already" or "connection refused" PostgreSQL errors. Monitor `pg_stat_activity` connection count.

**Phase:** Must be set up when first integrating Prisma into the personal-brand project. The singleton pattern is a one-time setup.

**Confidence:** HIGH -- this is the [most common Prisma serverless pitfall](https://www.prisma.io/docs/guides/multiple-databases), documented extensively in Prisma's deployment guides.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| Multi-user schema migration | Pitfall 1 (no userId backfill) | Use `--create-only`, hand-edit migration SQL | CRITICAL |
| Multi-user query audit | Pitfall 3 (missing userId filter) | Prisma extension or middleware to enforce userId | CRITICAL |
| Billing integration design | Pitfall 2 (cross-DB transaction) | Use weekly gating (charge once), not per-operation billing | CRITICAL |
| Billing server enforcement | Pitfall 10 (client-only gating) | Copy envelopes route pattern, check on ALL mutations | CRITICAL |
| Free week timing | Pitfall 4 (UTC week boundary) | Document UTC behavior, consider generous 7-day trial | MODERATE |
| Demo workspace architecture | Pitfall 5 (data contamination) | Client-side only demo, no server writes | CRITICAL |
| Demo UX communication | Pitfall 11 (unclear persistence) | Persistent "DEMO" banner, clear sign-up messaging | MINOR |
| Effort scoring schema | Pitfall 12 (default value) | Use NULL default, exclude unscored from rollups | MINOR |
| Effort scoring performance | Pitfall 6 (expensive rollups) | Denormalized counters or indexed aggregates | MODERATE |
| Effort history accuracy | Pitfall 8 (mutable completed effort) | Lock effort on completion or snapshot at completion time | MODERATE |
| Help tip component | Pitfall 7 (accessibility failures) | Build accessible HelpTip component with ARIA, keyboard, focus | MODERATE |
| Help tip responsive | Pitfall 13 (tooltip overflow) | Use Floating UI for positioning, max-width constraint | MINOR |
| Auth integration | Pitfall 9 (token forwarding) | Host tasks within personal-brand, not as separate service | MODERATE |
| Billing tool setup | Pitfall 14 (idempotency key collision) | Unique tool key and idempotency prefix per app | MINOR |
| Prisma integration | Pitfall 15 (connection exhaustion) | Singleton Prisma Client, connection pool limit | MODERATE |

---

## Sources

- **Codebase analysis (HIGH confidence):**
  - `src/lib/envelopes/billing.ts` -- Weekly gating pattern with free week, paid weeks, idempotency keys
  - `src/lib/envelopes/week-math.ts` -- UTC-based week boundary computation
  - `src/lib/envelopes/types.ts` -- EnvelopeBilling type with `firstAccessWeekStart`, `paidWeeks`
  - `src/lib/billing/firestore.ts` -- Debit, refund, idempotency, Firestore transactions
  - `src/lib/billing/tools.ts` -- Tool pricing seed data with envelopes at 100 credits/week
  - `src/lib/auth/user.ts` -- `verifyUser()` Firebase ID token verification
  - `src/app/api/envelopes/route.ts` -- Server-side billing check pattern (readwrite/readonly)
  - `src/components/envelopes/ReadOnlyBanner.tsx` -- Client-side readonly UX pattern
  - `src/components/envelopes/EnvelopesHomePage.tsx` -- `isReadOnly` state derived from API response
  - `src/components/auth/AuthGuard.tsx` -- Client-side auth guard with Google Sign-In

- **Web research (MEDIUM-HIGH confidence):**
  - [Prisma migration customization docs](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations) -- custom migration SQL for adding required columns
  - [Prisma multi-schema support](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema) -- schema isolation for demo data
  - [MDN ARIA tooltip role reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role) -- complete ARIA tooltip requirements
  - [Inclusive Components: Tooltips & Toggletips](https://inclusive-components.design/tooltips-toggletips/) -- accessible tooltip patterns
  - [Lago blog: The Time Zone Challenge in Billing](https://www.getlago.com/blog/time-zone-nightmares) -- timezone edge cases in weekly billing
  - [Firestore transaction documentation](https://firebase.google.com/docs/firestore/manage-data/transactions) -- transaction limitations and contention
  - [Denormalization in PostgreSQL](https://rafaelrampineli.medium.com/denormalization-a-solution-for-performance-or-a-long-term-trap-6b9af5b5b831) -- tradeoffs of denormalized aggregation
  - [PostgreSQL RLS with Prisma](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35) -- row-level security implementation
  - [SaaS Sandbox Environments](https://www.reprise.com/resources/blog/what-is-sandbox-environment) -- demo data isolation best practices
